import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Player } from "@/components/Player";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { YandexMetrika } from "@/components/YandexMetrika";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: "Бизнес Музыка - Музыкальное Лицензирование",
  description: "Легальное музыкальное лицензирование для бизнеса в РФ (100% соответствие 152-ФЗ и 54-ФЗ).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Бизнес Музыка",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Бизмюзик",
    "url": "https://bizmuzik.ru",
    "logo": "https://bizmuzik.ru/icons/icon-512x512.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+7 (987) 065-59-63",
      "contactType": "customer service",
      "email": "info@boadtech.com",
      "availableLanguage": ["Russian"]
    },
    "sameAs": [
      "https://t.me/bizmuzik_ru"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Бизмюзик",
    "url": "https://bizmuzik.ru"
  };

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased`} suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <YandexMetrika tagId="108223303" />
          </Suspense>
          <AuthProvider>
            <Navbar />
            <main className="pt-24">
              {children}
            </main>
            <Player />
            <UpdatePrompt />
            <Toaster position="top-center" richColors theme="dark" />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
