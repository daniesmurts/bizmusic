/**
 * Diagnostic endpoint for debugging the storage proxy.
 *
 *   https://bizmuzik.ru/api/storage-proxy/diagnostic
 *
 * Replicates EXACTLY what the proxy does, but with a hard per-step timeout so the
 * whole request returns BEFORE the YC container's 60s execution limit kills it.
 * The previous version hung and the container returned JobExecutionTimeoutExceeded,
 * which told us one of the server-side fetches hangs forever — that hang IS the
 * audio 502. This version pins down WHICH step hangs and how long each one takes.
 *
 * Steps (each independently timed + bounded):
 *   1. list a real track via the admin client (service role key)
 *   2. createSignedUrl for it
 *   3. redirectProbe   — redirect:manual, no body → reveals CDN redirect target
 *   4. signedFetchFollow — redirect:follow + Range, read first chunk (what proxy does)
 *   5. healthBaseline  — tiny /storage/v1/health fetch for comparison
 *
 * No file bytes or signed tokens are exposed — only connectivity metadata.
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

// Bound any promise so a hang surfaces as a result instead of eating the 60s budget.
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`step timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function GET() {
  const results: Record<string, unknown> = {};

  results.env = {
    resolved_SUPABASE_URL: SUPABASE_URL ? `${SUPABASE_URL.slice(0, 40)}...` : "(empty)",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "set" : "NOT SET",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  if (!SUPABASE_URL) {
    return NextResponse.json({ ...results, verdict: "FAIL: SUPABASE_URL empty." }, { status: 500 });
  }

  // --- Step 5 first (cheap baseline): tiny health fetch, 8s cap ---------------
  {
    const t0 = Date.now();
    try {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/health`, {
        method: "GET",
        headers: proxyHeaders(),
        redirect: "follow",
        signal: AbortSignal.timeout(8_000),
      });
      results.healthBaseline = { status: res.status, ms: Date.now() - t0 };
    } catch (err) {
      results.healthBaseline = { ms: Date.now() - t0, ...describeError(err) };
    }
  }

  // --- Step 1: list a real track (8s cap) -------------------------------------
  let trackPath: string | undefined;
  {
    const t0 = Date.now();
    try {
      const { data, error } = await withTimeout(
        supabaseAdmin.storage.from(BUCKET).list("tracks", { limit: 1, offset: 0 }),
        8_000,
      );
      if (error) throw new Error(error.message);
      const first = data?.[0];
      if (!first) throw new Error("'tracks/' folder is empty");
      trackPath = `tracks/${first.name}`;
      results.list = { ok: true, sampleObject: first.name, ms: Date.now() - t0 };
    } catch (err) {
      results.list = { ok: false, ms: Date.now() - t0, ...describeError(err) };
      return NextResponse.json(
        { ...results, verdict: "FAIL at list step. See list.error / list.ms." },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }
  }

  // --- Step 2: createSignedUrl (8s cap) ---------------------------------------
  let rawSignedUrl: string | undefined;
  {
    const t0 = Date.now();
    try {
      const { data, error } = await withTimeout(
        supabaseAdmin.storage.from(BUCKET).createSignedUrl(trackPath, 3600),
        8_000,
      );
      if (error) throw new Error(error.message);
      rawSignedUrl = data.signedUrl.startsWith("/")
        ? `${SUPABASE_URL}${data.signedUrl}`
        : data.signedUrl;
      results.signedUrl = {
        ok: true,
        ms: Date.now() - t0,
        path: new URL(rawSignedUrl).pathname,
        hasToken: new URL(rawSignedUrl).searchParams.has("token"),
      };
    } catch (err) {
      results.signedUrl = { ok: false, ms: Date.now() - t0, ...describeError(err) };
      return NextResponse.json(
        { ...results, verdict: "FAIL at createSignedUrl step." },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }
  }

  // --- Step 3: redirect probe (manual, no body, 10s cap) ----------------------
  {
    const t0 = Date.now();
    try {
      const res = await fetch(rawSignedUrl, {
        method: "GET",
        headers: proxyHeaders(),
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      const location = res.headers.get("location");
      results.redirectProbe = {
        status: res.status,
        ms: Date.now() - t0,
        redirects: !!location,
        locationHost: location ? safeHost(location) : null,
      };
    } catch (err) {
      results.redirectProbe = { ms: Date.now() - t0, thrown: true, ...describeError(err) };
    }
  }

  // --- Step 4: the real test — follow + Range + read first chunk (18s cap) ----
  {
    const t0 = Date.now();
    try {
      const res = await fetch(rawSignedUrl, {
        method: "GET",
        headers: proxyHeaders({ range: "bytes=0-1023" }),
        redirect: "follow",
        signal: AbortSignal.timeout(18_000),
      });
      let firstBytes = 0;
      try {
        const reader = res.body?.getReader();
        if (reader) {
          const { value } = await withTimeout(reader.read(), 6_000);
          firstBytes = value?.length ?? 0;
          await reader.cancel();
        }
      } catch (e) {
        (results as Record<string, unknown>).bodyReadError = describeError(e);
      }
      results.signedFetchFollow = {
        status: res.status,
        ok: res.ok,
        ms: Date.now() - t0,
        contentType: res.headers.get("content-type"),
        contentLength: res.headers.get("content-length"),
        contentRange: res.headers.get("content-range"),
        acceptRanges: res.headers.get("accept-ranges"),
        servedBy: res.headers.get("server"),
        firstBytesRead: firstBytes,
      };
      if (!res.ok) {
        try {
          const errRes = await fetch(rawSignedUrl, {
            method: "GET",
            headers: proxyHeaders(),
            redirect: "follow",
            signal: AbortSignal.timeout(10_000),
          });
          (results.signedFetchFollow as Record<string, unknown>).errorBody = (
            await errRes.text()
          ).slice(0, 500);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      results.signedFetchFollow = { ms: Date.now() - t0, thrown: true, ...describeError(err) };
    }
  }

  // --- Verdict ----------------------------------------------------------------
  const sf = results.signedFetchFollow as Record<string, unknown> | undefined;
  if (sf && "thrown" in sf) {
    results.verdict =
      `FAIL: signed-URL fetch ${sf.error}. This hang/throw IS the proxy 502. ` +
      `redirectProbe=${JSON.stringify(results.redirectProbe)}`;
  } else if (sf && sf.ok) {
    results.verdict =
      "OK: container fetched the signed URL fine. If the browser still 502s, the " +
      "difference is request-specific — compare the Network tab request headers.";
  } else if (sf) {
    results.verdict = `Supabase returned HTTP ${sf.status}. See signedFetchFollow.errorBody.`;
  } else {
    results.verdict = "UNKNOWN.";
  }

  return NextResponse.json(results, {
    status: 200,
    headers: { "cache-control": "no-store", "x-diagnostic": "storage-proxy-e2e-v2" },
  });
}
