"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type LineData,
} from "lightweight-charts";
import type { Point } from "@/lib/types";

const INK = "#14130f";
const WALL = "#b08968"; // warm tan for the Wall Street reference line
const AXIS = "#9a958c";
const GRID = "#f0eee8";

function toLineData(points: Point[]): LineData[] {
  return points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }));
}

export function OverlayChart({
  hl,
  trad,
  livePrice,
  compact = false,
  height = 220,
  showLegend = false,
}: {
  hl: Point[];
  trad: Point[];
  livePrice?: number;
  compact?: boolean;
  height?: number;
  showLegend?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const hlSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const tradSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lastHlTimeRef = useRef<number>(0);

  // Create the chart once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(255,255,255,0)" },
        textColor: AXIS,
        fontFamily:
          "var(--font-eb-garamond), Georgia, 'Times New Roman', serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: !compact, color: GRID },
        horzLines: { visible: !compact, color: GRID },
      },
      rightPriceScale: { visible: !compact, borderColor: GRID },
      timeScale: {
        visible: !compact,
        borderColor: GRID,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: compact ? 0 : 1,
        vertLine: { labelVisible: !compact, color: AXIS, width: 1, style: LineStyle.Dotted },
        horzLine: { labelVisible: !compact, color: AXIS },
      },
      handleScroll: !compact,
      handleScale: !compact,
    });
    chartRef.current = chart;

    const tradSeries = chart.addSeries(LineSeries, {
      color: WALL,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: !compact,
      crosshairMarkerVisible: !compact,
      title: compact ? undefined : "Wall St",
    });
    const hlSeries = chart.addSeries(LineSeries, {
      color: INK,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: !compact,
      crosshairMarkerVisible: !compact,
      title: compact ? undefined : "Hyperliquid",
    });
    tradSeriesRef.current = tradSeries;
    hlSeriesRef.current = hlSeries;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && chartRef.current) chartRef.current.applyOptions({ width: w });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      hlSeriesRef.current = null;
      tradSeriesRef.current = null;
    };
  }, [compact, height]);

  // Push data when series change.
  useEffect(() => {
    if (!hlSeriesRef.current || !tradSeriesRef.current) return;
    hlSeriesRef.current.setData(toLineData(hl));
    tradSeriesRef.current.setData(toLineData(trad));
    lastHlTimeRef.current = hl.length ? hl[hl.length - 1].time : 0;
    chartRef.current?.timeScale().fitContent();
  }, [hl, trad]);

  // Live HL price → update/append the last point in real time.
  useEffect(() => {
    if (livePrice === undefined || !hlSeriesRef.current) return;
    const now = Math.floor(Date.now() / 1000);
    const t = Math.max(now, lastHlTimeRef.current) as UTCTimestamp;
    hlSeriesRef.current.update({ time: t, value: livePrice });
    lastHlTimeRef.current = t;
  }, [livePrice]);

  return (
    <div className="relative w-full" style={{ height }}>
      {showLegend && (
        <div className="pointer-events-none absolute left-2 top-1 z-10 flex gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-[2px] w-4" style={{ background: INK }} />
            Hyperliquid
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-[2px] w-4"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${WALL} 0 4px, transparent 4px 7px)`,
              }}
            />
            Wall St
          </span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
