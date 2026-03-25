export interface Plan {
  name: string;
  slug: string;
  monthlyPrice: number; // in kopeks
  yearlyPrice: number;  // in kopeks
  ttsMonthlyLimit: number;
}

export interface TtsCreditPack {
  id: "pack-5" | "pack-10" | "pack-25" | "pack-50";
  credits: number;
  price: number; // in kopeks
  label: string;
}

export const PLANS: Record<string, Plan> = {
  business: {
    name: "Бизнес",
    slug: "business",
    monthlyPrice: 99000,
    yearlyPrice: 840000,
    ttsMonthlyLimit: 30,
  },
  content: {
    name: "Контент",
    slug: "content",
    monthlyPrice: 149000,
    yearlyPrice: 1200000,
    ttsMonthlyLimit: 10,
  },
  "business-plus": {
    name: "Бизнес +",
    slug: "business-plus",
    monthlyPrice: 499000,
    yearlyPrice: 4800000,
    ttsMonthlyLimit: 100,
  },
};

export const TTS_CREDIT_PACKS: readonly TtsCreditPack[] = [
  { id: "pack-5", credits: 5, price: 15000, label: "5 кредитов" },
  { id: "pack-10", credits: 10, price: 28000, label: "10 кредитов" },
  { id: "pack-25", credits: 25, price: 62500, label: "25 кредитов" },
  { id: "pack-50", credits: 50, price: 115000, label: "50 кредитов" },
];

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS[slug];
}

export function getTtsCreditPackById(packId: string): TtsCreditPack | undefined {
  return TTS_CREDIT_PACKS.find((pack) => pack.id === packId);
}
