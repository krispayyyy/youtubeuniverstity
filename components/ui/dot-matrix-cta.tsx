'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ─── Springs (from established-patterns.md) ─────────────────────────────────

const snappySpring = { type: 'spring' as const, stiffness: 500, damping: 50 };

// ─── Size presets ────────────────────────────────────────────────────────────
// md — standalone/showcase context (default)
// sm — page integration context, proportioned to sit alongside small UI chrome
//
// toggleInnerSize is calculated to exactly match DotMatrixCTA's inner-div height:
//   sm: innerPad(5+5) + iconPad(4+4) + dotGrid(5×2.5 + 4×1.8) ≈ 37.7 → 38px
//   md: innerPad(8+8) + iconPad(7+7) + dotGrid(5×3.5 + 4×3.0) ≈ 59.5 → 60px

export type CTASize = 'sm' | 'md';

const SIZE = {
  md: {
    outerRadius: 16,
    outerPad: 3,
    innerRadius: 13,
    innerPad: '8px 16px 8px 8px' as const,
    innerGap: 12,
    iconPad: 7,
    iconRadius: 8,
    dotSize: 3.5,
    dotGap: 3,
    fontSize: 14,
    toggleInnerSize: 60,
    toggleInnerRadius: 13,
  },
  sm: {
    outerRadius: 12,
    outerPad: 2,
    innerRadius: 9,
    innerPad: '5px 12px 5px 5px' as const,
    innerGap: 8,
    iconPad: 4,
    iconRadius: 6,
    dotSize: 2.5,
    dotGap: 1.8,
    fontSize: 12,
    toggleInnerSize: 38,
    toggleInnerRadius: 9,
  },
} as const;

// ─── 5×5 Dot Matrix Shape Definitions ───────────────────────────────────────
// 1 = "on" (bright white dot), 0 = "off" (dim white dot, still visible)
// Both are white — the orange container is the constant background.

const GRID_SIZE = 5;

// Arrow pointing right →
// prettier-ignore
const SHAPE_ARROW: number[] = [
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
  1, 1, 1, 1, 1,
  0, 0, 0, 1, 0,
  0, 0, 1, 0, 0,
];

// Cross / plus + (hover state)
// prettier-ignore
const SHAPE_CROSS: number[] = [
  0, 0, 1, 0, 0,
  0, 0, 1, 0, 0,
  1, 1, 1, 1, 1,
  0, 0, 1, 0, 0,
  0, 0, 1, 0, 0,
];

// ─── DotMatrixGrid ──────────────────────────────────────────────────────────
// LED matrix: ALL 25 dots always visible on the orange background.
// "on"  = bright white  → full opacity, forms the icon shape
// "off" = dim white     → low opacity, shows grid structure (unlit LED feel)

interface DotMatrixGridProps {
  shape: number[];
  size?: number;
  dotSize?: number;
  dotGap?: number;
}

function DotMatrixGrid({
  shape,
  size = GRID_SIZE,
  dotSize = SIZE.md.dotSize,
  dotGap = SIZE.md.dotGap,
}: DotMatrixGridProps) {
  const count = shape.length;
  // null = show actual shape; number[] = show scrambled frame
  const [scramble, setScramble] = useState<number[] | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Stable ref to the trigger fn so both effects can call it without re-subscribing
  const triggerRef = useRef<() => void>(() => {});

  // Rebuild trigger whenever count changes (effectively once on mount)
  useEffect(() => {
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const rand = () => Array.from({ length: count }, () => Math.round(Math.random()));

    // Each call cancels any in-progress animation then starts fresh.
    // 3 random frames → settle to actual shape.
    triggerRef.current = () => {
      clear();
      setScramble(rand());
      timers.current.push(setTimeout(() => setScramble(rand()), 80));
      timers.current.push(setTimeout(() => setScramble(rand()), 160));
      timers.current.push(setTimeout(() => setScramble(null), 240));
    };

    return clear; // cancel pending timers on unmount
  }, [count]);

  // Trigger on data-theme change (light ↔ dark toggle)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') { triggerRef.current(); break; }
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Trigger on shape change (hover in → cross, hover out → arrow)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    triggerRef.current();
  }, [shape]);

  const displayShape = scramble ?? shape;

  return (
    <div
      aria-hidden
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${dotSize}px)`,
        gridTemplateRows: `repeat(${size}, ${dotSize}px)`,
        gap: dotGap,
      }}
    >
      {displayShape.map((active, i) => (
        <motion.div
          key={i}
          style={{ width: dotSize, height: dotSize, borderRadius: '50%' }}
          animate={{
            backgroundColor: active
              ? 'rgba(255, 255, 255, 0.92)'  // on:  lit LED — bright white
              : 'rgba(255, 255, 255, 0.25)',  // off: unlit LED — dim but visible
          }}
          // During scramble: instant snap (no stagger) for sharp static feel
          // On settle: normal staggered spring for clean re-formation
          transition={
            scramble
              ? { type: 'spring', stiffness: 900, damping: 45 }
              : { ...snappySpring, delay: i * 0.01 }
          }
        />
      ))}
    </div>
  );
}

// ─── CTAContainer ───────────────────────────────────────────────────────────
// Shared outer shell: 1px border, transparent bg, rounded-rect.
// size controls corner radius and padding. Used by DotMatrixCTA + ThemeToggle.

interface CTAContainerProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  onHoverChange?: (hovered: boolean) => void;
  size?: CTASize;
}

export function CTAContainer({
  children,
  onClick,
  ariaLabel,
  className,
  style,
  onHoverChange,
  size = 'md',
}: CTAContainerProps) {
  const s = SIZE[size];
  return (
    <motion.button
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: s.outerRadius,
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        padding: s.outerPad,
        ...style,
      }}
      whileTap={{ scale: 0.97 }}
      transition={snappySpring}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {children}
    </motion.button>
  );
}

// ─── DotMatrixCTA ───────────────────────────────────────────────────────────
//
// Color strategy — deliberate contrast inversion so the inner pill always
// punches against the page background:
//
//   Dark page  →  inner bg = var(--text-primary) = cream  →  dark text
//   Light page →  inner bg = var(--text-primary) = black  →  light text
//
// var(--text-primary) and var(--bg-primary) are exact inverses by design.

interface DotMatrixCTAProps {
  label?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  size?: CTASize;
  restShape?: number[];
  hoverShape?: number[];
  gridSize?: number;
  dotSize?: number;
  dotGap?: number;
}

export function DotMatrixCTA({
  label = 'Read More',
  onClick,
  className,
  style,
  size = 'md',
  restShape = SHAPE_ARROW,
  hoverShape = SHAPE_CROSS,
  gridSize = GRID_SIZE,
  dotSize,
  dotGap,
}: DotMatrixCTAProps) {
  const [isHovered, setIsHovered] = useState(false);
  const s = SIZE[size];
  const activeShape = isHovered ? hoverShape : restShape;

  return (
    <CTAContainer
      onClick={onClick}
      ariaLabel={label}
      className={className}
      style={style}
      size={size}
      onHoverChange={setIsHovered}
    >
      {/* Layer 2: Inner pill — inverts against page bg */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: s.innerGap,
          borderRadius: s.innerRadius,
          backgroundColor: 'var(--text-primary)',  // cream on dark page, black on light page
          padding: s.innerPad,
        }}
      >
        {/* Layer 3: Accent icon container — always orange */}
        <div
          style={{
            padding: s.iconPad,
            borderRadius: s.iconRadius,
            backgroundColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DotMatrixGrid
            shape={activeShape}
            size={gridSize}
            dotSize={dotSize ?? s.dotSize}
            dotGap={dotGap ?? s.dotGap}
          />
        </div>

        {/* Label — inverts to contrast with inner pill */}
        <motion.span
          style={{
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            fontSize: s.fontSize,
            fontWeight: 400,
            letterSpacing: '0.01em',
            color: 'var(--bg-primary)',  // dark on light inner, light on dark inner
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
          animate={{ x: isHovered ? 3 : 0 }}
          transition={snappySpring}
        >
          {label}
        </motion.span>
      </div>
    </CTAContainer>
  );
}

export { SHAPE_ARROW, SHAPE_CROSS, GRID_SIZE, SIZE };
export type { DotMatrixCTAProps, CTAContainerProps };
