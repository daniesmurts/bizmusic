import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// For scripts and dev environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? true : { rejectUnauthorized: false },
};

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var db: NodePgDatabase<typeof schema> | undefined;
}

let pool: Pool;
let dbInstance: NodePgDatabase<typeof schema>;

if (process.env.NODE_ENV !== "production") {
  if (!global.pgPool) {
    global.pgPool = new Pool(poolConfig);
  }
  pool = global.pgPool;
  
  if (!global.db) {
    global.db = drizzle(pool, { schema });
  }
  dbInstance = global.db;
} else {
  pool = new Pool(poolConfig);
  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance;
