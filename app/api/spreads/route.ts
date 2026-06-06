import { NextResponse } from "next/server";
import {
  fetchAllMids,
  fetchMetaAndAssetCtxs,
  type HlAssetCtx,
} from "@/lib/hyperliquid";
import { fetchYahooQuotes } from "@/lib/yahoo";
import { computeSpread, pctChange, parseNum } from "@/lib/spread";
import { deriveMarketStatus } from "@/lib/marketHours";
import { assetsForCategory, isCategory } from "@/lib/universe";
import type { SpreadRow, SpreadsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function hlPriceFor(ctx: HlAssetCtx | undefined, mid: string | undefined) {
  return (
    parseNum(ctx?.midPx) ??
    parseNum(mid) ??
    parseNum(ctx?.markPx) ??
    parseNum(ctx?.oraclePx)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category");
  const category = isCategory(categoryParam) ? categoryParam : "stocks";

  const marketStatus = deriveMarketStatus();

  let mids;
  let meta;
  try {
    [mids, meta] = await Promise.all([
      fetchAllMids(),
      fetchMetaAndAssetCtxs(),
    ]);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to reach Hyperliquid",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  // Only keep curated assets that are actually live on Hyperliquid right now.
  const liveAssets = assetsForCategory(category).filter(
    (a) => mids[a.hl] !== undefined || meta.ctxByName.has(a.hl),
  );

  const quotes = await fetchYahooQuotes(liveAssets.map((a) => a.yahoo));

  const rows: SpreadRow[] = liveAssets.map((asset) => {
    const ctx = meta.ctxByName.get(asset.hl);
    const hlPrice = hlPriceFor(ctx, mids[asset.hl]);
    const prevDay = parseNum(ctx?.prevDayPx);

    const quote = quotes.get(asset.yahoo) ?? null;
    const tradPrice = quote?.price ?? null;

    const spread = computeSpread(hlPrice, tradPrice);

    return {
      symbol: asset.symbol,
      name: asset.name,
      hlPrice,
      tradPrice,
      spreadAbs: spread.abs,
      spreadPct: spread.pct,
      direction: spread.direction,
      hlChangePct: pctChange(hlPrice, prevDay),
      tradPrevClose: quote?.prevClose ?? null,
      tradTime: quote?.time ?? null,
      marketStatus,
      openInterest: parseNum(ctx?.openInterest),
      hlPrevDay: prevDay,
      hlDayVolume: parseNum(ctx?.dayNtlVlm),
      unit: asset.unit,
    };
  });

  // Default ordering: widest absolute spread first; nulls sink to the bottom.
  rows.sort((a, b) => {
    const av = a.spreadPct === null ? -Infinity : Math.abs(a.spreadPct);
    const bv = b.spreadPct === null ? -Infinity : Math.abs(b.spreadPct);
    return bv - av;
  });

  const payload: SpreadsResponse = {
    updatedAt: Date.now(),
    marketStatus,
    category,
    rows,
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
