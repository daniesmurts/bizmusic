import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string;
    public_metadata: Record<string, unknown>;
    first_name: string | null;
    last_name: string | null;
    deleted?: boolean;
  };
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let event: ClerkUserCreatedEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const clerkId = data.id;
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address?.toLowerCase();

    if (!primaryEmail) {
      return NextResponse.json({ error: "No primary email" }, { status: 400 });
    }

    // Try to link to an existing Supabase-era user by email
    const existing = await db.query.users.findFirst({
      where: eq(users.email, primaryEmail),
      columns: { id: true, clerkId: true },
    });

    if (existing) {
      if (!existing.clerkId) {
        await db.update(users).set({ clerkId }).where(eq(users.id, existing.id));
      }
    } else {
      // Brand-new user — insert a record
      const role = (data.public_metadata?.role as string | undefined) ?? "BUSINESS_OWNER";
      await db.insert(users).values({
        clerkId,
        email: primaryEmail,
        role: role as "ADMIN" | "BUSINESS_OWNER" | "STAFF" | "PARTNER",
        passwordHash: "CLERK_AUTH",
        termsAccepted: false,
        updatedAt: new Date(),
      });
    }
  }

  if (type === "user.deleted" && data.id) {
    // Unlink but keep the DB record (business data must survive)
    await db
      .update(users)
      .set({ clerkId: null })
      .where(eq(users.clerkId, data.id));
  }

  return NextResponse.json({ received: true });
}
