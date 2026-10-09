import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { CERTIFICATION_COOKIE, currentCertification, listUsers, NoAccess } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function History({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const jar = await cookies();
  const user = await userFromSession(jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const { current } = await currentCertification(user.id, jar.get(CERTIFICATION_COOKIE)?.value);
  // ?user=<id>: an Admin reads another User's History, read-only
  const userParam = (await searchParams).user;
  const other = userParam === undefined ? null : user.isAdmin ? (await listUsers(user.id)).find((u) => u.id === Number(userParam)) : null;
  if (userParam !== undefined && !other) notFound();
  // an Admin reading a User without access to the current Certification sees an empty History
  const list = await listAttempts(other?.id ?? user.id, current).catch((err) => {
    if (err instanceof NoAccess) return [];
    throw err;
  });
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold">Lịch sử{other && ` · ${other.email}`}</h1>
      {list.length === 0 && <p className="mt-6">Chưa có lượt làm nào đã nộp.</p>}
      {list.length > 0 &&
        [
          { heading: "Đề thi", items: list.filter((a) => a.examId !== null) },
          { heading: "Ôn theo chủ đề", items: list.filter((a) => a.examId === null) },
        ].map((g) => (
          <section key={g.heading} className="mt-6">
            <h2 className="font-semibold">{g.heading}</h2>
            {g.items.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có lượt nào.</p>
            ) : (
              <Card className="mt-2 gap-0 py-0"><ul className="divide-y">
                {g.items.map((a) => (
                  <li key={a.id}>
                    <Link href={`/attempts/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-muted">
                      <span className="font-medium">{a.title}</span>
                      <span className="text-sm text-muted-foreground">{a.submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
                      <span className="text-sm text-muted-foreground">{a.timed ? "Bấm giờ" : "Không bấm giờ"}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(a.durationSec / 60)} phút</span>
                      <span className="ml-auto flex items-center gap-3">
                        {a.score}/{a.total} ({Math.round((a.score / a.total) * 100)}%)
                        {/* the whole row is the link; this only looks like a button */}
                        <span className={buttonVariants({ size: "sm", variant: "outline" })}>Xem kết quả</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul></Card>
            )}
          </section>
        ))}
    </main>
  );
}
