import type { Episode, DiscoveryMetrics, Point } from "./types";

// Off-hours price-discovery analysis. Pure functions (no I/O) so they are easy
// to unit-test. Inputs:
//   - hlPoints:   Hyperliquid close prices, { time (epoch seconds), value }, asc.
//   - dailyOHLC:  Yahoo regular-session bars, { time (session-open epoch sec),
//                 open, close }, ascending. `time` is the session open instant.
//
// For each session D (with previous session P) we reconstruct the off-hours
// window [P.close, D.open) from the HL points and compare HL's last pre-bell
// price to what the regular market actually did.

export interface DailyBar {
  /** Epoch seconds at (approximately) the regular-session open. */
  time: number;
  open: number;
  close: number;
}

/** Regular US session length: 09:30 → 16:00 ET. */
const SESSION_SECONDS = 6.5 * 60 * 60;

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Format an epoch-seconds instant as a YYYY-MM-DD date in US Eastern time. */
export function etDateString(epochSec: number): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(epochSec * 1000); // en-CA → YYYY-MM-DD
}

export function buildEpisodes(hlPoints: Point[], dailyOHLC: DailyBar[]): Episode[] {
  if (hlPoints.length === 0 || dailyOHLC.length < 2) return [];

  // Ascending by time for slicing.
  const pts = [...hlPoints].sort((a, b) => a.time - b.time);

  const episodes: Episode[] = [];
  for (let i = 1; i < dailyOHLC.length; i++) {
    const prev = dailyOHLC[i - 1];
    const day = dailyOHLC[i];

    const openInst = day.time;
    const prevCloseInst = prev.time + SESSION_SECONDS;
    if (!(prevCloseInst < openInst)) continue;

    // HL closes within the off-hours window [prevClose, open).
    const window = pts.filter(
      (p) => p.time >= prevCloseInst && p.time < openInst,
    );
    if (window.length === 0) continue;

    const ohOpen = window[0].value;
    const ohClose = window[window.length - 1].value; // pre-bell prediction
    const ohMid = median(window.map((p) => p.value));

    const actualOpen = day.open;
    const actualClose = day.close;
    const prevClose = prev.close;
    if (!ohClose || !actualOpen) continue;

    const errOpenPct = ((actualOpen - ohClose) / ohClose) * 100;
    const errClosePct = ((actualClose - ohClose) / ohClose) * 100;
    const dirHitOpen =
      ohClose - prevClose >= 0 === (actualOpen - prevClose >= 0);

    episodes.push({
      date: etDateString(openInst),
      prevClose,
      ohOpen,
      ohMid,
      ohClose,
      actualOpen,
      actualClose,
      errOpenPct,
      errClosePct,
      dirHitOpen,
    });
  }
  return episodes;
}

export function summarize(episodes: Episode[]): DiscoveryMetrics {
  const n = episodes.length;
  if (n === 0) {
    return {
      nEpisodes: 0,
      maeOpenPct: 0,
      maeClosePct: 0,
      hitRateOpen: 0,
      score: 0,
    };
  }
  const maeOpenPct =
    episodes.reduce((s, e) => s + Math.abs(e.errOpenPct), 0) / n;
  const maeClosePct =
    episodes.reduce((s, e) => s + Math.abs(e.errClosePct), 0) / n;
  const hitRateOpen =
    (episodes.filter((e) => e.dirHitOpen).length / n) * 100;

  // Transparent convenience score: half directional accuracy, half a scaled
  // inverse of the open error (0.1% error ≈ 98, 1% ≈ 80, ≥5% ≈ 0).
  const accuracyComponent = Math.max(0, 100 - maeOpenPct * 20);
  const score = 0.5 * hitRateOpen + 0.5 * accuracyComponent;

  return {
    nEpisodes: n,
    maeOpenPct,
    maeClosePct,
    hitRateOpen,
    score,
  };
}
