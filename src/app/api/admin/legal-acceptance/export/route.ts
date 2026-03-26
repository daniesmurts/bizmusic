import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { legalAcceptanceEvents, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

function csvEscape(cell: unknown): string {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const events = await db.query.legalAcceptanceEvents.findMany({
      orderBy: [desc(legalAcceptanceEvents.acceptedAt)],
      limit: 10000,
      with: {
        user: {
          columns: { email: true },
        },
      },
    });

    const header = ["id", "email", "acceptedAt", "source", "ipAddress", "termsVersion"];
    const rows = events.map((event) => [
      event.id,
      event.user?.email || "",
      event.acceptedAt.toISOString(),
      event.source,
      event.ipAddress || "",
      event.termsVersion || "",
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map(csvEscape).join(","))
      .join("\n");

    const dateLabel = new Date().toISOString().slice(0, 10);

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=legal-acceptance-${dateLabel}.csv`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API/LegalAcceptanceExport] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
