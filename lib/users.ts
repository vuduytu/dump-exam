import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, MIN_PASSWORD, WeakPassword } from "@/lib/auth";

export class NotAdmin extends Error {
  constructor() {
    super("Không có quyền quản trị");
  }
}

export class InvalidEmail extends Error {
  constructor() {
    super("Email không đúng định dạng");
  }
}

export class EmailTaken extends Error {
  constructor() {
    super("Email đã tồn tại");
  }
}

export class UserNotFound extends Error {
  constructor() {
    super("Không tìm thấy User");
  }
}

export class CannotLockSelf extends Error {
  constructor() {
    super("Admin không tự khoá chính mình");
  }
}

/** Every Admin function starts here: re-reads the acting User, so a demoted or locked Admin is refused at once. */
export async function requireAdmin(actingId: number) {
  const [user] = await db.select({ isAdmin: users.isAdmin, locked: users.locked }).from(users).where(eq(users.id, actingId));
  if (!user?.isAdmin || user.locked) throw new NotAdmin();
}

export async function listUsers(actingId: number) {
  await requireAdmin(actingId);
  return db.select({ id: users.id, email: users.email, isAdmin: users.isAdmin, locked: users.locked, createdAt: users.createdAt }).from(users).orderBy(users.id);
}

export async function createUser(actingId: number, email: string, password: string) {
  await requireAdmin(actingId);
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) throw new InvalidEmail();
  if (password.length < MIN_PASSWORD) throw new WeakPassword();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (taken) throw new EmailTaken();
  try {
    const [{ insertId }] = await db.insert(users).values({ email, passwordHash: await hashPassword(password) });
    return { id: insertId, email };
  } catch (err) {
    if ((err as { cause?: { code?: string } }).cause?.code === "ER_DUP_ENTRY") throw new EmailTaken(); // lost a race with the check above
    throw err;
  }
}

export async function resetPassword(actingId: number, userId: number, newPassword: string) {
  await requireAdmin(actingId);
  if (newPassword.length < MIN_PASSWORD) throw new WeakPassword();
  const [res] = await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, userId));
  if (!res.affectedRows) throw new UserNotFound();
}

export async function setLocked(actingId: number, userId: number, locked: boolean) {
  await requireAdmin(actingId);
  if (locked && userId === actingId) throw new CannotLockSelf();
  const [res] = await db.update(users).set({ locked }).where(eq(users.id, userId));
  if (!res.affectedRows) throw new UserNotFound(); // note: affectedRows is matched rows with mysql2 default flags
}
