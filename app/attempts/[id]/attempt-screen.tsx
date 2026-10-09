"use client";

import { useRef, useState } from "react";
import { Clock } from "lucide-react";
import { saveAnswerAction, toggleMarkAction } from "@/app/actions";
import { Progress } from "@/components/ui/progress";
import type { Choice } from "@/db/schema";
import { Choices } from "./choices";
import { Countdown, MarkButton, SubmitForm } from "./controls";
import { attemptCell, toggleChoice, type AttemptCell, type Command } from "./logic";
import { QuestionLayout, usePosition } from "./question-layout";

type Question = { id: number; text: string; choices: Choice[]; need: number; selected: string[]; marked: boolean };
type Saved = Pick<Question, "selected" | "marked">;

const cellStyle: Record<AttemptCell, [string, string]> = {
  unanswered: ["bg-card", "chưa trả lời"],
  answered: ["border-primary bg-primary text-primary-foreground", "đã trả lời"],
  marked: ["border-marked bg-marked-soft text-marked", "đánh dấu"],
};

const statusText = { idle: "", saving: "Đang lưu…", saved: "Đã lưu", error: "Không lưu được, hãy thử lại." };

/**
 * The open Attempt: all Questions arrive once, switching is client-side. Each change is shown at once and saved at once;
 * Next runs Server Actions one at a time in call order, so the last click is the one the server keeps. A failed save
 * rolls back to the last value the server confirmed. Expired/submitted Attempts: the action redirects to the Result.
 */
export function AttemptScreen(props: { attemptId: number; examName: string; questions: Question[]; initialPos: number; msLeft: number | null }) {
  const { attemptId } = props;
  const [pos, go] = usePosition(props.initialPos);
  const [qs, setQs] = useState(props.questions);
  const [status, setStatus] = useState<keyof typeof statusText>("idle");
  const confirmed = useRef(new Map<number, Saved>(props.questions.map((q) => [q.id, { selected: q.selected, marked: q.marked }])));
  const latest = useRef(new Map<string, number>()); // newest request per Question and field: only it may roll back
  const pending = useRef(0);
  const failed = useRef(false);
  const q = qs[pos - 1];

  const patch = (id: number, change: Partial<Saved>) => setQs((all) => all.map((x) => (x.id === id ? { ...x, ...change } : x)));

  function save<K extends keyof Saved>(id: number, field: K, value: Saved[K], run: () => Promise<Saved[K] | void>) {
    patch(id, { [field]: value });
    const key = `${field}:${id}`;
    const seq = (latest.current.get(key) ?? 0) + 1;
    latest.current.set(key, seq);
    pending.current++;
    failed.current = false;
    setStatus("saving");
    run()
      .then(
        (server) => {
          if (server === undefined && field === "marked") return; // redirected away (expired/submitted)
          const v = (server ?? value) as Saved[K];
          confirmed.current.get(id)![field] = v;
          if (latest.current.get(key) !== seq) return;
          patch(id, { [field]: v });
          failed.current = false; // a newer save of the same field superseded the failed one
        },
        () => {
          failed.current = true;
          if (latest.current.get(key) === seq) patch(id, { [field]: confirmed.current.get(id)![field] });
        },
      )
      .finally(() => {
        if (--pending.current === 0) setStatus(failed.current ? "error" : "saved");
      });
  }

  function pick(letter: string) {
    const next = toggleChoice(q.selected, letter, q.need);
    if (next.join() === q.selected.join()) return;
    save(q.id, "selected", next, () => saveAnswerAction(attemptId, q.id, next));
  }
  const toggleMark = () => save(q.id, "marked", !q.marked, () => toggleMarkAction(attemptId, q.id));

  function onCommand(cmd: Command) {
    if (cmd.type === "mark") toggleMark();
    else if (cmd.type === "choice" && q.choices.some((c) => c.letter === cmd.letter)) pick(cmd.letter);
    else return false;
    return true;
  }

  const answered = qs.filter((x) => x.selected.length).length;
  const marked = qs.filter((x) => x.marked).length;
  const total = qs.length;
  const cells = qs.map((x, i) => {
    const [className, label] = cellStyle[attemptCell(x)];
    return { pos: i + 1, className, label: `Câu ${i + 1}, ${label}` };
  });

  return (
    <QuestionLayout
      pos={pos}
      total={total}
      cells={cells}
      onGo={go}
      onCommand={onCommand}
      // ponytail: mounted twice (mobile bar + side column), so two timers; a double auto-submit is harmless (AttemptSubmitted is ignored)
      timer={
        props.msLeft !== null && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" />
            <Countdown attemptId={attemptId} msLeft={props.msLeft} />
          </span>
        )
      }
      side={
        <Progress value={(answered / total) * 100}>
          <span className="text-sm font-medium">
            Đã làm {answered}/{total}
          </span>
        </Progress>
      }
      footer={
        <>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span><span className="mr-1 inline-block size-2.5 rounded-sm border bg-card align-middle" />Chưa làm</span>
            <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-primary align-middle" />Đã làm</span>
            <span><span className="mr-1 inline-block size-2.5 rounded-sm border border-marked bg-marked-soft align-middle" />Đánh dấu</span>
          </p>
          <SubmitForm attemptId={attemptId} unanswered={total - answered} marked={marked} />
        </>
      }
      actions={<MarkButton marked={q.marked} onToggle={toggleMark} />}
    >
      <p className="text-sm text-muted-foreground">{props.examName}</p>
      <article className="mt-3">
        <div className="question-text" dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
        <Choices key={q.id} questionId={q.id} choices={q.choices} need={q.need} selected={q.selected} onPick={pick} />
      </article>
      <p role="status" className={`mt-3 min-h-5 text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
        {statusText[status]}
      </p>
    </QuestionLayout>
  );
}
