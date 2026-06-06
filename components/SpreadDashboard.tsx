"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpreadsResponse } from "@/lib/types";
import type { Category } from "@/lib/universe";
import { isCategory } from "@/lib/universe";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { CategoryTabs } from "./CategoryTabs";
import { AssetCard, type AssetCardData } from "./AssetCard";
import { sortRows, type SortKey, type SortDir } from "./sorting";
import { formatRelativeTime, formatPct } from "@/lib/format";
import { rowsToCsv, rowsToJson, downloadFile } from "@/lib/export";
import { hlSocket } from "@/lib/hlSocket";

const REFRESH_MS = 15_000;
const STORAGE_KEY = "the-spread:prefs:v2";

interface Prefs {
  category: Category;
  sortKey: SortKey;
  sortDir: SortDir;
}

export function SpreadDashboard() {
  const [category, setCategory] = useState<Category>("stocks");
  const [data, setData] = useState<SpreadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("absSpreadPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [, forceTick] = useState(0);
  const activeCategory = useRef<Category>("stocks");

  // Start the shared live price socket once.
  useEffect(() => {
    hlSocket.start();
  }, []);

  // Load persisted preferences once on mount.
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
      if (activeCategory.current !== cat) return;
      setData(json);
      setError(null);
    } catch (err) {
      if (activeCategory.current !== cat) return;
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      if (activeCategory.current === cat) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    activeCategory.current = category;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state set only after async fetch resolves.
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
  }, [fetchData, category, prefsLoaded]);

  // Keep the "updated Xs ago" label live.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCategory = useCallback(
    (c: Category) => {
      if (c === category) return;
      activeCategory.current = c;
      setLoading(true);
      setData(null);
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
      const name = `the-spread-${category}-${stamp}.${kind}`;
      const content = kind === "csv" ? rowsToCsv(rows) : rowsToJson(rows);
      const mime = kind === "csv" ? "text/csv;charset=utf-8" : "application/json";
      downloadFile(name, content, mime);
    },
    [rows, category],
  );

  const cards: AssetCardData[] = rows.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    unit: r.unit,
    tradPrice: r.tradPrice,
    seedHlPrice: r.hlPrice,
    seedSpreadPct: r.spreadPct,
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-6">
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
              className="cursor-pointer underline-offset-4 hover:text-ink hover:underline"
            >
              CSV
            </button>
            <span className="text-hairline-strong">·</span>
            <button
              type="button"
              onClick={() => handleExport("json")}
              className="cursor-pointer underline-offset-4 hover:text-ink hover:underline"
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

      {error && (
        <div className="mt-4 border border-discount/30 bg-discount-wash px-4 py-2 text-sm text-discount">
          Couldn’t refresh data ({error}). Showing the last available numbers.
        </div>
      )}

      {/* Live overlay chart grid */}
      {loading && !data ? (
        <SkeletonGrid />
      ) : cards.length === 0 ? (
        <p className="py-16 text-center italic text-muted">
          {query ? `No assets match “${query}”.` : "No assets available."}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <AssetCard key={c.symbol} data={c} category={category} />
          ))}
        </div>
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

function SkeletonGrid() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="border border-hairline p-4">
          <div className="h-4 w-32 rounded bg-hairline" />
          <div className="mt-3 h-[120px] w-full animate-pulse rounded bg-paper" />
        </div>
      ))}
    </div>
  );
}
