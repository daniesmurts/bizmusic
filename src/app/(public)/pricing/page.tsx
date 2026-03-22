import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Тарифы и цены | Бизнес Музыка",
  description:
    "Выберите тариф легального музыкального оформления для вашего бизнеса. От 990 рублей в месяц. Бесплатный пробный период.",
  openGraph: {
    title: "Тарифы и цены | Бизнес Музыка",
    description:
      "Легальная фоновая музыка для бизнеса от 990 руб/мес. 100% защита от РАО и ВОИС.",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
