import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AttemptNotFound, AttemptNotSubmitted, getAttempt, getResult } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshOnReturn } from "@/components/refresh-on-return";
import { AttemptScreen } from "./attempt-screen";

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
  const pos = Math.min(Math.max(Math.trunc(Number(qParam)) || 1, 1), attempt.questions.length); // 1-based; junk/out of range → clamped
  return (
    <>
      <RefreshOnReturn renderId={crypto.randomUUID()} />
      <AttemptScreen
        attemptId={attempt.id}
        examName={attempt.examName}
        questions={attempt.questions} // getAttempt never includes the Correct Answer
        initialPos={pos}
        msLeft={attempt.deadline && attempt.deadline.getTime() - Date.now()}
      />
    </>
  );
}
