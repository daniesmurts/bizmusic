"use server";

import { db } from "@/db";
import { artists, tracks, albums, users } from "@/db/schema";
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

export async function getArtistsAction() {
  try {
    const allArtists = await db.query.artists.findMany({
      orderBy: [desc(artists.createdAt)],
      with: {
        tracks: true,
        albums: true,
      },
    });

    // Add counts
    const dataWithCounts = allArtists.map(artist => ({
      ...artist,
      _count: {
        tracks: artist.tracks?.length || 0,
        albums: artist.albums?.length || 0,
      }
    }));

    return { success: true, data: dataWithCounts };
  } catch (error) {
    console.error("Fetch Artists Error:", error);
    return { success: false, error: "Failed to fetch artists" };
  }
}

export async function getArtistBySlugAction(slug: string) {
  try {
    const artist = await db.query.artists.findFirst({
      where: eq(artists.slug, slug),
      with: {
        tracks: {
          orderBy: [desc(tracks.createdAt)]
        },
        albums: {
          orderBy: [desc(albums.releaseDate)],
          with: {
            tracks: true
          }
        }
      }
    });

    if (!artist) return { success: false, error: "Artist not found" };
    return { success: true, data: artist };
  } catch (error) {
    console.error("Fetch Artist Error:", error);
    return { success: false, error: "Failed to fetch artist profile" };
  }
}

export async function createArtistAction(data: {
  name: string;
  slug: string;
  imageUrl?: string;
  bio?: string;
  isFeatured?: boolean;
  externalLinks?: {
    spotify?: string;
    vk?: string;
    appleMusic?: string;
    website?: string;
  };
}) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    const [newArtist] = await db.insert(artists).values({
      name: data.name,
      slug: data.slug,
      imageUrl: data.imageUrl,
      bio: data.bio,
      isFeatured: data.isFeatured || false,
      externalLinks: data.externalLinks || {},
    }).returning();

    revalidatePath("/admin/content");
    return { success: true, data: newArtist };
  } catch (error: any) {
    console.error("Create Artist Error:", error);
    if (error.code === '23505') {
       return { success: false, error: "Slug already exists" };
    }
    return { success: false, error: "Failed to create artist profile" };
  }
}

export async function updateArtistAction(id: string, data: {
  name: string;
  slug: string;
  imageUrl?: string;
  bio?: string;
  isFeatured?: boolean;
  externalLinks?: {
    spotify?: string;
    vk?: string;
    appleMusic?: string;
    website?: string;
  };
}) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    const [updatedArtist] = await db.update(artists)
      .set({
        name: data.name,
        slug: data.slug,
        imageUrl: data.imageUrl,
        bio: data.bio,
        isFeatured: data.isFeatured,
        externalLinks: data.externalLinks,
        updatedAt: new Date(),
      })
      .where(eq(artists.id, id))
      .returning();

    revalidatePath("/admin/content");
    revalidatePath(`/artists/${data.slug}`);
    return { success: true, data: updatedArtist };
  } catch (error) {
    console.error("Update Artist Error:", error);
    return { success: false, error: "Failed to update artist profile" };
  }
}

export async function deleteArtistAction(id: string) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    // Unlink tracks and albums first
    await db.update(tracks).set({ artistId: null }).where(eq(tracks.artistId, id));
    await db.update(albums).set({ artistId: null }).where(eq(albums.artistId, id));

    await db.delete(artists).where(eq(artists.id, id));

    revalidatePath("/admin/content");
    return { success: true };
  } catch (error) {
    console.error("Delete Artist Error:", error);
    return { success: false, error: "Failed to delete artist profile" };
  }
}
