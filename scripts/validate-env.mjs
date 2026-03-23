/**
 * Build-time environment validation.
 * Ensures all NEXT_PUBLIC_* vars are present before Next.js bakes them into the bundle.
 * Run via: node scripts/validate-env.mjs
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("\n\x1b[31m╔══════════════════════════════════════════════════╗");
  console.error("║  ❌  MISSING BUILD-TIME ENVIRONMENT VARIABLES     ║");
  console.error("╚══════════════════════════════════════════════════╝\x1b[0m\n");
  for (const key of missing) {
    console.error(`  • ${key}`);
  }
  console.error("\nThese NEXT_PUBLIC_* vars must be set at BUILD TIME.");
  console.error("Pass them as --build-arg in Docker or set in .env.local for local dev.\n");
  process.exit(1);
}

console.log("✅ Build-time env validation passed.");
