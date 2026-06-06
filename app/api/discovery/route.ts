import { NextResponse } from "next/server";
import { fetchCandlePointsChunked } from "@/lib/hyperliquid";
import { fetchYahooDailyOHLC } from "@/lib/yahoo";
import { buildEpisodes, summarize } from "@/lib/discovery";
import { ASSETS } from "@/lib/universe";
import type { DiscoveryResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAY = 24 * 60 * 60 * 1000;

// Per-asset benchmark. Hyperliquid only retains 1m candles ~3 days and 5m ~2
// weeks, but 15m candles go back to listing — so 15m (paginated) is the finest
// interval that preserves the full episode history. The pre-bell price at 15m
// sits within ~0.1% of the 1m value, so this keeps both granularity and depth.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") ?? "").toUpperCase();

  const asset = ASSETS.find((a) => a.symbol === symbol);
  if (!asset) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
  }

  const [hlPoints, daily] = await Promise.all([
    fetchCandlePointsChunked(asset.hl, "15m", 90 * DAY),
    fetchYahooDailyOHLC(asset.yahoo, "3mo"),
  ]);

  const episodes = buildEpisodes(hlPoints, daily);
  const metrics = summarize(episodes);

  const payload: DiscoveryResponse = {
    symbol: asset.symbol,
    name: asset.name,
    metrics,
    episodes,
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
