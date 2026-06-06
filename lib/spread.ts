import type { SpreadDirection } from "./types";

export interface SpreadResult {
  abs: number | null;
  pct: number | null;
  direction: SpreadDirection;
}

/** Below this absolute percentage the spread is treated as effectively flat. */
const FLAT_THRESHOLD_PCT = 0.05;

/**
 * Compute the spread of the Hyperliquid price relative to the traditional
 * market price. Premium = Hyperliquid trades above Wall Street.
 */
export function computeSpread(
  hlPrice: number | null,
  tradPrice: number | null,
): SpreadResult {
  if (
    hlPrice === null ||
    tradPrice === null ||
    !Number.isFinite(hlPrice) ||
    !Number.isFinite(tradPrice) ||
    tradPrice === 0
  ) {
    return { abs: null, pct: null, direction: "unknown" };
  }

  const abs = hlPrice - tradPrice;
  const pct = (abs / tradPrice) * 100;

  let direction: SpreadDirection;
  if (Math.abs(pct) < FLAT_THRESHOLD_PCT) direction = "flat";
  else if (pct > 0) direction = "premium";
  else direction = "discount";

  return { abs, pct, direction };
}

/** Percentage change of `current` relative to `reference` (e.g. 24h move). */
export function pctChange(
  current: number | null,
  reference: number | null,
): number | null {
  if (
    current === null ||
    reference === null ||
    !Number.isFinite(current) ||
    !Number.isFinite(reference) ||
    reference === 0
  ) {
    return null;
  }
  return ((current - reference) / reference) * 100;
}

/** Parse a numeric string from the HL API; returns null on garbage. */
export function parseNum(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
