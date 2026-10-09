import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

/** Shared header. No valid session (i.e. /login) means no header. */
export async function Header() {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return null;
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <Link href="/" className="font-semibold">PMP Practice</Link>
        <nav className="flex gap-1 text-sm">
          <Link href="/history" className={buttonVariants({ variant: "ghost" })}>Lịch sử</Link>
          <Link href="/account" className={buttonVariants({ variant: "ghost" })}>Tài khoản</Link>
          {user.isAdmin && <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>Quản lý User</Link>}
        </nav>
        <form action={logoutAction} className="ml-auto flex items-center gap-2">
          <span className="max-w-[40vw] truncate text-sm text-muted-foreground">{user.email}</span>
          <Button type="submit" variant="outline" size="sm">Đăng xuất</Button>
        </form>
      </div>
    </header>
  );
}
