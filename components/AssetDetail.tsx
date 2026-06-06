"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OverlayChart } from "./OverlayChart";
import { ValueDelta } from "./ValueDelta";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { hlSocket } from "@/lib/hlSocket";
import { computeSpread } from "@/lib/spread";
import { formatPrice, formatPct, formatSignedPrice } from "@/lib/format";
import type { Category, Unit } from "@/lib/universe";
import type { HistoryResponse, Point, MarketStatus } from "@/lib/types";

const RANGES = ["1H", "1D", "5D", "1M"] as const;
type Range = (typeof RANGES)[number];

export function AssetDetail({
  symbol,
  name,
  category,
  unit,
}: {
  symbol: string;
  name: string;
  category: Category;
  unit: Unit;
}) {
  const [range, setRange] = useState<Range>("5D");
  const [hist, setHist] = useState<{ hl: Point[]; trad: Point[] } | null>(null);
  const [tradLast, setTradLast] = useState<number | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus>("unknown");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/history?symbol=${symbol}&category=${category}&range=${range}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as HistoryResponse;
        if (cancelled) return;
        setHist({ hl: json.hl, trad: json.trad });
        setTradLast(json.tradLast);
        setMarketStatus(json.marketStatus);
      } catch {
        /* keep prior data */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, category, range]);

  useEffect(() => {
    const unsub = hlSocket.subscribe(symbol, (p) => setLivePrice(p));
    return unsub;
  }, [symbol]);

  const hlPrice = livePrice ?? (hist?.hl.length ? hist.hl[hist.hl.length - 1].value : null);
  const spread = computeSpread(hlPrice, tradLast);

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8">
      <Link
        href="/"
        className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        ← All assets
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-hairline-strong pb-5">
        <div>
          <p className="eyebrow">{category}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
            {symbol}
          </h1>
          <p className="mt-1 text-lg italic text-muted">{name}</p>
        </div>
        <div className="text-right">
          <div className="nums text-4xl tabular-nums">
            <ValueDelta text={formatPct(spread.pct)} direction={spread.direction} />
          </div>
          <div className="mt-1 text-sm text-muted">
            <MarketStatusBadge status={marketStatus} />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <dl className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
        <Stat label="Hyperliquid" value={formatPrice(hlPrice, unit)} live />
        <Stat label="Wall Street" value={formatPrice(tradLast, unit)} />
        <Stat
          label="Spread"
          value={formatSignedPrice(spread.abs, unit)}
          tone={spread.direction}
        />
        <Stat
          label="Spread %"
          value={formatPct(spread.pct)}
          tone={spread.direction}
        />
      </dl>

      {/* Range toggle */}
      <div className="mt-6 flex items-center justify-end gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`cursor-pointer px-3 py-1 text-sm transition-colors ${
              r === range
                ? "bg-ink text-background"
                : "text-muted hover:text-ink"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-3 border border-hairline p-3">
        {hist && (hist.hl.length > 0 || hist.trad.length > 0) ? (
          <OverlayChart
            hl={hist.hl}
            trad={hist.trad}
            livePrice={livePrice ?? undefined}
            unit={unit}
            height={440}
            showLegend
          />
        ) : (
          <div className="flex h-[440px] items-center justify-center text-muted">
            {loading ? "Loading chart…" : "No chart data available."}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-faint">
        The solid line is the live Hyperliquid price (streamed in real time); the
        dashed line is the Wall Street price from Yahoo Finance. The gap between
        them is the spread — it widens when traditional markets are closed and
        Hyperliquid keeps trading.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  live,
}: {
  label: string;
  value: string;
  tone?: "premium" | "discount" | "flat" | "unknown";
  live?: boolean;
}) {
  const toneClass =
    tone === "premium"
      ? "text-premium"
      : tone === "discount"
        ? "text-discount"
        : "text-ink";
  return (
    <div className="bg-background px-4 py-4">
      <dt className="eyebrow flex items-center gap-1.5">
        {label}
        {live && (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-premium" />
        )}
      </dt>
      <dd className={`nums mt-1 text-xl tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  );
}
