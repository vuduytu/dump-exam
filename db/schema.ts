import { boolean, int, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export type Choice = { letter: string; text: string };
export type Vote = { answer: string; count: number; mostVoted: boolean };

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
