/**
 * Diagnostic endpoint for debugging the storage proxy.
 *
 * Hit this URL from the browser or curl to understand exactly why the proxy
 * is returning 502 on audio:
 *
 *   https://bizmuzik.ru/api/storage-proxy/diagnostic
 *
 * Unlike a generic health check, this replicates EXACTLY what the proxy does:
 *   1. Use the admin client (service role key) to list a real track in the bucket.
 *   2. Create a real signed URL for that track (same call the app makes).
 *   3. Fetch the raw Supabase signed URL server-side with ONLY the apikey header
 *      (no Authorization: Bearer — matching the proxy) and a Range header,
 *      capturing the status, headers, and any thrown error/cause.
 *
 * This route is intentionally admin-only in production — no file bytes or signed
 * tokens are exposed, only connectivity metadata.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.SUPABASE_STORAGE_UPSTREAM ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const BUCKET = "bizmusic-assets";

// Match the proxy EXACTLY: apikey only, no Authorization: Bearer.
function proxyHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = {};
  if (SUPABASE_ANON_KEY) h["apikey"] = SUPABASE_ANON_KEY;
  return { ...h, ...extra };
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "(unparseable)";
  }
}

function describeError(err: unknown) {
  return {
    error: err instanceof Error ? err.message : String(err),
    errorName: err instanceof Error ? err.name : "unknown",
    errorCause:
      err instanceof Error && err.cause
        ? String((err.cause as Error).message ?? err.cause)
        : undefined,
  };
}

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Environment check
  results.env = {
    resolved_SUPABASE_URL: SUPABASE_URL
      ? `${SUPABASE_URL.slice(0, 40)}...`
      : "(empty — proxy will always 502)",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
      ? `set (${SUPABASE_ANON_KEY.slice(0, 12)}...)`
      : "NOT SET — proxy will 400 on every request",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "set"
      : "NOT SET — cannot create signed URLs",
    NODE_ENV: process.env.NODE_ENV,
  };

  if (!SUPABASE_URL) {
    return NextResponse.json(
      { ...results, verdict: "FAIL: SUPABASE_URL is empty." },
      { status: 500 },
    );
  }

  // 2. List a real track via the admin client
  let trackPath: string | undefined;
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list("tracks", { limit: 1, offset: 0 });
    if (error) throw new Error(error.message);
    const first = data?.[0];
    if (!first) throw new Error("bucket 'tracks/' folder is empty");
    trackPath = `tracks/${first.name}`;
    results.list = { ok: true, sampleObject: first.name, count: data.length };
  } catch (err) {
    results.list = { ok: false, ...describeError(err) };
    return NextResponse.json(
      { ...results, verdict: "FAIL: could not list a real track to test with." },
      { status: 200 },
    );
  }

  // 3. Create a real signed URL (the raw Supabase URL, not the proxy-rewritten one)
  let rawSignedUrl: string | undefined;
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(trackPath, 3600);
    if (error) throw new Error(error.message);
    rawSignedUrl = data.signedUrl;
    // data.signedUrl may be a relative path (/storage/v1/object/sign/...) depending
    // on supabase-js version — normalize to an absolute URL against SUPABASE_URL.
    if (rawSignedUrl.startsWith("/")) {
      rawSignedUrl = `${SUPABASE_URL}${rawSignedUrl}`;
    }
    results.signedUrl = {
      ok: true,
      // Show the path + presence of token, never the full token.
      path: new URL(rawSignedUrl).pathname,
      hasToken: new URL(rawSignedUrl).searchParams.has("token"),
    };
  } catch (err) {
    results.signedUrl = { ok: false, ...describeError(err) };
    return NextResponse.json(
      { ...results, verdict: "FAIL: createSignedUrl threw." },
      { status: 200 },
    );
  }

  // 4. THE REAL TEST — fetch the raw signed URL exactly as the proxy does:
  //    apikey header only, redirect: follow, Range header, NO abort timeout.
  try {
    const t0 = Date.now();
    const res = await fetch(rawSignedUrl, {
      method: "GET",
      headers: proxyHeaders({ range: "bytes=0-1023" }),
      redirect: "follow",
    });
    // Read just the first chunk so we know bytes actually flow.
    let firstBytes = 0;
    try {
      const reader = res.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        firstBytes = value?.length ?? 0;
        await reader.cancel();
      }
    } catch {
      /* body read failure captured below via firstBytes = 0 */
    }
    results.signedFetch = {
      target: new URL(rawSignedUrl).pathname,
      status: res.status,
      ok: res.ok,
      latencyMs: Date.now() - t0,
      contentType: res.headers.get("content-type"),
      contentLength: res.headers.get("content-length"),
      contentRange: res.headers.get("content-range"),
      acceptRanges: res.headers.get("accept-ranges"),
      firstBytesRead: firstBytes,
      // If Supabase returned an error, its body is JSON — surface it.
      bodyHint:
        res.headers.get("content-type")?.includes("json") && firstBytes === 0
          ? "(error body — re-fetch without range to read)"
          : undefined,
    };

    // If non-2xx, fetch again without range to read the JSON error body.
    if (!res.ok) {
      try {
        const errRes = await fetch(rawSignedUrl, {
          method: "GET",
          headers: proxyHeaders(),
          redirect: "follow",
        });
        const text = await errRes.text();
        (results.signedFetch as Record<string, unknown>).errorBody = text.slice(0, 500);
      } catch (e) {
        (results.signedFetch as Record<string, unknown>).errorBodyReadFailed =
          describeError(e);
      }
    }
  } catch (err) {
    results.signedFetch = {
      target: new URL(rawSignedUrl).pathname,
      thrown: true,
      ...describeError(err),
    };
  }

  // 4b. Redirect probe — does the signed URL redirect to a CDN host? The proxy
  //     uses redirect:"follow"; if Supabase 302s to a host the container can't
  //     reach, fetch() throws and the proxy 502s. This reveals the redirect target.
  try {
    const res = await fetch(rawSignedUrl, {
      method: "GET",
      headers: proxyHeaders(),
      redirect: "manual",
    });
    const location = res.headers.get("location");
    results.redirectProbe = {
      status: res.status,
      redirects: !!location,
      // Show only the host of the redirect target, never the token-bearing path.
      locationHost: location ? safeHost(location) : null,
    };
  } catch (err) {
    results.redirectProbe = { thrown: true, ...describeError(err) };
  }

  // 5. Verdict
  const sf = results.signedFetch as Record<string, unknown> | undefined;
  if (sf && "thrown" in sf) {
    results.verdict =
      "FAIL: the fetch THREW (network-level). This is exactly why the proxy 502s. " +
      "Cause: " + (sf.errorCause ?? sf.error);
  } else if (sf && sf.ok) {
    results.verdict =
      "OK: signed URL fetched successfully from the container. If the browser still " +
      "502s, the difference is request-specific (headers/range) — compare Network tab.";
  } else if (sf) {
    results.verdict = `FAIL: Supabase returned HTTP ${sf.status}. See errorBody for the reason.`;
  } else {
    results.verdict = "UNKNOWN: signedFetch did not run.";
  }

  return NextResponse.json(results, {
    status: 200,
    headers: { "cache-control": "no-store", "x-diagnostic": "storage-proxy-e2e" },
  });
}
