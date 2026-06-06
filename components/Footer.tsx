export function Footer() {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto max-w-[1120px] px-6 py-10 text-sm leading-relaxed text-muted">
        <p className="max-w-2xl">
          <span className="italic">The Spread</span> compares the live price of
          tokenized stock perpetuals on{" "}
          <span className="text-ink">Hyperliquid</span> (HIP-3, the{" "}
          <span className="nums">xyz</span> perp dex) against their
          traditional-market price from{" "}
          <span className="text-ink">Yahoo Finance</span>. Hyperliquid trades
          24/7, so when Wall Street is closed the two prices drift apart — that
          gap is the spread.
        </p>
        <p className="mt-4 max-w-2xl text-faint">
          For informational purposes only. Not investment advice. Prices may be
          delayed or inaccurate; traditional-market quotes reflect the last
          available session and may be stale outside of regular hours.
        </p>
      </div>
    </footer>
  );
}
