"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  announcementBulkJobs,
  announcementBulkJobTargets,
  businesses,
  locationPlaylistAssignments,
  locations,
  playlistTracks,
  playlists,
  users,
} from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { generateVoiceAnnouncementAction } from "@/lib/actions/voice-announcements";

async function resolveBulkScope() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, businessId: null, isBranchManager: false };
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, role: true, assignedLocationId: true },
  });

  if (!dbUser) {
    return { user: null, businessId: null, isBranchManager: false };
  }

  if (dbUser.role === "STAFF") {
    return { user: dbUser, businessId: null, isBranchManager: true };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, dbUser.id),
    columns: { id: true },
  });

  return {
    user: dbUser,
    businessId: business?.id ?? null,
    isBranchManager: false,
  };
}

export interface BulkAnnouncementInput {
  title: string;
  text: string;
  ssmlText?: string;
  provider: "google" | "sberbank";
  voiceName: string;
  speakingRate?: number;
  pitch?: number;
  jingleId?: string;
  playlistIds: string[];
  locationIds: string[];
  conflictMode?: "skip-existing" | "append";
  rollbackOnFailure?: boolean;
  dryRun?: boolean;
}

export async function getAnnouncementBulkJobsAction() {
  try {
    const scope = await resolveBulkScope();
    if (!scope.user || !scope.businessId) {
      return { success: false, error: "Unauthorized" };
    }

    const rows = await db.query.announcementBulkJobs.findMany({
      where: eq(announcementBulkJobs.businessId, scope.businessId),
      orderBy: [desc(announcementBulkJobs.createdAt)],
      with: {
        targets: true,
        generatedAnnouncement: {
          columns: { id: true, trackId: true, createdAt: true },
        },
      },
      limit: 20,
    });

    return { success: true, data: rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить bulk-джобы";
    return { success: false, error: message };
  }
}

export async function generateBulkAnnouncementsAction(input: BulkAnnouncementInput) {
  try {
    const scope = await resolveBulkScope();
    if (!scope.user) return { success: false, error: "Unauthorized" };
    if (scope.isBranchManager) return { success: false, error: "Менеджер филиала не может запускать массовую генерацию" };
    if (!scope.businessId) return { success: false, error: "Бизнес не найден" };

    const title = input.title.trim();
    const text = input.text.trim();
    const playlistIds = Array.from(new Set(input.playlistIds));
    const locationIds = Array.from(new Set(input.locationIds));
    const conflictMode = input.conflictMode ?? "skip-existing";
    const rollbackOnFailure = Boolean(input.rollbackOnFailure);

    if (!title || !text) {
      return { success: false, error: "Заполните заголовок и текст" };
    }

    if (playlistIds.length === 0 && locationIds.length === 0) {
      return { success: false, error: "Выберите хотя бы один плейлист или филиал" };
    }

    const ownedPlaylists = playlistIds.length > 0
      ? await db.query.playlists.findMany({
          where: and(eq(playlists.businessId, scope.businessId), inArray(playlists.id, playlistIds)),
          columns: { id: true, name: true },
        })
      : [];

    const ownedLocations = locationIds.length > 0
      ? await db.query.locations.findMany({
          where: and(eq(locations.businessId, scope.businessId), inArray(locations.id, locationIds)),
          columns: { id: true, name: true },
        })
      : [];

    if (ownedPlaylists.length !== playlistIds.length) {
      return { success: false, error: "Некоторые плейлисты недоступны" };
    }

    if (ownedLocations.length !== locationIds.length) {
      return { success: false, error: "Некоторые филиалы недоступны" };
    }

    const totalTargets = ownedPlaylists.length + ownedLocations.length;

    const locationAssignments = ownedLocations.length > 0
      ? await db.query.locationPlaylistAssignments.findMany({
          where: and(
            eq(locationPlaylistAssignments.businessId, scope.businessId),
            inArray(locationPlaylistAssignments.locationId, ownedLocations.map((l) => l.id))
          ),
          columns: { locationId: true, playlistId: true },
        })
      : [];

    const assignmentMap = new Map(locationAssignments.map((a) => [a.locationId, a.playlistId]));
    const locationsWithoutAssignment = ownedLocations.filter((l) => !assignmentMap.get(l.id));

    if (input.dryRun) {
      return {
        success: true,
        data: {
          dryRun: true,
          estimatedCredits: 1,
          totalTargets,
          playlists: ownedPlaylists,
          locations: ownedLocations,
          locationsWithoutAssignment: locationsWithoutAssignment.map((l) => ({ id: l.id, name: l.name })),
          conflictMode,
          rollbackOnFailure,
        },
      };
    }

    const [job] = await db.insert(announcementBulkJobs).values({
      businessId: scope.businessId,
      createdByUserId: scope.user.id,
      title,
      text,
      ssmlText: input.ssmlText?.trim() || null,
      provider: input.provider,
      voiceName: input.voiceName,
      speakingRate: input.speakingRate ?? 1,
      pitch: input.pitch ?? 0,
      jingleId: input.jingleId || null,
      status: "PROCESSING",
      totalTargets,
      successTargets: 0,
      failedTargets: 0,
    }).returning();

    if (ownedPlaylists.length > 0) {
      await db.insert(announcementBulkJobTargets).values(
        ownedPlaylists.map((item) => ({
          jobId: job.id,
          playlistId: item.id,
          status: "PENDING",
        }))
      );
    }

    if (ownedLocations.length > 0) {
      await db.insert(announcementBulkJobTargets).values(
        ownedLocations.map((item) => ({
          jobId: job.id,
          locationId: item.id,
          status: "PENDING",
        }))
      );
    }

    const generated = await generateVoiceAnnouncementAction({
      title,
      text,
      ssmlText: input.ssmlText?.trim() || undefined,
      provider: input.provider,
      voiceName: input.voiceName,
      speakingRate: input.speakingRate,
      pitch: input.pitch,
      jingleId: input.jingleId,
    });

    if (!generated.success || !generated.data?.track?.id || !generated.data.announcement?.id) {
      await db.update(announcementBulkJobs)
        .set({ status: "FAILED", failedTargets: totalTargets, updatedAt: new Date() })
        .where(eq(announcementBulkJobs.id, job.id));

      await db.update(announcementBulkJobTargets)
        .set({
          status: "FAILED",
          errorMessage: generated.error || "Не удалось сгенерировать базовый анонс",
          updatedAt: new Date(),
        })
        .where(eq(announcementBulkJobTargets.jobId, job.id));

      return { success: false, error: generated.error || "Не удалось выполнить массовую генерацию" };
    }

    const trackId = generated.data.track.id;
    const announcementId = generated.data.announcement.id;

    let successTargets = 0;
    let failedTargets = 0;
    const insertedPlaylistIds: string[] = [];

    for (const playlist of ownedPlaylists) {
      try {
        const latest = await db.query.playlistTracks.findMany({
          where: eq(playlistTracks.playlistId, playlist.id),
          columns: { position: true },
          orderBy: [desc(playlistTracks.position)],
          limit: 1,
        });
        const nextPosition = latest.length > 0 ? latest[0].position + 1 : 0;

        const alreadyInPlaylist = await db.query.playlistTracks.findFirst({
          where: and(eq(playlistTracks.playlistId, playlist.id), eq(playlistTracks.trackId, trackId)),
          columns: { id: true },
        });

        if (alreadyInPlaylist && conflictMode === "skip-existing") {
          await db.update(announcementBulkJobTargets)
            .set({
              status: "SUCCESS",
              errorMessage: "SKIPPED_EXISTING",
              announcementId,
              trackId,
              updatedAt: new Date(),
            })
            .where(and(
              eq(announcementBulkJobTargets.jobId, job.id),
              eq(announcementBulkJobTargets.playlistId, playlist.id)
            ));
          successTargets += 1;
          continue;
        }

        const inserted = await db.insert(playlistTracks)
          .values({
            playlistId: playlist.id,
            trackId,
            position: nextPosition,
          })
          .onConflictDoNothing({ target: [playlistTracks.playlistId, playlistTracks.trackId] })
          .returning({ playlistId: playlistTracks.playlistId });

        if (inserted.length > 0) {
          insertedPlaylistIds.push(playlist.id);
        }

        await db.update(announcementBulkJobTargets)
          .set({ status: "SUCCESS", announcementId, trackId, updatedAt: new Date() })
          .where(and(
            eq(announcementBulkJobTargets.jobId, job.id),
            eq(announcementBulkJobTargets.playlistId, playlist.id)
          ));

        successTargets += 1;
      } catch (error: unknown) {
        failedTargets += 1;
        await db.update(announcementBulkJobTargets)
          .set({
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Ошибка назначения для плейлиста",
            announcementId,
            trackId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(announcementBulkJobTargets.jobId, job.id),
            eq(announcementBulkJobTargets.playlistId, playlist.id)
          ));
      }
    }

    for (const location of ownedLocations) {
      const mappedPlaylistId = assignmentMap.get(location.id);
      if (!mappedPlaylistId) {
        failedTargets += 1;
        await db.update(announcementBulkJobTargets)
          .set({
            status: "FAILED",
            errorMessage: "Для филиала не назначен активный плейлист",
            announcementId,
            trackId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(announcementBulkJobTargets.jobId, job.id),
            eq(announcementBulkJobTargets.locationId, location.id)
          ));
        continue;
      }

      try {
        const latest = await db.query.playlistTracks.findMany({
          where: eq(playlistTracks.playlistId, mappedPlaylistId),
          columns: { position: true },
          orderBy: [desc(playlistTracks.position)],
          limit: 1,
        });
        const nextPosition = latest.length > 0 ? latest[0].position + 1 : 0;

        const alreadyInPlaylist = await db.query.playlistTracks.findFirst({
          where: and(eq(playlistTracks.playlistId, mappedPlaylistId), eq(playlistTracks.trackId, trackId)),
          columns: { id: true },
        });

        if (alreadyInPlaylist && conflictMode === "skip-existing") {
          await db.update(announcementBulkJobTargets)
            .set({
              status: "SUCCESS",
              playlistId: mappedPlaylistId,
              announcementId,
              trackId,
              errorMessage: "SKIPPED_EXISTING",
              updatedAt: new Date(),
            })
            .where(and(
              eq(announcementBulkJobTargets.jobId, job.id),
              eq(announcementBulkJobTargets.locationId, location.id)
            ));
          successTargets += 1;
          continue;
        }

        const inserted = await db.insert(playlistTracks)
          .values({
            playlistId: mappedPlaylistId,
            trackId,
            position: nextPosition,
          })
          .onConflictDoNothing({ target: [playlistTracks.playlistId, playlistTracks.trackId] })
          .returning({ playlistId: playlistTracks.playlistId });

        if (inserted.length > 0) {
          insertedPlaylistIds.push(mappedPlaylistId);
        }

        await db.update(announcementBulkJobTargets)
          .set({
            status: "SUCCESS",
            playlistId: mappedPlaylistId,
            announcementId,
            trackId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(announcementBulkJobTargets.jobId, job.id),
            eq(announcementBulkJobTargets.locationId, location.id)
          ));

        successTargets += 1;
      } catch (error: unknown) {
        failedTargets += 1;
        await db.update(announcementBulkJobTargets)
          .set({
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Ошибка назначения для филиала",
            announcementId,
            trackId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(announcementBulkJobTargets.jobId, job.id),
            eq(announcementBulkJobTargets.locationId, location.id)
          ));
      }
    }

    if (rollbackOnFailure && failedTargets > 0 && insertedPlaylistIds.length > 0) {
      const rollbackPlaylistIds = Array.from(new Set(insertedPlaylistIds));

      await db.delete(playlistTracks).where(and(
        eq(playlistTracks.trackId, trackId),
        inArray(playlistTracks.playlistId, rollbackPlaylistIds)
      ));

      await db.update(announcementBulkJobTargets)
        .set({
          status: "FAILED",
          errorMessage: "ROLLBACK_ON_FAILURE",
          updatedAt: new Date(),
        })
        .where(eq(announcementBulkJobTargets.jobId, job.id));

      successTargets = 0;
      failedTargets = totalTargets;
    }

    await db.update(announcementBulkJobs)
      .set({
        status: failedTargets === 0 ? "SUCCESS" : successTargets === 0 ? "FAILED" : "PARTIAL",
        successTargets,
        failedTargets,
        generatedAnnouncementId: announcementId,
        updatedAt: new Date(),
      })
      .where(eq(announcementBulkJobs.id, job.id));

    revalidatePath("/dashboard/announcements");

    return {
      success: true,
      data: {
        jobId: job.id,
        announcementId,
        trackId,
        successTargets,
        failedTargets,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить массовую генерацию";
    return { success: false, error: message };
  }
}
