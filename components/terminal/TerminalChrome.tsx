import Link from "next/link";
import styles from "./Terminal.module.css";

export function TerminalHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="/">Market</Link>
          </li>
          <li>
            <Link href="/discovery">Indices</Link>
          </li>
          <li>
            <a href="#">News</a>
          </li>
          <li>
            <a href="#">Portfolio</a>
          </li>
        </ul>
      </nav>
      <div className={`${styles.textMd} ${styles.brand}`}>INDEX</div>
    </header>
  );
}

export function MarketBanner() {
  return (
    <div className={styles.marketBanner}>
      <div>
        <div className={styles.statusDot} />
        <div className={styles.textXs}>
          Market Open
          <br />
          16.03 — 22:00
        </div>
      </div>
      <div className={styles.heroTitle}>
        <h1 className={styles.textLg}>
          Equities Overview,
          <br />
          Nasdaq Q4 2024
        </h1>
      </div>
      <div className={styles.textSm}>
        Real-time aggregate data across global exchanges. This terminal provides
        high-density visual tracking for active volatility windows. Data
        refreshes every 250ms. Use the modular grid to analyze price action and
        volume trajectory.
        <br />
        <br />
        <a href="#" className={styles.textXs} style={{ color: "black" }}>
          View Global Metrics
        </a>
      </div>
    </div>
  );
}

export function TerminalFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.textXs}>
        Index © All data provided by exchange partners.
      </div>
      <nav>
        <ul>
          <li>
            <a href="#" className={styles.textXs}>
              Twitter
            </a>
          </li>
          <li>
            <a href="#" className={styles.textXs}>
              Terminal API
            </a>
          </li>
          <li>
            <a href="#" className={styles.textXs}>
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
