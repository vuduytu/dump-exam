import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { examQuestions, exams, questions, userCertifications, users } from "@/db/schema";
import { generateExams, seedPgmp, seedQuestions, seedTags, type PgmpQuestion } from "@/db/seed";
import { getAttempt, getResult, saveAnswer, startAttempt, submitAttempt } from "@/lib/attempts";
import { closeDb, resetDb } from "./db";

const pgmp: PgmpQuestion[] = JSON.parse(readFileSync("data/pgmp-questions.json", "utf8"));

before(resetDb);
after(closeDb);

async function snapshot() {
  const rows = await db.select().from(examQuestions).orderBy(asc(examQuestions.examId), asc(examQuestions.position));
  return rows.map((r) => `${r.examId}:${r.position}:${r.questionId}`);
}

async function pgmpCount() {
  const [{ n }] = await db.select({ n: count() }).from(questions).where(eq(questions.certification, "PgMP"));
  return n;
}

test("PgMP seeded first: PMP Questions, Tags and Exams still seed as before", async () => {
  assert.equal(await seedPgmp(pgmp), 22);
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await seedTags(JSON.parse(readFileSync("data/question-tags.json", "utf8")));
  assert.equal(await generateExams(), true);
  const pmp = await db.select().from(exams).where(eq(exams.certification, "PMP"));
  assert.equal(pmp.length, 7);
});

test("22 PgMP Exams named after the files in time order, original numbers kept, no Unusable Question", async () => {
  const list = await db.select().from(exams).where(eq(exams.certification, "PgMP")).orderBy(asc(exams.id));
  assert.equal(list[0].name, "6_6_2024 11_05_01 AM");
  assert.equal(list[21].name, "6_6_2024 11_48_11 AM");
  assert.deepEqual(list.map((e) => e.name), [...new Set(pgmp.map((q) => q.source))]);
  const exam = list.find((e) => e.name === "6_6_2024 11_40_01 AM")!; // 100 Questions, 9 Unusable
  const rows = await db
    .select({ position: examQuestions.position, number: questions.number, usable: questions.usable, source: questions.source })
    .from(examQuestions)
    .innerJoin(questions, eq(questions.id, examQuestions.questionId))
    .where(eq(examQuestions.examId, exam.id))
    .orderBy(asc(examQuestions.position));
  assert.equal(rows.length, 91);
  assert.ok(rows.every((r) => r.usable && r.position === r.number && r.source === exam.name));
  assert.ok(!rows.some((r) => r.position === 23)); // Unusable: skipped, the rest not renumbered
  const [q] = await db.select().from(questions).where(and(eq(questions.source, "6_6_2024 11_16_20 AM"), eq(questions.number, 1)));
  assert.match(q.explanation!, /^Answer B is correct\./);
  assert.equal(q.correctAnswer, "B");
});

test("seeding PgMP twice duplicates nothing and leaves the PMP Exams alone", async () => {
  const before = await snapshot();
  assert.equal(await seedPgmp(pgmp.map((q) => (q.id === pgmp[0].id ? { ...q, explanation: "edited" } : q))), 0);
  assert.deepEqual(await snapshot(), before);
  assert.equal(await pgmpCount(), 3023);
  const [q] = await db.select().from(questions).where(eq(questions.id, pgmp[0].id));
  assert.equal(q.explanation, "edited");
});

test("a bank whose Questions differ from an existing PgMP Exam is refused, nothing rewritten", async () => {
  const before = await snapshot();
  const unusable = pgmp.map((q) => (q.id === pgmp[0].id ? { ...q, usable: false, explanation: "changed" } : q));
  await assert.rejects(seedPgmp(unusable), /PgMP Exams differ from the bank, not rewritten: 6_6_2024 11_05_01 AM$/);
  assert.deepEqual(await snapshot(), before);
  const [q] = await db.select().from(questions).where(eq(questions.id, pgmp[0].id));
  assert.equal(q.explanation, "edited"); // checked before any upsert
});

test("a PgMP Attempt shows original numbers and Duplicate Questions; multi-answer scores like PMP; Result has the Explanation", async () => {
  const [{ insertId: user }] = await db.insert(users).values({ email: "pgmp@x.test", passwordHash: "-" });
  await db.insert(userCertifications).values({ userId: user, certification: "PgMP" });
  const examId = async (name: string) => (await db.select({ id: exams.id }).from(exams).where(eq(exams.name, name)))[0].id;

  const gap = await getAttempt(user, await startAttempt(user, await examId("6_6_2024 11_40_01 AM")));
  assert.deepEqual(gap.questions.slice(21, 24).map((x) => x.number), [22, 24, 27]); // 23, 25, 26 are Unusable

  const twins = (await getAttempt(user, await startAttempt(user, await examId("6_6_2024 11_45_11 AM")))).questions.filter((x) => x.duplicates.length);
  assert.equal(twins.length, 3);
  assert.deepEqual(twins[0].duplicates, pgmp.find((x) => x.id === twins[0].id)!.duplicates);

  const id = await startAttempt(user, await examId("6_6_2024 11_16_20 AM"));
  const multi = (await getAttempt(user, id)).questions.find((x) => x.need > 1)!;
  const correct = pgmp.find((x) => x.id === multi.id)!.correctAnswer;
  await saveAnswer(user, id, multi.id, correct.split(""));
  assert.equal(await submitAttempt(user, id), 1);
  const result = await getResult(user, id);
  assert.equal(result.certification, "PgMP");
  assert.match(result.questions.find((x) => x.id === multi.id)!.explanation!, /correct/);
});
