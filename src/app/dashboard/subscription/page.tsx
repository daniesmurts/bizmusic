import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import SubscriptionClient from "./SubscriptionClient";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  // Fetch prices from admin-managed settings
  let settingsRows = await db.select().from(platformSettings).limit(1);
  if (settingsRows.length === 0) {
    const [created] = await db
      .insert(platformSettings)
      .values({ id: "singleton" })
      .returning();
    settingsRows = [created];
  }
  const s = settingsRows[0];

  // Convert kopeks to rubles for the client
  const prices = {
    businessMonthly: Math.round(s.tierBusinessPrice / 100),
    contentMonthly: Math.round(s.tierContentPrice / 100),
    businessProMonthly: Math.round(s.tierBusinessProPrice / 100),
    businessPlusMonthly: Math.round(s.tierBusinessPlusPrice / 100),
  };

  return <SubscriptionClient prices={prices} />;
}
