import taxonomy from "@/data/tasks.json";
import type { Certification } from "@/db/schema";

/** PMP tags carry an Approach; PgMP tags have none. */
export type Tag = { id: number; task: string; approach?: string; confidence: string };

/** The Tasks of one Certification, in ECO order. Task codes and Domain names are unique across Certifications. */
export const tasksOf = (certification: Certification) => taxonomy.tasks.filter((t) => t.certification === certification);

/** Returns a list of human-readable errors; empty = valid. */
export function validateTags(questionIds: number[], tags: Tag[], certification: Certification): string[] {
  const taskCodes = new Set(tasksOf(certification).map((t) => t.code));
  const errors: string[] = [];
  const known = new Set(questionIds);
  const seen = new Map<number, number>();
  for (const t of tags) {
    seen.set(t.id, (seen.get(t.id) ?? 0) + 1);
    if (!known.has(t.id)) errors.push(`unknown id ${t.id}`);
    if (!taskCodes.has(t.task)) errors.push(`id ${t.id}: invalid task "${t.task}"`);
    if (certification === "PMP" ? !taxonomy.approaches.includes(t.approach!) : t.approach !== undefined) errors.push(`id ${t.id}: invalid approach "${t.approach}"`);
    if (!taxonomy.confidences.includes(t.confidence)) errors.push(`id ${t.id}: invalid confidence "${t.confidence}"`);
  }
  for (const [id, n] of seen) if (n > 1) errors.push(`duplicate id ${id} (x${n})`);
  for (const id of questionIds) if (!seen.has(id)) errors.push(`missing id ${id}`);
  return errors;
}

/** Task codes a Drill source covers: a Domain name gives its Tasks, a Task code itself; unknown or another Certification's gives []. */
export function tasksOfSource(certification: Certification, source: string) {
  return tasksOf(certification).filter((t) => t.domain === source || t.code === source).map((t) => t.code);
}

/** Per Domain (in taxonomy order): correct / number of its Questions. Questions without a Task belong to no Domain and are left out. */
export function domainScores(items: { task: string | null; correct: boolean }[]) {
  const domainOf = new Map(taxonomy.tasks.map((t) => [t.code, t.domain]));
  const byDomain = new Map<string, { correct: number; total: number }>();
  for (const d of new Set(domainOf.values())) byDomain.set(d, { correct: 0, total: 0 });
  for (const i of items) {
    const s = byDomain.get(domainOf.get(i.task ?? "") ?? "");
    if (!s) continue;
    s.total++;
    if (i.correct) s.correct++;
  }
  return [...byDomain].filter(([, s]) => s.total).map(([domain, s]) => ({ domain, ...s }));
}

/** The Task of a code, with its Domain; undefined for none or unknown. */
export const taskOf = (code: string | null) => taxonomy.tasks.find((t) => t.code === code);

/** "People · Manage conflicts" for a Task code; null for none or unknown. */
export function taskLabel(code: string | null) {
  const task = taskOf(code);
  return task ? `${task.domain} · ${task.name}` : null;
}

/** "Ôn: People" for a Domain, "Ôn: People · Manage conflicts" for a Task. */
export function drillTitle(source: string) {
  return `Ôn: ${taskLabel(source) ?? source}`;
}
