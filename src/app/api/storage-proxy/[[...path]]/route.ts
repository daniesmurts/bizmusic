/**
 * Reverse proxy for Supabase Storage.
 *
 * Russian mobile carriers block waootzqqtjyungakvoua.supabase.co, so audio files
 * fail to load on mobile networks without a VPN. This route forwards all storage
 * requests through bizmuzik.ru so the browser only ever talks to our origin.
 *
 * Key requirements for audio streaming:
 * - Range header forwarding — browsers send "Range: bytes=X-Y" for seeking; the
 *   proxy must relay it so Supabase returns "206 Partial Content" with the correct
 *   byte range. Without this, seeking is broken.
 * - Accept-Ranges / Content-Range passthrough — these tell the browser that range
 *   requests are supported and which bytes are in the current response.
 * - No content-encoding forwarding — fetch() decodes gzip/br bodies automatically;
 *   forwarding the header would tell the browser to decode an already-decoded body.
 *
 * Server-side URL rewriting (so browsers never see supabase.co) is in
 * src/lib/storage-proxy.ts, called from Server Actions before returning track data.
 */

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The upstream Supabase project URL. Override with SUPABASE_STORAGE_UPSTREAM if needed.
const SUPABASE_URL =
  process.env.SUPABASE_STORAGE_UPSTREAM ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  if (!SUPABASE_URL) {
    return new Response(
      JSON.stringify({ error: "proxy_misconfigured", message: "NEXT_PUBLIC_SUPABASE_URL is not set" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  let target = "(unknown)";
  try {
    const { path = [] } = await ctx.params;
    const url = new URL(req.url);
    target = `${SUPABASE_URL}/${path.join("/")}${url.search}`;

    // Forward headers Supabase Storage cares about.
    // Range + If-Range are critical for audio seeking — without them, the browser
    // cannot request byte ranges and seeks either fail or re-download from the start.
    const headers = new Headers();
    const forwardable = [
      "accept",
      "accept-encoding",
      "accept-language",
      "authorization",
      "if-none-match",
      "if-modified-since",
      "if-range",
      "range",           // Byte-range requests for audio seeking
    ];
    for (const name of forwardable) {
      const v = req.headers.get(name);
      if (v) headers.set(name, v);
    }

    console.log(`[storage-proxy] → ${req.method} ${target}`);
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      // Follow redirects server-side. Supabase Storage signed URLs may redirect to
      // CDN/R2 — following on the server preserves Range header semantics better
      // than letting the browser chase the redirect to a blocked host.
      redirect: "follow",
    });
    console.log(`[storage-proxy] upstream ${upstream.status}`);

    const responseHeaders = new Headers();

    // Headers to forward from the upstream response.
    // Explicitly allowlisted to avoid forwarding headers that would confuse the browser
    // about the response origin (e.g., content-encoding is excluded because fetch already
    // decoded the body).
    const passThroughHeaders = [
      "accept-ranges",   // Tells browser range requests are supported
      "cache-control",
      "content-length",
      "content-range",   // Required for 206 Partial Content (audio seeking)
      "content-type",
      "etag",
      "expires",
      "last-modified",
      // Do NOT forward: content-encoding (body already decoded by fetch)
      // Do NOT forward: set-cookie (storage has none; prevents accidental cookie leaks)
    ];
    for (const name of passThroughHeaders) {
      const v = upstream.headers.get(name);
      if (v) responseHeaders.set(name, v);
    }

    // Cache audio aggressively. Signed URLs expire on Supabase's end (currently 1 h);
    // our proxy can cache the bytes in the browser for the same window.
    // Public object URLs never expire, so a longer max-age is fine for those.
    if (!responseHeaders.has("cache-control")) {
      const isPublic = path.includes("public");
      responseHeaders.set(
        "cache-control",
        isPublic ? "public, max-age=3600, stale-while-revalidate=600" : "private, max-age=3600",
      );
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause
        ? String((err.cause as Error).message ?? err.cause)
        : undefined;
    console.error("[storage-proxy] error fetching", target, "→", message, cause ? `(cause: ${cause})` : "");
    return new Response(
      JSON.stringify({ error: "proxy_error", message, cause, target }),
      {
        status: 502,
        headers: {
          "content-type": "application/json",
          // Expose the raw error in response headers so it's visible in the
          // Network tab even when the browser treats the body as audio.
          "x-proxy-error": message.slice(0, 200),
          ...(cause ? { "x-proxy-cause": cause.slice(0, 200) } : {}),
        },
      },
    );
  }
}

export const GET = proxy;
export const HEAD = proxy;
