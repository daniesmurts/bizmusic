import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// For scripts and dev environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

// Use Supabase transaction pooler (port 6543) for better connection management
// If DATABASE_URL uses port 5432 (session mode), consider switching to port 6543
if (!process.env.DATABASE_URL) {
  console.error("[DB] ❌ DATABASE_URL is not set. All database queries will fail.");
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? true : { rejectUnauthorized: false },
  max: 3, // Small pool — enough for concurrent requests without exhausting Supabase
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds (was 5s — too aggressive)
  connectionTimeoutMillis: 10000, // Timeout after 10 seconds
  allowExitOnIdle: false, // Keep pool alive in long-running Next.js server
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
    }
  });

  return newPool;
}

function getDb(): NodePgDatabase<typeof schema> {
  if (process.env.NODE_ENV !== "production") {
    if (!global.pgPool) {
      global.pgPool = createPool();
      global.db = drizzle(global.pgPool, { schema: schemaObj });
    }
    return global.db!;
  }

  // Production: module-level singleton (no HMR to worry about)
  if (!module.exports._prodDb) {
    const pool = createPool();
    module.exports._prodDb = drizzle(pool, { schema: schemaObj });
  }
  return module.exports._prodDb;
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
