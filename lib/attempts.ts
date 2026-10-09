import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, drillQuestions, examQuestions, exams, questions, users, type Certification } from "@/db/schema";
import { domainScores, drillTitle } from "@/lib/question-tags";
import { assertAccess, certificationsOf, NoAccess } from "@/lib/users";
import { TIME_LIMIT_MIN } from "@/lib/utils";

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
    super("Đang có Attempt làm dở");
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The Attempt's Questions with their position: its Exam's, or its Drill's. */
const itemsOf = (a: { id: number; examId: number | null }) =>
  a.examId === null
    ? db.select({ questionId: drillQuestions.questionId, position: drillQuestions.position }).from(drillQuestions).where(eq(drillQuestions.attemptId, a.id)).as("items")
    : db.select({ questionId: examQuestions.questionId, position: examQuestions.position }).from(examQuestions).where(eq(examQuestions.examId, a.examId)).as("items");

/** "Đề 2" for an Exam, "Ôn: People · Manage conflicts" for a Drill. */
const titleOf = (a: { examName: string | null; drillSource: string | null }) => a.examName ?? drillTitle(a.drillSource!);

export const TIME_LIMIT_MS = TIME_LIMIT_MIN * 60_000;

/** When a Timed Attempt ends, computed here only; null for an untimed Attempt, which never expires. */
export const deadlineOf = (a: { timed: boolean; startedAt: Date }) => (a.timed ? new Date(a.startedAt.getTime() + TIME_LIMIT_MS) : null);

/** Only Attempts of a Certification the User has access to: the rest are hidden as if they did not exist, never deleted. */
const accessible = async (userId: number, conn: Pick<typeof db, "select"> = db) => inArray(attempts.certification, await certificationsOf(userId, conn));

/**
 * Locks the User's in-progress Attempt row until the transaction ends, so saves and submit never interleave.
 * With `now`, also refuses a Timed Attempt past its deadline (AttemptExpired); finalizeExpired closes it later.
 */
async function lockOpenAttempt(tx: Tx, userId: number, attemptId: number, now?: Date) {
  const [attempt] = await tx
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), await accessible(userId, tx)))
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
      if (!(err instanceof AttemptSubmitted || err instanceof AttemptNotFound)) throw err; // closed or abandoned meanwhile
    });
  }
}

// startedAt comes from JS, not the column's CURRENT_TIMESTAMP default: on MAMP that default is in the
// session time zone (+07) while Drizzle reads it as UTC, which would shift durations and deadlines.
export async function startAttempt(userId: number, examId: number, timed = false, now = new Date()) {
  const [exam] = await db
    .select({ certification: exams.certification })
    .from(exams)
    .where(and(eq(exams.id, examId), inArray(exams.certification, await certificationsOf(userId))));
  if (!exam) throw new NoAccess();
  await finalizeExpired(userId, now); // an expired Timed Attempt must not count as in progress
  return db.transaction(async (tx) => {
    // Lock the User's row first: concurrent starts by the same User queue here, so the check below sees the
    // earlier insert once it commits. (Locking only the matching attempts rows would lock nothing when there are none.)
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    const open = await openAttemptId(tx, userId, examId);
    if (open) throw new AttemptInProgress(open);
    const [{ insertId }] = await tx.insert(attempts).values({ userId, examId, certification: exam.certification, timed, startedAt: now });
    return insertId;
  });
}

/** The User's newest unsubmitted Attempt of the Exam, or null. Newest, because older dev data may hold several. */
export async function findOpenAttempt(userId: number, examId: number, now = new Date()) {
  await finalizeExpired(userId, now);
  return openAttemptId(db, userId, examId);
}

/** The open Attempt of the Exam with how many Questions have an answer (a mark alone is not an answer), or null. */
export async function openAttemptSummary(userId: number, examId: number, now = new Date()) {
  const id = await findOpenAttempt(userId, examId, now);
  if (!id) return null;
  const [[a], [{ answered }], [{ total }]] = await Promise.all([
    db.select({ timed: attempts.timed, startedAt: attempts.startedAt }).from(attempts).where(eq(attempts.id, id)),
    db.select({ answered: count() }).from(attemptAnswers).where(and(eq(attemptAnswers.attemptId, id), sql`${attemptAnswers.selected} <> ''`)),
    db.select({ total: count() }).from(examQuestions).where(eq(examQuestions.examId, examId)),
  ]);
  return { id, timed: a.timed, deadline: deadlineOf(a), answered, total };
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
 * Deletes the User's unsubmitted Attempt with its answers and Drill Questions (Abandoned Attempt). Children first: FKs do not cascade.
 * An expired Timed Attempt is refused: it belongs in history, not in the bin.
 */
export async function abandonAttempt(userId: number, attemptId: number, now = new Date()) {
  await db.transaction(async (tx) => {
    await lockOpenAttempt(tx, userId, attemptId, now);
    await tx.delete(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
    await tx.delete(drillQuestions).where(eq(drillQuestions.attemptId, attemptId));
    await tx.delete(attempts).where(eq(attempts.id, attemptId));
  });
}

/** The User's Attempt with every Question of its Exam or Drill in order, Correct Answer included: callers decide what to expose. */
async function loadAttempt(userId: number, attemptId: number) {
  const [attempt] = await db
    .select({ id: attempts.id, certification: attempts.certification, examId: attempts.examId, examName: exams.name, drillSource: attempts.drillSource, timed: attempts.timed, startedAt: attempts.startedAt, submittedAt: attempts.submittedAt, score: attempts.score })
    .from(attempts)
    .leftJoin(exams, eq(exams.id, attempts.examId))
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), await accessible(userId)));
  if (!attempt) throw new AttemptNotFound();
  const items = itemsOf(attempt);
  const rows = await db
    .select({
      id: questions.id,
      number: items.position, // shown as "Câu N": the number in the PgMP dump file, else the order in the Exam or Drill
      task: questions.task,
      text: questions.text,
      choices: questions.choices,
      correct: questions.correctAnswer,
      suggested: questions.suggestedAnswer,
      votes: questions.votes,
      explanation: questions.explanation,
      duplicates: questions.duplicates,
      selected: attemptAnswers.selected,
      marked: attemptAnswers.marked,
    })
    .from(items)
    .innerJoin(questions, eq(questions.id, items.questionId))
    .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questions.id)))
    .orderBy(asc(items.position));
  return { attempt: { ...attempt, title: titleOf(attempt) }, rows: rows.map((r) => ({ ...r, duplicates: r.duplicates ?? [] })) };
}

/**
 * The User's Attempt with its Questions in Exam (or Drill) order. Never includes the Correct Answer, only how many letters it has.
 * A Timed Attempt past its deadline comes back submitted.
 */
export async function getAttempt(userId: number, attemptId: number, now = new Date()) {
  await finalizeExpired(userId, now);
  const { attempt, rows } = await loadAttempt(userId, attemptId);
  const qs = rows.map((r) => ({ id: r.id, number: r.number, text: r.text, choices: r.choices, duplicates: r.duplicates, need: r.correct.length, selected: r.selected ? r.selected.split("") : [], marked: !!r.marked }));
  return { ...attempt, deadline: deadlineOf(attempt), questions: qs };
}

/** Replaces the selected Choice letters of one Question; [] clears it. At most as many letters as the Correct Answer has. */
export async function saveAnswer(userId: number, attemptId: number, questionId: number, letters: string[], now = new Date()) {
  await db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId, now);
    const items = itemsOf(attempt);
    const [q] = await tx
      .select({ choices: questions.choices, correct: questions.correctAnswer })
      .from(items)
      .innerJoin(questions, eq(questions.id, items.questionId))
      .where(eq(items.questionId, questionId));
    const valid = q?.choices.map((c) => c.letter) ?? [];
    if (!q || letters.length > q.correct.length || new Set(letters).size !== letters.length || !letters.every((l) => valid.includes(l)))
      throw new InvalidAnswer();
    const selected = [...letters].sort().join("");
    await tx.insert(attemptAnswers).values({ attemptId, questionId, selected }).onDuplicateKeyUpdate({ set: { selected } });
  });
}

/**
 * Sets the review mark of one Question of an open Attempt to `marked`. Never touches the answer. An explicit value, not a
 * flip, so a retried or out-of-order request cannot leave the mark opposite to what the User last chose.
 */
export async function setMark(userId: number, attemptId: number, questionId: number, marked: boolean, now = new Date()) {
  await db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId, now);
    const items = itemsOf(attempt);
    const [inAttempt] = await tx.select({ id: items.questionId }).from(items).where(eq(items.questionId, questionId));
    if (!inAttempt) throw new InvalidAnswer();
    await tx.insert(attemptAnswers).values({ attemptId, questionId, selected: "", marked }).onDuplicateKeyUpdate({ set: { marked } });
  });
}

export const sameLetters = (a: string, b: string) => [...a].sort().join("") === [...b].sort().join("");

/**
 * Scores and closes the Attempt: one point per Question whose selected letters equal the Correct Answer exactly.
 * Past a Timed Attempt's deadline (late countdown, or finalizeExpired) it closes at the deadline, not at `now`.
 */
export async function submitAttempt(userId: number, attemptId: number, now = new Date()) {
  return db.transaction(async (tx) => {
    const attempt = await lockOpenAttempt(tx, userId, attemptId);
    const items = itemsOf(attempt);
    const rows = await tx
      .select({ correct: questions.correctAnswer, selected: attemptAnswers.selected })
      .from(items)
      .innerJoin(questions, eq(questions.id, items.questionId))
      .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questions.id)));
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
      voted: votes.length > 0, // PMP only: PgMP has no Vote, its Explanation (if any) shows instead
      choices: q.choices.map((c) => ({ ...c, percent: percent(c.letter) })),
      selected: selected ? selected.split("") : [],
      marked: !!marked,
      isCorrect: !!selected && sameLetters(selected, q.correct),
    };
  });
  const questionsShown = filter === "wrong" ? qs.filter((q) => !q.isCorrect) : filter === "marked" ? qs.filter((q) => q.marked) : qs;
  const domains = attempt.examId === null ? [] : domainScores(rows.map((r, i) => ({ task: r.task, correct: qs[i].isCorrect })));
  return { ...attempt, total: rows.length, domains, questions: questionsShown };
}

/** The User's submitted Attempts of Exams and Drills of one Certification, newest first; NoAccess without Certification Access. Abandoned/in-progress ones are not history. */
export async function listAttempts(userId: number, certification: Certification, now = new Date()) {
  await assertAccess(userId, certification);
  await finalizeExpired(userId, now);
  const rows = await db
    .select({
      id: attempts.id,
      examId: attempts.examId,
      examName: exams.name,
      drillSource: attempts.drillSource,
      timed: attempts.timed,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      score: attempts.score,
      examTotal: count(examQuestions.questionId),
      drillTotal: count(drillQuestions.questionId),
    })
    .from(attempts)
    .leftJoin(exams, eq(exams.id, attempts.examId))
    .leftJoin(examQuestions, eq(examQuestions.examId, attempts.examId))
    .leftJoin(drillQuestions, eq(drillQuestions.attemptId, attempts.id)) // an Attempt has rows in only one of the two
    .where(and(eq(attempts.userId, userId), eq(attempts.certification, certification), isNotNull(attempts.submittedAt)))
    .groupBy(attempts.id, exams.name) // TiDB's only_full_group_by does not infer exams.name from the join
    .orderBy(desc(attempts.submittedAt), desc(attempts.id));
  return rows.map(({ examName, examTotal, drillTotal, ...r }) => ({
    ...r,
    title: titleOf({ examName, drillSource: r.drillSource }),
    total: examTotal + drillTotal,
    submittedAt: r.submittedAt!,
    score: r.score ?? 0,
    durationSec: Math.round((r.submittedAt!.getTime() - r.startedAt.getTime()) / 1000),
  }));
}
