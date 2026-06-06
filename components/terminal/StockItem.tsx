import Link from "next/link";
import styles from "./Terminal.module.css";
import type { TerminalCard } from "./stocks";

export function StockItem({ card }: { card: TerminalCard }) {
  return (
    <article className={styles.stockItem}>
      <div className={styles.stockInfo}>
        <div className={styles.indexNumber}>{card.index}</div>
        <div>
          <div className={styles.textLg}>{card.symbol}</div>
          <div className={styles.textSm}>{card.name}</div>
        </div>
        <div className={styles.metaData}>
          <div className={styles.metaBlock}>
            <div className={styles.textXs}>{card.metaLeftLabel}</div>
            <div className={styles.textSm}>{card.metaLeftValue}</div>
          </div>
          <div className={styles.metaBlock}>
            <div className={styles.textXs}>{card.metaRightLabel}</div>
            <div className={styles.textSm}>{card.metaRightValue}</div>
          </div>
        </div>
      </div>

      <div className={styles.stockVisual}>
        <div className={styles.priceLarge}>{card.price.toFixed(2)}</div>
        <div
          className={`${styles.textXs} ${
            card.direction === "up" ? styles.up : styles.down
          }`}
        >
          {card.changeText}
        </div>
        <div className={styles.chartContainer}>
          <svg
            className={styles.sparkline}
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
          >
            <path d={card.path} />
          </svg>
        </div>
        <Link href={`/asset/${card.symbol}`} className={styles.btnAction}>
          Detailed Analysis
        </Link>
      </div>
    </article>
  );
}
