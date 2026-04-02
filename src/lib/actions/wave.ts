"use server";

import { db } from "@/db";
import { waveSettings, tracks, trackSkips } from "@/db/schema";
import { eq, and, not, sql, inArray } from "drizzle-orm";
import { getDownloadSignedUrl, getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";

async function canUseBusinessWave(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const scope = await resolveAccessScope(user.id);
  if (!scope) return false;
  if (scope.role === "ADMIN") return true;
  return scope.businessId === businessId;
}

export async function getWaveSettingsAction(businessId: string) {
  try {
    if (!(await canUseBusinessWave(businessId))) {
      return { success: false, error: "Недостаточно прав" };
    }

    const settings = await db.query.waveSettings.findFirst({
      where: eq(waveSettings.businessId, businessId),
    });

    if (!settings) {
      const [newSettings] = await db.insert(waveSettings)
        .values({
          businessId,
          energyPreference: 5,
          vocalPreference: "both",
          focusProfile: "none",
        })
        .returning();
      return { success: true, settings: newSettings };
    }

    return { success: true, settings };
  } catch (error: any) {
    console.error("Failed to fetch wave settings:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWaveSettingsAction(
  businessId: string,
  data: { energyPreference?: number; vocalPreference?: string; focusProfile?: string }
) {
  try {
    if (!(await canUseBusinessWave(businessId))) {
      return { success: false, error: "Недостаточно прав" };
    }

    const [updated] = await db.update(waveSettings)
      .set({
        ...data,
      })
      .where(eq(waveSettings.businessId, businessId))
      .returning();

    return { success: true, settings: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateWaveBatchAction(businessId: string, excludeTrackIds: string[] = []) {
  try {
    if (!(await canUseBusinessWave(businessId))) {
      return { success: false, error: "Недостаточно прав" };
    }

    // 1. Get settings
    const settingsRes = await getWaveSettingsAction(businessId);
    if (!settingsRes.success || !settingsRes.settings) {
      return { success: false, error: "Settings not found" };
    }
    const settings = settingsRes.settings;

    // 2. Fetch tracks the business skipped recently (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentSkips = await db.query.trackSkips.findMany({
      where: and(
        eq(trackSkips.businessId, businessId),
        sql`${trackSkips.skippedAt} > ${twentyFourHoursAgo.toISOString()}::timestamp`
      ),
      columns: { trackId: true },
    });
    
    // 3. Build hard constraints
    const skipTrackIds = recentSkips.map(s => s.trackId);
    const allExclusions = [...excludeTrackIds, ...skipTrackIds];

    let queryConditions = [
      eq(tracks.isAnnouncement, false)
    ];

    if (allExclusions.length > 0) {
      queryConditions.push(not(inArray(tracks.id, allExclusions)));
    }

    if (settings.vocalPreference === "vocal") {
      queryConditions.push(sql`${tracks.vocalType} != 'Instrumental'`);
    } else if (settings.vocalPreference === "instrumental") {
      queryConditions.push(eq(tracks.vocalType, "Instrumental"));
    }

    // Focus profile mappings to timeSuitability
    if (settings.focusProfile === "morning_coffee") {
      queryConditions.push(sql`'Morning' = ANY(${tracks.timeSuitability})`);
    } else if (settings.focusProfile === "evening_lounge") {
      queryConditions.push(sql`'Evening' = ANY(${tracks.timeSuitability})`);
    } else if (settings.focusProfile === "lunch_rush") {
      queryConditions.push(sql`'Day' = ANY(${tracks.timeSuitability})`);
    }

    // 4. Fetch the batch with soft constraint ordering
    const batch = await db.query.tracks.findMany({
      where: and(...queryConditions),
      orderBy: (tracks) => [
        sql`ABS(COALESCE(${tracks.energyLevel}, 5) - ${settings.energyPreference}) ASC`,
        sql`RANDOM()`
      ],
      limit: 20,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Map URLs properly
    const mappedTracks = await Promise.all(
      batch.map(async (track) => {
        const isFullUrl = track.fileUrl.startsWith('http');
        const fileRef = parseStorageObjectRef(track.fileUrl, "tracks");
        
        const fallbackUrl = isFullUrl
          ? track.fileUrl 
          : (supabaseUrl ? getFilePublicUrl(fileRef.fileName, fileRef.folder) : `/uploads/${fileRef.fileName}`);

        let streamUrl: string | undefined = undefined;
        try {
          if (!isFullUrl && supabaseUrl) {
            streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
          }
        } catch (err) {
          console.error(`Failed to sign URL for wave track ${track.id}:`, err);
        }

        return {
          ...track,
          fileUrl: fallbackUrl,
          streamUrl,
        };
      })
    );

    return { success: true, tracks: mappedTracks };
  } catch (error: any) {
    console.error("Failed to generate wave batch:", error);
    return { success: false, error: error.message };
  }
}
