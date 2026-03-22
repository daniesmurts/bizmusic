import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkUsers() {
  const usersCount = await db.execute(sql`SELECT count(*) FROM users`);
  const posts = await db.execute(sql`SELECT id, "authorId" FROM blog_posts`);
  const users = await db.execute(sql`SELECT id FROM users`);
  
  const userIds = new Set(users.rows.map(u => u.id));
  
  console.log("Users Count:", usersCount.rows[0].count);
  console.log("User IDs:", Array.from(userIds));
  
  posts.rows.forEach(p => {
    console.log(`Post ${p.id} has authorId ${p.authorId}. Valid User: ${userIds.has(p.authorId)}`);
  });
  
  process.exit(0);
}

checkUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
