import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: string;
}

/**
 * Returns the internal DB user {id} for the current Clerk session.
 *
 * First login flow: if no DB row matches the Clerk userId yet, we look up
 * the user by email and link the Clerk account to the existing record.
 * This handles existing Supabase users migrating to Clerk transparently.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Fast path — clerkId already linked
  const linked = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true },
  });
  if (linked) return { id: linked.id };

  // First-login path — link by email to existing Supabase-era record
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (!email) return null;

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });

    if (existing) {
      await db.update(users).set({ clerkId }).where(eq(users.id, existing.id));
      return { id: existing.id };
    }
  } catch (err) {
    console.error("[getAuthUser] first-login link failed:", err);
  }

  return null;
}
