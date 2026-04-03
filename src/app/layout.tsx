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
import { SupportChatWidget } from "@/components/SupportChatWidget";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: "Бизнес Музыка — Легальное Музыкальное Вещание для Бизнеса",
    template: "%s | Бизнес Музыка"
  },
  description: "Первая в России PWA-платформа для 100% легального музыкального вещания. Избавьте свой бизнес от штрафов РАО и ВОИС. Управляйте атмосферой онлайн.",
  keywords: ["музыка для бизнеса", "лицензионная музыка", "фоновая музыка", "бизнес музыка", "плеер для кафе", "легальная музыка", "РАО", "ВОИС"],
  authors: [{ name: "Бизнес Музыка Team" }],
  creator: "Бизнес Музыка",
  publisher: "Бизнес Музыка",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: appBaseUrl,
    siteName: "Бизнес Музыка",
    title: "Бизнес Музыка — Легальное Музыкальное Вещание для Бизнеса",
    description: "Первая в России PWA-платформа для 100% легального музыкального вещания. Избавьте свой бизнес от штрафов РАО и ВОИС.",
    images: [
      {
        url: "/images/og-identity.png",
        width: 1024,
        height: 1024,
        alt: "Бизнес Музыка — Strategy of Success",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Бизнес Музыка — Легальное Музыкальное Вещание для Бизнеса",
    description: "Первая в России PWA-платформа для 100% легального музыкального вещания. Избавьте свой бизнес от штрафов РАО и ВОИС.",
    images: ["/images/og-identity.png"],
    creator: "@bizmuzik_ru",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  category: "technology",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Бизнес Музыка",
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
            <SupportChatWidget />
            <UpdatePrompt />
            <Toaster position="top-center" richColors theme="dark" />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
