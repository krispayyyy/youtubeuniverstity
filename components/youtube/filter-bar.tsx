// components/youtube/filter-bar.tsx
"use client";

import React from "react";

export interface FilterBarCategory {
  id: string;
  label: string;
}

interface FilterBarProps {
  categories: FilterBarCategory[];
  // activeId: controlled by parent — FilterBar holds no internal state
  activeId: string;
  onSelect: (id: string) => void;
}

export function FilterBar({ categories, activeId, onSelect }: FilterBarProps) {
  // itemRefs: one ref per category item, used to measure offsetLeft + offsetWidth
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // pillStyle: position + size of the sliding white background pill
  const [pillStyle, setPillStyle] = React.useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  // useLayoutEffect: runs synchronously after DOM paint — avoids first-frame flash
  // (useEffect would fire after the browser has already painted, causing a visible jump)
  React.useLayoutEffect(() => {
    const activeIndex = categories.findIndex((c) => c.id === activeId);
    const el = itemRefs.current[activeIndex];
    if (!el) return;
    // offsetLeft/offsetWidth: position relative to the offset parent (the outer fixed container)
    // The outer container is position:fixed, which establishes a containing block for absolute children
    setPillStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
  }, [activeId, categories]);

  return (
    // Outer wrapper: fixed to viewport bottom, centered horizontally
    // zIndex 100: sits above grid cards
    // position:fixed also establishes a containing block for the absolute sliding pill
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        // Dark frosted-glass pill container
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 999,
        padding: 4,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Sliding pill: absolutely positioned within the fixed container */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: pillStyle.left,
          width: pillStyle.width,
          background: "#fff",
          borderRadius: 999,
          // Animate left + width for the slide; opacity fades in on first mount
          transition:
            "left 0.28s cubic-bezier(0.2,0,0,1), width 0.28s cubic-bezier(0.2,0,0,1), opacity 0.15s ease",
          opacity: pillStyle.opacity,
          pointerEvents: "none",
        }}
      />

      {categories.map((cat, i) => (
        <button
          key={cat.id}
          ref={(el) => { itemRefs.current[i] = el; }}
          onClick={() => onSelect(cat.id)}
          style={{
            // position:relative + zIndex:1: text sits above the absolute sliding pill
            position: "relative",
            zIndex: 1,
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            // Per-item text color: active = dark (readable on white pill), inactive = faint
            color: activeId === cat.id ? "#000" : "var(--text-faint)",
            // Animate text color as the pill slides over/away
            transition: "color 0.28s cubic-bezier(0.2,0,0,1)",
            fontSize: 12,
            fontFamily: "inherit",
            letterSpacing: "0.02em",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
