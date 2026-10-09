"use client";

import { useState } from "react";
import { submitAttemptAction, toggleMarkAction } from "@/app/actions";

export function MarkButton({ attemptId, questionId, initial }: { attemptId: number; questionId: number; initial: boolean }) {
  const [marked, setMarked] = useState(initial);
  return (
    <button
      type="button"
      aria-pressed={marked}
      onClick={() => toggleMarkAction(attemptId, questionId).then(setMarked)}
      className={`rounded border px-3 py-1 ${marked ? "border-amber-500 bg-amber-200 text-amber-950" : ""}`}
    >
      {marked ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
    </button>
  );
}

export function SubmitForm({ attemptId, unanswered, marked }: { attemptId: number; unanswered: number; marked: number }) {
  return (
    <form
      action={submitAttemptAction.bind(null, attemptId)}
      onSubmit={(e) => {
        if (!confirm(`Còn ${unanswered} câu chưa trả lời, ${marked} câu đánh dấu. Nộp?`)) e.preventDefault();
      }}
      className="ml-auto"
    >
      <button className="rounded bg-foreground px-3 py-1 text-background">Nộp bài</button>
    </form>
  );
}
