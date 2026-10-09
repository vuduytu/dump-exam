import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "@/db";
import { closeDb, resetDb } from "./db";

const rows = async (query: string) => ((await db.execute(sql.raw(query))) as unknown as [Record<string, unknown>[]])[0];

before(async () => {
  await resetDb(); // refuses a non-test database
  await db.transaction(async (tx) => {
    await tx.execute(sql`set foreign_key_checks = 0`);
    for (const { t } of await rows("select table_name as t from information_schema.tables where table_schema = database()"))
      await tx.execute(sql.raw(`drop table \`${t}\``));
    await tx.execute(sql`set foreign_key_checks = 1`);
  });
});
after(async () => {
  await resetDb(); // leave a fully migrated, empty database for the next file
  await closeDb();
});

test("migration 0007 tags pre-PgMP data as PMP and grants PMP to every existing User", async () => {
  // migrate up to 0006 only, from a copy whose journal stops there
  const old = mkdtempSync(join(tmpdir(), "migrations-"));
  cpSync("db/migrations", old, { recursive: true });
  const journal = JSON.parse(readFileSync(join(old, "meta/_journal.json"), "utf8"));
  journal.entries = journal.entries.filter((e: { idx: number }) => e.idx <= 6);
  writeFileSync(join(old, "meta/_journal.json"), JSON.stringify(journal));
  await migrate(db, { migrationsFolder: old });

  await db.execute(sql`insert into users (email, password_hash, is_admin) values ('a@x.test', '-', false), ('b@x.test', '-', true)`);
  await db.execute(sql`insert into questions (id, text, choices, suggested_answer, most_voted_answer, correct_answer, votes, usable) values (1, 'q', '[]', 'A', 'A', 'A', '[]', true)`);
  await db.execute(sql`insert into exams (name) values ('Đề 1')`);
  await db.execute(sql`insert into attempts (user_id, exam_id) select id, 1 from users`);

  await migrate(db, { migrationsFolder: "db/migrations" });
  for (const t of ["questions", "exams", "attempts"]) assert.deepEqual(await rows(`select distinct certification as c from ${t}`), [{ c: "PMP" }]);
  assert.deepEqual(await rows("select u.email, c.certification from user_certifications c join users u on u.id = c.user_id order by u.email"), [
    { email: "a@x.test", certification: "PMP" },
    { email: "b@x.test", certification: "PMP" },
  ]);
});
