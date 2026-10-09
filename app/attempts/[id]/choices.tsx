"use client";

import { useState } from "react";
import { saveAnswerAction } from "@/app/actions";
import type { Choice } from "@/db/schema";

/** Radio for a single-answer Question, checkboxes capped at `need` otherwise. Every change is saved at once. */
export function Choices(props: { attemptId: number; questionId: number; choices: Choice[]; need: number; initial: string[] }) {
  const { attemptId, questionId, choices, need } = props;
  const [selected, setSelected] = useState(props.initial);
  const [error, setError] = useState(false);
  const multi = need > 1;

  function change(letter: string, checked: boolean) {
    const next = !multi ? [letter] : checked ? [...selected, letter] : selected.filter((l) => l !== letter);
    const prev = selected;
    setSelected(next);
    setError(false);
    saveAnswerAction(attemptId, questionId, next).catch(() => {
      setSelected(prev);
      setError(true);
    });
  }

  return (
    <fieldset className="mt-4 flex flex-col gap-2">
      {multi && <legend className="mb-2 text-sm font-medium">Chọn {need} đáp án</legend>}
      {choices.map((c) => {
        const checked = selected.includes(c.letter);
        return (
          <label key={c.letter} className="flex gap-2 rounded border p-2">
            <input
              type={multi ? "checkbox" : "radio"}
              name={`q${questionId}`}
              checked={checked}
              disabled={multi && !checked && selected.length >= need}
              onChange={(e) => change(c.letter, e.target.checked)}
            />
            <span>
              {c.letter}. <span dangerouslySetInnerHTML={{ __html: c.text }} /> {/* sanitized at import */}
            </span>
          </label>
        );
      })}
      {error && <p role="alert" className="text-red-600">Không lưu được, hãy chọn lại.</p>}
    </fieldset>
  );
}
