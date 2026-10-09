import { cookies } from "next/headers";
import { SideMenu } from "@/components/side-menu";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

/** Shared navigation. No valid session (i.e. /login) means no menu. */
export async function Header() {
  const user = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return null;
  return <SideMenu email={user.email} isAdmin={user.isAdmin} />;
}
