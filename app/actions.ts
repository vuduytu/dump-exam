"use server";

// Next routes Server Actions by header, not path, so a POST to /login (skipped by middleware) can reach any action.
// Every action except loginAction must check userFromSession itself.

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { abandonAttempt, AttemptExpired, AttemptInProgress, AttemptNotFound, AttemptSubmitted, saveAnswer, startAttempt, setMark, submitAttempt } from "@/lib/attempts";
import { DrillEmpty, InvalidDrill, startDrill } from "@/lib/drills";
import { changePassword, createSessionToken, InvalidCredentials, login, WeakPassword, WrongOldPassword, SESSION_COOKIE, SESSION_DAYS, UserLocked, userFromSession } from "@/lib/auth";
import { CannotLockSelf, CERTIFICATION_COOKIE, createUser, EmailTaken, InvalidEmail, NoAccess, NoCertification, NotAdmin, resetPassword, setCertifications, setLocked, UserNotFound } from "@/lib/users";
import type { Certification } from "@/db/schema";

async function currentUserId() {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return user.id;
}

export async function loginAction(_prev: string | null, form: FormData) {
  try {
    const user = await login(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    (await cookies()).set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 86_400,
    });
  } catch (err) {
    if (err instanceof InvalidCredentials || err instanceof UserLocked) return err.message;
    throw err;
  }
  redirect("/");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/** Side menu Certification picker: only remembers the choice; every page re-checks Certification Access when reading it. */
export async function selectCertificationAction(certification: string) {
  await currentUserId();
  (await cookies()).set(CERTIFICATION_COOKIE, String(certification), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 365 * 86_400 });
  revalidatePath("/", "layout");
}

export async function startAttemptAction(examId: number, form: FormData) {
  if (!Number.isInteger(Number(examId))) notFound();
  let id: number;
  try {
    id = await startAttempt(await currentUserId(), Number(examId), form.get("timed") === "1");
  } catch (err) {
    if (err instanceof NoAccess) notFound();
    if (!(err instanceof AttemptInProgress)) throw err;
    id = err.attemptId; // double click or stale page: carry on with the open Attempt
  }
  redirect(`/attempts/${id}`);
}

export async function startDrillAction(certification: Certification, source: string, size: number | "all") {
  let id: number;
  try {
    id = await startDrill(await currentUserId(), certification, String(source), size === "all" ? size : Number(size));
  } catch (err) {
    if (err instanceof InvalidDrill || err instanceof DrillEmpty || err instanceof NoAccess) notFound(); // the page offers only real, non-empty sources of a Certification the User has access to
    if (!(err instanceof AttemptInProgress)) throw err;
    id = err.attemptId; // an open Drill of this source: carry on with it
  }
  redirect(`/attempts/${id}`);
}

export async function abandonAttemptAction(attemptId: number) {
  try {
    await abandonAttempt(await currentUserId(), Number(attemptId));
  } catch (err) {
    if (!(err instanceof AttemptNotFound || err instanceof AttemptExpired)) throw err; // already gone (double click) / now in history
  }
  revalidatePath("/");
  revalidatePath("/exams/[id]", "page");
  revalidatePath("/drills");
}

export async function saveAnswerAction(attemptId: number, questionId: number, letters: string[]) {
  if (!Array.isArray(letters) || !letters.every((l) => typeof l === "string")) throw new Error("letters must be a string array");
  try {
    await saveAnswer(await currentUserId(), Number(attemptId), Number(questionId), letters);
  } catch (err) {
    if (err instanceof AttemptNotFound) notFound(); // another User's, or Certification Access revoked
    if (err instanceof AttemptExpired || err instanceof AttemptSubmitted) redirect(`/attempts/${Number(attemptId)}`); // the page shows the Score
    throw err;
  }
}

export async function setMarkAction(attemptId: number, questionId: number, marked: boolean) {
  try {
    await setMark(await currentUserId(), Number(attemptId), Number(questionId), marked === true);
  } catch (err) {
    if (err instanceof AttemptNotFound) notFound();
    if (err instanceof AttemptExpired || err instanceof AttemptSubmitted) redirect(`/attempts/${Number(attemptId)}`);
    throw err;
  }
  // no revalidatePath: the Attempt screen keeps its own state, a re-render would resend all 180 Questions
}

export async function submitAttemptAction(attemptId: number) {
  try {
    await submitAttempt(await currentUserId(), Number(attemptId));
  } catch (err) {
    if (err instanceof AttemptNotFound) notFound();
    if (!(err instanceof AttemptSubmitted)) throw err; // double click: already submitted, just show the Score
  }
  redirect(`/attempts/${Number(attemptId)}`);
}

export type FormState = { error?: string; ok?: string } | null;

/** Runs an Admin/account change: known errors become a message for the form, a non-Admin gets 404. */
async function formResult(ok: string, run: () => Promise<unknown>): Promise<FormState> {
  try {
    await run();
  } catch (err) {
    if (err instanceof NotAdmin) notFound();
    if (err instanceof InvalidEmail || err instanceof EmailTaken || err instanceof WeakPassword || err instanceof WrongOldPassword || err instanceof UserNotFound || err instanceof NoCertification)
      return { error: err.message };
    throw err;
  }
  revalidatePath("/admin");
  return { ok };
}

// Admin actions: the Admin check lives in lib/users.ts, not here.
export async function createUserAction(_prev: FormState, form: FormData) {
  const actingId = await currentUserId();
  return formResult("Đã tạo User", () => createUser(actingId, String(form.get("email") ?? ""), String(form.get("password") ?? ""), form.getAll("certification").map(String)));
}

export async function setCertificationsAction(userId: number, _prev: FormState, form: FormData) {
  const actingId = await currentUserId();
  return formResult("Đã lưu Certification", () => setCertifications(actingId, Number(userId), form.getAll("certification").map(String)));
}

export async function resetPasswordAction(userId: number, _prev: FormState, form: FormData) {
  const actingId = await currentUserId();
  return formResult("Đã đặt lại mật khẩu", () => resetPassword(actingId, Number(userId), String(form.get("password") ?? "")));
}

export async function setLockedAction(userId: number, locked: boolean) {
  const actingId = await currentUserId();
  try {
    await setLocked(actingId, Number(userId), locked === true);
  } catch (err) {
    if (err instanceof NotAdmin) notFound();
    if (!(err instanceof CannotLockSelf || err instanceof UserNotFound)) throw err; // the UI hides the button for yourself
  }
  revalidatePath("/admin");
}

export async function changePasswordAction(_prev: FormState, form: FormData) {
  const userId = await currentUserId();
  return formResult("Đã đổi mật khẩu", () => changePassword(userId, String(form.get("old") ?? ""), String(form.get("new") ?? "")));
}
