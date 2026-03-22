import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "О компании | Бизнес Музыка",
  description:
    "Мы делаем легальную музыку доступной для каждого бизнеса в России. Прямые лицензии от правообладателей, полная защита от РАО и ВОИС.",
  openGraph: {
    title: "О компании | Бизнес Музыка",
    description:
      "Прямые лицензии от правообладателей. 10,000+ треков. 500+ довольных клиентов.",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
