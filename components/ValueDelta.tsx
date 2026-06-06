import type { SpreadDirection } from "@/lib/types";

const COLOR: Record<SpreadDirection, string> = {
  premium: "text-premium",
  discount: "text-discount",
  flat: "text-muted",
  unknown: "text-faint",
};

const GLYPH: Record<SpreadDirection, string> = {
  premium: "▲",
  discount: "▼",
  flat: "·",
  unknown: "",
};

/** A signed, color-coded value with a small directional glyph. */
export function ValueDelta({
  text,
  direction,
  showGlyph = true,
  className = "",
}: {
  text: string;
  direction: SpreadDirection;
  showGlyph?: boolean;
  className?: string;
}) {
  return (
    <span className={`${COLOR[direction]} ${className}`}>
      {showGlyph && GLYPH[direction] ? (
        <span className="mr-1 text-[0.7em] align-middle">
          {GLYPH[direction]}
        </span>
      ) : null}
      {text}
    </span>
  );
}
