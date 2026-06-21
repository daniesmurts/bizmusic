import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { songOfTheWeek, trackDownloadEvents, tracks } from "@/db/schema";
import { getDownloadSignedUrl, getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";
import { getAuthUser } from "@/lib/auth/get-user";

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
    const user = await getAuthUser();
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
    const VALID_SOURCES = ["email", "website", "app", "player", "song-of-week", "unknown"] as const;
    type ValidSource = typeof VALID_SOURCES[number];
    const rawSource = requestUrl.searchParams.get("source") ?? "";
    const source: ValidSource = VALID_SOURCES.includes(rawSource as ValidSource) ? (rawSource as ValidSource) : "unknown";
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

    // Downloads must NOT go through /api/storage-proxy: the serverless container
    // caps responses at 3.5 MiB, and a browser download sends no Range header, so
    // the proxy would truncate the file. Redirect straight to the raw Supabase URL
    // (proxy:false). Trade-off: downloads fail on carrier-blocked mobile networks,
    // but they deliver the complete file everywhere else. The permanent fix is the
    // Yandex Object Storage migration (Russia-reachable, no cap, native ranges).
    try {
      redirectUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 300, { proxy: false });
    } catch {
      if (!track.fileUrl.startsWith("http")) {
        redirectUrl = getFilePublicUrl(fileRef.fileName, fileRef.folder, { proxy: false });
      }
    }

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process download";
    console.error("Track download route error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
