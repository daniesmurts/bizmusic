/**
 * Applies drizzle/ migrations to DATABASE_URL (same bookkeeping table as
 * `drizzle-kit migrate`), but reports connection errors instead of exiting silently.
 *
 *   npm run db:migrate
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getSsl, stripSslParams } from "../src/db/ssl";
import { loadTargetDb } from "./lib/target-db";

const HINTS: Record<string, string> = {
  ETIMEDOUT: "Timed out: the security group doesn't allow this machine's IP on port 6432, or public access is off.",
  ECONNREFUSED: "Connection refused: wrong host or port (Yandex uses 6432).",
  ENOTFOUND: "Host not found: check the cluster ID in DATABASE_URL (c-<cluster_id>.rw.mdb.yandexcloud.net).",
  "28P01": "Wrong password for this user. Special characters in the password must be URL-encoded.",
  "3D000": "Database does not exist: check the database name at the end of DATABASE_URL.",
};

async function main() {
  const url = loadTargetDb();
  const pool = new Pool({ connectionString: stripSslParams(url), ssl: getSsl(url), connectionTimeoutMillis: 15_000 });

  try {
    const { rows } = await pool.query("select current_user as u");
    console.log(`Connected as ${rows[0].u}`);
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
    const tables = await pool.query("select count(*)::int as n from information_schema.tables where table_schema = 'public'");
    console.log(`✅ Migrations applied. Tables in public schema: ${tables.rows[0].n}`);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error(`❌ ${e.code ?? ""} ${e.message ?? String(err)}`.trim());
    const hint = (e.code && HINTS[e.code]) ||
      (/terminated unexpectedly|closed the connection/i.test(e.message ?? "")
        ? "Server closed the connection: usually a VPN/proxy in the way, or this machine's IP isn't in the cluster's security group."
        : undefined);
    if (hint) console.error(`   ${hint}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
