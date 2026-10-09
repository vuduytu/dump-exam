// Usage: npm run db:seed   (reads data/questions.json from scripts/parse_html.py and data/question-tags.json; needs ADMIN_PASSWORD)
import { readFileSync } from "node:fs";
import { db } from "@/db";
import { generateExams, seedAdmin, seedQuestions, seedTags } from "@/db/seed";

async function main() {
  if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is not set"); // fail before touching the DB
  const parsed = JSON.parse(readFileSync("data/questions.json", "utf8"));
  await seedQuestions(parsed);
  console.log(`${parsed.length} Questions upserted`);
  await seedTags(JSON.parse(readFileSync("data/question-tags.json", "utf8")));
  console.log("Task and Approach set from data/question-tags.json");
  console.log((await generateExams()) ? "Exams created" : "Exams already exist");
  console.log((await seedAdmin()) ? "Admin created" : "Admin already exists");
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
