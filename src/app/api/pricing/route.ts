import { NextResponse } from "next/server";
import { getPlatformPrices } from "@/lib/pricing";

/**
 * Public API endpoint returning current tier prices in rubles.
 * No auth required — prices are public information.
 * Cached for 60 seconds to avoid excessive DB reads.
 */
export async function GET() {
  try {
    const prices = await getPlatformPrices();
    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}
