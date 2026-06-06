import type { SpreadRow } from "@/lib/types";
import { ValueDelta } from "./ValueDelta";
import { formatMoney, formatPct, formatSignedMoney } from "@/lib/format";

export function SpreadCard({ row: r }: { row: SpreadRow }) {
  return (
    <div className="border-b border-hairline py-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">
            {r.symbol}
          </span>
          <span className="truncate text-sm text-muted">{r.name}</span>
        </div>
        <div className="nums text-right text-lg tabular-nums">
          <ValueDelta text={formatPct(r.spreadPct)} direction={r.direction} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-faint">Hyperliquid</span>
          <span className="nums tabular-nums">{formatMoney(r.hlPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-faint">Wall Street</span>
          <span className="nums tabular-nums">{formatMoney(r.tradPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-faint">Spread</span>
          <span className="nums tabular-nums">
            <ValueDelta
              text={formatSignedMoney(r.spreadAbs)}
              direction={r.direction}
              showGlyph={false}
            />
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-faint">HL 24h</span>
          <span className="nums tabular-nums">
            <ValueDelta
              text={formatPct(r.hlChangePct)}
              direction={
                r.hlChangePct === null
                  ? "unknown"
                  : r.hlChangePct > 0
                    ? "premium"
                    : r.hlChangePct < 0
                      ? "discount"
                      : "flat"
              }
              showGlyph={false}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
