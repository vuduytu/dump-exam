import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AttemptNotFound, AttemptNotSubmitted, getAttempt, getResult } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { attemptOwnerForAdmin } from "@/lib/scoreboard";
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
  // An Admin may read another User's submitted Result; another User's open Attempt stays private (404).
  const othersResult = async () => {
    if (!user.isAdmin) notFound();
    try {
      return await getResult(await attemptOwnerForAdmin(user.id, id), id);
    } catch (err) {
      if (err instanceof AttemptNotFound || err instanceof AttemptNotSubmitted) notFound();
      throw err;
    }
  };
  const result = await getResult(user.id, id).catch((err) => {
    if (err instanceof AttemptNotFound) return othersResult();
    if (err instanceof AttemptNotSubmitted) return null;
    throw err;
  });

  if (result) {
    const { score, total } = result;
    const pos = Math.min(Math.max(Math.trunc(Number(qParam)) || 1, 1), total);
    return (
      <ResultScreen
        title={result.title}
        drill={result.examId === null}
        domains={result.domains}
        score={score ?? 0}
        timed={result.timed}
        durationSec={Math.round(((result.submittedAt?.getTime() ?? 0) - result.startedAt.getTime()) / 1000)}
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
        title={attempt.title}
        drill={attempt.examId === null}
        questions={attempt.questions} // getAttempt never includes the Correct Answer
        initialPos={pos}
        msLeft={attempt.deadline && attempt.deadline.getTime() - Date.now()}
      />
    </>
  );
}
