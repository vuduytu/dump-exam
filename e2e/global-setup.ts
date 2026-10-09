import { readFileSync } from "node:fs";
import { db } from "@/db";
import { userCertifications, users } from "@/db/schema";
import { generateExams, seedPgmp, seedQuestions, seedTags } from "@/db/seed";
import { hashPassword } from "@/lib/auth";
import { closeDb, resetDb } from "../tests/db";

export const E2E_EMAIL = "e2e@dump-exam.local";

/** Empties the _test database (resetDb refuses any other), then seeds PMP and PgMP Questions, Exams and the e2e User. */
export default async function globalSetup() {
  const password = process.env.E2E_PASSWORD;
  if (!password) throw new Error("E2E_PASSWORD is not set (see .env.example)");
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await seedTags(JSON.parse(readFileSync("data/question-tags.json", "utf8")));
  await generateExams();
  await seedPgmp(JSON.parse(readFileSync("data/pgmp-questions.json", "utf8")));
  const [{ insertId }] = await db.insert(users).values({ email: E2E_EMAIL, passwordHash: await hashPassword(password) });
  await db.insert(userCertifications).values([{ userId: insertId, certification: "PMP" }, { userId: insertId, certification: "PgMP" }]); // PMP shows first
  await closeDb();
}
