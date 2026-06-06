# The Spread — Hyperliquid × Wall Street

A plain-white, editorial dashboard that tracks the **spread** between tokenized
stock perpetuals on **Hyperliquid** and their **traditional-market** price.

Hyperliquid trades 24/7; US equity markets do not. So whenever Wall Street is
closed (nights, weekends, holidays) the on-chain price keeps moving while the
last cash-market print sits still — and the two drift apart. **The Spread**
surfaces that gap, live, to the cent.

The home screen is a **grid of live overlay charts** — one per asset — each
plotting the **Hyperliquid price (solid)** against the **Wall Street price
(dashed)**. The vertical gap between the two lines *is* the spread, and each card
shows the live spread % (green premium / red discount). Hyperliquid prices stream
in **real time over a WebSocket**, so the lines and badges tick live.

Click any card to open a **detail page** (`/asset/SYMBOL`) with a large
interactive overlay chart: a crosshair readout (Hyperliquid price, Wall Street
price, and the spread at the hovered moment), a live stat strip, and a
**1H / 1D / 5D / 1M** range toggle.

Stocks are the default view; **Indices**, **ETFs** and **Commodities** are
available via the category tabs. You can search, export the current set to
**CSV/JSON**, and your category/sort preferences are remembered across visits.

### Real-time data model
- **Hyperliquid** prices stream live from the public WebSocket
  (`wss://api.hyperliquid.xyz/ws`, `allMids` on the `xyz` perp dex) — sub-second,
  24/7. A single shared socket fans out to every chart.
- **Wall Street** prices come from Yahoo Finance (server-side), seeded as an
  intraday history line and refreshed periodically. They are **not** tick-by-tick
  and go flat when the market is closed — which is exactly when the spread is most
  interesting. (A paid feed like Polygon/Finnhub could make the stock side
  real-time too; easy to add behind the same interface.)

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
- [lightweight-charts](https://tradingview.github.io/lightweight-charts/) v5 for the overlay charts
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

## Configuration (optional — QuickNode)

The app runs with **no configuration** (public Hyperliquid API + Yahoo). To route
Hyperliquid through a QuickNode endpoint (better rate limits / reliability), set
these env vars — see `.env.example`:

| Variable | Where it's used | Example |
| --- | --- | --- |
| `HL_INFO_URL` | Server-side Hyperliquid `info` calls (mids, contexts, candles) | `https://<endpoint>.hyperliquid-mainnet.quiknode.pro/<TOKEN>/info` |
| `NEXT_PUBLIC_HL_WS_URL` | Browser live-price WebSocket | `wss://<endpoint>.hyperliquid-mainnet.quiknode.pro/<TOKEN>` |

- **Local:** copy `.env.example` → `.env.local`, paste your endpoint(s), restart `npm run dev`.
- **Vercel:** Project → **Settings → Environment Variables** → add the same keys → **Redeploy**.

> **Granularity note.** QuickNode improves rate limits and reliability, but it
> proxies the *same* Hyperliquid data, so historical candle depth is unchanged
> (Hyperliquid retains ~3 days of 1m, ~2 weeks of 5m, and full history at 15m).
> Live Hyperliquid prices are already tick-level via WebSocket. The non-real-time
> side is **Wall Street** (Yahoo), which QuickNode does not affect — making the
> equities side tick-by-tick would require a real-time stock feed (Polygon /
> Finnhub / Alpaca) behind the same interface.

## Project layout

```
app/
  layout.tsx              # EB Garamond + metadata
  page.tsx                # masthead + dashboard + footer
  globals.css             # white-aesthetic design tokens
  api/spreads/route.ts    # combines Hyperliquid + Yahoo, computes spreads
  api/history/route.ts    # HL candle + Yahoo intraday series for overlay charts
  asset/[symbol]/page.tsx # per-asset detail page
components/                # board, asset cards, overlay chart, detail, tabs, badges
lib/
  hyperliquid.ts           # HL info API client (mids, ctxs, candle points)
  hlSocket.ts              # client-side HL WebSocket manager (live prices)
  yahoo.ts                 # Yahoo client (quote + intraday series)
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
