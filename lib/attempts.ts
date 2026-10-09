import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, examQuestions, exams, questions } from "@/db/schema";

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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Locks the User's in-progress Attempt row until the transaction ends, so saves and submit never interleave. */
async function lockOpenAttempt(tx: Tx, userId: number, attemptId: number) {
  const [attempt] = await tx
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .for("update");
  if (!attempt) throw new AttemptNotFound();
  if (attempt.submittedAt) throw new AttemptSubmitted();
  return attempt;
}

// startedAt comes from JS, not the column's CURRENT_TIMESTAMP default: on MAMP that default is in the
// session time zone (+07) while Drizzle reads it as UTC, which would shift durations and deadlines.
export async function startAttempt(userId: number, examId: number, now = new Date()) {
  const [{ insertId }] = await db.insert(attempts).values({ userId, examId, startedAt: now });
  return insertId;
}

/** The User's Attempt with every Question of its Exam in order, Correct Answer included: callers decide what to expose. */
async function loadAttempt(userId: number, attemptId: number) {
  const [attempt] = await db
    .select({ id: attempts.id, examId: attempts.examId, examName: exams.name, startedAt: attempts.startedAt, submittedAt: attempts.submittedAt, score: attempts.score })
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
    })
    .from(examQuestions)
    .innerJoin(questions, eq(questions.id, examQuestions.questionId))
    .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questions.id)))
    .where(eq(examQuestions.examId, attempt.examId))
    .orderBy(asc(examQuestions.position));
  return { attempt, rows };
}

/** The User's Attempt with its Questions in Exam order. Never includes the Correct Answer, only how many letters it has. */
export async function getAttempt(userId: number, attemptId: number) {
  const { attempt, rows } = await loadAttempt(userId, attemptId);
  const qs = rows.map((r) => ({ id: r.id, text: r.text, choices: r.choices, need: r.correct.length, selected: r.selected ? r.selected.split("") : [] }));
  return { ...attempt, questions: qs };
}

/** Replaces the selected Choice letters of one Question; [] clears it. At most as many letters as the Correct Answer has. */
export async function saveAnswer(userId: number, attemptId: number, questionId: number, letters: string[]) {
  await db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId);
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

const sameLetters = (a: string, b: string) => [...a].sort().join("") === [...b].sort().join("");

/** Scores and closes the Attempt: one point per Question whose selected letters equal the Correct Answer exactly. */
export async function submitAttempt(userId: number, attemptId: number) {
  return db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId);
    const rows = await tx
      .select({ correct: questions.correctAnswer, selected: attemptAnswers.selected })
      .from(examQuestions)
      .innerJoin(questions, eq(questions.id, examQuestions.questionId))
      .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questions.id)))
      .where(eq(examQuestions.examId, attempt.examId));
    const score = rows.filter((r) => r.selected && sameLetters(r.selected, r.correct)).length;
    await tx.update(attempts).set({ submittedAt: new Date(), score }).where(eq(attempts.id, attemptId));
    return score;
  });
}

/**
 * Review of a submitted Attempt. A Vote is per combination of letters, so a Choice's percent is the share of all
 * votes whose combination includes it. "marked" returns [] until Marked Questions are stored (ticket 07).
 */
export async function getResult(userId: number, attemptId: number, filter?: "wrong" | "marked") {
  const { attempt, rows } = await loadAttempt(userId, attemptId);
  if (!attempt.submittedAt) throw new AttemptNotSubmitted();
  const qs = rows.map(({ votes, selected, ...q }) => {
    const all = votes.reduce((n, v) => n + v.count, 0);
    const percent = (letter: string) => (all ? Math.round((votes.filter((v) => v.letters.includes(letter)).reduce((n, v) => n + v.count, 0) / all) * 100) : 0);
    return {
      ...q,
      choices: q.choices.map((c) => ({ ...c, percent: percent(c.letter) })),
      selected: selected ? selected.split("") : [],
      isCorrect: !!selected && sameLetters(selected, q.correct),
    };
  });
  const questionsShown = filter === "wrong" ? qs.filter((q) => !q.isCorrect) : filter === "marked" ? [] : qs;
  return { ...attempt, total: rows.length, questions: questionsShown };
}

/** The User's submitted Attempts, newest first. Abandoned/in-progress ones are not history. */
export async function listAttempts(userId: number) {
  const rows = await db
    .select({
      id: attempts.id,
      examId: attempts.examId,
      examName: exams.name,
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
