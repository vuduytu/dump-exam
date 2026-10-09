// Usage: tsx scripts/tags.ts split | merge
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { validateTags, type Tag } from "@/lib/question-tags";
import taxonomy from "@/data/tasks.json";

type Q = { number: number; text: string; choices: { letter: string; text: string }[]; usable: boolean };
const questions: Q[] = JSON.parse(readFileSync("data/questions.json", "utf8"));
const strip = (s: string) =>
  s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

const LOTS = 13;
const cmd = process.argv[2];

if (cmd === "split") {
  mkdirSync("data/tags/input", { recursive: true });
  const size = Math.ceil(questions.length / LOTS);
  for (let i = 0; i < LOTS; i++) {
    const items = questions.slice(i * size, (i + 1) * size).map((q) => ({
      id: q.number,
      text: strip(q.text),
      choices: q.choices.map((c) => `${c.letter}. ${strip(c.text)}`),
    }));
    writeFileSync(`data/tags/input/lot-${String(i + 1).padStart(2, "0")}.json`, JSON.stringify(items, null, 1));
  }
  console.log(`wrote ${LOTS} lots (~${size} questions each) to data/tags/input/`);
} else if (cmd === "merge") {
  const files = existsSync("data/tags") ? readdirSync("data/tags").filter((f) => /^lot-\d+\.json$/.test(f)).sort() : [];
  const tags: Tag[] = files.flatMap((f) => JSON.parse(readFileSync(`data/tags/${f}`, "utf8")));
  const errors = validateTags(questions.map((q) => q.number), tags);
  if (errors.length) {
    console.error(`${errors.length} error(s) from ${files.length} lot file(s):\n` + errors.slice(0, 100).join("\n"));
    process.exit(1);
  }
  tags.sort((a, b) => a.id - b.id);
  writeFileSync("data/question-tags.json", JSON.stringify(tags, null, 1) + "\n");

  const byId = new Map(questions.map((q) => [q.number, q]));
  const task = new Map(taxonomy.tasks.map((t) => [t.code, t]));
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const usable = tags.filter((t) => byId.get(t.id)!.usable);
  console.log(`merged ${tags.length} tags (${usable.length} usable) -> data/question-tags.json`);
  console.log("\nUsable per Domain:");
  for (const [k, v] of count(usable.map((t) => task.get(t.task)!.domain))) console.log(`  ${k}: ${v}`);
  console.log("\nUsable per Task:");
  const perTask = count(usable.map((t) => t.task));
  for (const t of taxonomy.tasks) console.log(`  ${t.code} ${t.name}: ${perTask.get(t.code) ?? 0}`);
  console.log("\nPer Approach (all questions):");
  for (const [k, v] of count(tags.map((t) => t.approach))) console.log(`  ${k}: ${v}`);
  const low = tags.filter((t) => t.confidence === "low");
  console.log(`\nLow confidence: ${low.length}`);

  // seeded PRNG (mulberry32) so the sample is reproducible
  let s = 20261009;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rest = tags.filter((t) => t.confidence !== "low");
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const row = (t: Tag) => {
    const text = strip(byId.get(t.id)!.text).replace(/\s+/g, " ");
    const tk = task.get(t.task)!;
    return `- **#${t.id}** \`${t.task}\` ${tk.name} · ${t.approach} · ${t.confidence}\n  ${text.length > 200 ? text.slice(0, 200) + "…" : text}`;
  };
  const md = `# Review: nhãn Task / Approach\n\n## Low confidence (${low.length})\n\n${low.map(row).join("\n")}\n\n## 30 random others\n\n${rest.slice(0, 30).sort((a, b) => a.id - b.id).map(row).join("\n")}\n`;
  writeFileSync(".scratch/domain-practice/review.md", md);
  console.log("\nwrote .scratch/domain-practice/review.md");
} else {
  console.error("usage: tsx scripts/tags.ts split|merge");
  process.exit(2);
}
