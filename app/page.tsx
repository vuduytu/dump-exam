import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { examQuestions, exams } from "@/db/schema";
import { logoutAction, startAttemptAction } from "@/app/actions";
import Link from "next/link";
import { listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // read Exams per request, not at build

export default async function Home() {
  // middleware already rejected anonymous requests; this read is for display
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  const list = await db
    .select({ id: exams.id, name: exams.name, total: count(examQuestions.questionId) })
    .from(exams)
    .leftJoin(examQuestions, eq(examQuestions.examId, exams.id))
    .groupBy(exams.id)
    .orderBy(exams.id);
  const best = new Map<number, number>();
  for (const a of user ? await listAttempts(user.id) : []) best.set(a.examId, Math.max(best.get(a.examId) ?? 0, a.score));
  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">PMP Practice</h1>
        <form action={logoutAction} className="flex items-center gap-3">
          <span className="text-sm">{user?.email}</span>
          <button className="rounded border px-3 py-1 text-sm">Đăng xuất</button>
        </form>
      </header>
      <Link href="/history" className="mt-4 inline-block underline">Lịch sử</Link>
      <ul className="mt-6 divide-y rounded border">
        {list.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 p-3">
            <span>{e.name}</span>
            <span className="ml-auto text-sm">
              {e.total} câu{best.has(e.id) && ` · cao nhất ${best.get(e.id)}/${e.total}`}
            </span>
            <form action={startAttemptAction.bind(null, e.id)}>
              <button className="rounded border px-3 py-1 text-sm">Làm bài</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
