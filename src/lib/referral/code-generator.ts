import { db } from "@/db";
import { referralAgents } from "@/db/schema";
import { eq } from "drizzle-orm";

const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E",
  Ж: "ZH", З: "Z", И: "I", Й: "I", К: "K", Л: "L", М: "M",
  Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U",
  Ф: "F", Х: "H", Ц: "TS", Ч: "CH", Ш: "SH", Щ: "SH",
  Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "YU", Я: "YA",
};

function transliterate(name: string): string {
  return name
    .toUpperCase()
    .split("")
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? (ch.match(/[A-Z]/) ? ch : ""))
    .join("")
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");
}

function randomAlphanumeric(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function generateUniqueReferralCode(fullName: string): Promise<string> {
  const prefix = transliterate(fullName);
  for (let i = 0; i < 10; i++) {
    const code = `${prefix}-${randomAlphanumeric(4)}`;
    const existing = await db.query.referralAgents.findFirst({
      where: eq(referralAgents.referralCode, code),
      columns: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Could not generate unique referral code after 10 attempts");
}
