import { cached } from "./cache";
import { HL_PERP_DEX } from "./universe";

// Hyperliquid `info` endpoint. Defaults to the public API but can be pointed at
// a QuickNode Hyperliquid endpoint via HL_INFO_URL (higher rate limits, better
// for the granular candle pagination and the discovery leaderboard fan-out).
const INFO_URL =
  process.env.HL_INFO_URL?.trim() || "https://api.hyperliquid.xyz/info";
const TIMEOUT_MS = 8000;
const MIDS_TTL_MS = 5000;
const CTX_TTL_MS = 5000;

async function postInfo<T>(body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Hyperliquid info ${body.type} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Map of coin id (e.g. "xyz:AAPL") -> mid price string. */
export type AllMids = Record<string, string>;

export function fetchAllMids(dex = HL_PERP_DEX): Promise<AllMids> {
  return cached(`hl:allMids:${dex}`, MIDS_TTL_MS, () =>
    postInfo<AllMids>({ type: "allMids", dex }),
  );
}

export interface HlUniverseAsset {
  name: string;
  szDecimals: number;
  maxLeverage?: number;
}

export interface HlAssetCtx {
  markPx?: string;
  midPx?: string;
  oraclePx?: string;
  prevDayPx?: string;
  openInterest?: string;
  funding?: string;
}

export interface MetaAndAssetCtxs {
  /** coin id -> context (markPx, midPx, oraclePx, prevDayPx, openInterest...) */
  ctxByName: Map<string, HlAssetCtx>;
}

type RawMetaAndCtxs = [{ universe: HlUniverseAsset[] }, HlAssetCtx[]];

interface RawCandle {
  t: number;
  c: string;
}

const CANDLE_TTL_MS = 60_000;

export interface CandlePoint {
  /** Epoch seconds (candle open time). */
  time: number;
  value: number;
}

/**
 * Hyperliquid close-price points for charting, over the trailing `lookbackMs`
 * at the given candle interval. Returns oldest -> newest in epoch SECONDS.
 * Empty array on failure (charts degrade gracefully).
 */
export async function fetchCandlePoints(
  coin: string,
  interval: string,
  lookbackMs: number,
): Promise<CandlePoint[]> {
  return cached(
    `hl:points:${coin}:${interval}:${lookbackMs}`,
    CANDLE_TTL_MS,
    async () => {
      const end = Date.now();
      const start = end - lookbackMs;
      try {
        const candles = await postInfo<RawCandle[]>({
          type: "candleSnapshot",
          req: { coin, interval, startTime: start, endTime: end },
        });
        if (!Array.isArray(candles)) return [];
        return candles
          .map((c) => ({ time: Math.floor(c.t / 1000), value: Number(c.c) }))
          .filter((p) => Number.isFinite(p.value) && Number.isFinite(p.time));
      } catch {
        return [];
      }
    },
  );
}

const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
};

// Hyperliquid caps candleSnapshot at ~5000 candles per request, so fine
// intervals (e.g. 1m) only reach back a few days in one call. To assemble a
// longer, maximally-granular history we paginate by time window and merge.
const MAX_PER_REQ = 4500;

async function fetchCandlesRaw(
  coin: string,
  interval: string,
  startMs: number,
  endMs: number,
): Promise<RawCandle[]> {
  try {
    const candles = await postInfo<RawCandle[]>({
      type: "candleSnapshot",
      req: { coin, interval, startTime: startMs, endTime: endMs },
    });
    return Array.isArray(candles) ? candles : [];
  } catch {
    return [];
  }
}

/**
 * Assemble a long, fine-grained close-price series by paginating candleSnapshot.
 * Returns oldest -> newest points in epoch SECONDS. Empty on total failure.
 */
export async function fetchCandlePointsChunked(
  coin: string,
  interval: string,
  lookbackMs: number,
): Promise<CandlePoint[]> {
  const intervalMs = INTERVAL_MS[interval] ?? 60_000;
  const end = Date.now();
  const start = end - lookbackMs;
  const chunkMs = MAX_PER_REQ * intervalMs;

  // Build chunk windows.
  const windows: Array<[number, number]> = [];
  for (let s = start; s < end; s += chunkMs) {
    windows.push([s, Math.min(s + chunkMs, end)]);
  }

  return cached(
    `hl:chunked:${coin}:${interval}:${lookbackMs}`,
    CANDLE_TTL_MS,
    async () => {
      // Limited concurrency to respect upstream while staying fast.
      const limit = 4;
      const merged = new Map<number, number>();
      let cursor = 0;
      async function worker() {
        while (cursor < windows.length) {
          const [s, e] = windows[cursor++];
          const raw = await fetchCandlesRaw(coin, interval, s, e);
          for (const c of raw) {
            const v = Number(c.c);
            if (Number.isFinite(v)) merged.set(c.t, v);
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(limit, windows.length) }, () => worker()),
      );
      return [...merged.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([t, value]) => ({ time: Math.floor(t / 1000), value }));
    },
  );
}

export function fetchMetaAndAssetCtxs(
  dex = HL_PERP_DEX,
): Promise<MetaAndAssetCtxs> {
  return cached(`hl:metaCtx:${dex}`, CTX_TTL_MS, async () => {
    const raw = await postInfo<RawMetaAndCtxs>({
      type: "metaAndAssetCtxs",
      dex,
    });
    const universe = raw?.[0]?.universe ?? [];
    const ctxs = raw?.[1] ?? [];
    const ctxByName = new Map<string, HlAssetCtx>();
    for (let i = 0; i < universe.length; i++) {
      const asset = universe[i];
      const ctx = ctxs[i];
      if (asset?.name && ctx) ctxByName.set(asset.name, ctx);
    }
    return { ctxByName };
  });
}
