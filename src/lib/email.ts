import "server-only";

/**
 * Transactional email via UniSender Go (RF provider, keeps PII in Russia).
 * Inbound replies are still handled by Mailgun routes on mg.bizmuzik.ru.
 *
 * Env:
 * - UNISENDER_GO_API_KEY
 * - UNISENDER_GO_API_URL (optional; account may live on go2.unisender.ru)
 * - EMAIL_FROM, e.g. "BizMuzik <noreply@bizmuzik.ru>" (domain must be verified in UniSender Go)
 */

const API_URL =
  process.env.UNISENDER_GO_API_URL ||
  "https://go1.unisender.ru/ru/transactional/api/v1/email/send.json";

const DEFAULT_FROM = "BizMuzik <noreply@bizmuzik.ru>";

interface SendEmailProps {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  /** "Name <email>" or bare email; defaults to EMAIL_FROM */
  from?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export type SendEmailResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

interface UniSenderGoResponse {
  status: "success" | "error";
  job_id?: string;
  message?: string;
  code?: number;
  failed_emails?: Record<string, string>;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  mp3: "audio/mpeg",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function parseAddress(address: string): { email: string; name?: string } {
  const match = address.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].replace(/^"|"$/g, "") || undefined, email: match[2].trim() };
  return { email: address.trim() };
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
  attachments,
}: SendEmailProps): Promise<SendEmailResult> {
  const apiKey = process.env.UNISENDER_GO_API_KEY;
  if (!apiKey) {
    console.error("[Email] UNISENDER_GO_API_KEY not configured");
    return { success: false, error: "Email provider not configured" };
  }

  const sender = parseAddress(from || process.env.EMAIL_FROM || DEFAULT_FROM);
  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

  const message: Record<string, unknown> = {
    recipients,
    subject,
    from_email: sender.email,
    body: {
      ...(html ? { html } : {}),
      ...(text ? { plaintext: text } : {}),
    },
  };
  if (sender.name) message.from_name = sender.name;
  if (replyTo) message.reply_to = replyTo;
  if (attachments?.length) {
    message.attachments = attachments.map((a) => ({
      type:
        a.contentType ||
        MIME_BY_EXT[a.filename.split(".").pop()?.toLowerCase() ?? ""] ||
        "application/octet-stream",
      name: a.filename,
      content: a.content.toString("base64"),
    }));
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await response.json().catch(() => null)) as UniSenderGoResponse | null;

    if (!response.ok || data?.status !== "success") {
      const error = data?.message || `HTTP ${response.status}`;
      console.error("[Email] UniSender Go error:", error, data?.failed_emails ?? "");
      return { success: false, error };
    }

    if (data.failed_emails && Object.keys(data.failed_emails).length > 0) {
      console.warn("[Email] UniSender Go rejected recipients:", data.failed_emails);
    }

    console.log("[Email] Sent:", data.job_id);
    return { success: true, messageId: data.job_id };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
