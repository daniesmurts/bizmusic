import test from "node:test";
import assert from "node:assert/strict";

process.env.AUTH_SECRET = "test-secret-that-is-at-least-32-characters-long";

test("hashPassword/verifyPassword round-trip", async () => {
  const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
  const hash = await hashPassword("correct horse battery");
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword("correct horse battery", hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("verifyPassword rejects missing or malformed hashes", async () => {
  const { verifyPassword } = await import("@/lib/auth/password");
  assert.equal(await verifyPassword("x", null), false);
  assert.equal(await verifyPassword("x", "CLERK_AUTH"), false);
  assert.equal(await verifyPassword("x", "scrypt$1$2$3"), false);
});

test("hashPassword salts each hash", async () => {
  const { hashPassword } = await import("@/lib/auth/password");
  assert.notEqual(await hashPassword("same"), await hashPassword("same"));
});

test("session token verifies and carries payload", async () => {
  const { signSession, verifySession } = await import("@/lib/auth/session-token");
  const token = await signSession({ sub: "user-1", role: "ADMIN", sv: 3 });
  const payload = await verifySession(token);
  assert.equal(payload?.sub, "user-1");
  assert.equal(payload?.role, "ADMIN");
  assert.equal(payload?.sv, 3);
});

test("session token rejects tampering", async () => {
  const { signSession, verifySession } = await import("@/lib/auth/session-token");
  const token = await signSession({ sub: "user-1", role: "BUSINESS_OWNER", sv: 0 });
  const [body, sig] = token.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ sub: "user-1", role: "ADMIN", sv: 0, exp: 9999999999 }))
    .toString("base64url");
  assert.equal(await verifySession(`${forgedBody}.${sig}`), null);
  assert.equal(await verifySession(`${body}.${sig.slice(0, -2)}xx`), null);
  assert.equal(await verifySession("garbage"), null);
  assert.equal(await verifySession(`${body}.${sig}.extra`), null);
  assert.equal(await verifySession(undefined), null);
});

test("session token expires", async () => {
  const { signSession, verifySession } = await import("@/lib/auth/session-token");
  const token = await signSession({ sub: "user-1", role: "STAFF", sv: 0 }, -1);
  assert.equal(await verifySession(token), null);
});
