import { db } from "@/db";
import { platformSettings } from "@/db/schema";

/**
 * Fetch the current platform prices from the database.
 * Returns prices in rubles (not kopeks).
 * This is a server-only function — do not import in client components.
 */
export async function getPlatformPrices() {
  let rows = await db.select().from(platformSettings).limit(1);
  if (rows.length === 0) {
    const [created] = await db
      .insert(platformSettings)
      .values({ id: "singleton" })
      .returning();
    rows = [created];
  }
  const s = rows[0];

  return {
    businessMonthly: Math.round(s.tierBusinessPrice / 100),
    contentMonthly: Math.round(s.tierContentPrice / 100),
    businessProMonthly: Math.round(s.tierBusinessProPrice / 100),
    businessPlusMonthly: Math.round(s.tierBusinessPlusPrice / 100),
    /** Lowest tier price in rubles — use for "от X ₽" marketing copy */
    startingPrice: Math.round(
      Math.min(s.tierBusinessPrice, s.tierContentPrice, s.tierBusinessProPrice, s.tierBusinessPlusPrice) / 100
    ),
  };
}

/** Format rubles with Russian locale: 1490 → "1 490 ₽" */
export function formatPriceRub(rubles: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(rubles) + " ₽";
}
