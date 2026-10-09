// Usage: npm run db:seed   (reads data/questions.json, produced by scripts/parse_html.py)
import { readFileSync } from "node:fs";
import { db } from "@/db";
import { seedQuestions } from "@/db/seed";

async function main() {
  const parsed = JSON.parse(readFileSync("data/questions.json", "utf8"));
  await seedQuestions(parsed);
  console.log(`${parsed.length} Questions upserted`);
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
