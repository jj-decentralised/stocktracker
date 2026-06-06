import type { SpreadRow } from "@/lib/types";

export type SortKey =
  | "symbol"
  | "hlPrice"
  | "tradPrice"
  | "spreadAbs"
  | "spreadPct"
  | "absSpreadPct"
  | "openInterest";

export type SortDir = "asc" | "desc";

function value(row: SpreadRow, key: SortKey): number | string | null {
  switch (key) {
    case "symbol":
      return row.symbol;
    case "absSpreadPct":
      return row.spreadPct === null ? null : Math.abs(row.spreadPct);
    default:
      return row[key];
  }
}

export function sortRows(
  rows: SpreadRow[],
  key: SortKey,
  dir: SortDir,
): SpreadRow[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = value(a, key);
    const bv = value(b, key);

    // Nulls always sink to the bottom regardless of direction.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * factor;
    }
    return ((av as number) - (bv as number)) * factor;
  });
}

/** Default sort direction when a column header is first clicked. */
export function defaultDir(key: SortKey): SortDir {
  return key === "symbol" ? "asc" : "desc";
}
