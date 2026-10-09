import taxonomy from "@/data/tasks.json";

export type Tag = { id: number; task: string; approach: string; confidence: string };

const TASKS = new Set(taxonomy.tasks.map((t) => t.code));

/** Returns a list of human-readable errors; empty = valid. */
export function validateTags(questionIds: number[], tags: Tag[]): string[] {
  const errors: string[] = [];
  const known = new Set(questionIds);
  const seen = new Map<number, number>();
  for (const t of tags) {
    seen.set(t.id, (seen.get(t.id) ?? 0) + 1);
    if (!known.has(t.id)) errors.push(`unknown id ${t.id}`);
    if (!TASKS.has(t.task)) errors.push(`id ${t.id}: invalid task "${t.task}"`);
    if (!taxonomy.approaches.includes(t.approach)) errors.push(`id ${t.id}: invalid approach "${t.approach}"`);
    if (!taxonomy.confidences.includes(t.confidence)) errors.push(`id ${t.id}: invalid confidence "${t.confidence}"`);
  }
  for (const [id, n] of seen) if (n > 1) errors.push(`duplicate id ${id} (x${n})`);
  for (const id of questionIds) if (!seen.has(id)) errors.push(`missing id ${id}`);
  return errors;
}
