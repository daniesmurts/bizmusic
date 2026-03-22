import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Бизнес Музыка — Легальное музыкальное лицензирование для бизнеса",
  description:
    "Легальное музыкальное оформление для бизнеса в России. 100% защита от РАО и ВОИС. Прямые лицензии от правообладателей.",
  openGraph: {
    title: "Бизнес Музыка — Легальное музыкальное лицензирование",
    description:
      "Легальное музыкальное оформление для бизнеса. Полная юридическая безопасность и безупречное качество звука.",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
