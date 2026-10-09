import { sql } from "drizzle-orm";
import { boolean, int, json, mysqlTable, primaryKey, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

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
