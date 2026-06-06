"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OverlayChart } from "./OverlayChart";
import { ValueDelta } from "./ValueDelta";
import { hlSocket } from "@/lib/hlSocket";
import { computeSpread } from "@/lib/spread";
import { formatPrice, formatPct } from "@/lib/format";
import type { Category, Unit } from "@/lib/universe";
import type { HistoryResponse, Point } from "@/lib/types";

export interface AssetCardData {
  symbol: string;
  name: string;
  unit: Unit;
  /** Latest traditional price from the board (for live spread vs streamed HL). */
  tradPrice: number | null;
  /** Seed values shown until the socket ticks / history loads. */
  seedHlPrice: number | null;
  seedSpreadPct: number | null;
}

export function AssetCard({
  data,
  category,
}: {
  data: AssetCardData;
  category: Category;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  const [hist, setHist] = useState<{ hl: Point[]; trad: Point[] } | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(data.seedHlPrice);

  // Lazy-mount: only fetch history + render the chart once scrolled into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fetch seed history when first visible.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/history?symbol=${data.symbol}&category=${category}&range=5D`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as HistoryResponse;
        if (!cancelled) setHist({ hl: json.hl, trad: json.trad });
      } catch {
        /* chart will stay in skeleton state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, data.symbol, category]);

  // Live HL price stream.
  useEffect(() => {
    const unsub = hlSocket.subscribe(data.symbol, (price) => setLivePrice(price));
    return unsub;
  }, [data.symbol]);

  const effectiveHl = livePrice ?? data.seedHlPrice;
  const live = computeSpread(effectiveHl, data.tradPrice);
  const spreadPct = live.pct ?? data.seedSpreadPct;
  const direction =
    live.direction !== "unknown"
      ? live.direction
      : spreadPct === null
        ? "unknown"
        : spreadPct > 0
          ? "premium"
          : "discount";

  return (
    <Link
      ref={ref}
      href={`/asset/${data.symbol}?category=${category}`}
      className="group block border border-hairline p-4 transition-colors hover:border-hairline-strong hover:bg-paper"
    >
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2 overflow-hidden">
          <span className="font-semibold tracking-tight">{data.symbol}</span>
          <span className="truncate text-sm text-muted">{data.name}</span>
        </div>
        <div className="nums text-right text-lg tabular-nums">
          <ValueDelta text={formatPct(spreadPct)} direction={direction} />
        </div>
      </div>

      <div className="mt-1 flex items-baseline justify-between text-xs text-faint">
        <span className="nums tabular-nums">
          HL {formatPrice(effectiveHl, data.unit)}
        </span>
        <span className="nums tabular-nums">
          WS {formatPrice(data.tradPrice, data.unit)}
        </span>
      </div>

      <div className="mt-2">
        {hist && (hist.hl.length > 0 || hist.trad.length > 0) ? (
          <OverlayChart
            hl={hist.hl}
            trad={hist.trad}
            livePrice={livePrice ?? undefined}
            compact
            height={120}
          />
        ) : (
          <div className="h-[120px] w-full animate-pulse rounded bg-paper" />
        )}
      </div>
    </Link>
  );
}
