import { eq } from "drizzle-orm";
import { db } from "@/db";
import { CERTIFICATIONS, userCertifications, users, type Certification } from "@/db/schema";
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

export class NoCertification extends Error {
  constructor() {
    super("Chọn ít nhất 1 Certification");
  }
}

export class NoAccess extends Error {
  constructor() {
    super("Không có quyền với Certification này"); // also for an unknown Exam: do not reveal that it exists
  }
}

/** The User's Certification Access in CERTIFICATIONS order: all of them for an Admin, none for an unknown User. */
export async function certificationsOf(userId: number, conn: Pick<typeof db, "select"> = db): Promise<Certification[]> {
  const [user] = await conn.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
  if (!user) return [];
  if (user.isAdmin) return [...CERTIFICATIONS];
  const rows = await conn.select({ c: userCertifications.certification }).from(userCertifications).where(eq(userCertifications.userId, userId));
  return CERTIFICATIONS.filter((c) => rows.some((r) => r.c === c));
}

/** Throws NoAccess unless the User has Certification Access to `certification` (any string: it may come from a request). */
export async function assertAccess(userId: number, certification: string) {
  if (!(await certificationsOf(userId)).some((c) => c === certification)) throw new NoAccess();
}

/** Remembers the User's last Certification choice in the side menu (per browser). */
export const CERTIFICATION_COOKIE = "certification";

/** The Certification the pages show: the saved choice (cookie) while still allowed, else the first allowed one. */
export async function currentCertification(userId: number, saved: string | undefined) {
  const certs = await certificationsOf(userId);
  if (!certs.length) throw new NoAccess(); // cannot happen through the app: createUser/setCertifications keep >= 1
  return { certs, current: certs.find((c) => c === saved) ?? certs[0] };
}

const validCertifications = (input: string[]) => {
  const certs = CERTIFICATIONS.filter((c) => input.includes(c));
  if (!certs.length) throw new NoCertification();
  return certs;
};

/** Every Admin function starts here: re-reads the acting User, so a demoted or locked Admin is refused at once. */
export async function requireAdmin(actingId: number) {
  const [user] = await db.select({ isAdmin: users.isAdmin, locked: users.locked }).from(users).where(eq(users.id, actingId));
  if (!user?.isAdmin || user.locked) throw new NotAdmin();
}

export async function listUsers(actingId: number) {
  await requireAdmin(actingId);
  const [list, access] = await Promise.all([
    db.select({ id: users.id, email: users.email, isAdmin: users.isAdmin, locked: users.locked, createdAt: users.createdAt }).from(users).orderBy(users.id),
    db.select().from(userCertifications),
  ]);
  return list.map((u) => ({ ...u, certifications: CERTIFICATIONS.filter((c) => u.isAdmin || access.some((a) => a.userId === u.id && a.certification === c)) }));
}

export async function createUser(actingId: number, email: string, password: string, certifications: string[]) {
  await requireAdmin(actingId);
  const certs = validCertifications(certifications);
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) throw new InvalidEmail();
  if (password.length < MIN_PASSWORD) throw new WeakPassword();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (taken) throw new EmailTaken();
  try {
    const passwordHash = await hashPassword(password);
    return await db.transaction(async (tx) => {
      const [{ insertId }] = await tx.insert(users).values({ email, passwordHash });
      await tx.insert(userCertifications).values(certs.map((certification) => ({ userId: insertId, certification })));
      return { id: insertId, email };
    });
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

/** Replaces the User's Certification Access. Revoking only hides that Certification's data; nothing is deleted. */
export async function setCertifications(actingId: number, userId: number, certifications: string[]) {
  await requireAdmin(actingId);
  const certs = validCertifications(certifications);
  await db.transaction(async (tx) => {
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    if (!user) throw new UserNotFound();
    await tx.delete(userCertifications).where(eq(userCertifications.userId, userId));
    await tx.insert(userCertifications).values(certs.map((certification) => ({ userId, certification })));
  });
}
