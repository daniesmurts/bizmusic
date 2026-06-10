/**
 * Public media route for Yandex Object Storage.
 *
 * The YC bucket is private; "public" assets (cover images, license PDFs) are
 * served by presigning a short-lived GET URL — signed by the service account —
 * and 302-redirecting to it. The route URL itself is stable and never expires,
 * so it's safe to store in the DB (license pdfUrl) and in OG/social meta tags;
 * only the redirect target is time-limited.
 *
 * SECURITY: only the prefixes in PUBLIC_PREFIXES may be presigned here. Audio
 * (tracks/, announcements/) is deliberately excluded so it can't be fetched
 * without going through the authenticated business-logic presign path
 * (getDownloadSignedUrl from Server Actions).
 */

import { NextRequest, NextResponse } from "next/server";
import { S3_ENABLED, s3PresignGet } from "@/lib/s3-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_PREFIXES = ["blog/", "covers/", "licenses/"];

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;
  const objectPath = path.map((p) => decodeURIComponent(p)).join("/");

  if (!objectPath || objectPath.includes("..")) {
    return NextResponse.json({ error: "bad_path" }, { status: 400 });
  }
  if (!PUBLIC_PREFIXES.some((p) => objectPath.startsWith(p))) {
    // Never presign private prefixes (tracks/, announcements/) via this public route.
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!S3_ENABLED) {
    // Only meaningful on the S3/Object Storage backend.
    return NextResponse.json({ error: "media_route_requires_s3" }, { status: 404 });
  }

  try {
    const url = await s3PresignGet(objectPath, 6 * 3600); // 6h target lifetime
    return NextResponse.redirect(url, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "presign_failed", message }, { status: 502 });
  }
}
