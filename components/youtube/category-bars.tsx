"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CategoryStat } from "@/lib/compute-stats";

// theme: mirrors the same pattern used in odometer.tsx
function useIsDark(): boolean {
  const get = () =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") !== "light"
      : true;
  const [isDark, setIsDark] = React.useState(get);
  React.useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(get()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const ORANGE = "var(--color-orange)";
const BAR_H = 1; // 1px bars matching design system

// ── Tick sound singleton ───────────────────────────────────────────────────────
// one Audio node shared across all rows — no overlapping instances
let _tickAudio: HTMLAudioElement | null = null;
let _lastTickTime = 0;
const TICK_COOLDOWN_MS = 80;

function playTick() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  // throttle: prevents rapid-fire when sweeping across rows quickly
  if (now - _lastTickTime < TICK_COOLDOWN_MS) return;
  _lastTickTime = now;
  if (!_tickAudio) {
    _tickAudio = new Audio("/sounds/tick.mp3");
    // matches the volume set on the bento grid's GridCard tick
    _tickAudio.volume = 0.35;
  }
  _tickAudio.currentTime = 0;
  _tickAudio.play().catch(() => {});
}

export interface CategoryBarsProps {
  categories: CategoryStat[];
  title?: string;
  /** Controlled selected category id */
  selectedId?: string;
  /** Called when user clicks a row */
  onSelect?: (id: string) => void;
}

export default function CategoryBars({
  categories,
  title = "Topics",
  selectedId,
  onSelect,
}: CategoryBarsProps) {
  const isDark = useIsDark();
  const [hovered, setHovered] = React.useState<string | null>(null);
  const isInteractive = Boolean(onSelect);

  const visible = categories.filter((c) => c.count > 0).slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <span className="font-mono text-[13px] text-gray11 select-none">{title}</span>
      )}

      <div className="flex flex-col" style={{ gap: 10 }}>
        {visible.map((cat, i) => {
          const isSel = selectedId === cat.id;
          const isHov = hovered === cat.id && !isSel;

          const barColor = isSel
            ? ORANGE
            : isHov
            ? "var(--color-gray11)"
            : "var(--color-gray8)";
          const labelColor = isSel
            ? "var(--color-gray12)"
            : isHov
            ? "var(--color-gray11)"
            : "var(--color-gray9)";
          const pctColor = isSel
            ? ORANGE
            : isHov
            ? "var(--color-gray11)"
            : "var(--color-gray8)";
          const barWidth = `${cat.percentage}%`;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: i * 0.05, duration: 0.25, ease: "easeOut" }}
              className="flex items-center gap-3"
              onPointerEnter={() => { playTick(); setHovered(cat.id); }}
              onPointerLeave={() => setHovered(null)}
              onClick={() => onSelect?.(cat.id)}
              style={{
                cursor: isInteractive ? "pointer" : "default",
                // Subtle selected outline — negative margin avoids layout shift
                borderRadius: 6,
                border: isSel
                  ? "1px solid var(--overlay-medium)"
                  : "1px solid transparent",
                background: isSel
                  ? "var(--overlay-subtle)"
                  : isHov
                  // hover bg: subtle lift — white tint on dark, dark tint on light
                  ? isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                  : "transparent",
                padding: "4px 8px",
                margin: "-4px -8px",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              {/* Label */}
              <div style={{ width: 140, flexShrink: 0 }}>
                <span
                  className="font-mono text-[11px] select-none truncate block"
                  style={{ color: labelColor, transition: "color 0.15s" }}
                >
                  {cat.label}
                </span>
              </div>

              {/* Bar track */}
              <div
                style={{
                  flex: 1,
                  height: BAR_H,
                  backgroundColor: "var(--color-gray8)",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: barWidth }}
                  transition={{
                    delay: i * 0.05 + 0.1,
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: barColor,
                    transition: "background-color 0.15s",
                  }}
                />
              </div>

              {/* Percentage */}
              <div style={{ width: 36, textAlign: "right", flexShrink: 0 }}>
                <span
                  className="font-mono text-[11px] select-none"
                  style={{ color: pctColor, transition: "color 0.15s" }}
                >
                  {cat.percentage < 1 ? "<1" : Math.round(cat.percentage)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
