import { YANDEX_ROOT_CA } from "./yandex-ca";

// node-postgres lets ssl params in the connection string override the `ssl`
// option, which would drop the pinned CA. Strip them and configure TLS in code.
const SSL_PARAMS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"];

export function stripSslParams(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    for (const key of SSL_PARAMS) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Yandex Managed PostgreSQL: verify against the Yandex root CA. Anything else (local dev): no TLS. */
export function getSsl(url: string | undefined) {
  if (url?.includes("yandexcloud.net")) {
    return { ca: YANDEX_ROOT_CA, rejectUnauthorized: true };
  }
  return false;
}
