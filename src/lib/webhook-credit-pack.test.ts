import test from "node:test";
import assert from "node:assert/strict";

import {
  extractCreditsFromPaymentMetadata,
  isConfirmedPaymentStatus,
  shouldCreateCreditLot,
} from "@/lib/payments/webhook-credit-pack";

test("isConfirmedPaymentStatus supports CONFIRMED and AUTHORIZED", () => {
  assert.equal(isConfirmedPaymentStatus("CONFIRMED"), true);
  assert.equal(isConfirmedPaymentStatus("AUTHORIZED"), true);
  assert.equal(isConfirmedPaymentStatus("REJECTED"), false);
});

test("shouldCreateCreditLot is idempotent and payment-type aware", () => {
  assert.equal(shouldCreateCreditLot("credit_pack", "CONFIRMED", false), true);
  assert.equal(shouldCreateCreditLot("credit_pack", "AUTHORIZED", false), true);
  assert.equal(shouldCreateCreditLot("credit_pack", "CONFIRMED", true), false);
  assert.equal(shouldCreateCreditLot("subscription", "CONFIRMED", false), false);
  assert.equal(shouldCreateCreditLot("credit_pack", "NEW", false), false);
});

test("extractCreditsFromPaymentMetadata parses number and numeric strings", () => {
  assert.equal(extractCreditsFromPaymentMetadata({ credits: 10 }), 10);
  assert.equal(extractCreditsFromPaymentMetadata({ credits: "25" }), 25);
});

test("extractCreditsFromPaymentMetadata rejects invalid values", () => {
  assert.throws(() => extractCreditsFromPaymentMetadata({ credits: 0 }), {
    message: "Invalid credits metadata",
  });
  assert.throws(() => extractCreditsFromPaymentMetadata({ credits: "abc" }), {
    message: "Invalid credits metadata",
  });
});
