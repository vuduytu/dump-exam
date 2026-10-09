import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { questions, users } from "@/db/schema";
import { generateExams, seedQuestions, seedTags } from "@/db/seed";
import { AttemptInProgress, AttemptNotFound, getAttempt, getResult, listAttempts, saveAnswer, setMark, startAttempt, submitAttempt } from "@/lib/attempts";
import { DrillEmpty, InvalidDrill, openDrills, startDrill, topicStats } from "@/lib/drills";
import { getScoreboard } from "@/lib/scoreboard";
import type { Tag } from "@/lib/question-tags";
import { closeDb, grantPmp, resetDb } from "./db";

const tags: Tag[] = JSON.parse(readFileSync("data/question-tags.json", "utf8"));
let alice: number;
let bob: number;
let admin: number;

before(async () => {
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await seedTags(tags);
  await generateExams();
  [{ insertId: alice }] = await db.insert(users).values({ email: "alice@x.test", passwordHash: "-" });
  [{ insertId: bob }] = await db.insert(users).values({ email: "bob@x.test", passwordHash: "-" });
  await grantPmp(alice, bob);
  [{ insertId: admin }] = await db.insert(users).values({ email: "admin@x.test", passwordHash: "-", isAdmin: true });
});
after(closeDb);

const usableOf = async (task: string) =>
  db.select({ id: questions.id, correct: questions.correctAnswer }).from(questions).where(and(eq(questions.task, task), eq(questions.usable, true)));
const wrongLetter = (correct: string) => ["A", "B", "C", "D"].find((l) => !correct.includes(l))!;

test("seeding tags twice keeps 1,250 Questions, every one tagged, and applies a corrected label", async () => {
  await seedTags(tags.map((t) => (t.id === 1 ? { ...t, task: "people-2", approach: "predictive" } : t)));
  await seedTags(tags.map((t) => (t.id === 1 ? { ...t, task: "people-2", approach: "predictive" } : t)));
  const [{ n }] = await db.select({ n: count() }).from(questions);
  const [{ untagged }] = await db.select({ untagged: count() }).from(questions).where(isNull(questions.task));
  assert.deepEqual({ n, untagged }, { n: 1250, untagged: 0 });
  const [q1] = await db.select().from(questions).where(eq(questions.id, 1));
  assert.deepEqual([q1.task, q1.approach], ["people-2", "predictive"]);
  await seedTags(tags);
  await assert.rejects(seedTags(tags.slice(1)), /missing id/);
});

test("a Drill picks never-answered Questions first, then wrong on the latest try, then the rest", async () => {
  const pool = await usableOf("people-1"); // 10 usable
  assert.equal(pool.length, 10);
  // Bob answers 8 of them in a Drill of 20 (= all 10): 4 right, 4 wrong, 2 left unanswered
  const first = await startDrill(bob, "PMP", "people-1", 20);
  const drawn = (await getAttempt(bob, first)).questions;
  assert.equal(drawn.length, 10);
  const byId = new Map(pool.map((q) => [q.id, q.correct]));
  const right = drawn.slice(0, 4).map((q) => q.id);
  const wrong = drawn.slice(4, 8).map((q) => q.id);
  const unseen = drawn.slice(8).map((q) => q.id);
  for (const id of right) await saveAnswer(bob, first, id, byId.get(id)!.split(""));
  for (const id of wrong) await saveAnswer(bob, first, id, [wrongLetter(byId.get(id)!)]);
  await submitAttempt(bob, first);
  // later Bob gets wrong[0] right in an Exam-free second Drill: it no longer counts as wrong
  const second = await startDrill(bob, "PMP", "people-1", 20);
  await saveAnswer(bob, second, wrong[0], byId.get(wrong[0])!.split(""));
  await submitAttempt(bob, second);

  const id = await startDrill(bob, "PMP", "People", 10);
  const ids = (await getAttempt(bob, id)).questions.map((q) => q.id);
  assert.equal(ids.length, 10);
  assert.ok(ids.every((q) => !right.includes(q) && !wrong.includes(q))); // People has 500+ never-answered Questions

  const again = (await getAttempt(bob, await startDrill(bob, "PMP", "people-1", 10))).questions.map((q) => q.id);
  assert.deepEqual(new Set(again.slice(0, 2)), new Set(unseen));
  assert.deepEqual(new Set(again.slice(2, 5)), new Set(wrong.slice(1)));
  assert.deepEqual(new Set(again.slice(5)), new Set([...right, wrong[0]]));
});

test("a Drill never holds an Unusable Question, takes all when the source is short, and fails clearly when empty", async () => {
  const pool = await usableOf("business-1");
  await db.update(questions).set({ usable: false }).where(inArray(questions.id, pool.slice(3).map((q) => q.id)));
  const short = await getAttempt(alice, await startDrill(alice, "PMP", "business-1", 10));
  assert.deepEqual(new Set(short.questions.map((q) => q.id)), new Set(pool.slice(0, 3).map((q) => q.id)));

  await db.update(questions).set({ usable: false }).where(inArray(questions.id, pool.map((q) => q.id)));
  await assert.rejects(startDrill(alice, "PMP", "business-1", 10), DrillEmpty);
  await db.update(questions).set({ usable: true }).where(inArray(questions.id, pool.map((q) => q.id)));

  const domain = await getAttempt(alice, await startDrill(alice, "PMP", "Business Environment", 20));
  const unusable = await db.select({ id: questions.id }).from(questions).where(eq(questions.usable, false));
  assert.ok(domain.questions.every((q) => !unusable.some((u) => u.id === q.id)));
  const all = await getAttempt(alice, await startDrill(alice, "PMP", "people-3", "all"));
  assert.equal(all.questions.length, (await usableOf("people-3")).length);
  await assert.rejects(startDrill(alice, "PMP", "people-1", 15), InvalidDrill);
  await assert.rejects(startDrill(alice, "PMP", "nope", 10), InvalidDrill);
});

test("one open Drill per source; an open Exam Attempt does not block a Drill", async () => {
  const exam = await startAttempt(alice, 1);
  const open = await startDrill(alice, "PMP", "process-2", 10);
  await assert.rejects(startDrill(alice, "PMP", "process-2", 20), (err) => err instanceof AttemptInProgress && err.attemptId === open);
  await startDrill(alice, "PMP", "process-3", 10);
  await submitAttempt(alice, exam);
});

test("another User cannot read, answer, mark or submit a Drill", async () => {
  const id = await startDrill(alice, "PMP", "process-4", 10);
  const q = (await getAttempt(alice, id)).questions[0];
  await assert.rejects(getAttempt(bob, id), AttemptNotFound);
  await assert.rejects(saveAnswer(bob, id, q.id, ["A"]), AttemptNotFound);
  await assert.rejects(setMark(bob, id, q.id, true), AttemptNotFound);
  await assert.rejects(submitAttempt(bob, id), AttemptNotFound);
  await submitAttempt(alice, id);
  await assert.rejects(getResult(bob, id), AttemptNotFound);
});

test("a Drill is untimed, scores like an Exam, shows its title in Result and History, and stays off the Scoreboard", async () => {
  const id = await startDrill(alice, "PMP", "people-2", 10);
  const attempt = await getAttempt(alice, id);
  assert.equal(attempt.title, "Ôn: People · Manage conflicts");
  assert.equal(attempt.timed, false);
  assert.equal(attempt.deadline, null);
  const pool = new Map((await usableOf("people-2")).map((q) => [q.id, q.correct]));
  const [a, b, c] = attempt.questions;
  await saveAnswer(alice, id, a.id, pool.get(a.id)!.split(""));
  await saveAnswer(alice, id, b.id, pool.get(b.id)!.split(""));
  await saveAnswer(alice, id, c.id, [wrongLetter(pool.get(c.id)!)]);
  const outside = (await usableOf("people-3"))[0];
  await assert.rejects(saveAnswer(alice, id, outside.id, ["A"]), /Đáp án không hợp lệ/);
  assert.equal(await submitAttempt(alice, id), 2);

  const r = await getResult(alice, id);
  assert.deepEqual([r.title, r.score, r.total, r.questions.length], ["Ôn: People · Manage conflicts", 2, 10, 10]);
  const row = (await listAttempts(alice, "PMP")).find((x) => x.id === id)!;
  assert.deepEqual([row.title, row.score, row.total, row.examId], ["Ôn: People · Manage conflicts", 2, 10, null]);
  const exam = (await listAttempts(alice, "PMP")).find((x) => x.examId === 1)!;
  assert.deepEqual([exam.title, exam.total], ["Đề 1", 180]);

  const board = await getScoreboard(admin, "PMP");
  assert.ok(board.cells.every((cell) => cell.examId !== null));
  assert.ok(board.cells.some((cell) => cell.userId === alice && cell.examId === 1));
});

test("topicStats counts only this User's submitted Attempts, uses the latest answer, and sorts weakest first", async () => {
  const [{ insertId: carol }] = await db.insert(users).values({ email: "carol@x.test", passwordHash: "-" });
  await grantPmp(carol);
  const task = (stats: Awaited<ReturnType<typeof topicStats>>, code: string) => stats.flatMap((d) => d.tasks).find((t) => t.source === code)!;
  const pool = await usableOf("people-1");
  const correct = new Map(pool.map((q) => [q.id, q.correct]));
  const empty = await topicStats(carol, "PMP"); // Bob and Alice have answered plenty already
  assert.deepEqual([task(empty, "people-1").total, task(empty, "people-1").done], [pool.length, 0]);

  const first = await startDrill(carol, "PMP", "people-1", 20);
  const [a, b, c] = (await getAttempt(carol, first)).questions.map((q) => q.id);
  await saveAnswer(carol, first, a, correct.get(a)!.split(""));
  await saveAnswer(carol, first, b, [wrongLetter(correct.get(b)!)]);
  assert.deepEqual(await topicStats(carol, "PMP"), empty); // not submitted yet: does not count
  assert.deepEqual((await openDrills(carol, "PMP")).get("people-1"), { id: first, total: 10, answered: 2 });
  await submitAttempt(carol, first);
  assert.equal((await openDrills(carol, "PMP")).size, 0);
  let t = task(await topicStats(carol, "PMP"), "people-1");
  assert.deepEqual([t.done, t.correct], [2, 1]);

  // a later Drill answers b right and a wrong, and c right: the latest answer decides, c is new
  const second = await startDrill(carol, "PMP", "people-1", 20);
  await saveAnswer(carol, second, b, correct.get(b)!.split(""));
  await saveAnswer(carol, second, a, [wrongLetter(correct.get(a)!)]);
  await saveAnswer(carol, second, c, correct.get(c)!.split(""));
  await submitAttempt(carol, second);
  const stats = await topicStats(carol, "PMP");
  t = task(stats, "people-1");
  assert.deepEqual([t.done, t.correct], [3, 2]);
  const people = stats.find((d) => d.domain === "People")!;
  assert.deepEqual([people.done, people.correct], [3, 2]);
  assert.equal(people.total, people.tasks.reduce((n, x) => n + x.total, 0));
  assert.equal(people.tasks[0].source, "people-1"); // the only Task with an answer: 2/3 sorts before untouched ones
  const last = people.tasks.at(-1)!;
  assert.equal(last.done, 0);
});
