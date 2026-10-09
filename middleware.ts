import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

// Every request except /login (and static assets) needs a logged-in, unlocked User, re-read from the DB.
export async function middleware(req: NextRequest) {
  if (await userFromSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  runtime: "nodejs", // mysql2 + node:crypto
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
