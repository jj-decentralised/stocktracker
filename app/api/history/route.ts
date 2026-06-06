import { NextResponse } from "next/server";
import { fetchCandlePoints } from "@/lib/hyperliquid";
import { fetchYahooIntraday } from "@/lib/yahoo";
import { deriveMarketStatus } from "@/lib/marketHours";
import { ASSETS, isCategory } from "@/lib/universe";
import type { HistoryResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Range presets. HL streams 24/7 while Yahoo only has session data, so we pick
// windows that share a common time range (the lines overlap on trading days and
// the Hyperliquid line continues alone outside of market hours).
const RANGES: Record<
  string,
  { hlInterval: string; hlLookbackMs: number; yRange: string; yInterval: string }
> = {
  "1H": { hlInterval: "1m", hlLookbackMs: 2 * HOUR, yRange: "1d", yInterval: "1m" },
  "1D": { hlInterval: "5m", hlLookbackMs: DAY, yRange: "1d", yInterval: "1m" },
  "5D": { hlInterval: "15m", hlLookbackMs: 5 * DAY, yRange: "5d", yInterval: "5m" },
  "1M": { hlInterval: "1h", hlLookbackMs: 30 * DAY, yRange: "1mo", yInterval: "30m" },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") ?? "").toUpperCase();
  const categoryParam = url.searchParams.get("category");
  const rangeKey = url.searchParams.get("range") ?? "5D";
  const range = RANGES[rangeKey] ?? RANGES["5D"];

  const asset = ASSETS.find(
    (a) =>
      a.symbol === symbol &&
      (!isCategory(categoryParam) || a.category === categoryParam),
  );
  if (!asset) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
  }

  const [hl, trad] = await Promise.all([
    fetchCandlePoints(asset.hl, range.hlInterval, range.hlLookbackMs),
    fetchYahooIntraday(asset.yahoo, range.yRange, range.yInterval),
  ]);

  const tradLast = trad.length > 0 ? trad[trad.length - 1].value : null;

  const payload: HistoryResponse = {
    symbol: asset.symbol,
    name: asset.name,
    unit: asset.unit,
    hl,
    trad,
    tradLast,
    marketStatus: deriveMarketStatus(),
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
