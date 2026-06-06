// Curated mapping of Hyperliquid HIP-3 markets -> traditional-market tickers.
//
// Hyperliquid lists these as builder-deployed perps under the "xyz" perp dex,
// using ids like "xyz:AAPL". We compare each against its real-world price from
// Yahoo Finance. Stocks are the default category; indices, ETFs and commodities
// are opt-in via the category toggle.
//
// Deliberately excluded (correctness over coverage):
//   - FX (EUR/GBP/JPY/KRW): ambiguous quote conventions between venues.
//   - Grains (CORN/WHEAT): Yahoo quotes them in US cents (USX), not dollars.
//   - Non-USD single-name intl (HYUNDAI/SOFTBANK/SMSN/SKHX/KIOXIA): currency
//     mismatch vs Hyperliquid's USD pricing.
//   - Private / synthetic / venue-native (SPCX, H100, DRAM, MINIMAX, PURRDAT,
//     QNT, XYZ100, VOL, KR200, ALUMINIUM, TTF, URANIUM, DXY): no clean,
//     unit-consistent public quote.
//
// The dashboard only renders entries that ALSO appear in the live HL universe,
// so the list self-prunes if Hyperliquid delists an asset.

/** Hyperliquid perp dex that hosts the tokenized markets. */
export const HL_PERP_DEX = "xyz";

export type Category = "stocks" | "indices" | "etfs" | "commodities";

/** How a price should be displayed: USD currency vs raw index points. */
export type Unit = "usd" | "points";

export interface AssetMeta {
  /** Display ticker, e.g. "AAPL" or "GOLD". */
  symbol: string;
  /** Full Hyperliquid coin id, e.g. "xyz:AAPL". */
  hl: string;
  /** Yahoo Finance symbol, e.g. "AAPL", "GC=F", "^GSPC". */
  yahoo: string;
  /** Human-readable name. */
  name: string;
  category: Category;
  unit: Unit;
}

interface SimpleEntry {
  symbol: string;
  name: string;
  /** Yahoo symbol when it differs from the HL ticker. Defaults to `symbol`. */
  yahoo?: string;
}

function build(
  category: Category,
  unit: Unit,
  entries: SimpleEntry[],
): AssetMeta[] {
  return entries.map((e) => ({
    symbol: e.symbol,
    hl: `${HL_PERP_DEX}:${e.symbol}`,
    yahoo: e.yahoo ?? e.symbol,
    name: e.name,
    category,
    unit,
  }));
}

const STOCK_ENTRIES: SimpleEntry[] = [
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

const COMMODITY_ENTRIES: SimpleEntry[] = [
  { symbol: "GOLD", name: "Gold", yahoo: "GC=F" },
  { symbol: "SILVER", name: "Silver", yahoo: "SI=F" },
  { symbol: "PLATINUM", name: "Platinum", yahoo: "PL=F" },
  { symbol: "PALLADIUM", name: "Palladium", yahoo: "PA=F" },
  { symbol: "COPPER", name: "Copper", yahoo: "HG=F" },
  { symbol: "CL", name: "WTI Crude Oil", yahoo: "CL=F" },
  { symbol: "BRENTOIL", name: "Brent Crude Oil", yahoo: "BZ=F" },
  { symbol: "NATGAS", name: "Natural Gas", yahoo: "NG=F" },
];

const INDEX_ENTRIES: SimpleEntry[] = [
  { symbol: "SP500", name: "S&P 500", yahoo: "^GSPC" },
  { symbol: "JP225", name: "Nikkei 225", yahoo: "^N225" },
  { symbol: "NIFTY", name: "Nifty 50", yahoo: "^NSEI" },
  { symbol: "IBOV", name: "Bovespa", yahoo: "^BVSP" },
  { symbol: "VIX", name: "Volatility Index", yahoo: "^VIX" },
];

const ETF_ENTRIES: SimpleEntry[] = [
  { symbol: "XLE", name: "Energy Select Sector SPDR" },
  { symbol: "EWJ", name: "iShares MSCI Japan" },
  { symbol: "EWY", name: "iShares MSCI South Korea" },
  { symbol: "EWZ", name: "iShares MSCI Brazil" },
  { symbol: "EWT", name: "iShares MSCI Taiwan" },
  { symbol: "URNM", name: "Sprott Uranium Miners ETF" },
];

export const ASSETS: AssetMeta[] = [
  ...build("stocks", "usd", STOCK_ENTRIES),
  ...build("commodities", "usd", COMMODITY_ENTRIES),
  ...build("indices", "points", INDEX_ENTRIES),
  ...build("etfs", "usd", ETF_ENTRIES),
];

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "stocks", label: "Stocks" },
  { key: "indices", label: "Indices" },
  { key: "etfs", label: "ETFs" },
  { key: "commodities", label: "Commodities" },
];

export function isCategory(value: string | null): value is Category {
  return (
    value === "stocks" ||
    value === "indices" ||
    value === "etfs" ||
    value === "commodities"
  );
}

export function assetsForCategory(category: Category): AssetMeta[] {
  return ASSETS.filter((a) => a.category === category);
}

/** Convert a Hyperliquid coin id back to a bare ticker, e.g. "xyz:AAPL" -> "AAPL". */
export function fromHlSymbol(coin: string): string {
  const idx = coin.indexOf(":");
  return idx === -1 ? coin : coin.slice(idx + 1);
}
