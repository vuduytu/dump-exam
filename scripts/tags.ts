// Usage: tsx scripts/tags.ts split|merge [PMP|PgMP]   (default PMP)
//        tsx scripts/tags.ts agree   (PgMP only: agreement with the old ECO labels in the Explanations, reference only)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tasksOf, validateTags, type Tag } from "@/lib/question-tags";
import type { Certification } from "@/db/schema";

type Q = { id: number; text: string; correctAnswer: string; choices: { letter: string; text: string }[]; usable: boolean; source?: string; number: number; explanation?: string | null };
type Labelled = Tag & { reason?: string };
type TaskDef = ReturnType<typeof tasksOf>[number];
const strip = (s: string) =>
  s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const SEED = 20261009; // mulberry32 seed of the random review sample

const cmd = process.argv[2];
const certification = (cmd === "agree" ? "PgMP" : process.argv[3] ?? "PMP") as Certification;
const cfg = {
  PMP: {
    bank: "data/questions.json", dir: "data/tags", out: "data/question-tags.json", review: ".scratch/domain-practice/review.md", lots: 13,
    withAnswer: false,
    hasApproach: true,
    title: "# Review: nhãn Task / Approach",
    row: (t: Labelled, q: Q, tk: TaskDef, text: string) => `- **#${t.id}** \`${t.task}\` ${tk.name} · ${t.approach} · ${t.confidence}\n  ${text.length > 200 ? text.slice(0, 200) + "…" : text}`,
  },
  PgMP: {
    bank: "data/pgmp-questions.json", dir: "data/tags/pgmp", out: "data/pgmp-question-tags.json", review: ".scratch/pgmp/review-labels.md", lots: 25,
    withAnswer: true, // PgMP lots are labelled with the Correct Answer in view
    hasApproach: false,
    title: `# Duyệt nhãn Task PgMP\n\nSửa nhãn sai trong \`data/tags/pgmp/lot-NN.json\` rồi chạy lại \`npx tsx scripts/tags.ts merge PgMP\`. Mẫu ngẫu nhiên lấy bằng mulberry32, seed ${SEED}.\n\nKhác với các lô PMP, người gắn nhãn PgMP được xem chữ cái của Correct Answer (không xem Explanation).`,
    row: (t: Labelled, q: Q, tk: TaskDef, text: string) => `- **${q.source} · Câu ${q.number}** (id ${t.id}) → \`${t.task}\` ${tk.domain} · ${tk.name} · ${t.confidence}\n  - Lý do: ${t.reason ?? "—"}\n  - Câu hỏi: ${text}`,
  },
}[certification];
if (!cfg) throw new Error(`unknown Certification ${certification}`);

// PMP entries have no id: their id is the ExamTopics number
const questions: Q[] = JSON.parse(readFileSync(cfg.bank, "utf8")).map((q: Q) => ({ ...q, id: q.id ?? q.number }));
const tasks = tasksOf(certification);

if (cmd === "split") {
  mkdirSync(`${cfg.dir}/input`, { recursive: true });
  const size = Math.ceil(questions.length / cfg.lots);
  for (let i = 0; i < cfg.lots; i++) {
    const items = questions.slice(i * size, (i + 1) * size).map((q) => ({
      id: q.id,
      text: strip(q.text),
      choices: q.choices.map((c) => `${c.letter}. ${strip(c.text)}`),
      ...(cfg.withAnswer && { answer: q.correctAnswer }),
    }));
    writeFileSync(`${cfg.dir}/input/lot-${String(i + 1).padStart(2, "0")}.json`, JSON.stringify(items, null, 1));
  }
  console.log(`wrote ${cfg.lots} lots (~${size} questions each) to ${cfg.dir}/input/`);
} else if (cmd === "merge") {
  const files = existsSync(cfg.dir) ? readdirSync(cfg.dir).filter((f) => /^lot-\d+\.json$/.test(f)).sort() : [];
  const tags: Labelled[] = files.flatMap((f) => JSON.parse(readFileSync(`${cfg.dir}/${f}`, "utf8")));
  const errors = validateTags(questions.map((q) => q.id), tags, certification);
  if (errors.length) {
    console.error(`${errors.length} error(s) from ${files.length} lot file(s):\n` + errors.slice(0, 100).join("\n"));
    process.exit(1);
  }
  tags.sort((a, b) => a.id - b.id);
  writeFileSync(cfg.out, JSON.stringify(tags, null, 1) + "\n");

  const byId = new Map(questions.map((q) => [q.id, q]));
  const task = new Map(tasks.map((t) => [t.code, t]));
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const usable = tags.filter((t) => byId.get(t.id)!.usable);
  console.log(`merged ${tags.length} tags (${usable.length} usable) -> ${cfg.out}`);
  console.log("\nUsable per Domain:");
  for (const [k, v] of count(usable.map((t) => task.get(t.task)!.domain))) console.log(`  ${k}: ${v}`);
  console.log("\nUsable per Task:");
  const perTask = count(usable.map((t) => t.task));
  for (const t of tasks) console.log(`  ${t.code} ${t.name}: ${perTask.get(t.code) ?? 0}`);
  if (cfg.hasApproach) {
    console.log("\nPer Approach (all questions):");
    for (const [k, v] of count(tags.map((t) => t.approach!))) console.log(`  ${k}: ${v}`);
  }
  const low = tags.filter((t) => t.confidence === "low");
  console.log(`\nLow confidence: ${low.length}`);

  // seeded PRNG (mulberry32) so the sample is reproducible
  let s = SEED;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rest = tags.filter((t) => t.confidence !== "low");
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const row = (t: Labelled) => {
    const q = byId.get(t.id)!;
    return cfg.row(t, q, task.get(t.task)!, strip(q.text).replace(/\s+/g, " "));
  };
  const md = `${cfg.title}\n\n## Low confidence (${low.length})\n\n${low.map(row).join("\n")}\n\n## 30 random others\n\n${rest.slice(0, 30).sort((a, b) => a.id - b.id).map(row).join("\n")}\n`;
  writeFileSync(cfg.review, md);
  console.log(`\nwrote ${cfg.review}`);
} else if (cmd === "agree") {
  // The 3 dump files of 150 Questions carry "Exam Objectives: ... <br>2.30 Task 30: ..." (ECO 2011 numbering = ECO 2024 numbering)
  const files = ["6_6_2024 11_16_20 AM", "6_6_2024 11_19_40 AM", "6_6_2024 11_22_10 AM"];
  const prefix = ["strategy", "lifecycle", "benefits", "stakeholder", "governance"];
  const tags = new Map((JSON.parse(readFileSync(cfg.out, "utf8")) as Tag[]).map((t) => [t.id, t.task]));
  const pool = questions.filter((q) => files.includes(q.source!));
  const old = new Map<number, string[]>();
  for (const q of pool) {
    const codes = [...(q.explanation ?? "").matchAll(/(?:^|<br>)\s*([1-5])\.([1-9]\d*)\s/g)].map((m) => `${prefix[+m[1] - 1]}-${+m[2]}`);
    if (codes.length) old.set(q.id, codes);
  }
  const domain = (code: string) => code.split("-")[0];
  const pct = (n: number) => `${n}/${old.size} (${((n / old.size) * 100).toFixed(1)}%)`;
  const sameTask = [...old].filter(([id, codes]) => codes.includes(tags.get(id)!)).length;
  const sameDomain = [...old].filter(([id, codes]) => codes.map(domain).includes(domain(tags.get(id)!))).length;
  console.log(`${pool.length} Questions in the 3 files, ${old.size} with an old ECO label`);
  console.log(`Task agreement: ${pct(sameTask)}\nDomain agreement: ${pct(sameDomain)}`);
  console.log(`No "Exam Objectives" line (only Lesson/Objective): ${pool.filter((q) => !old.has(q.id)).map((q) => q.id).join(", ")}`);
} else {
  console.error("usage: tsx scripts/tags.ts split|merge [PMP|PgMP] | agree");
  process.exit(2);
}
