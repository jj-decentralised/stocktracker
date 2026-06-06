# The Spread — Hyperliquid × Wall Street

A plain-white, editorial dashboard that tracks the **spread** between tokenized
stock perpetuals on **Hyperliquid** and their **traditional-market** price.

Hyperliquid trades 24/7; US equity markets do not. So whenever Wall Street is
closed (nights, weekends, holidays) the on-chain price keeps moving while the
last cash-market print sits still — and the two drift apart. **The Spread**
surfaces that gap, live, to the cent.

For every asset it shows:

- the live **Hyperliquid** price (and its 24h move),
- the latest **Wall Street** price (and previous close),
- the **spread** in absolute terms and percent, labelled **premium**
  (Hyperliquid trades above) or **discount** (Hyperliquid trades below),
- a **24h sparkline** of the Hyperliquid price,
- Hyperliquid open interest, and an overall market-status badge.

Stocks are the default view; **Indices**, **ETFs** and **Commodities** are
available via the category tabs. You can sort by any column, search, export the
current table to **CSV/JSON**, and your category/sort preferences are remembered
across visits.

## What "spread" means here

```
spread $  = hyperliquid_price − wall_street_price
spread %  = spread $ / wall_street_price × 100
```

- **Premium** (green ▲): Hyperliquid is pricing the stock *above* the cash market.
- **Discount** (red ▼): Hyperliquid is pricing it *below* the cash market.

A large spread is usually a sign that the cash market is closed (the Wall Street
figure is stale) — the price timestamp and market-status badge make that explicit.

## Data sources

- **Hyperliquid** — public `info` API (`https://api.hyperliquid.xyz/info`), no
  key required. Markets are HIP-3 builder-deployed perps under the `xyz` perp
  dex (symbols like `xyz:AAPL`). We read `allMids` for live mids,
  `metaAndAssetCtxs` for mark/oracle/prev-day prices and open interest, and
  `candleSnapshot` (hourly) for the 24h sparklines.
- **Traditional market** — Yahoo Finance chart endpoint
  (`query1.finance.yahoo.com/v8/finance/chart`), no key required. Called only
  from the server (avoids CORS, adds a browser User-Agent), with pre/post-market
  prices when available.

Both upstreams are combined and cached server-side in the `/api/spreads` route,
which returns ready-to-render rows.

## Scope

Coverage is a curated, unit-consistent mapping (see `lib/universe.ts`):

- **Stocks** — US-listed, USD single-name equities (Yahoo ticker == HL ticker).
- **Indices** — S&P 500, Nikkei 225, Nifty 50, Bovespa, VIX (compared in index
  points).
- **ETFs** — XLE, EWJ, EWY, EWZ, EWT, URNM.
- **Commodities** — gold, silver, platinum, palladium, copper, WTI, Brent,
  natural gas (Yahoo continuous futures, in USD).

The dashboard only renders symbols that are also live on Hyperliquid, so the list
self-prunes. Deliberately excluded for correctness: FX (ambiguous quote
conventions), grains (Yahoo quotes them in US cents), non-USD international
single names (currency mismatch), and venue-native/private synthetics with no
clean public quote.

## Tech

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) via `next/font`
- No database, no API keys — runs out of the box.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

## Project layout

```
app/
  layout.tsx              # EB Garamond + metadata
  page.tsx                # masthead + dashboard + footer
  globals.css             # white-aesthetic design tokens
  api/spreads/route.ts    # combines Hyperliquid + Yahoo, computes spreads
  api/sparklines/route.ts # 24h Hyperliquid close series per asset
components/                # dashboard, table, cards, tabs, sparkline, badges
lib/
  hyperliquid.ts           # HL info API client (mids, ctxs, candles)
  yahoo.ts                 # Yahoo chart client (+ concurrency-limited batch)
  universe.ts              # curated asset mapping + categories
  spread.ts                # spread / % math
  marketHours.ts           # US session status
  export.ts                # CSV/JSON download helpers
  cache.ts, format.ts, types.ts
```

## Disclaimer

For informational purposes only. **Not investment advice.** Prices may be
delayed or inaccurate, and traditional-market quotes can be stale outside of
regular trading hours.
