"use client";
// Info nav row — extracted so useState is called at component top level (not inside map).

import * as React from "react";
import { motion } from "framer-motion";
import { InfoIconBox } from "./InfoIconBox";
import { RowDivider } from "./RowDivider";

export function InfoNavRow({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          margin: "0 -12px",
          width: "calc(100% + 24px)",
          display: "flex", alignItems: "center", gap: 16,
          padding: "20px 12px",
          background: hovered ? "rgba(255,255,255,0.05)" : "none",
          borderRadius: 10,
          border: "none", cursor: "pointer", color: "#fff",
          transition: "background 0.12s ease",
        }}
      >
        <InfoIconBox hovered={hovered}>{icon}</InfoIconBox>
        <span className="font-mono" style={{ fontSize: 15, letterSpacing: "-0.01em", fontWeight: 500, flex: 1, textAlign: "left", color: "#fff" }}>{label}</span>
        <motion.svg
          animate={{ x: hovered ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          width="13" height="13" viewBox="0 0 12 12" fill="none"
          stroke={hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)"}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke 0.12s ease" }}
        >
          <polyline points="4 2 8 6 4 10" />
        </motion.svg>
      </button>
      <RowDivider />
    </div>
  );
}
