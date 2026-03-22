import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkIntegrity() {
  const posts = await db.execute(sql`SELECT id, "categoryId" FROM blog_posts`);
  const cats = await db.execute(sql`SELECT id FROM blog_categories`);
  
  const catIds = new Set(cats.rows.map(c => c.id));
  
  console.log("Category IDs:", Array.from(catIds));
  
  posts.rows.forEach(p => {
    console.log(`Post ${p.id} has categoryId ${p.categoryId}. Valid: ${catIds.has(p.categoryId)}`);
  });
  
  process.exit(0);
}

checkIntegrity().catch(err => {
  console.error(err);
  process.exit(1);
});
