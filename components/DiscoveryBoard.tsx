"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  DiscoverySummaryResponse,
  DiscoverySummaryRow,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { downloadFile } from "@/lib/export";

type SortKey = "score" | "maeOpenPct" | "hitRateOpen" | "nEpisodes";

export function DiscoveryBoard() {
  const [data, setData] = useState<DiscoverySummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/discovery/summary", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = (await res.json()) as DiscoverySummaryResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.rows.filter(
          (r) =>
            r.symbol.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q),
        )
      : data.rows;
    const dir = sortKey === "maeOpenPct" ? 1 : -1; // lower MAE is better
    return [...filtered].sort(
      (a, b) => (a.metrics[sortKey] - b.metrics[sortKey]) * dir,
    );
  }, [data, query, sortKey]);

  function exportCsv() {
    if (!data) return;
    const header = "symbol,name,episodes,maeOpenPct,maeClosePct,hitRateOpen,score";
    const lines = data.rows.map((r) =>
      [
        r.symbol,
        `"${r.name}"`,
        r.metrics.nEpisodes,
        r.metrics.maeOpenPct.toFixed(4),
        r.metrics.maeClosePct.toFixed(4),
        r.metrics.hitRateOpen.toFixed(2),
        r.metrics.score.toFixed(2),
      ].join(","),
    );
    downloadFile(
      `the-spread-discovery-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...lines].join("\n"),
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6">
      {/* Aggregate stats */}
      {data && (
        <dl className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
          <Stat label="Stocks benchmarked" value={String(data.aggregate.nStocks)} />
          <Stat label="Episodes analyzed" value={String(data.aggregate.totalEpisodes)} />
          <Stat
            label="Median error vs open"
            value={`${data.aggregate.medianMaeOpenPct.toFixed(2)}%`}
            accent
          />
          <Stat
            label="Avg. directional hit-rate"
            value={`${data.aggregate.avgHitRateOpen.toFixed(0)}%`}
            accent
          />
        </dl>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-5">
        <span className="text-sm text-faint">
          {data
            ? `Updated ${formatRelativeTime(data.updatedAt)} · last ~3 months · sorted by ${labelFor(sortKey)}`
            : "Crunching months of overnight sessions…"}
        </span>
        <div className="flex items-center gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticker or name…"
            aria-label="Search stocks"
            className="w-44 border-0 border-b border-hairline-strong bg-transparent py-1 text-base outline-none placeholder:text-faint focus:border-ink sm:w-56"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="cursor-pointer text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-discount/30 bg-discount-wash px-4 py-2 text-sm text-discount">
          Couldn’t load the benchmark ({error}).
        </div>
      )}

      {!data && !error ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <p className="py-16 text-center italic text-muted">No stocks match.</p>
      ) : (
        <table className="w-full border-collapse text-[1.05rem]">
          <thead>
            <tr className="border-b border-hairline-strong">
              <th className="py-2 pr-4 text-left">
                <span className="eyebrow">Stock</span>
              </th>
              <Th label="Episodes" k="nEpisodes" sortKey={sortKey} setSortKey={setSortKey} />
              <Th label="Err vs open" k="maeOpenPct" sortKey={sortKey} setSortKey={setSortKey} />
              <Th label="Hit-rate" k="hitRateOpen" sortKey={sortKey} setSortKey={setSortKey} />
              <Th label="Discovery score" k="score" sortKey={sortKey} setSortKey={setSortKey} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.symbol}
                className="border-b border-hairline transition-colors hover:bg-paper"
              >
                <td className="py-3 pr-4">
                  <Link href={`/asset/${r.symbol}`} className="flex items-baseline gap-2">
                    <span className="w-6 text-right text-sm text-faint tabular-nums">
                      {i + 1}
                    </span>
                    <span className="font-semibold tracking-tight underline-offset-4 hover:underline">
                      {r.symbol}
                    </span>
                    <span className="truncate text-sm text-muted">{r.name}</span>
                  </Link>
                </td>
                <td className="nums py-3 text-right tabular-nums text-muted">
                  {r.metrics.nEpisodes}
                </td>
                <td className="nums py-3 text-right tabular-nums">
                  {r.metrics.maeOpenPct.toFixed(3)}%
                </td>
                <td className="nums py-3 text-right tabular-nums">
                  {r.metrics.hitRateOpen.toFixed(0)}%
                </td>
                <td className="nums py-3 text-right text-lg tabular-nums">
                  <ScoreChip score={r.metrics.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-6 text-sm text-faint">
        Off-hours price taken from Hyperliquid 15-minute candles (its finest
        interval with full history; within ~0.1% of 1-minute). “Err vs open” is
        the mean absolute % difference between Hyperliquid’s pre-bell price and
        the actual regular-session open. Score = ½ hit-rate + ½ accuracy.
        Informational only — not investment advice.
      </p>
    </div>
  );
}

function labelFor(k: SortKey): string {
  return k === "maeOpenPct"
    ? "error vs open"
    : k === "hitRateOpen"
      ? "hit-rate"
      : k === "nEpisodes"
        ? "episodes"
        : "score";
}

function Th({
  label,
  k,
  sortKey,
  setSortKey,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
}) {
  return (
    <th className="py-2 text-right font-normal">
      <button
        type="button"
        onClick={() => setSortKey(k)}
        className="eyebrow inline-flex items-center hover:text-ink"
      >
        {label}
        <span className={`ml-1 ${sortKey === k ? "text-ink" : "text-faint opacity-40"}`}>
          {sortKey === k ? "•" : "↕"}
        </span>
      </button>
    </th>
  );
}

function ScoreChip({ score }: { score: number }) {
  const tone =
    score >= 95 ? "text-premium" : score >= 80 ? "text-ink" : "text-discount";
  return <span className={tone}>{score.toFixed(1)}</span>;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background px-4 py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className={`nums mt-1 text-xl tabular-nums ${accent ? "text-premium" : "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 py-4" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-4 w-48 rounded bg-hairline" />
          <div className="h-4 w-24 rounded bg-hairline" />
        </div>
      ))}
    </div>
  );
}
