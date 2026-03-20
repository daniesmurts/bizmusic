import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { Player } from "@/components/Player";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";

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
  maximumScale: 1,
  userScalable: false,
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
          <AuthProvider>
            <Navbar />
            <main className="pt-24 pb-32">
              {children}
            </main>
            <Player />
            <Toaster position="top-center" richColors theme="dark" />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
