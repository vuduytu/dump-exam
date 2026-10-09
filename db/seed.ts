import { sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, type Choice, type Vote } from "@/db/schema";

/** One entry of data/questions.json, as written by scripts/parse_html.py. */
export type ParsedQuestion = {
  number: number;
  text: string;
  choices: Choice[];
  suggestedAnswer: string;
  mostVotedAnswer: string;
  correctAnswer: string;
  votes: Vote[];
  usable: boolean;
};

/** Upserts Questions by original number, so re-running never duplicates. */
export async function seedQuestions(parsed: ParsedQuestion[]) {
  const rows = parsed.map(({ number, text, choices, suggestedAnswer, mostVotedAnswer, correctAnswer, votes, usable }) => ({
    id: number, text, choices, suggestedAnswer, mostVotedAnswer, correctAnswer, votes, usable,
  }));
  for (let i = 0; i < rows.length; i += 200) { // keep each insert under MySQL's max_allowed_packet
    await db.insert(questions).values(rows.slice(i, i + 200)).onDuplicateKeyUpdate({
      set: {
        text: sql`values(${questions.text})`,
        choices: sql`values(${questions.choices})`,
        suggestedAnswer: sql`values(${questions.suggestedAnswer})`,
        mostVotedAnswer: sql`values(${questions.mostVotedAnswer})`,
        correctAnswer: sql`values(${questions.correctAnswer})`,
        votes: sql`values(${questions.votes})`,
        usable: sql`values(${questions.usable})`,
      },
    });
  }
}
