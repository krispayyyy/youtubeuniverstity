// Shared data for Tool Loyalty / Growth Ticker (tool usage over time).

export const toolLoyaltyTimeline = [
  { tool: "Cursor", earlyN: 4, recentN: 52, note: "Cursor launched late 2024 — almost all searches are recent" },
  { tool: "Claude Code", earlyN: 0, recentN: 52, note: "Launched early 2025 — zero early, 100% recent" },
  { tool: "Figma", earlyN: 120, recentN: 49, note: "Consistent throughout — still dominant in early period" },
  { tool: "ChatGPT", earlyN: 10, recentN: 5, note: "Replaced by Claude in day-to-day use" },
  { tool: "Webflow", earlyN: 10, recentN: 4, note: "Earlier project phase — less relevant now" },
] as const;

export type ToolLoyaltyRow = {
  tool: string;
  earlyN: number;
  recentN: number;
  note?: string;
};

export const toolLoyaltyMax = 169;

/** Window for the early vs recent search counts (mock / story data). Shown under the tool note in the modal. */
export const toolLoyaltyDateRangeLabel = "Jan 2024 – Mar 2026";

/** Percent change from early → recent period (earlyN = 0 → 100% if any recent usage). */
export function computeGrowthPct(tool: ToolLoyaltyRow): number {
  if (!tool || typeof tool.earlyN !== "number") return 0;
  if (tool.earlyN === 0) return tool.recentN > 0 ? 100 : 0;
  return ((tool.recentN - tool.earlyN) / tool.earlyN) * 100;
}

export type ToolTrend = "growing" | "declining";

/** Up to `max` tools with growth &gt; 0 (descending %) or &lt; 0 (most negative first). */
export function rankToolsByTrend(
  timeline: readonly ToolLoyaltyRow[],
  trend: ToolTrend,
  max = 5
): ToolLoyaltyRow[] {
  const withPct = timeline.map((t) => ({ t, pct: computeGrowthPct(t) }));
  if (trend === "growing") {
    return withPct
      .filter((x) => x.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, max)
      .map((x) => x.t);
  }
  return withPct
    .filter((x) => x.pct < 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, max)
    .map((x) => x.t);
}

export function firstRankedTool(timeline: readonly ToolLoyaltyRow[], trend: ToolTrend): ToolLoyaltyRow | undefined {
  return rankToolsByTrend(timeline, trend, 1)[0];
}

/** Default card selection: #1 by growth % (not raw delta). */
export const toolLoyaltyDefaultTool: ToolLoyaltyRow =
  firstRankedTool(toolLoyaltyTimeline, "growing") ?? toolLoyaltyTimeline[0];

export function formatGrowthPctLabel(pct: number): string {
  const n = Math.round(pct);
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n)}%`;
}
