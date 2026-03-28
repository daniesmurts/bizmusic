import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
 
// Load env
if (fs.existsSync(".env")) dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
 
const databaseUrl = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL;
 
if (!databaseUrl) {
  console.error("DATABASE_URL or DRIZZLE_DATABASE_URL is not set");
  process.exit(1);
}
 
const finalUrl = databaseUrl.includes("supabase.co") && databaseUrl.includes(":5432") 
  ? databaseUrl.replace(":5432", ":6543") 
  : databaseUrl;
 
const client = new Client({
  connectionString: finalUrl,
  ssl: { rejectUnauthorized: false }
});
 
const sql = fs.readFileSync('drizzle/0012_add_demo_requests.sql', 'utf8');
const statements = sql.split('--> statement-breakpoint');
 
async function run() {
  try {
    await client.connect();
    console.log("Connected to database");
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing statement: ${statement.substring(0, 50)}...`);
        await client.query(statement);
      }
    }
    
    console.log("Migration applied successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}
 
run();
