import { cached } from "./cache";
import { HL_PERP_DEX } from "./universe";

const INFO_URL = "https://api.hyperliquid.xyz/info";
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
