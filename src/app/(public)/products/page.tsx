import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Продукты | Бизнес Музыка",
  description:
    "Музыка для бизнеса, контент для блогеров, White Label решения. Комплексные решения музыкального лицензирования.",
  openGraph: {
    title: "Продукты | Бизнес Музыка",
    description:
      "Комплексные решения музыкального лицензирования для бизнеса.",
    type: "website",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
