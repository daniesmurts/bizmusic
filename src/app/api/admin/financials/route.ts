import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { db } from "@/db";
import {
  platformSettings,
  platformSettingsAuditLog,
  businesses,
  referralAgents,
  commissionLedger,
  users,
} from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { checkRateLimit, buildRateLimitHeaders } from "@/lib/middleware/rate-limit";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PlatformSettingsRow {
  id: string;
  tierBusinessPrice: number;
  tierContentPrice: number;
  tierBusinessProPrice: number;
  tierBusinessPlusPrice: number;
  paymentProcessingFeePercent: number;
  taxRatePercent: number;
  ambassadorCommissionPercent: number;
  minimumPayoutThresholdKopeks: number;
  payoutDay: string;
  infrastructureCostKopeks: number;
  updatedAt: Date;
}

interface LiveData {
  subscribersByTier: Record<string, number>;
  totalActiveSubscribers: number;
  activeAmbassadors: number;
  totalPayoutsKopeks: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) return null;

  const userData = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  if (userData?.role !== "ADMIN") return null;
  return user;
}

async function getOrCreateSettings(): Promise<PlatformSettingsRow> {
  const rows = await db.select().from(platformSettings).limit(1);
  if (rows.length > 0) return rows[0];

  // Create the singleton row with defaults
  const [created] = await db
    .insert(platformSettings)
    .values({ id: "singleton" })
    .returning();
  return created;
}

async function getLiveData(): Promise<LiveData> {
  // Count subscribers by plan slug
  const subscriberRows = await db
    .select({
      planSlug: businesses.currentPlanSlug,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(businesses)
    .where(eq(businesses.subscriptionStatus, "ACTIVE"))
    .groupBy(businesses.currentPlanSlug);

  const subscribersByTier: Record<string, number> = {};
  let totalActiveSubscribers = 0;
  for (const row of subscriberRows) {
    const slug = row.planSlug || "unknown";
    subscribersByTier[slug] = row.count;
    totalActiveSubscribers += row.count;
  }

  // Count active ambassadors
  const [ambassadorRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(referralAgents)
    .where(eq(referralAgents.status, "active"));

  // Total payouts (paid commissions in kopeks)
  const [payoutsRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${commissionLedger.commissionAmountKopecks}), 0)`,
    })
    .from(commissionLedger)
    .where(eq(commissionLedger.status, "paid"));

  return {
    subscribersByTier,
    totalActiveSubscribers,
    activeAmbassadors: ambassadorRow?.count ?? 0,
    totalPayoutsKopeks: payoutsRow?.total ?? 0,
  };
}

// ─── GET: Fetch settings + live data ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = checkRateLimit({ key: `admin-financials-get:${user.id}`, maxRequests: 30, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: buildRateLimitHeaders(limit.retryAfterSeconds) });
  }

  try {
    const [settings, liveData] = await Promise.all([
      getOrCreateSettings(),
      getLiveData(),
    ]);

    return NextResponse.json({ settings, liveData });
  } catch (error) {
    console.error("[Financials API] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT: Update settings + audit log ───────────────────────────────────────────

const UPDATABLE_FIELDS = [
  "tierBusinessPrice",
  "tierContentPrice",
  "tierBusinessProPrice",
  "tierBusinessPlusPrice",
  "paymentProcessingFeePercent",
  "taxRatePercent",
  "ambassadorCommissionPercent",
  "minimumPayoutThresholdKopeks",
  "payoutDay",
  "infrastructureCostKopeks",
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

const PERCENT_FIELDS = new Set([
  "paymentProcessingFeePercent",
  "taxRatePercent",
  "ambassadorCommissionPercent",
]);

const KOPEKS_FIELDS = new Set([
  "tierBusinessPrice",
  "tierContentPrice",
  "tierBusinessProPrice",
  "tierBusinessPlusPrice",
  "minimumPayoutThresholdKopeks",
  "infrastructureCostKopeks",
]);

function validateField(field: UpdatableField, value: unknown): string | null {
  if (field === "payoutDay") {
    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    if (typeof value !== "string" || !validDays.includes(value)) {
      return `${field} must be one of: ${validDays.join(", ")}`;
    }
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${field} must be a finite number`;
  }

  if (PERCENT_FIELDS.has(field)) {
    if (value < 0 || value > 100) return `${field} must be between 0 and 100`;
    // Max 2 decimal places
    if (Math.round(value * 100) !== value * 100)
      return `${field} allows max 2 decimal places`;
  }

  if (KOPEKS_FIELDS.has(field)) {
    if (!Number.isInteger(value) || value < 0)
      return `${field} must be a non-negative integer`;
  }

  return null;
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = checkRateLimit({ key: `admin-financials-put:${user.id}`, maxRequests: 10, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: buildRateLimitHeaders(limit.retryAfterSeconds) });
  }

  try {
    const body = await req.json();
    const errors: string[] = [];

    // Build a properly-typed set object for Drizzle
    const setObj: Record<string, number | string | Date> = { updatedAt: new Date() };
    const changedFields: string[] = [];

    // Validate each submitted field
    for (const field of UPDATABLE_FIELDS) {
      if (field in body) {
        const err = validateField(field, body[field]);
        if (err) {
          errors.push(err);
        } else {
          setObj[field] = body[field];
          changedFields.push(field);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (changedFields.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Get current settings for audit log
    const current = await getOrCreateSettings();

    // Write audit log entries for each changed field
    const auditEntries = [];
    for (const field of changedFields) {
      const oldValue = String(
        current[field as keyof PlatformSettingsRow] ?? ""
      );
      const newValueStr = String(setObj[field]);
      if (oldValue !== newValueStr) {
        auditEntries.push({
          adminUserId: user.id,
          field,
          oldValue,
          newValue: newValueStr,
        });
      }
    }

    // Update settings — cast through unknown to satisfy Drizzle's strict column types
    const [updated] = await db
      .update(platformSettings)
      .set(setObj as typeof platformSettings.$inferInsert)
      .where(eq(platformSettings.id, "singleton"))
      .returning();

    // Insert audit log entries
    if (auditEntries.length > 0) {
      await db.insert(platformSettingsAuditLog).values(auditEntries);
    }

    return NextResponse.json({
      settings: updated,
      auditEntriesCreated: auditEntries.length,
    });
  } catch (error) {
    console.error("[Financials API] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
