import { cached } from "./cache";

// Yahoo Finance v8 chart endpoint. Works without an API key but must be called
// server-side (CORS + a browser-like User-Agent). We only read the `meta`
// block, which carries the prices and session timing we need.

const BASE =
  "https://query1.finance.yahoo.com/v8/finance/chart/";
const TIMEOUT_MS = 8000;
const QUOTE_TTL_MS = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface YahooQuote {
  symbol: string;
  /** Best available live price: post -> pre -> regular. */
  price: number | null;
  regularMarketPrice: number | null;
  prevClose: number | null;
  /** Epoch ms of the price observation. */
  time: number | null;
  currency: string | null;
}

interface YahooMeta {
  symbol?: string;
  currency?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketTime?: number;
  preMarketPrice?: number;
  postMarketPrice?: number;
  postMarketTime?: number;
  preMarketTime?: number;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{ meta?: YahooMeta }> | null;
    error?: unknown;
  };
}

function num(v: number | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

async function fetchYahooQuoteUncached(
  symbol: string,
): Promise<YahooQuote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${BASE}${encodeURIComponent(
      symbol,
    )}?interval=1d&range=1d&includePrePost=true`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as YahooChartResponse;
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const regular = num(meta.regularMarketPrice);
    const post = num(meta.postMarketPrice);
    const pre = num(meta.preMarketPrice);
    const price = post ?? pre ?? regular;

    // Choose the timestamp matching the chosen price tier.
    let timeSec: number | null = null;
    if (post !== null) timeSec = num(meta.postMarketTime);
    else if (pre !== null) timeSec = num(meta.preMarketTime);
    else timeSec = num(meta.regularMarketTime);

    return {
      symbol: meta.symbol ?? symbol,
      price,
      regularMarketPrice: regular,
      prevClose: num(meta.chartPreviousClose) ?? num(meta.previousClose),
      time: timeSec !== null ? timeSec * 1000 : null,
      currency: meta.currency ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchYahooQuote(symbol: string): Promise<YahooQuote | null> {
  return cached(`yahoo:${symbol}`, QUOTE_TTL_MS, () =>
    fetchYahooQuoteUncached(symbol),
  );
}

/** Fetch many quotes with a concurrency cap; failures resolve to null. */
export async function fetchYahooQuotes(
  symbols: string[],
  concurrency = 8,
): Promise<Map<string, YahooQuote | null>> {
  const result = new Map<string, YahooQuote | null>();
  let cursor = 0;

  async function worker() {
    while (cursor < symbols.length) {
      const idx = cursor++;
      const sym = symbols[idx];
      result.set(sym, await fetchYahooQuote(sym));
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, symbols.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return result;
}
