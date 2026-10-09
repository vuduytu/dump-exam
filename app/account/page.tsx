import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { changePasswordAction } from "@/app/actions";
import { ActionForm } from "@/app/action-form";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Account() {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return (
    <main className="mx-auto max-w-sm p-4">
      <h1 className="text-2xl font-semibold">Tài khoản</h1>
      <Link href="/" className="mt-2 inline-block underline">Trang chủ</Link>
      <p className="mt-4 text-sm">{user.email}</p>
      <h2 className="mt-6 font-medium">Đổi mật khẩu</h2>
      <ActionForm action={changePasswordAction} submit="Đổi mật khẩu" className="mt-2 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Mật khẩu cũ
          <input name="old" type="password" required autoComplete="current-password" className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          Mật khẩu mới (ít nhất 8 ký tự)
          <input name="new" type="password" required minLength={8} autoComplete="new-password" className="rounded border px-3 py-2" />
        </label>
      </ActionForm>
    </main>
  );
}
