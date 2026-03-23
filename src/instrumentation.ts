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

    if (missing.length === 0 && missingBuild.length === 0) {
      console.log("[ENV] ✅ All required environment variables are present.");
    }
  }
}
