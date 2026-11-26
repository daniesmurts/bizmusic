/**
 * Stable media URLs for the private Yandex Object Storage bucket.
 *
 * Each request presigns a short-lived GET URL (signed by the service account)
 * and 302-redirects to it, so the route URL itself never expires: safe to store
 * in the DB (license pdfUrl, track fileUrl) and in OG meta tags.
 *
 * - blog/, covers/, licenses/: public.
 * - tracks/, announcements/: licensed audio, signed-in users only.
 */

import { NextRequest, NextResponse } from "next/server";
import { S3_ENABLED, s3PresignGet } from "@/lib/s3-storage";
import { getSessionUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_PREFIXES = ["blog/", "covers/", "licenses/"];
const AUTHENTICATED_PREFIXES = ["tracks/", "announcements/"];

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  const objectPath = path.map((p) => decodeURIComponent(p)).join("/");

  if (!objectPath || objectPath.includes("..")) {
    return NextResponse.json({ error: "bad_path" }, { status: 400 });
  }

  const isPublic = PUBLIC_PREFIXES.some((p) => objectPath.startsWith(p));
  const isAudio = AUTHENTICATED_PREFIXES.some((p) => objectPath.startsWith(p));
  if (!isPublic && !isAudio) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (isAudio && !(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!S3_ENABLED) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  try {
    const url = await s3PresignGet(objectPath, 6 * 3600);
    const res = NextResponse.redirect(url, 302);
    // Audio redirects are per-user; don't let shared caches keep them.
    if (isAudio) res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "presign_failed", message }, { status: 502 });
  }
}
