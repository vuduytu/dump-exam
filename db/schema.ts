import { boolean, int, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

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
