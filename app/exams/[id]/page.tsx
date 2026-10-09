import { and, count, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { examQuestions, exams } from "@/db/schema";
import { abandonAttemptAction, startAttemptAction } from "@/app/actions";
import { listAttempts, openAttemptSummary } from "@/lib/attempts";
import { TIME_LIMIT_MIN } from "@/lib/utils";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { certificationsOf } from "@/lib/users";
import { Card } from "@/components/ui/card";
import { RefreshOnReturn } from "@/components/refresh-on-return";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const examId = Number(id);
  if (!Number.isInteger(examId)) notFound();
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const [exam] = await db
    .select({ id: exams.id, name: exams.name, certification: exams.certification, total: count(examQuestions.questionId) })
    .from(exams)
    .leftJoin(examQuestions, eq(examQuestions.examId, exams.id))
    .where(and(eq(exams.id, examId), inArray(exams.certification, await certificationsOf(user.id)))) // no Certification Access: 404
    .groupBy(exams.id);
  if (!exam) notFound();
  const history = (await listAttempts(user.id, exam.certification)).filter((a) => a.examId === examId); // own Attempts only
  const best = Math.max(0, ...history.map((a) => a.score));
  const open = await openAttemptSummary(user.id, examId);
  const minLeft = open?.deadline ? Math.max(0, Math.ceil((open.deadline.getTime() - Date.now()) / 60_000)) : null;
  return (
    <main className="mx-auto max-w-2xl p-4">
      <RefreshOnReturn renderId={crypto.randomUUID()} />
      <Link href="/" className="text-sm text-muted-foreground hover:underline">← Đề thi</Link>
      <h1 className="mt-2 break-words text-2xl font-semibold">{exam.name}</h1>
      <p className="text-sm text-muted-foreground">
        {exam.total} câu{history.length > 0 && ` · cao nhất ${best}/${exam.total}`}
      </p>

      {open ? (
        <Card className="mt-6 gap-3 p-4">
          <h2 className="font-semibold">Làm tiếp</h2>
          <p className="text-sm text-muted-foreground">
            Đã làm {open.answered}/{open.total} câu
            {minLeft !== null ? ` · còn ${minLeft} phút` : " · không bấm giờ"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/attempts/${open.id}`} className={buttonVariants()}>Làm tiếp</Link>
            <ConfirmDialog
              trigger="Bỏ, làm lại"
              title="Bỏ bài đang làm dở?"
              description="Các đáp án đã chọn sẽ bị xoá và bạn làm lại từ đầu."
              confirm="Bỏ và làm lại"
              action={abandonAttemptAction.bind(null, open.id)}
            />
          </div>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="gap-3 p-4">
            <h2 className="font-semibold">Thi thử · {TIME_LIMIT_MIN} phút</h2>
            <p className="text-sm text-muted-foreground">Giống thi thật: đóng tab đồng hồ vẫn chạy, hết giờ tự nộp bài.</p>
            <form action={startAttemptAction.bind(null, exam.id)}>
              <SubmitButton name="timed" value="1">Bắt đầu thi thử</SubmitButton>
            </form>
          </Card>
          <Card className="gap-3 p-4">
            <h2 className="font-semibold">Luyện tập không bấm giờ</h2>
            <p className="text-sm text-muted-foreground">Làm thong thả, không bị tự nộp; nộp khi nào bạn muốn.</p>
            <form action={startAttemptAction.bind(null, exam.id)}>
              <SubmitButton variant="outline" name="timed" value="0">Bắt đầu luyện tập</SubmitButton>
            </form>
          </Card>
        </div>
      )}

      <h2 className="mt-8 font-semibold">Đã nộp</h2>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Chưa có lượt nào đã nộp.</p>
      ) : (
        <Card className="mt-2 gap-0 py-0"><ul className="divide-y">
          {history.map((a) => (
            <li key={a.id}>
              <Link href={`/attempts/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-muted">
                <span className="text-sm">{a.submittedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
                <span className="text-sm text-muted-foreground">{a.timed ? "Bấm giờ" : "Không bấm giờ"}</span>
                <span className="ml-auto">{a.score}/{a.total} ({Math.round((a.score / a.total) * 100)}%)</span>
              </Link>
            </li>
          ))}
        </ul></Card>
      )}
    </main>
  );
}
