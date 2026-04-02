"use server";

import { db } from "@/db";
import { playlists, playlistTracks, tracks, businesses, users, type ScheduleConfig } from "@/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDownloadSignedUrl, getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";

async function checkRestrictedAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isRestricted: true, user: null };

  const scope = await resolveAccessScope(user.id);
  if (!scope) return { isRestricted: true, user, scope: null, business: null };
  if (scope.role === "ADMIN") return { isRestricted: false, user, scope, business: null };
  if (!scope.businessId) return { isRestricted: true, user, scope, business: null };

  const business = await db.query.businesses.findFirst({ where: eq(businesses.id, scope.businessId) });
  if (business && business.subscriptionStatus === "ACTIVE") return { isRestricted: false, user, scope, business };

  return { isRestricted: true, user, scope, business };
}

async function ensurePlaylistAccess(playlistId: string, businessId: string | null, isAdmin: boolean) {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
    columns: { id: true, businessId: true },
  });

  if (!playlist) {
    return { ok: false as const, error: "Playlist not found" };
  }

  if (isAdmin) {
    return { ok: true as const, playlist };
  }

  if (!businessId || playlist.businessId !== businessId) {
    return { ok: false as const, error: "Недостаточно прав" };
  }

  return { ok: true as const, playlist };
}

export interface PlaylistInput {
  name: string;
  businessId?: string;
  scheduleConfig?: ScheduleConfig;
}

/**
 * Get all playlists (global and business-specific)
 */
export async function getPlaylistsAction(businessId?: string) {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) {
      return { success: true, data: [] };
    }

    const effectiveBusinessId = scope?.role === "ADMIN"
      ? businessId
      : (businessId ?? scope?.businessId ?? undefined);

    const playlistsList = await db.query.playlists.findMany({
      where: scope?.role === "ADMIN"
        ? (effectiveBusinessId ? eq(playlists.businessId, effectiveBusinessId) : undefined)
        : effectiveBusinessId
          ? or(eq(playlists.businessId, effectiveBusinessId), isNull(playlists.businessId))
          : undefined,
      with: {
        business: {
          columns: {
            id: true,
            legalName: true,
          },
        },
        tracks: {
          with: {
            track: true,
          },
          orderBy: (tracks, { asc }) => [asc(tracks.position)],
        },
      },
      orderBy: [desc(playlists.createdAt)],
    });

    // Remap to match previous structure with _count
    const mappedPlaylists = playlistsList.map((p) => ({
      ...p,
      _count: { tracks: p.tracks.length }
    }));

    return {
      success: true,
      data: mappedPlaylists,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch playlists";
    console.error("Get playlists error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get a single playlist by ID
 */
export async function getPlaylistByIdAction(playlistId: string) {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) {
      return { success: false, error: "Для доступа требуется активная подписка" };
    }

    const access = await ensurePlaylistAccess(playlistId, scope?.businessId ?? null, scope?.role === "ADMIN");
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    const playlist = await db.query.playlists.findFirst({
      where: eq(playlists.id, playlistId),
      with: {
        business: {
          columns: {
            id: true,
            legalName: true,
          },
        },
        tracks: {
          with: {
            track: true,
          },
          orderBy: (tracks, { asc }) => [asc(tracks.position)],
        },
      },
    });

    if (!playlist) {
      return {
        success: false,
        error: "Playlist not found",
      };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Sign all track URLs securely
    const mappedTracks = await Promise.all(
      playlist.tracks.map(async (t) => {
        const track = t.track;
        const isFullUrl = track.fileUrl.startsWith('http');
        const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
        
        const fallbackUrl = (isFullUrl || !supabaseUrl)
          ? track.fileUrl 
          : getFilePublicUrl(fileRef.fileName, fileRef.folder);

        let streamUrl: string | undefined = undefined;
        try {
          if (!isFullUrl && supabaseUrl) {
            streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
          }
        } catch (err) {
          console.error(`Failed to sign URL for playlist track ${track.id}:`, err);
        }

        return {
          ...t,
          track: {
            ...track,
            fileUrl: fallbackUrl,
            streamUrl,
          }
        };
      })
    );

    return {
      success: true,
      data: {
        ...playlist,
        tracks: mappedTracks
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch playlist";
    console.error("Get playlist error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a new playlist
 */
export async function createPlaylistAction(data: PlaylistInput) {
  try {
    const { isRestricted, user, business, scope } = await checkRestrictedAccess();
    if (isRestricted || !user) return { success: false, error: "Для создания плейлистов нужна активная подписка" };

    const targetBusinessId = scope?.role === "ADMIN" ? (data.businessId || business?.id) : (scope?.businessId || business?.id);
    if (!targetBusinessId) {
      return { success: false, error: "Бизнес не найден" };
    }

    const [playlist] = await db.insert(playlists).values({
      name: data.name,
      businessId: targetBusinessId,
      scheduleConfig: data.scheduleConfig,
    }).returning();

    revalidatePath("/admin/content");

    return {
      success: true,
      data: playlist,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create playlist";
    console.error("Playlist creation error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update a playlist
 */
export async function updatePlaylistAction(
  playlistId: string,
  data: Partial<PlaylistInput>
) {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) return { success: false, error: "Недостаточно прав для редактирования" };

    const access = await ensurePlaylistAccess(playlistId, scope?.businessId ?? null, scope?.role === "ADMIN");
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    const [playlist] = await db.update(playlists)
      .set({
        name: data.name,
        scheduleConfig: data.scheduleConfig,
      })
      .where(eq(playlists.id, playlistId))
      .returning();

    revalidatePath("/admin/content");

    return {
      success: true,
      data: playlist,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update playlist";
    console.error("Playlist update error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update tracks in a playlist with specific order
 */
export async function updatePlaylistTracksAction(
  playlistId: string,
  trackIds: string[]
) {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) return { success: false, error: "Недостаточно прав для редактирования параметров" };

    const access = await ensurePlaylistAccess(playlistId, scope?.businessId ?? null, scope?.role === "ADMIN");
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    // We use a transaction to ensure atomic update of the playlist tracks
    await db.transaction(async (tx) => {
      // 1. Delete all existing tracks for this playlist
      await tx.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId));

      // 2. Insert new tracks in the specified order
      if (trackIds.length > 0) {
        const newPlaylistTracks = trackIds.map((trackId, index) => ({
          playlistId,
          trackId,
          position: index,
        }));

        await tx.insert(playlistTracks).values(newPlaylistTracks);
      }

      // 3. Update the playlist's updatedAt timestamp
      await tx.update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, playlistId));
    });

    revalidatePath("/admin/content");

    return {
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update playlist tracks";
    console.error("Playlist tracks update error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylistAction(playlistId: string) {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) return { success: false, error: "Недостаточно прав" };

    const access = await ensurePlaylistAccess(playlistId, scope?.businessId ?? null, scope?.role === "ADMIN");
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    await db.delete(playlists).where(eq(playlists.id, playlistId));

    revalidatePath("/admin/content");

    return {
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete playlist";
    console.error("Playlist deletion error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get all tracks for playlist building
 */
export async function getTracksForPlaylistAction() {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) return { success: true, data: [] };

    const tracksList = await db.select({
      id: tracks.id,
      title: tracks.title,
      artist: tracks.artist,
      duration: tracks.duration,
      bpm: tracks.bpm,
      moodTags: tracks.moodTags,
    }).from(tracks)
      .where(scope?.role === "ADMIN" ? undefined : or(isNull(tracks.businessId), eq(tracks.businessId, scope?.businessId ?? "")))
      .orderBy(tracks.title);

    return {
      success: true,
      data: tracksList,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tracks";
    console.error("Get tracks error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Add a single track to a playlist
 */
export async function addTrackToPlaylistAction(playlistId: string, trackId: string) {
  try {
    const { isRestricted, scope } = await checkRestrictedAccess();
    if (isRestricted) return { success: false, error: "Недостаточно прав для редактирования" };

    const access = await ensurePlaylistAccess(playlistId, scope?.businessId ?? null, scope?.role === "ADMIN");
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    await db.transaction(async (tx) => {
      // 1. Get current max position
      const currentTracks = await tx.select({
        position: playlistTracks.position
      })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId))
      .orderBy(desc(playlistTracks.position))
      .limit(1);

      const nextPosition = currentTracks.length > 0 ? (currentTracks[0].position + 1) : 0;

      // 2. Insert new track
      await tx.insert(playlistTracks).values({
        playlistId,
        trackId,
        position: nextPosition,
      });

      // 3. Update playlist timestamp
      await tx.update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, playlistId));
    });

    revalidatePath("/playlists");
    revalidatePath("/dashboard/announcements");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add track to playlist";
    console.error("Add track to playlist error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
