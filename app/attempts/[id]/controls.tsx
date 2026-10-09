"use client";

import { useEffect, useState } from "react";
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

/** Display only: the server decides the deadline. At 0 it submits, and submitAttemptAction redirects to the Score. */
/** Counts down `msLeft`, measured by the server, so a wrong client clock cannot end the Attempt early. */
export function Countdown({ attemptId, msLeft }: { attemptId: number; msLeft: number }) {
  const [left, setLeft] = useState(msLeft);
  useEffect(() => {
    const end = Date.now() + msLeft;
    const timer = setInterval(() => {
      const ms = end - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(timer);
        submitAttemptAction(attemptId).catch(() => location.reload()); // reload: the server closes it on read
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptId, msLeft]);
  const s = Math.max(0, Math.ceil(left / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span role="timer" suppressHydrationWarning className={`font-mono text-sm ${s < 600 ? "text-red-600" : ""}`}>
      {Math.floor(s / 3600)}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}
    </span>
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
