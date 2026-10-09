import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { abandonAttemptAction, startDrillAction } from "@/app/actions";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { openDrills, topicStats } from "@/lib/drills";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

type Stat = { source: string; name: string; total: number; done: number; correct: number };

export default async function Drills() {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const [domains, open] = await Promise.all([topicStats(user.id), openDrills(user.id)]);
  const row = (s: Stat, strong = false) => {
    const o = open.get(s.source);
    return (
      <li key={s.source} className={`flex flex-wrap items-center gap-x-3 gap-y-2 p-3 ${s.total ? "" : "opacity-50"}`}>
        <span className={`min-w-0 break-words ${strong ? "font-medium" : ""}`}>{s.name}</span>
        <span className="text-sm text-muted-foreground">
          {s.total ? `${s.done}/${s.total} câu · ${s.done ? `${Math.round((s.correct / s.done) * 100)}% đúng` : "—"}` : "chưa có câu"}
        </span>
        {o ? (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Đang ôn {o.answered}/{o.total}</span>
            <Link href={`/attempts/${o.id}`} className={buttonVariants({ size: "sm" })}>Làm tiếp</Link>
            <ConfirmDialog
              trigger="Bỏ"
              triggerProps={{ size: "sm" }}
              title="Bỏ bài ôn đang làm dở?"
              description="Các đáp án đã chọn sẽ bị xoá; bạn có thể bắt đầu Ôn lại."
              confirm="Bỏ"
              action={abandonAttemptAction.bind(null, o.id)}
            />
          </span>
        ) : (
          s.total > 0 && (
            <span className="ml-auto flex gap-2">
              {[10, 20].map((size) => (
                <form key={size} action={startDrillAction.bind(null, s.source, size)}>
                  <SubmitButton size="sm" variant="outline">Ôn {size}</SubmitButton>
                </form>
              ))}
            </span>
          )
        )}
      </li>
    );
  };
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold">Theo chủ đề</h1>
      {domains.map((d) => (
        <section key={d.domain} className="mt-6">
          <h2 className="font-semibold">{d.domain}</h2>
          <Card className="mt-2 gap-0 py-0">
            <ul className="divide-y">
              {row({ source: d.domain, name: "Cả Domain", total: d.total, done: d.done, correct: d.correct }, true)}
              {d.tasks.map((t) => row(t))}
            </ul>
          </Card>
        </section>
      ))}
    </main>
  );
}
