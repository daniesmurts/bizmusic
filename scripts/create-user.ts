/**
 * Creates (or updates) an account with a verified email — no confirmation email needed.
 *
 *   npx tsx scripts/create-user.ts client@example.ru            # BUSINESS_OWNER
 *   npx tsx scripts/create-user.ts --role=ADMIN admin@bizmuzik.ru
 *
 * Prompts for the password without echoing it, so it never lands in shell history.
 */
import * as readline from "readline";
import { explainDbError, loadTargetDb } from "./lib/target-db";

const ROLES = ["ADMIN", "BUSINESS_OWNER"] as const;
type Role = (typeof ROLES)[number];

// One interface for all prompts; lines are queued so piped input works too.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const rlOutput = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
let muted = false;
rlOutput._writeToOutput = (s: string) => {
  if (!muted) rlOutput.output.write(s);
};
const queued: string[] = [];
const waiting: ((line: string) => void)[] = [];
rl.on("line", (line) => {
  const next = waiting.shift();
  if (next) next(line);
  else queued.push(line);
});
rl.on("close", () => waiting.splice(0).forEach((resolve) => resolve("")));

function promptHidden(question: string): Promise<string> {
  process.stdout.write(question);
  muted = true;
  return new Promise((resolve) => {
    const done = (line: string) => {
      muted = false;
      process.stdout.write("\n");
      resolve(line);
    };
    const line = queued.shift();
    if (line !== undefined) done(line);
    else waiting.push(done);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const roleArg = args.find((a) => a.startsWith("--role="))?.slice("--role=".length) ?? "BUSINESS_OWNER";
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

  if (!email || !email.includes("@") || !ROLES.includes(roleArg as Role)) {
    console.error("Usage: npx tsx scripts/create-user.ts [--role=ADMIN|BUSINESS_OWNER] <email>");
    process.exit(1);
  }
  const role = roleArg as Role;

  loadTargetDb();

  const { hashPassword, validatePasswordStrength } = await import("../src/lib/auth/password");
  const { db } = await import("../src/db");
  const { users } = await import("../src/db/schema");
  const { sql } = await import("drizzle-orm");

  const password = await promptHidden("Password: ");
  const weak = validatePasswordStrength(password);
  if (weak) {
    console.error(weak);
    process.exit(1);
  }
  if ((await promptHidden("Repeat password: ")) !== password) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
  rl.close();

  const passwordHash = await hashPassword(password);
  const now = new Date();

  // termsAccepted stays false for clients: they accept the offer themselves in the app.
  const [row] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role,
      emailVerifiedAt: now,
      termsAccepted: role === "ADMIN",
      termsAcceptedAt: role === "ADMIN" ? now : null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        role,
        emailVerifiedAt: now,
        disabledAt: null,
        sessionVersion: sql`${users.sessionVersion} + 1`,
      },
    })
    .returning({ id: users.id });

  console.log(`✅ ${role} ready: ${email} (${row.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(explainDbError(err));
  process.exit(1);
});
