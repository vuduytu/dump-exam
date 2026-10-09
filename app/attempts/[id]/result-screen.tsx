"use client";

import { useEffect, useState } from "react";
import { Check, Flag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Choice } from "@/db/schema";
import { taskLabel } from "@/lib/question-tags";
import { cn, TIME_LIMIT_MIN } from "@/lib/utils";
import { formatDuration, inTab, resultCell, type ResultTab } from "./logic";
import { QuestionLayout, Stats, usePosition } from "./question-layout";

type Question = { id: number; task: string | null; text: string; choices: (Choice & { percent: number })[]; correct: string; suggested: string; selected: string[]; isCorrect: boolean; marked: boolean };

const tabs: { value: ResultTab; label: string }[] = [
  { value: undefined, label: "Tất cả" },
  { value: "wrong", label: "Sai" },
  { value: "marked", label: "Đánh dấu" },
];

/** Read-only Result: all Questions arrive once, the tab and position switch on the client (`?f=`, `?q=` follow via replaceState). */
export function ResultScreen(props: { title: string; drill: boolean; domains: { domain: string; correct: number; total: number }[]; score: number; timed: boolean; durationSec: number; questions: Question[]; initialPos: number; initialTab: ResultTab }) {
  const { questions: qs } = props;
  const total = qs.length;
  const [pos, go] = usePosition(props.initialPos);
  const [tab, setTab] = useState(props.initialTab);
  const shown = qs.flatMap((q, i) => (inTab(tab, q) ? [{ q, pos: i + 1 }] : []));
  const q = qs[pos - 1];
  const here = shown.some((s) => s.pos === pos);

  useEffect(() => {
    if (!here && shown.length) go(shown[0].pos); // landed on (or switched to) a tab that does not hold this Question
  }, [here, shown, go]);

  function pickTab(t: ResultTab) {
    setTab(t);
    const url = new URL(location.href);
    if (t) url.searchParams.set("f", t);
    else url.searchParams.delete("f");
    history.replaceState(null, "", url);
  }

  const cells = shown.map(({ q: x, pos: p }) => {
    const { correct, marked } = resultCell(x);
    return {
      pos: p,
      className: cn(correct ? "bg-correct-soft text-correct" : "bg-wrong-soft text-wrong", marked ? "border-marked border-2" : correct ? "border-correct" : "border-wrong"),
      label: `Câu ${p}, ${correct ? "đúng" : "sai"}${marked ? ", đánh dấu" : ""}`,
    };
  });
  const pct = Math.round((props.score / total) * 100);

  const blank = qs.filter((x) => !x.selected.length).length;
  const wrongTab = qs.filter((x) => !x.isCorrect).length; // blanks are wrong (Score rule)
  const markedN = qs.filter((x) => x.marked).length;
  const counts = { all: total, wrong: wrongTab, marked: markedN };
  const tabBar = (
    <div role="tablist" aria-label="Lọc câu" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Button key={t.label} role="tab" aria-selected={tab === t.value} variant={tab === t.value ? "default" : "outline"} size="sm" onClick={() => pickTab(t.value)}>
          {t.label} {counts[t.value ?? "all"]}
        </Button>
      ))}
    </div>
  );

  return (
    <QuestionLayout
      title={props.title}
      meta={props.timed ? `Thi thử · ${formatDuration(props.durationSec)} / ${TIME_LIMIT_MIN} phút` : `${props.drill ? "Ôn" : "Luyện tập"} · ${formatDuration(props.durationSec)}`}
      figure={`Điểm: ${props.score}/${total} (${pct}%)`}
      stats={
        <Stats
          items={[
            { glyph: "✓", label: "Đúng", n: total - wrongTab, tone: "text-correct" },
            { glyph: "✗", label: "Sai", n: wrongTab - blank, tone: "text-wrong" },
            { glyph: "○", label: "Bỏ trống", n: blank },
            { glyph: "⚑", label: "Đánh dấu", n: markedN, tone: "text-marked" },
          ]}
        />
      }
      domains={props.domains.map((d) => `${d.domain} ${Math.round((d.correct / d.total) * 100)}% (${d.correct}/${d.total})`).join(" · ")}
      tabs={tabBar}
      pos={pos}
      total={total}
      cells={cells}
      onGo={go}
      footer={
        <>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span><span className="mr-1 inline-block size-2.5 rounded-sm border border-correct bg-correct-soft align-middle" />Đúng</span>
            <span><span className="mr-1 inline-block size-2.5 rounded-sm border border-wrong bg-wrong-soft align-middle" />Sai</span>
            <span><span className="mr-1 inline-block size-2.5 rounded-sm border-2 border-marked align-middle" />Đánh dấu</span>
          </p>
        </>
      }
    >
      {!shown.length || !q ? (
        <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          {tab === "wrong" ? "Không có câu sai nào. Làm tốt lắm!" : tab === "marked" ? "Bạn chưa đánh dấu câu nào." : "Không có câu nào."}
        </p>
      ) : (
        <article>
          <p className={cn("flex flex-wrap items-center gap-1.5 text-sm font-semibold", q.isCorrect ? "text-correct" : "text-wrong")}>
            {q.isCorrect ? <Check className="size-4" /> : <X className="size-4" />}
            {q.isCorrect ? "Đúng" : q.selected.length ? "Sai" : "Sai (bỏ trống)"}
            {q.marked && (
              <span className="ml-2 flex items-center gap-1 text-marked">
                <Flag className="size-4" /> Đã đánh dấu
              </span>
            )}
            {taskLabel(q.task) && <Badge variant="outline" className="ml-auto h-auto max-w-full whitespace-normal font-normal text-muted-foreground">{taskLabel(q.task)}</Badge>}
          </p>
          <div className="question-text mt-3" dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
          <ul className="mt-6 flex flex-col gap-2">
            {q.choices.map((c) => {
              const isCorrect = q.correct.includes(c.letter);
              const picked = q.selected.includes(c.letter);
              const suggested = q.suggested !== q.correct && q.suggested.includes(c.letter);
              return (
                <li key={c.letter} className={cn("rounded-lg border bg-card p-3", isCorrect ? "border-correct bg-correct-soft" : picked && "border-wrong bg-wrong-soft")}>
                  <span className="question-text">
                    <span className="font-semibold">{c.letter}.</span> <span dangerouslySetInnerHTML={{ __html: c.text }} /> {/* sanitized at import */}
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {picked && <Badge variant="outline">Bạn chọn</Badge>}
                    {isCorrect && <Badge variant="outline" className="border-correct text-correct">Đáp án đúng</Badge>}
                    {suggested && <Badge variant="outline">ExamTopics gợi ý</Badge>}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                    <div role="meter" aria-label={`${c.percent}% vote`} aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100} className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${c.percent}%` }} />
                    </div>
                    {c.percent}% vote
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Bạn chọn: {q.selected.join("") || "(bỏ trống)"} · Đáp án đúng: {q.correct} · ExamTopics gợi ý: {q.suggested}
          </p>
        </article>
      )}
    </QuestionLayout>
  );
}
