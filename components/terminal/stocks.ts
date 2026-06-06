// Data backing the Visual Index grid. Values + sparkline paths match the design
// exactly; the index numbers preserve the original ordering (04, 03, 02, 01).

export interface TerminalStock {
  index: string;
  symbol: string;
  name: string;
  price: number;
  change: string;
  direction: "up" | "down";
  vol: string;
  cap: string;
  /** SVG path for the sparkline (viewBox 0 0 200 100). */
  path: string;
}

export const TERMINAL_STOCKS: TerminalStock[] = [
  {
    index: "04",
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 824.12,
    change: "+32.41 (4.02%)",
    direction: "up",
    vol: "42.1M",
    cap: "2.14T",
    path: "M0 80 L20 85 L40 60 L60 70 L80 40 L100 45 L120 20 L140 30 L160 10 L180 15 L200 5",
  },
  {
    index: "03",
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 189.43,
    change: "-1.12 (0.58%)",
    direction: "down",
    vol: "54.8M",
    cap: "2.82T",
    path: "M0 20 L40 25 L80 50 L120 45 L160 70 L200 85",
  },
  {
    index: "02",
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 197.58,
    change: "+2.15 (1.09%)",
    direction: "up",
    vol: "102.4M",
    cap: "624.1B",
    path: "M0 90 L20 85 L40 88 L60 60 L80 65 L100 40 L120 45 L140 20 L160 25 L180 10 L200 15",
  },
  {
    index: "01",
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 415.5,
    change: "+0.85 (0.21%)",
    direction: "up",
    vol: "21.5M",
    cap: "3.12T",
    path: "M0 50 L50 45 L100 48 L150 42 L200 40",
  },
];

export const TICKER_ITEMS = [
  { symbol: "AAPL", change: "+1.2%" },
  { symbol: "TSLA", change: "-0.4%" },
  { symbol: "NVDA", change: "+4.8%" },
  { symbol: "AMZN", change: "+0.9%" },
  { symbol: "GOOGL", change: "-1.1%" },
  { symbol: "MSFT", change: "+0.3%" },
];
