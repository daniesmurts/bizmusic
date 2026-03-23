"use server";

import { db } from "@/db";
import { playlists, playlistTracks, tracks, type ScheduleConfig } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDownloadSignedUrl, getTrackPublicUrl } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";

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
    const playlistsList = await db.query.playlists.findMany({
      where: businessId ? eq(playlists.businessId, businessId) : undefined,
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
        const fileName = track.fileUrl.split("/").pop()?.split("?")[0] || track.fileUrl;
        
        const fallbackUrl = (isFullUrl || !supabaseUrl)
          ? track.fileUrl 
          : getTrackPublicUrl(fileName);

        let streamUrl: string | undefined = undefined;
        try {
          if (!isFullUrl && supabaseUrl) {
            streamUrl = await getDownloadSignedUrl(fileName, 3600);
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [playlist] = await db.insert(playlists).values({
      name: data.name,
      businessId: data.businessId,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

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
    const tracksList = await db.select({
      id: tracks.id,
      title: tracks.title,
      artist: tracks.artist,
      duration: tracks.duration,
      bpm: tracks.bpm,
      moodTags: tracks.moodTags,
    }).from(tracks).orderBy(tracks.title);

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
