"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type YouTubeStats } from "@/lib/compute-stats";

// ─── Constants ────────────────────────────────────────────────────────────────
const TICK_COUNT = 40;

// ── Pop-click sound singleton ─────────────────────────────────────────────────
// one Audio node shared across open/close — avoids creating a new instance per click
let _popClickAudio: HTMLAudioElement | null = null;

function playPopClick() {
  if (typeof window === "undefined") return;
  if (!_popClickAudio) {
    _popClickAudio = new Audio("/sounds/pop-click.wav");
    // volume: 0.45 — slightly louder than the hover tick, matches a deliberate action
    _popClickAudio.volume = 0.45;
  }
  // currentTime reset: lets rapid open/close re-trigger without waiting for playback to end
  _popClickAudio.currentTime = 0;
  _popClickAudio.play().catch(() => {});
}
const TICK_H     = 20;

// ─── Design system springs (from established-patterns.md) ────────────────────
const DEFAULT_SPRING = { type: "spring", stiffness: 400, damping: 40 } as const;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface BuilderEnergyProps {
  stats: YouTubeStats;
  /** ms before card entry begins */
  animationDelay?: number;
  /**
   * "card" — standalone with border/padding (default)
   * "bare" — content only, for embedding inside GridCard
   */
  variant?: "card" | "bare";
  name?: string;
  /**
   * When true, the pill triggers a count-up from real score → 100.
   * False on the grid (static), true inside the modal.
   */
  countUp?: boolean;
  /**
   * When true (modal context), starts in the active/hovered visual state —
   * pill bg elevated, labels at full readable contrast.
   */
  active?: boolean;
  /**
   * When true, hides the stat cells (focus/consistency/daily avg) and
   * centers the tick bar — matches the Top Searches grid card style.
   */
  hideStats?: boolean;
  /** Called when the card is clicked — used by the grid to open the modal */
  onOpen?: () => void;
}

// ─── Explore label — mirrors ExpandToggle in top-searches.tsx ────────────────
function ExploreLabel({ onOpen }: { onOpen?: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: onOpen ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        className="font-mono select-none"
        style={{
          fontSize: 9,
          color: hovered ? "var(--text-secondary)" : "var(--text-faint)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transition: "color 0.15s",
        }}
      >
        Explore builder energy
      </span>
      <span
        className="font-mono select-none"
        style={{
          fontSize: 9,
          color: hovered ? "var(--text-secondary)" : "var(--text-faint)",
          transition: "color 0.15s",
          lineHeight: 1,
        }}
      >
        ↓
      </span>
    </button>
  );
}

// ─── Stat cell ────────────────────────────────────────────────────────────────
function StatCell({ label, value, highlight, labelColor }: { label: string; value: string; highlight?: boolean; labelColor?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        className="font-mono select-none"
        style={{
          fontSize: 9,
          color: labelColor ?? "var(--color-gray8)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        className="font-mono select-none"
        style={{
          fontSize: 13,
          color: highlight ? "var(--color-orange)" : "var(--color-gray12)",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BuilderEnergy({
  stats,
  animationDelay = 0,
  variant = "card",
  name,
  countUp = false,
  active = false,
  hideStats = false,
  onOpen,
}: BuilderEnergyProps) {
  const score        = stats.builderEnergy;
  const delayS       = animationDelay / 1000;
  const isCard       = variant === "card";

  // ─ Derived stats ──────────────────────────────────────────────────────────
  const daysActive   = stats.dailyBuckets.filter((d) => d.count > 0).length;
  const consistency  = Math.round((daysActive / Math.max(stats.totalDays, 1)) * 100);
  const knownSum     = stats.aiPercent + stats.engineeringPercent + stats.designPercent + stats.startupPercent;
  const weightedFocusRaw = knownSum > 0
    ? (stats.aiPercent * 1.0 + stats.engineeringPercent * 0.90 + stats.designPercent * 0.85 + stats.startupPercent * 0.75) / knownSum
    : 0.75;
  const builderFocus = Math.round(weightedFocusRaw * 100);

  // ─ Choreography timing (sequential, not simultaneous) ─────────────────────
  // Beat 1 — card entry:  blur-in at delayS
  // Beat 2 — tick reveal: clipPath sweep + % badge fades in (the hint)
  // Beat 3 — pill expand: score number morphs in
  const tickRevealDelay = delayS + 0.3;
  const statsDelay      = tickRevealDelay + 0.65;
  const scoreTarget     = Math.round(score * 100);

  // ─ Hover state (for pill background lift, like the line graph pill) ────────
  // When active=true (modal context), always treat as hovered — stable override.
  const [isHoveredState, setIsHovered] = React.useState(false);
  const isHovered = active || isHoveredState;

  // ─ Grouped-button pill ────────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = React.useState(false);

  // ─ Counter: starts at real score, climbs to 100 after pill expands ────────
  // key={displayScore} remounts the span on each increment → digit tumbles.
  // Tick bar fills proportionally from displayScore.
  const [displayScore, setDisplayScore] = React.useState(scoreTarget);
  React.useEffect(() => { setDisplayScore(scoreTarget); }, [scoreTarget]);
  const filledCount = Math.round((displayScore / 100) * TICK_COUNT);

  // Beat 3: auto-expand pill to show real score after entry animation
  React.useEffect(() => {
    const t = setTimeout(() => setIsExpanded(true), statsDelay * 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsDelay]);

  // Count up only in the modal (countUp=true). On the grid the score stays static.
  React.useEffect(() => {
    if (!isExpanded || !countUp) return;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayScore((prev) => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 1;
        });
      }, 900);
    }, 300); // wait for pill expand to settle + intentional pause
    return () => { clearTimeout(start); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, countUp]);

  // Shared tick bar — same in both layout modes
  const tickBar = (
    <motion.div
      style={{ display: "flex", gap: 3, alignItems: "stretch", width: "100%" }}
      initial={{ clipPath: "inset(0 100% 0 0 round 2px)" }}
      animate={{ clipPath: "inset(0 0% 0 0 round 2px)" }}
      transition={{
        delay: tickRevealDelay,
        duration: 0.65,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {Array.from({ length: TICK_COUNT }).map((_, i) => {
        const filled = i < filledCount;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: TICK_H,
              borderRadius: 2,
              backgroundColor: filled ? "var(--color-gray12)" : "var(--overlay-medium)",
              flexShrink: 0,
            }}
          />
        );
      })}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ ...DEFAULT_SPRING, delay: delayS }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpen}
      style={{
        display: "flex",
        flexDirection: "column",
        height: isCard ? "auto" : "100%",
        padding: "20px 22px",
        justifyContent: "space-between",
        cursor: onOpen ? "pointer" : "default",
        ...(isCard ? {
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--overlay-medium)",
          borderRadius: 12,
          boxShadow: "0 0 0 1px rgba(233,95,56,0.08), 0 4px 24px rgba(0,0,0,0.3)",
          minWidth: 280,
        } : {}),
      }}
    >
      {/* ── Top: label + % pill ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          className="select-none"
          style={{
            fontSize: 9,
            color: "var(--text-faint)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'Geist Mono', ui-monospace, monospace",
          }}
        >
          {name ?? "Builder Energy"}
        </span>

        {/* Percentage pill */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: tickRevealDelay }}
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <motion.div
            layout
            animate={{
              backgroundColor: isHovered ? "var(--overlay-medium)" : "var(--overlay-subtle)",
              borderColor:     isHovered ? "var(--overlay-strong)"  : "var(--overlay-medium)",
            }}
            transition={{
              layout:          { type: "spring", stiffness: 300, damping: 30 },
              backgroundColor: { duration: 0.2, ease: "easeInOut" },
              borderColor:     { duration: 0.2, ease: "easeInOut" },
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 26,
              borderRadius: 999,
              padding: 3,
              gap: 2,
              border: "1px solid",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="popLayout">
              {isExpanded && (
                <motion.span
                  key={displayScore}
                  initial={{ opacity: 0, filter: "blur(2px)", y: 8 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(2px)", y: -12 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.23, 0.88, 0.26, 0.92],
                    exit: { duration: 0.18, ease: [0.23, 0.88, 0.26, 0.92] },
                  }}
                  className="font-mono select-none"
                  style={{
                    fontSize: 11,
                    color: "var(--color-gray11)",
                    letterSpacing: "-0.01em",
                    fontVariantNumeric: "tabular-nums",
                    padding: "0 5px 0 4px",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    height: 20,
                  }}
                >
                  {displayScore}
                </motion.span>
              )}
            </AnimatePresence>

            <button
              onClick={() => { playPopClick(); setIsExpanded((e) => !e); }}
              className="font-mono select-none"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 20,
                minWidth: 20,
                padding: "0 5px",
                borderRadius: 999,
                border: "1px solid var(--overlay-medium)",
                backgroundColor: "var(--overlay-medium)",
                color: "var(--color-gray12)",
                cursor: "pointer",
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              %
            </button>
          </motion.div>
        </motion.span>
      </div>

      {/* ── Middle + Bottom ── */}
      {hideStats ? (
        // Grid mode: bar + explore label grouped together and centered — matches Top Searches card layout
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          <div style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "1px solid var(--overlay-medium)", backgroundColor: "var(--overlay-subtle)", overflow: "hidden" }}>
            {tickBar}
          </div>
          <ExploreLabel onOpen={onOpen} />
        </div>
      ) : (
        <>
          <div style={{ margin: "14px 0 16px" }}>
            <div style={{ width: "100%", padding: "14px 20px", borderRadius: 10, border: "1px solid var(--overlay-medium)", backgroundColor: "var(--overlay-subtle)", overflow: "hidden" }}>
              {tickBar}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...DEFAULT_SPRING, delay: statsDelay }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px", paddingTop: 14, borderTop: "1px solid var(--overlay-subtle)" }}
          >
            <StatCell label="Builder focus" value={`${builderFocus}%`} highlight labelColor={isHovered ? "var(--text-secondary)" : undefined} />
            <StatCell label="Consistency"   value={`${consistency}%`}         labelColor={isHovered ? "var(--text-secondary)" : undefined} />
            <StatCell label="Daily avg"     value={`${stats.avgVideosPerDay.toFixed(0)}/day`}  labelColor={isHovered ? "var(--text-secondary)" : undefined} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
