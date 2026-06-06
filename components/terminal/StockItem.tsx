import Link from "next/link";
import styles from "./Terminal.module.css";
import type { TerminalStock } from "./stocks";

export function StockItem({
  stock,
  price,
}: {
  stock: TerminalStock;
  /** Live-updating price (falls back to the static design value). */
  price: number;
}) {
  return (
    <article className={styles.stockItem}>
      <div className={styles.stockInfo}>
        <div className={styles.indexNumber}>{stock.index}</div>
        <div>
          <div className={styles.textLg}>{stock.symbol}</div>
          <div className={styles.textSm}>{stock.name}</div>
        </div>
        <div className={styles.metaData}>
          <div className={styles.metaBlock}>
            <div className={styles.textXs}>Vol</div>
            <div className={styles.textSm}>{stock.vol}</div>
          </div>
          <div className={styles.metaBlock}>
            <div className={styles.textXs}>Cap</div>
            <div className={styles.textSm}>{stock.cap}</div>
          </div>
        </div>
      </div>

      <div className={styles.stockVisual}>
        <div className={styles.priceLarge}>{price.toFixed(2)}</div>
        <div
          className={`${styles.textXs} ${
            stock.direction === "up" ? styles.up : styles.down
          }`}
        >
          {stock.change}
        </div>
        <div className={styles.chartContainer}>
          <svg
            className={styles.sparkline}
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
          >
            <path d={stock.path} />
          </svg>
        </div>
        <Link href={`/asset/${stock.symbol}`} className={styles.btnAction}>
          Detailed Analysis
        </Link>
      </div>
    </article>
  );
}
