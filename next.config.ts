import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const pwaConfig = withPWA({
  dest: "public",
  disable: isDev,
  register: false,
  skipWaiting: !isDev,
});

const nextConfig: NextConfig = {
  turbopack: {},
  output: 'standalone',
  serverExternalPackages: ["pg", "drizzle-orm"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Next.js requires unsafe-inline for styles and inline scripts in dev/prod
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru",
            "style-src 'self' 'unsafe-inline'",
            // Allow images from Supabase storage and data URIs (for generated PDFs/QR codes)
            "img-src 'self' https://waootzqqtjyungakvoua.supabase.co data: blob: https://mc.yandex.ru",
            "font-src 'self' data:",
            // API calls to Supabase, T-Bank, Yandex
            "connect-src 'self' https://waootzqqtjyungakvoua.supabase.co https://securepay.tinkoff.ru https://suggestions.dadata.ru https://api.opencagedata.com wss://waootzqqtjyungakvoua.supabase.co blob: https://mc.yandex.ru",
            // Audio streaming from Supabase storage
            "media-src 'self' https://waootzqqtjyungakvoua.supabase.co blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'waootzqqtjyungakvoua.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default pwaConfig(nextConfig);
