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

export const metadata: Metadata = {
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
  return (
    <html lang="ru" suppressHydrationWarning>
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
