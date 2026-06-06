import { NextResponse } from "next/server";
import { fetchCandlePoints } from "@/lib/hyperliquid";
import { fetchYahooDailyOHLC } from "@/lib/yahoo";
import { buildEpisodes, summarize } from "@/lib/discovery";
import { assetsForCategory } from "@/lib/universe";
import { cached } from "@/lib/cache";
import type {
  DiscoverySummaryResponse,
  DiscoverySummaryRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAY = 24 * 60 * 60 * 1000;
const SUMMARY_TTL_MS = 15 * 60_000;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

// Leaderboard across stocks. Uses 15m candles (full history in one request) for
// breadth/speed; per-asset detail uses 1m for maximum granularity. Heavily
// cached since this is historical data.
export async function GET() {
  const payload = await cached<DiscoverySummaryResponse>(
    "discovery:summary:stocks",
    SUMMARY_TTL_MS,
    async () => {
      const stocks = assetsForCategory("stocks");

      const rows: DiscoverySummaryRow[] = [];
      let cursor = 0;
      const limit = 6;
      async function worker() {
        while (cursor < stocks.length) {
          const asset = stocks[cursor++];
          const [hlPoints, daily] = await Promise.all([
            fetchCandlePoints(asset.hl, "15m", 60 * DAY),
            fetchYahooDailyOHLC(asset.yahoo, "3mo"),
          ]);
          const metrics = summarize(buildEpisodes(hlPoints, daily));
          if (metrics.nEpisodes > 0) {
            rows.push({ symbol: asset.symbol, name: asset.name, metrics });
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(limit, stocks.length) }, () => worker()),
      );

      rows.sort((a, b) => b.metrics.score - a.metrics.score);

      const totalEpisodes = rows.reduce((s, r) => s + r.metrics.nEpisodes, 0);
      const medianMaeOpenPct = median(rows.map((r) => r.metrics.maeOpenPct));
      const avgHitRateOpen =
        rows.length > 0
          ? rows.reduce((s, r) => s + r.metrics.hitRateOpen, 0) / rows.length
          : 0;

      return {
        updatedAt: Date.now(),
        aggregate: {
          nStocks: rows.length,
          totalEpisodes,
          medianMaeOpenPct,
          avgHitRateOpen,
        },
        rows,
      };
    },
  );

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
