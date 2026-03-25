import test from "node:test";
import assert from "node:assert/strict";

import { buildSaluteSynthesizeUrl, normalizeExpiryMs } from "@/lib/tts";

test("normalizeExpiryMs converts unix seconds to milliseconds", () => {
  const value = normalizeExpiryMs(1_800_000_000);
  assert.equal(value, 1_800_000_000_000);
});

test("normalizeExpiryMs keeps millisecond timestamps unchanged", () => {
  const value = normalizeExpiryMs(1_800_000_000_123);
  assert.equal(value, 1_800_000_000_123);
});

test("normalizeExpiryMs parses ISO datetime strings", () => {
  const value = normalizeExpiryMs("2030-01-01T00:00:00.000Z");
  assert.equal(value, Date.parse("2030-01-01T00:00:00.000Z"));
});

test("normalizeExpiryMs falls back to near-future default on invalid input", () => {
  const now = Date.now();
  const value = normalizeExpiryMs("not-a-date");

  assert.ok(value >= now + 29 * 60 * 1000);
  assert.ok(value <= now + 31 * 60 * 1000);
});

test("buildSaluteSynthesizeUrl includes required text:synthesize query params", () => {
  const url = buildSaluteSynthesizeUrl("Nec_24000");
  const parsed = new URL(url);

  assert.equal(parsed.origin, "https://smartspeech.sber.ru");
  assert.equal(parsed.pathname, "/rest/v1/text:synthesize");
  assert.equal(parsed.searchParams.get("voice"), "Nec_24000");
  assert.equal(parsed.searchParams.get("format"), "mp3");
});
