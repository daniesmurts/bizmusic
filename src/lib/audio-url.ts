/**
 * Permanent address for a track's audio: /api/media presigns a fresh Object
 * Storage URL on every request (signed-in users only), so unlike a track's
 * streamUrl it never expires. Accepts a bare file name, an object path or an
 * already-stable URL.
 */
export function stableAudioUrl(fileUrl?: string | null): string | undefined {
  if (!fileUrl) return undefined;
  if (fileUrl.startsWith("/api/media/") || /^https?:\/\//.test(fileUrl)) return fileUrl;
  const path = fileUrl.replace(/^\/+/, "");
  return `/api/media/${path.includes("/") ? path : `tracks/${path}`}`;
}
