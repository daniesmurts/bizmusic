import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/db";
import { referralAgents, users } from "../src/db/schema";
import { count } from "drizzle-orm";

async function main() {
  try {
    const agents = await db.select({ count: count() }).from(referralAgents);
    console.log("Agents count:", agents[0].count);

    const allUsers = await db.select({ role: users.role, count: count() }).from(users).groupBy(users.role);
    console.log("Users by role:", allUsers);
    process.exit(0);
  } catch (e) {
    console.error("DB error:", e);
    process.exit(1);
  }
}
main();
