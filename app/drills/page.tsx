import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import taxonomy from "@/data/tasks.json";
import { startDrillAction } from "@/app/actions";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

// ponytail: bare list to start a Drill; ticket 03 adds per-User stats and sorting
export default async function Drills() {
  const rows = await db.select({ task: questions.task, n: count() }).from(questions).where(eq(questions.usable, true)).groupBy(questions.task);
  const usable = new Map(rows.map((r) => [r.task, r.n]));
  const domains = [...new Set(taxonomy.tasks.map((t) => t.domain))].map((domain) => {
    const tasks = taxonomy.tasks.filter((t) => t.domain === domain).map((t) => ({ source: t.code, name: t.name, n: usable.get(t.code) ?? 0 }));
    return { domain, n: tasks.reduce((sum, t) => sum + t.n, 0), tasks };
  });
  const row = (source: string, name: string, n: number, strong = false) => (
    <li key={source} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
      <span className={strong ? "font-medium" : undefined}>{name}</span>
      <span className="text-sm text-muted-foreground">{n ? `${n} câu` : "chưa có câu"}</span>
      {n > 0 && (
        <span className="ml-auto flex gap-2">
          {[10, 20].map((size) => (
            <form key={size} action={startDrillAction.bind(null, source, size)}>
              <SubmitButton size="sm" variant="outline">Ôn {size}</SubmitButton>
            </form>
          ))}
        </span>
      )}
    </li>
  );
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold">Theo chủ đề</h1>
      {domains.map((d) => (
        <section key={d.domain} className="mt-6">
          <h2 className="font-semibold">{d.domain}</h2>
          <Card className="mt-2 gap-0 py-0">
            <ul className="divide-y">
              {row(d.domain, "Cả Domain", d.n, true)}
              {d.tasks.map((t) => row(t.source, t.name, t.n))}
            </ul>
          </Card>
        </section>
      ))}
    </main>
  );
}
