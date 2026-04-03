"use server";

import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  businesses,
  supportConversations,
  supportMessages,
  users,
} from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { dispatchSupportMessage } from "@/lib/integrations/support-dispatch";

const conversationCategorySchema = z.enum(["GENERAL", "TECHNICAL", "BILLING", "LEGAL"]);

function normalizeRussianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  let normalizedDigits = digits;
  if (normalizedDigits.length === 10) {
    normalizedDigits = `7${normalizedDigits}`;
  }
  if (normalizedDigits.length === 11 && normalizedDigits.startsWith("8")) {
    normalizedDigits = `7${normalizedDigits.slice(1)}`;
  }
  if (normalizedDigits.length !== 11 || !normalizedDigits.startsWith("7")) {
    return null;
  }

  return `+7 (${normalizedDigits.slice(1, 4)}) ${normalizedDigits.slice(4, 7)}-${normalizedDigits.slice(7, 9)}-${normalizedDigits.slice(9, 11)}`;
}

const publicSupportMessageSchema = z.object({
  message: z.string().min(2, "Введите сообщение").max(3000, "Слишком длинное сообщение"),
  category: conversationCategorySchema.default("GENERAL"),
  sessionKey: z.string().min(8, "Неверный ключ сессии"),
  visitorName: z.string().max(100).optional(),
  visitorEmail: z.string().email("Некорректный email").optional().or(z.literal("")),
  visitorPhone: z
    .string()
    .trim()
    .min(1, "Укажите телефон для связи")
    .max(40)
    .transform((value) => normalizeRussianPhone(value))
    .refine((value) => value !== null, "Укажите телефон в формате +7 (999) 123-45-67")
    .transform((value) => value as string),
  subject: z.string().max(180).optional(),
});

const dashboardSupportMessageSchema = z.object({
  message: z.string().min(2, "Введите сообщение").max(3000, "Слишком длинное сообщение"),
  category: conversationCategorySchema.default("GENERAL"),
  conversationId: z.string().optional(),
});

const adminReplySchema = z.object({
  conversationId: z.string().min(10),
  message: z.string().min(2).max(3000),
});

const updateStatusSchema = z.object({
  conversationId: z.string().min(10),
  status: z.enum(["OPEN", "PENDING", "CLOSED"]),
});

const assignConversationSchema = z.object({
  conversationId: z.string().min(10),
  assignedToUserId: z.string().min(10).nullable(),
});

const publicMessageRateLimitMap = new Map<string, number[]>();
const PUBLIC_MESSAGE_LIMIT = 5;
const PUBLIC_MESSAGE_WINDOW_MS = 10 * 60 * 1000;

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function assertAdminUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const role = await getUserRole(user.id);
  if (role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  return { ok: true as const, userId: user.id };
}

async function getUserRole(userId: string): Promise<string | null> {
  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return dbUser?.role ?? null;
}

async function getBusinessIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .limit(1);

  return row?.id ?? null;
}

async function getBusinessContactDetails(userId: string): Promise<{ id: string; phone: string | null } | null> {
  const [row] = await db
    .select({ id: businesses.id, phone: businesses.phone })
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .limit(1);

  return row ?? null;
}

async function findRecentOpenConversationForUser(userId: string) {
  return db.query.supportConversations.findFirst({
    where: and(
      eq(supportConversations.userId, userId),
      inArray(supportConversations.status, ["OPEN", "PENDING"]),
    ),
    orderBy: [desc(supportConversations.updatedAt)],
  });
}

async function findRecentOpenConversationForSession(sessionKey: string) {
  return db.query.supportConversations.findFirst({
    where: and(
      eq(supportConversations.publicSessionKey, sessionKey),
      inArray(supportConversations.status, ["OPEN", "PENDING"]),
    ),
    orderBy: [desc(supportConversations.updatedAt)],
  });
}

async function createMessageAndDispatch(params: {
  conversationId: string;
  userId?: string | null;
  businessId?: string | null;
  category: "GENERAL" | "TECHNICAL" | "BILLING" | "LEGAL";
  source: "PUBLIC_WIDGET" | "DASHBOARD";
  body: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
}) {
  const [newMessage] = await db
    .insert(supportMessages)
    .values({
      conversationId: params.conversationId,
      senderUserId: params.userId,
      direction: "USER",
      source: params.source,
      body: params.body,
    })
    .returning({ id: supportMessages.id, createdAt: supportMessages.createdAt });

  await db
    .update(supportConversations)
    .set({
      lastMessageAt: new Date(),
      updatedAt: new Date(),
      status: "OPEN",
    })
    .where(eq(supportConversations.id, params.conversationId));

  await dispatchSupportMessage({
    messageId: newMessage.id,
    conversationId: params.conversationId,
    category: params.category,
    messageBody: params.body,
    visitorName: params.visitorName,
    visitorEmail: params.visitorEmail,
    visitorPhone: params.visitorPhone,
    userId: params.userId,
    businessId: params.businessId,
    createdAt: newMessage.createdAt,
  });

  return newMessage.id;
}

export async function createPublicSupportMessageAction(rawInput: z.infer<typeof publicSupportMessageSchema>) {
  try {
    const input = publicSupportMessageSchema.parse(rawInput);

    const now = Date.now();
    const timestamps = publicMessageRateLimitMap.get(input.sessionKey) ?? [];
    const recent = timestamps.filter((timestamp) => now - timestamp < PUBLIC_MESSAGE_WINDOW_MS);
    if (recent.length >= PUBLIC_MESSAGE_LIMIT) {
      return {
        success: false,
        error: `Слишком много сообщений. Лимит: ${PUBLIC_MESSAGE_LIMIT} за 10 минут.`,
      };
    }
    publicMessageRateLimitMap.set(input.sessionKey, [...recent, now]);

    const existingConversation = await findRecentOpenConversationForSession(input.sessionKey);
    let conversationId: string;

    if (!existingConversation) {
      const [created] = await db
        .insert(supportConversations)
        .values({
          publicSessionKey: input.sessionKey,
          visitorName: input.visitorName || null,
          visitorEmail: input.visitorEmail || null,
          visitorPhone: input.visitorPhone || null,
          subject: input.subject || null,
          category: input.category,
          status: "OPEN",
        })
        .returning({ id: supportConversations.id });

      conversationId = created.id;
    } else {
      conversationId = existingConversation.id;
      await db
        .update(supportConversations)
        .set({
          visitorName: input.visitorName || existingConversation.visitorName,
          visitorEmail: input.visitorEmail || existingConversation.visitorEmail,
          visitorPhone: input.visitorPhone || existingConversation.visitorPhone,
          subject: input.subject || existingConversation.subject,
          category: input.category,
          updatedAt: new Date(),
        })
        .where(eq(supportConversations.id, existingConversation.id));
    }

    await createMessageAndDispatch({
      conversationId,
      category: input.category,
      source: "PUBLIC_WIDGET",
      body: input.message,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail || null,
      visitorPhone: input.visitorPhone || null,
    });

    return { success: true, conversationId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Ошибка валидации" };
    }
    console.error("createPublicSupportMessageAction error", error);
    return { success: false, error: "Не удалось отправить сообщение" };
  }
}

export async function createDashboardSupportMessageAction(rawInput: z.infer<typeof dashboardSupportMessageSchema>) {
  try {
    const input = dashboardSupportMessageSchema.parse(rawInput);
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const business = await getBusinessContactDetails(user.id);
    const businessId = business?.id ?? null;
    let conversationId = input.conversationId;

    if (!conversationId) {
      const existing = await findRecentOpenConversationForUser(user.id);
      if (existing) {
        conversationId = existing.id;
      }
    }

    if (!conversationId) {
      const [created] = await db
        .insert(supportConversations)
        .values({
          userId: user.id,
          businessId,
          category: input.category,
          status: "OPEN",
        })
        .returning({ id: supportConversations.id });
      conversationId = created.id;
    }

    await createMessageAndDispatch({
      conversationId,
      userId: user.id,
      businessId,
      category: input.category,
      source: "DASHBOARD",
      body: input.message,
      visitorName: user.user_metadata?.name || null,
      visitorEmail: user.email || null,
      visitorPhone: business?.phone || null,
    });

    return { success: true, conversationId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Ошибка валидации" };
    }
    console.error("createDashboardSupportMessageAction error", error);
    return { success: false, error: "Не удалось отправить сообщение" };
  }
}

export async function getMySupportConversationAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const conversation = await findRecentOpenConversationForUser(user.id);
  if (!conversation) {
    return { success: true, data: { conversation: null, messages: [] } };
  }

  const messages = await db.query.supportMessages.findMany({
    where: and(
      eq(supportMessages.conversationId, conversation.id),
      eq(supportMessages.isInternal, false),
    ),
    orderBy: [supportMessages.createdAt],
  });

  return { success: true, data: { conversation, messages } };
}

export async function getAdminSupportInboxAction(params?: {
  status?: "OPEN" | "PENDING" | "CLOSED";
  category?: "GENERAL" | "TECHNICAL" | "BILLING" | "LEGAL";
  assignedToUserId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const adminCheck = await assertAdminUser();
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  const baseFilters: SQL<unknown>[] = [];
  if (params && "category" in params && params.category) {
    baseFilters.push(eq(supportConversations.category, params.category));
  }
  if (params && "assignedToUserId" in params && params.assignedToUserId) {
    baseFilters.push(eq(supportConversations.assignedToUserId, params.assignedToUserId));
  }

  if (params?.q && params.q.trim().length > 0) {
    const q = `%${params.q.trim()}%`;
    baseFilters.push(
      or(
        ilike(supportConversations.id, q),
        ilike(supportConversations.subject, q),
        ilike(supportConversations.visitorEmail, q),
        ilike(supportConversations.visitorName, q),
        ilike(supportConversations.userId, q),
      )!,
    );
  }

  const scopedWhere = baseFilters.length > 0 ? and(...baseFilters) : undefined;
  const statusWhere = params?.status
    ? scopedWhere
      ? and(scopedWhere, eq(supportConversations.status, params.status))
      : eq(supportConversations.status, params.status)
    : scopedWhere;

  const pageSize = Math.min(100, Math.max(10, params?.pageSize ?? 25));
  const page = Math.max(1, params?.page ?? 1);
  const offset = (page - 1) * pageSize;

  const [totalRow, openRow, pendingRow, closedRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(supportConversations)
      .where(statusWhere)
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)` })
      .from(supportConversations)
      .where(scopedWhere ? and(scopedWhere, eq(supportConversations.status, "OPEN")) : eq(supportConversations.status, "OPEN"))
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)` })
      .from(supportConversations)
      .where(scopedWhere ? and(scopedWhere, eq(supportConversations.status, "PENDING")) : eq(supportConversations.status, "PENDING"))
      .then((rows) => rows[0]),
    db
      .select({ count: sql<number>`count(*)` })
      .from(supportConversations)
      .where(scopedWhere ? and(scopedWhere, eq(supportConversations.status, "CLOSED")) : eq(supportConversations.status, "CLOSED"))
      .then((rows) => rows[0]),
  ]);

  const conversations = await db.query.supportConversations.findMany({
    where: statusWhere,
    orderBy: [desc(supportConversations.lastMessageAt)],
    limit: pageSize,
    offset,
  });

  const total = Number(totalRow?.count || 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return {
    success: true,
    data: {
      items: conversations,
      total,
      page,
      pageSize,
      pages,
      counters: {
        open: Number(openRow?.count || 0),
        pending: Number(pendingRow?.count || 0),
        closed: Number(closedRow?.count || 0),
      },
    },
  };
}

export async function getAdminSupportConversationAction(conversationId: string) {
  const adminCheck = await assertAdminUser();
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  const conversation = await db.query.supportConversations.findFirst({
    where: eq(supportConversations.id, conversationId),
  });

  if (!conversation) {
    return { success: false, error: "Диалог не найден" };
  }

  const messages = await db.query.supportMessages.findMany({
    where: eq(supportMessages.conversationId, conversationId),
    orderBy: [supportMessages.createdAt],
  });

  return { success: true, data: { conversation, messages } };
}

export async function createAdminSupportReplyAction(rawInput: z.infer<typeof adminReplySchema>) {
  try {
    const input = adminReplySchema.parse(rawInput);
    const adminCheck = await assertAdminUser();
    if (!adminCheck.ok) {
      return { success: false, error: adminCheck.error };
    }

    const conversation = await db.query.supportConversations.findFirst({
      where: eq(supportConversations.id, input.conversationId),
    });

    if (!conversation) {
      return { success: false, error: "Диалог не найден" };
    }

    await db.insert(supportMessages).values({
      conversationId: input.conversationId,
      senderUserId: adminCheck.userId,
      direction: "SUPPORT",
      source: "ADMIN",
      body: input.message,
    });

    await db
      .update(supportConversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        status: "PENDING",
      })
      .where(eq(supportConversations.id, input.conversationId));

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Ошибка валидации" };
    }
    console.error("createAdminSupportReplyAction error", error);
    return { success: false, error: "Не удалось отправить ответ" };
  }
}

export async function getAdminSupportAssigneesAction() {
  const adminCheck = await assertAdminUser();
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "ADMIN"));

  return { success: true, data: rows };
}

export async function updateSupportConversationStatusAction(rawInput: z.infer<typeof updateStatusSchema>) {
  try {
    const input = updateStatusSchema.parse(rawInput);
    const adminCheck = await assertAdminUser();
    if (!adminCheck.ok) {
      return { success: false, error: adminCheck.error };
    }

    await db
      .update(supportConversations)
      .set({
        status: input.status,
        closedAt: input.status === "CLOSED" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(supportConversations.id, input.conversationId));

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Ошибка валидации" };
    }
    console.error("updateSupportConversationStatusAction error", error);
    return { success: false, error: "Не удалось обновить статус" };
  }
}

export async function assignSupportConversationAction(rawInput: z.infer<typeof assignConversationSchema>) {
  try {
    const input = assignConversationSchema.parse(rawInput);
    const adminCheck = await assertAdminUser();
    if (!adminCheck.ok) {
      return { success: false, error: adminCheck.error };
    }

    await db
      .update(supportConversations)
      .set({
        assignedToUserId: input.assignedToUserId,
        updatedAt: new Date(),
      })
      .where(eq(supportConversations.id, input.conversationId));

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Ошибка валидации" };
    }
    console.error("assignSupportConversationAction error", error);
    return { success: false, error: "Не удалось назначить ответственного" };
  }
}

/**
 * Lightweight badge count for the admin sidebar.
 * Returns the number of OPEN + PENDING conversations.
 */
export async function getAdminSupportBadgeCountAction() {
  const adminCheck = await assertAdminUser();
  if (!adminCheck.ok) return { success: false as const, count: 0 };

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportConversations)
    .where(inArray(supportConversations.status, ["OPEN", "PENDING"]));

  return { success: true as const, count: Number(row?.count || 0) };
}

/**
 * Lightweight check for the dashboard support link.
 * Returns true if the current user's active conversation has an unread admin reply.
 */
export async function getMyUnreadSupportReplyAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, hasUnread: false };

  const conversation = await findRecentOpenConversationForUser(user.id);
  if (!conversation) return { success: true as const, hasUnread: false };

  const reply = await db.query.supportMessages.findFirst({
    where: and(
      eq(supportMessages.conversationId, conversation.id),
      eq(supportMessages.direction, "SUPPORT"),
      eq(supportMessages.isInternal, false),
    ),
  });

  return { success: true as const, hasUnread: !!reply };
}
