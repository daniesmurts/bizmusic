export interface Plan {
  name: string;
  slug: string;
  monthlyPrice: number; // in kopeks
  yearlyPrice: number;  // in kopeks
  ttsMonthlyLimit: number;
  aiMonthlyLimit: number;
}

export interface TtsTokenPack {
  id: "pack-5" | "pack-10" | "pack-25" | "pack-50";
  label: string;
  price: number; // in kopeks
}

export const PLANS: Record<string, Plan> = {
  business: {
    name: "Бизнес",
    slug: "business",
    monthlyPrice: 99000,
    yearlyPrice: 840000,
    ttsMonthlyLimit: 30,
    aiMonthlyLimit: 5,
  },
  content: {
    name: "Контент",
    slug: "content",
    monthlyPrice: 149000,
    yearlyPrice: 1200000,
    ttsMonthlyLimit: 10,
    aiMonthlyLimit: 2,
  },
  "business-plus": {
    name: "Бизнес +",
    slug: "business-plus",
    monthlyPrice: 499000,
    yearlyPrice: 4800000,
    ttsMonthlyLimit: 100,
    aiMonthlyLimit: 10,
  },
};

export const TTS_TOKEN_PACKS = [
  { id: "pack-5", label: "5 токенов", price: 15000 },
  { id: "pack-10", label: "10 токенов", price: 28000 },
  { id: "pack-25", label: "25 токенов", price: 62500 },
  { id: "pack-50", label: "50 токенов", price: 115000 },
] as const;

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS[slug];
}

export function getTtsTokenPackById(packId: string): TtsTokenPack | undefined {
  return (TTS_TOKEN_PACKS as readonly TtsTokenPack[]).find((pack) => pack.id === packId);
}
