import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session-token";

// Signature-only check for routing. Server code re-validates against the DB via
// getSessionUser() (disabled accounts, revoked sessions).

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const PROTECTED = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];
const PARTNER_ONLY = ["/dashboard/affiliate", "/dashboard/leads", "/dashboard/scripts", "/dashboard/guides"];

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const role = session?.role ?? null;

  if (matches(pathname, PROTECTED) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    // Drop an expired/forged cookie so the client stops sending it.
    if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (matches(pathname, ["/admin"]) && session && role !== "ADMIN") {
    return redirectTo(req, "/dashboard");
  }

  if (session && role === "PARTNER" && matches(pathname, ["/dashboard"]) && !matches(pathname, PARTNER_ONLY)) {
    return redirectTo(req, "/dashboard/affiliate");
  }

  if (session && matches(pathname, AUTH_PAGES)) {
    return redirectTo(req, role === "PARTNER" ? "/dashboard/affiliate" : "/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register", "/forgot-password"],
};
