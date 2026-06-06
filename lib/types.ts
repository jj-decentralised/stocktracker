// Shared types for the Hyperliquid x traditional-market spread tracker.

import type { Category, Unit } from "./universe";

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
  /** Hyperliquid previous-day price (for live 24h change recomputation). */
  hlPrevDay: number | null;
  /** Hyperliquid 24h notional (USD) volume. */
  hlDayVolume: number | null;
  /** How to display the price (USD currency vs index points). */
  unit: Unit;
}

export interface SpreadsResponse {
  /** Epoch ms when this payload was assembled. */
  updatedAt: number;
  /** Aggregate US-market status used in the header. */
  marketStatus: MarketStatus;
  /** Category these rows belong to. */
  category: Category;
  rows: SpreadRow[];
}

/** A single time-series point. `time` is epoch **seconds** (lightweight-charts UTCTimestamp). */
export interface Point {
  time: number;
  value: number;
}

/** One off-hours episode: HL's overnight price vs the next regular session. */
export interface Episode {
  /** Trading day (ET, YYYY-MM-DD) of the regular session being predicted. */
  date: string;
  /** Previous regular-session close. */
  prevClose: number;
  /** Hyperliquid off-hours session open / mid / close (close = last price pre-bell). */
  ohOpen: number;
  ohMid: number;
  ohClose: number;
  /** Actual regular-session open and close. */
  actualOpen: number;
  actualClose: number;
  /** (actualOpen − ohClose) / ohClose × 100. */
  errOpenPct: number;
  /** (actualClose − ohClose) / ohClose × 100. */
  errClosePct: number;
  /** Did HL's pre-bell price predict the gap direction vs prevClose? */
  dirHitOpen: boolean;
}

export interface DiscoveryMetrics {
  nEpisodes: number;
  /** Mean absolute error of HL pre-bell vs actual open, %. */
  maeOpenPct: number;
  /** Mean absolute error of HL pre-bell vs actual close, %. */
  maeClosePct: number;
  /** Directional hit-rate vs the open, %. */
  hitRateOpen: number;
  /** Derived 0–100 convenience score (higher = better discovery). */
  score: number;
}

export interface DiscoveryResponse {
  symbol: string;
  name: string;
  metrics: DiscoveryMetrics;
  episodes: Episode[];
}

export interface DiscoverySummaryRow {
  symbol: string;
  name: string;
  metrics: DiscoveryMetrics;
}

export interface DiscoverySummaryResponse {
  updatedAt: number;
  aggregate: {
    nStocks: number;
    totalEpisodes: number;
    medianMaeOpenPct: number;
    avgHitRateOpen: number;
  };
  rows: DiscoverySummaryRow[];
}

export interface HistoryResponse {
  symbol: string;
  name: string;
  unit: Unit;
  /** Hyperliquid price series (oldest -> newest). */
  hl: Point[];
  /** Wall Street / traditional price series (oldest -> newest). */
  trad: Point[];
  /** Latest traditional price (for live spread vs the streaming HL price). */
  tradLast: number | null;
  /** Per-symbol market status. */
  marketStatus: MarketStatus;
}
