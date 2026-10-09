// Pure rules of the Attempt screen, kept out of React so node:test can check them.

export type Command = { type: "prev" | "next" | "mark" } | { type: "choice"; letter: string };

/**
 * Keyboard shortcut → command. `mod`: Ctrl/Meta/Alt/Shift held; `typing`: focus in a text field; `dialog`: a Dialog/Sheet
 * is open; `composing`: IME composition; `repeat`: key held down (only arrows auto-repeat, a held letter/M acts once).
 */
export function keyCommand(e: { key: string; mod: boolean; typing: boolean; dialog: boolean; repeat: boolean; composing: boolean }): Command | null {
  if (e.mod || e.typing || e.dialog || e.composing) return null;
  if (e.key === "ArrowLeft") return { type: "prev" };
  if (e.key === "ArrowRight") return { type: "next" };
  if (e.repeat) return null;
  const k = e.key.toUpperCase();
  if (k === "M") return { type: "mark" };
  if (/^[A-E]$/.test(k)) return { type: "choice", letter: k };
  return null;
}

/** Next selection after picking `letter`: a single-answer Question replaces it, a multi-answer one toggles, capped at `need`. */
export function toggleChoice(selected: string[], letter: string, need: number): string[] {
  if (need <= 1) return [letter];
  if (selected.includes(letter)) return selected.filter((l) => l !== letter);
  return selected.length < need ? [...selected, letter] : selected;
}

export type AttemptCell = "unanswered" | "answered" | "marked";

/** Grid state of one Question in an open Attempt: a mark shows over an answer. */
export const attemptCell = (q: { selected: string[]; marked: boolean }): AttemptCell =>
  q.marked ? "marked" : q.selected.length ? "answered" : "unanswered";

export type ResultTab = "wrong" | "marked" | undefined; // undefined: all

/** Grid state of one Question on the Result: green/red by correctness (blank = wrong), the mark is a border on top. */
export const resultCell = (q: { isCorrect: boolean; marked: boolean }) => ({ correct: q.isCorrect, marked: q.marked });

/** Whether a Question belongs to the Result tab. */
export const inTab = (tab: ResultTab, q: { isCorrect: boolean; marked: boolean }) => (tab === "wrong" ? !q.isCorrect : tab === "marked" ? q.marked : true);
