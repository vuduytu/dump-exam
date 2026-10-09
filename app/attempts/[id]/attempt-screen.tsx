"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { saveAnswerAction, setMarkAction } from "@/app/actions";
import { Progress } from "@/components/ui/progress";
import type { Choice } from "@/db/schema";
import { Choices } from "./choices";
import { Countdown, MarkButton, SubmitForm } from "./controls";
import { attemptCell, toggleChoice, type AttemptCell, type Command } from "./logic";
import { QuestionLayout, Stats, usePosition } from "./question-layout";

type Question = { id: number; text: string; choices: Choice[]; need: number; selected: string[]; marked: boolean };
type Saved = Pick<Question, "selected" | "marked">;

const cellStyle: Record<AttemptCell, [string, string]> = {
  unanswered: ["bg-card", "chưa trả lời"],
  answered: ["border-primary bg-primary text-primary-foreground", "đã trả lời"],
  marked: ["border-marked bg-marked-soft text-marked", "đánh dấu"],
};

/**
 * The open Attempt: all Questions arrive once, switching is client-side. Each change is shown at once and saved at once;
 * Next runs Server Actions one at a time in call order, so the last click is the one the server keeps. A failed save
 * rolls back to the last value the server confirmed and stays reported until a later save of that Question and field
 * succeeds. Expired/submitted Attempts: the action redirects to the Result. Fresh `questions` from the server (a refresh
 * after Back) replace the local ones, except fields with a save still in flight.
 */
export function AttemptScreen(props: { attemptId: number; examName: string; questions: Question[]; initialPos: number; msLeft: number | null }) {
  const { attemptId } = props;
  const [pos, go] = usePosition(props.initialPos);
  const [qs, setQs] = useState(props.questions);
  const [pending, setPending] = useState<number | null>(null); // null: nothing saved yet
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set()); // keys whose latest save failed
  const confirmed = useRef(new Map<number, Saved>());
  const latest = useRef(new Map<string, number>()); // newest request per Question and field: only it may roll back
  const inFlight = useRef(new Map<string, number>());
  const q = qs[pos - 1];

  useEffect(() => {
    const busy = (field: keyof Saved, id: number) => (inFlight.current.get(`${field}:${id}`) ?? 0) > 0;
    for (const x of props.questions) confirmed.current.set(x.id, { selected: x.selected, marked: x.marked });
    setQs((local) =>
      props.questions.map((x) => {
        const mine = local.find((l) => l.id === x.id);
        if (!mine) return x;
        return { ...x, selected: busy("selected", x.id) ? mine.selected : x.selected, marked: busy("marked", x.id) ? mine.marked : x.marked };
      }),
    );
  }, [props.questions]);

  const patch = (id: number, change: Partial<Saved>) => setQs((all) => all.map((x) => (x.id === id ? { ...x, ...change } : x)));
  const setKey = (key: string, bad: boolean) =>
    setFailed((s) => {
      if (s.has(key) === bad) return s;
      const next = new Set(s);
      if (bad) next.add(key);
      else next.delete(key);
      return next;
    });

  function save<K extends keyof Saved>(id: number, field: K, value: Saved[K], run: () => Promise<void>) {
    patch(id, { [field]: value });
    const key = `${field}:${id}`;
    const seq = (latest.current.get(key) ?? 0) + 1;
    latest.current.set(key, seq);
    inFlight.current.set(key, (inFlight.current.get(key) ?? 0) + 1);
    setPending((n) => (n ?? 0) + 1);
    run()
      .then(
        () => {
          confirmed.current.get(id)![field] = value;
          if (latest.current.get(key) === seq) setKey(key, false);
        },
        () => {
          if (latest.current.get(key) !== seq) return; // a newer save of this field decides
          patch(id, { [field]: confirmed.current.get(id)![field] });
          setKey(key, true);
        },
      )
      .finally(() => {
        inFlight.current.set(key, inFlight.current.get(key)! - 1);
        setPending((n) => n! - 1);
      });
  }

  function pick(letter: string) {
    const next = toggleChoice(q.selected, letter, q.need);
    if (next.join() === q.selected.join()) return;
    save(q.id, "selected", next, () => saveAnswerAction(attemptId, q.id, next));
  }
  function toggleMark() {
    const marked = !q.marked;
    save(q.id, "marked", marked, () => setMarkAction(attemptId, q.id, marked));
  }

  function onCommand(cmd: Command) {
    if (cmd.type === "mark") toggleMark();
    else if (cmd.type === "choice" && q.choices.some((c) => c.letter === cmd.letter)) pick(cmd.letter);
    else return false;
    return true;
  }

  const failedIds = new Set([...failed].map((k) => Number(k.split(":")[1])));
  const failedPos = qs.flatMap((x, i) => (failedIds.has(x.id) ? [i + 1] : []));
  const status = failedPos.length
    ? `Không lưu được Câu ${failedPos.join(", ")}, hãy thử lại.`
    : pending === null ? "" : pending > 0 ? "Đang lưu…" : "Đã lưu";

  const answered = qs.filter((x) => x.selected.length).length;
  const marked = qs.filter((x) => x.marked).length;
  const total = qs.length;
  const cells = qs.map((x, i) => {
    const [className, label] = cellStyle[attemptCell(x)];
    return { pos: i + 1, className, label: `Câu ${i + 1}, ${label}` };
  });

  return (
    <QuestionLayout
      examName={props.examName}
      meta={props.msLeft !== null ? "Thi thử · 230 phút" : "Luyện tập"}
      figure={`Đã làm: ${answered}/${total} (${Math.round((answered / total) * 100)}%)`}
      stats={
        <Stats
          items={[
            { glyph: "●", label: "Đã làm", n: answered, tone: "text-primary" },
            { glyph: "○", label: "Chưa làm", n: total - answered },
            { glyph: "⚑", label: "Đánh dấu", n: marked, tone: "text-marked" },
          ]}
        />
      }
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
        <Progress value={(answered / total) * 100} aria-label="Tiến độ" />
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
      <article>
        <div className="question-text" dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
        <Choices key={q.id} questionId={q.id} choices={q.choices} need={q.need} selected={q.selected} onPick={pick} />
      </article>
      <p role="status" className={`mt-3 min-h-5 text-sm ${failedPos.length ? "text-destructive" : "text-muted-foreground"}`}>
        {status}
      </p>
    </QuestionLayout>
  );
}
