"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DayBucket } from "@/lib/compute-stats";

// ─── Layout constants ─────────────────────────────────────────────────────────
const DEFAULT_CELL = 11;  // fallback cell size px
const GAP_RATIO = 0.20; // gap is 20% of each step — tune this to adjust density
const DAY_LABEL_W = 28;   // left sidebar width
const DEFAULT_ACCENT = "#E95F38";

// ─── Animation config ───────────────────────────────────────────────────────
const BLUR_TRANSITION = {
  initial: { opacity: 0, filter: "blur(4px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(4px)" },
  transition: { duration: 0.25, ease: "easeInOut" },
} as const;

// ─── Percentile calculation ────────────────────────────────────────────────────
function calculatePercentiles(
  buckets: DayBucket[]
): { q25: number; q50: number; q75: number } {
  const nonZeroCounts = buckets
    .filter((b) => b.count > 0)
    .map((b) => b.count)
    .sort((a, b) => a - b);

  if (nonZeroCounts.length === 0) {
    return { q25: 0, q50: 0, q75: 0 };
  }

  const getPercentile = (arr: number[], p: number) => {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  };

  return {
    q25: getPercentile(nonZeroCounts, 25),
    q50: getPercentile(nonZeroCounts, 50),
    q75: getPercentile(nonZeroCounts, 75),
  };
}

// ─── Orange intensity scale (5 levels with percentile thresholds) ────────────
function cellColor(
  count: number,
  q25: number,
  q50: number,
  q75: number,
  accent: string
): string {
  if (count === 0) return "var(--overlay-medium)";
  // Append 2-digit hex alpha to the accent hex for opacity tiers
  if (count <= q25) return accent + "38"; // ~22%
  if (count <= q50) return accent + "70"; // ~44%
  if (count <= q75) return accent + "AD"; // ~68%
  return accent;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function sundayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Grid build ───────────────────────────────────────────────────────────────
interface Week {
  key: string;
  days: (DayBucket | null)[]; // index = day of week 0=Sun
  monthLabel: string | null;   // if first week of a new month
  isNewMonth: boolean;         // true if this week starts a new month
}

function buildGrid(buckets: DayBucket[]): {
  weeks: Week[];
  peakDateStr: string | null;
} {
  if (buckets.length === 0) return { weeks: [], peakDateStr: null };

  // Build map for quick lookup
  const map = new Map<string, number>();
  let maxCount = 0;
  let peakDateStr: string | null = null;

  for (const b of buckets) {
    map.set(b.date, b.count);
    if (b.count > maxCount) {
      maxCount = b.count;
      peakDateStr = b.date;
    }
  }

  // Date range: extend to full week boundaries
  const first = new Date(buckets[0].date + "T00:00:00");
  const last = new Date(buckets[buckets.length - 1].date + "T00:00:00");

  const startSunday = sundayOfWeek(first);
  const endSaturday = new Date(last);
  endSaturday.setDate(endSaturday.getDate() + (6 - endSaturday.getDay()));

  const weeks: Week[] = [];
  const cursor = new Date(startSunday);
  let prevMonth = -1;

  while (cursor <= endSaturday) {
    const weekKey = toDateStr(cursor);
    const days: (DayBucket | null)[] = [];
    let monthLabel: string | null = null;
    let isNewMonth = false;

    for (let d = 0; d < 7; d++) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + d);
      const dateStr = toDateStr(day);
      const count = map.get(dateStr) ?? null;

      if (count !== null) {
        days.push({ date: dateStr, count });
      } else {
        days.push(null);
      }

      // Month label on first week of month
      if (d === 0 && day.getMonth() !== prevMonth) {
        prevMonth = day.getMonth();
        isNewMonth = true;
        monthLabel = day.toLocaleDateString("en-US", { month: "short" });
        // No year suffix — keep all month labels uniform
      }
    }

    weeks.push({ key: weekKey, days, monthLabel, isNewMonth });
    cursor.setDate(cursor.getDate() + 7);
  }

  return { weeks, peakDateStr };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipData {
  dateStr: string;
  count: number;
  x: number;
  y: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export interface ContributionHeatmapProps {
  data: DayBucket[];
  title?: string;
  subtitle?: string;
  /** When non-null, only these dates stay full opacity — all others dim */
  highlightDates?: Set<string> | null;
  /** Override the accent color for cells (hex string, e.g. "#E14920") */
  accentColor?: string;
}

export default function ContributionHeatmap({
  data,
  title = "Learning Activity",
  subtitle,
  highlightDates,
  accentColor = DEFAULT_ACCENT,
}: ContributionHeatmapProps) {
  const { weeks, peakDateStr } = React.useMemo(
    () => buildGrid(data),
    [data]
  );

  const percentiles = React.useMemo(
    () => calculatePercentiles(data),
    [data]
  );

  const [tooltip, setTooltip] = React.useState<TooltipData | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Date range label — derived from actual data bounds
  const dateRange = React.useMemo(() => {
    if (data.length === 0) return null;
    const fmt = (dateStr: string) =>
      new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    return `${fmt(data[0].date)} – ${fmt(data[data.length - 1].date)}`;
  }, [data]);

  // ─── Responsive cell sizing ──────────────────────────────────────────────
  // Measure the container and compute cell + gap so the grid fills the width,
  // matching GitHub's behaviour. Recalculates on every resize.
  const [cell, setCell] = React.useState(DEFAULT_CELL);
  const gap = Math.max(1, Math.round(cell * GAP_RATIO));
  const step = cell + gap;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || weeks.length === 0) return;
    const compute = (w: number) => {
      const available = w - DAY_LABEL_W;
      const rawStep = available / weeks.length;
      const rawGap = Math.max(1, Math.round(rawStep * GAP_RATIO));
      const rawCell = Math.max(4, rawStep - rawGap);
      setCell(rawCell);
    };
    compute(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => compute(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeks.length]);

  // Day labels: only show Mon, Wed, Fri on rows 1, 3, 5 (0-indexed)
  const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      {title && (
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[13px] text-gray11 select-none">
            {title}
          </span>
          {subtitle && (
            <span className="font-mono text-[11px] text-gray8 select-none">
              {subtitle}
            </span>
          )}
        </div>
      )}

      {/* Grid wrapper */}
      <div className="relative" ref={containerRef}>
        <div className="flex gap-0">
          {/* Day labels (fixed) */}
          <div
            className="flex flex-col justify-between"
            style={{ width: DAY_LABEL_W, paddingTop: 18, gap: 0 }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="font-mono text-[9px] text-gray8 select-none leading-none"
                style={{
                  height: step,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Scrollable heatmap */}
          <div
            style={{
              overflow: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>
              {`
                [data-scrollable]::-webkit-scrollbar { display: none; }
              `}
            </style>
            <div
              data-scrollable
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {/* Month labels row */}
              <div className="flex" style={{ height: 18, gap: 0 }}>
                {weeks.map((week, wi) => (
                  <div key={week.key} style={{ position: "relative" }}>
                    <div
                      className="font-mono text-[9px] text-gray8 select-none"
                      style={{
                        width: step,
                        flexShrink: 0,
                        paddingLeft: 1,
                        lineHeight: "18px",
                        height: 18,
                      }}
                    >
                      {week.monthLabel}
                    </div>
                    {/* Vertical orange line at month start */}
                    {week.isNewMonth && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          width: 1,
                          height: 7,
                          backgroundColor: accentColor + "4D",
                          transform: "translateY(-50%)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Cells: render row-by-row (0=Sun → 6=Sat) */}
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
                <div key={dow} className="flex" style={{ gap: 0 }}>
                  {weeks.map((week, wi) => {
                    const bucket = week.days[dow];
                    const color = bucket
                      ? cellColor(
                          bucket.count,
                          percentiles.q25,
                          percentiles.q50,
                          percentiles.q75,
                          accentColor
                        )
                      : "var(--overlay-subtle)";
                    const isPeak =
                      bucket && peakDateStr && bucket.date === peakDateStr;

                    const isHighlightActive = highlightDates != null;
                    const isHighlighted = bucket ? (highlightDates?.has(bucket.date) ?? false) : false;
                    // dimmed: 0.28 keeps cells readable; 0.12 was too aggressive
                    const cellOpacity = isHighlightActive && !isHighlighted ? 0.28 : 1;
                    // slight blur on dimmed cells via CSS — doesn't conflict with FM entry animation
                    const cellFilter = isHighlightActive && !isHighlighted ? "blur(1.5px)" : "none";

                    return (
                      <motion.div
                        key={`${week.key}-${dow}`}
                        // FM only owns opacity for the entry fade-in — no filter here
                        initial={{ opacity: 0 }}
                        animate={{ opacity: cellOpacity }}
                        transition={{
                          opacity: { duration: isHighlightActive ? 0.15 : 0.25, ease: "easeInOut" },
                          delay: isHighlightActive ? 0 : wi * 0.008,
                        }}
                        style={{
                          width: cell,
                          height: cell,
                          marginRight: gap,
                          marginBottom: gap,
                          backgroundColor: color,
                          borderRadius: Math.max(2, Math.round(cell * 0.25)),
                          flexShrink: 0,
                          filter: cellFilter,
                          transition: "filter 0.15s ease",
                          boxShadow: isPeak
                            ? "0 0 6px rgba(255,107,53,0.6)"
                            : "none",
                        }}
                        onPointerEnter={(e) => {
                          if (!bucket) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const containerRect =
                            containerRef.current?.getBoundingClientRect();
                          setTooltip({
                            dateStr: bucket.date,
                            count: bucket.count,
                            x:
                              rect.left -
                              (containerRect?.left ?? 0) +
                              cell / 2,
                            y:
                              rect.top -
                              (containerRect?.top ?? 0),
                          });
                        }}
                        onPointerLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              {...BLUR_TRANSITION}
              transition={{
                ...BLUR_TRANSITION.transition,
                y: { duration: 0.25, ease: "easeInOut" },
              }}
              initial={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              className="pointer-events-none absolute z-10"
              style={{
                left: tooltip.x,
                top: tooltip.y - 4,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <div
                className="font-mono text-[11px] select-none whitespace-nowrap"
                style={{
                  background: "var(--pill-bg)",
                  border: `1px solid ${accentColor}33`,
                  borderRadius: 3,
                  padding: "3px 8px",
                  color: "var(--color-gray12)",
                }}
              >
                <span style={{ color: accentColor }}>{tooltip.count}</span>
                {" videos · "}
                <span style={{ color: "var(--color-gray11)" }}>
                  {formatDate(tooltip.dateStr)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between" style={{ paddingLeft: DAY_LABEL_W }}>
        {/* Date range — subtle, left-aligned, derived from data bounds */}
        {dateRange ? (
          <span
            className="font-mono text-[9px] select-none"
            style={{ color: "var(--text-faint)" }}
          >
            {dateRange}
          </span>
        ) : <div />}
        <div className="flex items-center gap-2">
          {[
            "var(--overlay-medium)",
            accentColor + "38",
            accentColor + "70",
            accentColor + "AD",
            accentColor,
          ].map((color, i) => (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                backgroundColor: color,
                borderRadius: Math.max(2, Math.round(cell * 0.25)),
              }}
            />
          ))}
          <span className="font-mono text-[9px] text-gray8 select-none">
            Peak
          </span>
        </div>
      </div>
    </div>
  );
}
