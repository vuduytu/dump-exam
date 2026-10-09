import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Link from "next/link";
import { db } from "@/db";
import { examQuestions, exams } from "@/db/schema";
import { findOpenAttempt, listAttempts } from "@/lib/attempts";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
  const open = new Set<number>();
  for (const e of list) if (user && (await findOpenAttempt(user.id, e.id))) open.add(e.id);
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-semibold">Đề thi</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <li key={e.id}>
            <Link href={`/exams/${e.id}`} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
              <Card className="h-full gap-1 p-4 transition-colors hover:bg-muted">
                <span className="break-words font-medium">{e.name}</span>
                <span className="text-sm text-muted-foreground">
                  {e.total} câu{best.has(e.id) && ` · cao nhất ${best.get(e.id)}/${e.total}`}
                </span>
                {open.has(e.id) && <Badge className="mt-2 bg-marked-soft text-marked">đang làm dở</Badge>}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
