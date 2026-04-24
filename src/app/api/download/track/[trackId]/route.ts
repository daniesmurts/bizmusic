import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { songOfTheWeek, trackDownloadEvents, tracks } from "@/db/schema";
import { getDownloadSignedUrl, getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

function hashIpAddress(ipAddress: string | null): string | null {
  if (!ipAddress) return null;
  const salt = process.env.DOWNLOAD_EVENT_HASH_SALT || "bizmusic-download-salt";
  return createHash("sha256").update(`${salt}:${ipAddress}`).digest("hex");
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await context.params;

    if (!trackId) {
      return NextResponse.json({ success: false, error: "Track ID is required" }, { status: 400 });
    }

    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, trackId),
      columns: {
        id: true,
        fileUrl: true,
      },
    });

    if (!track) {
      return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }

    const requestUrl = request.nextUrl;
    const source = requestUrl.searchParams.get("source") || "unknown";
    const requestedSongOfWeekId = requestUrl.searchParams.get("songOfWeekId");

    let songOfWeekId: string | null = null;

    if (requestedSongOfWeekId) {
      const matchingRecord = await db.query.songOfTheWeek.findFirst({
        where: and(eq(songOfTheWeek.id, requestedSongOfWeekId), eq(songOfTheWeek.trackId, track.id)),
        columns: { id: true },
      });

      if (matchingRecord) {
        songOfWeekId = matchingRecord.id;
      }
    } else {
      const latestSongOfWeek = await db.query.songOfTheWeek.findFirst({
        where: eq(songOfTheWeek.trackId, track.id),
        orderBy: [desc(songOfTheWeek.postedAt)],
        columns: { id: true },
      });

      songOfWeekId = latestSongOfWeek?.id ?? null;
    }

    const ipHash = hashIpAddress(getClientIp(request));
    const userAgent = request.headers.get("user-agent");
    const referer = request.headers.get("referer");

    await db.transaction(async (tx) => {
      await tx.insert(trackDownloadEvents).values({
        trackId: track.id,
        songOfWeekId,
        source,
        ipHash,
        userAgent,
        referer,
      });

      await tx
        .update(tracks)
        .set({ downloadsCount: sql`${tracks.downloadsCount} + 1` })
        .where(eq(tracks.id, track.id));
    });

    const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
    let redirectUrl = track.fileUrl;

    try {
      redirectUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 300);
    } catch {
      if (!track.fileUrl.startsWith("http")) {
        redirectUrl = getFilePublicUrl(fileRef.fileName, fileRef.folder);
      }
    }

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process download";
    console.error("Track download route error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
