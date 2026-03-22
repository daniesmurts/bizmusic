import { db } from "./src/db";
import { blogPosts, blogCategories } from "./src/db/schema";
import { count } from "drizzle-orm";

async function check() {
  const postsCount = await db.select({ value: count() }).from(blogPosts);
  const categoriesCount = await db.select({ value: count() }).from(blogCategories);

  const samplePosts = await db.select().from(blogPosts).limit(5);
  const sampleCats = await db.select().from(blogCategories).limit(5);

  console.log("Posts Count:", postsCount[0].value);
  console.log("Categories Count:", categoriesCount[0].value);
  console.log("Sample Posts:", JSON.stringify(samplePosts, null, 2));
  console.log("Sample Categories:", JSON.stringify(sampleCats, null, 2));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});

// Handle cleanup
process.on('exit', () => {
  // Pool cleanup handled by Node.js GC
});
