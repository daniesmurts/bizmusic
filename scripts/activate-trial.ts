/**
 * Gives a client free access without a payment: marks their business ACTIVE
 * until now + N days. Run after the client has completed /dashboard/setup.
 *
 *   npx tsx scripts/activate-trial.ts client@example.ru 14
 *
 * No card is attached (rebillId stays null), so the billing cron never charges
 * or expires it; switch it off by hand when the trial ends.
 */
import { loadTargetDb } from "./lib/target-db";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const days = Number(process.argv[3] ?? 14);
  if (!email || !email.includes("@") || !Number.isInteger(days) || days < 1 || days > 365) {
    console.error("Usage: npx tsx scripts/activate-trial.ts <email> [days=14]");
    process.exit(1);
  }

  loadTargetDb();

  const { db } = await import("../src/db");
  const { businesses, users } = await import("../src/db/schema");
  const { eq, sql } = await import("drizzle-orm");

  const user = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
    columns: { id: true },
  });
  if (!user) {
    console.error(`No account for ${email}. Create it first: npm run create-user -- ${email}`);
    process.exit(1);
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const updated = await db
    .update(businesses)
    .set({ subscriptionStatus: "ACTIVE", subscriptionExpiresAt: expiresAt })
    .where(eq(businesses.userId, user.id))
    .returning({ id: businesses.id, legalName: businesses.legalName });

  if (updated.length === 0) {
    console.error(`${email} has no business profile yet. Ask the client to complete /dashboard/setup first.`);
    process.exit(1);
  }

  for (const b of updated) {
    console.log(`✅ ACTIVE until ${expiresAt.toLocaleDateString("ru-RU")}: ${b.legalName} (${b.id})`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
