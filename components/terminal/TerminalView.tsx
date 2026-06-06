"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Inter } from "next/font/google";
import styles from "./Terminal.module.css";
import { TerminalHeader, MarketBanner, TerminalFooter } from "./TerminalChrome";
import { TickerTape } from "./TickerTape";
import { StockItem } from "./StockItem";
import {
  TERMINAL_STOCKS,
  initialCards,
  pointsToSparklinePath,
  type TerminalCard,
} from "./stocks";
import { hlSocket } from "@/lib/hlSocket";
import { formatCompact } from "@/lib/format";
import type { SpreadsResponse, HistoryResponse } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  display: "swap",
});

// The curated index keeps the design's four names, ordering and index numbers.
const CONFIG = TERMINAL_STOCKS.map((s) => ({
  index: s.index,
  symbol: s.symbol,
  name: s.name,
}));

interface Meta {
  prevDay: number | null;
  volValue: string;
  oiValue: string;
  path: string;
}

function changeText(price: number, prevDay: number | null): {
  text: string;
  direction: "up" | "down";
} {
  if (prevDay === null || !Number.isFinite(prevDay) || prevDay === 0) {
    return { text: "—", direction: "up" };
  }
  const abs = price - prevDay;
  const pct = (abs / prevDay) * 100;
  const sign = abs >= 0 ? "+" : "";
  return {
    text: `${sign}${abs.toFixed(2)} (${pct.toFixed(2)}%)`,
    direction: abs >= 0 ? "up" : "down",
  };
}

export function TerminalView() {
  const [cards, setCards] = useState<TerminalCard[]>(() => initialCards());
  const metaRef = useRef<Map<string, Meta>>(new Map());

  const buildCard = useCallback(
    (symbol: string, price: number): TerminalCard => {
      const cfg = CONFIG.find((c) => c.symbol === symbol)!;
      const meta = metaRef.current.get(symbol);
      const { text, direction } = changeText(price, meta?.prevDay ?? null);
      return {
        index: cfg.index,
        symbol: cfg.symbol,
        name: cfg.name,
        price,
        changeText: text,
        direction,
        metaLeftLabel: "Vol",
        metaLeftValue: meta?.volValue ?? "—",
        metaRightLabel: "OI",
        metaRightValue: meta?.oiValue ?? "—",
        path: meta?.path ?? "",
      };
    },
    [],
  );

  // Load real data: latest prices/volume/OI from /api/spreads, sparkline paths
  // from /api/history. Then live-stream the price via the Hyperliquid socket.
  useEffect(() => {
    let cancelled = false;
    const symbols = CONFIG.map((c) => c.symbol);

    (async () => {
      try {
        const [spreadsRes, ...histRes] = await Promise.all([
          fetch("/api/spreads?category=stocks", { cache: "no-store" }),
          ...symbols.map((s) =>
            fetch(`/api/history?symbol=${s}&category=stocks&range=1D`, {
              cache: "no-store",
            }),
          ),
        ]);

        const spreads = (await spreadsRes.json()) as SpreadsResponse;
        const bySymbol = new Map(spreads.rows.map((r) => [r.symbol, r]));

        const paths = await Promise.all(
          histRes.map(async (r) => {
            try {
              const h = (await r.json()) as HistoryResponse;
              return pointsToSparklinePath(h.hl.map((p) => p.value));
            } catch {
              return "";
            }
          }),
        );

        if (cancelled) return;

        symbols.forEach((sym, i) => {
          const row = bySymbol.get(sym);
          metaRef.current.set(sym, {
            prevDay: row?.hlPrevDay ?? null,
            volValue:
              row?.hlDayVolume != null
                ? `$${formatCompact(row.hlDayVolume)}`
                : "—",
            oiValue: row?.openInterest != null ? formatCompact(row.openInterest) : "—",
            path: paths[i] || "",
          });
        });

        setCards(
          symbols.map((sym) => {
            const row = bySymbol.get(sym);
            const price = row?.hlPrice ?? hlSocket.getLatest(sym) ?? 0;
            return buildCard(sym, price);
          }),
        );
      } catch {
        /* keep the static design values on failure */
      }
    })();

    // Live price stream.
    const unsubs = symbols.map((sym) =>
      hlSocket.subscribe(sym, (price) => {
        if (cancelled) return;
        setCards((prev) =>
          prev.map((c) => (c.symbol === sym ? buildCard(sym, price) : c)),
        );
      }),
    );

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [buildCard]);

  return (
    <div className={`${styles.root} ${inter.className}`}>
      <TerminalHeader />
      <MarketBanner />
      <TickerTape />
      <section className={styles.stockGrid}>
        {cards.map((card) => (
          <StockItem key={card.symbol} card={card} />
        ))}
      </section>
      <TerminalFooter />
    </div>
  );
}
