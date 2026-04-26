import { db } from "./src/db";
import { referralAgents, agentAssignments, leads, leadActivities } from "./src/db/schema";
import { count, eq, and, gte, inArray, desc } from "drizzle-orm";
import { cities, businessNiches } from "./src/db/schema";

async function main() {
  try {
    const agents = await db
      .select({
        id: referralAgents.id,
        fullName: referralAgents.fullName,
      })
      .from(referralAgents);
    console.log("Agents:", agents);

    if (agents.length === 0) return;

    for (const agent of agents) {
      const assignments = await db
        .select({
          city: { name: cities.name },
        })
        .from(agentAssignments)
        .leftJoin(cities, eq(agentAssignments.cityId, cities.id))
        .where(eq(agentAssignments.agentId, agent.id));
      console.log(`Assignments for ${agent.fullName}:`, assignments);
    }

  } catch (e) {
    console.error("Failed:", e);
  }
}

main();
