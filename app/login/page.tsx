"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <main className="mx-auto mt-24 max-w-sm p-4">
      <h1 className="mb-6 text-2xl font-semibold">Đăng nhập</h1>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Email
          <input name="email" type="email" required autoComplete="username" className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Mật khẩu
          <input name="password" type="password" required autoComplete="current-password" className="rounded border px-3 py-2" />
        </label>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <button disabled={pending} className="rounded bg-foreground px-3 py-2 text-background disabled:opacity-50">
          Đăng nhập
        </button>
      </form>
    </main>
  );
}
