import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 30;

export class InvalidCredentials extends Error {
  constructor() {
    super("Email hoặc mật khẩu không đúng");
  }
}

export class UserLocked extends Error {
  constructor() {
    super("Tài khoản đã bị khoá");
  }
}

/** `<salt hex>:<scrypt key hex>`, fresh 16-byte salt per call. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scryptAsync(password, salt, 64)).toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":").map((h) => Buffer.from(h, "hex"));
  return timingSafeEqual(await scryptAsync(password, salt, 64), key);
}

// Hashed against when the email is unknown, so both failures take the same time.
const dummyHash = hashPassword(randomBytes(16).toString("hex"));

export async function login(email: string, password: string): Promise<User> {
  const [user] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) throw new InvalidCredentials();
  if (user.locked) throw new UserLocked();
  return user;
}

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Cookie value `<userId>.<expires ms>.<HMAC>`, valid for SESSION_DAYS from `now`. */
export function createSessionToken(userId: number, now = new Date()) {
  const payload = `${userId}.${now.getTime() + SESSION_DAYS * 86_400_000}`;
  return `${payload}.${sign(payload)}`;
}

/** The User behind a session cookie, re-read from the DB; null if missing, forged, expired or locked. */
export async function userFromSession(token: string | undefined, now = new Date()): Promise<User | null> {
  const [id, expires, mac] = token?.split(".") ?? [];
  if (!mac) return null;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (now.getTime() > Number(expires)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
  return user && !user.locked ? user : null;
}
