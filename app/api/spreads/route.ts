import { NextResponse } from "next/server";
import {
  fetchAllMids,
  fetchMetaAndAssetCtxs,
  type HlAssetCtx,
} from "@/lib/hyperliquid";
import { fetchYahooQuotes } from "@/lib/yahoo";
import { computeSpread, pctChange, parseNum } from "@/lib/spread";
import { deriveMarketStatus } from "@/lib/marketHours";
import { STOCKS, toHlSymbol } from "@/lib/universe";
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

export async function GET() {
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

  // Only keep curated stocks that are actually live on Hyperliquid right now.
  const liveStocks = STOCKS.filter((s) => {
    const coin = toHlSymbol(s.symbol);
    return mids[coin] !== undefined || meta.ctxByName.has(coin);
  });

  const quotes = await fetchYahooQuotes(liveStocks.map((s) => s.symbol));

  const rows: SpreadRow[] = liveStocks.map((stock) => {
    const coin = toHlSymbol(stock.symbol);
    const ctx = meta.ctxByName.get(coin);
    const hlPrice = hlPriceFor(ctx, mids[coin]);
    const prevDay = parseNum(ctx?.prevDayPx);

    const quote = quotes.get(stock.symbol) ?? null;
    const tradPrice = quote?.price ?? null;

    const spread = computeSpread(hlPrice, tradPrice);

    return {
      symbol: stock.symbol,
      name: stock.name,
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
    rows,
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
