"use client";

import * as React from "react";
import { motion, useSpring } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────
const DIGIT_HEIGHT = 52;
const DIGIT_WIDTH = 44;
const FONT_SIZE = 42;
const CELL_RADIUS = 9;
const CELL_GAP = 3;

// ─── Spring Physics Config ────────────────────────────────────────────────────
// Index 0 = ones (rightmost, snappiest), increasing indexes = slower
const SPRING_CONFIGS = [
  { stiffness: 320, damping: 18, mass: 0.8 },
  { stiffness: 260, damping: 20, mass: 0.9 },
  { stiffness: 210, damping: 22, mass: 1.0 },
  { stiffness: 170, damping: 24, mass: 1.1 },
];

function getSpringConfig(positionFromRight: number) {
  if (positionFromRight >= SPRING_CONFIGS.length) {
    return SPRING_CONFIGS[SPRING_CONFIGS.length - 1];
  }
  return SPRING_CONFIGS[positionFromRight];
}

function getStaggerDelay(positionFromRight: number): number {
  return positionFromRight * 40;
}

// ─── Theme detection ──────────────────────────────────────────────────────────
// Watches data-theme on <html> so the odometer re-styles and re-animates
// whenever Storybook (or the app) toggles between light and dark.
function useTheme(): "light" | "dark" {
  const getTheme = () =>
    typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "dark"
      : "dark";

  const [theme, setTheme] = React.useState<"light" | "dark">(getTheme);

  React.useEffect(() => {
    // MutationObserver: fires whenever data-theme changes on <html>
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const TOKENS = {
  dark: {
    // drum cell gradient — dark charcoal cylinder
    cellBg: "linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 48%, #252527 100%)",
    cellShadow: [
      "inset 0 1.5px 0 rgba(255,255,255,0.11)", // top rim highlight
      "inset 0 -1.5px 0 rgba(0,0,0,0.6)",       // bottom rim shadow
      "inset 0 0 0 1px rgba(255,255,255,0.06)",  // subtle cell edge
    ].join(", "),
    digitColor: "hsl(0 0% 93%)",   // near-white
    sheenBg: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)",
    separatorColor: "hsl(0 0% 24%)",
    // casing pill
    casingBg: "#141210",
    casingBorder: "1px solid rgba(255,255,255,0.09)",
    casingShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.10)",
      "inset 0 -2px 5px rgba(0,0,0,0.55)",
      "0 6px 28px rgba(0,0,0,0.7)",
      "0 0 0 0.5px rgba(255,255,255,0.04)",
    ].join(", "),
    labelColor: "hsl(0 0% 31.2%)",
    // mechanical casing — dark mode, warmed up to sit in the card family (#191614)
    mechanicalBg: "#181410",
    mechanicalBorder: "1px solid rgba(255,255,255,0.12)",
    mechanicalVignette: "rgba(0,0,0,0.28)",
    mechanicalShadow: [
      "inset 0 6px 18px rgba(0,0,0,0.95)",
      "inset 0 -4px 10px rgba(0,0,0,0.80)",
      "0 6px 24px rgba(0,0,0,0.70)",
      "0 -1px 0 rgba(255,255,255,0.10)",
    ].join(", "),
  },
  light: {
    // drum cell gradient — light silver cylinder
    cellBg: "linear-gradient(180deg, #DADADA 0%, #CBCBCB 48%, #D4D4D4 100%)",
    cellShadow: [
      "inset 0 1.5px 0 rgba(255,255,255,0.35)",
      "inset 0 -1.5px 0 rgba(0,0,0,0.10)",
      "inset 0 0 0 1px rgba(0,0,0,0.06)",
    ].join(", "),
    digitColor: "hsl(0 0% 10%)",
    sheenBg: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
    separatorColor: "hsl(0 0% 58%)",
    // casing pill — stronger shadow + border to ground it against light bg
    casingBg: "#d4d2d0",
    casingBorder: "1px solid rgba(0,0,0,0.18)",
    casingShadow: [
      "inset 0 -1px 3px rgba(0,0,0,0.10)",
      "0 2px 8px rgba(0,0,0,0.12)",
      "0 0 0 0.5px rgba(0,0,0,0.10)",
    ].join(", "),
    labelColor: "rgba(0,0,0,0.44)",
    // mechanical casing — same grounding treatment
    mechanicalBg: "#d4d2d0",
    mechanicalBorder: "1px solid rgba(0,0,0,0.18)",
    mechanicalVignette: "transparent",
    mechanicalShadow: [
      "inset 0 -1px 3px rgba(0,0,0,0.10)",
      "0 2px 8px rgba(0,0,0,0.12)",
      "0 0 0 0.5px rgba(0,0,0,0.10)",
    ].join(", "),
  },
} as const;

// ─── Single digit drum ────────────────────────────────────────────────────────
interface DigitDrumProps {
  digit: number;
  springConfig: { stiffness: number; damping: number; mass: number };
  delay?: number;
  noMask?: boolean;
  theme: "light" | "dark";
}

function DigitDrum({ digit, springConfig, delay = 0, noMask = false, theme }: DigitDrumProps) {
  const spring = useSpring(DIGIT_HEIGHT, springConfig);
  const t = TOKENS[theme];

  // Animate to the current digit value on mount or value change
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(-digit * DIGIT_HEIGHT);
    }, delay);
    return () => clearTimeout(timeout);
  }, [digit, delay, spring]);

  // Re-run full animation from the top when theme toggles —
  // snap to start immediately, then spring to the target after the delay
  React.useEffect(() => {
    spring.set(DIGIT_HEIGHT, { immediate: true });
    const timeout = setTimeout(() => {
      spring.set(-digit * DIGIT_HEIGHT);
    }, delay);
    return () => clearTimeout(timeout);
    // intentionally omit digit/delay/spring — only fires on theme change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div
      style={{
        position: "relative",
        width: DIGIT_WIDTH,
        height: DIGIT_HEIGHT,
        borderRadius: CELL_RADIUS,
        overflow: "hidden",
        background: t.cellBg,
        boxShadow: t.cellShadow,
        // Ghost digits at edges — physical drum feel (skip with noMask for Figma hard clip)
        ...(noMask ? {} : {
          maskImage: [
            "linear-gradient(to bottom,",
            "  transparent 0%,",
            "  rgba(0,0,0,0.42) 11%,",
            "  black 28%,",
            "  black 72%,",
            "  rgba(0,0,0,0.42) 89%,",
            "  transparent 100%",
            ")",
          ].join(" "),
          WebkitMaskImage: [
            "linear-gradient(to bottom,",
            "  transparent 0%,",
            "  rgba(0,0,0,0.42) 11%,",
            "  black 28%,",
            "  black 72%,",
            "  rgba(0,0,0,0.42) 89%,",
            "  transparent 100%",
            ")",
          ].join(" "),
        }),
      }}
    >
      {/* Digit strip */}
      <motion.div style={{ y: spring }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div
            key={n}
            style={{
              height: DIGIT_HEIGHT,
              width: DIGIT_WIDTH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // fontFamily: CSS var lets parent context swap the digit font (e.g. Geist Mono)
              fontFamily: "var(--digit-font, 'PP Neue Montreal', system-ui, sans-serif)",
              fontSize: FONT_SIZE,
              // fontWeight: CSS var lets the story tune weight per font (800 for PP, 400 for mono)
              fontWeight: "var(--digit-weight, 800)" as React.CSSProperties["fontWeight"],
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: t.digitColor,
              userSelect: "none",
            }}
          >
            {n}
          </div>
        ))}
      </motion.div>

      {/* Sheen: top-biased highlight simulating light on the drum face */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: t.sheenBg,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── Separator (comma) ────────────────────────────────────────────────────────
function Separator({ char, theme }: { char: string; theme: "light" | "dark" }) {
  return (
    <div
      style={{
        height: DIGIT_HEIGHT,
        display: "flex",
        alignItems: "center",
        paddingBottom: 4,
        // fontFamily: follows --digit-font so separator matches digit font in mono contexts
        fontFamily: "var(--digit-font, 'PP Neue Montreal', system-ui, sans-serif)",
        fontSize: FONT_SIZE * 0.55,
        fontWeight: 600,
        color: TOKENS[theme].separatorColor,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {char}
    </div>
  );
}

// ─── Main Odometer ────────────────────────────────────────────────────────────
export interface OdometerProps {
  value: number;
  label?: string;
  sublabel?: string;
  /** Delay before animation starts (ms). Stagger multiple odometers. */
  animationDelay?: number;
  /**
   * "bare"       — just the digit drums, no outer shell (default)
   * "cased"      — drums wrapped in an elevated pill capsule
   * "mechanical" — edge-to-edge drums, deep bezel, horizontal vignette
   */
  variant?: "bare" | "cased" | "mechanical";
  /** Optional style overrides for the cased pill container */
  casingStyle?: React.CSSProperties;
  /** Remove the top/bottom fade mask — hard clip like Figma reference */
  noMask?: boolean;
  /** Minimum number of digit drums — pads with leading zeros so layout stays consistent at low values */
  minDigits?: number;
}

export default function Odometer({
  value,
  label,
  sublabel,
  animationDelay = 0,
  variant = "bare",
  casingStyle,
  noMask = false,
  minDigits = 2,
}: OdometerProps) {
  // Automatically tracks data-theme — no prop needed
  const theme = useTheme();
  const t = TOKENS[theme];

  const digitsWithConfig = React.useMemo(() => {
    // padStart: ensures minimum drum count so layout stays stable at low/zero values
    const str = Math.round(value).toString().padStart(minDigits, "0");
    const result: Array<{
      type: "digit" | "sep";
      n?: number;
      char?: string;
      springConfig?: { stiffness: number; damping: number; mass: number };
      totalDelay?: number;
    }> = [];

    for (let i = 0; i < str.length; i++) {
      const posFromRight = str.length - 1 - i;
      const digitValue = parseInt(str[i]);
      const springConfig = getSpringConfig(posFromRight);
      const staggerDelay = getStaggerDelay(posFromRight);

      result.push({
        type: "digit",
        n: digitValue,
        springConfig,
        totalDelay: animationDelay + staggerDelay,
      });

      if (posFromRight > 0 && posFromRight % 3 === 0) {
        result.push({ type: "sep", char: "," });
      }
    }
    return result;
  }, [value, animationDelay]);

  const drums = (
    <div style={{ display: "flex", alignItems: "center", gap: CELL_GAP }}>
      {digitsWithConfig.map((item, i) => {
        if (item.type === "sep") {
          return <Separator key={`sep-${i}`} char={item.char!} theme={theme} />;
        }
        return (
          <DigitDrum
            key={`digit-${i}`}
            digit={item.n!}
            springConfig={item.springConfig!}
            delay={item.totalDelay}
            noMask={noMask}
            theme={theme}
          />
        );
      })}
    </div>
  );

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}>
      {variant === "cased" ? (
        <div
          style={{
            display: "inline-flex",
            padding: "8px 10px",
            // minWidth: keeps the pill from collapsing on single digits
            minWidth: DIGIT_WIDTH * 2 + CELL_GAP + 20,
            borderRadius: 18,
            background: t.casingBg,
            border: t.casingBorder,
            boxShadow: t.casingShadow,
            ...casingStyle,
          }}
        >
          {drums}
        </div>
      ) : variant === "mechanical" ? (
        // Edge-to-edge: drums flush to the pill, horizontal vignette for cylindrical depth
        <div style={{ position: "relative", display: "inline-flex", padding: "2px 0", borderRadius: 14, overflow: "hidden", background: t.mechanicalBg, border: t.mechanicalBorder, boxShadow: t.mechanicalShadow }}>
          {drums}
          <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${t.mechanicalVignette} 0%, transparent 30%, transparent 70%, ${t.mechanicalVignette} 100%)`, pointerEvents: "none" }} />
        </div>
      ) : (
        drums
      )}

      {label && (
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            color: t.labelColor,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {label}
        </span>
      )}

      {sublabel && (
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            color: t.labelColor,
            opacity: 0.6,
            letterSpacing: "0.04em",
            userSelect: "none",
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}
