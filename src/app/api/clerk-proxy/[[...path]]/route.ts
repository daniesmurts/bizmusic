/**
 * Reverse proxy for Clerk's Frontend API.
 *
 * Russian mobile carriers block Clerk's CDN (which `clerk.bizmuzik.ru` CNAMEs to),
 * so clerk-js fails to authenticate even when the JS bundle loads from our origin.
 * This route forwards all auth traffic through bizmuzik.ru so mobile users on
 * blocked networks can reach Clerk via our Yandex Cloud container.
 *
 * Setup required in Clerk Dashboard:
 * - Configure → Domains → switch to "Use proxy" mode
 * - Set Proxy URL: https://bizmuzik.ru/api/clerk-proxy
 *
 * The ClerkProvider in layout.tsx must also be told to use this URL via proxyUrl.
 */

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Forward to the user's Clerk custom domain. From Yandex Cloud's network this
// is reachable (only Russian mobile carriers block it), so the server-side hop
// works. Mobile clients only ever see bizmuzik.ru, bypassing the carrier block.
// Override with CLERK_FAPI_UPSTREAM env var if needed.
const CLERK_FAPI = process.env.CLERK_FAPI_UPSTREAM ?? "https://clerk.bizmuzik.ru";

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path = [] } = await ctx.params;
    const url = new URL(req.url);
    const target = `${CLERK_FAPI}/${path.join("/")}${url.search}`;

    // Build a clean header set forwarding only the headers Clerk actually cares
    // about — leaking our own x-forwarded-host / x-forwarded-proto makes Clerk's
    // edge worker think the request came in for "bizmuzik.ru" and return
    // "Invalid host" because no Clerk instance maps to that domain.
    const headers = new Headers();
    const forwardable = [
      "accept",
      "accept-language",
      "authorization",
      "content-type",
      "cookie",
      "origin",
      "referer",
      "user-agent",
    ];
    for (const name of forwardable) {
      const v = req.headers.get(name);
      if (v) headers.set(name, v);
    }

    const init: RequestInit = {
      method: req.method,
      headers,
      // Follow redirects server-side so the browser always sees a final 200.
      // clerk-js loads /npm/* via dynamic import which doesn't reliably follow
      // 307s across the response stream, and Russian carriers can drop
      // requests that bounce more than once.
      redirect: "follow",
    };

    // Only attach a body for methods that have one
    if (!["GET", "HEAD"].includes(req.method)) {
      init.body = await req.arrayBuffer();
    }

    console.log(`[clerk-proxy] ${req.method} ${target}`);
    const upstream = await fetch(target, init);
    console.log(`[clerk-proxy] upstream ${upstream.status}`);

    // Stream response back. Preserve Set-Cookie (Clerk sets the session cookie here).
    const responseHeaders = new Headers();
    // url.origin is unreliable here — YC serverless containers see the request
    // as http://0.0.0.0:8080. Use the public app URL or the forwarded host.
    const publicOrigin =
      process.env.NEXT_PUBLIC_APP_URL ??
      (req.headers.get("x-forwarded-host")
        ? `https://${req.headers.get("x-forwarded-host")}`
        : url.origin);
    const proxyPrefix = `${publicOrigin}/api/clerk-proxy`;
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      // 'content-encoding' must not be forwarded because fetch already decoded the body
      if (k === "content-encoding") return;
      // Rewrite redirects to clerk.bizmuzik.ru / FAPI back through our proxy so
      // the client never gets sent to a host that mobile carriers might block.
      if (k === "location") {
        try {
          const loc = new URL(value, target);
          const upstreamOrigin = new URL(CLERK_FAPI).origin;
          if (loc.origin === upstreamOrigin) {
            responseHeaders.append(key, `${proxyPrefix}${loc.pathname}${loc.search}${loc.hash}`);
            return;
          }
        } catch {
          // fall through and forward as-is
        }
      }
      responseHeaders.append(key, value);
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[clerk-proxy] error:", err);
    return new Response(
      JSON.stringify({
        error: "proxy_error",
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
