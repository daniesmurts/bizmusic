export interface Plan {
  name: string;
  slug: string;
  monthlyPrice: number; // in kopeks
  yearlyPrice: number;  // in kopeks
}

export const PLANS: Record<string, Plan> = {
  business: {
    name: "Бизнес",
    slug: "business",
    monthlyPrice: 99000,
    yearlyPrice: 840000,
  },
  content: {
    name: "Контент",
    slug: "content",
    monthlyPrice: 149000,
    yearlyPrice: 1200000,
  },
  "business-plus": {
    name: "Бизнес +",
    slug: "business-plus",
    monthlyPrice: 499000,
    yearlyPrice: 4800000,
  },
};

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS[slug];
}
