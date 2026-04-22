import * as React from "react";

// Small dark icon box — uses same gradient fill + shadow as the pricing cards.
export function InfoIconBox({ children, hovered }: { children: React.ReactNode; hovered?: boolean }) {
  return (
    <div style={{
      width: 32, height: 32,
      background: hovered
        ? "#252321"
        : "linear-gradient(175deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%), #191614",
      border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)"}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 5px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04)",
      borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)",
      transition: "background 0.15s ease, border-color 0.15s ease, color 0.12s ease",
    }}>
      {children}
    </div>
  );
}
