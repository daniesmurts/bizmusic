import { db } from "./src/db";
import { playlists, businesses, users } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const allPlaylists = await db.query.playlists.findMany({
    with: {
      business: {
        with: {
          user: true
        }
      }
    }
  });

  console.log("--- ALL PLAYLISTS ---");
  allPlaylists.forEach(p => {
    const ownerRole = p.business?.user?.role || "NONE (No owner/business)";
    console.log(`- ID: ${p.id}, Name: ${p.name}, Business: ${p.businessId}, Owner Role: ${ownerRole}`);
  });

  const admins = await db.query.users.findMany({
    where: eq(users.role, "ADMIN")
  });
  console.log("\n--- ADMIN USERS ---");
  admins.forEach(a => {
    console.log(`- ID: ${a.id}, Email: ${a.email}, Role: ${a.role}`);
  });
}

check().catch(console.error);
