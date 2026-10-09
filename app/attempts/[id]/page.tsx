import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AttemptNotFound, AttemptNotSubmitted, getAttempt, getResult } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Choices } from "./choices";
import { Countdown, MarkButton, SubmitForm } from "./controls";

export default async function AttemptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; f?: string }> }) {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { q: qParam, f } = await searchParams;
  const filter = f === "wrong" || f === "marked" ? f : undefined;
  const result = await getResult(user.id, id, filter).catch((err) => {
    if (err instanceof AttemptNotFound) notFound();
    if (err instanceof AttemptNotSubmitted) return null;
    throw err;
  });

  if (result) {
    const { score, total } = result;
    const tab = (value: string | undefined, label: string) => (
      <Link href={value ? `?f=${value}` : "?"} className={buttonVariants({ variant: filter === value ? "default" : "outline", size: "sm" })}>
        {label}
      </Link>
    );
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="text-2xl font-semibold">{result.examName} — đã nộp</h1>
        <p className="mt-6 text-4xl font-semibold">
          {score}/{total} <span className="text-2xl">({Math.round(((score ?? 0) / total) * 100)}%)</span>
        </p>
        <nav className="mt-6 flex flex-wrap items-center gap-2">
          {tab(undefined, "Tất cả")}
          {tab("wrong", "Chỉ câu sai")}
          {tab("marked", "Chỉ câu đã đánh dấu")}
        </nav>
        {result.questions.length === 0 && <p className="mt-6">Không có câu nào.</p>}
        {result.questions.map((q) => (
          <Card key={q.id} className="mt-6 gap-0 p-3">
            <p className={`text-sm font-semibold ${q.isCorrect ? "text-correct" : "text-wrong"}`}>
              Câu #{q.id} — {q.isCorrect ? "Đúng" : "Sai"}
            </p>
            <div className="question-text" dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
            <ul className="mt-3 flex flex-col gap-1">
              {q.choices.map((c) => (
                <li key={c.letter} className={`rounded border p-2 ${q.correct.includes(c.letter) ? "border-correct bg-correct-soft" : q.selected.includes(c.letter) ? "border-wrong bg-wrong-soft" : ""}`}>
                  {c.letter}. <span dangerouslySetInnerHTML={{ __html: c.text }} /> {/* sanitized at import */}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({c.percent}% vote
                    {q.selected.includes(c.letter) && ", bạn chọn"}
                    {q.correct.includes(c.letter) && ", đáp án đúng"})
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn chọn: {q.selected.join("") || "(bỏ trống)"} · Correct Answer: {q.correct} · Suggested Answer: {q.suggested}
            </p>
          </Card>
        ))}
      </main>
    );
  }

  const attempt = await getAttempt(user.id, id);
  if (attempt.submittedAt) redirect(`/attempts/${id}`); // expired between getResult and getAttempt
  const total = attempt.questions.length;

  const pos = Math.min(Math.max(Number(qParam) || 1, 1), total); // 1-based
  const q = attempt.questions[pos - 1];
  const unanswered = attempt.questions.filter((x) => x.selected.length === 0).length;
  const markedCount = attempt.questions.filter((x) => x.marked).length;
  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{attempt.examName}</h1>
        {attempt.deadline && <Countdown attemptId={attempt.id} msLeft={attempt.deadline.getTime() - Date.now()} />}
        <span className="text-sm text-muted-foreground">Câu {pos}/{total}</span>
      </header>
      <article className="mt-6">
        <div className="question-text" dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
        <Choices key={q.id} attemptId={attempt.id} questionId={q.id} choices={q.choices} need={q.need} initial={q.selected} />
      </article>
      <div className="mt-4">
        <MarkButton key={q.id} attemptId={attempt.id} questionId={q.id} initial={q.marked} />
      </div>
      <nav className="mt-6 flex items-center gap-3">
        {pos > 1 && <Link href={`?q=${pos - 1}`} className={buttonVariants({ variant: "outline" })}>Trước</Link>}
        {pos < total && <Link href={`?q=${pos + 1}`} className={buttonVariants({ variant: "outline" })}>Sau</Link>}
        <SubmitForm attemptId={attempt.id} unanswered={unanswered} marked={markedCount} />
      </nav>
      <ol className="mt-6 grid grid-cols-10 gap-1 text-center text-sm">
        {attempt.questions.map((x, i) => (
          <li key={x.id}>
            <Link
              href={`?q=${i + 1}`}
              title={x.marked ? "Đã đánh dấu" : x.selected.length ? "Đã trả lời" : "Chưa trả lời"}
              className={`block rounded border py-1 ${
                x.marked ? "border-marked bg-marked-soft text-marked" : x.selected.length ? "border-primary bg-primary text-primary-foreground" : ""
              } ${i + 1 === pos ? "ring-2 ring-ring" : ""}`}
            >
              {i + 1}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">Trắng: chưa trả lời · Xanh: đã trả lời · Vàng: đánh dấu</p>
    </main>
  );
}
