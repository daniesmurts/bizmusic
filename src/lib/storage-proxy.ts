/**
 * Supabase Storage URL → local proxy URL rewriting.
 *
 * Russian mobile carriers block waootzqqtjyungakvoua.supabase.co (Supabase Storage).
 * This utility rewrites storage URLs so that audio/image requests are routed through
 * bizmuzik.ru/api/storage-proxy, bypassing the carrier block.
 *
 * Works server-side only (called from Server Actions before returning URLs to the client).
 * The actual proxying happens in src/app/api/storage-proxy/[[...path]]/route.ts.
 */

// The Supabase project URL — used to identify which hostname to rewrite.
// Falls back to the known project hostname if the env var isn't available at build time.
const SUPABASE_ORIGIN: string = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    return new URL(raw).origin;
  } catch {
    return "https://waootzqqtjyungakvoua.supabase.co";
  }
})();

const PROXY_PREFIX = "/api/storage-proxy";

/**
 * Rewrite a Supabase Storage URL to go through our server-side proxy.
 *
 * - Public URL:  https://waootzqqtjyungakvoua.supabase.co/storage/v1/object/public/...
 *   → /api/storage-proxy/storage/v1/object/public/...
 *
 * - Signed URL:  https://waootzqqtjyungakvoua.supabase.co/storage/v1/object/sign/...?token=...
 *   → /api/storage-proxy/storage/v1/object/sign/...?token=...
 *
 * Non-Supabase URLs (or invalid URLs) are returned unchanged.
 */
export function rewriteStorageUrl(url: string): string {
  if (!url || !SUPABASE_ORIGIN) return url;
  try {
    const parsed = new URL(url);
    if (parsed.origin === SUPABASE_ORIGIN) {
      return `${PROXY_PREFIX}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Relative path or invalid — return as-is
  }
  return url;
}
