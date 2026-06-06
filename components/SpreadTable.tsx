import type { SpreadRow } from "@/lib/types";
import { ValueDelta } from "./ValueDelta";
import { Sparkline } from "./Sparkline";
import {
  formatPrice,
  formatPct,
  formatSignedPrice,
  formatCompact,
} from "@/lib/format";
import type { SortKey } from "./sorting";

interface Column {
  key: SortKey | null;
  label: string;
  align: "left" | "right" | "center";
}

const COLUMNS: Column[] = [
  { key: "symbol", label: "Asset", align: "left" },
  { key: null, label: "HL 24h", align: "center" },
  { key: "hlPrice", label: "Hyperliquid", align: "right" },
  { key: "tradPrice", label: "Wall Street", align: "right" },
  { key: "spreadAbs", label: "Spread", align: "right" },
  { key: "spreadPct", label: "Spread %", align: "right" },
  { key: "openInterest", label: "HL OI", align: "right" },
];

function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <span className="ml-1 text-faint opacity-40">↕</span>;
  return <span className="ml-1 text-ink">{dir === "asc" ? "↑" : "↓"}</span>;
}

export function SpreadTable({
  rows,
  series,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: SpreadRow[];
  series: Record<string, number[]>;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  return (
    <table className="w-full border-collapse text-[1.05rem]">
      <thead>
        <tr className="border-b border-hairline-strong">
          {COLUMNS.map((col) => (
            <th
              key={col.label}
              scope="col"
              className={`pb-2 font-normal ${
                col.align === "right"
                  ? "text-right"
                  : col.align === "center"
                    ? "text-center"
                    : "text-left"
              }`}
            >
              {col.key ? (
                <button
                  type="button"
                  onClick={() => onSort(col.key as SortKey)}
                  className="eyebrow inline-flex items-center hover:text-ink transition-colors cursor-pointer"
                >
                  {col.label}
                  <SortArrow active={sortKey === col.key} dir={sortDir} />
                </button>
              ) : (
                <span className="eyebrow">{col.label}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.symbol}
            className="border-b border-hairline transition-colors hover:bg-paper"
          >
            <td className="py-3 pr-4">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold tracking-tight">{r.symbol}</span>
                <span className="truncate text-sm text-muted">{r.name}</span>
              </div>
            </td>

            <td className="py-3 align-middle">
              <div className="flex justify-center">
                <Sparkline data={series[r.symbol]} />
              </div>
            </td>

            <td className="nums py-3 text-right tabular-nums">
              <div>{formatPrice(r.hlPrice, r.unit)}</div>
              {r.hlChangePct !== null && (
                <div className="text-xs">
                  <ValueDelta
                    text={formatPct(r.hlChangePct)}
                    direction={
                      r.hlChangePct > 0
                        ? "premium"
                        : r.hlChangePct < 0
                          ? "discount"
                          : "flat"
                    }
                    showGlyph={false}
                  />
                  <span className="ml-1 text-faint">24h</span>
                </div>
              )}
            </td>

            <td className="nums py-3 text-right tabular-nums">
              <div>{formatPrice(r.tradPrice, r.unit)}</div>
              {r.tradPrevClose !== null && (
                <div className="text-xs text-faint">
                  prev {formatPrice(r.tradPrevClose, r.unit)}
                </div>
              )}
            </td>

            <td className="nums py-3 text-right tabular-nums">
              <ValueDelta
                text={formatSignedPrice(r.spreadAbs, r.unit)}
                direction={r.direction}
                showGlyph={false}
              />
            </td>

            <td className="nums py-3 text-right text-lg tabular-nums">
              <ValueDelta
                text={formatPct(r.spreadPct)}
                direction={r.direction}
              />
            </td>

            <td className="nums py-3 text-right text-sm text-muted tabular-nums">
              {formatCompact(r.openInterest)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
