export interface AnnouncementDeleteScope {
  announcementId: string;
  businessId: string;
}

/**
 * Build and validate the required scope for a safe announcement delete operation.
 */
export function createAnnouncementDeleteScope(
  announcementId: string,
  businessId: string
): AnnouncementDeleteScope {
  const scopedAnnouncementId = announcementId.trim();
  const scopedBusinessId = businessId.trim();

  if (!scopedAnnouncementId) {
    throw new Error("Announcement ID is required for scoped delete.");
  }

  if (!scopedBusinessId) {
    throw new Error("Business ID is required for scoped delete.");
  }

  return {
    announcementId: scopedAnnouncementId,
    businessId: scopedBusinessId,
  };
}

/**
 * Defense-in-depth ownership check for announcement records.
 */
export function isAnnouncementOwnedByBusiness(
  recordBusinessId: string,
  currentBusinessId: string
): boolean {
  return recordBusinessId.trim() === currentBusinessId.trim();
}
