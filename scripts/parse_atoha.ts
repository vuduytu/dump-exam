/**
 * parse_atoha.ts — đọc bộ đề Atoha (123 file JSON đã crawl) và sinh một file import cho `seedAtoha`.
 *
 * Usage:
 *   npm run atoha:parse -- --source "<thư mục data/atoha-pmp>" [--out data/atoha-import.json]
 *
 * Không crawl, không sửa nguồn: chỉ đọc `_crawler/_manifest.tsv` + `<folder>/<section_slug>__<quiz_slug>.json`.
 * Đáp án được dựng lại từ `feedback` (marker cuối cùng) thay vì dùng `correct` đã lưu, vì bản crawl cũ map sai
 * các đáp án có dấu phẩy / "and" và bỏ trống câu multi-select ("The correct answers are:").
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Choice, Duplicate, Vote } from "@/db/schema";

const ID_BASE = 50_000_000; // ExamTopics uses 1..1250, PgMP 39.9M..42.5M: this range is free

/** ECO task code per ECO number, as declared in data/tasks.json (PMP). Sections without an ECO number have no task. */
const TASK_BY_ECO: Record<string, string> = {
  "1.1": "people-1",
  "1.2": "people-2",
  "1.3": "people-3",
  "1.4": "people-4",
  "1.5": "people-5",
  "1.6": "people-6",
  "1.7": "people-7",
  "1.8": "people-8",
  "2.1": "process-1",
  "2.2": "process-2",
  "2.3": "process-3",
  "2.4": "process-4",
  "2.5": "process-5",
  "2.6": "process-6",
  "2.7": "process-7",
  "2.8": "process-8",
  "2.9": "process-9",
  "2.10": "process-10",
  "3.1": "business-1",
  "3.3": "business-3",
  "3.4": "business-4",
  "3.5": "business-5",
};

type ManifestRow = {
  cmid: string;
  title: string;
  section: string;
  folder: string;
  section_slug: string;
  quiz_slug: string;
  status: string;
};

type RawQuestion = {
  no: number;
  text?: string;
  options?: string[];
  correct?: string | null;
  feedback?: string;
  matching?: unknown;
};

type RawExam = {
  cmid: number;
  title: string;
  section: string;
  questionCount: number;
  questions: RawQuestion[];
};

type AtohaQuestion = {
  id: number;
  position: number;
  text: string;
  choices: Choice[];
  suggestedAnswer: string;
  mostVotedAnswer: string;
  correctAnswer: string;
  votes: Vote[];
  usable: boolean;
  task: string | null;
  explanation: string;
  duplicates: Duplicate[];
};

type AtohaExam = {
  name: string;
  source: string;
  section: string;
  questions: AtohaQuestion[];
};

type AtohaBankFile = {
  bank: "atoha";
  source: string;
  exams: AtohaExam[];
};

const fail = (message: string): never => {
  throw new Error(message);
};

/** Lowercase, unify quotes/dashes, drop a Choice label and the trailing punctuation. `+` and `-` are kept: "- 100" ≠ "+ 100". */
const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[a-g][.)]\s*/, "")
    .replace(/[.,;:\s]+$/, "")
    .trim();

/** Offset just after the last match of `re` in `text`, or -1. The feedback repeats the marker per option, the last one is the answer. */
function lastMarker(text: string, re: RegExp): number {
  let offset = -1;
  let match: RegExpExecArray | null;
  const global = new RegExp(re.source, "gi");
  while ((match = global.exec(text))) offset = match.index + match[0].length;
  return offset;
}

const letterOf = (index: number) => String.fromCharCode(65 + index);

/** Text of a crawled option without its label ("A. ", "b) ", …). */
const withoutLabel = (option: string) => option.replace(/^\s*[a-g][.)]\s+/i, "").trim();

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The site renders Question text and Explanation as HTML (sanitized at import): escape, then keep line breaks. */
const toHtml = (text: string) => escapeHtml(text).replace(/\r\n|\r|\n/g, "<br>");

/**
 * Letters of the Correct Answer, rebuilt from the feedback:
 * one Choice for `The correct answer is:`, several for `The correct answers are:` (comma-separated option texts).
 */
function answerLetters(feedback: string, choices: Choice[]): string[] {
  const multiAt = lastMarker(feedback, /The correct answers are:/);
  const singleAt = lastMarker(feedback, /The correct answer is:/);
  if (multiAt < 0 && singleAt < 0) return [];
  const isMulti = multiAt >= 0;
  const raw = feedback.slice(isMulti ? multiAt : singleAt).trim().replace(/\s+/g, " ").replace(/\.$/, "").trim();
  const hits = (text: string) => choices.filter((c) => norm(c.text) === norm(text)).map((c) => c.letter);
  const whole = hits(raw);
  if (!isMulti) return whole.length === 1 ? whole : [];
  if (whole.length === 1) return whole;
  const parts = raw.split(/,\s+/).map((part) => part.replace(/\.$/, "").trim()).filter(Boolean);
  const letters: string[] = [];
  for (const part of parts) {
    const found = hits(part);
    if (found.length !== 1 || letters.includes(found[0])) return [];
    letters.push(found[0]);
  }
  return letters;
}

const taskOfSection = (section: string) => {
  const eco = section.match(/\(ECO\s+([\d.]+)\)/);
  return eco ? (TASK_BY_ECO[eco[1]] ?? null) : null;
};

/** "ECO 1.2 · Practice Test 1": the crawled title alone repeats across ECO tasks, the section label makes it unique. */
const examName = (section: string, title: string) => {
  const eco = section.match(/\(ECO\s+[\d.]+\)/);
  const label = eco ? eco[0].replace(/[()]/g, "") : section.replace(/\s*\(.*?\)\s*/g, " ").trim();
  return `${label} · ${title}`.slice(0, 64);
};

function readManifest(source: string): ManifestRow[] {
  const file = join(source, "_crawler", "_manifest.tsv");
  if (!existsSync(file)) fail(`manifest not found: ${file}`);
  const [header, ...lines] = readFileSync(file, "utf8").trim().split(/\r?\n/);
  const columns = header.split("\t");
  return lines.map((line) => {
    const cells = line.split("\t");
    return Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ""])) as ManifestRow;
  });
}

function parseExam(source: string, row: ManifestRow, index: number): { exam: AtohaExam; stats: Stats } {
  const stats: Stats = { total: 0, usable: 0, multi: 0, task: 0, matching: 0, noMarker: 0, noMatch: 0, ambiguous: 0 };
  const file = join(source, row.folder, `${row.section_slug}__${row.quiz_slug}.json`);
  if (!existsSync(file)) fail(`missing exam file: ${file}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as RawExam;
  if (String(raw.cmid) !== row.cmid) fail(`${file}: cmid ${raw.cmid} != manifest ${row.cmid}`);
  if (raw.questions.length !== raw.questionCount) {
    console.warn(`WARN ${file}: questionCount ${raw.questionCount} != questions.length ${raw.questions.length}`);
  }
  if (raw.questions.length > 999) fail(`${file}: ${raw.questions.length} questions, id spacing is 1000`);

  const task = taskOfSection(row.section);
  if (task) stats.task++;
  const questions: AtohaQuestion[] = raw.questions.map((item) => {
    stats.total++;
    const choices: Choice[] = (item.options ?? [])
      .map((option) => withoutLabel(option))
      .filter(Boolean)
      .map((text, choiceIndex) => ({ letter: letterOf(choiceIndex), text }));

    let usable = choices.length >= 2 && !item.matching;
    let letters: string[] = [];
    if (!choices.length) stats.matching++;
    else if (usable) {
      letters = answerLetters(item.feedback ?? "", choices);
      const valid = letters.length >= 1 && letters.length <= 8 && letters.every((letter) => choices.some((c) => c.letter === letter));
      if (!valid) {
        usable = false;
        const feedback = item.feedback ?? "";
        if (lastMarker(feedback, /The correct answer(s)? (is|are):/i) < 0) stats.noMarker++;
        else stats.ambiguous++;
      }
    }
    if (usable) {
      stats.usable++;
      if (letters.length > 1) stats.multi++;
    }

    const answer = letters.join("");
    return {
      id: ID_BASE + index * 1000 + item.no,
      position: item.no,
      text: toHtml(item.text ?? ""),
      choices,
      suggestedAnswer: answer,
      mostVotedAnswer: answer,
      correctAnswer: answer,
      votes: [],
      usable,
      task: task ?? null,
      explanation: toHtml(item.feedback ?? ""),
      duplicates: [],
    };
  });

  return {
    exam: { name: examName(row.section, row.title), source: `${row.section_slug}__${row.quiz_slug}`, section: row.section, questions },
    stats,
  };
}

type Stats = { total: number; usable: number; multi: number; task: number; matching: number; noMarker: number; noMatch: number; ambiguous: number };

/** Notes the other copy of a duplicated Question (same text, case/punctuation aside) on both sides. Usable Questions only. */
function linkDuplicates(exams: AtohaExam[]) {
  const groups = new Map<string, { exam: string; number: number }[]>();
  for (const exam of exams) {
    for (const question of exam.questions) {
      if (!question.usable) continue;
      const key = norm(question.text);
      const refs = groups.get(key) ?? [];
      refs.push({ exam: exam.name, number: question.position });
      groups.set(key, refs);
    }
  }
  for (const exam of exams) {
    for (const question of exam.questions) {
      if (!question.usable) continue;
      const refs = groups.get(norm(question.text)) ?? [];
      question.duplicates = refs.filter((ref) => ref.exam !== exam.name || ref.number !== question.position);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const sourceArg = option("--source");
  if (!sourceArg) throw new Error("missing --source <thư mục data/atoha-pmp>");
  const source = resolve(sourceArg);
  const out = resolve(option("--out") ?? "data/atoha-import.json");

  const rows = readManifest(source).filter((row) => row.status === "OK");
  const totals: Stats = { total: 0, usable: 0, multi: 0, task: 0, matching: 0, noMarker: 0, noMatch: 0, ambiguous: 0 };
  const exams: AtohaExam[] = rows.map((row, index) => {
    const { exam, stats } = parseExam(source, row, index);
    for (const key of Object.keys(totals) as (keyof Stats)[]) totals[key] += stats[key];
    return exam;
  });
  linkDuplicates(exams);

  const names = new Set<string>();
  for (const exam of exams) {
    if (names.has(exam.name)) throw new Error(`duplicate Exam name, cannot key Exams by name: ${exam.name}`);
    names.add(exam.name);
  }

  const duplicated = exams.reduce((n, exam) => n + exam.questions.filter((q) => q.duplicates.length > 0).length, 0);
  const payload: AtohaBankFile = { bank: "atoha", source: sourceArg, exams };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(payload), "utf8");

  console.log(
    [
      `exams=${exams.length}`,
      `questions=${totals.total}`,
      `usable=${totals.usable}`,
      `unusable=${totals.total - totals.usable}`,
      `(matching=${totals.matching}, noMarker=${totals.noMarker}, ambiguous=${totals.ambiguous})`,
      `multiSelect=${totals.multi}`,
      `examsWithTask=${totals.task}`,
      `questionsWithDuplicateTwin=${duplicated}`,
      `-> ${out}`,
    ].join(" "),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
