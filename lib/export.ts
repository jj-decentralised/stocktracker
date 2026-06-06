import type { SpreadRow } from "./types";

const FIELDS: (keyof SpreadRow)[] = [
  "symbol",
  "name",
  "hlPrice",
  "tradPrice",
  "spreadAbs",
  "spreadPct",
  "direction",
  "hlChangePct",
  "tradPrevClose",
  "openInterest",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(rows: SpreadRow[]): string {
  const header = FIELDS.join(",");
  const lines = rows.map((r) => FIELDS.map((f) => csvCell(r[f])).join(","));
  return [header, ...lines].join("\n");
}

export function rowsToJson(rows: SpreadRow[]): string {
  return JSON.stringify(rows, null, 2);
}

/** Trigger a client-side file download of `content`. */
export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
