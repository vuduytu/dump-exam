"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { keyCommand, type Command } from "./logic";

/** One grid cell: 1-based position in the Exam, colours for its state, and an accessible label ("Câu 3, đã trả lời"). */
export type GridCell = { pos: number; className: string; label: string };

/** Current 1-based position, switched on the client; `?q=N` follows via replaceState so a reload opens the same Question. */
export function usePosition(initial: number) {
  const [pos, setPos] = useState(initial);
  useEffect(() => setPos(initial), [initial]); // a refresh after Back brings the position of the URL being shown
  const go = useCallback((p: number) => {
    setPos(p);
    const url = new URL(location.href);
    url.searchParams.set("q", String(p));
    history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);
  return [pos, go] as const;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || (t instanceof HTMLInputElement && t.type !== "radio" && t.type !== "checkbox"));

/**
 * Shell shared by the Attempt screen and Result: Question on the left (desktop) with a sticky side column, sticky top/bottom
 * bars and a grid drawer on mobile, ←/→ between `cells`. Other shortcuts go to `onCommand`, which returns whether it used them.
 */
export function QuestionLayout(props: {
  title: string; // line 1: "Đề 2 · Câu 72/180"
  meta?: React.ReactNode; // line 1, right-aligned
  figure: React.ReactNode; // line 2
  stats: React.ReactNode; // line 3, see Stats
  domains?: string; // line 4, Result of an Exam only
  tabs?: React.ReactNode; // Result: above the grid on desktop, below line 3 on mobile
  pos: number;
  total: number;
  cells: GridCell[]; // the Questions you can move between, in order (Result may pass a filtered list)
  onGo: (pos: number) => void;
  onCommand?: (cmd: Command) => boolean;
  timer?: React.ReactNode; // mobile top bar and top of the side column
  side?: React.ReactNode; // above the grid (progress)
  footer?: React.ReactNode; // below the grid (legend, submit)
  actions?: React.ReactNode; // between Trước and Sau (mark button)
  children: React.ReactNode; // the Question
}) {
  const { pos, total, cells, onGo, onCommand } = props;
  const [gridOpen, setGridOpen] = useState(false);
  const i = cells.findIndex((c) => c.pos === pos);
  const prev = cells[i - 1]?.pos;
  const next = cells[i + 1]?.pos;
  const heading = `${props.title} · Câu ${pos}/${total}`;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = keyCommand({
        key: e.key,
        mod: e.ctrlKey || e.metaKey || e.altKey || e.shiftKey,
        typing: isTyping(e.target),
        dialog: !!document.querySelector('[role="dialog"]'),
        repeat: e.repeat,
        composing: e.isComposing,
      });
      if (!cmd) return;
      if (cmd.type === "prev" || cmd.type === "next") {
        const target = cmd.type === "prev" ? prev : next;
        if (target) onGo(target);
      } else if (!onCommand?.(cmd)) return;
      e.preventDefault(); // always for arrows, even on the first/last Question: a focused radio must not move its own selection
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onGo, onCommand]);

  const grid = (
    // scrolls on its own so the submit button below stays on screen
    <ol className="-m-1 grid min-h-0 grid-cols-10 gap-1 overflow-y-auto p-1 text-center text-xs tabular-nums">
      {cells.map((c) => (
        <li key={c.pos}>
          <button
            type="button"
            aria-label={c.label}
            title={c.label}
            aria-current={c.pos === pos ? "true" : undefined}
            onClick={() => {
              onGo(c.pos);
              setGridOpen(false);
            }}
            className={cn("block w-full rounded border py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50", c.className, c.pos === pos && "ring-2 ring-ring ring-offset-1 ring-offset-background")}
          >
            {c.pos}
          </button>
        </li>
      ))}
    </ol>
  );
  const prevButton = (
    <Button variant="outline" size="lg" disabled={!prev} onClick={() => prev && onGo(prev)}>
      <ChevronLeft /> Trước
    </Button>
  );
  const nextButton = (
    <Button variant="outline" size="lg" disabled={!next} onClick={() => next && onGo(next)}>
      Sau <ChevronRight />
    </Button>
  );

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-2 lg:hidden">
        <span className="min-w-0 truncate font-medium tabular-nums">{heading}</span>
        {props.timer}
        <Sheet open={gridOpen} onOpenChange={setGridOpen}>
          <SheetTrigger render={<Button variant="outline" className="ml-auto" />}>
            <LayoutGrid /> Lưới câu
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-3 px-4 pb-6">
            <SheetHeader className="px-0 pb-0">
              <SheetTitle>Lưới câu</SheetTitle>
            </SheetHeader>
            {props.side}
            {grid}
            {props.footer}
          </SheetContent>
        </Sheet>
      </div>

      <main className="mx-auto max-w-6xl p-4 pb-24 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8 lg:pb-8">
        <div>
          <header className="mb-6 border-b pb-4">
            <div className="hidden items-baseline justify-between gap-3 lg:flex">
              <h1 className="min-w-0 truncate text-2xl font-semibold tabular-nums">{heading}</h1>
              {props.meta && <p className="shrink-0 text-sm text-muted-foreground">{props.meta}</p>}
            </div>
            <div className="flex items-baseline justify-between gap-3 lg:mt-1">
              <p className="whitespace-nowrap text-lg font-medium tabular-nums">{props.figure}</p>
              {props.meta && <p className="shrink-0 text-sm text-muted-foreground lg:hidden">{props.meta}</p>}
            </div>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">{props.stats}</p>
            {props.domains && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{props.domains}</p>}
            {props.tabs && <div className="mt-4 lg:hidden">{props.tabs}</div>}
          </header>
          {props.children}
          <nav className="mt-6 hidden items-center gap-3 lg:flex">
            {prevButton}
            {props.actions}
            {nextButton}
          </nav>
          <p className="mt-3 hidden text-xs text-muted-foreground lg:block">
            Phím tắt: ← → đổi câu{onCommand && " · A–E: chọn · M: đánh dấu"}
          </p>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-4 flex max-h-[calc(100dvh-5.5rem)] flex-col gap-4 rounded-xl border bg-card p-4">
            {props.timer}
            {props.side}
            {props.tabs}
            {grid}
            {props.footer}
          </div>
        </aside>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t bg-background px-4 py-2 lg:hidden">
        {prevButton}
        {props.actions}
        {nextButton}
      </nav>
    </>
  );
}

/** Line 3: muted glyph + label + count per item; `tone` is a theme-token text class. */
export function Stats({ items }: { items: { glyph: string; label: string; n: number; tone?: string }[] }) {
  return items.map((x, i) => (
    <span key={x.label}>
      {i > 0 && <span aria-hidden className="mr-3">·</span>}
      <span aria-hidden className={x.tone}>{x.glyph}</span> {x.label} {x.n}
    </span>
  ));
}
