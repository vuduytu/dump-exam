"use server";

// Next routes Server Actions by header, not path, so a POST to /login (skipped by middleware) can reach any action.
// Every action except loginAction must check userFromSession itself.

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { abandonAttempt, AttemptExpired, AttemptInProgress, AttemptNotFound, AttemptSubmitted, saveAnswer, startAttempt, submitAttempt, toggleMark } from "@/lib/attempts";
import { createSessionToken, InvalidCredentials, login, SESSION_COOKIE, SESSION_DAYS, UserLocked, userFromSession } from "@/lib/auth";

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

export async function startAttemptAction(examId: number, form: FormData) {
  if (!Number.isInteger(Number(examId))) notFound();
  let id: number;
  try {
    id = await startAttempt(await currentUserId(), Number(examId), form.get("timed") === "1");
  } catch (err) {
    if (!(err instanceof AttemptInProgress)) throw err;
    id = err.attemptId; // double click or stale page: carry on with the open Attempt
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
}

export async function saveAnswerAction(attemptId: number, questionId: number, letters: string[]) {
  if (!Array.isArray(letters) || !letters.every((l) => typeof l === "string")) throw new Error("letters must be a string array");
  try {
    await saveAnswer(await currentUserId(), Number(attemptId), Number(questionId), letters);
  } catch (err) {
    if (err instanceof AttemptExpired || err instanceof AttemptSubmitted) redirect(`/attempts/${Number(attemptId)}`); // the page shows the Score
    throw err;
  }
  revalidatePath(`/attempts/${Number(attemptId)}`); // refreshes the question grid
}

export async function toggleMarkAction(attemptId: number, questionId: number) {
  let marked: boolean;
  try {
    marked = await toggleMark(await currentUserId(), Number(attemptId), Number(questionId));
  } catch (err) {
    if (err instanceof AttemptExpired || err instanceof AttemptSubmitted) redirect(`/attempts/${Number(attemptId)}`);
    throw err;
  }
  revalidatePath(`/attempts/${Number(attemptId)}`);
  return marked;
}

export async function submitAttemptAction(attemptId: number) {
  try {
    await submitAttempt(await currentUserId(), Number(attemptId));
  } catch (err) {
    if (!(err instanceof AttemptSubmitted)) throw err; // double click: already submitted, just show the Score
  }
  redirect(`/attempts/${Number(attemptId)}`);
}
