import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { examQuestions, exams } from "@/db/schema";
import { abandonAttemptAction, startAttemptAction } from "@/app/actions";
import Link from "next/link";
import { findOpenAttempt, listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SubmitButton } from "@/components/submit-button";

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
      <h1 className="text-2xl font-semibold">Đề thi</h1>
      <Card className="mt-6 gap-0 py-0"><ul className="divide-y">
        {list.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <span>{e.name}</span>
            <span className="ml-auto text-sm text-muted-foreground">
              {e.total} câu{best.has(e.id) && ` · cao nhất ${best.get(e.id)}/${e.total}`}
            </span>
            {open.has(e.id) ? (
              <>
                <Badge className="bg-marked-soft text-marked">đang làm dở</Badge>
                <Link href={`/attempts/${open.get(e.id)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Làm tiếp</Link>
                <ConfirmDialog
                  trigger="Bỏ, làm lại từ đầu"
                  triggerProps={{ size: "sm" }}
                  title="Bỏ bài đang làm dở?"
                  description="Các đáp án đã chọn sẽ bị xoá và bạn làm lại từ đầu."
                  confirm="Bỏ và làm lại"
                  action={abandonAttemptAction.bind(null, open.get(e.id)!)}
                />
              </>
            ) : (
              <form action={startAttemptAction.bind(null, e.id)} className="flex gap-2">
                <SubmitButton variant="outline" size="sm" name="timed" value="1">Bấm giờ 230 phút</SubmitButton>
                <SubmitButton variant="outline" size="sm" name="timed" value="0">Không bấm giờ</SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul></Card>
    </main>
  );
}
