/**
 * Copies the @clerk/clerk-js browser bundle into public/clerk-js/ so it can be
 * served from the same origin as the app. This bypasses Russian mobile carriers
 * blocking Clerk's CDN (CloudFront/Fastly), which prevents the auth UI from loading.
 *
 * Runs as prebuild; the copied files are then served by Next.js as static assets.
 */

import { cp, mkdir, rm, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "node_modules", "@clerk", "clerk-js", "dist");
const destDir = join(rootDir, "public", "clerk-js");

async function main() {
  try {
    await stat(srcDir);
  } catch {
    console.error(`❌ @clerk/clerk-js dist folder not found at ${srcDir}`);
    console.error("   Run: npm install @clerk/clerk-js");
    process.exit(1);
  }

  // Wipe any previous copy so old chunks don't linger
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  // Copy only browser-variant files (skip native + legacy to keep the image small).
  // clerk.browser.js dynamically imports chunks named *_clerk.browser_*.js
  const entries = await readdir(srcDir);
  let copied = 0;
  for (const name of entries) {
    // Skip native (mobile) and legacy variants — we only need clerk.browser bundle
    if (/clerk\.native[._]/.test(name) || /clerk\.legacy[._]/.test(name)) continue;
    if (!name.endsWith(".js") && !name.endsWith(".js.map")) continue;
    await cp(join(srcDir, name), join(destDir, name));
    copied++;
  }

  console.log(`✅ Copied ${copied} Clerk JS files to public/clerk-js/`);
}

main().catch((err) => {
  console.error("Failed to copy clerk-js:", err);
  process.exit(1);
});
