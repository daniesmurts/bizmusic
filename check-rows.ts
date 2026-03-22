import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkRows() {
  const posts = await db.execute(sql`SELECT count(*) FROM blog_posts`);
  const cats = await db.execute(sql`SELECT count(*) FROM blog_categories`);
  
  console.log("blog_posts count:", posts.rows[0].count);
  console.log("blog_categories count:", cats.rows[0].count);
  
  if (parseInt(posts.rows[0].count as string) > 0) {
    const sample = await db.execute(sql`SELECT * FROM blog_posts LIMIT 1`);
    console.log("Sample post:", JSON.stringify(sample.rows[0], null, 2));
  }
  
  process.exit(0);
}

checkRows().catch(err => {
  console.error(err);
  process.exit(1);
});
