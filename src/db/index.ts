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

// Connection routing: always use the transaction pooler (port 6543) regardless
// of environment. Previously dev was routed to the session pooler (5432), but
// session mode has a hard cap of 15 concurrent connections shared across ALL
// clients. When connections time out (slow Russia→AWS network) they hold their
// session-mode slot until pgBouncer times them out server-side. After a few
// page loads with ETIMEDOUT, the 15-slot pool fills with zombies and every
// subsequent query gets EMAXCONNSESSION. Transaction mode releases the server
// connection after every transaction, so zombie accumulation is impossible.
//
// Trade-off: pg's keepAlive pings will be rejected by pgBouncer (it closed the
// underlying server connection). We handle this by disabling keepAlive and using
// a very short idleTimeoutMillis so pg evicts idle pool slots before pgBouncer
// does — preventing "Connection terminated unexpectedly" on recycled connections.
function getConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  const isSupabase = url && (url.includes("supabase.co") || url.includes("supabase.com"));

  if (isSupabase && url!.includes(":5432")) {
    // Ensure we always use the transaction pooler in all environments.
    const upgraded = url!.replace(":5432", ":6543");
    if (!upgraded.includes("pgbouncer=true")) {
      return upgraded.includes("?") ? `${upgraded}&pgbouncer=true` : `${upgraded}?pgbouncer=true`;
    }
    return upgraded;
  }
  return url;
}

const isDev = process.env.NODE_ENV === "development";

const poolConfig = {
  connectionString: getConnectionString(),
  ssl: { rejectUnauthorized: false },
  // Transaction pooler (pgBouncer): keep the pool small. pgBouncer multiplexes
  // many app connections onto a smaller number of real server connections, so a
  // large pg pool just creates extra TLS handshake overhead.
  max: isDev ? 3 : 10,
  // keepAlive MUST be disabled for pgBouncer transaction mode. pgBouncer closes
  // the underlying server connection after every transaction — keepAlive pings on
  // an already-closed connection produce "Connection terminated unexpectedly".
  keepAlive: false,
  // Release idle pool slots quickly. pgBouncer can close the server connection at
  // any moment; an idle pg client holding a slot that pgBouncer already freed will
  // error on the next query. Short idle timeout means pg evicts the slot first.
  idleTimeoutMillis: isDev ? 5_000 : 10_000,
  // Allow enough time for a high-latency connection (Russia → AWS Frankfurt).
  // 10 s is a reasonable upper bound; fail-fast would trigger too often on slow nets.
  connectionTimeoutMillis: isDev ? 10_000 : 8_000,
  allowExitOnIdle: true,
  // NOTE: "-c statement_timeout=..." does NOT work through pgBouncer transaction
  // mode — pgBouncer strips SET commands. Rely on connectionTimeoutMillis above
  // and on the application-level query timeout in the resilient() wrapper instead.
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
