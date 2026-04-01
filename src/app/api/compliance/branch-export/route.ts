import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { locations, playLogs, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";

function csvEscape(cell: unknown) {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await resolveAccessScope(user.id);
    if (!scope) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const location = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
      columns: { id: true, name: true, businessId: true },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    if (scope.role !== "ADMIN") {
      if (scope.isBranchManager && scope.assignedLocationId !== location.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!scope.isBranchManager && scope.businessId !== location.businessId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const filters = [eq(playLogs.locationId, location.id)];
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        filters.push(gte(playLogs.playedAt, fromDate));
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        filters.push(lte(playLogs.playedAt, toDate));
      }
    }

    const logs = await db.query.playLogs.findMany({
      where: and(...filters),
      orderBy: [desc(playLogs.playedAt)],
      limit: 10000,
      with: {
        track: { columns: { title: true, artist: true } },
        business: { columns: { legalName: true } },
        location: { columns: { name: true } },
      },
    });

    const header = ["playedAt", "business", "location", "trackTitle", "trackArtist", "trackId"];
    const rows = logs.map((log) => [
      log.playedAt.toISOString(),
      log.business?.legalName || "",
      log.location?.name || "",
      log.track?.title || "",
      log.track?.artist || "",
      log.trackId,
    ]);

    const csv = [header, ...rows].map((line) => line.map(csvEscape).join(",")).join("\n");
    const safeLabel = location.name.toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi, "-");
    const dateLabel = new Date().toISOString().slice(0, 10);

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=branch-playlogs-${safeLabel}-${dateLabel}.csv`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Branch export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}