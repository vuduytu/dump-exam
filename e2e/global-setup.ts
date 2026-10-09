import { readFileSync } from "node:fs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateExams, seedQuestions } from "@/db/seed";
import { hashPassword } from "@/lib/auth";
import { closeDb, resetDb } from "../tests/db";

export const E2E_EMAIL = "e2e@dump-exam.local";

/** Empties the _test database (resetDb refuses any other), then seeds Questions, Exams and the e2e User. */
export default async function globalSetup() {
  const password = process.env.E2E_PASSWORD;
  if (!password) throw new Error("E2E_PASSWORD is not set (see .env.example)");
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await generateExams();
  await db.insert(users).values({ email: E2E_EMAIL, passwordHash: await hashPassword(password) });
  await closeDb();
}
