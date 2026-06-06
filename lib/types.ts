// Shared types for the Hyperliquid x traditional-market spread tracker.

export type SpreadDirection = "premium" | "discount" | "flat" | "unknown";

export type MarketStatus = "pre" | "open" | "post" | "closed" | "unknown";

/** One row in the spread dashboard: a single stock compared across venues. */
export interface SpreadRow {
  /** Bare ticker, e.g. "AAPL" (Hyperliquid lists it as "xyz:AAPL"). */
  symbol: string;
  /** Human-readable company name. */
  name: string;
  /** Live Hyperliquid price (USD) — mid, falling back to mark / allMids. */
  hlPrice: number | null;
  /** Traditional-market price (USD) from Yahoo — pre/post/regular. */
  tradPrice: number | null;
  /** hlPrice - tradPrice. */
  spreadAbs: number | null;
  /** (spreadAbs / tradPrice) * 100. */
  spreadPct: number | null;
  /** Direction of the spread relative to traditional markets. */
  direction: SpreadDirection;
  /** Hyperliquid 24h change %, derived from prevDayPx. */
  hlChangePct: number | null;
  /** Traditional previous close (USD). */
  tradPrevClose: number | null;
  /** Epoch ms of the traditional price observation. */
  tradTime: number | null;
  /** Per-symbol traditional market status. */
  marketStatus: MarketStatus;
  /** Hyperliquid open interest (contracts), for context. */
  openInterest: number | null;
}

export interface SpreadsResponse {
  /** Epoch ms when this payload was assembled. */
  updatedAt: number;
  /** Aggregate US-market status used in the header. */
  marketStatus: MarketStatus;
  rows: SpreadRow[];
}
