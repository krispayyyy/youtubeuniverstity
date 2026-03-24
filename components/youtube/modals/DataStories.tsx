import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { motion, AnimatePresence, useSpring, useVelocity, useTransform } from "framer-motion";
import rawDefaultStats from "@/data/stats.json";
// Raw data is loaded dynamically when users upload their YouTube Takeout zip.
// These empty arrays provide graceful defaults for the demo state.
const rawWatchHistory: { videoId: string; title: string; channelName: string; channelUrl: string; videoUrl: string; timestamp: string; hour: number; date: string }[] = [];
const rawSearchHistory: { query: string; timestamp: string; date: string }[] = [];
import type { YouTubeStats } from "@/lib/compute-stats";
import { categorize, CATEGORIES } from "@/lib/categories";
import { groupSearchesByTheme, SEARCH_THEMES } from "@/lib/curation";
import { GrowthTickerInteractive } from "@/components/youtube/growth-ticker";
import { ElevatedSection } from "@/components/ui/elevated-section";
// ─── Animated icons ───────────────────────────────────────────────────────────
import { CoffeeIcon }        from "@/components/ui/icons/coffee";
import { MoonIcon }          from "@/components/ui/icons/moon";
import { SunIcon }           from "@/components/ui/icons/sun";
import { HeartIcon }         from "@/components/ui/icons/heart";
import { FlameIcon }         from "@/components/ui/icons/flame";
import { ZapIcon }           from "@/components/ui/icons/zap";
import { SparklesIcon }      from "@/components/ui/icons/sparkles";
import { RocketIcon }        from "@/components/ui/icons/rocket";
import { BrainIcon }         from "@/components/ui/icons/brain";
import { GraduationCapIcon } from "@/components/ui/icons/graduation-cap";
import { BookTextIcon }      from "@/components/ui/icons/book-text";
import { CookingPotIcon }    from "@/components/ui/icons/cooking-pot";
import { PartyPopperIcon }   from "@/components/ui/icons/party-popper";
import { HomeIcon }          from "@/components/ui/icons/home";
import { MapPinIcon }        from "@/components/ui/icons/map-pin";
import { CompassIcon }       from "@/components/ui/icons/compass";
import { TelescopeIcon }     from "@/components/ui/icons/telescope";
import { MessageCircleIcon } from "@/components/ui/icons/message-circle";
import { SmileIcon }         from "@/components/ui/icons/smile";
import { LaughIcon }         from "@/components/ui/icons/laugh";
import { HandHeartIcon }     from "@/components/ui/icons/hand-heart";
import { WavesIcon }         from "@/components/ui/icons/waves";
import { SnowflakeIcon }     from "@/components/ui/icons/snowflake";
import { RockingChairIcon }  from "@/components/ui/icons/rocking-chair";
import { CctvIcon }          from "@/components/ui/icons/cctv";
import { FrameIcon }         from "@/components/ui/icons/frame";
import { HandMetalIcon }     from "@/components/ui/icons/hand-metal";
import { VideoIcon }         from "@/components/ui/icons/video";
import { ChannelSubscribeMorphPill, ChannelYoutubeLinkChip, type SubscribePillHandle } from "@/components/youtube/channel-subscribe-morph-pill";
import { BellIcon, type BellIconHandle } from "@/components/ui/icons/bell";
import { toolLoyaltyTimeline, toolLoyaltyMax } from "@/lib/tool-loyalty-data";
import { modalListRowTextColors } from "@/components/youtube/modal-list-styles";

/** Re-hydrate Date fields from JSON */
// theme: same pattern as FullStory — watches data-theme on <html>
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

function hydrateStats(raw: typeof rawDefaultStats): YouTubeStats {
  return {
    ...(raw as unknown as YouTubeStats),
    dateRange: {
      earliest: new Date(raw.dateRange.earliest as unknown as string),
      latest: new Date(raw.dateRange.latest as unknown as string),
    },
    weeklyBuckets: raw.weeklyBuckets.map((b) => ({
      ...b,
      weekStart: new Date(b.weekStart as unknown as string),
    })),
  };
}

const stats = hydrateStats(rawDefaultStats);

// ─── Derived data ────────────────────────────────────────────────────────────

// Streak calculation
function computeStreaks(buckets: { date: string; count: number }[]) {
  let current = 0;
  let longest = 0;
  let longestEnd = "";
  let longestStart = "";
  let tempStart = "";

  for (const b of buckets) {
    if (b.count > 0) {
      if (current === 0) tempStart = b.date;
      current++;
      if (current > longest) {
        longest = current;
        longestEnd = b.date;
        longestStart = tempStart;
      }
    } else {
      current = 0;
    }
  }
  return { longest, longestStart, longestEnd };
}

const streakInfo = computeStreaks(stats.dailyBuckets);
const zeroDays = stats.dailyBuckets.filter((d) => d.count === 0).length;
const activeDays = stats.dailyBuckets.length - zeroDays;
const activePercent = ((activeDays / stats.dailyBuckets.length) * 100).toFixed(1);

// Median daily count
const sortedCounts = stats.dailyBuckets.map((d) => d.count).sort((a, b) => a - b);
const medianDaily = sortedCounts[Math.floor(sortedCounts.length / 2)];

// Day of week averages
function getDayOfWeekAvg(buckets: { date: string; count: number }[]) {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const b of buckets) {
    const dow = new Date(b.date).getDay();
    sums[dow] += b.count;
    counts[dow]++;
  }
  return names.map((name, i) => ({ name, avg: (sums[i] / counts[i]).toFixed(1) }));
}
const dowAvg = getDayOfWeekAvg(stats.dailyBuckets);
const peakDay = dowAvg.reduce((a, b) => (parseFloat(a.avg) > parseFloat(b.avg) ? a : b));
const quietDay = dowAvg.reduce((a, b) => (parseFloat(a.avg) < parseFloat(b.avg) ? a : b));

// Monthly totals
function getMonthlyTotals(buckets: { date: string; count: number }[]) {
  const map = new Map<string, number>();
  for (const b of buckets) {
    const key = b.date.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + b.count);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}
const monthly = getMonthlyTotals(stats.dailyBuckets);
const peakMonth = monthly.reduce((a, b) => (a.total > b.total ? a : b));

// Time blocks
const afterMidnight = stats.hourBuckets.filter(h => h.hour >= 0 && h.hour < 5).reduce((s, h) => s + h.count, 0);
const peakWindow = stats.hourBuckets.filter(h => h.hour === 23 || h.hour === 0).reduce((s, h) => s + h.count, 0);
const peakWindowPct = ((peakWindow / stats.totalVideos) * 100).toFixed(1);

// Engineering vs Design gap
const engDesignGap = Math.abs(
  (stats.categoryBreakdown.find(c => c.id === "engineering")?.count ?? 0) -
  (stats.categoryBreakdown.find(c => c.id === "design")?.count ?? 0)
);

// Tool proficiency — aggregate raw search history by query, then cluster into themes
// using the same keyword-grouping logic as the rest of the app (groupSearchesByTheme).
// This means "github", "git workflow", "github actions" all collapse into one "github" row.
const _rawSearchTerms = (() => {
  const counts = new Map<string, number>();
  for (const s of rawSearchHistory as { query: string }[]) {
    const q = s.query.toLowerCase().trim();
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([term, count]) => ({ term, count }));
})();

// All themes, scored and sorted — used for per-category card data
const allSearchThemes = groupSearchesByTheme(_rawSearchTerms, SEARCH_THEMES.length);

// Map theme label → category for card rendering
const _themeCatMap = new Map(SEARCH_THEMES.map(t => [t.label, t.category]));

// Engineering-specific themes for the Engineering tools card
const engSearchThemes = allSearchThemes
  .filter(t => _themeCatMap.get(t.term) === "engineering")
  .map(t => ({ tool: t.term, searches: t.count, category: "engineering" as const }));

// Tool loyalty — before/after narrative (early period vs recent period)
// Early = first half of date range (pre AI-shift); Recent = last half

// Engineering tool time (engineering category watches)
const engVideos = stats.categoryBreakdown.find(c => c.id === "engineering")?.count ?? 0;
const engPct = stats.engineeringPercent.toFixed(1);

// ─── Raw data computations ────────────────────────────────────────────────────

// categorize() uses plain includes() for all keywords, including short ones like 'ai'.
// That causes false positives: "training" → AI, "detail" → AI, "available" → AI, etc.
// Use word-boundary matching for keywords ≤3 chars, matching categorizeSearchTerm() in compute-stats.ts.
function categorizeWatchEntry(text: string): string {
  const lower = text.toLowerCase();
  for (const cat of CATEGORIES) {
    const matched = cat.keywords.some((kw) => {
      if (kw.length <= 3) {
        return new RegExp(`(?<![a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "i").test(lower);
      }
      return lower.includes(kw);
    });
    if (matched) return cat.id;
  }
  return "other";
}

type WatchEntry = { title: string; channelName: string; date: string };
type CatCounts = { ai: number; design: number; engineering: number; startup: number; total: number };

const { monthlyCategories, rabbitHoles, uniqueChannelCount } = (() => {
  const byMonth = new Map<string, CatCounts>();
  const byDay = new Map<string, CatCounts>();
  const empty = (): CatCounts => ({ ai: 0, design: 0, engineering: 0, startup: 0, total: 0 });

  const relevantEntries: WatchEntry[] = [];
  for (const v of rawWatchHistory as WatchEntry[]) {
    const cat = categorizeWatchEntry(v.title + " " + v.channelName);
    // Skip non-design-relevant content entirely — fitness, culture, finance, lo-fi, etc.
    // must not pollute totals or skew category percentages
    if (cat !== "ai" && cat !== "design" && cat !== "engineering" && cat !== "startup") continue;
    relevantEntries.push(v);
    const month = v.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, empty());
    if (!byDay.has(v.date)) byDay.set(v.date, empty());
    const m = byMonth.get(month)!;
    const d = byDay.get(v.date)!;
    m.total++; d.total++;
    m[cat]++; d[cat]++;
  }

  const monthlyCategories = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, c]) => ({
      month,
      aiPct:     c.total > 0 ? (c.ai / c.total) * 100 : 0,
      designPct: c.total > 0 ? (c.design / c.total) * 100 : 0,
      engPct:    c.total > 0 ? (c.engineering / c.total) * 100 : 0,
      total: c.total,
    }));

  const rabbitHoles = Array.from(byDay.entries())
    .flatMap(([date, c]) => {
      const relevantTotal = c.ai + c.design + c.engineering + c.startup;
      if (relevantTotal < 6) return [];
      for (const cat of ["ai", "design", "engineering", "startup"] as const) {
        if (c[cat] / relevantTotal >= 0.85) {
          return [{ date, category: cat, pct: Math.round((c[cat] / relevantTotal) * 100), count: relevantTotal }];
        }
      }
      return [];
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  const uniqueChannelCount = new Set(relevantEntries.map((v) => v.channelName)).size;

  return { monthlyCategories, rabbitHoles, uniqueChannelCount };
})();

// Most common rabbit hole category
const rhCatCounts = rabbitHoles.reduce((acc, h) => {
  acc[h.category] = (acc[h.category] ?? 0) + 1;
  return acc;
}, {} as Record<string, number>);
const topRabbitCat = Object.entries(rhCatCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "ai";
const catLabels: Record<string, string> = { ai: "AI", design: "Design", engineering: "Engineering", startup: "Startup" };

// Group consecutive rabbit hole days (same category, within 2 days) into obsession periods
const rhPeriods = (() => {
  const sorted = [...rabbitHoles].sort((a, b) => a.date.localeCompare(b.date));
  const periods: { startDate: string; endDate: string; category: string; days: number }[] = [];
  let current: typeof sorted = [];
  for (const hole of sorted) {
    if (current.length === 0) { current = [hole]; continue; }
    const last = current[current.length - 1];
    const gap = (new Date(hole.date).getTime() - new Date(last.date).getTime()) / 86_400_000;
    if (gap <= 2 && hole.category === current[0].category) {
      current.push(hole);
    } else {
      if (current.length >= 2) periods.push({ startDate: current[0].date, endDate: current[current.length - 1].date, category: current[0].category, days: current.length });
      current = [hole];
    }
  }
  if (current.length >= 2) periods.push({ startDate: current[0].date, endDate: current[current.length - 1].date, category: current[0].category, days: current.length });
  return periods.sort((a, b) => b.days - a.days);
})();

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  background: "#111",
  color: "#DCD6D0",
  fontFamily: "var(--font-sans, 'PP Neue Montreal', system-ui, sans-serif)",
  padding: "48px 40px",
  maxWidth: 1100,
  margin: "0 auto",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 56,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "monospace",
  textTransform: "uppercase" as const,
  letterSpacing: "0.15em",
  color: "#E95F38",
  marginBottom: 20,
  fontWeight: 500,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  borderRadius: 12,
  padding: "24px 24px 20px",
  border: "1px solid #2a2725",
};

const cardTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#DCD6D0",
  marginBottom: 8,
  lineHeight: 1.3,
};

const statStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  color: "#fff",
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  marginBottom: 6,
};

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6B6560",
  lineHeight: 1.5,
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontFamily: "monospace",
  padding: "3px 8px",
  borderRadius: 4,
  background: "#252321",
  color: "#A9A295",
  marginTop: 10,
  marginRight: 6,
};

const vizHint: React.CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontFamily: "monospace",
  padding: "3px 8px",
  borderRadius: 4,
  background: "#1c2a1c",
  color: "#5a9a5a",
  marginTop: 10,
  marginRight: 6,
};

// ─── Card data ───────────────────────────────────────────────────────────────

interface StoryCardData {
  id: string;
  section: string;
  title: string;
  stat: string;
  sub: string;
  tag?: string;
  viz?: string;
  accent?: string;
  flagged?: boolean;
  /** Why this was flagged — conversational notes to remember context */
  whyFlagged?: string;
}

const ALL_CARDS: StoryCardData[] = [
  // ── Big Numbers
  { id: "total-videos", section: "The Big Numbers", title: "Total videos watched", stat: stats.totalVideos.toLocaleString(), sub: `Over ${stats.totalDays} days (${new Date(stats.dateRange.earliest as unknown as string).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${new Date(stats.dateRange.latest as unknown as string).toLocaleDateString("en-US", { month: "short", year: "numeric" })})`, tag: "hero-stat", viz: "counter / odometer" },
  { id: "avg-per-day", section: "The Big Numbers", title: "Average videos per day", stat: stats.avgVideosPerDay.toFixed(1), sub: `Median is ${medianDaily}/day — the mean is pulled up by binge days`, tag: "hero-stat", viz: "counter" },
  { id: "total-searches", section: "The Big Numbers", title: "Total searches", stat: stats.totalSearches.toLocaleString(), sub: "Design-relevant searches filtered from full search history", tag: "hero-stat", viz: "counter" },
  { id: "builder-energy", section: "The Big Numbers", title: "Builder energy", stat: (stats.builderEnergy * 100).toFixed(0) + "%", sub: "Composite score: focus (35%) + consistency (30%) + volume (20%) + floor (15%)", accent: "#E95F38", tag: "hero-stat", viz: "energy bar (exists)" },

  // ── Time Stories
  { id: "11pm-learner", section: "Time Stories", title: "The 11 PM Learner", stat: `${stats.hourBuckets[23].count.toLocaleString()} videos`, sub: `Peak hour is 11 PM — ${stats.hourBuckets[23].percentage.toFixed(1)}% of all watching happens in this single hour`, tag: "time", viz: "time dial (exists)" },
  { id: "11pm-1am-window", section: "Time Stories", title: "The 11PM-1AM window", stat: `${peakWindowPct}%`, sub: `${peakWindow.toLocaleString()} videos in just 2 hours — more than any 4-hour workday block`, tag: "time", viz: "highlighted arc on dial" },
  { id: "after-midnight", section: "Time Stories", title: "After midnight", stat: `${stats.nightOwlPercent.toFixed(1)}%`, sub: `${afterMidnight.toLocaleString()} videos between midnight and 5 AM. 1 in 5 videos watched when most people are asleep.`, tag: "time", viz: "stat card", flagged: true, whyFlagged: "After midnight is really interesting — a shareable, surprising stat." },
  { id: "lunch-gap", section: "Time Stories", title: "The lunch break that doesn't exist", stat: "-45%", sub: `11 AM drops to ${stats.hourBuckets[11].count} from ${stats.hourBuckets[10].count} at 10 AM. The 11AM-1PM window is the quietest daytime stretch. Heads-down work time.`, tag: "time", viz: "callout on dial" },
  { id: "daily-shape", section: "Time Stories", title: "The shape of your day", stat: "Trimodal", sub: "Three peaks: morning warmup (8-10 AM), afternoon ramp (2-6 PM), night superspike (10 PM-1 AM). Your day has a rhythm.", tag: "time", viz: "24hr area chart" },

  // ── Consistency & Rest
  { id: "longest-streak", section: "Consistency & Rest", title: "Longest streak", stat: `${streakInfo.longest} days`, sub: `${streakInfo.longestStart} to ${streakInfo.longestEnd}. ${(streakInfo.longest / 7).toFixed(0)} straight weeks without a zero day.`, tag: "streak", viz: "streak bar / calendar highlight", flagged: true, whyFlagged: "Streak is a cool idea — could be visualized in a really engaging way." },
  { id: "days-active", section: "Consistency & Rest", title: "Days active", stat: `${activePercent}%`, sub: `Only ${zeroDays} rest days out of ${stats.dailyBuckets.length}. You showed up almost every single day.`, tag: "streak", viz: "stat card", flagged: true, whyFlagged: "Percentage of days active (framed as rest days) is really nice." },
  { id: "rest-day", section: "Consistency & Rest", title: "Your rest day", stat: quietDay.name, sub: `${quietDay.name} averages ${quietDay.avg} videos/day — barely half of ${peakDay.name}'s ${peakDay.avg}. Even learners need a day off. In a world of AI burnout, this is self-care.`, accent: "#E95F38", tag: "rest", viz: "day-of-week mini bar chart", flagged: true, whyFlagged: "Selecting the day of rest because AI leads to burnout is really cool. Can visualize in a cool way." },
  { id: "7-day-learner", section: "Consistency & Rest", title: "7-day learner", stat: "No weekends off", sub: `Weekend avg: ${getDayOfWeekAvgStr("weekend")} · Weekday avg: ${getDayOfWeekAvgStr("weekday")}. Statistically identical. Learning doesn't take weekends.`, tag: "consistency", viz: "stat card" },

  // ── Intensity
  { id: "peak-month", section: "Intensity", title: "Most intense learning period", stat: new Date(peakMonth.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }), sub: `${peakMonth.total.toLocaleString()} videos in a single month. Click to see daily breakdown, top categories, and what you were obsessing over.`, accent: "#E95F38", tag: "peak-month", viz: "expandable card with daily bars", flagged: true, whyFlagged: "The most intense learning period / month you learned the most. Should be expandable — click to see video counts, dates, what you were obsessing over." },
  { id: "daily-record", section: "Intensity", title: "Daily record", stat: `${stats.bingeSessions[0].count} videos`, sub: `${stats.bingeSessions[0].date} — your biggest single-day deep dive. Needs audit: may include short-form content slipping through filters.`, tag: "binge", viz: "stat card" },
  { id: "top-binge-days", section: "Intensity", title: "Top binge days", stat: `${stats.bingeSessions.length} sessions`, sub: stats.bingeSessions.slice(0, 5).map(b => `${b.date}: ${b.count} videos`).join(" · "), tag: "binge", viz: "list inside expandable" },

  // ── Your #1 Channel
  { id: "top-channel", section: "Your #1 Channel", title: stats.topChannels[0].name, stat: `${stats.topChannels[0].count} videos`, sub: "Your most-watched channel — 1.8x the runner-up. This is your learning community, not just a channel.", accent: "#f472b6", tag: "channel", viz: "featured card with channel art", flagged: true, whyFlagged: "Love that #1 is Dive Club. Should be prioritized — just top channel, no top 5." },
  { id: "learning-diversity", section: "Your #1 Channel", title: "Learning diversity", stat: "Hundreds of sources", sub: "Top 25 channels = only 18% of total watching. You follow topics across hundreds of creators, not a handful of personalities.", tag: "diversity", viz: "radar / spike chart (Anthropic-style)", flagged: true, whyFlagged: "Diversity of learning — imagine a spike graph like the Anthropic AI jobs report radar chart. Shows all the different things you're learning." },

  // ── Category Identity
  { id: "ai-dominance", section: "Category Identity", title: "AI dominance", stat: `${stats.aiPercent.toFixed(1)}%`, sub: `${stats.categoryBreakdown.find(c => c.id === "ai")?.count.toLocaleString()} videos. Nearly 3 out of every 4 videos are AI & Machine Learning.`, accent: "#818cf8", tag: "identity", viz: "single dominant bar or pie" },
  { id: "perfect-tie", section: "Category Identity", title: "The perfect tie", stat: `${engDesignGap} videos apart`, sub: `Engineering (${stats.engineeringPercent.toFixed(1)}%) and Design (${stats.designPercent.toFixed(1)}%) separated by ${engDesignGap} videos out of ${stats.totalVideos.toLocaleString()}+. True design-engineer hybrid.`, accent: "#34d399", tag: "identity", viz: "dual bar comparison" },
  { id: "builder-not-founder", section: "Category Identity", title: "Builder, not founder", stat: `${stats.startupPercent.toFixed(1)}%`, sub: "Startup content is under 3%. Craft over strategy. Building over fundraising.", accent: "#fbbf24", tag: "identity" },

  // ── Tool Proficiency
  ...allSearchThemes.slice(0, 6).map(t => {
    const cat = _themeCatMap.get(t.term) ?? "engineering";
    return {
      id: `tool-${t.term.toLowerCase().replace(/\s+/g, "-")}`,
      section: "Tool Proficiency",
      title: t.term,
      stat: `${t.count} searches`,
      sub: `Category: ${cat}. Aggregated from all search queries matching the "${t.term}" cluster.`,
      accent: cat === "ai" ? "#818cf8" : cat === "design" ? "#f472b6" : "#34d399",
      tag: "tool",
      viz: "clickable tool card",
    };
  }),
  { id: "tool-loyalty", section: "Tool Proficiency", title: "Tool loyalty", stat: "108 vs 15", sub: '"claude code" + "cursor ai" = 108 searches. "openai + chatgpt" = 15. You picked your tools and went deep.', tag: "tool", viz: "comparison bar", flagged: true, whyFlagged: "Tool loyalty is interesting — can visualize as learning more tools over time. Click in to list tools you're proficient in based on searches and watch data." },
  { id: "engineering-tools", section: "Tool Proficiency", title: "Engineering tools", stat: `${engVideos.toLocaleString()} videos (${engPct}%)`, sub: "GitHub, React, Next.js, Storybook, Vercel — how much time you spend in the engineering toolchain vs design.", accent: "#34d399", tag: "tool", viz: "tool list with proportional bars", flagged: true, whyFlagged: "GitHub knowledge / engineering tools is interesting — how much time on GitHub, engineering tools. Really relevant for the audience." },

  // ── Category Over Time
  { id: "ai-growth-curve", section: "Category Over Time", title: "The AI growth curve", stat: "? to 72%", sub: "Did AI% start at 50% and grow? Or was it always dominant? A competing-lines chart (like a financial chart) would show each category's share over time — AI rising, others shifting.", tag: "needs-raw-data", viz: "multi-line area chart (stacked or overlapping)", flagged: true, whyFlagged: "A financial-chart-style graph showing competing category lines over time — AI grows, others drop. Like financial data with competing lines. Would be really cool." },
  { id: "category-by-time", section: "Category Over Time", title: "Category by time of day", stat: "Night AI vs Day Design?", sub: "Is AI content consumed at night and design during the day? Or is the mix uniform? Would reveal if different modes of learning map to different times.", tag: "needs-raw-data", viz: "stacked bar by hour" },

  // ── Rabbit Holes
  { id: "total-rabbit-holes", section: "Rabbit Holes", title: "Total rabbit holes", stat: "?", sub: "Count of days where >90% of videos are one category. Requires per-day category breakdown from raw watch data.", tag: "needs-raw-data", viz: "counter + list", flagged: true, whyFlagged: "Rabbit holes is interesting — how many have you gone into? What does a rabbit hole even mean? Show ranges of dates and categories." },
  { id: "deepest-rabbit-holes", section: "Rabbit Holes", title: "Your deepest rabbit holes", stat: "Dates + Categories", sub: 'Browsable list: "Mar 14: 94% AI (38 videos)" — click to see what you were watching. Shows the dates, the dominant category, and the depth of focus.', tag: "needs-raw-data", viz: "expandable list with date ranges", flagged: true, whyFlagged: "List out the most common rabbit holes with date ranges and categories. Browsable." },
  { id: "common-rabbit-hole", section: "Rabbit Holes", title: "Most common rabbit hole topic", stat: "AI? Design?", sub: "Which category do you most often go single-track on? Reveals your default obsession when you go deep.", tag: "needs-raw-data", viz: "stat card", flagged: true, whyFlagged: "What are your most frequent rabbit hole topics?" },

  // ── Search Stories
  { id: "learning-arc", section: "Search Stories", title: "The learning arc", stat: "Design → AI → Building", sub: '"product design portfolio" → "figma" → "figma mcp" → "claude code vs cursor" → "storybook and cursor." From craft to AI to building with AI.', tag: "searches", viz: "timeline / evolution strip" },
  { id: "git-for-dummies", section: "Search Stories", title: '"git for dummies"', stat: "3 searches", sub: "Among thousands of sophisticated AI and design searches, you're also learning version control basics. Self-taught builders don't have a linear skill tree.", tag: "human-moment", viz: "callout card" },
];

// ─── Section descriptions (for sections that need them) ──────────────────────
const sectionDescriptions: Record<string, string> = {
  "Tool Proficiency": "Tools detected from search patterns + watch history. Click into each to see search count, related videos, and when you started using it.",
  "Category Over Time": "Requires raw data processing — not yet in stats.json. Would show how category percentages shift month-over-month.",
  "Rabbit Holes": "A rabbit hole = a day where >90% of videos are one category. How many times did you fall down a single-topic rabbit hole? What were you obsessing over?",
};

// ─── Card component ──────────────────────────────────────────────────────────

const whyStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#BFB8AD",
  lineHeight: 1.5,
  marginTop: 12,
  padding: "10px 12px",
  background: "#1f1c1a",
  borderRadius: 6,
  borderLeft: "2px solid #E95F38",
  fontStyle: "italic",
};

function StoryCard({ card }: { card: StoryCardData }) {
  return (
    <div style={{ ...cardStyle, borderColor: card.flagged ? "#E95F38" : "#2a2725" }}>
      <div style={cardTitle}>{card.title}</div>
      <div style={{ ...statStyle, color: card.accent ?? "#fff" }}>{card.stat}</div>
      <div style={subStyle}>{card.sub}</div>
      <div>
        {card.tag && <span style={tagStyle}>{card.tag}</span>}
        {card.viz && <span style={vizHint}>{card.viz}</span>}
        {card.flagged && <span style={{ ...tagStyle, background: "#3a1c10", color: "#E95F38" }}>flagged</span>}
      </div>
      {card.whyFlagged && (
        <div style={whyStyle}>
          <strong style={{ color: "#E95F38", fontStyle: "normal" }}>Why: </strong>
          {card.whyFlagged}
        </div>
      )}
    </div>
  );
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function renderSections(cards: StoryCardData[]) {
  const sections: string[] = [];
  for (const c of cards) {
    if (!sections.includes(c.section)) sections.push(c.section);
  }

  return (
    <>
      {sections.map((section) => {
        const sectionCards = cards.filter((c) => c.section === section);
        const desc = sectionDescriptions[section];
        return (
          <div key={section} style={sectionStyle}>
            <div style={sectionTitle}>{section}</div>
            {desc && (
              <p style={{ fontSize: 12, color: "#6B6560", marginBottom: 16, maxWidth: 500 }}>
                {desc}
              </p>
            )}
            <div style={gridStyle}>
              {sectionCards.map((card) => (
                <StoryCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function DataStoriesPage({ cards }: { cards: StoryCardData[] }) {
  const isFlagged = cards.every((c) => c.flagged);
  return (
    <div style={pageStyle}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: "#DCD6D0",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        {isFlagged ? "Flagged Data Stories" : "Data Stories"}
      </h1>
      <p style={{ fontSize: 13, color: "#6B6560", marginBottom: 48, maxWidth: 600 }}>
        {isFlagged
          ? "Data stories you've flagged as interesting. These are the shortlisted candidates for the final grid."
          : "Every interesting data point from your YouTube history. Pick and pull from these to build the final grid. Green tags suggest visualization types. Orange borders = flagged."}
      </p>
      {renderSections(cards)}
    </div>
  );
}

// Helper for weekend/weekday avg display
function getDayOfWeekAvgStr(type: "weekend" | "weekday") {
  let sum = 0, count = 0;
  for (const b of stats.dailyBuckets) {
    const dow = new Date(b.date).getDay();
    const isWeekend = dow === 0 || dow === 6;
    if ((type === "weekend" && isWeekend) || (type === "weekday" && !isWeekend)) {
      sum += b.count;
      count++;
    }
  }
  return (sum / count).toFixed(1);
}

// ─── Storybook meta ──────────────────────────────────────────────────────────

// Meta removed — this file only exports components used by FullStory.
// No Storybook stories are registered from this file.

// ─── FlaggedGrid — interactive grid cards ─────────────────────────────────────

// Tick sound (singleton, throttled)
let _fgTickAudio: HTMLAudioElement | null = null;
let _fgLastTick = 0;
const FG_TICK_CD = 80;

function fgPlayTick() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - _fgLastTick < FG_TICK_CD) return;
  _fgLastTick = now;
  if (!_fgTickAudio) {
    _fgTickAudio = new Audio("/sounds/tick.mp3");
    _fgTickAudio.volume = 0.35;
  }
  _fgTickAudio.currentTime = 0;
  _fgTickAudio.play().catch(() => {});
}

// Grid card wrapper — matches FullStory clip-path reveal pattern
function GridCardReal({
  children,
  style,
  delay = 0,
  forceHover = false,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
  /** Force card into hover-elevated state (e.g. when its modal is open) */
  forceHover?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const isElevated = hovered || forceHover;
  const EASE = "cubic-bezier(0.2,0,0,1)";
  const shadowTransition = [
    `border-color 0.12s ${EASE}`,
    `background-color 0.2s ${EASE}`,
    `box-shadow 0.28s ${EASE}`,
  ].join(", ");

  // Separate grid-placement props from visual styles
  const gridProps: React.CSSProperties = {};
  const cardVisual: React.CSSProperties = {};
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (key.startsWith("grid")) {
        (gridProps as Record<string, unknown>)[key] = value;
      } else {
        (cardVisual as Record<string, unknown>)[key] = value;
      }
    }
  }

  return (
    <div
      onMouseEnter={() => { fgPlayTick(); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...gridProps,
        clipPath: isElevated ? "inset(0px round 10px)" : "inset(2px round 10px)",
        transition: `clip-path 0.32s ${EASE}`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut", delay }}
        style={{
          position: "relative",
          height: "100%",
          borderRadius: 10,
          border: `1px solid ${isElevated ? "var(--card-border-hover)" : "var(--card-border-rest)"}`,
          backgroundColor: isElevated ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
          boxShadow: isElevated ? "var(--card-shadow-hover-inner)" : "var(--card-shadow-rest)",
          overflow: "hidden",
          transition: shadowTransition,
          ...cardVisual,
        }}
      >
        <div
          style={{
            height: "100%",
            padding: isElevated ? 0 : 2,
            transition: `padding 0.32s ${EASE}`,
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Derived data for specific cards ──────────────────────────────────────────

const afterMidnightPct = Math.round(stats.nightOwlPercent);

const peakHourBucket = stats.hourBuckets.reduce((a, b) => (a.count > b.count ? a : b));
const peakHourLabel = peakHourBucket.hour === 0 ? "12 AM"
  : peakHourBucket.hour < 12 ? `${peakHourBucket.hour} AM`
  : peakHourBucket.hour === 12 ? "12 PM"
  : `${peakHourBucket.hour - 12} PM`;

const peakMonthName = new Date(peakMonth.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });

// Daily buckets for peak month sparkline
const peakMonthDays = stats.dailyBuckets.filter((d) => d.date.startsWith(peakMonth.month));
const peakMonthMax = Math.max(...peakMonthDays.map((d) => d.count), 1);

// Category percentages for radar chart
const catAI = stats.aiPercent;
const catEng = stats.engineeringPercent;
const catDesign = stats.designPercent;
const catStartup = stats.startupPercent;

// Tool loyalty numbers
const claudeCursorCount = 108;
const openAIChatGPTCount = 15;

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, color = "var(--color-orange)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100, H = 100;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H * 0.85) - H * 0.075;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaBot = H - H * 0.075;
  const area = `M ${pts[0]} L ${pts.join(" L ")} L ${(data.length - 1) / (data.length - 1) * W},${areaBot} L 0,${areaBot} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <path d={area} fill={color} opacity={0.08} />
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── ToolLoyaltyCard ─────────────────────────────────────────────────────────

const MODAL_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const MODAL_EXIT   = { type: "spring" as const, stiffness: 600, damping: 35 };

// Shared modal chrome — single source of truth for all modal headers.
// fontFamily is set inline (no class) so story-level font overrides can't reach it.
const MODAL_TITLE_STYLE: React.CSSProperties = {
  fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase",
  fontFamily: "'Geist Mono', ui-monospace, monospace",
};
const MODAL_CLOSE_BTN_STYLE: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-faint)", fontSize: 16, lineHeight: 1,
  padding: "4px 6px", borderRadius: 4, outline: "none",
};

// ─── Icon registry ────────────────────────────────────────────────────────────
type IconHandle = { startAnimation: () => void; stopAnimation: () => void };
type IconKey = "coffee" | "moon" | "sun" | "heart" | "flame" | "zap" | "sparkles" | "rocket" | "brain" | "graduation-cap" | "book-text" | "cooking-pot" | "party-popper" | "home" | "map-pin" | "compass" | "telescope" | "message-circle" | "smile" | "laugh" | "hand-heart" | "waves" | "snowflake" | "rocking-chair" | "cctv" | "frame" | "hand-metal";

const ICON_COMPONENTS: Record<IconKey, React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & { size?: number } & React.RefAttributes<IconHandle>>> = {
  "coffee":         CoffeeIcon,
  "moon":           MoonIcon,
  "sun":            SunIcon,
  "heart":          HeartIcon,
  "flame":          FlameIcon,
  "zap":            ZapIcon,
  "sparkles":       SparklesIcon,
  "rocket":         RocketIcon,
  "brain":          BrainIcon,
  "graduation-cap": GraduationCapIcon,
  "book-text":      BookTextIcon,
  "cooking-pot":    CookingPotIcon,
  "party-popper":   PartyPopperIcon,
  "home":           HomeIcon,
  "map-pin":        MapPinIcon,
  "compass":        CompassIcon,
  "telescope":      TelescopeIcon,
  "message-circle": MessageCircleIcon,
  "smile":          SmileIcon,
  "laugh":          LaughIcon,
  "hand-heart":     HandHeartIcon,
  "waves":          WavesIcon,
  "snowflake":      SnowflakeIcon,
  "rocking-chair":  RockingChairIcon,
  "cctv":           CctvIcon,
  "frame":          FrameIcon,
  "hand-metal":     HandMetalIcon,
};

const ALL_ICON_KEYS = Object.keys(ICON_COMPONENTS) as IconKey[];

const REST_DAY_ACTIVITIES: { label: string; icon: IconKey; isPlaceholder?: boolean }[] = [
  { label: "Photography",   icon: "frame"          },
  { label: "Eating Pizza",  icon: "hand-metal"     },
  { label: "Texting Mom",   icon: "message-circle" },
  { label: "Going Outside", icon: "map-pin"        },
  { label: "Doing Nothing", icon: "coffee"         },
];

// Shared bar chart — used by both the card face and the modal
function RestDayBarChart({ barHeight, barWidth }: { barHeight: number; barWidth: number }) {
  const dowMax = Math.max(...dowAvg.map((d) => parseFloat(d.avg)));
  const dowLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const dowReordered = [dowAvg[1], dowAvg[2], dowAvg[3], dowAvg[4], dowAvg[5], dowAvg[6], dowAvg[0]];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
      {dowReordered.map((d, i) => {
        const val = parseFloat(d.avg);
        const h = Math.max(4, (val / dowMax) * barHeight);
        const isQuietest = d.name === quietDay.name;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: barWidth, height: h, borderRadius: 4, backgroundColor: isQuietest ? "var(--color-orange)" : "var(--overlay-strong)", opacity: isQuietest ? 1 : 0.72 }} />
            <span className="font-mono select-none" style={{ fontSize: 9, color: isQuietest ? "var(--color-orange)" : "var(--text-faint)" }}>
              {dowLabels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Card — only renders the face, calls onOpen on click
function RestDayCard({ delay, onOpen }: { delay: number; onOpen: () => void }) {
  return (
    <GridCardReal delay={delay} style={{ gridColumn: "4", gridRow: "1" }}>
      <div
        style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}
        onClick={onOpen}
      >
        <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Your rest day
        </span>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <RestDayBarChart barHeight={88} barWidth={22} />
        </div>
      </div>
    </GridCardReal>
  );
}

// Modal — rendered as a sibling to the grid so clipPath on GridCardReal can't clip it
function RestDayModal({ onClose }: { onClose: () => void }) {
  const [activities, setActivities] = React.useState([...REST_DAY_ACTIVITIES]);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [pickerIndex, setPickerIndex] = React.useState<number | null>(null);
  const iconRefs = React.useRef<(IconHandle | null)[]>([]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />

      {/* Centering wrapper */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97,
            transition: { scale: MODAL_EXIT, y: MODAL_EXIT, opacity: { duration: 0.14, ease: "easeIn" } },
          }}
          transition={{ opacity: { duration: 0.18, ease: "easeOut" }, scale: MODAL_SPRING, y: MODAL_SPRING }}
          style={{ pointerEvents: "all" }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); setPickerIndex(null); }}
            style={{ backgroundColor: "var(--modal-bg)", borderRadius: 16, border: "1px solid var(--overlay-strong)", boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)", width: 420, maxWidth: "90vw" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Your rest day — {quietDay.name}
              </span>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: 18, lineHeight: 1, padding: "4px 6px", borderRadius: 4, transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)"; }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px 24px 0" }}>
              <RestDayBarChart barHeight={140} barWidth={40} />
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "20px 0 16px" }} />
              <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Friday activities
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {activities.map((activity, i) => {
                  const isEditing = editingIndex === i;
                  const isHovered = hoveredIndex === i;
                  const isPickerOpen = pickerIndex === i;
                  const IconComp = ICON_COMPONENTS[activity.icon];
                  const rowPlaceholder = ["Pondering...", "Coming soon...", "Still deciding...", "Ask me later..."][i % 4];
                  const commitEdit = () => {
                    if (activity.label.trim() === "") {
                      const next = [...activities];
                      next[i] = { ...next[i], label: rowPlaceholder, isPlaceholder: true };
                      setActivities(next);
                    }
                    setEditingIndex(null);
                  };
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                      style={{ position: "relative" }}
                    >
                      <div
                        onMouseEnter={() => { setHoveredIndex(i); iconRefs.current[i]?.startAnimation(); }}
                        onMouseLeave={() => { setHoveredIndex(null); iconRefs.current[i]?.stopAnimation(); }}
                        onDoubleClick={() => setEditingIndex(i)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: 10, cursor: "default",
                          border: `1px solid ${isEditing || isHovered ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
                          backgroundColor: isHovered || isEditing ? "var(--overlay-medium)" : "var(--overlay-subtle)",
                          transition: "background-color 0.15s, border-color 0.15s",
                        }}
                      >
                        {/* Animated icon — click opens picker */}
                        <IconComp
                          ref={(el) => { iconRefs.current[i] = el; }}
                          size={16}
                          onClick={() => setPickerIndex(isPickerOpen ? null : i)}
                          style={{ color: "var(--color-orange)", cursor: "pointer", flexShrink: 0, opacity: isHovered ? 1 : 0.72, transition: "opacity 0.15s" }}
                        />

                        {/* Text — static or editable */}
                        {isEditing ? (
                          <input
                            autoFocus
                            value={activity.label}
                            placeholder={rowPlaceholder}
                            onChange={(e) => {
                              const next = [...activities];
                              next[i] = { label: e.target.value, icon: "sparkles", isPlaceholder: false };
                              setActivities(next);
                            }}
                            onBlur={commitEdit}
                            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); }}
                            style={{
                              flex: 1, background: "none", border: "none", outline: "none",
                              fontSize: 13, color: "var(--color-gray12)", letterSpacing: "-0.01em",
                              fontFamily: "var(--font-mono, 'PP Neue Montreal', monospace)",
                            }}
                          />
                        ) : (
                          <span className="font-mono" style={{ flex: 1, fontSize: 13, letterSpacing: "-0.01em", transition: "color 0.15s ease, opacity 0.15s", color: activity.isPlaceholder ? "var(--text-faint, #555)" : (isHovered ? "var(--color-gray11)" : "var(--text-secondary)"), opacity: activity.isPlaceholder ? (isHovered ? 0.6 : 0.38) : 1 }}>
                            {activity.label}
                          </span>
                        )}

                        {/* Pencil — visible on hover */}
                        <button
                          onClick={() => setEditingIndex(i)}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: "2px",
                            color: "var(--text-faint)", lineHeight: 1, flexShrink: 0,
                            opacity: isHovered || isEditing ? 1 : 0, transition: "opacity 0.15s",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Icon picker popover */}
                      <AnimatePresence>
                        {isPickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{
                              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
                              backgroundColor: "var(--modal-bg)",
                              border: "1px solid var(--overlay-strong)",
                              borderRadius: 12,
                              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                              padding: 12,
                              display: "grid",
                              gridTemplateColumns: "repeat(6, 32px)",
                              gap: 4,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ALL_ICON_KEYS.map((key) => {
                              const PickerIcon = ICON_COMPONENTS[key];
                              const isSelected = activity.icon === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => {
                                    const next = [...activities];
                                    next[i] = { ...next[i], icon: key };
                                    setActivities(next);
                                    setPickerIndex(null);
                                  }}
                                  style={{
                                    background: isSelected ? "var(--overlay-strong)" : "none",
                                    border: "none", borderRadius: 6, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: 32, height: 32, padding: 0,
                                    color: isSelected ? "var(--color-orange)" : "var(--text-faint)",
                                    transition: "background 0.1s, color 0.1s",
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--overlay-medium)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isSelected ? "var(--overlay-strong)" : "none"; }}
                                >
                                  <PickerIcon size={16} />
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function ToolLoyaltyCard({ delay, onOpen }: { delay: number; onOpen: () => void }) {
  const heroTool = toolLoyaltyTimeline[0];

  return (
    <GridCardReal delay={delay} style={{ gridColumn: "3", gridRow: "2" }}>
      <div
        style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}
        onClick={onOpen}
      >
        <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Tool loyalty
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          <div>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Early
            </span>
            <div style={{ marginTop: 5, height: 3, backgroundColor: "var(--overlay-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(heroTool.earlyN / toolLoyaltyMax) * 100}%`, backgroundColor: "var(--overlay-strong)", borderRadius: 2 }} />
            </div>
          </div>
          <div>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Now
            </span>
            <div style={{ marginTop: 5, height: 3, backgroundColor: "var(--overlay-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(heroTool.recentN / toolLoyaltyMax) * 100}%`, backgroundColor: "var(--color-orange)", borderRadius: 2 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="font-mono select-none" style={{ fontSize: 14, color: "var(--color-gray12)", letterSpacing: "-0.02em" }}>
            {heroTool.tool}
          </span>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            {heroTool.earlyN} → {heroTool.recentN}
          </span>
        </div>
      </div>
    </GridCardReal>
  );
}

export function ToolLoyaltyModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = React.useState("Cursor");
  const EASE = "cubic-bezier(0.2,0,0,1)";
  const current = toolLoyaltyTimeline.find((t) => t.tool === selected)!;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />

      {/* Centering wrapper */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={MODAL_SPRING}
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: "auto", background: "#1a1714", border: "1px solid var(--card-border-rest)", borderRadius: 14, padding: "28px 32px", width: 460, maxWidth: "90vw" }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Tool loyalty
            </span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>
              ×
            </button>
          </div>

          {/* Tool tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
            {toolLoyaltyTimeline.map((t) => (
              <button
                key={t.tool}
                onClick={() => setSelected(t.tool)}
                className="font-mono"
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: "0.04em",
                  border: `1px solid ${selected === t.tool ? "var(--color-orange)" : "var(--card-border-rest)"}`,
                  background: selected === t.tool ? "rgba(233,95,56,0.08)" : "transparent",
                  color: selected === t.tool ? "var(--color-orange)" : "var(--text-faint)",
                  transition: `all 0.12s ${EASE}`,
                }}
              >
                {t.tool}
              </button>
            ))}
          </div>

          {/* Before / After bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Early period</span>
                <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{current.earlyN} searches</span>
              </div>
              <div style={{ height: 6, backgroundColor: "var(--overlay-subtle)", borderRadius: 3, overflow: "hidden" }}>
                <motion.div
                  key={`early-${selected}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(current.earlyN / toolLoyaltyMax) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ height: "100%", backgroundColor: "var(--overlay-strong)", borderRadius: 3 }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent period</span>
                <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-orange)", fontVariantNumeric: "tabular-nums" }}>{current.recentN} searches</span>
              </div>
              <div style={{ height: 6, backgroundColor: "var(--overlay-subtle)", borderRadius: 3, overflow: "hidden" }}>
                <motion.div
                  key={`recent-${selected}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(current.recentN / toolLoyaltyMax) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ height: "100%", backgroundColor: "var(--color-orange)", borderRadius: 3 }}
                />
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--overlay-medium)", paddingTop: 16 }}>
              <span className="font-mono select-none" style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.6 }}>
                {current.note}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── RabbitHoles ─────────────────────────────────────────────────────────────

const RH_TABS = ["All", "AI", "Design", "Engineering", "Startup"] as const;
type RhTab = (typeof RH_TABS)[number];
const RH_CAT_KEY: Record<RhTab, string | null> = {
  All:         null,
  AI:          "ai",
  Design:      "design",
  Engineering: "engineering",
  Startup:     "startup",
};

function fmtRhDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function RabbitHolesCard({ delay, onOpen }: { delay: number; onOpen: () => void }) {
  return (
    <GridCardReal delay={delay} style={{ gridColumn: "4", gridRow: "2" }}>
      <div
        style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}
        onClick={onOpen}
      >
        <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Rabbit holes
        </span>
        <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {rabbitHoles.length}
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5, overflow: "hidden" }}>
          {rhPeriods.slice(0, 3).map((p, i) => (
            <span key={i} className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {p.days}d · {catLabels[p.category]} · {fmtRhDate(p.startDate)}
            </span>
          ))}
        </div>
        <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
          Mostly {catLabels[topRabbitCat]}
        </span>
      </div>
    </GridCardReal>
  );
}

function RabbitHolesModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = React.useState<RhTab>("All");
  const EASE = "cubic-bezier(0.2,0,0,1)";

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const catKey = RH_CAT_KEY[tab];
  const filtered = catKey ? rhPeriods.filter((p) => p.category === catKey) : rhPeriods;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />

      {/* Centering wrapper */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={MODAL_SPRING}
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: "auto", background: "#1a1714", border: "1px solid var(--card-border-rest)", borderRadius: 14, padding: "28px 32px", width: 460, maxWidth: "90vw" }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Rabbit holes · {rabbitHoles.length} days total
            </span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>
              ×
            </button>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {RH_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="font-mono"
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: "0.04em",
                  border: `1px solid ${tab === t ? "var(--color-orange)" : "var(--card-border-rest)"}`,
                  background: tab === t ? "rgba(233,95,56,0.08)" : "transparent",
                  color: tab === t ? "var(--color-orange)" : "var(--text-faint)",
                  transition: `all 0.12s ${EASE}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Period list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 340, overflowY: "auto" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                {filtered.length === 0 ? (
                  <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", padding: "16px 0" }}>
                    No obsession periods for this category.
                  </span>
                ) : (
                  filtered.map((p, i) => {
                    const start = fmtRhDate(p.startDate);
                    const end   = fmtRhDate(p.endDate);
                    const sameMonth = start === end;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex", alignItems: "baseline", justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: i < filtered.length - 1 ? "1px solid var(--overlay-subtle)" : "none",
                        }}
                      >
                        <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-gray11)", fontVariantNumeric: "tabular-nums" }}>
                          {sameMonth ? start : `${start} → ${end}`}
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {catLabels[p.category]}
                          </span>
                          <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-orange)", fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" }}>
                            {p.days}d
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer summary */}
          <div style={{ borderTop: "1px solid var(--overlay-medium)", paddingTop: 16, marginTop: 16 }}>
            <span className="font-mono select-none" style={{ fontSize: 10, color: "var(--text-faint)", lineHeight: 1.6 }}>
              {filtered.length} obsession period{filtered.length !== 1 ? "s" : ""}
              {catKey ? ` in ${catLabels[catKey]}` : ""}.
              {" "}A rabbit hole = a day where ≥85% of videos are one category.
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Pop-click sound — same singleton pattern as builder-energy.tsx ────────────
let _streakPopAudio: HTMLAudioElement | null = null;
function playStreakPop() {
  if (typeof window === "undefined") return;
  if (!_streakPopAudio) {
    _streakPopAudio = new Audio("/sounds/pop-click.wav");
    _streakPopAudio.volume = 0.45;
  }
  _streakPopAudio.currentTime = 0;
  _streakPopAudio.play().catch(() => {});
}

// ─── StreakPill ───────────────────────────────────────────────────────────────

function StreakPill({ count }: { count: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const [hovered, setHovered]   = React.useState(false);

  return (
    <motion.div
      layout
      animate={{
        backgroundColor: hovered ? "var(--overlay-medium)" : "var(--overlay-subtle)",
        borderColor:     hovered ? "var(--overlay-strong)"  : "var(--overlay-medium)",
      }}
      transition={{
        layout:          { type: "spring", stiffness: 300, damping: 30 },
        backgroundColor: { duration: 0.2, ease: "easeInOut" },
        borderColor:     { duration: 0.2, ease: "easeInOut" },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
        height: 26, borderRadius: 999, padding: 3, gap: 2,
        border: "1px solid", cursor: "pointer",
      }}
    >
      {/* "79 days" — slides in when expanded, same enter/exit as builder-energy score */}
      <AnimatePresence mode="popLayout">
        {expanded && (
          <motion.span
            key="expanded"
            initial={{ opacity: 0, filter: "blur(2px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(2px)", y: -12 }}
            transition={{ duration: 0.35, ease: [0.23, 0.88, 0.26, 0.92] }}
            className="font-mono select-none"
            style={{ fontSize: 11, color: "var(--color-gray11)", letterSpacing: "0.04em", padding: "0 5px 0 4px", lineHeight: 1, display: "flex", alignItems: "center", height: 20, fontVariantNumeric: "tabular-nums" }}
          >
            {count} days
          </motion.span>
        )}
      </AnimatePresence>

      {/* # button — always visible, plays sound + toggles on click */}
      <button
        onClick={(e) => { e.stopPropagation(); playStreakPop(); setExpanded((v) => !v); }}
        className="font-mono select-none"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 20, minWidth: 20, padding: "0 5px",
          borderRadius: 999, border: "1px solid var(--overlay-medium)",
          backgroundColor: "var(--overlay-medium)", color: "var(--color-gray12)",
          cursor: "pointer", fontSize: 11, lineHeight: 1,
        }}
      >
        #
      </button>
    </motion.div>
  );
}

// ─── #1 Channel — special brands + top picks modal ────────────────────────────

export type SpecialTopChannelKind = "dive" | "howiai";

/** When #1 channel matches, we show branded treatment + clickable picks modal */
export function getSpecialTopChannelKind(channelName: string): SpecialTopChannelKind | null {
  const n = channelName.toLowerCase();
  if (n.includes("how i ai")) return "howiai";
  if (n.includes("dive club")) return "dive";
  return null;
}

type RawWatchForPicks = {
  videoId: string;
  title: string;
  channelName: string;
  videoUrl: string;
  channelUrl?: string;
};

function decodeWatchTitleHtml(t: string) {
  return t
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function watchChannelMatchesTarget(watchChannel: string, target: string) {
  const a = watchChannel.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

/** Most-watched distinct videos on this channel (from raw history) */
export function getTopVideosForChannel(channelName: string, limit = 5): { title: string; url: string; watches: number }[] {
  const map = new Map<string, { title: string; url: string; watches: number }>();
  for (const v of rawWatchHistory as RawWatchForPicks[]) {
    if (!watchChannelMatchesTarget(v.channelName, channelName)) continue;
    const title = decodeWatchTitleHtml(v.title);
    const prev = map.get(v.videoId);
    if (prev) prev.watches += 1;
    else map.set(v.videoId, { title, url: v.videoUrl, watches: 1 });
  }
  return [...map.values()].sort((x, y) => y.watches - x.watches).slice(0, limit);
}

/** First channel page URL from takeout for this channel name (for subscribe / open channel). */
export function getChannelUrlForChannel(channelName: string): string | null {
  for (const v of rawWatchHistory as RawWatchForPicks[]) {
    if (!watchChannelMatchesTarget(v.channelName, channelName)) continue;
    if (v.channelUrl) return v.channelUrl;
  }
  return null;
}

/** Hero clip for picks modal — file lives in `public/media/` (see `public/media/README.md`). */
export const TOP_CHANNEL_MODAL_HERO_VIDEO = "/media/top-channel-modal-hero.mp4";
const MODAL_HERO_TRIM_LEAD_SEC = 5;
const MODAL_HERO_TRIM_TAIL_SEC = 3;

/**
 * Plays only [lead .. duration−tail]; loops that segment (browser trim, not re-encoded).
 * Muted + playsInline so autoplay is allowed in most browsers.
 */
function ModalHeroVideo({ src, onFailed }: { src: string; onFailed?: () => void }) {
  const ref = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const lead = MODAL_HERO_TRIM_LEAD_SEC;
    const tail = MODAL_HERO_TRIM_TAIL_SEC;

    const clampToWindow = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= lead + tail + 0.08) {
        v.currentTime = 0;
        return;
      }
      if (v.currentTime < lead || v.currentTime > d - tail - 0.02) {
        v.currentTime = lead;
      }
    };

    const onLoadedMeta = () => {
      clampToWindow();
      void v.play().catch(() => {});
    };

    const onTimeUpdate = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= lead + tail + 0.08) return;
      const end = d - tail;
      if (v.currentTime >= end - 0.06) {
        v.currentTime = lead;
      }
    };

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [src]);

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#0a0a0a",
      }}
    >
      <video
        ref={ref}
        src={src}
        muted
        playsInline
        autoPlay
        preload="metadata"
        aria-label="Channel highlight"
        onError={() => onFailed?.()}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          transform: "scale(1.04)",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}

export function TopChannelPicksModal({
  onClose,
  channelName,
  channelUrl,
  picks,
  heroSrc = TOP_CHANNEL_MODAL_HERO_VIDEO,
}: {
  onClose: () => void;
  channelName: string;
  channelUrl: string | null;
  picks: { title: string; url: string }[];
  /** Pass null to skip the video hero entirely (generic / no-video variant). */
  heroSrc?: string | null;
}) {
  const [heroVideoFailed, setHeroVideoFailed] = React.useState(false);
  const [pickRowHoveredUrl, setPickRowHoveredUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={MODAL_SPRING}
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: "auto" }}
        >
        <ElevatedSection style={{
            backgroundColor: "var(--modal-bg)",
            border: "1px solid var(--overlay-strong)",
            borderRadius: 16,
            boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)",
            padding: 0,
            width: 520,
            maxWidth: "90vw",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Modal title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0", flexShrink: 0 }}>
            <span className="select-none" style={MODAL_TITLE_STYLE}>Top Channel</span>
            <button onClick={onClose} style={MODAL_CLOSE_BTN_STYLE}>×</button>
          </div>

          {/* Hero — fixed at top, does not scroll */}
          <div style={{ padding: "16px 24px 0", flexShrink: 0 }}>
            {heroSrc !== null ? (
              // heroSrc provided — show video or a placeholder if the file hasn't landed yet
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    border: heroVideoFailed
                      ? "1px dashed rgba(255,255,255,0.14)"
                      : "1px solid rgba(255,255,255,0.18)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    backgroundColor: "#0d0c0b",
                  }}
                >
                  {!heroVideoFailed ? (
                    <ModalHeroVideo src={heroSrc} onFailed={() => setHeroVideoFailed(true)} />
                  ) : (
                    // Placeholder — same 16/9 footprint, waiting for the real video
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        className="font-mono select-none"
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.20)",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Video coming soon
                      </span>
                    </div>
                  )}
                </div>
                {/* Gradient overlay — only needed when real video is showing */}
                {!heroVideoFailed && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 10,
                      pointerEvents: "none",
                      background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 42%)",
                    }}
                  />
                )}
                <span
                  className="font-mono select-none"
                  style={{
                    position: "absolute",
                    left: 14,
                    bottom: 10,
                    right: 44,
                    fontSize: 11,
                    // dim the channel name when using the placeholder (no video gradient behind it)
                    color: heroVideoFailed ? "rgba(245,245,244,0.45)" : "rgba(245,245,244,0.94)",
                    letterSpacing: "-0.02em",
                    textTransform: "none",
                    textShadow: heroVideoFailed ? "none" : "0 1px 8px rgba(0,0,0,0.8)",
                  }}
                >
                  {channelName}
                </span>
              </div>
            ) : (
              // heroSrc is null — generic variant: no hero, just the title row
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 4 }}>
                <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: "-0.02em" }}>
                  {channelName}
                </span>
                <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Scrollable content — picks list overflows here */}
          <div style={{ padding: "16px 24px 24px", overflowY: "auto", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <ChannelSubscribeMorphPill initialSubscribed ringOnMount />
              {channelUrl ? <ChannelYoutubeLinkChip href={channelUrl} /> : null}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "20px 0 16px" }} />
            <span className="select-none" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              A few picks worth opening again
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {picks.map((p, idx) => {
                const isHov = pickRowHoveredUrl === p.url;
                const rankColor = isHov ? "var(--text-secondary)" : "var(--text-faint)";
                const titleColor = isHov ? "var(--text-primary)" : "var(--text-secondary)";
                const rowBorder = isHov ? "var(--overlay-strong)" : "var(--overlay-medium)";
                const rowBg = isHov
                  ? "color-mix(in srgb, var(--overlay-medium) 42%, var(--overlay-subtle))"
                  : "var(--overlay-subtle)";
                return (
                  <motion.button
                    key={p.url}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                    onClick={() => {
                      window.open(p.url, "_blank", "noopener,noreferrer");
                    }}
                    onPointerEnter={() => setPickRowHoveredUrl(p.url)}
                    onPointerLeave={() => setPickRowHoveredUrl(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      border: `1px solid ${rowBorder}`,
                      backgroundColor: rowBg,
                      transition: "background-color 0.2s ease, border-color 0.2s ease",
                      outline: "none",
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: rankColor,
                        transition: "color 0.15s ease",
                      }}
                    >
                      <VideoIcon size={18} style={{ flexShrink: 0 }} />
                    </div>
                    <span className="font-mono" style={{ flex: 1, minWidth: 0, fontSize: 13, letterSpacing: "-0.01em", color: titleColor, transition: "color 0.15s ease", lineHeight: 1.35 }}>
                      {p.title}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            {picks.length === 0 && (
              <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                Upload your YouTube Takeout data to see your most-watched videos.
              </span>
            )}
          </div>
        </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// ─── Late Night Learning Modal ────────────────────────────────────────────────

export const LATE_NIGHT_PERSONAS = [
  { id: "male",   avatarSrc: "/avatars/character1.png", videoSrc: "/character.mp4", easterEgg: false },
  { id: "female", avatarSrc: "/avatars/character2.png", videoSrc: "/vid2.mp4",      easterEgg: false },
  { id: "wild",   avatarSrc: "/avatars/character3.png", videoSrc: "/vid3.mp4",      easterEgg: true  },
];

// All three personas shown — Avatar 3 is the Easter egg bonus
const VISIBLE_PERSONAS = LATE_NIGHT_PERSONAS;

export function LateNightLearningModal({
  onClose,
  activePersona,
  onPersonaChange,
}: {
  onClose: () => void;
  activePersona: number;
  onPersonaChange: (idx: number) => void;
}) {
  const isDark = useIsDark();
  const [heroVideoFailed, setHeroVideoFailed] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePersonaChange = (idx: number) => {
    onPersonaChange(idx);
    // reset failed state so the new persona's video gets a fresh attempt
    setHeroVideoFailed(false);
  };

  const persona = LATE_NIGHT_PERSONAS[activePersona];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={MODAL_SPRING}
          style={{ pointerEvents: "auto" }}
        >
        <ElevatedSection style={{
            backgroundColor: "var(--modal-bg)",
            border: "1px solid var(--overlay-strong)",
            borderRadius: 16,
            boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)",
            padding: 0,
            width: 520,
            maxWidth: "90vw",
            maxHeight: "85vh",
            overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
            <span className="select-none" style={MODAL_TITLE_STYLE}>Late Night Learning</span>
            <button onClick={onClose} style={MODAL_CLOSE_BTN_STYLE}>×</button>
          </div>

          {/* Hero video — padded frame (top / left / right) */}
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: heroVideoFailed
                    ? "1px dashed rgba(255,255,255,0.14)"
                    : "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  backgroundColor: "#0d0c0b",
                }}
              >
                {!heroVideoFailed ? (
                  // key forces remount (and re-autoplay) when persona switches
                  <ModalHeroVideo key={activePersona} src={persona.videoSrc} onFailed={() => setHeroVideoFailed(true)} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="font-mono select-none" style={{ fontSize: 9, color: "rgba(255,255,255,0.20)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      Video coming soon
                    </span>
                  </div>
                )}
              </div>
              {!heroVideoFailed && (
                <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 10, pointerEvents: "none", background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 42%)" }} />
              )}
            </div>
          </div>

          {/* Persona switcher — aligned with video's 24px horizontal padding */}
          <div style={{ padding: "16px 24px 24px" }}>
            <span className="select-none" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 14 }}>
              Pick your avatar
            </span>
            <div style={{ display: "flex", gap: 16 }}>
              {VISIBLE_PERSONAS.map((p, idx) => {
                const isActive = idx === activePersona;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePersonaChange(idx)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none" }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        overflow: "hidden",
                        // ring: active = crisp border (white on dark, dark on light), inactive = barely-there
                        border: isActive
                          ? isDark ? "2px solid rgba(255,255,255,0.9)" : "2px solid rgba(0,0,0,0.30)"
                          : isDark ? "2px solid rgba(255,255,255,0.12)" : "2px solid rgba(0,0,0,0.08)",
                        // active shadow: heavy on dark, restrained on light
                        boxShadow: isActive
                          ? isDark
                            ? "0 0 0 3px rgba(255,255,255,0.14), 0 8px 20px rgba(0,0,0,0.55)"
                            : "0 0 0 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.12)"
                          : "none",
                        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                      }}
                    >
                      <img src={p.avatarSrc} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    <span
                      className="select-none"
                      className="font-mono"
                      style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: isActive ? "var(--text-secondary)" : "var(--text-faint)", transition: "color 0.18s ease" }}
                    >
                      Avatar
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

/** Faint surface-only gradient for special brands (no nested card). */
export function TopChannelCardInner({
  name,
  count,
  kind,
  interactive,
  onOpen,
}: {
  name: string;
  count: number;
  kind: SpecialTopChannelKind | null;
  interactive: boolean;
  onOpen?: () => void;
}) {
  const faintSurface: React.CSSProperties | undefined =
    kind === "dive"
      ? {
          background: `
            radial-gradient(ellipse 110% 95% at 50% 38%, rgba(55, 130, 125, 0.09) 0%, transparent 58%),
            linear-gradient(168deg, rgba(255,255,255,0.04) 0%, transparent 48%)
          `,
        }
        : undefined;

  // Icon collage for How I AI — hodgepodge stack to the right of the copy
  const HowIAIIcons = kind === "howiai" ? (
    <div style={{
      position: "absolute",
      right: 26,
      top: "50%",
      transform: "translateY(-50%)",
      width: 88,
      height: 100,
      pointerEvents: "none",
    }}>

      {/* ── Waveform mini-card — bottom-left, rotated back, peeks behind AI box ── */}
      <div style={{
        position: "absolute",
        bottom: 2,
        left: 0,
        transform: "rotate(-8deg)",
        display: "flex",
        alignItems: "flex-end",
        gap: 2.5,
        padding: "5px 7px",
        background: "rgba(109,40,217,0.30)",
        border: "1px solid rgba(196,181,253,0.25)",
        borderRadius: 4,
      }}>
        {/* bar heights mirror her cover audio waveform */}
        {[5, 11, 15, 8, 12].map((h, i) => (
          <div key={i} style={{
            width: 3,
            height: h,
            borderRadius: 1.5,
            background: "#C4B5FD",
            opacity: 0.85,
          }} />
        ))}
      </div>

      {/* ── </> mini-card — bottom-right, rotated forward, peeks behind AI box ── */}
      <div style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 38,
        height: 28,
        background: "rgba(109,40,217,0.30)",
        border: "1px solid rgba(196,181,253,0.25)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(9deg)",
      }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#C4B5FD", letterSpacing: "-0.5px" }}>&lt;/&gt;</span>
      </div>

      {/* ── AI selection box — front/center, slight tilt, bigger ── */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 4,
        width: 74,
        height: 56,
        background: "white",
        border: "1.5px solid #1a1a1a",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(-3deg)",
      }}>
        {/* "AI" — bold serif, dark */}
        <span style={{
          fontFamily: "Georgia, serif",
          fontSize: 26,
          fontWeight: 800,
          color: "#111",
          letterSpacing: "-0.02em",
          userSelect: "none",
          lineHeight: 1,
        }}>AI</span>

        {/* Corner handle circles — the 4 Figma selection anchors */}
        {([
          { top: -3.5, left: -3.5 },
          { top: -3.5, right: -3.5 },
          { bottom: -3.5, left: -3.5 },
          { bottom: -3.5, right: -3.5 },
        ] as React.CSSProperties[]).map((pos, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "white",
            border: "1.5px solid #1a1a1a",
            ...pos,
          }} />
        ))}

        {/* Yellow oval — wraps around "AI", tilted like the cover */}
        <svg
          width="74" height="56"
          viewBox="0 0 74 56"
          fill="none"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <ellipse
            cx="37" cy="28" rx="22" ry="16"
            stroke="#F59E0B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            transform="rotate(-6 37 28)"
          />
        </svg>
      </div>

    </div>
  ) : null;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } } : undefined}
      style={{
        height: "100%",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        cursor: interactive ? "pointer" : "default",
        position: "relative",
        zIndex: 1,
        ...faintSurface,
      }}
    >
      {HowIAIIcons}
      <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
        #1 Channel
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span className="font-mono select-none" style={{ fontSize: 22, color: "var(--color-gray12)", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {name}
        </span>
      </div>
      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontVariantNumeric: "tabular-nums", marginTop: 0 }}>
        {count} watches
      </span>
    </div>
  );
}

// ─── FlaggedGridView ──────────────────────────────────────────────────────────

function FlaggedGridView() {
  const [restDayOpen, setRestDayOpen] = React.useState(false);
  const [toolLoyaltyOpen, setToolLoyaltyOpen] = React.useState(false);
  const [rabbitHolesOpen, setRabbitHolesOpen] = React.useState(false);
  const [topChannelPicksOpen, setTopChannelPicksOpen] = React.useState(false);
  const [subscriptionsOpen, setSubscriptionsOpen] = React.useState(false);
  const [growthTickerModalOpen, setGrowthTickerModalOpen] = React.useState(false);

  const topChannel = stats.topChannels[0];
  const topChannelSpecialKind = React.useMemo(
    () => getSpecialTopChannelKind(topChannel.name),
    [topChannel.name],
  );
  const topChannelPicks = React.useMemo(
    () => getTopVideosForChannel(topChannel.name, 5),
    [topChannel.name],
  );
  const topChannelPicksForModal = React.useMemo(
    () => topChannelPicks.map(({ title, url }) => ({ title, url })),
    [topChannelPicks],
  );
  const topChannelUrl = React.useMemo(
    () => getChannelUrlForChannel(topChannel.name),
    [topChannel.name],
  );
  const topChannelInteractive = topChannelSpecialKind !== null;

  // Peak month calendar
  const peakMonthDate = new Date(peakMonth.month + "-01");
  const peakMonthLabel = peakMonthDate.toLocaleDateString("en-US", { month: "short" });
  const peakMonthFull  = peakMonthDate.toLocaleDateString("en-US", { month: "long" });
  const firstDow = peakMonthDate.getDay();
  const daysInMonth = new Date(peakMonthDate.getFullYear(), peakMonthDate.getMonth() + 1, 0).getDate();
  const calendarCells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  const peakDayMap = new Map(peakMonthDays.map((b) => [parseInt(b.date.slice(8), 10), b.count]));
  const peakDayMax = Math.max(...peakMonthDays.map((b) => b.count), 1);

  // Domain data for breakdown row (same pattern as FullStory)
  const domainData = [
    { id: "ai",          label: "AI & Machine Learning", pct: catAI, color: "#818cf8" },
    { id: "engineering", label: "Engineering & Dev",     pct: catEng, color: "#34d399" },
    { id: "design",      label: "Design & Creative",     pct: catDesign, color: "#f472b6" },
    { id: "startup",     label: "Startups & Business",   pct: catStartup, color: "#fbbf24" },
  ];

  return (
    <>
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        minHeight: "100vh",
        padding: "40px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "200px",
        gap: 12,
      }}
    >
      {/* ── Row 1 — stat cards ─────────────────────────────────────────────── */}

      <GridCardReal delay={0} style={{ gridColumn: "1", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            After midnight
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {afterMidnightPct}%
            </span>
          </div>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            12AM – 5AM
          </span>
        </div>
      </GridCardReal>

      {/* Longest streak — fixed 6px dots, 10×10 grid, always circles */}
      <GridCardReal delay={0.07} style={{ gridColumn: "2", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          {/* Header row — title + pill inline, matching Builder Energy pattern */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Longest Streak
            </span>
            <StreakPill count={streakInfo.longest} />
          </div>
          {/* Flex-wrap dots */}
          <div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 5, overflow: "hidden" }}>
            {Array.from({ length: streakInfo.longest + 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: i < streakInfo.longest ? "var(--color-gray12)" : "var(--overlay-subtle)",
                }}
              />
            ))}
          </div>
        </div>
      </GridCardReal>

      <GridCardReal delay={0.12} style={{ gridColumn: "3", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Days active
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {activePercent}%
            </span>
          </div>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            {zeroDays} rest days
          </span>
        </div>
      </GridCardReal>

      {/* Rest day — bar chart with modal */}
      <RestDayCard delay={0.17} onOpen={() => setRestDayOpen(true)} />

      {/* ── Row 2 — intensity + channel ────────────────────────────────────── */}

      {/* Most intense month — gray calendar grid filling container */}
      <GridCardReal delay={0.22} style={{ gridColumn: "1", gridRow: "2" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Most intense month
          </span>
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 3 }}>
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const count = peakDayMap.get(day) ?? 0;
              const intensity = count / peakDayMax;
              const isHot = intensity > 0.75;
              const dowIndex = (firstDow + i) % 7; // 0=Sun,1=Mon,...,6=Sat
              const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
              return (
                <div key={day} style={{ borderRadius: 3, backgroundColor: isHot ? `rgba(233, 95, 56, ${0.4 + intensity * 0.5})` : "var(--overlay-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!isHot && (
                    <span className="font-mono select-none" style={{ fontSize: 6, color: "var(--text-faint)", lineHeight: 1, opacity: 0.6 }}>
                      {DOW_LABELS[dowIndex]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 10px", borderRadius: 6, backgroundColor: "var(--overlay-subtle)", border: "1px solid var(--overlay-medium)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gray12)", flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-gray12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {peakMonthFull}
            </span>
          </div>
        </div>
      </GridCardReal>

      {/* #1 Channel — special viz + picks modal for Dive Club, How I AI, Lenny’s Podcast */}
      <GridCardReal delay={0.27} style={{ gridColumn: "2", gridRow: "2" }}>
        <TopChannelCardInner
          name={topChannel.name}
          count={topChannel.count}
          kind={topChannelSpecialKind}
          interactive={topChannelInteractive}
          onOpen={topChannelInteractive ? () => setTopChannelPicksOpen(true) : undefined}
        />
      </GridCardReal>

      {/* Tool loyalty — before/after card with modal */}
      <ToolLoyaltyCard delay={0.32} onOpen={() => setToolLoyaltyOpen(true)} />

      {/* Rabbit holes — total count card, click-in modal with category tabs */}
      <RabbitHolesCard delay={0.37} onOpen={() => setRabbitHolesOpen(true)} />

      {/* ── Row 3 — AI growth, learning diversity, engineering tools ──────── */}

      {/* AI growth curve — then vs now narrative */}
      <GridCardReal delay={0.42} style={{ gridColumn: "1 / 3", gridRow: "3" }}>
        {(() => {
          const first = monthlyCategories[0];
          const last = monthlyCategories[monthlyCategories.length - 1];
          const delta = last.aiPct - first.aiPct;
          const fmtMonth = (m: string) => {
            const [y, mo] = m.split("-");
            const d = new Date(parseInt(y), parseInt(mo) - 1, 1);
            return d.toLocaleDateString("en-US", { month: "short" }) + " \u2019" + y.slice(2);
          };
          return (
            <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                AI growth curve
              </span>
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                {/* Then */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {fmtMonth(first.month)}
                  </span>
                  <span className="font-mono select-none" style={{ fontSize: 38, color: "var(--text-faint)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {first.aiPct.toFixed(0)}%
                  </span>
                </div>
                {/* Arrow */}
                <span className="font-mono select-none" style={{ fontSize: 18, color: "var(--overlay-strong)", margin: "0 20px", lineHeight: 1, flexShrink: 0 }}>
                  →
                </span>
                {/* Now */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {fmtMonth(last.month)}
                  </span>
                  <span className="font-mono select-none" style={{ fontSize: 38, color: "var(--color-orange)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {last.aiPct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                {delta >= 0 ? "+" : ""}{delta.toFixed(0)} points
              </span>
            </div>
          );
        })()}
      </GridCardReal>

      {/* Learning diversity — unique channel count */}
      <GridCardReal delay={0.47} style={{ gridColumn: "3", gridRow: "3" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Diversity
          </span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {uniqueChannelCount}
            </span>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Channels
            </span>
          </div>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Top 25 = 18% of total
          </span>
        </div>
      </GridCardReal>

      {/* Engineering tools — top 4 proportional bars */}
      <GridCardReal delay={0.52} style={{ gridColumn: "4", gridRow: "3" }}>
        {(() => {
          const engTools = engSearchThemes
            .sort((a, b) => b.searches - a.searches)
            .slice(0, 4);
          const maxEng = engTools[0]?.searches ?? 1;
          const totalEng = engTools.reduce((s, t) => s + t.searches, 0);
          return (
            <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Engineering
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 7 }}>
                {engTools.map((t) => (
                  <div key={t.tool}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-muted)" }}>{t.tool}</span>
                      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{t.searches}</span>
                    </div>
                    <div style={{ height: 2, backgroundColor: "var(--overlay-subtle)", borderRadius: 1 }}>
                      <div style={{ height: "100%", width: `${(t.searches / maxEng) * 100}%`, backgroundColor: "var(--overlay-strong)", borderRadius: 1 }} />
                    </div>
                  </div>
                ))}
              </div>
              <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
                {totalEng} searches
              </span>
            </div>
          );
        })()}
      </GridCardReal>

      {/* ── Row 4 — domain breakdown ───────────────────────────────────────── */}

      <GridCardReal delay={0.57} style={{ gridColumn: "1 / 5", gridRow: "4" }}>
        <div style={{ height: "100%", padding: "0 8px", display: "flex", alignItems: "center" }}>
          {domainData.map((d, i) => {
            const isLast = i === domainData.length - 1;
            return (
              <React.Fragment key={d.id}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: "0 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="font-mono select-none" style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: "-0.01em" }}>
                      {d.label}
                    </span>
                    <span className="font-mono select-none" style={{ fontSize: 14, color: i === 0 ? "var(--color-orange)" : "var(--text-faint)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                      {d.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${d.pct}%`, backgroundColor: i === 0 ? "var(--color-orange)" : "var(--overlay-strong)", borderRadius: 1 }} />
                  </div>
                </div>
                {!isLast && <div style={{ width: 1, height: 44, backgroundColor: "var(--overlay-medium)", flexShrink: 0 }} />}
              </React.Fragment>
            );
          })}
        </div>
      </GridCardReal>

      {/* ── Row 5 — subscriptions · peak hour · career tuner ──────────────── */}

      <GridCardReal delay={0.62} style={{ gridColumn: "1", gridRow: "5" }} forceHover={subscriptionsOpen}>
        <SubscriptionsCardInner onOpen={() => setSubscriptionsOpen(true)} stats={stats} />
      </GridCardReal>

      <GridCardReal delay={0.66} style={{ gridColumn: "2", gridRow: "5" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Peak hour
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {peakHourLabel}
            </span>
          </div>
          <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            {peakHourBucket.percentage.toFixed(1)}% of total
          </span>
        </div>
      </GridCardReal>

      <GridCardReal delay={0.70} style={{ gridColumn: "3 / 5", gridRow: "5" }} forceHover={growthTickerModalOpen}>
        <GrowthTickerInteractive onModalOpenChange={setGrowthTickerModalOpen} />
      </GridCardReal>
    </div>

    <AnimatePresence>
      {restDayOpen && <RestDayModal onClose={() => setRestDayOpen(false)} />}
    </AnimatePresence>
    <AnimatePresence>
      {toolLoyaltyOpen && <ToolLoyaltyModal onClose={() => setToolLoyaltyOpen(false)} />}
    </AnimatePresence>
    <AnimatePresence>
      {rabbitHolesOpen && <RabbitHolesModal onClose={() => setRabbitHolesOpen(false)} />}
    </AnimatePresence>
    <AnimatePresence>
      {topChannelPicksOpen && topChannelInteractive && (
        <TopChannelPicksModal
          onClose={() => setTopChannelPicksOpen(false)}
          channelName={topChannel.name}
          channelUrl={topChannelUrl}
          picks={topChannelPicksForModal}
        />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {subscriptionsOpen && <SubscriptionsModal onClose={() => setSubscriptionsOpen(false)} stats={stats} />}
    </AnimatePresence>
    </>
  );
}

/** Flagged data stories as interactive grid cards */
export const FlaggedGrid: Story = {
  render: () => <FlaggedGridView />,
};

// ─── Subscriptions card + modal ───────────────────────────────────────────────

export const SUB_TABS = ["All", "AI", "Design", "Engineering", "Startups"] as const;
export type SubTab = (typeof SUB_TABS)[number];

export const SUB_TAB_LABEL: Record<SubTab, string> = {
  All: "All categories",
  AI: "AI & Machine Learning",
  Design: "Design & Creative",
  Engineering: "Engineering & Dev",
  Startups: "Startups & Business",
};

export function getSubCount(tab: SubTab, statsArg: YouTubeStats): number {
  if (tab === "All") return statsArg.totalSubscriptions;
  const label = SUB_TAB_LABEL[tab];
  return statsArg.subscriptionCategories.find((c) => c.label === label)?.count ?? 0;
}

export function getSubColor(tab: SubTab, statsArg: YouTubeStats): string {
  if (tab === "All") return "var(--color-orange)";
  const label = SUB_TAB_LABEL[tab];
  return statsArg.subscriptionCategories.find((c) => c.label === label)?.color ?? "var(--color-orange)";
}

export function SubscriptionsCardInner({ onOpen, stats: statsArg }: { onOpen: () => void; stats: YouTubeStats }) {
  const bellRef = React.useRef<BellIconHandle>(null);
  return (
    <div
      style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", cursor: "pointer" }}
      onClick={onOpen}
      onMouseEnter={() => bellRef.current?.startAnimation()}
    >
      <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
        Your subscriptions
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {statsArg.totalSubscriptions}
          </span>
          <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.02em" }}>
            / subs
          </span>
        </div>
      </div>
      {/* Full-width badge — matches Longest Streak / Top Category card pattern */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "7px 10px", borderRadius: 6, backgroundColor: "var(--overlay-subtle)", border: "1px solid var(--overlay-medium)" }}>
        <BellIcon ref={bellRef} size={10} style={{ color: "var(--color-gray12)", display: "flex", alignItems: "center", flexShrink: 0 }} />
        <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-gray12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Subscribed</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gray12)", flexShrink: 0, marginLeft: 2 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}


// ─── Odometer digit for subscriptions modal ───────────────────────────────────
const MODAL_DIGIT_H = 88;
const MODAL_DIGIT_W = 54;
const MODAL_FONT_SIZE = 80;

function ModalOdoDigit({ digit }: { digit: number }) {
  const spring = useSpring(MODAL_DIGIT_H, { stiffness: 260, damping: 22, mass: 0.9 });
  const velocity = useVelocity(spring);
  const rotateX = useTransform(velocity, [-800, 0, 800], [12, 0, -12]);

  React.useEffect(() => {
    spring.set(-digit * MODAL_DIGIT_H);
  }, [digit, spring]);

  return (
    <div style={{ position: "relative", width: MODAL_DIGIT_W, height: MODAL_DIGIT_H, overflow: "hidden", perspective: 400 }}>
      <motion.div style={{ y: spring, rotateX }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div
            key={n}
            className="font-mono select-none"
            style={{
              height: MODAL_DIGIT_H,
              width: MODAL_DIGIT_W,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: MODAL_FONT_SIZE,
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

function HoverBellCount({ displayCount }: { displayCount: number }) {
  return (
    <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-end", gap: 16 }}>
      <div style={{ display: "flex", gap: 2 }}>
        <ModalOdoDigit digit={Math.floor(displayCount / 10) % 10} />
        <ModalOdoDigit digit={displayCount % 10} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <ChannelSubscribeMorphPill initialSubscribed ringOnMount />
      </div>
    </div>
  );
}

export function SubscriptionsModal({ onClose, stats: statsArg }: { onClose: () => void; stats: YouTubeStats }) {
  const rows = (["AI", "Design", "Engineering", "Startups"] as SubTab[])
    .map((t) => ({ tab: t, label: SUB_TAB_LABEL[t], count: getSubCount(t, statsArg) }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const [selectedTab, setSelectedTab] = React.useState<SubTab | "All">("All");
  const [hoveredTab, setHoveredTab] = React.useState<SubTab | "All" | null>(null);

  const displayCount = selectedTab === "All" ? statsArg.totalSubscriptions : getSubCount(selectedTab as SubTab, statsArg);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97, transition: { scale: { duration: 0.14 }, y: { duration: 0.14 }, opacity: { duration: 0.14, ease: "easeIn" } } }}
          transition={{ opacity: { duration: 0.18, ease: "easeOut" }, scale: MODAL_SPRING, y: MODAL_SPRING }}
          style={{ pointerEvents: "all" }}
        >
          <ElevatedSection style={{ backgroundColor: "var(--modal-bg)", borderRadius: 16, border: "1px solid var(--overlay-strong)", boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)", width: 420, maxWidth: "90vw" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <span className="select-none" style={{ ...MODAL_TITLE_STYLE, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span>Your subscriptions —</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={selectedTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {selectedTab === "All" ? "All categories" : SUB_TAB_LABEL[selectedTab]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <button onClick={onClose} style={MODAL_CLOSE_BTN_STYLE}>×</button>
            </div>

            {/* Big animated count + bell icon */}
            <HoverBellCount displayCount={displayCount} />

            {/* Category rows */}
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "20px 0 16px" }} />
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 10, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                By category
              </span>
              {statsArg.totalSubscriptions === 0 ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "20px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--overlay-medium)",
                  backgroundColor: "var(--overlay-subtle)",
                }}>
                  <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--text-faint)", letterSpacing: "0.02em" }}>
                    No subscriptions
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[{ tab: "All" as const, label: "All categories", count: statsArg.totalSubscriptions }, ...rows].map((row, idx) => {
                    const isSel = selectedTab === row.tab;
                    const isHov = hoveredTab === row.tab && !isSel;
                    const rowC = modalListRowTextColors(isSel, isHov);
                    return (
                      <motion.button
                        key={row.tab}
                        type="button"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                        onClick={() => setSelectedTab(row.tab)}
                        onPointerEnter={() => setHoveredTab(row.tab)}
                        onPointerLeave={() => setHoveredTab(null)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                          borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left",
                          border: `1px solid ${isSel || isHov ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
                          backgroundColor: isSel ? "var(--overlay-medium)" : isHov ? "color-mix(in srgb, var(--overlay-medium) 42%, var(--overlay-subtle))" : "var(--overlay-subtle)",
                          transition: "background-color 0.2s ease, border-color 0.2s ease",
                          outline: "none",
                        }}
                      >
                        <span className="font-mono select-none" style={{ flexShrink: 0, width: 34, fontSize: 10, letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums", color: rowC.rank, transition: "color 0.15s ease" }}>
                          #{idx + 1}
                        </span>
                        <span className="font-mono" style={{ flex: 1, fontSize: 13, letterSpacing: "-0.01em", color: rowC.title, transition: "color 0.15s ease" }}>
                          {row.label}
                        </span>
                        <span className="font-mono select-none" style={{ fontSize: 11, color: rowC.value, letterSpacing: "0.02em", flexShrink: 0, transition: "color 0.15s ease" }}>
                          {row.count} {row.count === 1 ? "channel" : "channels"}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}
