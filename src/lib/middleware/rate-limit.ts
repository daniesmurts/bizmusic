interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore(): Map<string, RateLimitEntry> {
  if (!global.__rateLimitStore) {
    global.__rateLimitStore = new Map<string, RateLimitEntry>();
  }
  return global.__rateLimitStore;
}

function cleanupExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit({ key, maxRequests, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const store = getStore();

  cleanupExpiredEntries(store, now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function buildRateLimitHeaders(retryAfterSeconds: number): HeadersInit {
  return {
    "Retry-After": String(retryAfterSeconds),
  };
}