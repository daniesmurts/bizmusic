import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAuthRoute = createRouteMatcher(["/login", "/register", "/forgot-password"]);
const isPartnerOnlyRoute = createRouteMatcher([
  "/dashboard/affiliate(.*)",
  "/dashboard/leads(.*)",
  "/dashboard/scripts(.*)",
  "/dashboard/guides(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role ?? null;

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(req) && !userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect non-ADMINs away from /admin
  if (isAdminRoute(req) && userId && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // PARTNER isolation: restrict to their allowed routes
  if (
    userId &&
    role === "PARTNER" &&
    req.nextUrl.pathname.startsWith("/dashboard") &&
    !isPartnerOnlyRoute(req)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/affiliate";
    return NextResponse.redirect(url);
  }

  // Redirect already-authenticated users away from auth pages
  if (isAuthRoute(req) && userId) {
    const url = req.nextUrl.clone();
    url.pathname = role === "PARTNER" ? "/dashboard/affiliate" : "/dashboard";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
