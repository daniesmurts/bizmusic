import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Temporary diagnostic — tests whether Yandex Cloud can reach Clerk's
// official Frontend API endpoint, vs. only the custom-domain CNAME.
// Remove after debugging.
export async function GET() {
  const targets = [
    "https://frontend-api.clerk.services/v1/proxy_health",
    "https://frontend-api.clerk.services/",
    "https://api.clerk.com/v1/health",
    "https://clerk.bizmuzik.ru/v1/proxy_health",
  ];

  const results = await Promise.all(
    targets.map(async (url) => {
      const startedAt = Date.now();
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "Clerk-Proxy-Url": "https://bizmuzik.ru/api/clerk-proxy" },
          redirect: "manual",
        });
        const bodyPreview = (await res.text()).slice(0, 200);
        return {
          url,
          status: res.status,
          ms: Date.now() - startedAt,
          body: bodyPreview,
        };
      } catch (err) {
        return {
          url,
          ms: Date.now() - startedAt,
          error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        };
      }
    }),
  );

  return NextResponse.json(results, { headers: { "cache-control": "no-store" } });
}
