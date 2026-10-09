"use client";

import type { Choice } from "@/db/schema";

/** Radio for a single-answer Question, checkboxes capped at `need` otherwise. The parent owns the selection and saves it. */
export function Choices(props: { questionId: number; choices: Choice[]; need: number; selected: string[]; onPick: (letter: string) => void }) {
  const { questionId, choices, need, selected, onPick } = props;
  const multi = need > 1;
  return (
    <fieldset className="mt-6 flex flex-col gap-2">
      {multi ? <legend className="mb-2 text-sm font-medium">Chọn {need} đáp án</legend> : <legend className="sr-only">Chọn 1 lựa chọn</legend>}
      {choices.map((c) => {
        const checked = selected.includes(c.letter);
        return (
          <label
            key={c.letter}
            className="flex cursor-pointer gap-3 rounded-lg border bg-card p-3 has-checked:border-primary has-checked:bg-primary/5 has-disabled:cursor-default has-disabled:opacity-60"
          >
            <input
              type={multi ? "checkbox" : "radio"}
              name={`q${questionId}`}
              className="mt-1.5 size-4 shrink-0 accent-primary"
              checked={checked}
              disabled={multi && !checked && selected.length >= need}
              onChange={() => onPick(c.letter)}
            />
            <span className="question-text">
              <span className="font-semibold">{c.letter}.</span> <span dangerouslySetInnerHTML={{ __html: c.text }} /> {/* sanitized at import */}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
