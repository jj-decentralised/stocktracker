import type { ReactNode } from "react";

/** Neon page banner, matching the Visual Index market-banner aesthetic. */
export function Banner({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-[#00ff00]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-6 px-5 py-10">
        <div className="max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed">{subtitle}</p>
          )}
        </div>
        {right && <div className="text-right">{right}</div>}
      </div>
    </div>
  );
}
