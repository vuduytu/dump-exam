import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { examQuestions, exams } from "@/db/schema";
import { abandonAttemptAction, logoutAction, startAttemptAction } from "@/app/actions";
import Link from "next/link";
import { findOpenAttempt, listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { AbandonForm } from "./abandon-form";

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
  const open = new Map<number, number>(); // examId -> newest in-progress Attempt
  for (const e of list) {
    const id = user ? await findOpenAttempt(user.id, e.id) : null;
    if (id) open.set(e.id, id);
  }
  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">PMP Practice</h1>
        <form action={logoutAction} className="flex items-center gap-3">
          <span className="text-sm">{user?.email}</span>
          <button className="rounded border px-3 py-1 text-sm">Đăng xuất</button>
        </form>
      </header>
      <nav className="mt-4 flex gap-4">
        <Link href="/history" className="underline">Lịch sử</Link>
        <Link href="/account" className="underline">Tài khoản</Link>
        {user?.isAdmin && <Link href="/admin" className="underline">Quản lý User</Link>}
      </nav>
      <ul className="mt-6 divide-y rounded border">
        {list.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 p-3">
            <span>{e.name}</span>
            <span className="ml-auto text-sm">
              {e.total} câu{best.has(e.id) && ` · cao nhất ${best.get(e.id)}/${e.total}`}
            </span>
            {open.has(e.id) ? (
              <>
                <span className="rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-950">đang làm dở</span>
                <Link href={`/attempts/${open.get(e.id)}`} className="rounded border px-3 py-1 text-sm">Làm tiếp</Link>
                <AbandonForm action={abandonAttemptAction.bind(null, open.get(e.id)!)} />
              </>
            ) : (
              <form action={startAttemptAction.bind(null, e.id)} className="flex gap-2">
                <button name="timed" value="1" className="rounded border px-3 py-1 text-sm">Bấm giờ 230 phút</button>
                <button name="timed" value="0" className="rounded border px-3 py-1 text-sm">Không bấm giờ</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
