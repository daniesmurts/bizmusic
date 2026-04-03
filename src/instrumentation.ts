/**
 * Next.js Instrumentation — runs once on server startup.
 * Validates that all required runtime env vars are present.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const required = [
      "DATABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const optionalSupport = [
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_SUPPORT_CHAT_ID",
      "BITRIX24_WEBHOOK_URL",
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error("\n[ENV] ❌ MISSING RUNTIME ENVIRONMENT VARIABLES:");
      for (const key of missing) {
        console.error(`  • ${key}`);
      }
      console.error("[ENV] The application will not function correctly without these.\n");
    }

    // Warn about NEXT_PUBLIC_* vars that should have been baked at build time
    const buildTimeVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ];

    const missingBuild = buildTimeVars.filter((key) => !process.env[key]);
    if (missingBuild.length > 0) {
      console.error("\n[ENV] ⚠️  MISSING NEXT_PUBLIC_* VARIABLES (should be set at build time):");
      for (const key of missingBuild) {
        console.error(`  • ${key}`);
      }
      console.error("[ENV] These must be passed as --build-arg during docker build.\n");
    }

    const missingSupport = optionalSupport.filter((key) => !process.env[key]);
    if (missingSupport.length > 0) {
      console.warn("\n[ENV] ⚠️  SUPPORT INTEGRATION VARIABLES ARE NOT FULLY CONFIGURED:");
      for (const key of missingSupport) {
        console.warn(`  • ${key}`);
      }
      console.warn("[ENV] Support chat will still work, but Telegram/Bitrix24 forwarding may be skipped.\n");
    }

    if (missing.length === 0 && missingBuild.length === 0) {
      console.log("[ENV] ✅ All required environment variables are present.");
    }
  }
}
