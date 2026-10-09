"use server";

// Next routes Server Actions by header, not path, so a POST to /login (skipped by middleware) can reach any action.
// Every action except loginAction must check userFromSession itself.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, InvalidCredentials, login, SESSION_COOKIE, SESSION_DAYS, UserLocked } from "@/lib/auth";

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
