import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function testConnection() {
  console.log("Testing simple connection...");
  try {
    const result = await db.execute(sql`SELECT 1 as result`);
    console.log("Connection success!", result);
  } catch (e) {
    console.error("Connection error:", e);
  }
  process.exit(0);
}
testConnection();
