"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpreadsResponse } from "@/lib/types";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { SpreadTable } from "./SpreadTable";
import { SpreadCard } from "./SpreadCard";
import { sortRows, defaultDir, type SortKey, type SortDir } from "./sorting";
import { formatRelativeTime, formatPct } from "@/lib/format";

const REFRESH_MS = 15_000;

export function SpreadDashboard() {
  const [data, setData] = useState<SpreadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("absSpreadPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [, forceTick] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/spreads", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as SpreadsResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling (paused while the tab is hidden). `fetchData` only
  // sets state asynchronously (after the fetch resolves), so this does not
  // trigger the cascading-render problem the lint rule guards against.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchData sets state only after the async fetch resolves, not synchronously.
    void fetchData();
    const interval = setInterval(() => {
      if (!document.hidden) fetchData();
    }, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchData]);

  // Re-render once a second so the "updated Xs ago" label stays live.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir(defaultDir(key));
      return key;
    });
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
    return sortRows(filtered, sortKey, sortDir);
  }, [data, query, sortKey, sortDir]);

  const stats = useMemo(() => {
    if (!data || data.rows.length === 0) return null;
    const withSpread = data.rows.filter((r) => r.spreadPct !== null);
    if (withSpread.length === 0) return null;
    const widest = withSpread.reduce((a, b) =>
      Math.abs(b.spreadPct!) > Math.abs(a.spreadPct!) ? b : a,
    );
    const avgAbs =
      withSpread.reduce((s, r) => s + Math.abs(r.spreadPct!), 0) /
      withSpread.length;
    const premiums = withSpread.filter((r) => r.direction === "premium").length;
    return {
      count: data.rows.length,
      widest,
      avgAbs,
      premiums,
      discounts: withSpread.length - premiums,
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-[1120px] px-6">
      {/* Status + controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline py-5">
        <div className="flex items-center gap-5 text-sm">
          {data && <MarketStatusBadge status={data.marketStatus} />}
          <span className="text-faint">
            {data
              ? `Updated ${formatRelativeTime(data.updatedAt)}`
              : loading
                ? "Loading…"
                : ""}
          </span>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ticker or company…"
          aria-label="Search stocks"
          className="w-full max-w-xs rounded-none border-0 border-b border-hairline-strong bg-transparent py-1 text-base outline-none placeholder:text-faint focus:border-ink"
        />
      </div>

      {/* Summary statistics */}
      {stats && (
        <dl className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
          <Stat label="Stocks tracked" value={String(stats.count)} />
          <Stat
            label="Avg. abs. spread"
            value={formatPct(stats.avgAbs, 2).replace("+", "")}
          />
          <Stat
            label="Widest spread"
            value={`${stats.widest.symbol} ${formatPct(stats.widest.spreadPct)}`}
            tone={stats.widest.direction}
          />
          <Stat
            label="Premium / discount"
            value={`${stats.premiums} / ${stats.discounts}`}
          />
        </dl>
      )}

      {/* Error banner — keeps last good data visible underneath */}
      {error && (
        <div className="mt-4 border border-discount/30 bg-discount-wash px-4 py-2 text-sm text-discount">
          Couldn’t refresh data ({error}). Showing the last available numbers.
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <p className="py-16 text-center italic text-muted">
          No stocks match “{query}”.
        </p>
      ) : (
        <>
          <div className="mt-2 hidden md:block">
            <SpreadTable
              rows={rows}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </div>
          <div className="md:hidden">
            {rows.map((r) => (
              <SpreadCard key={r.symbol} row={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "premium" | "discount" | "flat" | "unknown";
}) {
  const toneClass =
    tone === "premium"
      ? "text-premium"
      : tone === "discount"
        ? "text-discount"
        : "text-ink";
  return (
    <div className="bg-background px-4 py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className={`nums mt-1 text-xl tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="mt-6 animate-pulse space-y-3" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-hairline" />
          <div className="h-4 w-24 rounded bg-hairline" />
        </div>
      ))}
    </div>
  );
}
