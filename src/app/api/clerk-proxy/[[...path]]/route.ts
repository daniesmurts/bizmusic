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

    // Forward headers, stripping ones that don't apply to the upstream
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("content-length"); // fetch sets this itself

    // Tell Clerk that traffic arrived via a proxy — required when proxy mode is on.
    headers.set("Clerk-Proxy-Url", `${url.origin}/api/clerk-proxy`);
    headers.set("X-Forwarded-Host", url.host);
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
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
    upstream.headers.forEach((value, key) => {
      // 'content-encoding' must not be forwarded because fetch already decoded the body
      if (key.toLowerCase() === "content-encoding") return;
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
