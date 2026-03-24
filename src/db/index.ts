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

// Auto-switch to Supabase transaction pooler (port 6543) if using direct port 5432
function getConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (url && url.includes("supabase.co") && url.includes(":5432")) {
    console.log("[DB] Auto-switching from port 5432 (session) to 6543 (transaction pooler)");
    return url.replace(":5432", ":6543");
  }
  return url;
}

const poolConfig = {
  connectionString: getConnectionString(),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: true,
};

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var db: NodePgDatabase<typeof schema> | undefined;
}

const schemaObj = { ...schema };

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
      global.db = drizzle(global.pgPool, { schema: schemaObj });
    }
    return global.db!;
  }

  // Production: module-level singleton (no HMR to worry about)
  if (!_prodDb) {
    _prodPool = createPool();
    _prodDb = drizzle(_prodPool, { schema: schemaObj });
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
