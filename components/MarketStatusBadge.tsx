import type { MarketStatus } from "@/lib/types";
import { marketStatusLabel } from "@/lib/marketHours";

const DOT: Record<MarketStatus, string> = {
  open: "bg-premium",
  pre: "bg-amber-500",
  post: "bg-amber-500",
  closed: "bg-faint",
  unknown: "bg-faint",
};

export function MarketStatusBadge({ status }: { status: MarketStatus }) {
  const live = status === "open" || status === "pre" || status === "post";
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      <span className="relative flex h-2 w-2">
        {live && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${DOT[status]} opacity-60`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${DOT[status]}`}
        />
      </span>
      <span>{marketStatusLabel(status)}</span>
    </span>
  );
}
