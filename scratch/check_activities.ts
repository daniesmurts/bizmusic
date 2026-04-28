import { db } from "../src/db";
import { leadActivities } from "../src/db/schema";
import { desc } from "drizzle-orm";

async function check() {
  try {
    const all = await db.select().from(leadActivities).orderBy(desc(leadActivities.createdAt)).limit(10);
    console.log(JSON.stringify(all, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

check();
