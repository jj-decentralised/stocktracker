"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Live" },
  { href: "/discovery", label: "Price Discovery" },
  { href: "/terminal", label: "Index" },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-[1180px] gap-6 px-6" aria-label="Primary">
      {LINKS.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2 pt-1 text-base transition-colors ${
              active
                ? "border-ink text-ink"
                : "border-transparent text-faint hover:text-muted"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
