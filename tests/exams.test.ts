import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examQuestions, exams, questions } from "@/db/schema";
import { generateExams, seedQuestions, type ParsedQuestion } from "@/db/seed";
import { closeDb, resetDb } from "./db";

const bank: ParsedQuestion[] = JSON.parse(readFileSync("data/questions.json", "utf8"));

before(async () => {
  await resetDb();
  await seedQuestions(bank);
});
after(closeDb);

async function snapshot() {
  const rows = await db.select().from(examQuestions).orderBy(asc(examQuestions.examId), asc(examQuestions.position));
  return rows.map((r) => `${r.examId}:${r.position}:${r.questionId}`);
}

test("1,229 usable Questions make 7 Exams of 180, no Unusable Question, no repeat inside an Exam", async () => {
  assert.equal(await generateExams(), true);
  const list = await db.select().from(exams).orderBy(asc(exams.id));
  assert.deepEqual(list.map((e) => e.name), ["Đề 1", "Đề 2", "Đề 3", "Đề 4", "Đề 5", "Đề 6", "Đề 7"]);
  for (const e of list) {
    const rows = await db
      .select({ position: examQuestions.position, id: examQuestions.questionId, usable: questions.usable })
      .from(examQuestions)
      .innerJoin(questions, eq(questions.id, examQuestions.questionId))
      .where(eq(examQuestions.examId, e.id))
      .orderBy(asc(examQuestions.position));
    assert.deepEqual(rows.map((r) => r.position), Array.from({ length: 180 }, (_, i) => i + 1));
    assert.equal(new Set(rows.map((r) => r.id)).size, 180);
    assert.ok(rows.every((r) => r.usable));
  }
});

test("running again changes nothing, and a fresh run on the same bank gives the same Exams", async () => {
  const first = await snapshot();
  assert.equal(await generateExams(), false);
  assert.deepEqual(await snapshot(), first);

  await resetDb();
  await seedQuestions(bank);
  await generateExams();
  assert.deepEqual(await snapshot(), first);
});
