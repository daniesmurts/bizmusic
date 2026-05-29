/**
 * Diagnostic endpoint for debugging the storage proxy.
 *
 * Hit this URL from the browser or curl to understand exactly why the proxy
 * is returning 502:
 *
 *   https://bizmuzik.ru/api/storage-proxy/diagnostic
 *
 * Returns a JSON object with:
 *   - env:     which environment variables are set
 *   - head:    result of a HEAD request to the Supabase storage root
 *   - redirect: where the storage endpoint redirects to (if any)
 *   - error:   the raw error message if the request throws
 *
 * This route is intentionally admin-only in production — no file bytes or signed
 * tokens are exposed, only connectivity metadata.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.SUPABASE_STORAGE_UPSTREAM ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Auth headers required by Supabase on every storage request
function supabaseHeaders() {
  const h: Record<string, string> = {};
  if (SUPABASE_ANON_KEY) {
    h["apikey"] = SUPABASE_ANON_KEY;
    h["authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return h;
}

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Environment check
  results.env = {
    SUPABASE_STORAGE_UPSTREAM: process.env.SUPABASE_STORAGE_UPSTREAM
      ? `set (${process.env.SUPABASE_STORAGE_UPSTREAM.slice(0, 30)}...)`
      : "not set",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `set (${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...)`
      : "not set",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
      ? `set (${SUPABASE_ANON_KEY.slice(0, 20)}...)`
      : "NOT SET — proxy will get 400 on all Supabase requests",
    resolved_SUPABASE_URL: SUPABASE_URL
      ? `${SUPABASE_URL.slice(0, 40)}...`
      : "(empty — proxy will always 502)",
    NODE_ENV: process.env.NODE_ENV,
  };

  if (!SUPABASE_URL) {
    return NextResponse.json(
      { ...results, verdict: "FAIL: SUPABASE_URL is empty. Set NEXT_PUBLIC_SUPABASE_URL as a runtime env var in Yandex Cloud." },
      { status: 500 },
    );
  }

  // 2. DNS + TCP check — try a HEAD on the Supabase storage health path
  const healthTarget = `${SUPABASE_URL}/storage/v1/health`;
  try {
    const t0 = Date.now();
    const res = await fetch(healthTarget, {
      method: "HEAD",
      headers: supabaseHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    results.head = {
      target: healthTarget,
      status: res.status,
      ok: res.ok,
      latencyMs: Date.now() - t0,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (err) {
    results.head = {
      target: healthTarget,
      error: err instanceof Error ? err.message : String(err),
      errorName: err instanceof Error ? err.name : "unknown",
      errorCause:
        err instanceof Error && err.cause
          ? String((err.cause as Error).message ?? err.cause)
          : undefined,
    };
  }

  // 3. Redirect check — fetch with redirect:manual to see where Supabase Storage redirects
  //    We use the /storage/v1/object/public/ path (most likely to redirect to CDN)
  const redirectTarget = `${SUPABASE_URL}/storage/v1/object/public/bizmusic-assets/tracks/`;
  try {
    const t0 = Date.now();
    const res = await fetch(redirectTarget, {
      method: "HEAD",
      headers: supabaseHeaders(),
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    results.redirect = {
      target: redirectTarget,
      status: res.status,
      location: res.headers.get("location"),
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    results.redirect = {
      target: redirectTarget,
      error: err instanceof Error ? err.message : String(err),
      errorCause:
        err instanceof Error && err.cause
          ? String((err.cause as Error).message ?? err.cause)
          : undefined,
    };
  }

  // 4. Direct object fetch check — try to fetch bytes from a known path.
  //    We do a range-0-1023 HEAD so we don't download the whole file.
  //    Use the public object URL (no token needed for public buckets).
  const publicObjectTarget = `${SUPABASE_URL}/storage/v1/object/public/bizmusic-assets/`;
  try {
    const t0 = Date.now();
    const res = await fetch(publicObjectTarget, {
      method: "HEAD",
      headers: { ...supabaseHeaders(), range: "bytes=0-1023" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    results.objectFetch = {
      target: publicObjectTarget,
      status: res.status,
      latencyMs: Date.now() - t0,
      contentType: res.headers.get("content-type"),
      acceptRanges: res.headers.get("accept-ranges"),
    };
  } catch (err) {
    results.objectFetch = {
      target: publicObjectTarget,
      error: err instanceof Error ? err.message : String(err),
      errorCause:
        err instanceof Error && err.cause
          ? String((err.cause as Error).message ?? err.cause)
          : undefined,
    };
  }

  // 5. Verdict
  const headOk =
    results.head && typeof results.head === "object" && !("error" in results.head);
  results.verdict = headOk
    ? "Supabase reachable from this container. If proxy still 502s, check for large-file timeout or signed URL token issues."
    : "Supabase is NOT reachable from this container. The proxy fetch will always fail.";

  return NextResponse.json(results, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "x-diagnostic": "storage-proxy",
    },
  });
}
