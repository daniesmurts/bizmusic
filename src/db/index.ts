import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// For scripts and dev environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

// Use Supabase transaction pooler (port 6543) for better connection management
if (!process.env.DATABASE_URL) {
  console.error("[DB] ❌ DATABASE_URL is not set. All database queries will fail.");
}

// Connection routing:
//   Dev  → session pooler / direct (port 5432) — stable, keepAlive-friendly
//   Prod → transaction pooler (port 6543) — scales with serverless concurrency
//
// PgBouncer transaction mode (6543) closes connections after every transaction.
// In dev this causes "Connection terminated unexpectedly" on idle pool connections
// because the pool recycles a connection that PgBouncer already closed server-side.
// Routing dev to port 5432 (session pooler) avoids this entirely.
function getConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  const isDev = process.env.NODE_ENV === "development";
  const isSupabase = url && (url.includes("supabase.co") || url.includes("supabase.com"));

  if (isSupabase) {
    if (isDev && url!.includes(":6543")) {
      console.log("[DB] Dev: switching from transaction pooler (6543) to session pooler (5432)");
      return url!.replace(":6543", ":5432");
    }
    if (!isDev && url!.includes(":5432")) {
      console.log("[DB] Prod: switching from port 5432 to transaction pooler (6543)");
      return url!.replace(":5432", ":6543");
    }
  }
  return url;
}

const isDev = process.env.NODE_ENV === "development";

const poolConfig = {
  connectionString: getConnectionString(),
  ssl: { rejectUnauthorized: false },
  // Dev: keep the pool small so fewer connections go stale between requests.
  // 9 parallel queries can queue behind 3 connections rather than opening 9
  // simultaneous TLS handshakes that Supabase rate-limits / drops.
  max: isDev ? 3 : 20,
  // keepAlive prevents Supabase from silently closing idle connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  // Evict idle connections before Supabase's ~30 s server-side idle timeout.
  // Dev uses a shorter window because idle time between requests is unpredictable.
  idleTimeoutMillis: isDev ? 10_000 : 20_000,
  // 5 s is plenty; 30 s means a stalled connection hangs the user for half a minute.
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
  // Kill runaway queries after 10 s — prevents a single slow query from blocking
  // a pool connection and starving all concurrent dashboard users.
  options: "-c statement_timeout=10000",
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
  return (
    m.includes("connection terminated") ||
    c.includes("connection terminated") ||
    m.includes("connection reset") ||
    c.includes("connection reset") ||
    (err as any)?.code === "57P01" ||
    (err as any)?.cause?.code === "57P01"
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
