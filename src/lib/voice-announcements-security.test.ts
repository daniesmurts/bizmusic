import test from "node:test";
import assert from "node:assert/strict";

import {
  createAnnouncementDeleteScope,
  isAnnouncementOwnedByBusiness,
} from "@/lib/voice-announcements-security";

test("createAnnouncementDeleteScope trims and returns safe scope", () => {
  const scope = createAnnouncementDeleteScope("  ann-123  ", "  biz-999  ");

  assert.equal(scope.announcementId, "ann-123");
  assert.equal(scope.businessId, "biz-999");
});

test("createAnnouncementDeleteScope rejects empty announcement id", () => {
  assert.throws(() => createAnnouncementDeleteScope("", "biz-999"), {
    message: "Announcement ID is required for scoped delete.",
  });
});

test("createAnnouncementDeleteScope rejects empty business id", () => {
  assert.throws(() => createAnnouncementDeleteScope("ann-123", "   "), {
    message: "Business ID is required for scoped delete.",
  });
});

test("isAnnouncementOwnedByBusiness validates ownership correctly", () => {
  assert.equal(isAnnouncementOwnedByBusiness("biz-1", "biz-1"), true);
  assert.equal(isAnnouncementOwnedByBusiness("biz-1", "biz-2"), false);
});
