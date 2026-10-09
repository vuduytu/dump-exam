import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

/** One entry of data/questions.json, as written by scripts/parse_html.py. */
export type ParsedQuestion = Omit<typeof questions.$inferInsert, "id"> & { number: number; images?: string[] };

/** Upserts Questions by original number, so re-running never duplicates. */
export async function seedQuestions(parsed: ParsedQuestion[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `images` is parser metadata, not a column
  const rows = parsed.map(({ number, images, ...rest }) => ({ id: number, ...rest }));
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

export const ADMIN_EMAIL = "admin@dump-exam.local";

/** Creates the Admin with password ADMIN_PASSWORD, only if the Admin does not exist yet. */
export async function seedAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set: it is the initial password of " + ADMIN_EMAIL);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, ADMIN_EMAIL));
  if (existing) return false;
  await db.insert(users).values({ email: ADMIN_EMAIL, passwordHash: await hashPassword(password), isAdmin: true });
  return true;
}
