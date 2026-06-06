// Display formatters. Kept dependency-free so they run on server and client.

export function formatMoney(value: number | null, currency = "USD"): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const digits = Math.abs(value) >= 1000 ? 2 : value < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Plain decimal for index points (no currency symbol). */
export function formatPoints(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Unit-aware price: USD currency for stocks/ETFs/commodities, points for indices. */
export function formatPrice(
  value: number | null,
  unit: "usd" | "points",
): string {
  return unit === "points" ? formatPoints(value) : formatMoney(value);
}

/** Signed percentage, e.g. "+1.24%" / "-0.80%". */
export function formatPct(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Signed money delta, e.g. "+$1.20" / "-$3.40". */
export function formatSignedMoney(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

/** Signed, unit-aware delta ("+$1.20" for USD, "+12.30" for points). */
export function formatSignedPrice(
  value: number | null,
  unit: "usd" | "points",
): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${unit === "points" ? formatPoints(abs) : formatMoney(abs)}`;
}

/** Compact large numbers, e.g. 1.2M, 45.3K. */
export function formatCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Relative "x ago" / clock time for a timestamp in epoch ms. */
export function formatRelativeTime(epochMs: number | null): string {
  if (!epochMs || !Number.isFinite(epochMs)) return "—";
  const diff = Date.now() - epochMs;
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export function formatClock(epochMs: number | null): string {
  if (!epochMs || !Number.isFinite(epochMs)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(epochMs);
}
