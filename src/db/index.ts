import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { YANDEX_ROOT_CA } from "./yandex-ca";

// For scripts and dev environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

// Use Supabase transaction pooler (port 6543) for better connection management
if (!process.env.DATABASE_URL) {
  console.error("[DB] ❌ DATABASE_URL is not set. All database queries will fail.");
}

// Backend detection. The pool tuning and TLS differ between Supabase (AWS,
// pgBouncer transaction pooler) and Yandex Managed PostgreSQL (RF, Odyssey
// pooler). Detection is purely from DATABASE_URL, so switching backend is just
// an env-var change — no code change needed at cutover.
const _rawUrl = process.env.DATABASE_URL;
const isSupabase = !!_rawUrl && (_rawUrl.includes("supabase.co") || _rawUrl.includes("supabase.com"));
const isYandex = !!_rawUrl && _rawUrl.includes("yandexcloud.net");

// Supabase only: force the transaction pooler (port 6543) and pgbouncer=true.
// Session mode (5432) has a hard 15-connection cap that fills with zombies on a
// slow Russia→AWS link. YC URLs are returned unchanged.
function getConnectionString(): string | undefined {
  if (isSupabase && _rawUrl!.includes(":5432")) {
    const upgraded = _rawUrl!.replace(":5432", ":6543");
    if (!upgraded.includes("pgbouncer=true")) {
      return upgraded.includes("?") ? `${upgraded}&pgbouncer=true` : `${upgraded}?pgbouncer=true`;
    }
    return upgraded;
  }
  return _rawUrl;
}

// TLS: verify against the Yandex root CA for YC Managed PostgreSQL
// (rejectUnauthorized: true). Supabase keeps the permissive setting (its chain
// isn't pinned here).
function getSsl() {
  if (isYandex) {
    return { ca: YANDEX_ROOT_CA, rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

const isDev = process.env.NODE_ENV === "development";

// Supabase (pgBouncer transaction mode): small pool, keepAlive OFF, short idle —
// pgBouncer closes the server connection after every transaction, so keepAlive
// pings and long-lived idle slots produce "Connection terminated unexpectedly".
//
// Yandex Managed PostgreSQL: a normal pooled connection — keepAlive ON, larger
// pool, normal idle timeout. YC's Odyssey pooler tolerates keepAlive, and the
// RF→RF latency is low so no zombie accumulation.
const poolConfig = isSupabase
  ? {
      connectionString: getConnectionString(),
      ssl: getSsl(),
      max: isDev ? 3 : 10,
      keepAlive: false,
      idleTimeoutMillis: isDev ? 5_000 : 10_000,
      connectionTimeoutMillis: isDev ? 10_000 : 8_000,
      allowExitOnIdle: true,
    }
  : {
      connectionString: getConnectionString(),
      ssl: getSsl(),
      max: isDev ? 5 : 10,
      keepAlive: true,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    };

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var db: NodePgDatabase<typeof schema> | undefined;
}

// No need for a separate schemaObj, pass schema directly to drizzle

function createPool(): Pool {
  const newPool = new Pool(poolConfig);

  newPool.on('connect', () => {
    console.log('[DB] New client connected');
  });
  newPool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
    // Destroy broken pool so it gets recreated on next access
    newPool.end().catch(() => {});
    if (process.env.NODE_ENV !== "production") {
      global.pgPool = undefined;
      global.db = undefined;
    } else {
      _prodPool = undefined;
      _prodDb = undefined;
    }
  });

  return newPool;
}

let _prodPool: Pool | undefined;
let _prodDb: NodePgDatabase<typeof schema> | undefined;

function getDb(): NodePgDatabase<typeof schema> {
  if (process.env.NODE_ENV !== "production") {
    if (!global.pgPool) {
      global.pgPool = createPool();
    }
    // Always recreate drizzle instance with latest schema in dev to pick up HMR changes
    global.db = drizzle(global.pgPool, { schema });
    return global.db;
  }

  // Production: module-level singleton (no HMR to worry about)
  if (!_prodDb) {
    _prodPool = createPool();
    _prodDb = drizzle(_prodPool, { schema });
  }
  return _prodDb;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const realDb = getDb();
    const value = (realDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(realDb);
    }
    return value;
  },
});

// ---------------------------------------------------------------------------
// Self-healing helpers
// ---------------------------------------------------------------------------

function isConnectionError(err: unknown): boolean {
  const m = String((err as any)?.message ?? "").toLowerCase();
  const c = String((err as any)?.cause?.message ?? "").toLowerCase();
  const code = String((err as any)?.code ?? "");
  const causeCode = String((err as any)?.cause?.code ?? "");
  return (
    m.includes("connection terminated") ||
    c.includes("connection terminated") ||
    m.includes("connection reset") ||
    c.includes("connection reset") ||
    m.includes("connection timeout") ||
    c.includes("connection timeout") ||
    m.includes("etimedout") ||
    c.includes("etimedout") ||
    m.includes("econnreset") ||
    c.includes("econnreset") ||
    // pgBouncer session-limit error — switch to different connection
    m.includes("emaxconnsession") ||
    code === "57P01" ||     // admin_shutdown
    causeCode === "57P01"
  );
}

function resetPool(): void {
  if (process.env.NODE_ENV !== "production") {
    if (global.pgPool) {
      global.pgPool.end().catch(() => {});
      global.pgPool = undefined;
      global.db    = undefined;
      console.warn("[DB] Pool reset — will reconnect on next query");
    }
  } else {
    if (_prodPool) {
      _prodPool.end().catch(() => {});
      _prodPool = undefined;
      _prodDb   = undefined;
    }
  }
}

/**
 * Wraps a DB call (or a Promise.all batch).
 * On a connection-level error it resets the pool and retries with backoff,
 * up to `maxAttempts` total tries.
 *
 * Usage:
 *   const user = await resilient(() => db.query.users.findFirst(...));
 *   const [a, b] = await resilient(() => Promise.all([query1, query2]));
 */
export async function resilient<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isConnectionError(err)) throw err;          // non-connection error — bail immediately
      lastErr = err;
      if (attempt === maxAttempts) break;              // exhausted retries
      console.warn(`[DB] Connection error — resetting pool (attempt ${attempt}/${maxAttempts})`);
      resetPool();
      await new Promise((r) => setTimeout(r, 200 * attempt)); // 200 ms, 400 ms, 600 ms
    }
  }
  throw lastErr;
}
