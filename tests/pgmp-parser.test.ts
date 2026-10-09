import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PgmpQuestion } from "@/db/seed";

const FIXTURES = "tests/fixtures/pgmp";
const EARLY = "6_6_2024 9_59_00 AM";
const LATE = "6_6_2024 11_05_01 AM";

function parse(dir: string) {
  const out = join(mkdtempSync(join(tmpdir(), "pgmp-")), "pgmp.json");
  const run = spawnSync("python3", ["-I", "scripts/parse_pgmp.py", dir, out]);
  return { status: run.status, stdout: run.stdout.toString(), out };
}

const { stdout, out } = parse(FIXTURES);
const all: PgmpQuestion[] = JSON.parse(readFileSync(out, "utf8"));
const q = (exam: string, n: number) => all.find((x) => x.source === exam && x.number === n)!;

test("one Exam per file in file-name time order, numbers kept, id = seconds of the day * 1000 + number", () => {
  assert.deepEqual(all.map((x) => [x.source, x.number, x.id]), [
    [EARLY, 1, 35_940_001], [EARLY, 2, 35_940_002], [EARLY, 3, 35_940_003], // 9:59:00 = 35,940 s
    [LATE, 1, 39_901_001], [LATE, 2, 39_901_002], [LATE, 3, 39_901_003], // 11:05:01 = 39,901 s
  ]);
  assert.ok(all.every((x) => x.certification === "PgMP"));
});

test("answers match by Choice text: noise lines, lowercase letters, commas in a Choice, 3 and 6 Choices", () => {
  assert.equal(q(EARLY, 1).text, "Which document authorizes the program?"); // leading ": " dropped
  assert.equal(q(EARLY, 1).correctAnswer, "A");
  assert.deepEqual(q(EARLY, 2).choices.map((c) => c.letter), ["A", "B", "C", "D"]);
  assert.equal(q(EARLY, 2).choices[0].text, "Cost, schedule, and quality");
  assert.equal(q(EARLY, 2).correctAnswer, "AC");
  assert.equal(q(EARLY, 3).choices.length, 3);
  assert.equal(q(EARLY, 3).correctAnswer, "B");
  assert.deepEqual(q(LATE, 2).choices.map((c) => c.letter), ["A", "B", "C", "D", "E", "F"]);
  assert.equal(q(LATE, 2).choices[2].text, "Setup &amp; tuning"); // entity decoded, then escaped once
  assert.equal(q(LATE, 2).correctAnswer, "C");
  for (const x of all) assert.equal(x.suggestedAnswer, x.correctAnswer);
});

test("Explanation keeps the reasoning without noise or the Explanation: heading; null when absent", () => {
  assert.equal(q(EARLY, 1).explanation, "Correct answer is A: The charter authorizes the program. Reference page 1");
  assert.equal(q(EARLY, 2).explanation, "Answers A and C are correct.");
  assert.equal(q(EARLY, 3).explanation, null);
  assert.equal(q(LATE, 2).explanation, null);
});

test("a Question without an answer is an Unusable Question", () => {
  assert.equal(q(LATE, 3).usable, false);
  assert.equal(q(LATE, 3).correctAnswer, "");
  assert.equal(all.filter((x) => !x.usable).length, 1);
  assert.match(stdout, /2 Exams, 6 Questions, 1 Unusable, .* 0 failures/);
});

test("Duplicate Question: same stem ignoring case and punctuation, pointing at usable Questions only", () => {
  assert.deepEqual(q(EARLY, 3).duplicates, [{ exam: LATE, number: 1 }]);
  assert.deepEqual(q(LATE, 1).duplicates, [{ exam: EARLY, number: 3 }]);
  assert.equal(q(EARLY, 1).duplicates, null);
});

test("an answer line that matches no Choice fails the parse, is reported, and writes nothing", () => {
  const dir = mkdtempSync(join(tmpdir(), "pgmp-bad-"));
  copyFileSync(join(FIXTURES, `${EARLY}.txt`), join(dir, `${EARLY}.txt`));
  writeFileSync(join(dir, `${LATE}.txt`), "Question 1\r\nWho?\r\nA. Me\r\nB. You\r\nThe correct answer is: Them\r\n");
  const bad = parse(dir);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /1 failures -> nothing written/);
  assert.match(bad.stdout, /FAIL no Choice matches 6_6_2024 11_05_01 AM · Câu 1: 'Them'/);
  assert.equal(existsSync(bad.out), false);
});

test("two files at the same time of day would share ids: the parse fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "pgmp-clash-"));
  copyFileSync(join(FIXTURES, `${EARLY}.txt`), join(dir, `${EARLY}.txt`));
  copyFileSync(join(FIXTURES, `${EARLY}.txt`), join(dir, "6_7_2024 9_59_00 AM.txt"));
  const bad = parse(dir);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /FAIL PgMP ids collide/);
  assert.equal(existsSync(bad.out), false);
});

test("the committed data/pgmp-questions.json has 22 Exams and 3,023 Questions, 10 Unusable", () => {
  const real: PgmpQuestion[] = JSON.parse(readFileSync("data/pgmp-questions.json", "utf8"));
  assert.equal(new Set(real.map((x) => x.source)).size, 22);
  assert.equal(real.length, 3023);
  assert.equal(real.filter((x) => !x.usable).length, 10);
});
