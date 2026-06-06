"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import styles from "./Terminal.module.css";
import { TerminalHeader, MarketBanner, TerminalFooter } from "./TerminalChrome";
import { TickerTape } from "./TickerTape";
import { StockItem } from "./StockItem";
import { TERMINAL_STOCKS } from "./stocks";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  display: "swap",
});

export function TerminalView() {
  // Live price wobble, mirroring the design's 1s interval updater.
  const [prices, setPrices] = useState<number[]>(() =>
    TERMINAL_STOCKS.map((s) => s.price),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) => p + (Math.random() - 0.5) * 0.1),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`${styles.root} ${inter.className}`}>
      <TerminalHeader />
      <MarketBanner />
      <TickerTape />
      <section className={styles.stockGrid}>
        {TERMINAL_STOCKS.map((stock, i) => (
          <StockItem key={stock.symbol} stock={stock} price={prices[i]} />
        ))}
      </section>
      <TerminalFooter />
    </div>
  );
}
