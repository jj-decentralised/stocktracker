export function Footer() {
  return (
    <footer className="mt-auto flex items-center justify-between border-t border-line px-5 py-3">
      <div className="eyebrow text-faint">
        The Spread © Hyperliquid HIP-3 (xyz) vs. Yahoo Finance. Not investment
        advice.
      </div>
      <nav>
        <ul className="flex list-none gap-4">
          <li>
            <a
              href="https://hyperliquid.xyz"
              className="eyebrow text-ink hover:text-up"
            >
              Hyperliquid
            </a>
          </li>
          <li>
            <a href="#" className="eyebrow text-ink hover:text-up">
              Terminal API
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
