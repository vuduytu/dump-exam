"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { submitAttemptAction } from "@/app/actions";

export function MarkButton({ marked, onToggle }: { marked: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="outline"
      size="lg"
      aria-pressed={marked}
      onClick={onToggle}
      className={marked ? "border-marked bg-marked-soft text-marked hover:bg-marked-soft hover:text-marked" : ""}
    >
      <Flag className={marked ? "fill-current" : ""} />
      {marked ? "Đã đánh dấu" : "Đánh dấu"}
    </Button>
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
    <span role="timer" suppressHydrationWarning className={`font-mono text-sm ${s < 600 ? "text-destructive" : ""}`}>
      {Math.floor(s / 3600)}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}
    </span>
  );
}

export function SubmitForm({ attemptId, unanswered, marked }: { attemptId: number; unanswered: number; marked: number }) {
  return (
    <ConfirmDialog
      trigger="Nộp bài"
      triggerProps={{ variant: "default", size: "lg" }}
      title="Nộp bài?"
      description={`Còn ${unanswered} câu chưa trả lời, ${marked} câu đánh dấu.`}
      confirm="Nộp bài"
      action={submitAttemptAction.bind(null, attemptId)}
    />
  );
}
