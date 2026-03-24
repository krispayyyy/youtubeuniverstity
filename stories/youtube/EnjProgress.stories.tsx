"use client";

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { motion, AnimatePresence, useSpring, useMotionValue, animate, type MotionValue } from "framer-motion";
import {
  useProximity,
  useMouseX,
  LINE_HEIGHT,
  LINE_HEIGHT_ACTIVE,
  LINE_WIDTH,
} from "@/components/line-minimap";
import GlassSurface from "@/components/ui/glass-surface";
import { ElevatedSection } from "@/components/ui/elevated-section";

// ─── Drag constants (mirroring CareerTuner for consistency) ──────────────────
// snap spring: what the pill springs back to after release
const SNAP_SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };
// magnetic: tiny gravity pull toward cursor on hover (affordance)
const MAGNET_STRENGTH = 0.025; // fraction of cursor-to-center distance applied as drift
const MAGNET_SPRING   = { stiffness: 280, damping: 26, mass: 0.8 } as const;

// ─── Rubber band (simulating-physics principle) ──────────────────────────────
// √ falloff past boundaries: feels sticky/wrong, communicates the limit without a hard stop.
// factor: how far it stretches — lower = stiffer resistance (try 1.5 for very tight, 3 for elastic)
function dampen(val: number, [min, max]: [number, number], factor = 2): number {
  if (val > max) {
    // past right bound: sqrt compression — movement slows dramatically the further you go
    return max + Math.sqrt(val - max) * factor;
  } else if (val < min) {
    // past left bound: same idea, mirrored
    return min - Math.sqrt(min - val) * factor;
  }
  return val;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Youtube / EnjProgress",
};
export default meta;
type Story = StoryObj;

// ─── Progress Pill ────────────────────────────────────────────────────────────
// Exported so grid cards can place it in their own header row (top-right, like # in LongestStreak)
// Same expand/collapse convention as StreakPillMain — click the % badge to reveal
// the full number, click again to collapse back to the badge.

export function ProgressPill({ progress }: { progress: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const [hovered, setHovered]   = React.useState(false);
  const pct = Math.round(progress * 100);

  return (
    <motion.div
      layout
      animate={{
        backgroundColor: hovered ? "var(--overlay-medium)" : "var(--overlay-subtle)",
        borderColor:     hovered ? "var(--overlay-strong)"  : "var(--overlay-medium)",
      }}
      transition={{
        layout:          { type: "spring", stiffness: 300, damping: 30 },
        backgroundColor: { duration: 0.2, ease: "easeInOut" },
        borderColor:     { duration: 0.2, ease: "easeInOut" },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", height: 26, borderRadius: 999, padding: 3, gap: 2, border: "1px solid", cursor: "pointer" }}
    >
      <AnimatePresence mode="popLayout">
        {expanded && (
          <motion.span
            key="expanded"
            initial={{ opacity: 0, filter: "blur(2px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(2px)", y: -12 }}
            transition={{ duration: 0.35, ease: [0.23, 0.88, 0.26, 0.92] }}
            className="font-mono select-none"
            style={{ fontSize: 11, color: "var(--color-gray11)", letterSpacing: "0.04em", padding: "0 5px 0 4px", lineHeight: 1, display: "flex", alignItems: "center", height: 20, fontVariantNumeric: "tabular-nums" }}
          >
            {pct}
          </motion.span>
        )}
      </AnimatePresence>
      {/* % badge — matches the # badge in StreakPillMain */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
        className="font-mono select-none"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, minWidth: 20, padding: "0 5px", borderRadius: 999, border: "1px solid var(--overlay-medium)", backgroundColor: "var(--overlay-medium)", color: "var(--color-gray12)", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
      >
        %
      </button>
    </motion.div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TICK_COUNT = 120;
// Major tick every 7th — matches the Figma ruler pattern (1 tall + 6 short per group)
const MAJOR_INTERVAL = 7;
// Tick heights sourced from Figma (major: 70px → scaled down, minor: 52px → scaled down)
const TICK_HEIGHT_MAJOR = LINE_HEIGHT_ACTIVE; // 32px — tall, bright
const TICK_HEIGHT_MINOR = LINE_HEIGHT;        // 24px — short, dim

// ─── Single Tick ──────────────────────────────────────────────────────────────

function Tick({
  index,
  mouseX,
  isMajor,
  cardHovered,
  disabled = false,
}: {
  index: number;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  isMajor: boolean;
  cardHovered?: boolean;
  /** True for ticks past the current progress — dimmed, no hover/proximity response */
  disabled?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const scaleY = useSpring(1, { damping: 45, stiffness: 600 });
  const scrollX = useMotionValue(0);

  useProximity(scaleY, {
    ref,
    baseValue: 1,
    mouseX,
    scrollX,
    centerX: 0,
  });

  return (
    <motion.div
      ref={ref}
      style={{
        width: LINE_WIDTH,
        height: isMajor ? TICK_HEIGHT_MAJOR : TICK_HEIGHT_MINOR,
        backgroundColor: disabled
          // future ticks: very faint, no hover response
          ? isMajor ? "var(--tick-major-disabled)" : "var(--tick-minor-disabled)"
          // completed ticks: normal hover behaviour
          : isMajor
            ? cardHovered ? "var(--tick-major-hover)" : "var(--tick-major-rest)"
            : cardHovered ? "var(--tick-minor-hover)" : "var(--tick-minor-rest)",
        transition: "background-color 0.15s ease",
        // disabled ticks stay at scale 1 — proximity scale only applies to completed region
        scaleY: disabled ? 1 : scaleY,
        transformOrigin: "center",
        flexShrink: 0,
        pointerEvents: disabled ? "none" : "auto",
      }}
    />
  );
}

// ─── Glass Config ─────────────────────────────────────────────────────────────

export interface GlassConfig {
  distortionScale: number;
  blur: number;
  brightness: number;
  backgroundOpacity: number;
  saturation: number;
  redOffset: number;
  greenOffset: number;
  blueOffset: number;
  orangeTint: number;        // 0–1 — orange background overlay
  pillWidth: number;         // px
  heightBonus: number;       // px beyond tick area, split top + bottom
  borderRadius: number;
  rimOpacity: number;        // 0–1 — white rim border opacity
  topHighlight: number;      // 0–1 — inner top-edge specular highlight opacity
  dropShadow: number;        // 0–1 — drop shadow opacity (lifts pill off ruler)
}

export const DEFAULT_GLASS: GlassConfig = {
  // values locked in via the Tuner (screenshot 2026-03-23)
  distortionScale: -31,
  blur: 14,
  brightness: 60,
  backgroundOpacity: 0.40,
  saturation: 0.3,
  redOffset: 11,
  greenOffset: 10,
  blueOffset: 14,
  orangeTint: 0.53,
  pillWidth: 28,
  heightBonus: 47,
  borderRadius: 8,
  rimOpacity: 0.10,
  topHighlight: 0.05,
  dropShadow: 0.23,
};

// ─── Progress Indicator ───────────────────────────────────────────────────────
// Draggable glass pill. Snap-back on release, magnetic hover drift (gravity affordance).
// Pattern from CareerTuner: pointer capture → constrained offset → SNAP_SPRING on pointerup.

function ProgressIndicator({
  progress,
  glass = DEFAULT_GLASS,
  rulerRef,
  cardHovered = false,
}: {
  progress: number;
  glass?: GlassConfig;
  rulerRef: React.RefObject<HTMLDivElement>;
  /** Card-level hover — triggers the orange deepening affordance */
  cardHovered?: boolean;
}) {
  const hitRef        = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const isHoveredRef  = React.useRef(false);
  const progressRef   = React.useRef(progress);
  progressRef.current = progress;

  // offsetX: extra px from locked position. 0 = resting at progress%.
  const offsetX = useMotionValue(0);

  // Reset offset when locked progress changes (different story, etc.)
  React.useEffect(() => {
    if (!isDraggingRef.current) animate(offsetX, 0, SNAP_SPRING);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // Magnetic hover — tiny gravity pull toward cursor (shows it's draggable before first drag)
  React.useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const handleMove = (e: MouseEvent) => {
      if (isDraggingRef.current || !isHoveredRef.current) return;
      const hit = hitRef.current;
      if (!hit) return;
      const rect    = hit.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      animate(offsetX, (e.clientX - centerX) * MAGNET_STRENGTH, { type: "spring", ...MAGNET_SPRING });
    };
    ruler.addEventListener("mousemove", handleMove);
    return () => ruler.removeEventListener("mousemove", handleMove);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native pointer drag — registered once, all mutable state via refs (same pattern as CareerTuner)
  React.useEffect(() => {
    const el = hitRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      e.stopPropagation();               // don't bubble to GridCard onClick
      el.setPointerCapture(e.pointerId); // route events here even outside pill bounds
      el.style.cursor = "grabbing";
      isDraggingRef.current = true;

      const startClientX = e.clientX;
      const startOffset  = offsetX.get();

      const onMove = (me: PointerEvent) => {
        const ruler = rulerRef.current;
        if (!ruler) return;
        const rulerW   = ruler.getBoundingClientRect().width;
        const lockedPx = progressRef.current * rulerW;
        const raw = startOffset + (me.clientX - startClientX);
        // rubber band: hard left boundary (can't un-complete progress), soft right boundary
        // right side dampens past 0 — feels wrong/resistant, snaps back cleanly on release
        offsetX.set(dampen(Math.max(-lockedPx, raw), [-lockedPx, 0]));
      };

      const onUp = () => {
        el.style.cursor = "grab";
        isDraggingRef.current = false;
        el.removeEventListener("pointermove",   onMove);
        el.removeEventListener("pointerup",     onUp);
        el.removeEventListener("pointercancel", onUp);
        animate(offsetX, 0, SNAP_SPRING); // spring back to locked position
      };

      el.addEventListener("pointermove",   onMove);
      el.addEventListener("pointerup",     onUp);
      el.addEventListener("pointercancel", onUp);
    };

    // Also stop the synthetic click the browser fires after drag+release from bubbling
    // to the card's onClick — pointerdown.stopPropagation() alone doesn't cover it
    const stopClick = (e: MouseEvent) => e.stopPropagation();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("click", stopClick);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("click", stopClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Outer div: handles absolute positioning at the locked progress %
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: `${progress * 100}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        height: `calc(100% + ${glass.heightBonus}px)`,
        width: glass.pillWidth,
        zIndex: 2,
        pointerEvents: "none", // pass through to ruler proximity by default
      }}
    >
      {/* motion.div: the interactive hit target — drag + magnetic */}
      <motion.div
        ref={hitRef}
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          if (!isDraggingRef.current) animate(offsetX, 0, SNAP_SPRING);
        }}
        style={{
          width: "100%",
          height: "100%",
          x: offsetX,
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          pointerEvents: "all",
        }}
      >
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={glass.borderRadius}
          borderWidth={0.1}
          brightness={glass.brightness}
          opacity={0.88}
          blur={glass.blur}
          backgroundOpacity={glass.backgroundOpacity}
          saturation={glass.saturation}
          distortionScale={glass.distortionScale}
          redOffset={glass.redOffset}
          greenOffset={glass.greenOffset}
          blueOffset={glass.blueOffset}
          style={{
            width: "100%",
            height: "100%",
            background: `rgba(233, 95, 56, var(--pill-orange-tint, ${glass.orangeTint}))`,
            // suppress GlassSurface's own border/shadow — our overlay handles framing
            border: "none",
            boxShadow: "none",
          }}
        />
        {/* Glass-edge overlay: rim + top highlight + drop shadow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: glass.borderRadius,
            border: `1px solid rgba(255, 255, 255, ${glass.rimOpacity})`,
            boxShadow: [
              `inset 0 1.5px 0 0 rgba(255, 255, 255, ${glass.topHighlight})`,
              `inset 0 -1px 0 0 rgba(255, 255, 255, ${glass.rimOpacity * 0.25})`,
              `0 4px 12px rgba(0, 0, 0, ${glass.dropShadow})`,
            ].join(", "),
            pointerEvents: "none",
          }}
        />
        {/* Card hover overlay — deepens the orange when card is hovered (clickable affordance).
            Burnt orange layer adds warmth/richness rather than just dimming with black. */}
        <motion.div
          animate={{ opacity: cardHovered ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: glass.borderRadius,
            // deep burnt orange: same hue as the pill, just richer/darker — not a dim veil
            background: "rgba(160, 45, 10, 0.35)",
            pointerEvents: "none",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── EnjProgress ──────────────────────────────────────────────────────────────
//
// Full-width ruler that visualizes your progress from designer → engineer.
// The tick layout uses justify-content: space-between so ticks stretch to fill
// any container width — the proximity animation uses getBoundingClientRect()
// internally so it works correctly regardless of the computed tick spacing.

export function EnjProgress({
  progress = 0.35,
  glass,
  label,
  showFooter = true,
  hideLabel = false,
  hovered = false,
}: {
  progress?: number;
  glass?: GlassConfig;
  /** Override the header label text */
  label?: string;
  /** Show the Jan '25 / Dec '26 date labels at the bottom (default: true) */
  showFooter?: boolean;
  /** Hide the top label row entirely (for cards that handle labels externally) */
  hideLabel?: boolean;
  /** Card hover state — brightens the label text to match other grid card conventions */
  hovered?: boolean;
}) {
  const { mouseX, onMouseMove, onMouseLeave } = useMouseX();
  // rulerRef: passed to ProgressIndicator so drag can measure ruler width for bounds
  const rulerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Label row — hidden when hideLabel=true (card handles label externally) */}
      {!hideLabel && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
          <span
            className="font-mono select-none"
            style={{
              fontSize: 9,
              // hovered: step up to var(--text-secondary), matching other grid card labels
              color: hovered ? "var(--text-secondary)" : "var(--text-faint)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              transition: "color 0.15s ease",
            }}
          >
            {label ?? `Design engineer progress (${Math.round(progress * 22)}/22)`}
          </span>
          <ProgressPill progress={progress} />
        </div>
      )}

      {/* Ruler */}
      <div
        ref={rulerRef}
        style={{ position: "relative", width: "100%" }}
        onPointerMove={onMouseMove}
        onPointerLeave={onMouseLeave}
      >
        {/* Ticks */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {Array.from({ length: TICK_COUNT }).map((_, i) => (
            <Tick
              key={i}
              index={i}
              mouseX={mouseX}
              isMajor={i % MAJOR_INTERVAL === 0 || i === TICK_COUNT - 1}
              cardHovered={hovered}
              // ticks past progress fraction are "future" — dimmed, no hover
              disabled={i / (TICK_COUNT - 1) > progress}
            />
          ))}
        </div>

        {/* Progress indicator — draggable, snaps back to locked position */}
        <ProgressIndicator progress={progress} glass={glass} rulerRef={rulerRef} cardHovered={hovered} />
      </div>

      {/* Bottom row: date range (left/right) + conceptual axis labels — hidden in minimal/embedded use */}
      {showFooter && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px", marginTop: 4 }}>
          {/* Left — start date + concept label stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              className="font-mono select-none"
              style={{
                fontSize: 8,
                color: hovered ? "rgba(220,214,208,0.45)" : "rgba(220,214,208,0.22)",
                letterSpacing: "0.08em",
                transition: "color 0.15s ease",
              }}
            >
              Jan '25
            </span>
            <span
              className="font-mono select-none"
              style={{
                fontSize: 8,
                color: hovered ? "rgba(220,214,208,0.38)" : "rgba(220,214,208,0.18)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.15s ease",
              }}
            >
              Designer
            </span>
          </div>

          {/* Right — end date + concept label stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
            <span
              className="font-mono select-none"
              style={{
                fontSize: 8,
                color: hovered ? "rgba(220,214,208,0.45)" : "rgba(220,214,208,0.22)",
                letterSpacing: "0.08em",
                transition: "color 0.15s ease",
              }}
            >
              Dec '26
            </span>
            <span
              className="font-mono select-none"
              style={{
                fontSize: 8,
                color: hovered ? "rgba(220,214,208,0.38)" : "rgba(220,214,208,0.18)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.15s ease",
              }}
            >
              Engineer
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

function StoryShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#111",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        {children}
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <StoryShell>
      <EnjProgress progress={0.35} />
    </StoryShell>
  ),
};

export const EarlyStage: Story = {
  render: () => (
    <StoryShell>
      <EnjProgress progress={0.15} />
    </StoryShell>
  ),
};

export const Halfway: Story = {
  render: () => (
    <StoryShell>
      <EnjProgress progress={0.5} />
    </StoryShell>
  ),
};

export const AlmostThere: Story = {
  render: () => (
    <StoryShell>
      <EnjProgress progress={0.82} />
    </StoryShell>
  ),
};

// Card shell that matches the polished grid's GridCard surface exactly
function CardShell({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false);
  const EASE = "cubic-bezier(0.2,0,0,1)";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 10,
        border: `1px solid ${hovered ? "var(--card-border-hover)" : "var(--card-border-rest)"}`,
        backgroundColor: hovered ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
        boxShadow: hovered ? "var(--card-shadow-hover-inner)" : "var(--card-shadow-rest)",
        transition: [
          `border-color 0.12s ${EASE}`,
          `background-color 0.2s ${EASE}`,
          `box-shadow 0.28s ${EASE}`,
        ].join(", "),
        // same padding convention as the grid cards (padding 20px 22px)
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

// InCard: EnjProgress seated inside a polished grid card
export const InCard: Story = {
  render: () => (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 960 }}>
        <CardShell>
          <EnjProgress progress={0.35} />
        </CardShell>
      </div>
    </div>
  ),
};

// Interactive: scrub the progress position
export const Interactive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [progress, setProgress] = React.useState(0.35);
    return (
      <StoryShell>
        <EnjProgress progress={progress} />
        <div style={{ marginTop: 40 }}>
          <input
            type="range" min={0} max={100} value={Math.round(progress * 100)}
            onChange={e => setProgress(Number(e.target.value) / 100)}
            style={{ width: "100%", accentColor: "var(--color-orange, #E95F38)" }}
          />
        </div>
      </StoryShell>
    );
  },
};

// ─── Tuner ────────────────────────────────────────────────────────────────────
// Live controls for every GlassSurface parameter + progress.
// Goal: dial in a "glass orange" pill — frosted glass with an orange tint.

function TunerSlider({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", width: 110, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "var(--color-orange, #E95F38)", height: 2 }}
      />
      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-secondary)", width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Checklist data ───────────────────────────────────────────────────────────
// 20 milestones mapping the designer → design engineer journey.
// At progress p, the first Math.round(p × 20) items are checked.

const CHECKLIST_ITEMS: { text: string; phase: "designer" | "hybrid" | "engineer" }[] = [
  // ── Designer foundations ──────────────────────────────────────────────────
  { text: "built a responsive layout with HTML & CSS — no copy-paste",   phase: "designer" },
  { text: "translated a Figma component to code with pixel accuracy",    phase: "designer" },
  { text: "made a page interactive with vanilla JavaScript",             phase: "designer" },
  { text: "shipped a full page with Tailwind from a blank file",         phase: "designer" },
  { text: "deployed a project to a live URL for the first time",         phase: "designer" },
  { text: "managed a codebase across time — commits, branches, no file chaos", phase: "designer" },
  // ── Builder skills ────────────────────────────────────────────────────────
  { text: "built a React component without following a tutorial",        phase: "hybrid"   },
  { text: "composed multiple components into a page that shipped",       phase: "hybrid"   },
  { text: "fetched real data from an API and put it on screen",          phase: "hybrid"   },
  { text: "typed a component with TypeScript and caught a real bug",     phase: "hybrid"   },
  { text: "implemented an animation you designed — not one from a demo", phase: "hybrid"   },
  { text: "wrote a custom hook to share logic across components",        phase: "hybrid"   },
  { text: "debugged a broken layout in a codebase that wasn't yours",    phase: "hybrid"   },
  { text: "used an AI coding tool to ship something you couldn't have shipped alone", phase: "hybrid"   },
  { text: "owned a feature from Figma frame to deployed URL",            phase: "hybrid"   },
  // ── Engineer mindset ──────────────────────────────────────────────────────
  { text: "built or extended a design system with real tokens",          phase: "engineer" },
  { text: "made a meaningful performance improvement on something live", phase: "engineer" },
  { text: "got a PR merged into someone else's codebase",                phase: "engineer" },
  { text: "shipped accessible components — a11y from the start, not an afterthought", phase: "engineer" },
  { text: "made a design decision under engineering constraints — and shipped it", phase: "engineer" },
  { text: "had someone ask \"who designed that?\" and \"who built that?\" — same thing", phase: "engineer" },
  { text: "introduced yourself as a design engineer without hesitating", phase: "engineer" },
];

function getCheckedCount(progress: number): number {
  return Math.round(progress * CHECKLIST_ITEMS.length);
}

// ─── Mini ruler ───────────────────────────────────────────────────────────────
// Simplified tick — no proximity hover spring, just static color based on completion.
// Draggable glass pill still works via ProgressIndicator.

const MINI_TICK_N    = 60;
const MINI_MAJOR_INT = 7;

function MiniTick({
  isMajor, completed, index, mouseX,
}: {
  isMajor: boolean; completed: boolean; index: number; mouseX: MotionValue<number>;
}) {
  const ref   = React.useRef<HTMLDivElement>(null);
  // spring: drives both the entry wave (0 → 1) and the proximity hover (1 → 1+)
  const scaleY  = useSpring(0, { damping: 45, stiffness: 600 });
  // static scrollX — no page scroll inside the modal
  const scrollX = useMotionValue(0);

  // entry wave: stagger each tick's spring from 0 → 1 via timeout (try 8–14ms per tick)
  React.useEffect(() => {
    const t = setTimeout(() => scaleY.set(1), index * 10);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // proximity hover: same mechanism as the main ruler, subtler intensity (4 vs default 7)
  useProximity(scaleY, {
    ref,
    baseValue: 1,
    mouseX,
    scrollX,
    centerX: 0, // unused — mouseX handler re-reads getBoundingClientRect live
    intensity: 4,
  });

  return (
    <motion.div
      ref={ref}
      style={{
        width: LINE_WIDTH,
        height: isMajor ? 16 : 11,
        backgroundColor: completed
          ? (isMajor ? "rgba(220,214,208,0.68)" : "rgba(107,101,96,0.60)")
          : (isMajor ? "rgba(220,214,208,0.11)" : "rgba(107,101,96,0.09)"),
        flexShrink: 0,
        scaleY,
        transformOrigin: "50% 100%",
      }}
    />
  );
}

function MiniRuler({ progress }: { progress: number }) {
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = React.useState(false);
  // mouseX: shared motion value passed to every MiniTick so proximity springs fire
  const { mouseX, onMouseMove, onMouseLeave } = useMouseX();

  return (
    <div
      ref={rulerRef}
      style={{ position: "relative", width: "100%" }}
      onPointerMove={(e) => { onMouseMove(e); setHovered(true); }}
      onPointerLeave={(e) => { onMouseLeave(e); setHovered(false); }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {Array.from({ length: MINI_TICK_N }).map((_, i) => (
          <MiniTick
            key={i}
            index={i}
            mouseX={mouseX}
            isMajor={i % MINI_MAJOR_INT === 0 || i === MINI_TICK_N - 1}
            completed={i / (MINI_TICK_N - 1) <= progress}
          />
        ))}
      </div>
      {/* Glass pill — cardHovered brightens on hover, same convention as main card */}
      <ProgressIndicator progress={progress} rulerRef={rulerRef} cardHovered={hovered} />
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
// Follows the FullStory.stories.tsx pattern exactly:
// backdrop at z:200, centering wrapper at z:201.
// position:fixed on both ensures the overlay covers the full page, not just the card.

const ENJ_MODAL_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const ENJ_MODAL_EXIT   = { type: "spring" as const, stiffness: 600, damping: 35 };

function EnjModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — click to dismiss */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 200,
        }}
      />
      {/* Centering wrapper — pointer-events:none keeps backdrop click working */}
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 201, pointerEvents: "none",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0, y: 10, scale: 0.97,
            transition: {
              scale: ENJ_MODAL_EXIT, y: ENJ_MODAL_EXIT,
              opacity: { duration: 0.14, ease: "easeIn" },
            },
          }}
          transition={{
            opacity: { duration: 0.18, ease: "easeOut" },
            scale: ENJ_MODAL_SPRING,
            y:     ENJ_MODAL_SPRING,
          }}
          style={{ pointerEvents: "all" }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

// ─── Shared close button ──────────────────────────────────────────────────────

function ModalCloseBtn({ onClose }: { onClose: () => void }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        border: "1px solid var(--overlay-medium)",
        backgroundColor: hov ? "var(--overlay-medium)" : "transparent",
        color: hov ? "var(--color-gray12)" : "var(--color-gray9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16, lineHeight: 1,
        transition: "background 0.12s, color 0.12s",
      }}
    >
      ×
    </button>
  );
}

// ─── Variant 1: Monospace clean ───────────────────────────────────────────────
// Brand-native. Orange checkboxes, strikethrough, dense rows with hairline dividers.

export function ChecklistModal1({ progress, onClose }: { progress: number; onClose: () => void }) {
  const done = getCheckedCount(progress);
  const [customItems, setCustomItems] = React.useState<{ text: string; checked: boolean }[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const submitCustomItem = () => {
    const trimmed = inputVal.trim();
    if (trimmed) setCustomItems(prev => [...prev, { text: trimmed, checked: false }]);
    setInputVal("");
    setAdding(false);
  };

  const toggleCustom = (i: number) => {
    setCustomItems(prev => prev.map((item, idx) => idx === i ? { ...item, checked: !item.checked } : item));
  };

  React.useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  return (
    <EnjModalShell onClose={onClose}>
      <ElevatedSection style={{
        backgroundColor: "var(--modal-bg)",
        borderRadius: 16,
        border: "1px solid var(--overlay-strong)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        width: 480, maxWidth: "90vw", maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--overlay-medium)",
        }}>
          <span className="select-none" style={{
            fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--text-secondary)", fontFamily: "'Geist Mono', ui-monospace, monospace",
          }}>
            The Checklist ({done}/{CHECKLIST_ITEMS.length})
          </span>
          <ModalCloseBtn onClose={onClose} />
        </div>

        {/* Checklist */}
        <div style={{ overflowY: "auto", padding: "8px 20px 20px" }}>
          {CHECKLIST_ITEMS.map((item, i) => {
            const checked = i < done;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.022 + 0.1, duration: 0.2, ease: "easeOut" }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
                  borderBottom: "1px solid var(--overlay-subtle)",
                }}
              >
                <motion.div
                  initial={{ scale: checked ? 0 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.022 + 0.16, type: "spring", stiffness: 500, damping: 22 }}
                  style={{
                    width: 14, height: 14, flexShrink: 0, borderRadius: 3,
                    border: checked ? "none" : "1px solid var(--overlay-strong)",
                    backgroundColor: checked ? "var(--color-orange)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </motion.div>
                <span className="font-mono select-none" style={{ fontSize: 11, letterSpacing: "0.03em", color: checked ? "var(--text-faint)" : "var(--text-secondary)", textDecoration: checked ? "line-through" : "none" }}>
                  {item.text}
                </span>
              </motion.div>
            );
          })}

          {/* ── Custom items (easter egg) ── */}
          {customItems.map((item, i) => (
            <motion.div
              key={`custom-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--overlay-subtle)", cursor: "pointer" }}
              onClick={() => toggleCustom(i)}
            >
              <div style={{
                width: 14, height: 14, flexShrink: 0, borderRadius: 3,
                border: item.checked ? "none" : "1px solid var(--overlay-strong)",
                backgroundColor: item.checked ? "var(--color-orange)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="font-mono select-none" style={{ fontSize: 11, letterSpacing: "0.03em", color: item.checked ? "var(--text-faint)" : "var(--text-secondary)", textDecoration: item.checked ? "line-through" : "none" }}>
                {item.text}
              </span>
            </motion.div>
          ))}

          {/* ── Add row ── */}
          {adding ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <div style={{ width: 14, height: 14, flexShrink: 0, borderRadius: 3, border: "1px solid var(--overlay-strong)" }} />
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submitCustomItem(); if (e.key === "Escape") { setAdding(false); setInputVal(""); } }}
                onBlur={submitCustomItem}
                placeholder="add your own..."
                className="font-mono"
                style={{ fontSize: 11, letterSpacing: "0.03em", color: "var(--text-secondary)", background: "none", border: "none", outline: "none", flex: 1 }}
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", opacity: 0.4 }}
              onClick={() => setAdding(true)}
              whileHover={{ opacity: 1 }}
            >
              <div style={{ width: 14, height: 14, flexShrink: 0, borderRadius: 3, border: "1px solid var(--overlay-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M4 1V7M1 4H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-mono select-none" style={{ fontSize: 11, letterSpacing: "0.03em", color: "var(--text-muted)" }}>
                add your own
              </span>
            </motion.div>
          )}
        </div>
      </ElevatedSection>
    </EnjModalShell>
  );
}

// ─── Variant 2: Organic warm ──────────────────────────────────────────────────
// Serif header, italic pending items, filled dot vs dashed circle. Feels like a
// personal journal list — human, not form-like.

function ChecklistModal2({ progress, onClose }: { progress: number; onClose: () => void }) {
  const done = getCheckedCount(progress);

  return (
    <EnjModalShell onClose={onClose}>
      <div style={{
        backgroundColor: "var(--modal-bg)",
        borderRadius: 16,
        border: "1px solid var(--overlay-strong)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        width: 480, maxWidth: "90vw", maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header — serif title + monospace subtitle */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "22px 24px 0",
        }}>
          <div>
            <span style={{
              fontSize: 20, fontFamily: "Georgia, 'Times New Roman', serif",
              color: "var(--color-gray12)", display: "block", marginBottom: 3,
            }}>
              your checklist
            </span>
            <span className="font-mono select-none" style={{
              fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--color-orange)",
            }}>
              {done} of {CHECKLIST_ITEMS.length} milestones reached
            </span>
          </div>
          <ModalCloseBtn onClose={onClose} />
        </div>

        {/* Compressed ruler */}
        <div style={{ padding: "16px 24px 14px" }}>
          <MiniRuler progress={progress} />
        </div>

        <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "0 24px" }} />

        {/* Checklist — items slide in from the left */}
        <div style={{ overflowY: "auto", padding: "10px 24px 24px" }}>
          {CHECKLIST_ITEMS.map((item, i) => {
            const checked = i < done;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 + 0.1, duration: 0.22, ease: "easeOut" }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 0" }}
              >
                {/* Filled dot vs dashed ring */}
                <motion.div
                  initial={{ scale: checked ? 0 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.025 + 0.15, type: "spring", stiffness: 450, damping: 20 }}
                  style={{
                    width: 18, height: 18, flexShrink: 0, borderRadius: "50%",
                    border: checked ? "none" : "1.5px dashed rgba(220,214,208,0.22)",
                    backgroundColor: checked ? "rgba(233,95,56,0.85)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {/* Inner white dot — cleaner than a tick mark for the organic feel */}
                  {checked && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "white" }} />
                  )}
                </motion.div>
                {/* Italic for pending (feels like a handwritten list), normal for done */}
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: checked ? "inherit" : "Georgia, 'Times New Roman', serif",
                    fontStyle: checked ? "normal" : "italic",
                    color: checked ? "var(--text-faint)" : "var(--text-secondary)",
                    textDecoration: checked ? "line-through" : "none",
                    letterSpacing: checked ? "0" : "0.01em",
                  }}
                >
                  {item.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </EnjModalShell>
  );
}

// ─── Variant 3: Grouped phases ────────────────────────────────────────────────
// Items organised into Designer / Builder / Engineer sections with per-phase
// completion counts and phase-tinted checkboxes.

const PHASES_META = [
  { id: "designer" as const, label: "DESIGNER FOUNDATIONS", color: "#f472b6" },
  { id: "hybrid"   as const, label: "BUILDER SKILLS",       color: "#34d399" },
  { id: "engineer" as const, label: "ENGINEER MINDSET",     color: "#818cf8" },
];

function ChecklistModal3({ progress, onClose }: { progress: number; onClose: () => void }) {
  const done = getCheckedCount(progress);

  return (
    <EnjModalShell onClose={onClose}>
      <div style={{
        backgroundColor: "var(--modal-bg)",
        borderRadius: 16,
        border: "1px solid var(--overlay-strong)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        width: 520, maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px 0",
        }}>
          <span className="font-mono select-none" style={{
            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--color-gray9)",
          }}>
            Progress Milestones — {done} / {CHECKLIST_ITEMS.length}
          </span>
          <ModalCloseBtn onClose={onClose} />
        </div>

        {/* Compressed ruler */}
        <div style={{ padding: "16px 22px 12px" }}>
          <MiniRuler progress={progress} />
        </div>

        <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "0 22px" }} />

        {/* Grouped checklist */}
        <div style={{ overflowY: "auto", padding: "14px 22px 22px", display: "flex", flexDirection: "column", gap: 22 }}>
          {PHASES_META.map((phase, pi) => {
            const items = CHECKLIST_ITEMS
              .map((item, i) => ({ ...item, index: i }))
              .filter((item) => item.phase === phase.id);
            const phaseDone = items.filter((item) => item.index < done).length;

            return (
              <div key={phase.id}>
                {/* Section header with phase colour + completion count */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <span className="font-mono select-none" style={{
                    fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: phase.color, opacity: 0.85,
                  }}>
                    {phase.label}
                  </span>
                  <span className="font-mono select-none" style={{
                    fontSize: 8, letterSpacing: "0.08em",
                    color: phaseDone === items.length ? phase.color : "var(--color-gray8)",
                  }}>
                    {phaseDone}/{items.length}
                  </span>
                </div>

                {items.map((item, ii) => {
                  const checked = item.index < done;
                  const delay = (pi * items.length + ii) * 0.022 + 0.1;
                  return (
                    <motion.div
                      key={item.index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay, duration: 0.2, ease: "easeOut" }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "5px 0",
                        borderBottom: ii < items.length - 1
                          ? "1px solid var(--overlay-subtle)" : "none",
                      }}
                    >
                      {/* Phase-tinted checkbox */}
                      <motion.div
                        initial={{ scale: checked ? 0 : 1 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: delay + 0.05, type: "spring", stiffness: 500, damping: 22 }}
                        style={{
                          width: 12, height: 12, flexShrink: 0, borderRadius: 2,
                          border: checked ? "none" : `1px solid ${phase.color}44`,
                          backgroundColor: checked ? phase.color : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {checked && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </motion.div>
                      <span
                        className="font-mono select-none"
                        style={{
                          fontSize: 11, letterSpacing: "0.03em",
                          color: checked ? "rgba(220,214,208,0.25)" : "rgba(220,214,208,0.78)",
                          textDecoration: checked ? "line-through" : "none",
                        }}
                      >
                        {item.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </EnjModalShell>
  );
}

// ─── Card trigger shell ───────────────────────────────────────────────────────
// Same card surface as InCard. Clicking opens the checklist modal.

type ModalVariant = 1 | 2 | 3;

function InCardPlusModalShell({ variant, progress = 0.71 }: { variant: ModalVariant; progress?: number }) {
  const [open, setOpen]     = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const EASE = "cubic-bezier(0.2,0,0,1)";

  const ModalContent = variant === 1 ? ChecklistModal1 : variant === 2 ? ChecklistModal2 : ChecklistModal3;

  return (
    <div style={{
      backgroundColor: "var(--bg-primary)",
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "60px 48px",
    }}>
      <div style={{ width: "100%", maxWidth: 960 }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setOpen(true)}
          style={{
            borderRadius: 10,
            border: `1px solid ${open || hovered ? "var(--card-border-hover)" : "var(--card-border-rest)"}`,
            backgroundColor: open || hovered ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
            boxShadow: open || hovered ? "var(--card-shadow-hover-inner)" : "var(--card-shadow-rest)",
            transition: [
              `border-color 0.12s ${EASE}`,
              `background-color 0.2s ${EASE}`,
              `box-shadow 0.28s ${EASE}`,
            ].join(", "),
            padding: "20px 22px",
            display: "flex", alignItems: "center",
            cursor: "pointer",
          }}
        >
          <EnjProgress progress={progress} hovered={hovered || open} />
        </div>
      </div>

      {/* Modal — AnimatePresence here so it covers the full page (position:fixed inside) */}
      <AnimatePresence>
        {open && <ModalContent progress={progress} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export const Tuner: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [progress, setProgress] = React.useState(0.35);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [glass, setGlass] = React.useState<GlassConfig>({ ...DEFAULT_GLASS });
    const set = (k: keyof GlassConfig) => (v: number) => setGlass(g => ({ ...g, [k]: v }));

    return (
      <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px" }}>
        {/* Preview */}
        <div style={{ width: "100%", maxWidth: 960, marginBottom: 40 }}>
          <CardShell>
            <EnjProgress progress={progress} glass={glass} />
          </CardShell>
        </div>

        {/* Tuner panel */}
        <div style={{
          width: "100%", maxWidth: 960,
          background: "var(--overlay-subtle)",
          border: "1px solid var(--card-border-rest)",
          borderRadius: 10,
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            Glass tuner
          </span>

          {/* Progress */}
          <TunerSlider label="Progress" value={Math.round(progress * 100)} min={0} max={100} onChange={v => setProgress(v / 100)} />

          <div style={{ height: 1, backgroundColor: "var(--overlay-medium)" }} />

          {/* Shape */}
          <TunerSlider label="Pill width" value={glass.pillWidth} min={16} max={60} onChange={set("pillWidth")} />
          <TunerSlider label="Height bonus" value={glass.heightBonus} min={0} max={80} onChange={set("heightBonus")} />
          <TunerSlider label="Border radius" value={glass.borderRadius} min={4} max={24} onChange={set("borderRadius")} />

          <div style={{ height: 1, backgroundColor: "var(--overlay-medium)" }} />

          {/* Glass fill */}
          <TunerSlider label="Orange tint" value={Math.round(glass.orangeTint * 100)} min={0} max={80} onChange={v => set("orangeTint")(v / 100)} />
          <TunerSlider label="Blur" value={glass.blur} min={0} max={24} onChange={set("blur")} />
          <TunerSlider label="Brightness" value={glass.brightness} min={5} max={80} onChange={set("brightness")} />
          <TunerSlider label="Bg opacity" value={Math.round(glass.backgroundOpacity * 100)} min={0} max={60} onChange={v => set("backgroundOpacity")(v / 100)} />
          <TunerSlider label="Saturation" value={Math.round(glass.saturation * 10)} min={1} max={30} step={1} onChange={v => set("saturation")(v / 10)} />

          <div style={{ height: 1, backgroundColor: "var(--overlay-medium)" }} />

          {/* Glass edge — rim, highlight, shadow */}
          <TunerSlider label="Rim opacity" value={Math.round(glass.rimOpacity * 100)} min={0} max={60} onChange={v => set("rimOpacity")(v / 100)} />
          <TunerSlider label="Top highlight" value={Math.round(glass.topHighlight * 100)} min={0} max={80} onChange={v => set("topHighlight")(v / 100)} />
          <TunerSlider label="Drop shadow" value={Math.round(glass.dropShadow * 100)} min={0} max={80} onChange={v => set("dropShadow")(v / 100)} />

          <div style={{ height: 1, backgroundColor: "var(--overlay-medium)" }} />

          {/* Distortion — keep subtle to avoid chromatic glitch */}
          <TunerSlider label="Distortion" value={glass.distortionScale} min={-80} max={0} onChange={set("distortionScale")} />
          <TunerSlider label="Red offset" value={glass.redOffset} min={0} max={30} onChange={set("redOffset")} />
          <TunerSlider label="Green offset" value={glass.greenOffset} min={0} max={30} onChange={set("greenOffset")} />
          <TunerSlider label="Blue offset" value={glass.blueOffset} min={0} max={30} onChange={set("blueOffset")} />
        </div>
      </div>
    );
  },
};

// ─── In Card + Modal stories ──────────────────────────────────────────────────

export const InCardPlusModal1: Story = {
  name: "In Card + Modal 1 — Monospace",
  render: () => <InCardPlusModalShell variant={1} />,
};

export const InCardPlusModal2: Story = {
  name: "In Card + Modal 2 — Organic",
  render: () => <InCardPlusModalShell variant={2} />,
};

export const InCardPlusModal3: Story = {
  name: "In Card + Modal 3 — Grouped",
  render: () => <InCardPlusModalShell variant={3} />,
};
