import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function listTables() {
  const result = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  console.log("Database Tables:", JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

listTables().catch(err => {
  console.error(err);
  process.exit(1);
});
