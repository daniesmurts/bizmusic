import crypto from "node:crypto";

interface UploadSessionPayload {
  actorId: string;
  exp: number;
}

const SESSION_TTL_SECONDS = 12 * 60 * 60;

function getSecret(): string {
  const secret =
    process.env.BRAND_VOICE_UPLOAD_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("BRAND_VOICE_UPLOAD_SECRET is not configured");
  }

  return secret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function issueBrandVoiceUploadSessionToken(actorId: string): string {
  const payload: UploadSessionPayload = {
    actorId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadPart)
    .digest("base64url");

  return `${payloadPart}.${signature}`;
}

export function verifyBrandVoiceUploadSessionToken(
  token: string,
  actorId: string,
): { valid: true } | { valid: false; error: string } {
  const rawToken = token.trim();
  const parts = rawToken.split(".");

  if (parts.length !== 2) {
    return { valid: false, error: "Недействительная сессия загрузки" };
  }

  const [payloadPart, signaturePart] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadPart)
    .digest();

  const providedSignature = Buffer.from(signaturePart, "base64url");

  if (
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return { valid: false, error: "Сессия загрузки недействительна" };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as UploadSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.actorId || payload.actorId !== actorId) {
      return { valid: false, error: "Сессия загрузки не совпадает с диктором" };
    }

    if (!Number.isFinite(payload.exp) || payload.exp <= now) {
      return { valid: false, error: "Сессия загрузки истекла" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Некорректная сессия загрузки" };
  }
}
