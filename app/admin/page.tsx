import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createUserAction, resetPasswordAction, setLockedAction } from "@/app/actions";
import { ActionForm } from "@/app/action-form";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const me = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!me) redirect("/login");
  if (!me.isAdmin) notFound();
  const list = await listUsers(me.id);
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Quản lý User</h1>
      <Link href="/" className="mt-2 inline-block underline">Trang chủ</Link>
      <h2 className="mt-6 font-medium">Tạo User</h2>
      <ActionForm action={createUserAction} submit="Tạo" className="mt-2 flex flex-wrap items-start gap-3">
        <input name="email" type="email" required placeholder="Email" aria-label="Email" className="rounded border px-3 py-1" />
        <input name="password" type="text" required minLength={8} placeholder="Mật khẩu ban đầu" aria-label="Mật khẩu ban đầu" autoComplete="off" className="rounded border px-3 py-1" />
      </ActionForm>
      <ul className="mt-6 divide-y rounded border">
        {list.map((u) => (
          <li key={u.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 p-3">
            <span className="font-medium">{u.email}</span>
            {u.isAdmin && <span className="text-xs">Admin</span>}
            <span className="text-sm">{u.createdAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
            {u.locked && <span className="rounded bg-red-200 px-2 py-0.5 text-xs text-red-950">đã khoá</span>}
            <div className="ml-auto flex flex-wrap items-start gap-3">
              <ActionForm action={resetPasswordAction.bind(null, u.id)} submit="Đặt lại mật khẩu" className="flex flex-wrap items-start gap-2">
                <input name="password" type="text" required minLength={8} placeholder="Mật khẩu mới" aria-label={`Mật khẩu mới của ${u.email}`} autoComplete="off" className="rounded border px-2 py-1 text-sm" />
              </ActionForm>
              {u.id !== me.id && (
                <form action={setLockedAction.bind(null, u.id, !u.locked)}>
                  <button className="rounded border px-3 py-1 text-sm">{u.locked ? "Mở khoá" : "Khoá"}</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
