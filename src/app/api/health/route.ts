import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// Lightweight liveness probe for external monitors (Better Stack, Yandex Cloud LB, etc).
// - 200 = app + DB reachable
// - 503 = DB unreachable (degraded)
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      status: "ok",
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        error: err instanceof Error ? err.message : "database unreachable",
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
