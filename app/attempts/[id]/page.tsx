import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AttemptNotFound, AttemptNotSubmitted, getAttempt, getResult } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { RefreshOnReturn } from "@/components/refresh-on-return";
import { AttemptScreen } from "./attempt-screen";
import { ResultScreen } from "./result-screen";

export default async function AttemptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; f?: string }> }) {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { q: qParam, f } = await searchParams;
  const filter = f === "wrong" || f === "marked" ? f : undefined;
  const result = await getResult(user.id, id).catch((err) => {
    if (err instanceof AttemptNotFound) notFound();
    if (err instanceof AttemptNotSubmitted) return null;
    throw err;
  });

  if (result) {
    const { score, total } = result;
    const pos = Math.min(Math.max(Math.trunc(Number(qParam)) || 1, 1), total);
    return (
      <ResultScreen
        examName={result.examName}
        score={score ?? 0}
        timed={result.timed}
        minutes={Math.round(((result.submittedAt?.getTime() ?? 0) - result.startedAt.getTime()) / 60000)}
        questions={result.questions}
        initialPos={pos}
        initialTab={filter}
      />
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
