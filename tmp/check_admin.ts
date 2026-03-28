
import { db } from "../src/db";
import { users, businesses } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ id: u.id, role: u.role, email: u.email })));
  
  const allBusinesses = await db.select().from(businesses);
  console.log("Businesses:", allBusinesses.map(b => ({ id: b.id, userId: b.userId, name: b.legalName })));
  
  process.exit(0);
}

checkAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
