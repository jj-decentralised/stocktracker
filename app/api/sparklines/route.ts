import { NextResponse } from "next/server";
import { fetchAllMids, fetchMetaAndAssetCtxs, fetchCloses } from "@/lib/hyperliquid";
import { assetsForCategory, isCategory } from "@/lib/universe";
import type { SparklineResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Run `tasks` with a bounded number of concurrent workers. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category");
  const category = isCategory(categoryParam) ? categoryParam : "stocks";

  let mids: Record<string, string> = {};
  let liveHl = new Set<string>();
  try {
    const [m, meta] = await Promise.all([
      fetchAllMids(),
      fetchMetaAndAssetCtxs(),
    ]);
    mids = m;
    liveHl = new Set([...Object.keys(m), ...meta.ctxByName.keys()]);
  } catch {
    // Sparklines are non-critical; return empty on upstream failure.
    return NextResponse.json(
      { updatedAt: Date.now(), series: {} } satisfies SparklineResponse,
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const liveAssets = assetsForCategory(category).filter(
    (a) => mids[a.hl] !== undefined || liveHl.has(a.hl),
  );

  const closesList = await mapLimit(liveAssets, 8, (a) => fetchCloses(a.hl, 24));

  const series: Record<string, number[]> = {};
  liveAssets.forEach((a, i) => {
    const closes = closesList[i];
    if (closes && closes.length > 1) series[a.symbol] = closes;
  });

  const payload: SparklineResponse = { updatedAt: Date.now(), series };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
