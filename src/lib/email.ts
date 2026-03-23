import { Resend } from "resend";

/**
 * Email utility for sending transactional emails via Resend.
 * 
 * Configure in .env.local:
 * - RESEND_API_KEY: Your Resend API key
 * - EMAIL_FROM: Verified sender (e.g., "BizMusic <noreply@bizmuzik.ru>")
 */

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendEmailProps {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, text, html, attachments }: SendEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY not configured");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const resend = getResend();
    const payload: Record<string, unknown> = {
      from: process.env.EMAIL_FROM || "BizMusic <noreply@bizmuzik.ru>",
      to,
      subject,
    };
    if (text) payload.text = text;
    if (html) payload.html = html;
    if (attachments) payload.attachments = attachments;

    const { data, error } = await resend.emails.send(payload as never);

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Sent:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return { success: false, error };
  }
}
