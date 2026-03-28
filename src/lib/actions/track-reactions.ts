"use server";

import { db } from "@/db";
import { businesses, trackReactions, tracks, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export type TrackReactionType = "LIKE" | "DISLIKE";

interface ReactionContext {
  userId: string;
  businessId: string;
}

async function getReactionContext(): Promise<{ success: true; data: ReactionContext } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Необходимо войти в систему" };
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, role: true },
  });

  if (!dbUser) {
    return { success: false, error: "Пользователь не найден" };
  }

  if (dbUser.role === "ADMIN") {
    return { success: false, error: "Администраторы не оценивают треки" };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, dbUser.id),
    columns: { id: true },
  });

  if (!business) {
    return { success: false, error: "Требуется профиль бизнеса" };
  }

  return {
    success: true,
    data: {
      userId: dbUser.id,
      businessId: business.id,
    },
  };
}

async function ensureTrackAccess(trackId: string, businessId: string): Promise<{ success: true } | { success: false; error: string }> {
  const track = await db.query.tracks.findFirst({
    where: eq(tracks.id, trackId),
    columns: { id: true, businessId: true },
  });

  if (!track) {
    return { success: false, error: "Трек не найден" };
  }

  if (track.businessId && track.businessId !== businessId) {
    return { success: false, error: "Нет доступа к этому треку" };
  }

  return { success: true };
}

async function getTrackReactionSummary(trackId: string, userId: string) {
  const [aggregate] = await db
    .select({
      likes: sql<number>`cast(count(*) filter (where ${trackReactions.reactionType} = 'LIKE') as int)`,
      dislikes: sql<number>`cast(count(*) filter (where ${trackReactions.reactionType} = 'DISLIKE') as int)`,
    })
    .from(trackReactions)
    .where(eq(trackReactions.trackId, trackId));

  const userReaction = await db.query.trackReactions.findFirst({
    where: and(eq(trackReactions.trackId, trackId), eq(trackReactions.userId, userId)),
    columns: { reactionType: true },
  });

  return {
    likes: aggregate?.likes ?? 0,
    dislikes: aggregate?.dislikes ?? 0,
    userReaction: userReaction?.reactionType ?? null,
  };
}

export async function getTrackReactionSummaryAction(trackId: string) {
  try {
    const context = await getReactionContext();
    if (!context.success) {
      return { success: false, error: context.error };
    }

    const access = await ensureTrackAccess(trackId, context.data.businessId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    const data = await getTrackReactionSummary(trackId, context.data.userId);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Get track reaction summary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Не удалось получить статистику реакций",
    };
  }
}

export async function setTrackReactionAction(trackId: string, reactionType: TrackReactionType) {
  try {
    const context = await getReactionContext();
    if (!context.success) {
      return { success: false, error: context.error };
    }

    const access = await ensureTrackAccess(trackId, context.data.businessId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    await db
      .insert(trackReactions)
      .values({
        userId: context.data.userId,
        trackId,
        reactionType,
      })
      .onConflictDoUpdate({
        target: [trackReactions.userId, trackReactions.trackId],
        set: {
          reactionType,
          updatedAt: new Date(),
        },
      });

    const data = await getTrackReactionSummary(trackId, context.data.userId);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Set track reaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Не удалось сохранить реакцию",
    };
  }
}

export async function clearTrackReactionAction(trackId: string) {
  try {
    const context = await getReactionContext();
    if (!context.success) {
      return { success: false, error: context.error };
    }

    const access = await ensureTrackAccess(trackId, context.data.businessId);
    if (!access.success) {
      return { success: false, error: access.error };
    }

    await db
      .delete(trackReactions)
      .where(and(eq(trackReactions.trackId, trackId), eq(trackReactions.userId, context.data.userId)));

    const data = await getTrackReactionSummary(trackId, context.data.userId);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Clear track reaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Не удалось удалить реакцию",
    };
  }
}
