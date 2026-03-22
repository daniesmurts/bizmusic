import { db } from "./src/db/index";
import { blogPosts, blogCategories, users } from "./src/db/schema";
import { desc, and, eq, sql, SQL } from "drizzle-orm";

async function test() {
  console.log("Testing Drizzle query...");
  try {
    const posts = await db.query.blogPosts.findMany({
      limit: 1,
      with: {
        category: true,
        author: {
          columns: {
            id: true,
            email: true,
          }
        },
        tags: true,
      },
    });
    console.log("Query success! Found posts: ", posts.length);
  } catch(e) {
    console.error("Drizzle query error:", e);
  }
  process.exit(0);
}
test();
