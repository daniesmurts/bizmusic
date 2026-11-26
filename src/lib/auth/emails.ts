import "server-only";

import { sendEmail } from "@/lib/email";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru").replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="ru"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td style="font-size:20px;font-weight:bold;padding-bottom:16px">${escapeHtml(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="font-size:12px;color:#71717a;padding-top:24px">Бизмюзик · bizmuzik.ru<br>Если вы не запрашивали это письмо, просто проигнорируйте его.</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:bold">${escapeHtml(label)}</a></p>
<p style="font-size:12px;color:#71717a;word-break:break-all">Если кнопка не работает, откройте ссылку: ${href}</p>`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Подтвердите email — Бизмюзик",
    html: layout("Подтвердите email", `<p>Чтобы завершить регистрацию в Бизмюзик, подтвердите адрес электронной почты. Ссылка действует 24 часа.</p>${button(link, "Подтвердить email")}`),
    text: `Подтвердите email для Бизмюзик (ссылка действует 24 часа): ${link}`,
  });
}

export async function sendPasswordResetCode(to: string, code: string) {
  return sendEmail({
    to,
    subject: `Код для сброса пароля: ${code}`,
    html: layout("Сброс пароля", `<p>Ваш код для сброса пароля в Бизмюзик:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0">${code}</p><p>Код действует 15 минут.</p>`),
    text: `Код для сброса пароля в Бизмюзик: ${code}. Код действует 15 минут.`,
  });
}

export async function sendInviteEmail(to: string, token: string, locationName: string) {
  const link = `${appUrl()}/accept-invite?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Приглашение в Бизмюзик",
    html: layout(
      "Вас пригласили в Бизмюзик",
      `<p>Вас назначили менеджером филиала <strong>${escapeHtml(locationName)}</strong>. Задайте пароль, чтобы войти в кабинет. Ссылка действует 7 дней.</p>${button(link, "Принять приглашение")}`,
    ),
    text: `Вас назначили менеджером филиала «${locationName}» в Бизмюзик. Задайте пароль по ссылке (действует 7 дней): ${link}`,
  });
}
