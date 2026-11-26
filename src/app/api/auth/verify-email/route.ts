import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/actions/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ok = token ? await verifyEmailToken(token) : false;

  const url = req.nextUrl.clone();
  url.search = "";
  if (ok) {
    url.pathname = "/dashboard";
  } else {
    url.pathname = "/login";
    url.searchParams.set("notice", "verify_link_invalid");
  }
  return NextResponse.redirect(url);
}
