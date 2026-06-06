"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Live" },
  { href: "/discovery", label: "Discovery" },
  { href: "/terminal", label: "Index" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-[#00ff00] px-5 py-3">
      <nav aria-label="Primary">
        <ul className="flex list-none gap-6">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm font-extrabold text-ink transition-opacity ${
                    active
                      ? "underline decoration-2 underline-offset-4"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href="/"
        className="text-2xl font-black leading-none tracking-tight text-ink"
      >
        THE&nbsp;SPREAD
      </Link>
    </header>
  );
}
