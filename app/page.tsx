import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { examQuestions, exams } from "@/db/schema";
import { logoutAction } from "@/app/actions";
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
  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">PMP Practice</h1>
        <form action={logoutAction} className="flex items-center gap-3">
          <span className="text-sm">{user?.email}</span>
          <button className="rounded border px-3 py-1 text-sm">Đăng xuất</button>
        </form>
      </header>
      <ul className="mt-6 divide-y rounded border">
        {list.map((e) => (
          <li key={e.id} className="flex justify-between p-3">
            <span>{e.name}</span>
            <span className="text-sm">{e.total} câu</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
