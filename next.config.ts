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
  // turbopack intentionally disabled — the version bundled here has a panic
  // bug in aggregation_update.rs (inner_of_uppers_lost_follower) that crashes
  // Rust worker threads during HMR, making the dev server unstable.
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
            // unsafe-eval is only needed by Next.js dev tooling (HMR), not in production.
            // Yandex Metrika uses both mc.yandex.ru (Russia) and mc.yandex.com (CDN).
            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://mc.yandex.ru https://mc.yandex.com`,
            "style-src 'self' 'unsafe-inline'",
            // Allow images from Supabase storage, data URIs, and Yandex Metrika pixel/cookie-sync
            "img-src 'self' https://waootzqqtjyungakvoua.supabase.co data: blob: https://mc.yandex.ru https://mc.yandex.com",
            "font-src 'self' data:",
            // API calls to Supabase, T-Bank, Yandex (both .ru and .com Metrika endpoints)
            "connect-src 'self' https://waootzqqtjyungakvoua.supabase.co https://securepay.tinkoff.ru https://suggestions.dadata.ru https://api.opencagedata.com wss://waootzqqtjyungakvoua.supabase.co blob: https://mc.yandex.ru https://mc.yandex.com",
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
