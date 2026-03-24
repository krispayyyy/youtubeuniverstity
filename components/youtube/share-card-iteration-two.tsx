"use client";

import * as React from "react";
import { useMemo } from "react";
import { ParticleMorph } from "@/components/particles/particle-morph";
import { formatHour, type YouTubeStats } from "@/lib/compute-stats";

/** Stats / header horizontal inset (matches Figma content block). */
const INSET_STATS = 20;
/** Particle block horizontal inset — Figma uses 16px on the well wrapper (slightly wider field). */
const INSET_PARTICLE = 16;

export interface ShareCardIterationTwoProps {
  stats: YouTubeStats;
  width?: number;
}

function splitHoursMinutes(hours: number): { h: number; m: number } {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60) % 60;
  return { h, m };
}

function gridSnapshotRows(stats: YouTubeStats): { label: string; value: string }[] {
  const { h, m } = splitHoursMinutes(stats.avgHoursPerDay);
  const bestDay = stats.bingeSessions[0]?.count ?? 0;
  const topPct = Math.round(stats.topCategory.percentage);
  return [
    { label: "Videos", value: stats.totalVideos.toLocaleString() },
    { label: "Days active", value: stats.totalDays.toLocaleString() },
    { label: "Searches", value: stats.totalSearches.toLocaleString() },
    { label: "Peak hour", value: formatHour(stats.topHour) },
    { label: "Avg daily", value: `${h}h ${String(m).padStart(2, "0")}m` },
    { label: "After midnight", value: `${Math.round(stats.nightOwlPercent)}%` },
    { label: "Best day", value: `${bestDay} videos` },
    { label: "Top category", value: `${topPct}% · ${stats.topCategory.label}` },
  ];
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        padding: "8px 0",
        borderBottom: "1px solid var(--overlay-subtle)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <span
        className="select-none"
        style={{
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: "var(--color-gray8)",
          flexShrink: 0,
          lineHeight: 1.35,
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </span>
      <span
        className="select-none"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--color-gray12)",
          letterSpacing: "-0.24px",
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
          lineHeight: 1.35,
          fontFamily: "var(--font-mono)",
          flex: 1,
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Share card iteration two — Figma node 141:2: stats inset 20px; particle column inset 16px;
 * well = rgba black fill + #252525 outline + inner vignette (no extra divider above the visual).
 */
export default function ShareCardIterationTwo({ stats, width }: ShareCardIterationTwoProps) {
  const rows = useMemo(() => gridSnapshotRows(stats), [stats]);
  const year = stats.dateRange.latest.getFullYear();

  return (
    <div
      style={{
        width: width !== undefined ? width : "100%",
        maxWidth: "100%",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: 0,
        overflow: "hidden",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          gap: 11,
          padding: `16px ${INSET_STATS}px 0`,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <p
            className="select-none"
            style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "1.26px",
              textTransform: "uppercase",
              color: "var(--color-gray8)",
              lineHeight: "13.5px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Watch history · {year}
          </p>
          <h2
            className="select-none"
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 500,
              letterSpacing: "-0.57px",
              lineHeight: "22.8px",
              color: "var(--color-gray12)",
            }}
          >
            Activity snapshot
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {rows.map((row) => (
            <DataRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </div>

      {/* Figma 141:73–74: no hairline between stats and visual — only the outlined well */}
      <div
        style={{
          marginTop: 10,
          padding: `10px ${INSET_PARTICLE}px 14px`,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            borderRadius: 10,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            data-sphere-well="true"
            style={{
              position: "relative",
              height: 200,
              width: "100%",
              overflow: "hidden",
              borderRadius: 8,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              border: "1px solid #252525",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: 425,
                height: 425,
                transform: "translateX(-50%) scale(1.22) translateY(-14%)",
                transformOrigin: "50% 50%",
              }}
            >
              <ParticleMorph
                shape={0}
                rotationSpeed={0.22}
                rotationSpeedX={0.07}
                rotationSpeedZ={0.02}
                cursorDispersion
                disableScroll
                cursorRadius={130}
                repelStrength={0.55}
                clickForce={2}
                hideControls
                backgroundColor="#1B1718"
                particleColor="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
