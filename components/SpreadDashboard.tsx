"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpreadsResponse, SparklineResponse } from "@/lib/types";
import type { Category } from "@/lib/universe";
import { isCategory } from "@/lib/universe";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { CategoryTabs } from "./CategoryTabs";
import { SpreadTable } from "./SpreadTable";
import { SpreadCard } from "./SpreadCard";
import { sortRows, defaultDir, type SortKey, type SortDir } from "./sorting";
import { formatRelativeTime, formatPct } from "@/lib/format";
import { rowsToCsv, rowsToJson, downloadFile } from "@/lib/export";

const REFRESH_MS = 15_000;
const SPARK_REFRESH_MS = 5 * 60_000;
const STORAGE_KEY = "the-spread:prefs:v1";

interface Prefs {
  category: Category;
  sortKey: SortKey;
  sortDir: SortDir;
}

export function SpreadDashboard() {
  const [category, setCategory] = useState<Category>("stocks");
  const [data, setData] = useState<SpreadsResponse | null>(null);
  const [series, setSeries] = useState<Record<string, number[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("absSpreadPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [, forceTick] = useState(0);

  // Load persisted preferences once on mount (client-only to avoid SSR mismatch).
  // Hydrating state from localStorage on mount is an intentional, one-shot sync.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Prefs>;
        if (p.category && isCategory(p.category)) setCategory(p.category);
        if (p.sortKey) setSortKey(p.sortKey);
        if (p.sortDir === "asc" || p.sortDir === "desc") setSortDir(p.sortDir);
      }
    } catch {
      /* ignore malformed prefs */
    }
    setPrefsLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist preferences whenever they change (after initial load).
  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ category, sortKey, sortDir } satisfies Prefs),
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [prefsLoaded, category, sortKey, sortDir]);

  const fetchData = useCallback(async (cat: Category) => {
    try {
      const res = await fetch(`/api/spreads?category=${cat}`, {
        cache: "no-store",
      });
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

  const fetchSparklines = useCallback(async (cat: Category) => {
    try {
      const res = await fetch(`/api/sparklines?category=${cat}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as SparklineResponse;
      setSeries(json.series ?? {});
    } catch {
      /* sparklines are optional */
    }
  }, []);

  // Prices: initial load + polling (paused while the tab is hidden).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set only after the async fetch resolves.
    void fetchData(category);
    const interval = setInterval(() => {
      if (!document.hidden) fetchData(category);
    }, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) fetchData(category);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchData, category]);

  // Sparklines: refresh on category change, then every few minutes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set only after the async fetch resolves.
    void fetchSparklines(category);
    const interval = setInterval(() => {
      if (!document.hidden) fetchSparklines(category);
    }, SPARK_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchSparklines, category]);

  // Keep the "updated Xs ago" label live.
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

  const handleCategory = useCallback(
    (c: Category) => {
      if (c === category) return;
      setLoading(true);
      setData(null);
      setSeries({});
      setCategory(c);
    },
    [category],
  );

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

  const handleExport = useCallback(
    (kind: "csv" | "json") => {
      if (rows.length === 0) return;
      const stamp = new Date().toISOString().slice(0, 10);
      if (kind === "csv") {
        downloadFile(
          `the-spread-${category}-${stamp}.csv`,
          rowsToCsv(rows),
          "text/csv;charset=utf-8",
        );
      } else {
        downloadFile(
          `the-spread-${category}-${stamp}.json`,
          rowsToJson(rows),
          "application/json",
        );
      }
    },
    [rows, category],
  );

  return (
    <div className="mx-auto max-w-[1120px] px-6">
      {/* Category navigation */}
      <div className="border-b border-hairline-strong pt-2">
        <CategoryTabs active={category} onChange={handleCategory} />
      </div>

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
        <div className="flex items-center gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticker or name…"
            aria-label="Search assets"
            className="w-44 max-w-xs rounded-none border-0 border-b border-hairline-strong bg-transparent py-1 text-base outline-none placeholder:text-faint focus:border-ink sm:w-56"
          />
          <div className="flex items-center gap-2 text-sm text-muted">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="hover:text-ink underline-offset-4 hover:underline cursor-pointer"
            >
              CSV
            </button>
            <span className="text-hairline-strong">·</span>
            <button
              type="button"
              onClick={() => handleExport("json")}
              className="hover:text-ink underline-offset-4 hover:underline cursor-pointer"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Summary statistics */}
      {stats && (
        <dl className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
          <Stat label="Assets tracked" value={String(stats.count)} />
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
          {query ? `No assets match “${query}”.` : "No assets available."}
        </p>
      ) : (
        <>
          <div className="mt-2 hidden md:block">
            <SpreadTable
              rows={rows}
              series={series}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </div>
          <div className="md:hidden">
            {rows.map((r) => (
              <SpreadCard key={r.symbol} row={r} series={series[r.symbol]} />
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
