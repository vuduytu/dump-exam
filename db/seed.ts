import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { examQuestions, exams, questions, users, type Certification } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { validateTags, type Tag } from "@/lib/question-tags";

/** One entry of data/questions.json, as written by scripts/parse_html.py. */
export type ParsedQuestion = Omit<typeof questions.$inferInsert, "id"> & { number: number; images?: string[] };

/** One entry of data/pgmp-questions.json, as written by scripts/parse_pgmp.py: already a `questions` row. */
export type PgmpQuestion = typeof questions.$inferInsert;

/** Upserts Questions by id, so re-running never duplicates. */
async function upsertQuestions(rows: (typeof questions.$inferInsert)[]) {
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
        explanation: sql`values(${questions.explanation})`,
        duplicates: sql`values(${questions.duplicates})`,
      },
    });
  }
}

/** Upserts PMP Questions by original number. */
export async function seedQuestions(parsed: ParsedQuestion[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `images` is parser metadata, not a column
  await upsertQuestions(parsed.map(({ number, images, ...rest }) => ({ id: number, ...rest })));
}

/**
 * Upserts the PgMP Questions, then creates one Exam per dump file that has no Exam yet, in file order (the parser sorts
 * the files by the time in their name). Usable Questions only, each at its number in the file. An existing Exam is never
 * rewritten (it may have Attempts): if its Questions differ from the bank, this throws. Returns the Exams created.
 */
export async function seedPgmp(parsed: PgmpQuestion[]) {
  if (parsed.some((q) => q.certification !== "PgMP")) throw new Error("not a PgMP Question bank");
  const files = [...Map.groupBy(parsed, (q) => q.source!)].map(([name, qs]) => ({
    name,
    items: qs.filter((q) => q.usable).map((q) => ({ position: q.number!, questionId: q.id })),
  }));
  const existing = await db
    .select({ name: exams.name, item: { position: examQuestions.position, questionId: examQuestions.questionId } })
    .from(exams)
    .innerJoin(examQuestions, eq(examQuestions.examId, exams.id))
    .where(eq(exams.certification, "PgMP"))
    .orderBy(exams.id, examQuestions.position);
  const seeded = Map.groupBy(existing, (r) => r.name);
  const changed = files.filter((f) => seeded.has(f.name) && JSON.stringify(seeded.get(f.name)!.map((r) => r.item)) !== JSON.stringify(f.items));
  if (changed.length) throw new Error(`PgMP Exams differ from the bank, not rewritten: ${changed.map((f) => f.name).join(", ")}`);
  await upsertQuestions(parsed);
  const fresh = files.filter((f) => !seeded.has(f.name));
  // ponytail: Exam order = insert order (exams.id), so a file added later shows last even if its time is earlier; sort by name-time if that happens
  await db.transaction(async (tx) => {
    for (const { name, items } of fresh) {
      const [{ insertId }] = await tx.insert(exams).values({ name, certification: "PgMP" });
      await tx.insert(examQuestions).values(items.map((it) => ({ examId: insertId, ...it })));
    }
  });
  return fresh.length;
}

/**
 * Sets each Question's Task (and Approach, PMP only) of the Certification from data/question-tags.json (PMP) or
 * data/pgmp-question-tags.json (PgMP). Refuses invalid or incomplete tags.
 * Overwrites, so re-running after the owner corrects labels applies the corrections and never duplicates.
 */
export async function seedTags(tags: Tag[], certification: Certification) {
  const ids = (await db.select({ id: questions.id }).from(questions).where(eq(questions.certification, certification))).map((q) => q.id);
  const errors = validateTags(ids, tags, certification);
  if (errors.length) throw new Error(`invalid tags:\n${errors.slice(0, 20).join("\n")}`);
  const groups = Map.groupBy(tags, (t) => `${t.task}|${t.approach ?? ""}`); // one UPDATE per pair, not per Question
  await db.transaction(async (tx) => {
    for (const [key, group] of groups) {
      const [task, approach] = key.split("|");
      await tx.update(questions).set({ task, approach: approach || null }).where(inArray(questions.id, group.map((t) => t.id)));
    }
  });
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

const EXAM_SIZE = 180;
const SHUFFLE_SEED = 20240601; // fixed: the Exams must never change

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates the fixed PMP Exams once: usable Questions shuffled by a seeded PRNG, cut into groups of 180.
 *  A short last group is topped up with the first Questions of the shuffle. Returns false if Exams exist. */
export async function generateExams() {
  const [existing] = await db.select({ id: exams.id }).from(exams).where(eq(exams.certification, "PMP")).limit(1);
  if (existing) return false;
  const ids = (await db.select({ id: questions.id }).from(questions).where(and(eq(questions.certification, "PMP"), eq(questions.usable, true))).orderBy(questions.id)).map((q) => q.id);
  const random = mulberry32(SHUFFLE_SEED);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const groups: number[][] = [];
  for (let i = 0; i < ids.length; i += EXAM_SIZE) groups.push(ids.slice(i, i + EXAM_SIZE));
  const last = groups[groups.length - 1];
  if (last && last.length < EXAM_SIZE) last.push(...ids.slice(0, EXAM_SIZE - last.length)); // ids[0..] are in earlier groups, so never in `last`
  await db.transaction(async (tx) => {
    for (const [i, group] of groups.entries()) {
      const [{ insertId }] = await tx.insert(exams).values({ name: `Đề ${i + 1}` });
      await tx.insert(examQuestions).values(group.map((questionId, p) => ({ examId: insertId, position: p + 1, questionId })));
    }
  });
  return true;
}
