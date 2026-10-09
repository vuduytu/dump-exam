import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "@/db";
import { userCertifications } from "@/db/schema";

/** Call in `before()` of each DB test file: applies migrations, then empties every table. */
export async function resetDb() {
  const [[{ name }]] = (await db.execute(sql`select database() as name`)) as unknown as [[{ name: string }]];
  if (!name.endsWith("_test")) throw new Error(`refusing to reset non-test database "${name}"`);
  await migrate(db, { migrationsFolder: "db/migrations" });
  const [tables] = (await db.execute(
    sql`select table_name as t from information_schema.tables where table_schema = database() and table_name <> '__drizzle_migrations'`,
  )) as unknown as [{ t: string }[]];
  // transaction = one pooled connection, so the session flag applies to every truncate
  await db.transaction(async (tx) => {
    await tx.execute(sql`set foreign_key_checks = 0`);
    for (const { t } of tables) await tx.execute(sql.raw(`truncate table \`${t}\``));
    await tx.execute(sql`set foreign_key_checks = 1`);
  });
}

/** Call in `after()` so the test process can exit. */
export async function closeDb() {
  await db.$client.end();
}

/** Certification Access to PMP for Users inserted straight into the table (createUser grants it itself). */
export async function grantPmp(...userIds: number[]) {
  await db.insert(userCertifications).values(userIds.map((userId) => ({ userId, certification: "PMP" as const })));
}
