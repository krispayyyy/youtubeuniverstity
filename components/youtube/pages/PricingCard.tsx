"use client";
// Pricing tier card used on the Interview Agents page.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).

import * as React from "react";
import { motion } from "framer-motion";
import { playTick } from "@/components/youtube/main-grid/sounds";

export interface PricingCardProps {
  name: string;
  description: string;
  price: string;
  features: string[];
}

export function PricingCard({ name, description, price, features }: PricingCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const [ctaHovered, setCtaHovered] = React.useState(false);
  const [ctaPressed, setCtaPressed] = React.useState(false);

  return (
    <motion.div
      onMouseEnter={() => { setHovered(true); playTick(); }}
      onMouseLeave={() => setHovered(false)}
      animate={{ y: hovered ? -2 : 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      style={{
        borderRadius: 12,
        background: "rgba(25, 22, 20, 0.40)",
        border: "1px solid rgba(255,255,255,0.10)",
        transition: "border-color 0.22s ease",
        padding: "28px 26px 26px",
        display: "flex",
        flexDirection: "column",
        minHeight: 480,
        height: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        willChange: "transform",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: hovered ? "rgba(255,255,255,1.0)" : "rgba(220,214,208,0.72)", letterSpacing: "-0.01em", transition: "color 0.18s ease" }}>{name}</span>
        <span style={{ color: hovered ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.22)", fontSize: 13, transition: "color 0.18s ease" }}>·</span>
        <span className="font-mono" style={{ fontSize: 12, color: hovered ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.22)", fontWeight: 400, transition: "color 0.18s ease" }}>Private Beta</span>
      </div>
      <div style={{ minHeight: 68, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: hovered ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)", lineHeight: 1.65, margin: 0, transition: "color 0.18s ease" }}>{description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "0 0 24px" }}>
        <span className="font-mono" style={{ fontSize: 26, fontWeight: 700, color: hovered ? "rgba(255,255,255,0.92)" : "rgba(220,214,208,0.65)", letterSpacing: "-0.03em", transition: "color 0.18s ease" }}>{price}</span>
        {price !== "Free" && (
          <span className="font-mono" style={{ fontSize: 12, color: hovered ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)", letterSpacing: "-0.01em", transition: "color 0.18s ease" }}>/ lifetime access</span>
        )}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: hovered ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)", transition: "color 0.18s ease" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <polyline points="2 7 5.5 10.5 11 3" stroke={hovered ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.22)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.18s ease" }} />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <motion.button
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => { setCtaHovered(false); setCtaPressed(false); }}
        onMouseDown={() => setCtaPressed(true)}
        onMouseUp={() => setCtaPressed(false)}
        animate={{ scale: ctaPressed ? 0.97 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 8,
          border: `1px solid ${ctaHovered ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.14)"}`,
          background: ctaHovered ? "rgba(255,255,255,0.06)" : "transparent",
          color: ctaHovered ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.38)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          letterSpacing: "0.04em",
          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
        }}
      >
        Coming Soon
      </motion.button>
    </motion.div>
  );
}
