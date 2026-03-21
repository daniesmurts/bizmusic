"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface PlaylistInput {
  name: string;
  businessId?: string;
  scheduleConfig?: Prisma.InputJsonValue;
}

/**
 * Get all playlists (global and business-specific)
 */
export async function getPlaylistsAction(businessId?: string) {
  try {
    const where: Prisma.PlaylistWhereInput = {};
    
    if (businessId) {
      where.businessId = businessId;
    }

    const playlists = await prisma.playlist.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            legalName: true,
          },
        },
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: playlists,
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
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        business: {
          select: {
            id: true,
            legalName: true,
          },
        },
        tracks: {
          include: {
            track: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!playlist) {
      return {
        success: false,
        error: "Playlist not found",
      };
    }

    return {
      success: true,
      data: playlist,
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
    const playlist = await prisma.playlist.create({
      data: {
        name: data.name,
        businessId: data.businessId,
        scheduleConfig: data.scheduleConfig,
      },
    });

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
    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        name: data.name,
        scheduleConfig: data.scheduleConfig,
      },
    });

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
    // We use a transaction to ensure atomic update of the playlist tracks
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing tracks for this playlist
      await tx.playlistTrack.deleteMany({
        where: { playlistId },
      });

      // 2. Insert new tracks in the specified order
      if (trackIds.length > 0) {
        const playlistTracks = trackIds.map((trackId, index) => ({
          playlistId,
          trackId,
          position: index,
        }));

        await tx.playlistTrack.createMany({
          data: playlistTracks,
        });
      }

      // 3. Update the playlist's updatedAt timestamp
      await tx.playlist.update({
        where: { id: playlistId },
        data: { updatedAt: new Date() },
      });
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
    await prisma.playlist.delete({
      where: { id: playlistId },
    });

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
    const tracks = await prisma.track.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        artist: true,
        duration: true,
        bpm: true,
        moodTags: true,
      },
    });

    return {
      success: true,
      data: tracks,
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
