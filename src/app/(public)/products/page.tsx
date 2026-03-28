import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Решения | Бизнес Музыка",
  description:
    "Музыка для бизнеса, контент для блогеров, White Label решения. Комплексные решения музыкального лицензирования.",
  openGraph: {
    title: "Решения | Бизнес Музыка",
    description:
      "Комплексные решения музыкального лицензирования для бизнеса.",
    type: "website",
  },
};

export default function ProductsPage() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Музыкальное лицензирование для бизнеса",
    "provider": {
      "@type": "Organization",
      "name": "Бизмюзик",
      "url": "https://bizmuzik.ru"
    },
    "areaServed": "RU",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Решения Бизмюзик",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Музыка для бизнеса",
            "description": "100% легальная музыка для кафе, ресторанов и ритейла."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Голосовые анонсы",
            "description": "AI-генерация аудиоанонсов для торговых залов."
          }
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <ProductsClient />
    </>
  );
}
