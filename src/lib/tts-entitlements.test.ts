import test from "node:test";
import assert from "node:assert/strict";

import {
  getMonthBounds,
  getMonthlyLimitForPlan,
  pickNextCreditLot,
} from "@/lib/tts-entitlements";

test("getMonthlyLimitForPlan returns tier limits for active subscriptions", () => {
  assert.equal(getMonthlyLimitForPlan("business", "ACTIVE"), 30);
  assert.equal(getMonthlyLimitForPlan("content", "ACTIVE"), 10);
  assert.equal(getMonthlyLimitForPlan("business-plus", "ACTIVE"), 100);
});

test("getMonthlyLimitForPlan returns zero when subscription is not active", () => {
  assert.equal(getMonthlyLimitForPlan("business", "INACTIVE"), 0);
  assert.equal(getMonthlyLimitForPlan("business-plus", "EXPIRED"), 0);
});

test("getMonthBounds returns UTC start and next-month boundary", () => {
  const now = new Date("2026-03-25T10:30:00.000Z");
  const { start, end } = getMonthBounds(now);

  assert.equal(start.toISOString(), "2026-03-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-04-01T00:00:00.000Z");
});

test("pickNextCreditLot uses earliest expiry first", () => {
  const now = new Date("2026-03-25T00:00:00.000Z");
  const lot = pickNextCreditLot(
    [
      { id: "b", creditsRemaining: 5, expiresAt: new Date("2026-06-01T00:00:00.000Z"), createdAt: new Date("2026-01-10T00:00:00.000Z") },
      { id: "a", creditsRemaining: 3, expiresAt: new Date("2026-05-01T00:00:00.000Z"), createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ],
    now
  );

  assert.equal(lot?.id, "a");
});

test("pickNextCreditLot ignores expired and empty lots", () => {
  const now = new Date("2026-03-25T00:00:00.000Z");
  const lot = pickNextCreditLot(
    [
      { id: "expired", creditsRemaining: 5, expiresAt: new Date("2026-03-01T00:00:00.000Z"), createdAt: new Date("2026-01-01T00:00:00.000Z") },
      { id: "empty", creditsRemaining: 0, expiresAt: new Date("2026-06-01T00:00:00.000Z"), createdAt: new Date("2026-02-01T00:00:00.000Z") },
    ],
    now
  );

  assert.equal(lot, null);
});
