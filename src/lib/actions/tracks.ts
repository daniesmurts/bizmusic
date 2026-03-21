"use server";

import { prisma } from "@/lib/prisma";
import {
  getUploadSignedUrl,
  generateUniqueFileName,
  isValidAudioFile,
  MAX_FILE_SIZE,
  getDownloadSignedUrl,
  deleteFile,
} from "@/lib/supabase-storage";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface TrackInput {
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  moodTags: string[];
  energyLevel?: number;
  isExplicit?: boolean;
  genre?: string;
  fileUrl: string;
  fileName: string;
}

/**
 * Generate a signed upload URL for a track
 */
export async function generateUploadUrlAction(
  fileName: string,
  contentType: string
) {
  try {
    const uniqueFileName = generateUniqueFileName(fileName);
    const { uploadUrl, publicUrl } = await getUploadSignedUrl(uniqueFileName);

    return {
      success: true,
      uploadUrl,
      fileName: uniqueFileName,
      publicUrl,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate upload URL";
    console.error("Upload URL generation error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a new track in the database
 */
export async function createTrackAction(data: TrackInput) {
  try {
    const track = await prisma.track.create({
      data: {
        title: data.title,
        artist: data.artist,
        fileUrl: data.fileUrl,
        duration: Math.round(data.duration),
        bpm: data.bpm,
        moodTags: data.moodTags,
        genre: data.genre || "Unknown",
        isExplicit: data.isExplicit || false,
        energyLevel: data.energyLevel,
      },
    });

    revalidatePath("/admin/content");

    return {
      success: true,
      data: track,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create track";
    console.error("Track creation error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update an existing track
 */
export async function updateTrackAction(
  trackId: string,
  data: Partial<TrackInput>
) {
  try {
    const updateData: Prisma.TrackUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.artist !== undefined) updateData.artist = data.artist;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.bpm !== undefined) updateData.bpm = data.bpm;
    if (data.moodTags !== undefined) updateData.moodTags = data.moodTags;
    if (data.energyLevel !== undefined) updateData.energyLevel = data.energyLevel;
    if (data.isExplicit !== undefined) updateData.isExplicit = data.isExplicit;
    if (data.genre !== undefined) updateData.genre = data.genre;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;

    const track = await prisma.track.update({
      where: { id: trackId },
      data: updateData,
    });

    revalidatePath("/admin/content");

    return {
      success: true,
      data: track,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update track";
    console.error("Track update error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete a track
 */
export async function deleteTrackAction(trackId: string) {
  try {
    // First, get the track to find the file URL
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return {
        success: false,
        error: "Track not found",
      };
    }

    // Delete the file from storage (extract filename from URL)
    const fileName = track.fileUrl.split("/").pop()?.split("?")[0];
    if (fileName) {
      try {
        await deleteFile(fileName);
      } catch (storageError) {
        console.warn("Failed to delete file from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the track from database
    await prisma.track.delete({
      where: { id: trackId },
    });

    revalidatePath("/admin/content");

    return {
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete track";
    console.error("Track deletion error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get all tracks with optional filtering
 */
export async function getTracksAction(filters?: {
  search?: string;
  moodTag?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: Prisma.TrackWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { artist: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.moodTag) {
      where.moodTags = {
        has: filters.moodTag,
      };
    }

    const tracks = await prisma.track.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        _count: {
          select: { playLogs: true },
        },
      },
    });

    const tracksWithUrls = await Promise.all(
      tracks.map(async (track) => {
        // Extract the storage object filename from the full URL
        const fileName = track.fileUrl.split("/").pop()?.split("?")[0] || track.fileUrl;
        const streamUrl = await getDownloadSignedUrl(
          fileName,
          3600 // 1 hour
        );

        return {
          ...track,
          streamUrl,
        };
      })
    );

    return {
      success: true,
      data: tracksWithUrls,
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
 * Get a single track by ID
 */
export async function getTrackByIdAction(trackId: string) {
  try {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        _count: {
          select: { playLogs: true },
        },
      },
    });

    if (!track) {
      return {
        success: false,
        error: "Track not found",
      };
    }

    // Generate signed URL
    // Extract the storage object filename from the full URL
    const fileNameForSigning = track.fileUrl.split("/").pop()?.split("?")[0] || track.fileUrl;
    const streamUrl = await getDownloadSignedUrl(
      fileNameForSigning,
      3600
    );

    return {
      success: true,
      data: {
        ...track,
        streamUrl,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch track";
    console.error("Get track error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Batch update mood tags for multiple tracks
 */
export async function batchUpdateTagsAction(
  trackIds: string[],
  addTags?: string[],
  removeTags?: string[]
) {
  try {
    const updates = trackIds.map(async (trackId) => {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
      });

      if (!track) return;

      let newTags = [...track.moodTags];

      if (addTags) {
        addTags.forEach((tag) => {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        });
      }

      if (removeTags) {
        newTags = newTags.filter((tag) => !removeTags.includes(tag));
      }

      await prisma.track.update({
        where: { id: trackId },
        data: { moodTags: newTags },
      });
    });

    await Promise.all(updates);
    revalidatePath("/admin/content");

    return {
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update tags";
    console.error("Batch update error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get all unique mood tags from the library
 */
export async function getAllMoodTagsAction() {
  try {
    const tracks = await prisma.track.findMany({
      select: { moodTags: true },
    });

    const allTags = new Set<string>();
    tracks.forEach((track) => {
      track.moodTags.forEach((tag: string) => allTags.add(tag));
    });

    return {
      success: true,
      data: Array.from(allTags).sort(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tags";
    console.error("Get tags error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
