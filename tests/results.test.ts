import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examQuestions, questions, users } from "@/db/schema";
import { generateExams, seedQuestions } from "@/db/seed";
import { AttemptNotFound, AttemptNotSubmitted, getResult, listAttempts, saveAnswer, startAttempt, submitAttempt, setMark } from "@/lib/attempts";
import { NoAccess } from "@/lib/users";
import { closeDb, grantPmp, resetDb } from "./db";

let alice: number;
let bob: number;
let ks: { id: number; correct: string }[]; // Exam 1 in position order

before(async () => {
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await generateExams();
  [{ insertId: alice }] = await db.insert(users).values({ email: "alice@x.test", passwordHash: "-" });
  [{ insertId: bob }] = await db.insert(users).values({ email: "bob@x.test", passwordHash: "-" });
  await grantPmp(alice, bob);
  ks = await db
    .select({ id: questions.id, correct: questions.correctAnswer })
    .from(examQuestions)
    .innerJoin(questions, eq(questions.id, examQuestions.questionId))
    .where(eq(examQuestions.examId, 1))
    .orderBy(asc(examQuestions.position));
});
after(closeDb);

const wrong = (correct: string) => ["A", "B", "C", "D"].find((l) => !correct.includes(l))!;

test("getResult shows per Question: selected, Correct/Suggested Answer, per-Choice vote %, right or wrong", async () => {
  const m = ks.find((k) => k.correct.length === 2)!;
  const s1 = ks.find((k) => k.correct.length === 1)!;
  const s2 = ks.filter((k) => k.correct.length === 1)[1];
  // Votes are per combination: AC=6, A=2, B=2 of 10 => A 80%, B 20%, C 60%, D/E 0%
  await db
    .update(questions)
    .set({ votes: [{ letters: "AC", count: 6, mostVoted: true }, { letters: "A", count: 2, mostVoted: false }, { letters: "B", count: 2, mostVoted: false }] })
    .where(eq(questions.id, m.id));
  const id = await startAttempt(alice, 1);
  await saveAnswer(alice, id, m.id, m.correct.split(""));
  await saveAnswer(alice, id, s1.id, [wrong(s1.correct)]);
  await submitAttempt(alice, id);

  const r = await getResult(alice, id);
  assert.equal(r.total, 180);
  assert.equal(r.score, 1);
  assert.deepEqual(r.questions.map((q) => q.id), ks.map((k) => k.id));
  const rm = r.questions.find((q) => q.id === m.id)!;
  assert.equal(rm.correct, m.correct);
  assert.equal(rm.isCorrect, true);
  assert.deepEqual(Object.fromEntries(rm.choices.map((c) => [c.letter, c.percent])), { A: 80, B: 20, C: 60, D: 0, E: 0 });
  const r1 = r.questions.find((q) => q.id === s1.id)!;
  assert.equal(r1.isCorrect, false);
  assert.deepEqual(r1.selected, [wrong(s1.correct)]);
  assert.equal(typeof r1.suggested, "string");
  const blank = r.questions.find((q) => q.id === s2.id)!;
  assert.deepEqual(blank.selected, []);
  assert.equal(blank.isCorrect, false);
});

test("getResult filters: 'wrong' keeps only wrong/blank Questions; 'marked' keeps only Marked Questions", async () => {
  const id = await startAttempt(alice, 1);
  await saveAnswer(alice, id, ks[0].id, ks[0].correct.split(""));
  await setMark(alice, id, ks[5].id, true);
  await setMark(alice, id, ks[0].id, true);
  await submitAttempt(alice, id);
  const wrongOnly = await getResult(alice, id, "wrong");
  assert.equal(wrongOnly.questions.length, 179);
  assert.ok(wrongOnly.questions.every((q) => !q.isCorrect && q.id !== ks[0].id));
  const marked = await getResult(alice, id, "marked");
  assert.deepEqual(marked.questions.map((q) => q.id), [ks[0].id, ks[5].id]);
  assert.equal(marked.questions[0].marked, true);
});

test("getResult rejects an in-progress Attempt and another User's Attempt", async () => {
  const open = await startAttempt(alice, 1);
  await assert.rejects(getResult(alice, open), AttemptNotSubmitted);
  await submitAttempt(alice, open);
  await assert.rejects(getResult(bob, open), AttemptNotFound);
  await assert.rejects(getResult(alice, 999999), AttemptNotFound);
});

test("listAttempts returns only the User's submitted Attempts, newest first, with duration and total", async () => {
  const t0 = new Date("2026-03-01T10:00:00Z");
  const a = await startAttempt(bob, 2, false, t0);
  await submitAttempt(bob, a);
  const b = await startAttempt(bob, 2, false, new Date(Date.now() + 3_600_000)); // started later
  await submitAttempt(bob, b);
  await startAttempt(bob, 3); // in progress: not listed
  const list = await listAttempts(bob, "PMP");
  assert.deepEqual(list.map((x) => x.id), [b, a]);
  assert.equal(list[1].title, "Đề 2");
  assert.equal(list[1].total, 180);
  assert.equal(list[1].score, 0);
  assert.ok(list[1].durationSec > 0);
  assert.ok(list.every((x) => x.id !== alice));
  const others = await listAttempts(alice, "PMP");
  assert.ok(others.every((x) => x.id !== a && x.id !== b));
  await assert.rejects(listAttempts(999999, "PMP"), NoAccess);
});

test("getResult gives the score per Domain for an Exam: correct / its Questions in that Exam", async () => {
  const [a, b, c] = ks;
  await db.update(questions).set({ task: "people-1" }).where(eq(questions.id, a.id));
  await db.update(questions).set({ task: "people-2" }).where(eq(questions.id, b.id));
  await db.update(questions).set({ task: "process-3" }).where(eq(questions.id, c.id));
  const id = await startAttempt(bob, 1);
  await saveAnswer(bob, id, a.id, a.correct.split(""));
  await saveAnswer(bob, id, c.id, c.correct.split(""));
  await submitAttempt(bob, id);
  const r = await getResult(bob, id);
  assert.deepEqual(r.domains, [
    { domain: "People", correct: 1, total: 2 },
    { domain: "Process", correct: 1, total: 1 },
  ]);
});
