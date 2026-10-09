import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ParsedQuestion } from "@/db/seed";

const ALLOWED = new Set(["br", "img", "b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "sub", "sup"]);

function parseFixture() {
  const out = join(mkdtempSync(join(tmpdir(), "parser-")), "questions.json");
  execFileSync("python3", ["-I", "scripts/parse_html.py", "tests/fixtures/examtopics-sample.html", out]);
  const questions: ParsedQuestion[] = JSON.parse(readFileSync(out, "utf8"));
  return new Map(questions.map((q) => [q.number, q]));
}

const questions = parseFixture();
const q = (n: number) => questions.get(n)!;

test("parses every card, keeping the original Question number", () => {
  assert.deepEqual([...questions.keys()], [1, 16, 57, 172, 1140]);
});

test("single-answer Question: Choices, Suggested, Most Voted and Correct Answer", () => {
  assert.deepEqual(q(1).choices.map((c) => c.letter), ["A", "B", "C", "D"]);
  assert.equal(q(1).choices[0].text, "Consult the risk register for an appropriate planned risk response and implement.");
  assert.equal(q(1).suggestedAnswer, "A");
  assert.equal(q(1).mostVotedAnswer, "A");
  assert.equal(q(1).correctAnswer, "A");
  assert.deepEqual(q(1).votes[0], { answer: "A", count: 100, mostVoted: true });
  assert.equal(q(1).usable, true);
});

test("multi-answer Question keeps all letters of the Correct Answer", () => {
  assert.equal(q(57).choices.length, 5);
  assert.equal(q(57).correctAnswer, "AC");
  assert.equal(q(57).usable, true);
});

test("drag-drop Question without Choices is an Unusable Question", () => {
  assert.deepEqual(q(172).choices, []);
  assert.equal(q(172).correctAnswer, "");
  assert.equal(q(172).usable, false);
});

test("images point to the local /media path", () => {
  assert.match(q(16).text, /<img src="\/media\/0000900001\.png">/);
  assert.doesNotMatch(q(16).text, /examtopics|assets/);
});

test("Correct Answer falls back to Suggested Answer when there is no Most Voted Answer", () => {
  assert.equal(q(1140).mostVotedAnswer, "");
  assert.equal(q(1140).suggestedAnswer, "B");
  assert.equal(q(1140).correctAnswer, "B");
  assert.equal(q(1140).usable, true);
});

test("text and Choices keep only whitelisted tags, without attributes or script content", () => {
  for (const question of questions.values()) {
    for (const html of [question.text, ...question.choices.map((c) => c.text)]) {
      for (const [, name] of html.matchAll(/<\/?([a-zA-Z0-9]+)/g)) assert.ok(ALLOWED.has(name), `<${name}> in Q${question.number}`);
      assert.doesNotMatch(html, /<(?!img src="\/media\/)[a-z]+ [^>]*>/, `attribute in Q${question.number}`);
    }
  }
  assert.doesNotMatch(q(1140).text, /alert/);
  assert.match(q(1140).text, /How <em>should<\/em>/);
});
