import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { submitAttemptAction } from "@/app/actions";
import { AttemptNotFound, getAttempt } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { Choices } from "./choices";

export default async function AttemptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }> }) {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const attempt = await getAttempt(user.id, id).catch((err) => {
    if (err instanceof AttemptNotFound) notFound();
    throw err;
  });
  const total = attempt.questions.length;

  if (attempt.submittedAt) {
    const score = attempt.score ?? 0;
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="text-2xl font-semibold">{attempt.examName} — đã nộp</h1>
        <p className="mt-6 text-4xl font-semibold">
          {score}/{total} <span className="text-2xl">({Math.round((score / total) * 100)}%)</span>
        </p>
        <Link href="/" className="mt-6 inline-block underline">Về trang chủ</Link>
      </main>
    );
  }

  const pos = Math.min(Math.max(Number((await searchParams).q) || 1, 1), total); // 1-based
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
