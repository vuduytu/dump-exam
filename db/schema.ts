import { sql } from "drizzle-orm";
import { boolean, datetime, int, json, mysqlTable, primaryKey, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

export type Choice = { letter: string; text: string };
// One ExamTopics vote row: the voted combination of Choice letters (e.g. "AC"), not a single Choice.
export type Vote = { letters: string; count: number; mostVoted: boolean };

export const questions = mysqlTable("questions", {
  id: int("id").primaryKey(), // original ExamTopics number (`Question #N`)
  text: text("text").notNull(),
  choices: json("choices").$type<Choice[]>().notNull(),
  suggestedAnswer: varchar("suggested_answer", { length: 8 }).notNull(),
  mostVotedAnswer: varchar("most_voted_answer", { length: 8 }).notNull(),
  correctAnswer: varchar("correct_answer", { length: 8 }).notNull(),
  votes: json("votes").$type<Vote[]>().notNull(),
  usable: boolean("usable").notNull(),
  task: varchar("task", { length: 16 }), // Task code from data/tasks.json (its Domain follows); null until tags are seeded
  approach: varchar("approach", { length: 16 }),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(), // see hashPassword in lib/auth.ts
  isAdmin: boolean("is_admin").notNull().default(false),
  locked: boolean("locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), // not defaultNow(): `(now())` needs MySQL 8.0.13+
});

export type User = typeof users.$inferSelect;

export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
});

export const examQuestions = mysqlTable(
  "exam_questions",
  {
    examId: int("exam_id").notNull().references(() => exams.id),
    position: int("position").notNull(), // 1..180, fixed
    questionId: int("question_id").notNull().references(() => questions.id),
  },
  (t) => [primaryKey({ columns: [t.examId, t.position] }), unique().on(t.examId, t.questionId)],
);

export const attempts = mysqlTable("attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  // An Attempt belongs to either an Exam or a Drill: examId is null exactly when drillSource is set.
  // ponytail: kept by startAttempt/startDrill only (MySQL 5.7 ignores CHECK); add a CHECK once 5.7 is gone
  examId: int("exam_id").references(() => exams.id),
  drillSource: varchar("drill_source", { length: 32 }), // Domain name or Task code, see lib/question-tags.ts
  timed: boolean("timed").notNull().default(false), // Timed Attempt: deadline = startedAt + TIME_LIMIT_MS (lib/attempts.ts)
  startedAt: timestamp("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  submittedAt: datetime("submitted_at"), // null while in progress; not timestamp: MySQL 5.7 makes a nullable timestamp NOT NULL
  score: int("score"), // correct Questions, set on submit
});

export const attemptAnswers = mysqlTable(
  "attempt_answers",
  {
    attemptId: int("attempt_id").notNull().references(() => attempts.id),
    questionId: int("question_id").notNull().references(() => questions.id),
    selected: varchar("selected", { length: 8 }).notNull(), // sorted Choice letters, "" = cleared or never answered
    marked: boolean("marked").notNull().default(false), // Marked Question, for review only: never counts in the Score
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.questionId] })],
);

/** A Drill's Questions, fixed in the order they were picked at start. */
export const drillQuestions = mysqlTable(
  "drill_questions",
  {
    attemptId: int("attempt_id").notNull().references(() => attempts.id),
    position: int("position").notNull(),
    questionId: int("question_id").notNull().references(() => questions.id),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.position] }), unique().on(t.attemptId, t.questionId)],
);
