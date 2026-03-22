import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkPublished() {
  const result = await db.execute(sql`SELECT id, title, published FROM blog_posts`);
  console.log("Posts Data:", JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

checkPublished().catch(err => {
  console.error(err);
  process.exit(1);
});
