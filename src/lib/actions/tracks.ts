"use server";

import { db } from "@/db";
import { tracks, playLogs, businesses, users, artists, voiceAnnouncements, trackReactions } from "@/db/schema";
import { eq, or, ilike, sql, desc, and, arrayContains, SQL, inArray, isNull } from "drizzle-orm";
import {
  getUploadSignedUrl,
  generateUniqueFileName,
  getDownloadSignedUrl,
  deleteFile,
  getFilePublicUrl,
  parseStorageObjectRef,
} from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface TrackInput {
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  moodTags: string[];
  energyLevel?: number;
  isExplicit?: boolean;
  isFeatured?: boolean;
  genre?: string;
  fileUrl: string;
  fileName: string;
  artistId?: string;
  coverUrl?: string;
}

/**
 * Escape special LIKE/ILIKE characters to prevent injection.
 */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

/**
 * Generate a signed upload URL for a track
 */
export async function generateUploadUrlAction(
  fileName: string,
  contentType: string
) {
  try {
    // `contentType` is reserved for future server-side validation.
    void contentType;
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
    const [track] = await db.insert(tracks).values({
      title: data.title,
      artist: data.artist,
      fileUrl: data.fileUrl,
      duration: Math.round(data.duration),
      bpm: data.bpm,
      moodTags: data.moodTags,
      genre: data.genre || "Unknown",
      isExplicit: data.isExplicit || false,
      isFeatured: data.isFeatured || false,
      energyLevel: data.energyLevel,
      artistId: data.artistId,
      coverUrl: data.coverUrl,
    }).returning();

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
    const updateData: Partial<typeof tracks.$inferInsert> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.artist !== undefined) updateData.artist = data.artist;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.bpm !== undefined) updateData.bpm = data.bpm;
    if (data.moodTags !== undefined) updateData.moodTags = data.moodTags;
    if (data.energyLevel !== undefined) updateData.energyLevel = data.energyLevel;
    if (data.isExplicit !== undefined) updateData.isExplicit = data.isExplicit;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.genre !== undefined) updateData.genre = data.genre;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.artistId !== undefined) updateData.artistId = data.artistId;
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;

    const [track] = await db.update(tracks)
      .set(updateData)
      .where(eq(tracks.id, trackId))
      .returning();

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
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, trackId),
    });

    if (!track) {
      return {
        success: false,
        error: "Track not found",
      };
    }

    // Delete the file from storage (extract filename from URL)
    const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
    if (fileRef.fileName) {
      try {
        await deleteFile(fileRef.fileName, fileRef.folder);
      } catch (storageError) {
        console.warn("Failed to delete file from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the track from database
    await db.delete(tracks).where(eq(tracks.id, trackId));

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
  businessId?: string;
  isAnnouncement?: boolean;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const conditions: SQL[] = [];

    let businessId: string | undefined = filters?.businessId;
    
    if (user && !businessId) {
      const business = await db.query.businesses.findFirst({ where: eq(businesses.userId, user.id) });
      if (business) {
        businessId = business.id;
      }
    }

    // Combine base conditions with an OR, unless we are specifically looking for announcements.
    // Business users should see the full global catalog (businessId IS NULL) plus their own tracks.
    if (filters?.isAnnouncement) {
      if (businessId) {
        conditions.push(and(eq(tracks.businessId, businessId), eq(tracks.isAnnouncement, true)) as SQL);
      } else {
        // If no businessId, we can't really show private announcements
        conditions.push(eq(tracks.isAnnouncement, true));
      }
    } else {
      if (businessId) {
        conditions.push(or(isNull(tracks.businessId), eq(tracks.businessId, businessId)) as SQL);
      } else {
        // Fallback for non-business context: expose global catalog tracks.
        conditions.push(isNull(tracks.businessId));
      }
      // Exclude announcements from general music search unless requested
      conditions.push(eq(tracks.isAnnouncement, false));
    }

    if (filters?.search) {
      const safeSearch = escapeLike(filters.search);
      conditions.push(
        or(
          ilike(tracks.title, `%${safeSearch}%`),
          ilike(tracks.artist, `%${safeSearch}%`)
        ) as SQL
      );
    }

    if (filters?.moodTag) {
      conditions.push(arrayContains(tracks.moodTags, [filters.moodTag]) as SQL);
    }

    const tracksList = await db
      .select({
        track: tracks,
        artistProfile: artists,
        playLogsCount: sql<number>`cast(count(${playLogs.id}) as int)`,
        announcementProvider: voiceAnnouncements.provider,
      })
      .from(tracks)
      .leftJoin(playLogs, eq(playLogs.trackId, tracks.id))
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .leftJoin(voiceAnnouncements, eq(voiceAnnouncements.trackId, tracks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tracks.id, artists.id, voiceAnnouncements.id)
      .orderBy(desc(tracks.createdAt))
      .limit(filters?.limit || 100)
      .offset(filters?.offset || 0);

    // Remap to match previous return structure with _count
    const tracksWithCount = tracksList.map(({ track, artistProfile, playLogsCount, announcementProvider }) => ({
      ...track,
      artistProfile: artistProfile || null,
      _count: { playLogs: playLogsCount || 0 },
      provider: announcementProvider
    }));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Check if we have any tracks that require a supabaseUrl which is missing
    const needsConfiguration = tracksWithCount.some(t => !t.fileUrl.startsWith('http')) && !supabaseUrl;
    
    if (needsConfiguration) {
      console.error("[Tracks] NEXT_PUBLIC_SUPABASE_URL is not set; cannot construct fallback URLs for library tracks");
      return {
        success: false,
        error: "Server configuration is incomplete: NEXT_PUBLIC_SUPABASE_URL is required for storage access.",
      };
    }

    const tracksWithUrls = await Promise.all(
      tracksWithCount.map(async (track) => {
        const isFullUrl = track.fileUrl.startsWith('http');
        const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
        const fallbackUrl = (isFullUrl || !supabaseUrl)
          ? track.fileUrl 
          : getFilePublicUrl(fileRef.fileName, fileRef.folder);

        try {
          const streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
          return { ...track, fileUrl: fallbackUrl, streamUrl };
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Tracks] Critical: Failed to generate signed URL for track ${track.id}:`, errMsg);
          return { ...track, fileUrl: fallbackUrl };
        }
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
 * Get featured tracks for the home page (PUBLIC)
 */
export async function getFeaturedTracksAction() {
  try {
    // Note: Do NOT use `with: { artist: true }` — the `artist` relation name
    // conflicts with the `artist` text column, causing the string value to be
    // overwritten by the relation object at runtime.
    const featuredTracks = await db.query.tracks.findMany({
      where: eq(tracks.isFeatured, true),
      orderBy: [desc(tracks.createdAt)],
      limit: 6,
    });

    if (featuredTracks.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch linked artist profiles separately to avoid the naming conflict
    const artistIds = [...new Set(featuredTracks.filter(t => t.artistId).map(t => t.artistId!))];
    const artistProfiles = artistIds.length > 0
      ? await db.query.artists.findMany({ where: inArray(artists.id, artistIds) })
      : [];
    const artistMap = new Map(artistProfiles.map(a => [a.id, a]));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Check if any featured tracks require a supabaseUrl which is missing
    const needsConfiguration = featuredTracks.some(t => !t.fileUrl.startsWith('http')) && !supabaseUrl;
    
    if (needsConfiguration) {
      console.error("[Tracks] ❌ NEXT_PUBLIC_SUPABASE_URL is not set — cannot generate audio URLs. Was it passed as --build-arg during docker build?");
      return {
        success: false,
        error: "Ошибка конфигурации сервера. Свяжитесь с поддержкой.",
      };
    }

    const tracksWithUrls = await Promise.all(
      featuredTracks.map(async (track) => {
        const isFullUrl = track.fileUrl.startsWith('http');
        const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
        const fallbackUrl = (isFullUrl || !supabaseUrl)
          ? track.fileUrl 
          : getFilePublicUrl(fileRef.fileName, fileRef.folder);
          
        try {
          const streamUrl = await getDownloadSignedUrl(
            fileRef.fileName,
            fileRef.folder,
            3600 // 1 hour
          );
 
          return {
            ...track,
            artistProfile: track.artistId ? artistMap.get(track.artistId) ?? null : null,
            fileUrl: fallbackUrl,
            streamUrl,
          };
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Tracks] Critical: Failed to generate signed URL for track ${track.id} (${track.title}):`, errMsg);
          return {
            ...track,
            artistProfile: track.artistId ? artistMap.get(track.artistId) ?? null : null,
            fileUrl: fallbackUrl,
          };
        }
      })
    );

    return {
      success: true,
      data: tracksWithUrls,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch featured tracks";
    console.error("Get featured tracks error:", error);
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let isRestricted = true;
    if (user) {
      const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      if (dbUser?.role === "ADMIN") {
        isRestricted = false;
      } else {
        const business = await db.query.businesses.findFirst({ where: eq(businesses.userId, user.id) });
        if (business && business.subscriptionStatus === "ACTIVE") {
          isRestricted = false;
        }
      }
    }

    const trackData = await db.query.tracks.findFirst({
      where: eq(tracks.id, trackId),
      with: {
        playLogs: true,
        artist: true,
      },
    });

    if (!trackData) {
      return {
        success: false,
        error: "Track not found",
      };
    }

    if (isRestricted && !trackData.isFeatured) {
      return {
        success: false,
        error: "Требуется активная подписка для доступа к этому треку",
      };
    }

    const track = {
      ...trackData,
      _count: { playLogs: trackData.playLogs.length }
    };

    const isFullUrl = track.fileUrl.startsWith('http');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isFullUrl && !supabaseUrl) {
      console.error(`[Tracks] NEXT_PUBLIC_SUPABASE_URL is not set; cannot construct fallback file URL for track: ${track.id}`);
      return {
        success: false,
        error: "File URL is invalid and server configuration is incomplete.",
      };
    }

    const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
    const fallbackUrl = (isFullUrl || !supabaseUrl)
      ? track.fileUrl 
      : getFilePublicUrl(fileRef.fileName, fileRef.folder);

    let streamUrl: string | undefined = undefined;
    try {
      streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Tracks] Failed to sign URL for single track ${track.id}:`, errMsg);
    }

    return {
      success: true,
      data: {
        ...track,
        fileUrl: fallbackUrl,
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
 * Get ALL tracks for admin dashboard (no filtering by featured/business)
 */
export async function getAdminTracksAction(filters?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify admin role
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    const conditions: SQL[] = [];

    if (filters?.search) {
      const safeSearch = escapeLike(filters.search);
      conditions.push(
        or(
          ilike(tracks.title, `%${safeSearch}%`),
          ilike(tracks.artist, `%${safeSearch}%`)
        ) as SQL
      );
    }

    const tracksList = await db
      .select({
        track: tracks,
        artistProfile: artists,
        playLogsCount: sql<number>`cast(count(${playLogs.id}) as int)`,
        likesCount: sql<number>`cast(count(${trackReactions.id}) filter (where ${trackReactions.reactionType} = 'LIKE') as int)`,
        dislikesCount: sql<number>`cast(count(${trackReactions.id}) filter (where ${trackReactions.reactionType} = 'DISLIKE') as int)`,
      })
      .from(tracks)
      .leftJoin(playLogs, eq(playLogs.trackId, tracks.id))
      .leftJoin(trackReactions, eq(trackReactions.trackId, tracks.id))
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tracks.id, artists.id)
      .orderBy(desc(tracks.createdAt))
      .limit(filters?.limit || 1000)
      .offset(filters?.offset || 0);

    const tracksWithCount = tracksList.map(({ track, artistProfile, playLogsCount, likesCount, dislikesCount }) => ({
      ...track,
      artistProfile: artistProfile || null,
      _count: {
        playLogs: playLogsCount || 0,
        likes: likesCount || 0,
        dislikes: dislikesCount || 0,
      },
    }));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const needsConfiguration = tracksWithCount.some(t => !t.fileUrl.startsWith('http')) && !supabaseUrl;
    
    if (needsConfiguration) {
      console.error("[Admin Tracks] NEXT_PUBLIC_SUPABASE_URL is not set");
      return {
        success: false,
        error: "Server configuration is incomplete",
      };
    }

    // Process in batches of 5 to avoid overwhelming Supabase with parallel signed URL requests
    const tracksWithUrls: typeof tracksWithCount extends (infer T)[] ? (T & { streamUrl?: string })[] : never[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < tracksWithCount.length; i += BATCH_SIZE) {
      const batch = tracksWithCount.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (track) => {
          const isFullUrl = track.fileUrl.startsWith('http');
          const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
          const fallbackUrl = (isFullUrl || !supabaseUrl)
            ? track.fileUrl 
            : getFilePublicUrl(fileRef.fileName, fileRef.folder);

          try {
            const streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
            return { ...track, fileUrl: fallbackUrl, streamUrl };
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.warn(`[Admin Tracks] Signed URL failed for track ${track.id}: ${errMsg}`);
            return { ...track, fileUrl: fallbackUrl };
          }
        })
      );
      tracksWithUrls.push(...batchResults);
    }

    return {
      success: true,
      data: tracksWithUrls,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch admin tracks";
    console.error("Get admin tracks error:", error);
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
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, trackId),
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

      await db.update(tracks)
        .set({ moodTags: newTags })
        .where(eq(tracks.id, trackId));
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
    const tracksList = await db.select({ moodTags: tracks.moodTags }).from(tracks);

    const allTags = new Set<string>();
    tracksList.forEach((track) => {
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
