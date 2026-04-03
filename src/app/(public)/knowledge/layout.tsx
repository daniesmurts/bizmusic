import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "База Знаний",
  description: "Инструкции по настройке плеера, управлению голосовыми объявлениями и юридическая информация о легальном музыкальном вещании.",
  openGraph: {
    title: "База Знаний — Бизнес Музыка",
    description: "Все ответы на вопросы по работе сервиса, настройке оборудования и юридическим аспектам.",
    type: "article",
  },
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
