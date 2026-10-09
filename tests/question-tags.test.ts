import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { domainScores, tasksOfSource, validateTags } from "@/lib/question-tags";

const ok = (id: number) => ({ id, task: "process-3", approach: "agile", confidence: "high" });

test("valid tags give no errors", () => {
  assert.deepEqual(validateTags([1, 2], [ok(2), ok(1)], "PMP"), []);
});

test("reports missing, duplicate, unknown ids and invalid values", () => {
  const errors = validateTags([1, 2, 3], [ok(1), ok(1), ok(9), { id: 2, task: "x-1", approach: "waterfall", confidence: "meh" }], "PMP");
  assert.deepEqual(errors, [
    "unknown id 9",
    'id 2: invalid task "x-1"',
    'id 2: invalid approach "waterfall"',
    'id 2: invalid confidence "meh"',
    "duplicate id 1 (x2)",
    "missing id 3",
  ]);
});

test("domainScores: correct / Questions per Domain, untagged Questions left out, empty Domains omitted", () => {
  const q = (task: string | null, correct: boolean) => ({ task, correct });
  assert.deepEqual(domainScores([q("people-1", true), q("people-2", false), q("process-3", true), q(null, true)]), [
    { domain: "People", correct: 1, total: 2 },
    { domain: "Process", correct: 1, total: 1 },
  ]);
});

test("PgMP tags: PgMP Tasks only, no Approach", () => {
  const pg = (id: number, extra = {}) => ({ id, task: "governance-3", confidence: "low", ...extra });
  assert.deepEqual(validateTags([1], [pg(1)], "PgMP"), []);
  assert.deepEqual(validateTags([1, 2], [pg(1, { task: "process-3" }), pg(2, { approach: "agile" })], "PgMP"), [
    'id 1: invalid task "process-3"',
    'id 2: invalid approach "agile"',
  ]);
  assert.deepEqual(validateTags([1], [{ id: 1, task: "governance-3", approach: "agile", confidence: "high" }], "PMP"), ['id 1: invalid task "governance-3"']);
});

test("tasksOfSource stays within the Certification", () => {
  assert.equal(tasksOfSource("PgMP", "Benefits Management").length, 8);
  assert.deepEqual(tasksOfSource("PgMP", "lifecycle-30"), ["lifecycle-30"]);
  assert.deepEqual(tasksOfSource("PgMP", "People"), []);
  assert.deepEqual(tasksOfSource("PMP", "governance-1"), []);
  assert.equal(tasksOfSource("PMP", "People").length, 8);
});

test("domainScores of a PgMP Attempt use the PgMP Domains", () => {
  assert.deepEqual(domainScores([{ task: "governance-1", correct: true }, { task: "strategy-2", correct: false }]), [
    { domain: "Strategic Program Alignment", correct: 0, total: 1 },
    { domain: "Governance", correct: 1, total: 1 },
  ]);
});

test("data/pgmp-question-tags.json: every PgMP Question has one PgMP Task and no Approach", () => {
  const ids = JSON.parse(readFileSync("data/pgmp-questions.json", "utf8")).map((q: { id: number }) => q.id);
  assert.deepEqual(validateTags(ids, JSON.parse(readFileSync("data/pgmp-question-tags.json", "utf8")), "PgMP"), []);
});
