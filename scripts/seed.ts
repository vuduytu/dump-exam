// Usage: npm run db:seed   (reads data/questions.json, produced by scripts/parse_html.py; needs ADMIN_PASSWORD)
import { readFileSync } from "node:fs";
import { db } from "@/db";
import { seedAdmin, seedQuestions } from "@/db/seed";

async function main() {
  const parsed = JSON.parse(readFileSync("data/questions.json", "utf8"));
  await seedQuestions(parsed);
  console.log(`${parsed.length} Questions upserted`);
  console.log((await seedAdmin()) ? "Admin created" : "Admin already exists");
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
