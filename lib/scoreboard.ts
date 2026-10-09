import { and, asc, count, desc, eq, exists, isNotNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, examQuestions, exams, userCertifications, users, type Certification } from "@/db/schema";
import { AttemptNotFound, finalizeExpired } from "@/lib/attempts";
import { requireAdmin } from "@/lib/users";

type Cell = { userId: number; examId: number; latestAttemptId: number | null; latestScore: number | null; submitted: number; openAnswered: number | null };

/**
 * Admin-only Scoreboard, one tab per Certification: every User with access to it × every Exam of it. A cell exists once the User has a submitted or open Attempt of the
 * Exam. Abandoned Attempts are deleted, so they never count.
 */
export async function getScoreboard(actingId: number, certification: Certification, now = new Date()) {
  await requireAdmin(actingId);
  const granted = db
    .select()
    .from(userCertifications)
    .where(and(eq(userCertifications.userId, users.id), eq(userCertifications.certification, certification)));
  const userRows = await db
    .select({ id: users.id, email: users.email, locked: users.locked })
    .from(users)
    .where(or(eq(users.isAdmin, true), exists(granted)))
    .orderBy(asc(users.email));
  // ponytail: one finalizeExpired per User, fine for a small group; a single bulk query if Users grow to hundreds
  for (const u of userRows) await finalizeExpired(u.id, now);
  const examRows = await db
    .select({ id: exams.id, name: exams.name, total: count(examQuestions.questionId) })
    .from(exams)
    .leftJoin(examQuestions, eq(examQuestions.examId, exams.id))
    .where(eq(exams.certification, certification))
    .groupBy(exams.id, exams.name)
    .orderBy(asc(exams.id));
  const attemptRows = await db
    .select({ id: attempts.id, userId: attempts.userId, examId: attempts.examId, score: attempts.score, submittedAt: attempts.submittedAt, answered: count(attemptAnswers.questionId) })
    .from(attempts)
    .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attempts.id), ne(attemptAnswers.selected, "")))
    .where(and(eq(attempts.certification, certification), isNotNull(attempts.examId))) // Exams only: Drills are not on the Scoreboard
    .groupBy(attempts.id)
    .orderBy(desc(attempts.submittedAt), desc(attempts.id)); // MySQL sorts NULL last on DESC: newest submitted first

  const cells = new Map<string, Cell>();
  for (const a of attemptRows) {
    const key = `${a.userId}:${a.examId}`;
    const c = cells.get(key) ?? { userId: a.userId, examId: a.examId!, latestAttemptId: null, latestScore: null, submitted: 0, openAnswered: null };
    if (a.submittedAt) {
      if (c.latestAttemptId === null) Object.assign(c, { latestAttemptId: a.id, latestScore: a.score ?? 0 });
      c.submitted++;
    } else c.openAnswered = a.answered;
    cells.set(key, c);
  }
  return { users: userRows, exams: examRows, cells: [...cells.values()] };
}

/** Whose Attempt this is, for an Admin opening another User's Result. */
export async function attemptOwnerForAdmin(actingId: number, attemptId: number) {
  await requireAdmin(actingId);
  const [a] = await db.select({ userId: attempts.userId }).from(attempts).where(eq(attempts.id, attemptId));
  if (!a) throw new AttemptNotFound();
  return a.userId;
}
