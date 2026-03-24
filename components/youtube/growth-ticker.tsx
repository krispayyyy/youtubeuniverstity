"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useSpring, useVelocity, useTransform } from "framer-motion";
import {
  toolLoyaltyTimeline,
  toolLoyaltyDefaultTool,
  computeGrowthPct,
  rankToolsByTrend,
  firstRankedTool,
  formatGrowthPctLabel,
  toolLoyaltyDateRangeLabel,
  type ToolLoyaltyRow,
  type ToolTrend,
} from "@/lib/tool-loyalty-data";
import { ZapIcon } from "@/components/ui/icons/zap";
import { modalListRowTextColors } from "@/components/youtube/modal-list-styles";

export type ToolLoyaltyTool = ToolLoyaltyRow;
export { toolLoyaltyDefaultTool };

function AlertIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function Triangle({ size = 28, direction = "up" }: { size?: number; direction?: "up" | "down" }) {
  const points = direction === "up" ? "12,4 22,20 2,20" : "12,20 22,4 2,4";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: "block" }}>
      <polygon
        points={points}
        fill="var(--color-gray12)"
        stroke="var(--color-gray12)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDown({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function OdoDigit({ digit, h, w, fontSize }: { digit: number; h: number; w: number; fontSize: number }) {
  const spring = useSpring(0, { stiffness: 260, damping: 22, mass: 0.9 });
  const velocity = useVelocity(spring);
  const rotateX = useTransform(velocity, [-800, 0, 800], [12, 0, -12]);

  React.useEffect(() => {
    spring.set(-digit * h);
  }, [digit, h, spring]);

  return (
    <div style={{ width: w, height: h, overflow: "hidden", perspective: 400 }}>
      <motion.div style={{ y: spring, rotateX }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div
            key={n}
            className="font-mono select-none"
            style={{
              height: h,
              width: w,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "var(--color-gray12)",
            }}
          >
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function toDigits(n: number): number[] {
  return String(Math.max(0, Math.round(n))).split("").map(Number);
}

export function GrowthTickerCardInner({
  onOpen,
  selectedTool,
  onPillClick,
  pillButtonRef,
  dropdownOpen = false,
}: {
  onOpen: () => void;
  selectedTool: ToolLoyaltyTool;
  onPillClick: (e: React.MouseEvent) => void;
  pillButtonRef?: React.Ref<HTMLButtonElement>;
  dropdownOpen?: boolean;
}) {
  const tool = selectedTool ?? toolLoyaltyDefaultTool;
  const growthPct = computeGrowthPct(tool);
  const prefix = growthPct >= 0 ? "+" : "−";

  return (
    <div
      style={{
        height: "100%",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          className="select-none"
          style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}
        >
          Tool usage over time
        </span>
        <button
          ref={pillButtonRef}
          type="button"
          onClick={onPillClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 99,
            border: "1px solid var(--overlay-medium)",
            background: "var(--overlay-subtle)",
            color: "var(--color-gray12)",
            cursor: "pointer",
          }}
        >
          {/* transform: rotates the chevron to indicate open/closed state (try 90deg for sideways) */}
          <span style={{ display: "flex", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            <ChevronDown size={8} />
          </span>
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={onOpen}>
        {/* +/− sign: direction indicator for the number */}
        <span
          className="font-mono select-none"
          style={{ fontSize: 28, color: "var(--color-gray12)", lineHeight: 1, opacity: 0.6, transition: "color 0.2s ease" }}
        >
          {prefix}
        </span>
        <motion.div layout style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {/* flat array: AnimatePresence needs direct motion children — no Fragments */}
          <AnimatePresence mode="popLayout" initial={false}>
            {(() => {
              const digits = toDigits(Math.abs(growthPct));
              const els: React.ReactNode[] = [];
              digits.forEach((digit, i) => {
                const posFromRight = digits.length - 1 - i;
                els.push(
                  <motion.div
                    key={`d${posFromRight}`}
                    layout
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)", transition: { type: "spring", stiffness: 520, damping: 22 } }}
                    transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.9 }}
                  >
                    <OdoDigit digit={digit} h={52} w={30} fontSize={44} />
                  </motion.div>
                );
                // thousands comma as a motion.span so AnimatePresence can track its enter/exit
                if (posFromRight > 0 && posFromRight % 3 === 0) {
                  els.push(
                    <motion.span
                      key={`comma${posFromRight}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      className="font-mono select-none"
                      style={{ fontSize: 30, color: "var(--color-gray12)", lineHeight: 1, marginBottom: 2, display: "inline-block" }}
                    >
                      ,
                    </motion.span>
                  );
                }
              });
              return els;
            })()}
          </AnimatePresence>
        </motion.div>
        <span
          className="font-mono select-none"
          style={{ fontSize: 18, color: "var(--color-gray12)", opacity: 0.45, letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          %
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          width: "100%",
          padding: "7px 10px",
          borderRadius: 6,
          backgroundColor: "var(--overlay-subtle)",
          border: "1px solid var(--overlay-medium)",
          color: "var(--color-gray12)",
          cursor: "pointer",
        }}
        onClick={onOpen}
      >
        {/* triangle matches modal list rows: ▲ for growth, ▽ for decline */}
        <Triangle size={10} direction={growthPct >= 0 ? "up" : "down"} />
        <span
          className="font-mono select-none"
          style={{ fontSize: 9, color: "var(--color-gray12)", letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          {tool.tool}
        </span>
      </div>
    </div>
  );
}

function ToolDropdownMenu({
  selected,
  onSelect,
  anchorRect,
  timeline,
}: {
  selected: ToolLoyaltyTool;
  onSelect: (tool: ToolLoyaltyTool) => void;
  anchorRect: DOMRect | null;
  timeline: ToolLoyaltyRow[];
}) {
  if (typeof document === "undefined" || !anchorRect) return null;

  const top = anchorRect.bottom + 4;
  const left = Math.max(8, anchorRect.right - 160);

  return createPortal(
    <motion.div
      data-growth-ticker-menu
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 10050,
        background: "var(--bg-elevated)",
        border: "1px solid var(--overlay-medium)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        overflow: "hidden",
        minWidth: 140,
      }}
    >
      {timeline.map((tool) => {
        const isSelected = tool.tool === selected.tool;
        return (
          <button
            key={tool.tool}
            type="button"
            onClick={() => onSelect(tool)}
            className="font-mono"
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "8px 12px",
              background: isSelected ? "var(--overlay-subtle)" : "transparent",
              border: "none",
              color: isSelected ? "var(--color-gray12)" : "var(--text-faint)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s ease, color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--overlay-subtle)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {tool.tool}
          </button>
        );
      })}
    </motion.div>,
    document.body
  );
}

const MODAL_SPRING = { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.8 };
const EASE = "cubic-bezier(0.2,0,0,1)";

function GrowthTrendToggle({ value, onChange }: { value: ToolTrend; onChange: (v: ToolTrend) => void }) {
  const items: { id: ToolTrend; label: string }[] = [
    { id: "growing", label: "Growing" },
    { id: "declining", label: "Declining" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Growth direction"
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: 8,
        border: "1px solid var(--overlay-medium)",
        background: "var(--overlay-subtle)",
        overflow: "hidden",
      }}
    >
      {items.map((item, i) => {
        const sel = value === item.id;
        return (
          <React.Fragment key={item.id}>
            {i > 0 ? <div style={{ width: 1, alignSelf: "stretch", background: "var(--overlay-medium)" }} /> : null}
            <button
              type="button"
              role="tab"
              aria-selected={sel}
              onClick={() => onChange(item.id)}
              className="font-mono select-none"
              style={{
                padding: "6px 14px",
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                background: sel ? "color-mix(in srgb, var(--overlay-medium) 85%, transparent)" : "transparent",
                color: sel ? "var(--color-gray12)" : "var(--text-faint)",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function GrowthTickerModal({
  onClose,
  selectedTool,
  onSelectTool,
  timeline,
}: {
  onClose: () => void;
  selectedTool: ToolLoyaltyTool;
  onSelectTool: (t: ToolLoyaltyTool) => void;
  timeline?: ToolLoyaltyRow[];
}) {
  const data = timeline ?? toolLoyaltyTimeline;
  const [trendFilter, setTrendFilter] = React.useState<ToolTrend>("growing");
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const ranked = React.useMemo(() => rankToolsByTrend(data, trendFilter, 5), [data, trendFilter]);

  const growthPct = computeGrowthPct(selectedTool);
  const isPositive = growthPct >= 0;
  const digits = toDigits(Math.abs(growthPct));

  const onTrendChange = React.useCallback(
    (next: ToolTrend) => {
      setTrendFilter(next);
      const nextRanked = rankToolsByTrend(data, next, 5);
      if (nextRanked[0]) onSelectTool(nextRanked[0]);
    },
    [onSelectTool, data]
  );

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portal to document.body + high z-index — Storybook stacking contexts won’t trap the overlay.
  const layer = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="growth-ticker-modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={MODAL_SPRING}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            backgroundColor: "var(--modal-bg)",
            border: "1px solid var(--overlay-strong)",
            borderRadius: 16,
            boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)",
            padding: "24px 28px 28px",
            width: 460,
            maxWidth: "90vw",
          }}
        >
          {/* Same rhythm as Builder Energy card: label row + control cluster on the right (toggle + close). */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, minHeight: 28 }}>
            <span
              id="growth-ticker-modal-title"
              className="select-none"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 9,
                color: "var(--text-secondary)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "'Geist Mono', ui-monospace, monospace",
              }}
            >
              Tool usage over time
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <GrowthTrendToggle value={trendFilter} onChange={onTrendChange} />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-faint)",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: "4px 6px",
                  marginRight: -6,
                  borderRadius: 4,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)";
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Hero: triangle + prefix (gray, not accent) + digits; % baseline-aligned — mirrors card. */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            {ranked.length === 0 ? (
              <span
                className="select-none"
                style={{ height: 80, display: "flex", alignItems: "center", fontSize: 72, color: "var(--color-gray8)", lineHeight: 1 }}
              >
                —
              </span>
            ) : (<>
            <span style={{ height: 80, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Triangle size={36} direction={isPositive ? "up" : "down"} />
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span
                className="select-none"
                style={{
                  fontSize: 40,
                  color: "var(--color-gray12)",
                  lineHeight: 1,
                  opacity: 0.6,
                  transition: `color 0.2s ${EASE}, opacity 0.2s ${EASE}`,
                }}
              >
                {isPositive ? "+" : "−"}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <motion.div layout style={{ display: "flex", gap: 0, alignItems: "center" }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {(() => {
                      const els: React.ReactNode[] = [];
                      digits.forEach((digit, i) => {
                        const posFromRight = digits.length - 1 - i;
                        els.push(
                          <motion.div
                            key={`md${posFromRight}`}
                            layout
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(4px)", transition: { type: "spring", stiffness: 520, damping: 22 } }}
                            transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.9 }}
                          >
                            <OdoDigit digit={digit} h={80} w={52} fontSize={72} />
                          </motion.div>
                        );
                        if (posFromRight > 0 && posFromRight % 3 === 0) {
                          els.push(
                            <motion.span
                              key={`mcomma${posFromRight}`}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.4 }}
                              exit={{ opacity: 0 }}
                              className="select-none"
                              style={{ fontSize: 52, color: "var(--color-gray12)", lineHeight: 1, marginBottom: 4, display: "inline-block" }}
                            >
                              ,
                            </motion.span>
                          );
                        }
                      });
                      return els;
                    })()}
                  </AnimatePresence>
                </motion.div>
                <span
                  className="select-none"
                  style={{
                    fontSize: 13,
                    color: "var(--color-gray9)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  %
                </span>
              </div>
            </div>
            </>)}
          </div>

          <div style={{ padding: "0 0 4px" }}>
            <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "16px 0 14px" }} />
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 10, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              By tool
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ranked.length === 0 ? (
                <span className="select-none" style={{ fontSize: 11, color: "var(--text-faint)", padding: "8px 4px" }}>
                  {trendFilter === "growing" ? "No tools with positive growth in this window." : "No tools with negative growth in this window."}
                </span>
              ) : (
                ranked.map((row, idx) => {
                  const isSel = selectedTool.tool === row.tool;
                  const isHov = hoveredRow === row.tool && !isSel;
                  const pct = computeGrowthPct(row);
                  const rowC = modalListRowTextColors(isSel, isHov);
                  return (
                    <motion.button
                      key={row.tool}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: idx * 0.04 }}
                      onClick={() => onSelectTool(row)}
                      onPointerEnter={() => setHoveredRow(row.tool)}
                      onPointerLeave={() => setHoveredRow(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        border: `1px solid ${isSel || isHov ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
                        backgroundColor: isSel ? "var(--overlay-medium)" : isHov ? "color-mix(in srgb, var(--overlay-medium) 42%, var(--overlay-subtle))" : "var(--overlay-subtle)",
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                        outline: "none",
                      }}
                    >
                      <span
                        className="select-none"
                        style={{
                          flexShrink: 0,
                          width: 34,
                          fontSize: 10,
                          letterSpacing: "0.02em",
                          fontVariantNumeric: "tabular-nums",
                          color: rowC.rank,
                          transition: "color 0.15s ease",
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          letterSpacing: "-0.01em",
                          color: rowC.title,
                          transition: "color 0.15s ease",
                        }}
                      >
                        {row.tool}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            opacity: isSel ? 1 : isHov ? 1 : 0.42,
                            transition: "opacity 0.15s ease",
                          }}
                        >
                          <Triangle size={12} direction={pct >= 0 ? "up" : "down"} />
                        </span>
                        <span
                          className="select-none"
                          style={{
                            fontSize: 11,
                            color: rowC.value,
                            letterSpacing: "0.02em",
                            transition: "color 0.15s ease",
                          }}
                        >
                          {formatGrowthPctLabel(pct)}
                        </span>
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--overlay-medium)",
              paddingTop: 16,
              marginTop: 4,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span className="select-none" style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.6 }}>
              {selectedTool.note}
            </span>
            <span
              className="select-none"
              style={{
                fontSize: 9,
                color: "var(--text-faint)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: 0.85,
                fontFamily: "'Geist Mono', ui-monospace, monospace",
              }}
            >
              Date range · {toolLoyaltyDateRangeLabel}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(layer, document.body);
}

export function GrowthTickerCardShell({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false);
  const border = hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)";
  const shadow = hovered
    ? ["inset 0 1px 0 rgba(255,255,255,0.18)", "inset 0 -2px 5px rgba(0,0,0,0.60)", "0 4px 14px rgba(0,0,0,0.70)", "0 0 0 0.5px rgba(255,255,255,0.08)"].join(", ")
    : ["inset 0 1px 0 rgba(255,255,255,0.10)", "inset 0 -2px 5px rgba(0,0,0,0.55)", "0 2px 8px rgba(0,0,0,0.55)", "0 0 0 0.5px rgba(255,255,255,0.04)"].join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 280,
        height: 200,
        borderRadius: 4,
        border: `1px solid ${border}`,
        background: `linear-gradient(175deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%), #191614`,
        boxShadow: shadow,
        overflow: "hidden",
        position: "relative",
        transition: "border-color 0.15s ease, box-shadow 0.22s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 14,
          width: 2,
          height: 28,
          borderRadius: "0 2px 2px 0",
          backgroundColor: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.10)",
          transition: "background-color 0.18s ease",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {children}
    </motion.div>
  );
}

/**
 * Full interactive growth ticker for bento grids (overflow:hidden safe).
 * Dropdown is portaled; notify parent when modal opens for forceHover on GridCard.
 */
export function GrowthTickerInteractive({
  onModalOpenChange,
  timeline,
}: {
  onModalOpenChange?: (open: boolean) => void;
  timeline?: ToolLoyaltyRow[];
}) {
  const data = timeline ?? toolLoyaltyTimeline;
  const [selectedTool, setSelectedTool] = React.useState<ToolLoyaltyTool>(
    firstRankedTool(data, "growing") ?? data[0]
  );
  React.useEffect(() => {
    setSelectedTool(firstRankedTool(data, "growing") ?? data[0]);
  }, [timeline]);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);

  const setModal = React.useCallback(
    (v: boolean) => {
      setModalOpen(v);
      onModalOpenChange?.(v);
    },
    [onModalOpenChange]
  );

  const openModal = React.useCallback(() => {
    if (data.length === 0) return;
    setModal(true);
    const first = firstRankedTool(data, "growing") ?? data[0];
    setSelectedTool(first);
  }, [setModal, data]);

  React.useLayoutEffect(() => {
    if (dropdownOpen && pillRef.current) {
      setAnchorRect(pillRef.current.getBoundingClientRect());
    } else {
      setAnchorRect(null);
    }
  }, [dropdownOpen, selectedTool]);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    function reposition() {
      if (pillRef.current) setAnchorRect(pillRef.current.getBoundingClientRect());
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [dropdownOpen]);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if ((e.target as HTMLElement).closest?.("[data-growth-ticker-menu]")) return;
      setDropdownOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [dropdownOpen]);

  return (
    <>
      <div ref={wrapperRef} style={{ position: "relative", height: "100%", minHeight: 0 }}>
        {data.length === 0 ? (
          <div style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 22px",
          }}>
            <span
              className="select-none font-mono"
              style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: "0.02em" }}
            >
              No tool searches found
            </span>
          </div>
        ) : (
          <GrowthTickerCardInner
            pillButtonRef={pillRef}
            onOpen={openModal}
            selectedTool={selectedTool}
            dropdownOpen={dropdownOpen}
            onPillClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((o) => !o);
            }}
          />
        )}
      </div>
      {dropdownOpen && (
        <ToolDropdownMenu
          selected={selectedTool}
          onSelect={(tool) => {
            setSelectedTool(tool);
            setDropdownOpen(false);
          }}
          anchorRect={anchorRect}
          timeline={data}
        />
      )}
      <AnimatePresence>
        {modalOpen && (
          <GrowthTickerModal
            onClose={() => setModal(false)}
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            timeline={data}
          />
        )}
      </AnimatePresence>
    </>
  );
}
