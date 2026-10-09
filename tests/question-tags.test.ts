import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTags } from "@/lib/question-tags";

const ok = (id: number) => ({ id, task: "process-3", approach: "agile", confidence: "high" });

test("valid tags give no errors", () => {
  assert.deepEqual(validateTags([1, 2], [ok(2), ok(1)]), []);
});

test("reports missing, duplicate, unknown ids and invalid values", () => {
  const errors = validateTags([1, 2, 3], [ok(1), ok(1), ok(9), { id: 2, task: "x-1", approach: "waterfall", confidence: "meh" }]);
  assert.deepEqual(errors, [
    "unknown id 9",
    'id 2: invalid task "x-1"',
    'id 2: invalid approach "waterfall"',
    'id 2: invalid confidence "meh"',
    "duplicate id 1 (x2)",
    "missing id 3",
  ]);
});
