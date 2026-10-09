import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getScoreboard } from "@/lib/scoreboard";

export const dynamic = "force-dynamic";

export default async function Scoreboard() {
  const me = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!me) redirect("/login");
  if (!me.isAdmin) notFound();
  const { users, exams, cells } = await getScoreboard(me.id);
  const cellOf = new Map(cells.map((c) => [`${c.userId}:${c.examId}`, c]));
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-semibold">Bảng điểm</h1>
      <Card className="mt-6 overflow-x-auto py-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 font-medium">User</th>
              {exams.map((e) => <th key={e.id} className="whitespace-nowrap p-3 font-medium">{e.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className={u.locked ? "opacity-50" : undefined}>
                <th className="p-3 text-left font-normal">
                  <Link href={`/history?user=${u.id}`} className="underline-offset-4 hover:underline">{u.email}</Link>
                  {u.locked && <span className="ml-2 text-muted-foreground">(đã khoá)</span>}
                </th>
                {exams.map((e) => {
                  const c = cellOf.get(`${u.id}:${e.id}`);
                  return (
                    <td key={e.id} className="whitespace-nowrap p-3">
                      {c?.latestAttemptId && (
                        <Link href={`/attempts/${c.latestAttemptId}`} className="underline-offset-4 hover:underline">
                          {c.latestScore}/{e.total} · {c.submitted} lượt
                        </Link>
                      )}
                      {c?.openAnswered != null && <div className="text-muted-foreground">đang làm {c.openAnswered}/{e.total}</div>}
                      {!c && <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
