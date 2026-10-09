import { test } from "node:test";
import assert from "node:assert/strict";
import { attemptCell, formatDuration, inTab, keyCommand, resultCell, toggleChoice } from "@/app/attempts/[id]/logic";

const key = (k: string, extra: Partial<Parameters<typeof keyCommand>[0]> = {}) => keyCommand({ key: k, mod: false, typing: false, dialog: false, repeat: false, composing: false, ...extra });

test("arrow keys move, M marks, a letter picks that Choice in either case", () => {
  assert.deepEqual(key("ArrowLeft"), { type: "prev" });
  assert.deepEqual(key("ArrowRight"), { type: "next" });
  assert.deepEqual(key("m"), { type: "mark" });
  assert.deepEqual(key("M"), { type: "mark" });
  assert.deepEqual(key("c"), { type: "choice", letter: "C" });
  assert.deepEqual(key("E"), { type: "choice", letter: "E" });
});

test("other keys, modifiers, typing and an open Dialog are ignored", () => {
  assert.equal(key("f"), null);
  assert.equal(key("Enter"), null);
  assert.equal(key("a", { mod: true }), null);
  assert.equal(key("ArrowRight", { typing: true }), null);
  assert.equal(key("m", { dialog: true }), null);
  assert.equal(key("a", { composing: true }), null); // IME
  assert.equal(key("ArrowLeft", { composing: true }), null);
});

test("a held letter or M acts once; a held arrow keeps moving", () => {
  assert.equal(key("a", { repeat: true }), null);
  assert.equal(key("m", { repeat: true }), null);
  assert.deepEqual(key("ArrowRight", { repeat: true }), { type: "next" });
});

test("single-answer Question: a letter replaces the selection", () => {
  assert.deepEqual(toggleChoice([], "B", 1), ["B"]);
  assert.deepEqual(toggleChoice(["A"], "B", 1), ["B"]);
  assert.deepEqual(toggleChoice(["B"], "B", 1), ["B"]); // a radio stays picked
});

test("multi-answer Question: a letter toggles, capped at need", () => {
  assert.deepEqual(toggleChoice(["A"], "C", 2), ["A", "C"]);
  assert.deepEqual(toggleChoice(["A", "C"], "A", 2), ["C"]);
  assert.deepEqual(toggleChoice(["A", "C"], "D", 2), ["A", "C"]); // full: unchanged
});

test("grid cell: marked wins over answered, a mark alone is not an answer", () => {
  assert.equal(attemptCell({ selected: [], marked: false }), "unanswered");
  assert.equal(attemptCell({ selected: ["A"], marked: false }), "answered");
  assert.equal(attemptCell({ selected: ["A"], marked: true }), "marked");
  assert.equal(attemptCell({ selected: [], marked: true }), "marked");
});

test("result cell: green/red by correctness (blank is wrong), the mark is a border on top", () => {
  assert.deepEqual(resultCell({ isCorrect: true, marked: false }), { correct: true, marked: false });
  assert.deepEqual(resultCell({ isCorrect: false, marked: true }), { correct: false, marked: true });
});

test("result tabs: all, wrong only, marked only", () => {
  const q = { isCorrect: true, marked: false };
  assert.equal(inTab(undefined, q), true);
  assert.equal(inTab("wrong", q), false);
  assert.equal(inTab("wrong", { ...q, isCorrect: false }), true);
  assert.equal(inTab("marked", q), false);
  assert.equal(inTab("marked", { ...q, marked: true }), true);
});

test("duration: under a minute, minutes, hours and minutes, exact hours", () => {
  const f = (min: number, sec = 0) => formatDuration(min * 60 + sec);
  assert.equal(f(0), "< 1 phút");
  assert.equal(f(0, 59), "< 1 phút");
  assert.equal(f(1), "1 phút");
  assert.equal(f(12), "12 phút");
  assert.equal(f(60), "1 giờ");
  assert.equal(f(83), "1 giờ 23 phút");
  assert.equal(f(120), "2 giờ");
  assert.equal(f(230), "3 giờ 50 phút");
});
