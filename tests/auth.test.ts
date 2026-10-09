import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { seedAdmin } from "@/db/seed";
import { createSessionToken, InvalidCredentials, login, UserLocked, userFromSession } from "@/lib/auth";
import { closeDb, resetDb } from "./db";

const ADMIN = "admin@dump-exam.local";

before(async () => {
  await resetDb();
  process.env.ADMIN_PASSWORD = "first-pass";
  await seedAdmin();
});
after(closeDb);

test("seeded Admin logs in with ADMIN_PASSWORD", async () => {
  const user = await login(ADMIN, "first-pass");
  assert.equal(user.email, ADMIN);
  assert.equal(user.isAdmin, true);
});

test("wrong password and unknown email both fail with the same message", async () => {
  await assert.rejects(login(ADMIN, "nope"), InvalidCredentials);
  await assert.rejects(login("ghost@example.com", "first-pass"), InvalidCredentials);
  await assert.rejects(login(ADMIN, "nope"), { message: "Email hoặc mật khẩu không đúng" });
  await assert.rejects(login("ghost@example.com", "x"), { message: "Email hoặc mật khẩu không đúng" });
});

test("seeding the Admin twice keeps one Admin and the original password", async () => {
  process.env.ADMIN_PASSWORD = "second-pass";
  await seedAdmin();
  const [{ n }] = await db.select({ n: count() }).from(users);
  assert.equal(n, 1);
  await login(ADMIN, "first-pass");
});

test("seeding the Admin without ADMIN_PASSWORD fails clearly", async () => {
  delete process.env.ADMIN_PASSWORD;
  await assert.rejects(seedAdmin(), /ADMIN_PASSWORD/);
});

test("a session token resolves to its User until it expires or is tampered with", async () => {
  const user = await login(ADMIN, "first-pass");
  const now = new Date("2026-01-01T00:00:00Z");
  const token = createSessionToken(user.id, now);

  assert.equal((await userFromSession(token, now))?.id, user.id);
  assert.equal((await userFromSession(token, new Date("2026-01-30T23:59:00Z")))?.id, user.id);
  assert.equal(await userFromSession(token, new Date("2026-01-31T00:00:01Z")), null);
  assert.equal(await userFromSession(token.replace(/^\d+/, "999"), now), null);
  assert.equal(await userFromSession(token.slice(0, -2) + "xx", now), null);
  assert.equal(await userFromSession(undefined, now), null);
});

test("a locked User cannot log in and loses an open session on the next request", async () => {
  const user = await login(ADMIN, "first-pass");
  const token = createSessionToken(user.id, new Date());
  await db.update(users).set({ locked: true }).where(eq(users.id, user.id));

  await assert.rejects(login(ADMIN, "first-pass"), UserLocked);
  assert.equal(await userFromSession(token, new Date()), null);
});
