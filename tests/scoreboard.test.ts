import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examQuestions, users } from "@/db/schema";
import { generateExams, seedQuestions } from "@/db/seed";
import { abandonAttempt, saveAnswer, startAttempt, submitAttempt, TIME_LIMIT_MS } from "@/lib/attempts";
import { attemptOwnerForAdmin, getScoreboard } from "@/lib/scoreboard";
import { NotAdmin } from "@/lib/users";
import { closeDb, grantPmp, resetDb } from "./db";

const EXAM = 1;
let admin: number;
let zed: number;
let amy: number;
let firstQ: number;

before(async () => {
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await generateExams();
  [{ insertId: admin }] = await db.insert(users).values({ email: "admin@x.test", passwordHash: "-", isAdmin: true });
  [{ insertId: zed }] = await db.insert(users).values({ email: "zed@x.test", passwordHash: "-" });
  [{ insertId: amy }] = await db.insert(users).values({ email: "amy@x.test", passwordHash: "-", locked: true });
  await grantPmp(zed, amy);
  [{ questionId: firstQ }] = await db.select({ questionId: examQuestions.questionId }).from(examQuestions).where(eq(examQuestions.examId, EXAM)).orderBy(asc(examQuestions.position)).limit(1);
});
after(closeDb);

const cell = (b: Awaited<ReturnType<typeof getScoreboard>>, userId: number, examId: number) => b.cells.find((c) => c.userId === userId && c.examId === examId);

test("only an Admin can read the Scoreboard or look up whose Attempt it is", async () => {
  await assert.rejects(getScoreboard(zed, "PMP"), NotAdmin);
  const id = await startAttempt(zed, EXAM);
  await assert.rejects(attemptOwnerForAdmin(zed, id), NotAdmin);
  assert.equal(await attemptOwnerForAdmin(admin, id), zed);
  await abandonAttempt(zed, id);
});

test("rows are every User by email, locked ones included; columns are the Exams in order", async () => {
  const b = await getScoreboard(admin, "PMP");
  assert.deepEqual(b.users.map((u) => [u.email, u.locked]), [["admin@x.test", false], ["amy@x.test", true], ["zed@x.test", false]]);
  assert.deepEqual(b.exams.map((e) => e.id), [...b.exams.map((e) => e.id)].sort((x, y) => x - y));
  assert.equal(b.exams[0].total, 180);
});

test("a cell shows the latest submitted Score, the submitted count and the open Attempt's answered count", async () => {
  const t0 = new Date("2026-01-01T00:00:00Z");
  const first = await startAttempt(zed, EXAM, false, t0);
  await submitAttempt(zed, first, new Date(t0.getTime() + 1000)); // Score 0
  const abandoned = await startAttempt(zed, EXAM, false, new Date(t0.getTime() + 2000));
  await abandonAttempt(zed, abandoned);
  const second = await startAttempt(zed, EXAM, false, new Date(t0.getTime() + 3000));
  const b0 = await getScoreboard(admin, "PMP");
  assert.deepEqual(cell(b0, zed, EXAM), { userId: zed, examId: EXAM, latestAttemptId: first, latestScore: 0, submitted: 1, openAnswered: 0 });

  await saveAnswer(zed, second, firstQ, ["A"]);
  await submitAttempt(zed, second, new Date(t0.getTime() + 4000));
  const open = await startAttempt(zed, EXAM, false, new Date(t0.getTime() + 5000));
  await saveAnswer(zed, open, firstQ, ["B"]);
  const b1 = await getScoreboard(admin, "PMP");
  const c = cell(b1, zed, EXAM)!;
  assert.equal(c.latestAttemptId, second);
  assert.equal(c.submitted, 2); // the abandoned one is gone
  assert.equal(c.openAnswered, 1);
  assert.equal(cell(b1, amy, EXAM), undefined); // never started: empty cell
  await abandonAttempt(zed, open);
});

test("a Timed Attempt past its deadline counts as submitted, not open", async () => {
  const started = new Date(Date.now() - TIME_LIMIT_MS - 60_000);
  const id = await startAttempt(amy, EXAM, true, started);
  const c = cell(await getScoreboard(admin, "PMP"), amy, EXAM)!;
  assert.equal(c.latestAttemptId, id);
  assert.equal(c.openAnswered, null);
});
