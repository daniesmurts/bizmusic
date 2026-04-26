import { db } from "../src/db";
import { getAgentsOverviewAction } from "../src/lib/actions/crm-admin";

async function main() {
  console.log("Checking database...");
  try {
    const agents = await db.query.referralAgents.findMany();
    console.log(`Found ${agents.length} agents in DB directly.`);
  } catch (e) {
    console.error("Direct DB error:", e);
  }
}
main();
