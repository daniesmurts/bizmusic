import { db } from "../src/db";
import { leadActivities } from "../src/db/schema";
import { inArray } from "drizzle-orm";

async function check() {
  try {
    const emails = await db.select().from(leadActivities).where(inArray(leadActivities.type, ["email_sent", "email_received"]));
    console.log(`Found ${emails.length} email activities`);
    console.log(JSON.stringify(emails, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

check();
