import { and, asc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  supportDeliveryProviderEnum,
  supportConversations,
  supportDeliveryStatusEnum,
  supportMessageDeliveries,
  supportMessages,
  supportCategoryEnum,
} from "@/db/schema";

type SupportCategory = (typeof supportCategoryEnum.enumValues)[number];

type DispatchInput = {
  messageId: string;
  conversationId: string;
  category: SupportCategory;
  messageBody: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  userId?: string | null;
  businessId?: string | null;
  createdAt: Date;
};

type SupportDeliveryProvider = (typeof supportDeliveryProviderEnum.enumValues)[number];
type SupportDeliveryStatus = (typeof supportDeliveryStatusEnum.enumValues)[number];

type DeliveryResult = {
  success: boolean;
  externalId?: string;
  error?: string;
};

const REQUEST_TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;
const MAX_DELIVERY_ATTEMPTS = 8;

function isBitrixEnabled(): boolean {
  return Boolean(process.env.BITRIX24_WEBHOOK_URL);
}

function routeSuffix(category: SupportCategory): string {
  switch (category) {
    case "TECHNICAL":
      return "TECHNICAL";
    case "BILLING":
      return "BILLING";
    case "LEGAL":
      return "LEGAL";
    default:
      return "GENERAL";
  }
}

function envForCategory(base: string, category: SupportCategory): string | undefined {
  const suffix = routeSuffix(category);
  return process.env[`${base}_${suffix}`] || process.env[base];
}

function formatTelegramMessage(input: DispatchInput): string {
  const safeBody = input.messageBody.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    "<b>Новое обращение в поддержку</b>",
    `<b>Категория:</b> ${input.category}`,
    `<b>ID диалога:</b> ${input.conversationId}`,
    input.userId ? `<b>User ID:</b> ${input.userId}` : "<b>Источник:</b> Публичная страница",
    input.businessId ? `<b>Business ID:</b> ${input.businessId}` : "",
    input.visitorName ? `<b>Имя:</b> ${input.visitorName}` : "",
    input.visitorEmail ? `<b>Email:</b> ${input.visitorEmail}` : "",
      input.visitorPhone ? `<b>Телефон:</b> ${input.visitorPhone}` : "",
    "",
    safeBody,
  ].filter(Boolean).join("\n");
}

function normalizeBitrixWebhookUrl(url: string, method: string): string {
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith(".json")) {
    return trimmed;
  }
  return `${trimmed}/${method}.json`;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) {
        break;
      }
      const backoff = 300 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}

async function writeDeliveryLog(params: {
  messageId: string;
  provider: SupportDeliveryProvider;
  target: string;
  status: Exclude<SupportDeliveryStatus, "PENDING">;
  externalId?: string;
  error?: string;
}): Promise<void> {
  await db
    .insert(supportMessageDeliveries)
    .values({
      messageId: params.messageId,
      provider: params.provider,
      status: params.status,
      target: params.target,
      externalId: params.externalId,
      attemptCount: 1,
      lastError: params.error,
      lastAttemptAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [supportMessageDeliveries.messageId, supportMessageDeliveries.provider, supportMessageDeliveries.target],
      set: {
        status: params.status,
        externalId: params.externalId,
        attemptCount: sql`${supportMessageDeliveries.attemptCount} + 1`,
        lastError: params.error,
        lastAttemptAt: new Date(),
      },
    });
}

async function sendToTelegram(input: DispatchInput): Promise<DeliveryResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = envForCategory("TELEGRAM_SUPPORT_CHAT_ID", input.category);
  const topicId = envForCategory("TELEGRAM_SUPPORT_TOPIC_ID", input.category);

  if (!token || !chatId) {
    return { success: false, error: "telegram_not_configured" };
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: formatTelegramMessage(input),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (topicId) {
    payload.message_thread_id = Number(topicId);
  }

  try {
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`telegram_http_${res.status}`);
        }
        return res;
      } finally {
        clearTimeout(timeout);
      }
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || "telegram_api_error");
    }

    return { success: true, externalId: String(data.result?.message_id || "") };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "telegram_send_failed" };
  }
}

async function sendToTelegramWithTarget(input: DispatchInput, chatId: string): Promise<DeliveryResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    return { success: false, error: "telegram_not_configured" };
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: formatTelegramMessage(input),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  try {
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`telegram_http_${res.status}`);
        }
        return res;
      } finally {
        clearTimeout(timeout);
      }
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || "telegram_api_error");
    }

    return { success: true, externalId: String(data.result?.message_id || "") };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "telegram_send_failed" };
  }
}

async function createBitrixTask(input: DispatchInput): Promise<DeliveryResult> {
  const webhook = process.env.BITRIX24_WEBHOOK_URL;
  if (!webhook) {
    return { success: false, error: "bitrix_not_configured" };
  }

  const groupId = envForCategory("BITRIX24_TASK_GROUP_ID", input.category);
  const responsibleId = envForCategory("BITRIX24_RESPONSIBLE_ID", input.category) || process.env.BITRIX24_RESPONSIBLE_ID;

  const conversation = await db.query.supportConversations.findFirst({
    where: eq(supportConversations.id, input.conversationId),
    columns: { bitrixTaskId: true },
  });

  const description = [
    `Сообщение: ${input.messageBody}`,
    input.visitorName ? `Имя: ${input.visitorName}` : "",
    input.visitorEmail ? `Email: ${input.visitorEmail}` : "",
    input.visitorPhone ? `Телефон: ${input.visitorPhone}` : "",
    input.userId ? `User ID: ${input.userId}` : "",
    input.businessId ? `Business ID: ${input.businessId}` : "",
  ].filter(Boolean).join("\n");

  if (conversation?.bitrixTaskId) {
    try {
      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const res = await fetch(normalizeBitrixWebhookUrl(webhook, "task.commentitem.add"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              TASKID: Number(conversation.bitrixTaskId),
              FIELDS: {
                POST_MESSAGE: description,
              },
            }),
            signal: controller.signal,
          });
          if (!res.ok) {
            throw new Error(`bitrix_http_${res.status}`);
          }
          return res;
        } finally {
          clearTimeout(timeout);
        }
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error_description || data.error || "bitrix_api_error");
      }

      const commentId = String(data.result || "");
      return { success: true, externalId: `comment:${commentId}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "bitrix_comment_failed" };
    }
  }

  const fields: Record<string, unknown> = {
    TITLE: `Поддержка: ${input.category} / ${input.conversationId}`,
    DESCRIPTION: description,
  };

  if (groupId) {
    fields.GROUP_ID = Number(groupId);
  }
  if (responsibleId) {
    fields.RESPONSIBLE_ID = Number(responsibleId);
  }

  try {
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(normalizeBitrixWebhookUrl(webhook, "tasks.task.add"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`bitrix_http_${res.status}`);
        }
        return res;
      } finally {
        clearTimeout(timeout);
      }
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error || "bitrix_api_error");
    }

    const taskId = String(data.result?.task?.id || data.result || "");
    if (taskId) {
      await db
        .update(supportConversations)
        .set({ bitrixTaskId: taskId, updatedAt: new Date() })
        .where(eq(supportConversations.id, input.conversationId));
    }

    return { success: true, externalId: taskId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "bitrix_send_failed" };
  }
}

export async function dispatchSupportMessage(input: DispatchInput): Promise<void> {
  const telegramPromise = sendToTelegram(input);
  const bitrixPromise = isBitrixEnabled() ? createBitrixTask(input) : Promise.resolve<DeliveryResult | null>(null);
  const [telegramResult, bitrixResult] = await Promise.all([telegramPromise, bitrixPromise]);

  const telegramTarget = envForCategory("TELEGRAM_SUPPORT_CHAT_ID", input.category) || "not_configured";
  await writeDeliveryLog({
    messageId: input.messageId,
    provider: "TELEGRAM",
    target: telegramTarget,
    status: telegramResult.success ? "SENT" : "FAILED",
    externalId: telegramResult.externalId,
    error: telegramResult.error,
  });

  if (bitrixResult) {
    const bitrixTarget = envForCategory("BITRIX24_TASK_GROUP_ID", input.category) || "default";
    await writeDeliveryLog({
      messageId: input.messageId,
      provider: "BITRIX24",
      target: bitrixTarget,
      status: bitrixResult.success ? "SENT" : "FAILED",
      externalId: bitrixResult.externalId,
      error: bitrixResult.error,
    });
  }
}

type RetryCandidate = {
  deliveryId: string;
  provider: SupportDeliveryProvider;
  target: string;
  attemptCount: number;
  messageId: string;
  conversationId: string;
  category: SupportCategory;
  body: string;
  senderUserId: string | null;
  businessId: string | null;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  createdAt: Date;
};

async function loadRetryCandidates(limit: number): Promise<RetryCandidate[]> {
  const filters = [
    eq(supportMessageDeliveries.status, "FAILED"),
    lt(supportMessageDeliveries.attemptCount, MAX_DELIVERY_ATTEMPTS),
  ];

  if (!isBitrixEnabled()) {
    filters.push(sql`${supportMessageDeliveries.provider} <> 'BITRIX24'`);
  }

  const rows = await db
    .select({
      deliveryId: supportMessageDeliveries.id,
      provider: supportMessageDeliveries.provider,
      target: supportMessageDeliveries.target,
      attemptCount: supportMessageDeliveries.attemptCount,
      messageId: supportMessages.id,
      conversationId: supportConversations.id,
      category: supportConversations.category,
      body: supportMessages.body,
      senderUserId: supportMessages.senderUserId,
      businessId: supportConversations.businessId,
      visitorName: supportConversations.visitorName,
      visitorEmail: supportConversations.visitorEmail,
      visitorPhone: supportConversations.visitorPhone,
      createdAt: supportMessages.createdAt,
    })
    .from(supportMessageDeliveries)
    .innerJoin(supportMessages, eq(supportMessages.id, supportMessageDeliveries.messageId))
    .innerJoin(supportConversations, eq(supportConversations.id, supportMessages.conversationId))
    .where(and(...filters))
    .orderBy(asc(supportMessageDeliveries.updatedAt))
    .limit(limit);

  return rows;
}

async function retryOneDelivery(candidate: RetryCandidate): Promise<boolean> {
  const input: DispatchInput = {
    messageId: candidate.messageId,
    conversationId: candidate.conversationId,
    category: candidate.category,
    messageBody: candidate.body,
    visitorName: candidate.visitorName,
    visitorEmail: candidate.visitorEmail,
    userId: candidate.senderUserId,
    businessId: candidate.businessId,
    createdAt: candidate.createdAt,
  };

  let result: DeliveryResult;
  if (candidate.provider === "TELEGRAM") {
    result = await sendToTelegramWithTarget(input, candidate.target);
  } else {
    result = await createBitrixTask(input);
  }

  await db
    .update(supportMessageDeliveries)
    .set({
      status: result.success ? "SENT" : "FAILED",
      externalId: result.externalId,
      attemptCount: candidate.attemptCount + 1,
      lastError: result.error,
      lastAttemptAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(supportMessageDeliveries.id, candidate.deliveryId));

  return result.success;
}

export async function retryFailedSupportDeliveries(limit = 30) {
  const candidates = await loadRetryCandidates(limit);
  let sent = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const ok = await retryOneDelivery(candidate);
    if (ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    scanned: candidates.length,
    sent,
    failed,
  };
}
