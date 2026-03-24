"use server";

import { db } from "@/db";
import { albums, tracks, artists, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { isAdmin: false as const, error: "Unauthorized" };

  const dbUserQuery = await db.execute(
    sql`SELECT role FROM users WHERE id = ${user.id} LIMIT 1`
  );
  const dbUser = dbUserQuery.rows[0];

  if (dbUser?.role !== "ADMIN") {
    return { isAdmin: false as const, error: "Forbidden: Admin access required" };
  }

  return { isAdmin: true as const, user };
}

export async function getAlbumsAction() {
  try {
    const allAlbums = await db.query.albums.findMany({
      orderBy: [desc(albums.createdAt)],
      with: {
        tracks: true,
        artist: true,
      }
    });
    return { success: true, data: allAlbums };
  } catch (error) {
    console.error("Fetch Albums Error:", error);
    return { success: false, error: "Failed to fetch albums" };
  }
}

export async function getAlbumByIdAction(id: string) {
  try {
    const album = await db.query.albums.findFirst({
      where: eq(albums.id, id),
      with: {
        tracks: {
          orderBy: [tracks.trackNumber]
        },
        artist: true,
      }
    });
    
    if (!album) return { success: false, error: "Album not found" };
    return { success: true, data: album };
  } catch (error) {
    console.error("Fetch Album Error:", error);
    return { success: false, error: "Failed to fetch album" };
  }
}

export async function createAlbumAction(data: {
  title: string;
  artist: string;
  coverUrl?: string;
  description?: string;
  releaseDate?: string;
  trackIds?: string[];
  artistId?: string;
}) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    const [newAlbum] = await db.insert(albums).values({
      title: data.title,
      artist: data.artist,
      artistId: data.artistId,
      coverUrl: data.coverUrl,
      description: data.description,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
    }).returning();

    if (data.trackIds && data.trackIds.length > 0) {
      // Associate tracks with this album
      for (let i = 0; i < data.trackIds.length; i++) {
        await db.update(tracks)
          .set({ albumId: newAlbum.id, trackNumber: i + 1 })
          .where(eq(tracks.id, data.trackIds[i]));
      }
    }

    revalidatePath("/admin/content");
    return { success: true, data: newAlbum };
  } catch (error) {
    console.error("Create Album Error:", error);
    return { success: false, error: "Failed to create album" };
  }
}

export async function updateAlbumAction(id: string, data: {
  title: string;
  artist: string;
  coverUrl?: string;
  description?: string;
  releaseDate?: string;
  trackIds?: string[];
  artistId?: string;
}) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    await db.update(albums)
      .set({
        title: data.title,
        artist: data.artist,
        artistId: data.artistId,
        coverUrl: data.coverUrl,
        description: data.description,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(albums.id, id));

    if (data.trackIds) {
      // Clear existing tracks first if we want to re-associate
      await db.update(tracks)
        .set({ albumId: null, trackNumber: null })
        .where(eq(tracks.albumId, id));

      // Associate new tracks
      for (let i = 0; i < data.trackIds.length; i++) {
        await db.update(tracks)
          .set({ albumId: id, trackNumber: i + 1 })
          .where(eq(tracks.id, data.trackIds[i]));
      }
    }

    revalidatePath("/admin/content");
    return { success: true };
  } catch (error) {
    console.error("Update Album Error:", error);
    return { success: false, error: "Failed to update album" };
  }
}

export async function deleteAlbumAction(id: string) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    // Unlink tracks before deleting
    await db.update(tracks)
      .set({ albumId: null, trackNumber: null })
      .where(eq(tracks.albumId, id));

    await db.delete(albums).where(eq(albums.id, id));

    revalidatePath("/admin/content");
    return { success: true };
  } catch (error) {
    console.error("Delete Album Error:", error);
    return { success: false, error: "Failed to delete album" };
  }
}
