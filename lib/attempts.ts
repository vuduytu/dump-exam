import { and, asc, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, examQuestions, exams, questions, users } from "@/db/schema";

export class AttemptNotFound extends Error {
  constructor() {
    super("Không tìm thấy Attempt"); // also for another User's Attempt: do not reveal that it exists
  }
}

export class AttemptNotSubmitted extends Error {
  constructor() {
    super("Attempt chưa nộp, chưa có kết quả");
  }
}

export class AttemptSubmitted extends Error {
  constructor() {
    super("Attempt đã nộp, không sửa được nữa");
  }
}

export class InvalidAnswer extends Error {
  constructor() {
    super("Đáp án không hợp lệ");
  }
}

export class AttemptExpired extends Error {
  constructor() {
    super("Đã hết giờ làm bài");
  }
}

export class AttemptInProgress extends Error {
  constructor(public attemptId: number) {
    super("Exam này đang có Attempt làm dở");
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const TIME_LIMIT_MS = 230 * 60_000;

/** When a Timed Attempt ends, computed here only; null for an untimed Attempt, which never expires. */
export const deadlineOf = (a: { timed: boolean; startedAt: Date }) => (a.timed ? new Date(a.startedAt.getTime() + TIME_LIMIT_MS) : null);

/**
 * Locks the User's in-progress Attempt row until the transaction ends, so saves and submit never interleave.
 * With `now`, also refuses a Timed Attempt past its deadline (AttemptExpired); finalizeExpired closes it later.
 */
async function lockOpenAttempt(tx: Tx, userId: number, attemptId: number, now?: Date) {
  const [attempt] = await tx
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .for("update");
  if (!attempt) throw new AttemptNotFound();
  if (attempt.submittedAt) throw new AttemptSubmitted();
  const deadline = deadlineOf(attempt);
  if (now && deadline && now >= deadline) throw new AttemptExpired();
  return attempt;
}

/**
 * Submits the User's Timed Attempts that are past their deadline, at the deadline. There is no background job:
 * every read that shows Attempt state calls this first. Saves after the deadline are refused, so the Score holds
 * only answers saved before it. Safe to race: submitAttempt locks the row, the loser gets AttemptSubmitted.
 */
export async function finalizeExpired(userId: number, now = new Date()) {
  const open = await db
    .select({ id: attempts.id, timed: attempts.timed, startedAt: attempts.startedAt })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.timed, true), isNull(attempts.submittedAt)));
  for (const a of open) {
    if (now < deadlineOf(a)!) continue;
    await submitAttempt(userId, a.id, now).catch((err) => {
      if (!(err instanceof AttemptSubmitted)) throw err;
    });
  }
}

// startedAt comes from JS, not the column's CURRENT_TIMESTAMP default: on MAMP that default is in the
// session time zone (+07) while Drizzle reads it as UTC, which would shift durations and deadlines.
export async function startAttempt(userId: number, examId: number, timed = false, now = new Date()) {
  await finalizeExpired(userId, now); // an expired Timed Attempt must not count as in progress
  return db.transaction(async (tx) => {
    // Lock the User's row first: concurrent starts by the same User queue here, so the check below sees the
    // earlier insert once it commits. (Locking only the matching attempts rows would lock nothing when there are none.)
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    const open = await openAttemptId(tx, userId, examId);
    if (open) throw new AttemptInProgress(open);
    const [{ insertId }] = await tx.insert(attempts).values({ userId, examId, timed, startedAt: now });
    return insertId;
  });
}

/** The User's newest unsubmitted Attempt of the Exam, or null. Newest, because older dev data may hold several. */
export async function findOpenAttempt(userId: number, examId: number, now = new Date()) {
  await finalizeExpired(userId, now);
  return openAttemptId(db, userId, examId);
}

async function openAttemptId(conn: Pick<typeof db, "select">, userId: number, examId: number) {
  const [row] = await conn
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.examId, examId), isNull(attempts.submittedAt)))
    .orderBy(desc(attempts.id))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Deletes the User's unsubmitted Attempt with its answers (Abandoned Attempt). Answers first: FKs do not cascade.
 * An expired Timed Attempt is refused: it belongs in history, not in the bin.
 */
export async function abandonAttempt(userId: number, attemptId: number, now = new Date()) {
  await db.transaction(async (tx) => {
    await lockOpenAttempt(tx, userId, attemptId, now);
    await tx.delete(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
    await tx.delete(attempts).where(eq(attempts.id, attemptId));
  });
}

/** The User's Attempt with every Question of its Exam in order, Correct Answer included: callers decide what to expose. */
async function loadAttempt(userId: number, attemptId: number) {
  const [attempt] = await db
    .select({ id: attempts.id, examId: attempts.examId, examName: exams.name, timed: attempts.timed, startedAt: attempts.startedAt, submittedAt: attempts.submittedAt, score: attempts.score })
    .from(attempts)
    .innerJoin(exams, eq(exams.id, attempts.examId))
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));
  if (!attempt) throw new AttemptNotFound();
  const rows = await db
    .select({
      id: questions.id,
      text: questions.text,
      choices: questions.choices,
      correct: questions.correctAnswer,
      suggested: questions.suggestedAnswer,
      votes: questions.votes,
      selected: attemptAnswers.selected,
      marked: attemptAnswers.marked,
    })
    .from(examQuestions)
    .innerJoin(questions, eq(questions.id, examQuestions.questionId))
    .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questions.id)))
    .where(eq(examQuestions.examId, attempt.examId))
    .orderBy(asc(examQuestions.position));
  return { attempt, rows };
}

/**
 * The User's Attempt with its Questions in Exam order. Never includes the Correct Answer, only how many letters it has.
 * A Timed Attempt past its deadline comes back submitted.
 */
export async function getAttempt(userId: number, attemptId: number, now = new Date()) {
  await finalizeExpired(userId, now);
  const { attempt, rows } = await loadAttempt(userId, attemptId);
  const qs = rows.map((r) => ({ id: r.id, text: r.text, choices: r.choices, need: r.correct.length, selected: r.selected ? r.selected.split("") : [], marked: !!r.marked }));
  return { ...attempt, deadline: deadlineOf(attempt), questions: qs };
}

/** Replaces the selected Choice letters of one Question; [] clears it. At most as many letters as the Correct Answer has. */
export async function saveAnswer(userId: number, attemptId: number, questionId: number, letters: string[], now = new Date()) {
  await db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId, now);
    const [q] = await tx
      .select({ choices: questions.choices, correct: questions.correctAnswer })
      .from(examQuestions)
      .innerJoin(questions, eq(questions.id, examQuestions.questionId))
      .where(and(eq(examQuestions.examId, attempt.examId), eq(examQuestions.questionId, questionId)));
    const valid = q?.choices.map((c) => c.letter) ?? [];
    if (!q || letters.length > q.correct.length || new Set(letters).size !== letters.length || !letters.every((l) => valid.includes(l)))
      throw new InvalidAnswer();
    const selected = [...letters].sort().join("");
    await tx.insert(attemptAnswers).values({ attemptId, questionId, selected }).onDuplicateKeyUpdate({ set: { selected } });
  });
}

/** Flips the review mark of one Question of an open Attempt and returns the new state. Never touches the answer. */
export async function toggleMark(userId: number, attemptId: number, questionId: number, now = new Date()) {
  return db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId, now);
    const [inExam] = await tx
      .select({ id: examQuestions.questionId })
      .from(examQuestions)
      .where(and(eq(examQuestions.examId, attempt.examId), eq(examQuestions.questionId, questionId)));
    if (!inExam) throw new InvalidAnswer();
    await tx
      .insert(attemptAnswers)
      .values({ attemptId, questionId, selected: "", marked: true })
      .onDuplicateKeyUpdate({ set: { marked: sql`NOT ${attemptAnswers.marked}` } });
    const [row] = await tx
      .select({ marked: attemptAnswers.marked })
      .from(attemptAnswers)
      .where(and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questionId)));
    return row.marked;
  });
}

const sameLetters = (a: string, b: string) => [...a].sort().join("") === [...b].sort().join("");

/**
 * Scores and closes the Attempt: one point per Question whose selected letters equal the Correct Answer exactly.
 * Past a Timed Attempt's deadline (late countdown, or finalizeExpired) it closes at the deadline, not at `now`.
 */
export async function submitAttempt(userId: number, attemptId: number, now = new Date()) {
  return db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId);
    const rows = await tx
      .select({ correct: questions.correctAnswer, selected: attemptAnswers.selected })
      .from(examQuestions)
      .innerJoin(questions, eq(questions.id, examQuestions.questionId))
      .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questions.id)))
      .where(eq(examQuestions.examId, attempt.examId));
    const score = rows.filter((r) => r.selected && sameLetters(r.selected, r.correct)).length;
    const deadline = deadlineOf(attempt);
    const submittedAt = deadline && deadline < now ? deadline : now;
    await tx.update(attempts).set({ submittedAt, score }).where(eq(attempts.id, attemptId));
    return score;
  });
}

/**
 * Review of a submitted Attempt. A Vote is per combination of letters, so a Choice's percent is the share of all
 * votes whose combination includes it.
 */
export async function getResult(userId: number, attemptId: number, filter?: "wrong" | "marked", now = new Date()) {
  await finalizeExpired(userId, now);
  const { attempt, rows } = await loadAttempt(userId, attemptId);
  if (!attempt.submittedAt) throw new AttemptNotSubmitted();
  const qs = rows.map(({ votes, selected, marked, ...q }) => {
    const all = votes.reduce((n, v) => n + v.count, 0);
    const percent = (letter: string) => (all ? Math.round((votes.filter((v) => v.letters.includes(letter)).reduce((n, v) => n + v.count, 0) / all) * 100) : 0);
    return {
      ...q,
      choices: q.choices.map((c) => ({ ...c, percent: percent(c.letter) })),
      selected: selected ? selected.split("") : [],
      marked: !!marked,
      isCorrect: !!selected && sameLetters(selected, q.correct),
    };
  });
  const questionsShown = filter === "wrong" ? qs.filter((q) => !q.isCorrect) : filter === "marked" ? qs.filter((q) => q.marked) : qs;
  return { ...attempt, total: rows.length, questions: questionsShown };
}

/** The User's submitted Attempts, newest first. Abandoned/in-progress ones are not history. */
export async function listAttempts(userId: number, now = new Date()) {
  await finalizeExpired(userId, now);
  const rows = await db
    .select({
      id: attempts.id,
      examId: attempts.examId,
      examName: exams.name,
      timed: attempts.timed,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      score: attempts.score,
      total: count(examQuestions.questionId),
    })
    .from(attempts)
    .innerJoin(exams, eq(exams.id, attempts.examId))
    .leftJoin(examQuestions, eq(examQuestions.examId, attempts.examId))
    .where(and(eq(attempts.userId, userId), isNotNull(attempts.submittedAt)))
    .groupBy(attempts.id)
    .orderBy(desc(attempts.submittedAt), desc(attempts.id));
  return rows.map((r) => ({
    ...r,
    submittedAt: r.submittedAt!,
    score: r.score ?? 0,
    durationSec: Math.round((r.submittedAt!.getTime() - r.startedAt.getTime()) / 1000),
  }));
}
