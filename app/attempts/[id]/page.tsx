import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { submitAttemptAction } from "@/app/actions";
import { AttemptNotFound, AttemptNotSubmitted, getAttempt, getResult } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { Choices } from "./choices";

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
      <Link href={value ? `?f=${value}` : "?"} className={`rounded border px-3 py-1 text-sm ${filter === value ? "bg-foreground text-background" : ""}`}>
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
          <Link href="/history" className="ml-auto underline">Lịch sử</Link>
          <Link href="/" className="underline">Trang chủ</Link>
        </nav>
        {result.questions.length === 0 && <p className="mt-6">Không có câu nào.</p>}
        {result.questions.map((q) => (
          <article key={q.id} className="mt-6 rounded border p-3">
            <p className={`text-sm font-semibold ${q.isCorrect ? "text-green-700" : "text-red-700"}`}>
              Câu #{q.id} — {q.isCorrect ? "Đúng" : "Sai"}
            </p>
            <div dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
            <ul className="mt-3 flex flex-col gap-1">
              {q.choices.map((c) => (
                <li key={c.letter} className={`rounded border p-2 ${q.correct.includes(c.letter) ? "border-green-600 bg-green-50 text-green-900" : q.selected.includes(c.letter) ? "border-red-600 bg-red-50 text-red-900" : ""}`}>
                  {c.letter}. <span dangerouslySetInnerHTML={{ __html: c.text }} /> {/* sanitized at import */}
                  <span className="ml-2 text-sm">
                    ({c.percent}% vote
                    {q.selected.includes(c.letter) && ", bạn chọn"}
                    {q.correct.includes(c.letter) && ", đáp án đúng"})
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Bạn chọn: {q.selected.join("") || "(bỏ trống)"} · Correct Answer: {q.correct} · Suggested Answer: {q.suggested}
            </p>
          </article>
        ))}
      </main>
    );
  }

  const attempt = await getAttempt(user.id, id);
  const total = attempt.questions.length;

  const pos = Math.min(Math.max(Number(qParam) || 1, 1), total); // 1-based
  const q = attempt.questions[pos - 1];
  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{attempt.examName}</h1>
        <span className="text-sm">Câu {pos}/{total}</span>
      </header>
      <article className="mt-6">
        <div dangerouslySetInnerHTML={{ __html: q.text }} /> {/* sanitized at import */}
        <Choices key={q.id} attemptId={attempt.id} questionId={q.id} choices={q.choices} need={q.need} initial={q.selected} />
      </article>
      <nav className="mt-6 flex items-center gap-3">
        {pos > 1 && <Link href={`?q=${pos - 1}`} className="rounded border px-3 py-1">Trước</Link>}
        {pos < total && <Link href={`?q=${pos + 1}`} className="rounded border px-3 py-1">Sau</Link>}
        <form action={submitAttemptAction.bind(null, attempt.id)} className="ml-auto">
          <button className="rounded bg-foreground px-3 py-1 text-background">Nộp bài</button>
        </form>
      </nav>
    </main>
  );
}
