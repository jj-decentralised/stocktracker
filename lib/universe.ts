// Curated mapping of Hyperliquid HIP-3 stock perps -> traditional-market tickers.
//
// Hyperliquid lists stocks as builder-deployed perps under the "xyz" perp dex,
// using symbols like "xyz:AAPL". We compare those against the real-world price
// from Yahoo Finance.
//
// v1 scope: US-listed, USD-denominated single-name equities that map 1:1 to a
// Yahoo ticker. Deliberately excluded:
//   - Commodities / FX / rates: GOLD, SILVER, PLATINUM, PALLADIUM, COPPER,
//     ALUMINIUM, CL, BRENTOIL, NATGAS, TTF, CORN, WHEAT, URANIUM, DXY, EUR,
//     GBP, JPY, KRW  (not stocks)
//   - Indices: SP500, JP225, NIFTY, IBOV, KR200, XYZ100, VIX, VOL
//   - ETFs: XLE, EWJ, EWT, EWY, EWZ, URNM
//   - Non-USD international (currency mismatch vs HL's USD pricing — a future
//     FX-conversion enhancement): HYUNDAI, SOFTBANK, SMSN, SKHX, KIOXIA
//   - Private / synthetic with no public quote: SPCX, H100, DRAM, MINIMAX,
//     PURRDAT, QNT
//
// The dashboard only renders entries that ALSO appear in the live HL universe,
// so the list self-prunes if Hyperliquid delists an asset.

/** Hyperliquid perp dex that hosts the tokenized stock perps. */
export const HL_PERP_DEX = "xyz";

export interface StockMeta {
  /** Bare ticker as used on both venues (Yahoo symbol == HL symbol here). */
  symbol: string;
  /** Company name for display. */
  name: string;
}

export const STOCKS: StockMeta[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "ARM", name: "Arm Holdings" },
  { symbol: "ASML", name: "ASML Holding" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "BABA", name: "Alibaba" },
  { symbol: "BB", name: "BlackBerry" },
  { symbol: "BIRD", name: "Allbirds" },
  { symbol: "BX", name: "Blackstone" },
  { symbol: "CBRS", name: "Ceribell" },
  { symbol: "COIN", name: "Coinbase" },
  { symbol: "COST", name: "Costco" },
  { symbol: "CRCL", name: "Circle Internet Group" },
  { symbol: "CRWV", name: "CoreWeave" },
  { symbol: "DELL", name: "Dell Technologies" },
  { symbol: "DKNG", name: "DraftKings" },
  { symbol: "EBAY", name: "eBay" },
  { symbol: "GME", name: "GameStop" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "HIMS", name: "Hims & Hers Health" },
  { symbol: "HOOD", name: "Robinhood Markets" },
  { symbol: "IBM", name: "IBM" },
  { symbol: "INTC", name: "Intel" },
  { symbol: "LLY", name: "Eli Lilly" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "MRVL", name: "Marvell Technology" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "MSTR", name: "Strategy (MicroStrategy)" },
  { symbol: "MU", name: "Micron Technology" },
  { symbol: "NBIS", name: "Nebius Group" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "NOW", name: "ServiceNow" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "ORCL", name: "Oracle" },
  { symbol: "PLTR", name: "Palantir Technologies" },
  { symbol: "RIVN", name: "Rivian Automotive" },
  { symbol: "RKLB", name: "Rocket Lab" },
  { symbol: "SNDK", name: "SanDisk" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "TSM", name: "Taiwan Semiconductor" },
  { symbol: "USAR", name: "USA Rare Earth" },
  { symbol: "ZM", name: "Zoom Communications" },
];

const BY_SYMBOL = new Map(STOCKS.map((s) => [s.symbol, s]));

/** Convert a bare ticker to its Hyperliquid coin id, e.g. "AAPL" -> "xyz:AAPL". */
export function toHlSymbol(symbol: string): string {
  return `${HL_PERP_DEX}:${symbol}`;
}

/** Convert a Hyperliquid coin id back to a bare ticker, e.g. "xyz:AAPL" -> "AAPL". */
export function fromHlSymbol(coin: string): string {
  const idx = coin.indexOf(":");
  return idx === -1 ? coin : coin.slice(idx + 1);
}

export function getStockMeta(symbol: string): StockMeta | undefined {
  return BY_SYMBOL.get(symbol);
}
