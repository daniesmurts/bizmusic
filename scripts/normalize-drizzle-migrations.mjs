import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("No DRIZZLE_DATABASE_URL or DATABASE_URL found");
}

const connectionString =
  databaseUrl.includes("supabase.co") && databaseUrl.includes(":5432")
    ? databaseUrl.replace(":5432", ":6543")
    : databaseUrl;

const journalPath = path.join(process.cwd(), "drizzle/meta/_journal.json");
const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));

const migrationRows = journal.entries.map((entry) => {
  const fileName = `${entry.tag}.sql`;
  const filePath = path.join(process.cwd(), "drizzle", fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing migration file: ${fileName}`);
  }

  const sql = fs.readFileSync(filePath, "utf8");
  const hash = crypto.createHash("sha256").update(sql).digest("hex");

  return {
    fileName,
    hash,
    createdAt: Number(entry.when),
  };
});

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query("begin");
  await client.query("delete from drizzle.__drizzle_migrations");

  for (const row of migrationRows) {
    await client.query(
      'insert into drizzle.__drizzle_migrations ("hash", "created_at") values ($1, $2)',
      [row.hash, row.createdAt],
    );
  }

  await client.query("commit");

  const verification = await client.query(
    "select id, hash, created_at from drizzle.__drizzle_migrations order by id",
  );

  console.log(`Seeded ${verification.rowCount} drizzle migration rows.`);
  console.log("First:", verification.rows[0]);
  console.log("Last:", verification.rows[verification.rows.length - 1]);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}