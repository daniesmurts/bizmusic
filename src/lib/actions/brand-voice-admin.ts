"use server";

import { db } from "@/db";
import {
  brandVoiceModels,
  brandVoiceUsageEvents,
  businesses,
  users,
} from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";
import { getDownloadSignedUrl, parseStorageObjectRef } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// Auth guard — admin only
// ---------------------------------------------------------------------------

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return dbUser;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function adminGetBrandVoiceStatsAction() {
  try {
    await requireAdminUser();

    const [totalModels] = await db
      .select({ value: count() })
      .from(brandVoiceModels);

    const allModels = await db
      .select({ status: brandVoiceModels.status })
      .from(brandVoiceModels);

    const byStatus: Record<string, number> = {};
    for (const row of allModels) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    }

    const [totalEvents] = await db
      .select({ value: count() })
      .from(brandVoiceUsageEvents);

    return {
      success: true,
      data: {
        total: totalModels.value,
        byStatus,
        totalSynthesisEvents: totalEvents.value,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка" };
  }
}

// ---------------------------------------------------------------------------
// All models with relations
// ---------------------------------------------------------------------------

export async function adminGetAllBrandVoiceModelsAction() {
  try {
    await requireAdminUser();

    const models = await db.query.brandVoiceModels.findMany({
      orderBy: [desc(brandVoiceModels.createdAt)],
      with: {
        business: {
          columns: {
            id: true,
            legalName: true,
            inn: true,
          },
        },
        actor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            consentAcceptedAt: true,
            consentRevokedAt: true,
          },
          with: {
            samples: {
              columns: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileSizeBytes: true,
                durationSeconds: true,
                approvalStatus: true,
                uploadedAt: true,
              },
              orderBy: (s, { desc: d }) => [d(s.uploadedAt)],
            },
          },
        },
      },
    });

    const modelsWithSignedSampleUrls = await Promise.all(
      models.map(async (model) => {
        if (!model.actor?.samples?.length) {
          return model;
        }

        const signedSamples = await Promise.all(
          model.actor.samples.map(async (sample) => {
            try {
              const ref = parseStorageObjectRef(sample.fileUrl, "brand-voice-samples");
              const signedUrl = await getDownloadSignedUrl(ref.fileName, ref.folder, 60 * 60);
              return { ...sample, fileUrl: signedUrl };
            } catch {
              return sample;
            }
          }),
        );

        return {
          ...model,
          actor: {
            ...model.actor,
            samples: signedSamples,
          },
        };
      }),
    );

    return { success: true, data: modelsWithSignedSampleUrls };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка" };
  }
}

// ---------------------------------------------------------------------------
// Attach Yandex model URI (admin activates the model after training)
// ---------------------------------------------------------------------------

export async function adminAttachYandexModelUriAction(
  modelId: string,
  providerModelId: string
) {
  try {
    await requireAdminUser();

    const normalizedUri = providerModelId.trim();

    if (!normalizedUri) {
      return { success: false, error: "Укажите model URI Yandex SpeechKit" };
    }

    if (!normalizedUri.startsWith("tts://")) {
      return { success: false, error: "Model URI должен начинаться с tts://" };
    }

    const model = await db.query.brandVoiceModels.findFirst({
      where: eq(brandVoiceModels.id, modelId),
      with: { actor: true },
    });

    if (!model) {
      return { success: false, error: "Модель не найдена" };
    }

    if (!model.actor.consentAcceptedAt || model.actor.consentRevokedAt) {
      return { success: false, error: "Нет действующего согласия диктора" };
    }

    const [updated] = await db
      .update(brandVoiceModels)
      .set({
        provider: "yandex",
        providerModelId: normalizedUri,
        providerJobId: null,
        status: "READY",
        consentCheckedAt: new Date(),
        trainingStartedAt: model.trainingStartedAt ?? new Date(),
        trainingCompletedAt: new Date(),
        estimatedCompletionAt: null,
        errorMessage: null,
      })
      .where(eq(brandVoiceModels.id, modelId))
      .returning();

    // Уведомить владельца бизнеса о готовности модели
    try {
      const businessWithUser = await db.query.businesses.findFirst({
        where: eq(businesses.id, model.businessId),
        columns: { legalName: true },
        with: { user: { columns: { email: true } } },
      });
      if (businessWithUser?.user?.email) {
        sendEmail({
          to: businessWithUser.user.email,
          subject: "Голосовая модель готова — Бизнес Музыка",
          html: buildModelReadyEmail(
            businessWithUser.legalName ?? "Ваш бизнес",
            model.actor.fullName,
          ),
        }).catch(() => {});
      }
    } catch {}

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка" };
  }
}

// ---------------------------------------------------------------------------
// Manual status override
// ---------------------------------------------------------------------------

export async function adminUpdateBrandVoiceModelStatusAction(
  modelId: string,
  status: string,
  errorMessage?: string
) {
  try {
    await requireAdminUser();

    const allowedStatuses = [
      "PENDING",
      "CONSENT_PENDING",
      "SAMPLES_PENDING",
      "TRAINING",
      "READY",
      "FAILED",
      "REVOKED",
    ];

    if (!allowedStatuses.includes(status)) {
      return { success: false, error: "Недопустимый статус" };
    }

    const [updated] = await db
      .update(brandVoiceModels)
      .set({
        status,
        errorMessage: errorMessage ?? null,
      })
      .where(eq(brandVoiceModels.id, modelId))
      .returning();

    if (!updated) {
      return { success: false, error: "Модель не найдена" };
    }

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка" };
  }
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

function buildModelReadyEmail(companyName: string, actorName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#0f1117;padding:32px 40px;border-radius:16px 16px 0 0;">
        <h1 style="color:#00e676;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">
          🎙️ Голосовая модель готова!
        </h1>
      </div>
      <div style="padding:32px 40px;background:#f9f9fb;border-radius:0 0 16px 16px;">
        <p style="font-size:16px;color:#1a1a2e;margin-top:0;">
          Здравствуйте, <strong>${companyName}</strong>!
        </p>
        <p style="color:#4a4a6a;">
          Обучение голосовой модели на основе записей диктора
          <strong>${actorName}</strong> успешно завершено.
        </p>
        <p style="color:#4a4a6a;">
          Теперь вы можете создавать голосовые анонсы с персональным голосом в разделе
          <strong>Анонсы → Brand Voice</strong>.
        </p>
        <div style="margin:32px 0;">
          <a href="${appUrl}/dashboard/announcements"
             style="display:inline-block;background:#00e676;color:#000;padding:14px 32px;
                    border-radius:12px;font-weight:900;text-decoration:none;
                    font-size:14px;letter-spacing:0.5px;text-transform:uppercase;">
            Создать анонс →
          </a>
        </div>
        <p style="font-size:12px;color:#9999b0;margin-bottom:0;">
          Если у вас возникли вопросы, напишите на
          <a href="mailto:support@bizmuzik.ru" style="color:#00e676;">support@bizmuzik.ru</a>
        </p>
      </div>
    </div>
  `.trim();
}
