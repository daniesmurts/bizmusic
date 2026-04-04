export function isConfirmedPaymentStatus(status: string): boolean {
  return status === "CONFIRMED" || status === "AUTHORIZED";
}

export function shouldCreateCreditLot(
  paymentType: string,
  status: string,
  hasExistingLot: boolean
): boolean {
  const isTokenPack = paymentType === "credit_pack" || paymentType === "token_pack";
  return isTokenPack && isConfirmedPaymentStatus(status) && !hasExistingLot;
}

export function extractCreditsFromPaymentMetadata(metadata: Record<string, unknown> | null | undefined): number {
  const raw = metadata?.credits;

  const parsed = typeof raw === "number" ? raw : Number(raw ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid credits metadata");
  }

  return parsed;
}
