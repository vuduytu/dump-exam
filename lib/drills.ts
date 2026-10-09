import { and, asc, count, eq, inArray, isNull, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, drillQuestions, questions, users, type Certification } from "@/db/schema";
import { AttemptInProgress, finalizeExpired, sameLetters } from "@/lib/attempts";
import { tasksOf, tasksOfSource } from "@/lib/question-tags";
import { assertAccess } from "@/lib/users";

export class InvalidDrill extends Error {
  constructor() {
    super("Drill phải theo một Domain hoặc Task có thật, 10 hoặc 20 câu");
  }
}

export class DrillEmpty extends Error {
  constructor() {
    super("Chủ đề này chưa có câu nào để ôn");
  }
}

const shuffle = <T>(xs: T[]) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};

/** The User's latest non-blank answer per Question over submitted Attempts (Exam and Drill), optionally limited to some Questions. */
async function latestAnswers(userId: number, questionIds?: number[]) {
  const rows = await db
    .select({ questionId: attemptAnswers.questionId, selected: attemptAnswers.selected })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attempts.id, attemptAnswers.attemptId))
    .where(and(eq(attempts.userId, userId), isNotNull(attempts.submittedAt), ne(attemptAnswers.selected, ""), questionIds && inArray(attemptAnswers.questionId, questionIds)))
    .orderBy(asc(attempts.submittedAt), asc(attempts.id));
  return new Map(rows.map((a) => [a.questionId, a.selected])); // later rows overwrite: the latest answer wins
}

type Count = { total: number; done: number; correct: number };
const pct = (c: Count) => (c.done ? c.correct / c.done : null);

/**
 * Per Domain and Task: usable Questions, how many the User has answered, how many of those are right on the latest answer
 * (submitted Attempts of this User only). Tasks sort by % right ascending, then untouched, then empty ones.
 */
export async function topicStats(userId: number, certification: Certification, now = new Date()) {
  await assertAccess(userId, certification);
  await finalizeExpired(userId, now); // an expired Timed Attempt counts as submitted
  const [pool, latest] = await Promise.all([
    db.select({ id: questions.id, task: questions.task, correct: questions.correctAnswer }).from(questions).where(and(eq(questions.certification, certification), eq(questions.usable, true))),
    latestAnswers(userId),
  ]);
  const byTask = new Map<string, Count>();
  for (const q of pool) {
    const c = byTask.get(q.task!) ?? { total: 0, done: 0, correct: 0 };
    c.total++;
    if (latest.has(q.id)) {
      c.done++;
      if (sameLetters(latest.get(q.id)!, q.correct)) c.correct++;
    }
    byTask.set(q.task!, c);
  }
  const rank = (c: Count) => (!c.total ? 3 : c.done ? pct(c)! : 2); // % is in [0,1]
  const sorted = <T extends Count>(xs: T[]) => xs.sort((a, b) => rank(a) - rank(b));
  const all = tasksOf(certification);
  return [...new Set(all.map((t) => t.domain))].map((domain) => {
    const tasks = sorted(
      all.filter((t) => t.domain === domain).map((t) => ({ source: t.code, name: t.name, ...(byTask.get(t.code) ?? { total: 0, done: 0, correct: 0 }) })),
    );
    const sum = (k: keyof Count) => tasks.reduce((n, t) => n + t[k], 0);
    return { domain, total: sum("total"), done: sum("done"), correct: sum("correct"), tasks };
  });
}

/** The User's open Drills of the Certification by source, with how many Questions have an answer. */
export async function openDrills(userId: number, certification: Certification) {
  await assertAccess(userId, certification);
  const rows = await db
    .select({ id: attempts.id, source: attempts.drillSource, total: count(drillQuestions.questionId), answered: sql<number>`(select count(*) from attempt_answers aa where aa.attempt_id = ${attempts.id} and aa.selected <> '')` })
    .from(attempts)
    .innerJoin(drillQuestions, eq(drillQuestions.attemptId, attempts.id))
    .where(and(eq(attempts.userId, userId), eq(attempts.certification, certification), isNull(attempts.submittedAt)))
    .groupBy(attempts.id);
  return new Map(rows.map((r) => [r.source!, { id: r.id, total: r.total, answered: Number(r.answered) }]));
}

/**
 * Starts an untimed Drill of `size` (or all) usable Questions from a Domain (by name) or a Task (by code), picked in this order:
 * never answered in a submitted Attempt, then wrong on the latest answer, then the rest; random within each group.
 * A short source gives all it has. One open Drill per source, like one open Attempt per Exam.
 */
export async function startDrill(userId: number, certification: Certification, source: string, size: number | "all", now = new Date()) {
  await assertAccess(userId, certification);
  const tasks = tasksOfSource(certification, source);
  if (!tasks.length || (size !== 10 && size !== 20 && size !== "all")) throw new InvalidDrill();
  const pool = await db
    .select({ id: questions.id, correct: questions.correctAnswer })
    .from(questions)
    .where(and(eq(questions.certification, certification), inArray(questions.task, tasks), eq(questions.usable, true)));
  if (!pool.length) throw new DrillEmpty();
  await finalizeExpired(userId, now); // an expired Timed Attempt counts as submitted
  const latest = await latestAnswers(userId, pool.map((q) => q.id));
  // 0 never answered, 1 wrong on the latest answer, 2 right on it
  const group = (q: (typeof pool)[number]) => (!latest.has(q.id) ? 0 : sameLetters(latest.get(q.id)!, q.correct) ? 2 : 1);
  const picked = [0, 1, 2].flatMap((g) => shuffle(pool.filter((q) => group(q) === g))).slice(0, size === "all" ? undefined : size);

  return db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update"); // as in startAttempt
    const [open] = await tx
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.certification, certification), eq(attempts.drillSource, source), isNull(attempts.submittedAt)));
    if (open) throw new AttemptInProgress(open.id);
    const [{ insertId }] = await tx.insert(attempts).values({ userId, certification, drillSource: source, startedAt: now });
    await tx.insert(drillQuestions).values(picked.map((q, i) => ({ attemptId: insertId, position: i + 1, questionId: q.id })));
    return insertId;
  });
}
