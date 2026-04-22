"use client";
// Collapsible accordion row — hover extends slightly past column edges (Membership-style).

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RowDivider } from "./RowDivider";

export function AccordionRow({ label, body, isLast }: { label: string; body: string; isLast?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          // negative margin + matching padding makes the hover bg bleed 12px on each side
          margin: "0 -12px",
          width: "calc(100% + 24px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 12px",
          background: hovered ? "rgba(255,255,255,0.05)" : "none",
          // borderRadius: rounds the bg only when visible (try 6 for subtler, 12 for pill-ish)
          borderRadius: 10,
          border: "none", cursor: "pointer", color: "#fff", textAlign: "left",
          transition: "background 0.12s ease",
        }}
      >
        <span className="font-mono" style={{ fontSize: 15, letterSpacing: "-0.01em", fontWeight: 500, color: "#fff" }}>{label}</span>
        {/* chevron rotates 90° when open */}
        <motion.svg
          animate={{ rotate: open ? 90 : 0, x: hovered && !open ? 1 : 0 }}
          // snappySpring: toggle feels instantaneous — spring tracks gesture, not a timer
          transition={{ type: "spring", stiffness: 500, damping: 50 }}
          width="13" height="13" viewBox="0 0 12 12" fill="none"
          stroke={hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke 0.12s ease" }}
        >
          <polyline points="4 2 8 6 4 10" />
        </motion.svg>
      </button>
      {/* body slides open — AnimatePresence unmounts it so layout collapses cleanly */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                // defaultSpring: organic open — height breathes in, not snaps
                height: { type: "spring", stiffness: 400, damping: 40 },
                // opacity trails height by 40ms so content doesn't flash before space opens
                opacity: { type: "spring", stiffness: 400, damping: 40, delay: 0.04 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                // exits lead — 2× stiffness so collapse is crisper than open
                height: { type: "spring", stiffness: 800, damping: 40 },
                // opacity snaps out ahead of height so it reads as intentional dismissal
                opacity: { duration: 0.08 },
              },
            }}
            style={{ overflow: "hidden" }}
          >
            <p className="font-mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 18px", paddingRight: 24 }}>{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLast && <RowDivider />}
    </div>
  );
}
