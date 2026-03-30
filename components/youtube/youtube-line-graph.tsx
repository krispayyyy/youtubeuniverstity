"use client";

/**
 * YouTubeLineGraph — a full variant of the LineGraph component
 * adapted for YouTube daily bucket data instead of Strava fitness data.
 *
 * Architecture is identical to components/line-graph.tsx:
 *   - Provider + GraphContext for state
 *   - Lines sub-component renders one bar per day
 *   - Cursor is the orange interactive scrubber
 *   - Label / Meta show hover details
 *
 * Swapped:
 *   - Data: DayBucket[] (date + video count) instead of Activity[]
 *   - Bar height: clamp(count / 1.8, 8–300) instead of moving_time / 50
 *   - Meta: "{N} videos · ~Xh Ym" instead of "km · pace"
 *   - Date formatting: real date string, not day-of-year index
 *   - Month markers: derived from date string transitions
 */

import * as React from "react";
import {
  AnimatePresence,
  motion,
  type MotionValue,
  type TargetAndTransition,
  useMotionValueEvent,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cx } from "class-variance-authority";
import type { DayBucket } from "@/lib/compute-stats";
import { useScrollEnd } from "@/components/use-scroll-end";
import { useSound } from "@/components/use-sound";
import { useMediaQuery } from "@/components/use-media-query";
import { useIsHydrated } from "@/components/use-is-hydrated";

// ─── Constants (kept identical to line-graph.tsx) ─────────────────────────────
export const CURSOR_SIZE = 44;
export const CURSOR_CENTER = CURSOR_SIZE / 2;
export const CURSOR_WIDTH = 2;
export const CURSOR_LARGE_HEIGHT = 400;
export const LINE_GAP = 6;
export const LINE_WIDTH = 1;
export const LINE_STEP = LINE_GAP + LINE_WIDTH;
export const POINTER_SPRING = { stiffness: 500, damping: 40 };
const SOUND_OPTIONS = { volume: 0.3 };

// ─── Context ──────────────────────────────────────────────────────────────────
export interface GraphContext {
  morph: boolean;
  idle: boolean;
  activeIndex: number | null;
  setMorph: React.Dispatch<React.SetStateAction<boolean>>;
  setIdle: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  pressed: boolean;
  isTouch: boolean;
}

const GraphContext = React.createContext<GraphContext>({} as GraphContext);
export const useGraph = () => React.useContext(GraphContext);

// ─── Blur animation preset ────────────────────────────────────────────────────
export const blur = {
  initial:    { opacity: 0, filter: "blur(4px)" },
  animate:    { opacity: 1, filter: "blur(0px)" },
  exit:       { opacity: 0, filter: "blur(4px)" },
  transition: { ease: "easeInOut", duration: 0.25 },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, [min, max]: [number, number]): number {
  return Math.min(Math.max(val, min), max);
}

/** Fixed visual height for the reference bar (95th-percentile day).
 *  Days above this clamp at the top; typical days fill the space naturally. */
const MAX_COLUMN_HEIGHT = 300;
const MIN_COLUMN_HEIGHT = 4;
const SESSION_GAP = 4;

/** Column height for a given day, normalized against the 95th-percentile count.
 *  Outlier binge days clamp at MAX_COLUMN_HEIGHT; the rest scale proportionally. */
function getColumnHeight(count: number, refCount: number): number {
  if (count === 0) return 0;
  return Math.min(MAX_COLUMN_HEIGHT, Math.max(MIN_COLUMN_HEIGHT, Math.round((count / refCount) * MAX_COLUMN_HEIGHT)));
}

/** Estimated viewing time string derived from gap-based avg minutes per video. */
function estimatedViewTime(count: number, minutesPerVideo: number): string {
  const totalMinutes = count * minutesPerVideo;
  const hours = Math.floor(totalMinutes / 60);
  const mins  = Math.round(totalMinutes % 60);
  if (hours === 0) return `~${mins}m`;
  if (mins  === 0) return `~${hours}h`;
  return `~${hours}h ${mins}m`;
}

/** Format a YYYY-MM-DD date string into "Feb 2nd" style. */
function formatBucketDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z"); // noon UTC to avoid TZ shifts
  const month = d.toLocaleString("default", { month: "short" });
  const day = d.getUTCDate();
  const suffix =
    day === 1 || day === 21 || day === 31 ? "st"
    : day === 2 || day === 22             ? "nd"
    : day === 3 || day === 23             ? "rd"
    :                                       "th";
  return `${month} ${day}${suffix}`;
}

/** Returns true if the bucket at index `i` is the first day of a new month. */
function isFirstOfMonth(buckets: DayBucket[], i: number): boolean {
  if (i === 0) return true;
  const prev = buckets[i - 1].date.slice(5, 7); // "MM"
  const curr = buckets[i].date.slice(5, 7);
  return prev !== curr;
}

/**
 * Split a day's video count into learning sessions, producing the visual
 * "break" effect seen in the original LineGraph (where multiple activities
 * on one day render as stacked segments with a gap between them).
 *
 * Mirrors Karim's real pattern:
 *   - ≤4 videos  → single session (no break)
 *   - 5–14       → two sessions: primary (noon) + secondary (midnight)
 *   - 15+        → three sessions: noon / evening / midnight
 *
 * Sessions are returned largest-first so the tallest bar appears at the top
 * of the column, tapering downward — matching the original's sort order.
 */
function splitIntoSessions(count: number): number[] {
  if (count === 0) return [];
  if (count <= 4) return [count];
  if (count <= 14) {
    const a = Math.round(count * 0.58); // primary ~58%
    return [a, count - a];
  }
  // Three sessions: roughly 48 / 33 / 19 split
  const a = Math.round(count * 0.48);
  const b = Math.round((count - a) * 0.63);
  return [a, b, count - a - b].filter((n) => n > 0);
}

// ─── Small play-style icon for the Meta overlay ───────────────────────────────
function VideoIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M2.5 2.5C2.5 1.948 3.098 1.618 3.564 1.918L11.064 6.418C11.505 6.701 11.505 7.299 11.064 7.582L3.564 12.082C3.098 12.382 2.5 12.052 2.5 11.5V2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function Provider({
  children,
  ref,
  value,
  className,
  ...props
}: Omit<React.HTMLProps<HTMLDivElement>, "value"> & {
  children: React.ReactNode;
  ref?: React.RefObject<HTMLDivElement | null>;
  value: GraphContext;
  className?: string;
  onPointerDown?: () => void;
}) {
  return (
    <div
      ref={ref}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") {
          value.setIdle?.(true);
        }
      }}
      className={cx(
        "flex cursor-none items-center overflow-y-hidden pl-24 pr-48 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    >
      <GraphContext.Provider value={value}>{children}</GraphContext.Provider>
    </div>
  );
}

// ─── Lines ────────────────────────────────────────────────────────────────────
export function Lines({
  buckets,
  className,
  style,
  ref,
  ...props
}: {
  buckets: DayBucket[];
  ref: React.RefObject<HTMLDivElement | null>;
  className?: string;
  style?: React.CSSProperties;
} & Omit<React.HTMLProps<HTMLDivElement>, "ref">) {
  const popSnapIn  = useSound("/sounds/pop-1.mp3",    SOUND_OPTIONS);
  const popSnapOut = useSound("/sounds/pop-2.wav",    SOUND_OPTIONS);

  const { setActiveIndex, setMorph, y } = useGraph();
  const rubberband = React.useRef(false);

  // Use 95th-percentile of non-zero days as the scale reference.
  // Outlier binge days clamp at MAX_COLUMN_HEIGHT; typical days fill the space.
  const refCount = React.useMemo(() => {
    const nonZero = buckets.map(b => b.count).filter(c => c > 0).sort((a, b) => a - b);
    if (nonZero.length === 0) return 1;
    return nonZero[Math.min(Math.floor(nonZero.length * 0.95), nonZero.length - 1)];
  }, [buckets]);

  function onPointerEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    popSnapIn?.();
    setMorph(true);
    const bounds = ref.current!.getBoundingClientRect();
    const yCenter = bounds.y + (bounds.height / 2 - CURSOR_LARGE_HEIGHT / 2);
    const unsubscribe = y.on("change", (latest) => {
      if (latest === yCenter) {
        unsubscribe();
        rubberband.current = true;
      }
    });
    setTimeout(() => { y.set(yCenter); });
  }

  function onPointerLeave(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    popSnapOut?.();
    rubberband.current = false;
    setMorph(false);
    setTimeout(() => { setActiveIndex(null); });
  }

  function onPointerMove({ movementY, pointerType }: React.PointerEvent<HTMLDivElement>) {
    if (pointerType === "touch") return;
    if (rubberband.current) {
      y.jump(y.get() + movementY / 4);
    }
  }

  return (
    <div
      ref={ref}
      className={cx("relative flex items-end", className)}
      style={{ gap: LINE_GAP, ...style }}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...props}
    >
      {buckets.map((bucket, i) => {
        const isEmpty  = bucket.count === 0;
        const sessions = splitIntoSessions(bucket.count);
        const isMonth  = isFirstOfMonth(buckets, i);

        // Total visual height for this day, normalized against the 95th-percentile reference.
        const columnHeight = getColumnHeight(bucket.count, refCount);
        // Subtract the gaps between sessions so we can fill exactly columnHeight px.
        const gapTotal = isEmpty ? 0 : (sessions.length - 1) * SESSION_GAP;
        const contentHeight = Math.max(sessions.length, columnHeight - gapTotal);

        return (
          <div
            key={bucket.date}
            className="relative flex flex-col select-none"
            style={{ width: LINE_WIDTH, gap: isEmpty ? 0 : SESSION_GAP }}
          >
            {isEmpty ? (
              // Rest day: short gray stub, orange if first of month
              <div
                className={cx("w-full", isMonth ? "bg-orange" : "bg-gray8")}
                style={{ height: 20 }}
              />
            ) : (
              sessions.map((sessionCount, si) => {
                const h = Math.max(1, Math.round((sessionCount / bucket.count) * contentHeight));
                return (
                  <div
                    key={si}
                    className={cx("w-full", isMonth ? "bg-orange" : "bg-gray12")}
                    style={{ height: h }}
                  />
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Cursor ───────────────────────────────────────────────────────────────────
export function Cursor({
  children,
  className,
  style,
  animate,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  animate?: TargetAndTransition;
}) {
  const isHydrated = useIsHydrated();
  const { x, y, idle, morph, pressed, isTouch } = useGraph();
  // no cursor on touch — interaction is disabled, nothing to track
  if (!isHydrated || isTouch) return null;
  return (
    <motion.div
      initial={false}
      className={cx(
        "bg-orange pointer-events-none fixed rounded-full [--label-offset:-36px]",
        className
      )}
      style={{ x, y, ...style }}
      animate={{
        opacity: idle ? 0 : morph ? 1 : pressed ? 0.65 : 0.5,
        width:  morph || isTouch ? CURSOR_WIDTH  : CURSOR_SIZE,
        height: morph || isTouch ? CURSOR_LARGE_HEIGHT : CURSOR_SIZE,
        scale: pressed ? 0.94 : 1,
        top:  isTouch ? "unset" : 0,
        // left: always 0 so translateX(x) maps directly to viewport position.
        // "unset" would add x onto the cursor's natural DOM offset, causing misalignment.
        left: 0,
        transition: {
          type: "spring",
          stiffness: 450,
          damping: 45,
          scale: { type: "spring", stiffness: 350, damping: 25 },
          ...animate?.transition,
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
export function Label({
  children,
  position,
}: {
  children: React.ReactNode;
  position: "top" | "bottom";
}) {
  return (
    <motion.div
      className={cx(
        "text-gray11 pointer-events-none absolute left-[50%] w-fit translate-x-[-50%] font-mono text-[13px] whitespace-nowrap select-none",
        {
          "top-[var(--label-offset)]":    position === "top",
          "bottom-[var(--label-offset)]": position === "bottom",
        }
      )}
      {...blur}
    >
      {children}
    </motion.div>
  );
}

// ─── Meta (hover overlay) ─────────────────────────────────────────────────────
export function Meta({ bucket, minutesPerVideo = 13 }: { bucket: DayBucket; minutesPerVideo?: number }) {
  const count    = bucket.count;
  const viewTime = estimatedViewTime(count, minutesPerVideo);

  return (
    <div className="text-gray12 flex items-center justify-center gap-2">
      <VideoIcon />
      <div className="font-mono text-sm whitespace-nowrap select-none">
        {count.toLocaleString()} videos
      </div>
      <div className="bg-gray8 h-[2px] w-[2px] rounded-full" />
      <div className="font-mono text-sm whitespace-nowrap select-none">
        {viewTime}
      </div>
    </div>
  );
}

// ─── PillDivider ──────────────────────────────────────────────────────────────
function PillDivider() {
  return (
    <div
      aria-hidden="true"
      style={{ width: 1, height: 9, background: "var(--overlay-strong)", flexShrink: 0, margin: "0 6px" }}
    />
  );
}

// ─── ExpandIcon ───────────────────────────────────────────────────────────────
// 2×2 grid icon (collapsed) → × icon (expanded).
function ExpandIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      {open ? (
        <>
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="0.25" y="0.25" width="3.75" height="3.75" rx="0.6" fill="currentColor" />
          <rect x="6"    y="0.25" width="3.75" height="3.75" rx="0.6" fill="currentColor" />
          <rect x="0.25" y="6"    width="3.75" height="3.75" rx="0.6" fill="currentColor" />
          <rect x="6"    y="6"    width="3.75" height="3.75" rx="0.6" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────
// SVG arc indicator. `current` spring-animates to each new value; when
// current < endpoint a ghost arc fades in showing the destination.
export function ProgressRing({
  current,
  endpoint,
  size = 14,
  strokeWidth = 1.5,
  activeStroke = "var(--text-primary)",
  animateOnMount = false,
}: {
  current: number;   // 0–100, the live value (spring-animated)
  endpoint: number;  // 0–100, the final destination shown as ghost
  size?: number;
  strokeWidth?: number;
  activeStroke?: string;
  /** Start from 0 and spring to current on mount — for reveal animations. */
  animateOnMount?: boolean;
}) {
  const r            = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const center       = size / 2;

  const raw = useMotionValue(animateOnMount ? 0 : current);
  const springProgress = useSpring(raw, { stiffness: 80, damping: 18 });
  const strokeDashoffset = useTransform(
    springProgress,
    (v) => circumference * (1 - Math.max(0, Math.min(100, v)) / 100)
  );

  React.useEffect(() => {
    raw.set(current);
  }, [current, raw]);

  const endpointOffset = circumference * (1 - endpoint / 100);
  // Ghost is only shown when meaningfully below the endpoint
  const showGhost = current < endpoint - 0.5;

  return (
    <svg
      width={size}
      height={size}
      aria-hidden="true"
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      {/* Track */}
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke="var(--overlay-medium)"
        strokeWidth={strokeWidth}
      />
      {/* Ghost arc — destination, fades in when current < endpoint */}
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke="var(--overlay-strong)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={endpointOffset}
        strokeLinecap="round"
        style={{
          opacity: showGhost ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      {/* Active arc — spring-follows current */}
      <motion.circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={activeStroke}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        style={{ strokeDashoffset, transition: "stroke 0.2s ease" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── StatRow ──────────────────────────────────────────────────────────────────
// A single label → value row inside the expanded pill.
function StatRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20, paddingTop: 7 }}>
      <span className="font-mono text-[10px] text-gray8 select-none whitespace-nowrap">{label}</span>
      <span
        className={cx(
          "font-mono text-[11px] select-none whitespace-nowrap tabular-nums",
          highlight ? "text-gray12" : "text-gray10"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function YouTubeLineGraph({
  data,
  journeyPercent,
  minutesPerVideo = 13,
}: {
  data: DayBucket[];
  /** Personal narrative percentage (e.g. "74.32% towards becoming a design engineer").
   *  Omit for other users — the ring + % are hidden when this is not provided. */
  journeyPercent?: number;
  /** Avg minutes watched per video — derived from gap-based avgHoursPerDay / avgVideosPerDay.
   *  Defaults to 13 if not provided (safe fallback for standalone usage). */
  minutesPerVideo?: number;
}) {
  const isTouch = useMediaQuery("(hover: none)");

  const rootRef   = React.useRef<HTMLDivElement | null>(null);
  const boundsRef = React.useRef<HTMLDivElement | null>(null);

  const [morph,  setMorph]  = React.useState(isTouch);
  const [idle,   setIdle]   = React.useState(!isTouch);
  const [pressed, setPressed] = React.useState(false);

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // activeIndex >= 0 guard: scroll handler can produce negative indices
  // (no lower-bound clamp), and data[-n] is undefined in JS even though
  // -n < data.length is true, which would crash a .count access.
  const isActiveDay  = activeIndex !== null && activeIndex >= 0 && activeIndex < data.length;
  const isOfflineDay = isActiveDay && data[activeIndex!].count === 0;

  // activeBucket: only set for active days with actual video data.
  // Offline days (count 0) keep this null so Meta stays hidden.
  const activeBucket = isActiveDay && !isOfflineDay ? data[activeIndex!] : null;

  // "Day N" is more narrative than a calendar date — it communicates the arc
  // of a learning journey without requiring the viewer to know Karim's calendar.
  // Fallback to the last day (total span) when nothing is hovered.
  const activeDayLabel = isActiveDay
    ? `Day ${activeIndex! + 1}`
    : `Day ${data.length}`;

  // Date span label shown when no specific day is active (idle cursor).
  const dateRangeLabel = React.useMemo(() => {
    if (data.length === 0) return '';
    const fmt = (s: string) => {
      const d = new Date(s + 'T12:00:00Z');
      return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    };
    return `${fmt(data[0].date)} – ${fmt(data[data.length - 1].date)}`;
  }, [data]);


  const { scrollX } = useScroll({ container: rootRef });
  const x = useSpring(0, POINTER_SPRING);
  const y = useSpring(0, POINTER_SPRING);

  // ─── Scroll-progress for the right-edge indicator ─────────────────────────
  // useTransform with a mapping function is lazily evaluated on every scrollX
  // change. We read scrollWidth/clientWidth from the live DOM element so the
  // ratio stays accurate as the container resizes.
  const scrollProgress = useTransform(scrollX, (latest) => {
    const el = rootRef.current;
    if (!el) return 0;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return 0;
    return Math.min(1, Math.max(0, latest / maxScroll));
  });
  // Converts [0 → 1] progress into "0%" → "100%" for the fill bar's height.
  const progressBarFill = useTransform(scrollProgress, [0, 1], ["0%", "100%"]);

  // Derived from the data prop — never hardcoded.
  const totalVideos = React.useMemo(
    () => data.reduce((sum, b) => sum + b.count, 0),
    [data]
  );

  // Total estimated viewing time — static label in the pill.
  // 13 min avg per long-form educational video.
  const totalHours = Math.round((totalVideos * 13) / 60);

  // Journey % for the pill: when hovering a day, it maps linearly from
  // 0% (Day 1) to journeyPercent (Day N = last day). When idle, shows the
  // full journeyPercent. Only shown when the caller passes journeyPercent.
  const journeyPct = journeyPercent != null && isActiveDay
    ? ((activeIndex! + 1) / data.length) * journeyPercent
    : journeyPercent;

  // Controls whether the expandable stats card is open.
  const [expanded, setExpanded] = React.useState(false);

  const lastClientX = React.useRef(0);

  const tick     = useSound("/sounds/tick.mp3",    SOUND_OPTIONS);
  const popClick = useSound("/sounds/pop-click.wav", SOUND_OPTIONS);

  function getIndexFromX(xVal: number) {
    const scrollLeft = rootRef.current?.scrollLeft  ?? 0;
    const offsetLeft = boundsRef.current?.offsetLeft ?? 0;
    // rootLeft: the Provider's left edge in viewport coordinates.
    // getSnappedX returns viewport X values (position:fixed cursor needs them),
    // but offsetLeft is relative to the offsetParent (Layer 1 div), not the
    // viewport. Without adding rootLeft here the two coordinate systems diverge
    // by floor(rootLeft / LINE_STEP) bars — enough to skip over sparse offline
    // bars entirely and land on a neighbouring video day.
    const rootLeft   = rootRef.current?.getBoundingClientRect().left ?? 0;
    const offset = rootLeft + offsetLeft - scrollLeft - LINE_WIDTH;
    return Math.floor((xVal - offset) / LINE_STEP);
  }

  function getSnappedX(clientX: number) {
    const scrollLeft = rootRef.current?.scrollLeft  ?? 0;
    const offsetLeft = boundsRef.current?.offsetLeft ?? 0;
    const offset = scrollLeft - offsetLeft;
    const rootRect = rootRef.current!.getBoundingClientRect();
    const relativeX = clientX - rootRect.left + offset;
    // + rootRect.left converts back to viewport coordinates.
    // The cursor is position:fixed, so x must be a viewport X value.
    // Without this, snappedX is Provider-relative (correct only when
    // the Provider is flush with the viewport left edge, i.e. rootRect.left=0).
    const snappedX  = Math.floor(relativeX / LINE_STEP) * LINE_STEP + offsetLeft - scrollLeft + rootRect.left;
    return snappedX;
  }

  function setIndexWithSound(index: number) {
    setActiveIndex((prevIndex) => {
      const hasStopped = y.get() === y.getPrevious();
      if (prevIndex !== index && hasStopped && index !== null) tick();
      return index;
    });
  }

  function onPointerDown() {
    popClick();
    setPressed(true);
  }

  // Touch drag: scrub through bars by dragging finger horizontally
  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    if (!touch) return;
    lastClientX.current = touch.clientX;
    const snappedX = getSnappedX(touch.clientX);
    const index = getIndexFromX(snappedX);
    if (index < 0 || index >= data.length) return;
    x.set(snappedX);
    setIndexWithSound(index);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    lastClientX.current = e.clientX;

    if (morph) {
      const snappedX = getSnappedX(e.clientX);
      const index = getIndexFromX(snappedX);
      if (index < 0) return;
      x.set(snappedX);
      setIndexWithSound(index);
      return;
    }

    // Use viewport coordinates directly — the cursor is position: fixed,
    // so it needs viewport-relative coords. The original formula
    // (clientY - rect.top + offsetTop) converts to document space, which
    // is correct only when the Provider is at the page top (offsetTop ≈ 0).
    // When embedded mid-page, offsetTop is large and displaces the cursor.
    const x_ = e.clientX - CURSOR_CENTER;
    const y_ = e.clientY - CURSOR_CENTER;

    if (idle) {
      setIdle(false);
      x.jump(x_);
      y.jump(y_);
    } else {
      x.set(x_);
      y.set(y_);
    }
  }

  useScrollEnd(
    () => {
      if (morph && !isTouch) {
        const snappedX = getSnappedX(lastClientX.current);
        x.set(snappedX);
        // Also sync activeIndex — without this the cursor snaps visually but
        // the label still shows stale data from the last scroll-frame index.
        setIndexWithSound(getIndexFromX(snappedX));
      }
    },
    rootRef,
    [morph, isTouch]
  );

  useMotionValueEvent(scrollX, "change", (latest) => {
    // on touch: cursor is hidden, no scrubbing — just let the container scroll freely
    if (isTouch) return;
    // On desktop: `latest` is the scroll *offset* (px scrolled), NOT a viewport
    // X coordinate. Passing it directly to getIndexFromX returns a wildly wrong
    // index (e.g. −28 when scroll=0) and overwrites whatever onPointerMove just
    // correctly set — causing isOfflineDay to flip false and the Offline label
    // to vanish. Fix: re-derive both the snapped X and the index from the last
    // known cursor position so the active bar tracks the cursor during scroll.
    if (morph) {
      const snappedX = getSnappedX(lastClientX.current);
      x.set(snappedX);
      setIndexWithSound(getIndexFromX(snappedX));
    }
  });

  const context = React.useMemo(
    () => ({ idle, morph, activeIndex, setMorph, setIdle, setActiveIndex, x, y, isTouch, pressed }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, x, y, morph, idle, pressed]
  );

  return (
    // Two sibling layers inside a position:relative wrapper.
    // DOM order = stacking order — no z-index anywhere.
    //
    // Layer 1 (graph)   — renders first  → sits at the bottom
    // Layer 2 (overlay) — renders second → sits on top, no z-index needed
    // CSS Grid stacking: both layers share grid cell "1 / 1".
    // DOM order alone determines paint order — later = on top.
    // No z-index anywhere, no position:absolute on the overlay container.
    // Framer Motion's compositing layers can't escape the grid cell ordering.
    <div style={{ display: "grid" }}>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 1 — Graph (first in DOM → bottom of stack)                   */}
      {/* overflow:hidden clips the bars + progress bar to the rounded card.  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          gridColumn: 1,
          gridRow: 1,
          position: "relative",
          zIndex: 0,           // creates a stacking context that CONTAINS the
                               // position:fixed Cursor and all Framer Motion
                               // compositing layers inside this layer.
          borderRadius: 10,
          border: "1px solid var(--overlay-medium)",
          // background: transparent so the parent card surface shows through (matches grid card system)
          background: "transparent",
          overflow: "hidden",
        }}
      >
        {/* Bottom-edge scroll-progress indicator */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: 2,
            background: "var(--overlay-medium)",
            pointerEvents: "none",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              top: 0, left: 0, bottom: 0,
              width: progressBarFill,
              background: "var(--text-muted)",
            }}
          />
        </div>

        <Provider
          ref={rootRef}
          onPointerMove={isTouch ? undefined : onPointerMove}
          onPointerDown={isTouch ? undefined : onPointerDown}
          onPointerUp={isTouch ? undefined : () => setPressed(false)}
          value={context}
          // on touch: pan-x only so horizontal swipes scroll THIS container, vertical falls through to page
          // on desktop: pan-y only (horizontal stays in JS for bar scrubbing)
          style={{ height: "480px", touchAction: isTouch ? "pan-x" : "pan-y" }}
        >
          <Lines ref={boundsRef} buckets={data} />
          <Cursor>
            <AnimatePresence mode="sync">
              {activeIndex === null && (
                <Label key="range" position="top">
                  {dateRangeLabel}
                </Label>
              )}

              <Label key={String(morph) + "day"} position="bottom">
                {activeDayLabel}
              </Label>

              {activeBucket && (
                <motion.div
                  key="meta"
                  {...blur}
                  className="absolute bottom-[100%] left-[50%] mb-[16px] flex translate-x-[-50%] flex-col"
                >
                  <Meta bucket={activeBucket} minutesPerVideo={minutesPerVideo} />
                </motion.div>
              )}

              {isOfflineDay && (
                <motion.div
                  key="offline"
                  {...blur}
                  className="absolute bottom-[100%] left-[50%] mb-[16px] flex translate-x-[-50%] items-center justify-center"
                >
                  <div className="font-mono text-sm text-gray9 whitespace-nowrap select-none">
                    Offline
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Cursor>
        </Provider>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 2 — Overlay (second in DOM → top of stack)                   */}
      {/* Shares the same grid cell as Layer 1. No position:absolute needed:  */}
      {/* the grid places it exactly over Layer 1 and sizes it to match.      */}
      {/*                                                                      */}
      {/* pointer-events:none so hover falls through to the graph by default. */}
      {/* Backdrop + pill opt back in with pointer-events:auto individually.  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          gridColumn: 1,
          gridRow: 1,
          position: "relative",
          zIndex: 1,           // guaranteed above Layer 1's entire stacking
                               // context (z=0) — browsers cannot bypass this
                               // regardless of compositing optimizations.
          borderRadius: 10,
          pointerEvents: "none",
        }}
      >
        {/* Backdrop — fades in behind the card when expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              onClick={() => setExpanded(false)}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 10,
                background: "rgba(0, 0, 0, 0.38)",
                pointerEvents: "auto",
                cursor: "default",
              }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* ── Pill / expandable stats card ─────────────────────────────────── */}
        {/* Motion notes (Morph Surface principles):                             */}
        {/*   • `initial={false}` — prevents borderRadius animating on load.     */}
        {/*   • Spring 550/45/0.7 = Rauno's SURFACE_SPRING constant.             */}
        {/*   • `delay: 0.08` on collapse gives content time to start fading     */}
        {/*     before the surface shrinks (Motion Choreography).                */}
        {/*   • `overflow: hidden` clips content to the shape during spring.     */}
        {/*   • NO `layout` prop — layout uses FLIP (scale transforms) which     */}
        {/*     distorts CSS border. Height is animated by the inner wrapper     */}
        {/*     instead, keeping the surface border clean at all times.          */}
        {/*   • Two-layer structure: height wrapper controls size (surface       */}
        {/*     morphs), inner div crossfades (content layers in after).         */}
        <motion.div
          initial={false}
          animate={{
            borderRadius: expanded ? 12 : 100,
            background: morph ? "var(--pill-bg-active)" : "var(--pill-bg)",
            borderColor: morph ? "var(--overlay-strong)" : "var(--overlay-medium)",
          }}
          transition={{
            type: "spring",
            stiffness: 550,
            damping: 45,
            mass: 0.7,
            delay: expanded ? 0 : 0.08,
            background: { duration: 0.25, ease: "easeInOut" },
            borderColor: { duration: 0.25, ease: "easeInOut" },
          }}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            pointerEvents: "auto", // opt back in — pill is always clickable
            border: "1px solid",
            overflow: "hidden",
          }}
        >
          {/* Pill header row */}
          <div style={{ display: "flex", alignItems: "center", padding: "6px 6px 6px 12px" }}>
            <span className="font-mono text-[12px] text-gray9 select-none whitespace-nowrap">
              ~{totalHours.toLocaleString()}h
            </span>

            <PillDivider />

            <span className="font-mono text-[12px] text-gray9 select-none whitespace-nowrap">
              {totalVideos.toLocaleString()}
            </span>

            {/* Journey progress — only shown when journeyPercent is explicitly passed */}
            {journeyPercent != null && journeyPct != null && (
              <>
                <PillDivider />
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <ProgressRing
                    current={journeyPct}
                    endpoint={journeyPercent}
                    size={13}
                    strokeWidth={1.5}
                    activeStroke={morph ? "var(--accent)" : expanded ? "var(--text-muted)" : "var(--text-primary)"}
                  />
                  <span
                    className="font-mono text-[12px] select-none whitespace-nowrap tabular-nums"
                    style={{
                      color: morph ? "var(--accent)" : expanded ? "var(--text-muted)" : "var(--text-primary)",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {journeyPct.toFixed(2)}%
                  </span>
                </div>
              </>
            )}

            {/* Spacer pins the button to the right edge */}
            <div style={{ flex: 1, minWidth: 6 }} />

            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "none",
                background: expanded ? "var(--overlay-medium)" : "transparent",
                cursor: "pointer",
                color: expanded ? "var(--text-secondary)" : "var(--text-faint)",
                flexShrink: 0,
                padding: 0,
                transition: "background 0.18s ease, color 0.18s ease",
              }}
              aria-label={expanded ? "Collapse stats" : "Expand stats"}
            >
              <ExpandIcon open={expanded} />
            </button>
          </div>

          {/* Height wrapper — surface controls size; spring matches outer container */}
          {/* Inner content is opacity-only: morph the surface, crossfade the contents */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                key="stats-height"
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ type: "spring", stiffness: 550, damping: 45, mass: 0.7 }}
                style={{ overflow: "hidden" }}
              >
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 550, damping: 45, mass: 0.7 }}
              >
                <div style={{ height: 1, background: "var(--overlay-medium)", margin: "0 12px" }} />

                <div style={{ padding: "6px 14px 14px", minWidth: 210 }}>
                  <StatRow label="Watch time"       value={`~${totalHours.toLocaleString()}h`} highlight />
                  <StatRow label="Total videos"     value={totalVideos.toLocaleString()} />
                  <StatRow label="Daily avg videos" value={`~${Math.round(totalVideos / Math.max(1, data.filter(b => b.count > 0).length))} / day`} />
                  <StatRow label="Daily avg time"   value={`~${Math.round(totalVideos / Math.max(1, data.filter(b => b.count > 0).length) * minutesPerVideo / 60 * 10) / 10}h / day`} />

                  <div style={{ height: 1, background: "var(--overlay-subtle)", margin: "9px 0 2px" }} />

                  <StatRow label="Active days"   value={`${data.filter(b => b.count > 0).length} of ${data.length}`} />

                  {/* Journey row — only shown when journeyPercent prop is provided */}
                  {journeyPercent != null && (
                    <>
                      <div style={{ height: 1, background: "var(--overlay-subtle)", margin: "9px 0 2px" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, paddingTop: 7 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <ProgressRing current={journeyPercent} endpoint={journeyPercent} size={12} strokeWidth={1.5} activeStroke="var(--text-primary)" animateOnMount />
                          <span className="font-mono text-[10px] select-none whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                            Design Engineer
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-medium select-none whitespace-nowrap tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {journeyPercent.toFixed(2)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

    </div>
  );
}
