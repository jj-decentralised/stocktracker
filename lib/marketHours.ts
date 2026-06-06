import type { MarketStatus } from "./types";

// US equity trading session, in America/New_York local time:
//   pre-market   04:00 – 09:30
//   regular open 09:30 – 16:00
//   post-market  16:00 – 20:00
//   closed       otherwise (incl. weekends)
//
// Holidays are not modelled (acceptable for an informational dashboard); the
// per-symbol traditional price timestamp makes any staleness explicit anyway.

interface EtParts {
  weekday: number; // 0 = Sun ... 6 = Sat
  minutes: number; // minutes since ET midnight
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function etParts(date: Date): EtParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  let weekday = 1;
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "weekday") weekday = WEEKDAY_INDEX[p.value] ?? 1;
    else if (p.type === "hour") hour = Number(p.value) % 24;
    else if (p.type === "minute") minute = Number(p.value);
  }
  return { weekday, minutes: hour * 60 + minute };
}

const PRE_OPEN = 4 * 60; // 04:00
const REGULAR_OPEN = 9 * 60 + 30; // 09:30
const REGULAR_CLOSE = 16 * 60; // 16:00
const POST_CLOSE = 20 * 60; // 20:00

export function deriveMarketStatus(now: Date = new Date()): MarketStatus {
  const { weekday, minutes } = etParts(now);
  if (weekday === 0 || weekday === 6) return "closed";
  if (minutes >= REGULAR_OPEN && minutes < REGULAR_CLOSE) return "open";
  if (minutes >= PRE_OPEN && minutes < REGULAR_OPEN) return "pre";
  if (minutes >= REGULAR_CLOSE && minutes < POST_CLOSE) return "post";
  return "closed";
}

export function marketStatusLabel(status: MarketStatus): string {
  switch (status) {
    case "open":
      return "US markets open";
    case "pre":
      return "Pre-market";
    case "post":
      return "After hours";
    case "closed":
      return "US markets closed";
    default:
      return "Status unknown";
  }
}
