import styles from "./Terminal.module.css";
import { TICKER_ITEMS } from "./stocks";

export function TickerTape() {
  // Duplicate the items so the marquee loops seamlessly.
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className={styles.tickerTape}>
      <div className={styles.tickerInner}>
        {items.map((it, i) => (
          <div className={styles.tickerItem} key={`${it.symbol}-${i}`}>
            {it.symbol} <span>{it.change}</span> —
          </div>
        ))}
      </div>
    </div>
  );
}
