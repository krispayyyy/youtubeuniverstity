"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type Term = { term: string; count: number };

// ─── Expand toggle ──────────────────────────────────────────────────────────────

function ExpandToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        padding: "10px 0 0",
        cursor: "pointer",
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
        {expanded ? "Collapse" : "Expand"} top searches
      </span>
      <motion.span
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="font-mono select-none"
        style={{
          fontSize: 9,
          color: hovered ? "var(--text-secondary)" : "var(--text-faint)",
          transition: "color 0.15s",
          lineHeight: 1,
        }}
      >
        ↓
      </motion.span>
    </button>
  );
}

// ─── Typewriter search bar ──────────────────────────────────────────────────────

export default function TypewriterSearchBar({
  terms,
  defaultExpanded = false,
}: {
  terms: Term[];
  /** When true (modal context), the search bar and list render in their active/focused state */
  defaultExpanded?: boolean;
}) {
  const [displayed, setDisplayed] = React.useState("");
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState<"typing" | "hold" | "erasing">("typing");
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  // Filter and sort: remove "webflow", then order by count descending (highest first)
  const filtered = React.useMemo(
    () =>
      [...terms]
        .filter((t) => t.term.toLowerCase() !== "webflow")
        .sort((a, b) => b.count - a.count),
    [terms]
  );

  const target = filtered[idx % filtered.length]?.term ?? "";
  const ghost = phase === "typing" ? target.slice(displayed.length) : "";

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < target.length) {
        timer = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          52 + Math.random() * 58
        );
      } else {
        timer = setTimeout(() => setPhase("hold"), 1900);
      }
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("erasing"), 500);
    } else if (phase === "erasing") {
      if (displayed.length > 0) {
        timer = setTimeout(
          () => setDisplayed((p) => p.slice(0, -1)),
          20 + Math.random() * 22
        );
      } else {
        setIdx((p) => (p + 1) % filtered.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, phase, idx, target, filtered.length]);

  const currentCount = filtered[idx % filtered.length]?.count;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* ── Search bar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 20px",
          borderRadius: 10,
          border: `1px solid ${defaultExpanded ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
          backgroundColor: defaultExpanded ? "var(--overlay-medium)" : "var(--overlay-subtle)",
          overflow: "hidden",
        }}
      >
        {/* Count */}
        <AnimatePresence mode="wait">
          <motion.span
            key={currentCount}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="font-mono select-none"
            style={{
              fontSize: 12,
              color: "var(--accent)",
              width: 20,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {currentCount}
          </motion.span>
        </AnimatePresence>

        {/* Typed text */}
        <span
          className="font-mono select-none"
          style={{ fontSize: 13, color: "var(--text-primary)", letterSpacing: "0.01em" }}
        >
          {displayed}
        </span>

        {/* Cursor + glow */}
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            height: 17,
            flexShrink: 0,
          }}
        >
          {/* Glow halo */}
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 110,
              height: 52,
              background:
                "radial-gradient(ellipse 90px 26px at 6px 50%, rgba(233, 95, 56, 0.28) 0%, rgba(233, 95, 56, 0.08) 42%, transparent 68%)",
              pointerEvents: "none",
            }}
          />
          {/* Cursor bar */}
          <motion.span
            animate={{ opacity: phase === "hold" ? [1, 0, 1] : 1 }}
            transition={
              phase === "hold"
                ? { opacity: { duration: 0.85, repeat: Infinity, times: [0, 0.5, 1] } }
                : { duration: 0.08 }
            }
            style={{
              position: "relative",
              display: "block",
              width: 1.5,
              height: 16,
              backgroundColor: "var(--accent)",
              boxShadow:
                "0 0 5px 2px rgba(233, 95, 56, 0.5), 0 0 14px 5px rgba(233, 95, 56, 0.18)",
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        </span>

        {/* Ghost text */}
        <span
          className="font-mono select-none"
          style={{ fontSize: 13, color: "var(--text-faint)", letterSpacing: "0.01em" }}
        >
          {ghost}
        </span>
      </div>

      {/* ── Expand toggle ─────────────────────────────────────────────────────── */}
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {/* ── Full list ─────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "16px 0 4px",
                borderTop: "1px solid var(--overlay-subtle)",
                marginTop: 16,
              }}
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.18, ease: "easeOut" }}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span
                    className="font-mono select-none"
                    style={{
                      fontSize: 10,
                      color: "var(--accent)",
                      width: 20,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {item.count}
                  </span>
                  <motion.span
                    className="font-mono select-none"
                    animate={{
                      color: defaultExpanded
                        ? "var(--text-primary)"
                        : item.term === filtered[idx % filtered.length]?.term
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                    transition={{ duration: 0.4 }}
                    style={{ fontSize: 10 }}
                  >
                    {item.term}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
