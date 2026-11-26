import * as fs from "fs";
import * as dotenv from "dotenv";

/** Loads .env.local then .env (first wins), refuses Supabase, prints the target host. */
export function loadTargetDb(): string {
  if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", quiet: true });
  if (fs.existsSync(".env")) dotenv.config({ path: ".env", quiet: true });

  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  if (/supabase\.(co|com)/.test(url)) {
    console.error(
      "Refusing to run against Supabase. Set DATABASE_URL in .env.local to the Yandex cluster " +
        "(postgresql://bizmuzik:…@c-<cluster_id>.rw.mdb.yandexcloud.net:6432/bizmuzik) and run `npm run db:migrate` first.",
    );
    process.exit(1);
  }
  console.log(`Target database: ${new URL(url).hostname}`);
  return url;
}
