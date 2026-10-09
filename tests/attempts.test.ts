import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts, examQuestions, questions, users } from "@/db/schema";
import { generateExams, seedQuestions } from "@/db/seed";
import { abandonAttempt, AttemptExpired, AttemptInProgress, AttemptNotFound, AttemptSubmitted, findOpenAttempt, getAttempt, openAttemptSummary, listAttempts, InvalidAnswer, saveAnswer, startAttempt, submitAttempt, toggleMark } from "@/lib/attempts";
import { closeDb, resetDb } from "./db";

const EXAM = 1;
let alice: number;
let bob: number;
// Exam 1's Questions in position order, with Correct Answers: fixture knowledge for building answers
let correctAnswers: { id: number; correct: string }[];

before(async () => {
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await generateExams();
  [{ insertId: alice }] = await db.insert(users).values({ email: "alice@x.test", passwordHash: "-" });
  [{ insertId: bob }] = await db.insert(users).values({ email: "bob@x.test", passwordHash: "-" });
  correctAnswers = await db
    .select({ id: questions.id, correct: questions.correctAnswer })
    .from(examQuestions)
    .innerJoin(questions, eq(questions.id, examQuestions.questionId))
    .where(eq(examQuestions.examId, EXAM))
    .orderBy(asc(examQuestions.position));
});
after(closeDb);

/** Starts an Attempt, first dropping any open one: most tests just want a clean in-progress Attempt. */
async function fresh(userId: number, examId: number, now?: Date, timed = false) {
  const open = await findOpenAttempt(userId, examId);
  if (open) await abandonAttempt(userId, open);
  return startAttempt(userId, examId, timed, now);
}

test("a new Attempt shows the Exam's 180 Questions in order, Choices in original order, nothing selected", async () => {
  const id = await fresh(alice, EXAM);
  const attempt = await getAttempt(alice, id);
  assert.equal(attempt.submittedAt, null);
  assert.equal(attempt.score, null);
  assert.deepEqual(attempt.questions.map((q) => q.id), correctAnswers.map((k) => k.id));
  for (const q of attempt.questions) {
    assert.deepEqual(q.selected, []);
    assert.deepEqual(q.choices.map((c) => c.letter), ["A", "B", "C", "D", "E"].slice(0, q.choices.length));
    assert.equal(q.need, correctAnswers.find((k) => k.id === q.id)!.correct.length);
    assert.equal("correctAnswer" in q, false); // never sent to the page before submit
  }
});

const multi = () => correctAnswers.find((k) => k.correct.length === 2)!; // every multi-answer Question has 5 Choices
const single = () => correctAnswers.find((k) => k.correct.length === 1)!;
const selectedOf = async (attemptId: number, questionId: number) =>
  (await getAttempt(alice, attemptId)).questions.find((q) => q.id === questionId)!.selected;

test("a saved answer is there when the Attempt is opened again, and the last save wins", async () => {
  const id = await fresh(alice, EXAM);
  const q = multi();
  await saveAnswer(alice, id, q.id, ["C", "A"]);
  assert.deepEqual(await selectedOf(id, q.id), ["A", "C"]);
  await saveAnswer(alice, id, q.id, ["B"]);
  assert.deepEqual(await selectedOf(id, q.id), ["B"]);
  await saveAnswer(alice, id, q.id, []);
  assert.deepEqual(await selectedOf(id, q.id), []);
});

test("saveAnswer rejects unknown letters, duplicates, more than N letters, and a Question outside the Exam", async () => {
  const id = await fresh(alice, EXAM);
  const s = single();
  const m = multi();
  await assert.rejects(saveAnswer(alice, id, s.id, ["A", "B"]), InvalidAnswer);
  await assert.rejects(saveAnswer(alice, id, s.id, ["Z"]), InvalidAnswer);
  await assert.rejects(saveAnswer(alice, id, m.id, ["A", "A"]), InvalidAnswer);
  await assert.rejects(saveAnswer(alice, id, m.id, ["A", "B", "C"]), InvalidAnswer);
  const [outside] = await db.select({ id: examQuestions.questionId }).from(examQuestions).where(eq(examQuestions.examId, 2)).limit(1);
  await assert.rejects(saveAnswer(alice, id, outside.id, ["A"]), InvalidAnswer); // Exams 1 and 2 share no Question
  assert.deepEqual(await selectedOf(id, s.id), []);
});

const wrongLetter = (correct: string) => ["A", "B", "C", "D"].find((l) => !correct.includes(l))!;

test("Score counts a Question right only when the selected letters equal the Correct Answer; blank is wrong", async () => {
  const id = await fresh(alice, EXAM);
  const singles = correctAnswers.filter((k) => k.correct.length === 1);
  const multis = correctAnswers.filter((k) => k.correct.length > 1);
  assert.ok(multis.length >= 3, "fixture: Exam 1 needs 3 multi-answer Questions");
  await saveAnswer(alice, id, singles[0].id, [singles[0].correct]); // right
  await saveAnswer(alice, id, singles[1].id, [wrongLetter(singles[1].correct)]); // wrong
  await saveAnswer(alice, id, multis[0].id, multis[0].correct.split("").reverse()); // all, any order: right
  await saveAnswer(alice, id, multis[1].id, [multis[1].correct[0]]); // missing one: wrong
  await saveAnswer(alice, id, multis[2].id, [multis[2].correct[0], wrongLetter(multis[2].correct)]); // one wrong instead: wrong
  await saveAnswer(alice, id, singles[2].id, []); // cleared = blank: wrong; the other 173 are blank too

  assert.equal(await submitAttempt(alice, id), 2);
  const attempt = await getAttempt(alice, id);
  assert.equal(attempt.score, 2);
  assert.ok(attempt.submittedAt instanceof Date);
});

test("a submitted Attempt cannot be changed: saveAnswer and a second submit are rejected", async () => {
  const id = await fresh(alice, EXAM);
  const q = single();
  await saveAnswer(alice, id, q.id, [q.correct]);
  await submitAttempt(alice, id);
  await assert.rejects(saveAnswer(alice, id, q.id, [wrongLetter(q.correct)]), AttemptSubmitted);
  await assert.rejects(submitAttempt(alice, id), AttemptSubmitted);
  assert.deepEqual(await selectedOf(id, q.id), [q.correct]);
  assert.equal((await getAttempt(alice, id)).score, 1);
});

test("another User cannot read, answer or submit the Attempt", async () => {
  const id = await fresh(alice, EXAM);
  const q = single();
  await assert.rejects(getAttempt(bob, id), AttemptNotFound);
  await assert.rejects(saveAnswer(bob, id, q.id, [q.correct]), AttemptNotFound);
  await assert.rejects(submitAttempt(bob, id), AttemptNotFound);
  const attempt = await getAttempt(alice, id);
  assert.equal(attempt.submittedAt, null);
  assert.deepEqual(attempt.questions.find((x) => x.id === q.id)!.selected, []);
});

test("startedAt round-trips as the exact instant passed in, whatever the DB time zone", async () => {
  const now = new Date("2026-01-02T03:04:05Z");
  const id = await fresh(alice, EXAM, now);
  const [row] = await db.select({ startedAt: attempts.startedAt }).from(attempts).where(eq(attempts.id, id));
  assert.equal(row.startedAt.toISOString(), now.toISOString());
});

const markedOf = async (attemptId: number) => (await getAttempt(alice, attemptId)).questions.filter((q) => q.marked).map((q) => q.id);

test("toggleMark marks then unmarks a Question, kept across reloads and independent of the answer", async () => {
  const id = await fresh(alice, EXAM);
  const q = single();
  assert.equal(await toggleMark(alice, id, q.id), true);
  assert.deepEqual(await markedOf(id), [q.id]);
  assert.deepEqual(await selectedOf(id, q.id), []); // marked but unanswered
  await saveAnswer(alice, id, q.id, ["A"]);
  assert.deepEqual(await markedOf(id), [q.id]); // answering keeps the mark
  await saveAnswer(alice, id, q.id, []);
  assert.deepEqual(await markedOf(id), [q.id]); // clearing keeps the mark
  assert.equal(await toggleMark(alice, id, q.id), false);
  assert.deepEqual(await markedOf(id), []);
  assert.deepEqual(await selectedOf(id, q.id), []);
});

test("toggleMark is rejected after submit, for another User, and for a Question outside the Exam", async () => {
  const id = await fresh(alice, EXAM);
  await assert.rejects(toggleMark(bob, id, single().id), AttemptNotFound);
  await assert.rejects(toggleMark(alice, id, 999999), InvalidAnswer);
  await submitAttempt(alice, id);
  await assert.rejects(toggleMark(alice, id, single().id), AttemptSubmitted);
});

test("marking does not change the Score", async () => {
  const id = await fresh(alice, EXAM);
  const [a, b] = correctAnswers;
  await saveAnswer(alice, id, a.id, a.correct.split(""));
  await toggleMark(alice, id, a.id);
  await toggleMark(alice, id, b.id); // marked, never answered
  assert.equal(await submitAttempt(alice, id), 1);
});

test("one in-progress Attempt per (User, Exam): a second start is refused, even concurrently; other Exams and Users are free", async () => {
  const results = await Promise.allSettled([startAttempt(bob, 2), startAttempt(bob, 2), startAttempt(bob, 2)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  for (const r of results) if (r.status === "rejected") assert.ok(r.reason instanceof AttemptInProgress);
  await startAttempt(bob, 3);
  await startAttempt(alice, 2);
});

test("abandonAttempt removes the Attempt and its answers, it is not in history, and the Exam can be started again", async () => {
  const id = await fresh(bob, EXAM);
  await saveAnswer(bob, id, single().id, ["A"]);
  await toggleMark(bob, id, single().id);
  assert.equal(await findOpenAttempt(bob, EXAM), id);
  await assert.rejects(startAttempt(bob, EXAM), AttemptInProgress);
  await abandonAttempt(bob, id);
  assert.equal(await findOpenAttempt(bob, EXAM), null);
  await assert.rejects(getAttempt(bob, id), AttemptNotFound);
  assert.equal((await listAttempts(bob)).some((a) => a.id === id), false);
  assert.ok(await startAttempt(bob, EXAM));
});

test("abandonAttempt refuses another User's Attempt and a submitted one", async () => {
  const id = await startAttempt(alice, 5);
  await assert.rejects(abandonAttempt(bob, id), AttemptNotFound);
  await getAttempt(alice, id); // still there
  await submitAttempt(alice, id);
  await assert.rejects(abandonAttempt(alice, id), AttemptSubmitted);
  assert.equal((await listAttempts(alice)).some((a) => a.id === id), true);
  assert.ok(await startAttempt(alice, 5)); // submitted does not block a new Attempt
});

test("findOpenAttempt picks the newest when old data has several in-progress Attempts", async () => {
  await db.insert(attempts).values({ userId: alice, examId: 6, startedAt: new Date() });
  const [{ insertId }] = await db.insert(attempts).values({ userId: alice, examId: 6, startedAt: new Date() });
  assert.equal(await findOpenAttempt(alice, 6), insertId);
  await assert.rejects(startAttempt(alice, 6), AttemptInProgress);
});

const MIN = 60_000;
const DEADLINE_MS = 230 * MIN;

test("Timed Attempt: saves before the deadline are kept, saveAnswer and toggleMark from the deadline on are rejected", async () => {
  const t0 = new Date(Math.floor(Date.now() / 1000) * 1000); // whole seconds: the column has no fraction
  const id = await fresh(alice, EXAM, t0, true);
  const [a, b] = correctAnswers;
  await saveAnswer(alice, id, a.id, a.correct.split(""), new Date(t0.getTime() + DEADLINE_MS - 1));
  await toggleMark(alice, id, a.id, new Date(t0.getTime() + DEADLINE_MS - 1));
  const late = new Date(t0.getTime() + DEADLINE_MS);
  await assert.rejects(saveAnswer(alice, id, b.id, b.correct.split(""), late), AttemptExpired);
  await assert.rejects(toggleMark(alice, id, b.id, late), AttemptExpired);
  const attempt = await getAttempt(alice, id, new Date(t0.getTime() + DEADLINE_MS - 1));
  assert.equal(attempt.deadline?.toISOString(), late.toISOString());
  assert.equal(attempt.submittedAt, null);
  assert.deepEqual(attempt.questions.filter((q) => q.marked || q.selected.length).map((q) => q.id), [a.id]);
});

test("getAttempt after the deadline submits the Timed Attempt at the deadline, scoring only answers saved before it, once even concurrently", async () => {
  const t0 = new Date(Math.floor(Date.now() / 1000) * 1000);
  const id = await fresh(alice, EXAM, t0, true);
  const [a, b] = correctAnswers;
  await saveAnswer(alice, id, a.id, a.correct.split(""), new Date(t0.getTime() + 10 * MIN));
  await assert.rejects(saveAnswer(alice, id, b.id, b.correct.split(""), new Date(t0.getTime() + 300 * MIN)), AttemptExpired);
  const late = new Date(t0.getTime() + 300 * MIN);
  const [x, y] = await Promise.all([getAttempt(alice, id, late), getAttempt(alice, id, late)]);
  for (const r of [x, y]) {
    assert.equal(r.score, 1);
    assert.equal(r.submittedAt?.toISOString(), new Date(t0.getTime() + DEADLINE_MS).toISOString());
  }
  await assert.rejects(saveAnswer(alice, id, b.id, [], late), AttemptSubmitted);
});

test("submitAttempt after the deadline (late countdown) closes the Attempt at the deadline, not later", async () => {
  const t0 = new Date(Math.floor(Date.now() / 1000) * 1000);
  const id = await fresh(alice, EXAM, t0, true);
  await submitAttempt(alice, id, new Date(t0.getTime() + DEADLINE_MS + 5000));
  const [row] = await db.select({ submittedAt: attempts.submittedAt }).from(attempts).where(eq(attempts.id, id));
  assert.equal(row.submittedAt?.toISOString(), new Date(t0.getTime() + DEADLINE_MS).toISOString());
});

test("an untimed Attempt never expires", async () => {
  const t0 = new Date(Math.floor(Date.now() / 1000) * 1000);
  const id = await fresh(alice, EXAM, t0);
  const years = new Date(t0.getTime() + 3 * 365 * 24 * 60 * MIN);
  const a = single();
  await saveAnswer(alice, id, a.id, [a.correct], years);
  await toggleMark(alice, id, a.id, years);
  const attempt = await getAttempt(alice, id, years);
  assert.equal(attempt.submittedAt, null);
  assert.equal(attempt.deadline, null);
});

test("a Timed Attempt left past its deadline is in history, no longer open, and does not block a new start", async () => {
  const t0 = new Date("2026-01-01T00:00:00Z"); // long expired by the real clock
  const id = await fresh(bob, 4, t0, true);
  await assert.rejects(abandonAttempt(bob, id), AttemptExpired); // it belongs in history
  assert.equal(await findOpenAttempt(bob, 4), null);
  const listed = (await listAttempts(bob)).find((x) => x.id === id);
  assert.equal(listed?.timed, true);
  assert.equal(listed?.durationSec, 230 * 60);
  assert.ok(await startAttempt(bob, 4)); // the expired one was closed before the in-progress check
});

test("openAttemptSummary counts answered Questions (marks alone do not count) and gives the deadline of a Timed Attempt", async () => {
  const id = await fresh(alice, 7, undefined, true);
  await saveAnswer(alice, id, single().id, ["A"]);
  await toggleMark(alice, id, multi().id);
  const s = (await openAttemptSummary(alice, 7))!;
  assert.deepEqual({ id: s.id, answered: s.answered, total: s.total, timed: s.timed }, { id, answered: 1, total: 180, timed: true });
  assert.ok(s.deadline);
  assert.equal(await openAttemptSummary(bob, 7), null);
  await abandonAttempt(alice, id);
  assert.equal(await openAttemptSummary(alice, 7), null);
});
