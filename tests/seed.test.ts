import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { seedQuestions, type ParsedQuestion } from "@/db/seed";
import { closeDb, resetDb } from "./db";

const bank: ParsedQuestion[] = JSON.parse(readFileSync("data/questions.json", "utf8"));

before(resetDb);
after(closeDb);

async function counts() {
  const [{ total }] = await db.select({ total: count() }).from(questions);
  const [{ usable }] = await db.select({ usable: count() }).from(questions).where(eq(questions.usable, true));
  return { total, usable };
}

test("seeding the question bank loads 1,250 Questions, 1,229 usable", async () => {
  await seedQuestions(bank);
  assert.deepEqual(await counts(), { total: 1250, usable: 1229 });
});

test("seeding twice does not duplicate and updates Questions by original number", async () => {
  const edited = bank.map((q) => (q.number === 1 ? { ...q, text: "edited" } : q));
  await seedQuestions(edited);
  assert.deepEqual(await counts(), { total: 1250, usable: 1229 });

  const [q1] = await db.select().from(questions).where(eq(questions.id, 1));
  assert.equal(q1.text, "edited");
  assert.equal(q1.correctAnswer, "A");
  assert.deepEqual(q1.choices.map((c) => c.letter), ["A", "B", "C", "D"]);
  assert.deepEqual(q1.votes[0], { letters: "A", count: 100, mostVoted: true });
});
