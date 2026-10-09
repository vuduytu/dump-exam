"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <main className="mx-auto mt-24 max-w-sm p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              Email
              <input name="email" type="email" required autoComplete="username" className="field" />
            </label>
            <label className="flex flex-col gap-1">
              Mật khẩu
              <input name="password" type="password" required autoComplete="current-password" className="field" />
            </label>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <Button type="submit" disabled={pending}>Đăng nhập{pending && "…"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
