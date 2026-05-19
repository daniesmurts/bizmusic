import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const pwaConfig = withPWA({
  dest: "public",
  disable: isDev,
  register: true,
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
            // 'unsafe-inline' required by Next.js App Router hydration scripts.
            // 'unsafe-eval' required by webpack HMR in dev. No nonce enforcement — remove
            // 'strict-dynamic' since it overrides 'self' in modern browsers without a nonce.
            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://mc.yandex.ru https://mc.yandex.com https://challenges.cloudflare.com https://*.clerk.accounts.dev`,
            "style-src 'self' 'unsafe-inline'",
            // Clerk UI components load images (profile pictures, avatars)
            "img-src 'self' https://waootzqqtjyungakvoua.supabase.co data: blob: https://mc.yandex.ru https://mc.yandex.com https://img.clerk.com",
            "font-src 'self' data:",
            // Clerk FAPI + Supabase + payment + geocoding APIs + Yandex WebSocket
            "connect-src 'self' https://waootzqqtjyungakvoua.supabase.co https://securepay.tinkoff.ru https://suggestions.dadata.ru https://api.opencagedata.com wss://waootzqqtjyungakvoua.supabase.co blob: https://mc.yandex.ru https://mc.yandex.com wss://mc.yandex.com wss://mc.yandex.ru https://*.clerk.accounts.dev https://clerk.bizmuzik.ru",
            // Clerk creates web workers from blob URLs for its internal SDK
            "worker-src 'self' blob:",
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

export default withSentryConfig(pwaConfig(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "bizsprav",

  project: "bizmuzik-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
