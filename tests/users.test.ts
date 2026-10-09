import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { seedAdmin, ADMIN_EMAIL } from "@/db/seed";
import { changePassword, login, UserLocked, InvalidCredentials, WeakPassword, WrongOldPassword } from "@/lib/auth";
import { createUser, CannotLockSelf, EmailTaken, InvalidEmail, listUsers, NotAdmin, resetPassword, setLocked, UserNotFound } from "@/lib/users";
import { closeDb, resetDb } from "./db";

let adminId: number;
let aliceId: number;

before(async () => {
  await resetDb();
  process.env.ADMIN_PASSWORD = "admin-pass-1";
  await seedAdmin();
  adminId = (await login(ADMIN_EMAIL, "admin-pass-1")).id;
  aliceId = (await createUser(adminId, "  Alice@Example.com ", "alice-pass-1", ["PMP"])).id;
});
after(closeDb);

test("createUser normalizes the email and the new User can log in", async () => {
  const user = await login("alice@example.com", "alice-pass-1");
  assert.equal(user.email, "alice@example.com");
  assert.equal(user.isAdmin, false);
});

test("createUser rejects a duplicate email (case-insensitive), a bad email and a short password", async () => {
  await assert.rejects(createUser(adminId, "ALICE@example.com", "alice-pass-1", ["PMP"]), EmailTaken);
  for (const bad of ["", "nope", "a@b", "a b@c.com"]) await assert.rejects(createUser(adminId, bad, "alice-pass-1", ["PMP"]), InvalidEmail);
  await assert.rejects(createUser(adminId, "bob@example.com", "short", ["PMP"]), WeakPassword);
});

test("listUsers returns email, locked, createdAt and never the password hash", async () => {
  const list = await listUsers(adminId);
  assert.deepEqual(list.map((u) => u.email), [ADMIN_EMAIL, "alice@example.com"]);
  assert.ok(list[1].createdAt instanceof Date);
  for (const u of list) assert.ok(!("passwordHash" in u) && !/[0-9a-f]{32}/.test(JSON.stringify(u)));
});

test("a non-Admin is refused every Admin function", async () => {
  await assert.rejects(listUsers(aliceId), NotAdmin);
  await assert.rejects(createUser(aliceId, "bob@example.com", "bob-pass-12", ["PMP"]), NotAdmin);
  await assert.rejects(resetPassword(aliceId, aliceId, "alice-pass-2"), NotAdmin);
  await assert.rejects(setLocked(aliceId, adminId, true), NotAdmin);
  await assert.rejects(listUsers(99999), NotAdmin);
  await login(ADMIN_EMAIL, "admin-pass-1"); // untouched
});

test("resetPassword: the new password works, the old one does not", async () => {
  await resetPassword(adminId, aliceId, "alice-pass-2");
  await login("alice@example.com", "alice-pass-2");
  await assert.rejects(login("alice@example.com", "alice-pass-1"), InvalidCredentials);
  await assert.rejects(resetPassword(adminId, aliceId, "x"), WeakPassword);
  await assert.rejects(resetPassword(adminId, 99999, "alice-pass-3"), UserNotFound);
});

test("setLocked locks and unlocks; the Admin cannot lock themself", async () => {
  await assert.rejects(setLocked(adminId, adminId, true), CannotLockSelf);
  await setLocked(adminId, aliceId, true);
  await assert.rejects(login("alice@example.com", "alice-pass-2"), UserLocked);
  assert.equal((await listUsers(adminId)).find((u) => u.id === aliceId)?.locked, true);
  await setLocked(adminId, aliceId, false);
  await login("alice@example.com", "alice-pass-2");
  await assert.rejects(setLocked(adminId, 99999, true), UserNotFound);
});

test("changePassword needs the right old password", async () => {
  await assert.rejects(changePassword(aliceId, "wrong", "alice-pass-3"), WrongOldPassword);
  await assert.rejects(changePassword(aliceId, "alice-pass-2", "short"), WeakPassword);
  await login("alice@example.com", "alice-pass-2"); // nothing changed yet
  await changePassword(aliceId, "alice-pass-2", "alice-pass-3");
  await login("alice@example.com", "alice-pass-3");
  await assert.rejects(login("alice@example.com", "alice-pass-2"), InvalidCredentials);
});
