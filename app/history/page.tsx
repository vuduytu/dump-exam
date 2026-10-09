import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function History({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  // ?user=<id>: an Admin reads another User's History, read-only
  const userParam = (await searchParams).user;
  const other = userParam === undefined ? null : user.isAdmin ? (await listUsers(user.id)).find((u) => u.id === Number(userParam)) : null;
  if (userParam !== undefined && !other) notFound();
  const list = await listAttempts(other?.id ?? user.id);
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold">Lịch sử{other && ` · ${other.email}`}</h1>
      {list.length === 0 && <p className="mt-6">Chưa có lượt làm nào đã nộp.</p>}
      <Card className="mt-6 gap-0 py-0"><ul className="divide-y">
        {list.map((a) => (
          <li key={a.id}>
            <Link href={`/attempts/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-muted">
              <span className="font-medium">{a.examName}</span>
              <span className="text-sm text-muted-foreground">{a.submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
              <span className="text-sm text-muted-foreground">{a.timed ? "Bấm giờ" : "Không bấm giờ"}</span>
              <span className="text-sm text-muted-foreground">{Math.round(a.durationSec / 60)} phút</span>
              <span className="ml-auto">
                {a.score}/{a.total} ({Math.round((a.score / a.total) * 100)}%)
              </span>
            </Link>
          </li>
        ))}
      </ul></Card>
    </main>
  );
}
