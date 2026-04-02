"use server";

import { db } from "@/db";
import { songOfTheWeek, tracks } from "@/db/schema";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";

/**
 * Set a new song of the week (admin only)
 * Deactivates the previous active song and activates the new one
 */
export async function setSongOfTheWeek(
  trackId: string,
  expiresAt: Date
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Не авторизован");
    }

    const scope = await resolveAccessScope(user.id);
    if (!scope || scope.role !== "ADMIN") {
      throw new Error("Только администраторы могут устанавливать песню недели");
    }

    // Verify the track exists
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, trackId),
    });

    if (!track) {
      throw new Error("Track не найдена");
    }

    // Deactivate any existing active song
    await db
      .update(songOfTheWeek)
      .set({ isActive: false })
      .where(eq(songOfTheWeek.isActive, true));

    // Insert new song of the week
    const result = await db
      .insert(songOfTheWeek)
      .values({
        id: crypto.randomUUID(),
        trackId,
        expiresAt,
        isActive: true,
        postedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    return { ok: true, data: result[0] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при установке песни недели";
    return { ok: false, error: message };
  }
}

/**
 * Get the currently active song of the week with full track data
 */
export async function getCurrentSongOfTheWeek() {
  try {
    const result = await db.query.songOfTheWeek.findFirst({
      where: eq(songOfTheWeek.isActive, true),
      with: {
        track: {
          with: {
            album: {
              columns: {
                coverUrl: true,
              },
            },
          },
        },
      },
    });

    return { ok: true, data: result || null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при получении песни недели";
    return { ok: false, error: message };
  }
}

/**
 * Get song of the week history (archive) - all songs ordered by posted date
 */
export async function getSongOfTheWeekHistory(
  limit = 10,
  offset = 0
) {
  try {
    const results = await db.query.songOfTheWeek.findMany({
      with: {
        track: {
          with: {
            album: {
              columns: {
                coverUrl: true,
              },
            },
          },
        },
      },
      orderBy: [desc(songOfTheWeek.postedAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const countResult = await db.query.songOfTheWeek.findMany();
    const total = countResult.length;

    return {
      ok: true,
      data: {
        songs: results,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при получении истории";
    return { ok: false, error: message };
  }
}

/**
 * Get song of the week by posted date (YYYY-MM-DD format)
 */
export async function getSongOfTheWeekByDate(dateStr: string) {
  try {
    // Parse UTC day boundaries for stable matching across timezones.
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    const nextDate = new Date(`${dateStr}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const result = await db.query.songOfTheWeek.findFirst({
      where: and(
        gte(songOfTheWeek.postedAt, targetDate),
        lt(songOfTheWeek.postedAt, nextDate),
      ),
      with: {
        track: {
          with: {
            album: {
              columns: {
                coverUrl: true,
              },
            },
          },
        },
      },
    });

    return { ok: true, data: result || null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при получении песни";
    return { ok: false, error: message };
  }
}

/**
 * Deactivate song of the week (admin only)
 */
export async function deactivateSongOfTheWeek(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Не авторизован");
    }

    const scope = await resolveAccessScope(user.id);
    if (!scope || scope.role !== "ADMIN") {
      throw new Error("Только администраторы могут управлять песнями недели");
    }

    const result = await db
      .update(songOfTheWeek)
      .set({ isActive: false })
      .where(eq(songOfTheWeek.id, id))
      .returning();

    return { ok: true, data: result[0] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при деактивации";
    return { ok: false, error: message };
  }
}

/**
 * Get all tracks for selection (paginated)
 */
export async function getTracksForSelection(
  limit = 20,
  offset = 0,
  search = ""
) {
  try {
    const allTracks = await db.query.tracks.findMany({
      columns: {
        id: true,
        title: true,
        artist: true,
        duration: true,
        genre: true,
        coverUrl: true,
      },
    });

    let filtered = allTracks;
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = allTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.artist.toLowerCase().includes(term)
      );
    }

    const total = filtered.length;
    const results = filtered.slice(offset, offset + limit);

    return {
      ok: true,
      data: {
        tracks: results,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при загрузке треков";
    return { ok: false, error: message };
  }
}
