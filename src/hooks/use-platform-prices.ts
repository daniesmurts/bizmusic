"use client";

import { useState, useEffect } from "react";

export interface PlatformPrices {
  businessMonthly: number;
  contentMonthly: number;
  businessProMonthly: number;
  businessPlusMonthly: number;
  startingPrice: number;
}

const DEFAULT_PRICES: PlatformPrices = {
  businessMonthly: 1490,
  contentMonthly: 990,
  businessProMonthly: 2490,
  businessPlusMonthly: 4990,
  startingPrice: 990,
};

/** Format rubles with Russian locale: 1490 → "1 490 ₽" */
export function fmtRub(rubles: number): string {
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
      rubles
    ) + " ₽"
  );
}

/**
 * Client-side hook to fetch platform prices from /api/pricing.
 * Falls back to DEFAULT_PRICES if the API fails.
 */
export function usePlatformPrices() {
  const [prices, setPrices] = useState<PlatformPrices>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data: PlatformPrices) => {
        if (data && data.startingPrice) {
          setPrices(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { prices, loading };
}
