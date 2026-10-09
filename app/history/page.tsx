import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function History() {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const list = await listAttempts(user.id);
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold">Lịch sử</h1>
      <Link href="/" className="mt-2 inline-block underline">Trang chủ</Link>
      {list.length === 0 && <p className="mt-6">Chưa có lượt làm nào đã nộp.</p>}
      <ul className="mt-6 divide-y rounded border">
        {list.map((a) => (
          <li key={a.id}>
            <Link href={`/attempts/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
              <span className="font-medium">{a.examName}</span>
              <span className="text-sm">{a.submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
              <span className="text-sm">{a.timed ? "Bấm giờ" : "Không bấm giờ"}</span>
              <span className="text-sm">{Math.round(a.durationSec / 60)} phút</span>
              <span className="ml-auto">
                {a.score}/{a.total} ({Math.round((a.score / a.total) * 100)}%)
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
