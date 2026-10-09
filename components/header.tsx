import { cookies } from "next/headers";
import { SideMenu } from "@/components/side-menu";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { CERTIFICATION_COOKIE, currentCertification } from "@/lib/users";

/** Shared navigation. No valid session (i.e. /login) means no menu. */
export async function Header() {
  const jar = await cookies();
  const user = await userFromSession(jar.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  const { certs, current } = await currentCertification(user.id, jar.get(CERTIFICATION_COOKIE)?.value);
  return <SideMenu email={user.email} isAdmin={user.isAdmin} certifications={certs} current={current} />;
}
