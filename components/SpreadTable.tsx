import type { SpreadRow } from "@/lib/types";
import { ValueDelta } from "./ValueDelta";
import {
  formatMoney,
  formatPct,
  formatSignedMoney,
  formatCompact,
} from "@/lib/format";
import type { SortKey } from "./sorting";

interface Column {
  key: SortKey;
  label: string;
  align: "left" | "right";
  hint?: string;
}

const COLUMNS: Column[] = [
  { key: "symbol", label: "Asset", align: "left" },
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
  sortKey,
  sortDir,
  onSort,
}: {
  rows: SpreadRow[];
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
              key={col.key}
              scope="col"
              className={`pb-2 font-normal ${
                col.align === "right" ? "text-right" : "text-left"
              }`}
            >
              <button
                type="button"
                onClick={() => onSort(col.key)}
                className="eyebrow inline-flex items-center hover:text-ink transition-colors cursor-pointer"
              >
                {col.label}
                <SortArrow active={sortKey === col.key} dir={sortDir} />
              </button>
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
                <span className="font-semibold tracking-tight">
                  {r.symbol}
                </span>
                <span className="truncate text-sm text-muted">{r.name}</span>
              </div>
            </td>

            <td className="nums py-3 text-right tabular-nums">
              <div>{formatMoney(r.hlPrice)}</div>
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
              <div>{formatMoney(r.tradPrice)}</div>
              {r.tradPrevClose !== null && (
                <div className="text-xs text-faint">
                  prev {formatMoney(r.tradPrevClose)}
                </div>
              )}
            </td>

            <td className="nums py-3 text-right tabular-nums">
              <ValueDelta
                text={formatSignedMoney(r.spreadAbs)}
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
