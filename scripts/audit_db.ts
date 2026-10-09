// Usage: npm run audit   (compares data/questions.json with the `questions` table; exits 1 on any difference)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import type { ParsedQuestion } from "@/db/seed";

async function main() {
  const parsed: ParsedQuestion[] = JSON.parse(readFileSync("data/questions.json", "utf8"));
  const rows = new Map((await db.select().from(questions).where(eq(questions.certification, "PMP"))).map((r) => [r.id, r]));
  const problems: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `images` is parser metadata, not a column
  for (const { number, images, ...want } of parsed) {
    const row = rows.get(number);
    rows.delete(number);
    if (!row) { problems.push(`Q${number}: in JSON, missing from DB`); continue; }
    const { id: _id, ...got } = row; // eslint-disable-line @typescript-eslint/no-unused-vars
    for (const field of Object.keys(want) as (keyof typeof want)[]) {
      try { assert.deepEqual(got[field], want[field]); }
      catch { problems.push(`Q${number} ${field}: JSON=${JSON.stringify(want[field])} DB=${JSON.stringify(got[field])}`); }
    }
  }
  for (const id of rows.keys()) problems.push(`Q${id}: in DB, missing from JSON`);
  for (const p of problems) console.log("MISMATCH " + p);
  console.log(`DB rows checked against ${parsed.length} JSON Questions: ${problems.length} mismatches`);
  await db.$client.end();
  process.exit(problems.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
