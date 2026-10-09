import { and, asc, eq, inArray, isNull, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, drillQuestions, questions, users } from "@/db/schema";
import { AttemptInProgress, finalizeExpired, sameLetters } from "@/lib/attempts";
import { tasksOfSource } from "@/lib/question-tags";

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

/**
 * Starts an untimed Drill of `size` usable Questions from a Domain (by name) or a Task (by code), picked in this order:
 * never answered in a submitted Attempt, then wrong on the latest answer, then the rest; random within each group.
 * A short source gives all it has. One open Drill per source, like one open Attempt per Exam.
 */
export async function startDrill(userId: number, source: string, size: number, now = new Date()) {
  const tasks = tasksOfSource(source);
  if (!tasks.length || (size !== 10 && size !== 20)) throw new InvalidDrill();
  const pool = await db
    .select({ id: questions.id, correct: questions.correctAnswer })
    .from(questions)
    .where(and(inArray(questions.task, tasks), eq(questions.usable, true)));
  if (!pool.length) throw new DrillEmpty();
  await finalizeExpired(userId, now); // an expired Timed Attempt counts as submitted
  const answers = await db
    .select({ questionId: attemptAnswers.questionId, selected: attemptAnswers.selected })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attempts.id, attemptAnswers.attemptId))
    .where(and(eq(attempts.userId, userId), isNotNull(attempts.submittedAt), ne(attemptAnswers.selected, ""), inArray(attemptAnswers.questionId, pool.map((q) => q.id))))
    .orderBy(asc(attempts.submittedAt), asc(attempts.id));
  const latest = new Map(answers.map((a) => [a.questionId, a.selected])); // later rows overwrite: the latest answer wins
  // 0 never answered, 1 wrong on the latest answer, 2 right on it
  const group = (q: (typeof pool)[number]) => (!latest.has(q.id) ? 0 : sameLetters(latest.get(q.id)!, q.correct) ? 2 : 1);
  const picked = [0, 1, 2].flatMap((g) => shuffle(pool.filter((q) => group(q) === g))).slice(0, size);

  return db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update"); // as in startAttempt
    const [open] = await tx
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.drillSource, source), isNull(attempts.submittedAt)));
    if (open) throw new AttemptInProgress(open.id);
    const [{ insertId }] = await tx.insert(attempts).values({ userId, drillSource: source, startedAt: now });
    await tx.insert(drillQuestions).values(picked.map((q, i) => ({ attemptId: insertId, position: i + 1, questionId: q.id })));
    return insertId;
  });
}
