import type { Metadata } from "next";
import Script from "next/script";
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
  return (
    <>
      <HomeClient />
      <Script 
        src="https://cloudpbx.beeline.ru/app/cabinet/app/pub/callmenow/mpbx-cmn-frame.js?externalId=139decae-5201-41bd-a3ee-6897d7175e19-415563598&theme=1&color=1&opened=1"
        strategy="lazyOnload"
      />
    </>
  );
}
