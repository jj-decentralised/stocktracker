# The Spread — Hyperliquid × Wall Street

A plain-white, editorial dashboard that tracks the **spread** between tokenized
stock perpetuals on **Hyperliquid** and their **traditional-market** price.

Hyperliquid trades 24/7; US equity markets do not. So whenever Wall Street is
closed (nights, weekends, holidays) the on-chain price keeps moving while the
last cash-market print sits still — and the two drift apart. **The Spread**
surfaces that gap, live, to the cent.

For every stock it shows:

- the live **Hyperliquid** price (and its 24h move),
- the latest **Wall Street** price (and previous close),
- the **spread** in absolute dollars and percent, labelled **premium**
  (Hyperliquid trades above) or **discount** (Hyperliquid trades below),
- Hyperliquid open interest, and an overall market-status badge.

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
  key required. Stocks are HIP-3 builder-deployed perps under the `xyz` perp dex
  (symbols like `xyz:AAPL`). We read `allMids` for live mids and
  `metaAndAssetCtxs` for mark/oracle/prev-day prices and open interest.
- **Traditional market** — Yahoo Finance chart endpoint
  (`query1.finance.yahoo.com/v8/finance/chart`), no key required. Called only
  from the server (avoids CORS, adds a browser User-Agent), with pre/post-market
  prices when available.

Both upstreams are combined and cached server-side in the `/api/spreads` route,
which returns ready-to-render rows.

## Scope

v1 covers US-listed, USD-denominated single-name equities that map 1:1 to a
Yahoo ticker (see `lib/universe.ts`). The dashboard only renders symbols that are
also live on Hyperliquid, so the list self-prunes. Commodities, FX, indices,
ETFs, and non-USD international names are intentionally excluded (the latter due
to currency mismatch — a future FX-conversion enhancement).

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
components/                # dashboard, table, cards, badges, sorting
lib/
  hyperliquid.ts           # HL info API client
  yahoo.ts                 # Yahoo chart client (+ concurrency-limited batch)
  universe.ts              # curated stock mapping
  spread.ts                # spread / % math
  marketHours.ts           # US session status
  cache.ts, format.ts, types.ts
```

## Disclaimer

For informational purposes only. **Not investment advice.** Prices may be
delayed or inaccurate, and traditional-market quotes can be stale outside of
regular trading hours.
