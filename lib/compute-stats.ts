import { WatchEntry, SearchEntry, Subscription } from './parse-takeout';
import { categorize, isBlocklisted, CATEGORIES, getCategoryById, CATEGORY_COLOR_OTHER, AI_TOOLS_TIMELINE } from './categories';
import { groupSearchesByTheme } from './curation';
import type { ToolLoyaltyRow } from './tool-loyalty-data';

const TOOL_THEMES: Array<{ tool: string; keywords: string[] }> = [
  { tool: 'Cursor', keywords: ['cursor', 'cursor ai', 'cursor editor', 'cursor ide', 'cursor tab', 'cursor composer', 'cursor rules'] },
  { tool: 'Claude Code', keywords: ['claude code', 'claude cli', 'anthropic claude', 'claude ai coding', 'claude engineer', 'claude agent', 'claude'] },
  { tool: 'Figma', keywords: ['figma', 'figma plugin', 'figma component', 'figma auto layout', 'figma variables', 'figma dev mode', 'figma prototype'] },
  { tool: 'ChatGPT', keywords: ['chatgpt', 'chat gpt', 'openai', 'gpt-4', 'gpt4', 'gpt 4', 'chatgpt plugin', 'gpt'] },
  { tool: 'Webflow', keywords: ['webflow', 'webflow cms', 'webflow tutorial', 'webflow interactions'] },
  { tool: 'v0', keywords: ['v0.dev', 'v0 dev', 'vercel v0', 'shadcn v0'] },
  { tool: 'Framer', keywords: ['framer', 'framer motion', 'framer site', 'framer web'] },
  { tool: 'GitHub Copilot', keywords: ['github copilot', 'copilot ai', 'copilot vscode', 'copilot editor'] },
];

export interface HourBucket {
  hour: number; // 0-23
  count: number;
  percentage: number;
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ChannelStat {
  name: string;
  count: number;
  categoryId: string;
  color: string;
}

export interface CategoryStat {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WeekBucket {
  weekStart: Date;
  count: number;
}

/**
 * Estimated average video length for educational/technical content.
 * Used only as a fallback for the final video in a session (no next-video gap available).
 * Adjust this constant if you want to tune the estimate (10 = short tutorials, 20 = long deep-dives).
 */
export const AVG_VIDEO_MINUTES = 15;

/**
 * Gap cap for the gap-based watch time estimator.
 * If the next video starts more than this many minutes later, we assume a break happened
 * and only credit this many minutes to the current video.
 */
const GAP_CAP_MINUTES = 20;

/**
 * Minimum gap between consecutive watch events to count as a real visit.
 * Events closer together than this are likely autoplay chains or feed scroll-bys.
 */
const RAPID_FIRE_GAP_MS = 30_000; // 30 seconds

/**
 * Remove watch events that occurred within RAPID_FIRE_GAP_MS of the previous event.
 * These are autoplay chains or feed scroll-bys — not intentional watches.
 * Input does not need to be sorted; this function sorts internally.
 */
export function filterRapidFire(entries: WatchEntry[]): WatchEntry[] {
  if (entries.length === 0) return entries;
  const sorted = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const result: WatchEntry[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime() >= RAPID_FIRE_GAP_MS) {
      result.push(sorted[i]);
    }
  }
  return result;
}

/**
 * Estimate total hours watched using inter-video gaps as a proxy for watch time.
 * Each video is credited the minutes until the next video starts, capped at GAP_CAP_MINUTES.
 * The final video falls back to AVG_VIDEO_MINUTES since there's no next event to measure.
 * Input must be sorted by timestamp ascending.
 */
function computeGapBasedHours(entries: WatchEntry[]): number {
  if (entries.length === 0) return 0;
  let totalMinutes = 0;
  for (let i = 0; i < entries.length - 1; i++) {
    const gapMin = (entries[i + 1].timestamp.getTime() - entries[i].timestamp.getTime()) / 60_000;
    // cap: don't credit a break longer than GAP_CAP_MINUTES to the current video
    totalMinutes += Math.min(gapMin, GAP_CAP_MINUTES);
  }
  totalMinutes += AVG_VIDEO_MINUTES; // last video has no next event — use flat estimate
  return totalMinutes / 60;
}

export interface YouTubeStats {
  // --- Core counts ---
  totalVideos: number;
  totalSearches: number;
  totalSubscriptions: number;
  dateRange: { earliest: Date; latest: Date };
  totalDays: number;
  avgVideosPerDay: number;
  /** Estimated avg hours watched per day — derived from inter-video gaps, capped at GAP_CAP_MINUTES per video */
  avgHoursPerDay: number;
  /** Days where ≥85% of relevant videos were one category (and ≥6 relevant videos total) */
  rabbitHoleCount: number;
  /** ISO date strings (YYYY-MM-DD) of every rabbit hole day */
  rabbitHoleDates: string[];
  /** Category label of most frequent rabbit hole (e.g. "AI & Machine Learning") */
  topRabbitHoleCategory: string;
  /** Breakdown of rabbit hole days by category id — ready for future UI use */
  rabbitHoleCategoryCounts: Record<string, number>;
  /** Longest consecutive-day streak per category (days with ≥5 videos in that category) */
  longestStreakPerCategory: Record<string, number>;

  // --- Time patterns ---
  hourBuckets: HourBucket[]; // 24 buckets
  nightOwlPercent: number;   // % watched midnight–5am
  topHour: number;           // hour with most views
  topHourCount: number;

  // --- Channels ---
  topChannels: ChannelStat[];   // top 20

  // --- Categories ---
  categoryBreakdown: CategoryStat[];
  topCategory: CategoryStat;
  aiPercent: number;
  engineeringPercent: number;
  designPercent: number;
  startupPercent: number;
  /** Composite builder identity score 0–1. Computed from category mix, consistency, and volume. */
  builderEnergy: number;

  // --- Activity over time ---
  dailyBuckets: DayBucket[];   // one entry per calendar day
  weeklyBuckets: WeekBucket[];
  bingeSessions: { date: string; count: number }[]; // top 10 single-day binge sessions

  // --- Searches ---
  topSearchTerms: { term: string; count: number }[];
  /** Top 12 search terms curated for narrative fit — use this in UI components */
  featuredSearchTerms: { term: string; count: number }[];

  // --- Subscriptions ---
  subscriptionCategories: { label: string; count: number; color: string }[];

  // --- Tool journey ---
  toolJourney: ToolLoyaltyRow[];
}

/**
 * Like categorize() but uses word-boundary matching for short keywords.
 * Prevents false positives like "rag" matching "dragon" on search queries.
 */
function categorizeSearchTerm(term: string): string {
  const lower = term.toLowerCase();
  for (const cat of CATEGORIES) {
    const matched = cat.keywords.some((kw) => {
      if (kw.length <= 3) {
        // Require the keyword to appear as a whole word (not inside another word)
        return new RegExp(`(?<![a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`, 'i').test(lower);
      }
      return lower.includes(kw);
    });
    if (matched) return cat.id;
  }
  return 'other';
}

/**
 * Composite builder identity score, 0–1.
 *
 * Three signals — each normalised 0→1, then weighted:
 *   focus       (category mix weighted by builder-identity signal)   35%
 *   consistency (days with activity / total days in range)           30%
 *   volume      (avg videos/day, ceiling 10)                        20%
 * Plus a 15% floor — anyone with filtered data is already a builder.
 *
 * Focus normalises within the four known categories only, so unclassified
 * ("other") content doesn't silently deflate the score.
 */
export function computeBuilderEnergy(
  aiPercent: number,
  engineeringPercent: number,
  designPercent: number,
  startupPercent: number,
  dailyBuckets: DayBucket[],
  totalDays: number,
  avgVideosPerDay: number,
): number {
  const knownSum = aiPercent + engineeringPercent + designPercent + startupPercent;
  const weightedFocus = knownSum > 0
    ? (aiPercent * 1.0 + engineeringPercent * 0.90 + designPercent * 0.85 + startupPercent * 0.75) / knownSum
    : 0.75; // fallback: treat as startup-level if all content is unclassified

  const focusScore = Math.min(Math.max((weightedFocus - 0.65) / 0.35, 0), 1);

  const daysActive = dailyBuckets.filter((d) => d.count > 0).length;
  const consistencyScore = Math.min(daysActive / Math.max(totalDays, 1), 1);

  const volumeScore = Math.min(avgVideosPerDay / 10, 1);

  return 0.15 + focusScore * 0.35 + consistencyScore * 0.30 + volumeScore * 0.20;
}

function computeToolJourney(
  searchHistory: SearchEntry[],
  earliest: Date
): ToolLoyaltyRow[] {
  // Split at 4 months from earliest date
  const cutoff = new Date(earliest);
  cutoff.setMonth(cutoff.getMonth() + 4);

  const rows: ToolLoyaltyRow[] = TOOL_THEMES.map(({ tool, keywords }) => {
    let earlyN = 0;
    let recentN = 0;
    for (const entry of searchHistory) {
      const q = entry.query.toLowerCase();
      const matches = keywords.some(kw => q.includes(kw));
      if (!matches) continue;
      const date = new Date(entry.timestamp);
      if (date < cutoff) {
        earlyN++;
      } else {
        recentN++;
      }
    }
    return { tool, earlyN, recentN };
  });

  // Filter to tools with at least 1 search in either period
  return rows.filter(r => r.earlyN > 0 || r.recentN > 0);
}

/** Strip non-design-relevant entries and YouTube Shorts before computing stats */
export function filterToRelevant(entries: WatchEntry[]): WatchEntry[] {
  return entries.filter((e) => {
    // Exclude Shorts
    if (e.videoUrl.includes('/shorts/')) return false;
    const text = e.channelName + ' ' + e.title;
    // Exclude domain blocklist (watches, speculative finance, celebrity lifestyle)
    if (isBlocklisted(text)) return false;
    // Keep only design-relevant categories
    const catId = categorize(text);
    const cat = getCategoryById(catId);
    return cat?.designRelevant === true;
  });
}

export function computeStats(
  watchHistory: WatchEntry[],
  searchHistory: SearchEntry[],
  subscriptions: Subscription[]
): YouTubeStats {
  if (watchHistory.length === 0) {
    throw new Error('No watch history found in takeout data');
  }

  const sorted = [...watchHistory].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const earliest = sorted[0].timestamp;
  const latest = sorted[sorted.length - 1].timestamp;
  const totalDays = Math.max(1, Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // --- Hour buckets ---
  const hourCounts = new Array(24).fill(0);
  for (const e of watchHistory) {
    hourCounts[e.hour]++;
  }
  const maxHour = Math.max(...hourCounts);
  const topHour = hourCounts.indexOf(maxHour);
  const hourBuckets: HourBucket[] = hourCounts.map((count, hour) => ({
    hour,
    count,
    percentage: (count / watchHistory.length) * 100,
  }));

  // Night owl: midnight to 5am (hours 0,1,2,3,4)
  const nightCount = hourCounts.slice(0, 5).reduce((a, b) => a + b, 0);
  const nightOwlPercent = (nightCount / watchHistory.length) * 100;

  // --- Channel stats ---
  const channelMap = new Map<string, { count: number; categoryId: string }>();
  for (const e of watchHistory) {
    const name = e.channelName || 'Unknown';
    const existing = channelMap.get(name);
    if (existing) {
      existing.count++;
    } else {
      const catId = categorize(name + ' ' + e.title);
      channelMap.set(name, { count: 1, categoryId: catId });
    }
  }

  const topChannels: ChannelStat[] = Array.from(channelMap.entries())
    .map(([name, { count, categoryId }]) => {
      const cat = getCategoryById(categoryId);
      return { name, count, categoryId, color: cat?.color ?? CATEGORY_COLOR_OTHER };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  // --- Category breakdown ---
  const catCounts = new Map<string, number>();
  for (const e of watchHistory) {
    const catId = categorize(e.channelName + ' ' + e.title);
    catCounts.set(catId, (catCounts.get(catId) ?? 0) + 1);
  }

  const categoryBreakdown: CategoryStat[] = CATEGORIES.map((cat) => {
    const count = catCounts.get(cat.id) ?? 0;
    return {
      id: cat.id,
      label: cat.label,
      count,
      percentage: (count / watchHistory.length) * 100,
      color: cat.color,
    };
  })
    .concat([
      {
        id: 'other',
        label: 'Other',
        count: catCounts.get('other') ?? 0,
        percentage: ((catCounts.get('other') ?? 0) / watchHistory.length) * 100,
        color: CATEGORY_COLOR_OTHER,
      },
    ])
    .sort((a, b) => b.count - a.count);

  const topCategory = categoryBreakdown[0];
  const aiPercent          = categoryBreakdown.find((c) => c.id === 'ai')?.percentage          ?? 0;
  const engineeringPercent = categoryBreakdown.find((c) => c.id === 'engineering')?.percentage ?? 0;
  const designPercent      = categoryBreakdown.find((c) => c.id === 'design')?.percentage      ?? 0;
  const startupPercent     = categoryBreakdown.find((c) => c.id === 'startup')?.percentage     ?? 0;

  // --- Weekly buckets ---
  const weekMap = new Map<string, number>();
  for (const e of watchHistory) {
    const d = new Date(e.timestamp);
    // Set to Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const key = d.toISOString().slice(0, 10);
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
  }
  const weeklyBuckets: WeekBucket[] = Array.from(weekMap.entries())
    .map(([key, count]) => ({ weekStart: new Date(key), count }))
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

  // --- Daily buckets + binge sessions ---
  const dayMap = new Map<string, number>();
  for (const e of watchHistory) {
    const key = e.timestamp.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  // Fill every calendar day in range (including 0-count days)
  const dailyBuckets: DayBucket[] = [];
  const cursor = new Date(earliest);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(latest);
  endDay.setHours(0, 0, 0, 0);
  while (cursor <= endDay) {
    const key = cursor.toISOString().slice(0, 10);
    dailyBuckets.push({ date: key, count: dayMap.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const bingeSessions = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --- Search terms (design-relevant only, word-boundary matching for short keywords) ---
  const queryMap = new Map<string, number>();
  for (const s of searchHistory) {
    const term = s.query.toLowerCase().trim();
    const catId = categorizeSearchTerm(term);
    const cat = getCategoryById(catId);
    if (cat?.designRelevant !== true) continue;
    queryMap.set(term, (queryMap.get(term) ?? 0) + 1);
  }
  // All design-relevant searches (full list — used for theme aggregation)
  const allDesignRelevantSearches = Array.from(queryMap.entries())
    .map(([term, count]) => ({ term, count }));
  // Top 30 raw terms (for reference / other uses)
  const topSearchTerms = allDesignRelevantSearches
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // --- Subscription categories ---
  const subCatMap = new Map<string, number>();
  for (const sub of subscriptions) {
    const catId = categorize(sub.channelTitle);
    subCatMap.set(catId, (subCatMap.get(catId) ?? 0) + 1);
  }
  const subscriptionCategories = Array.from(subCatMap.entries())
    .map(([id, count]) => {
      const cat = getCategoryById(id);
      return { label: cat?.label ?? 'Other', count, color: cat?.color ?? CATEGORY_COLOR_OTHER };
    })
    .sort((a, b) => b.count - a.count);

  const avgVideosPerDay = watchHistory.length / totalDays;
  // gap-based: use actual inter-video time gaps (capped) instead of flat AVG_VIDEO_MINUTES × count
  const avgHoursPerDay = computeGapBasedHours(sorted) / totalDays;

  // --- Rabbit holes: per-category independent counts ---
  // A day qualifies as a rabbit hole for category X if ≥5 videos that day were in X.
  // Days can qualify for multiple categories simultaneously (no exclusive-OR).
  const RABBIT_HOLE_CATS = ['ai', 'design', 'engineering', 'startup'] as const;
  const RABBIT_HOLE_MIN = 5; // videos in one category on one day

  const dayByCat = new Map<string, Record<string, number>>();
  for (const e of watchHistory) {
    const catId = categorize(e.channelName + ' ' + e.title);
    if (!(RABBIT_HOLE_CATS as readonly string[]).includes(catId)) continue;
    const key = e.timestamp.toISOString().slice(0, 10);
    if (!dayByCat.has(key)) dayByCat.set(key, { ai: 0, design: 0, engineering: 0, startup: 0 });
    dayByCat.get(key)![catId]++;
  }

  const rhCatTally: Record<string, number> = {};
  const rhDateSet = new Set<string>();
  for (const [date, cats] of dayByCat.entries()) {
    for (const cat of RABBIT_HOLE_CATS) {
      if ((cats[cat] ?? 0) >= RABBIT_HOLE_MIN) {
        rhCatTally[cat] = (rhCatTally[cat] ?? 0) + 1;
        rhDateSet.add(date);
      }
    }
  }
  // rabbitHoleDates = union of all days where any category triggered
  const rabbitHoleDates = [...rhDateSet].sort();
  const rabbitHoleCount = rhDateSet.size;
  const topRhCatId = Object.entries(rhCatTally).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'ai';
  const topRabbitHoleCategory = getCategoryById(topRhCatId)?.label ?? 'AI & Machine Learning';

  // Per-category longest consecutive streak (days with ≥ RABBIT_HOLE_MIN videos in that category)
  const longestStreakPerCategory: Record<string, number> = {};
  for (const cat of RABBIT_HOLE_CATS) {
    let longest = 0, current = 0;
    for (const bucket of dailyBuckets) {
      const catCount = dayByCat.get(bucket.date)?.[cat] ?? 0;
      if (catCount >= RABBIT_HOLE_MIN) { current++; longest = Math.max(longest, current); }
      else current = 0;
    }
    longestStreakPerCategory[cat] = longest;
  }

  const toolJourney = computeToolJourney(searchHistory, new Date(earliest));

  return {
    totalVideos: watchHistory.length,
    totalSearches: searchHistory.length,
    totalSubscriptions: subscriptions.length,
    dateRange: { earliest, latest },
    totalDays,
    avgVideosPerDay,
    avgHoursPerDay,
    rabbitHoleCount,
    rabbitHoleDates,
    topRabbitHoleCategory,
    rabbitHoleCategoryCounts: rhCatTally,
    longestStreakPerCategory,
    hourBuckets,
    nightOwlPercent,
    topHour,
    topHourCount: maxHour,
    topChannels,
    categoryBreakdown,
    topCategory,
    aiPercent,
    engineeringPercent,
    designPercent,
    startupPercent,
    builderEnergy: computeBuilderEnergy(
      aiPercent,
      engineeringPercent,
      designPercent,
      startupPercent,
      dailyBuckets,
      totalDays,
      avgVideosPerDay,
    ),
    dailyBuckets,
    weeklyBuckets,
    bingeSessions,
    topSearchTerms,
    featuredSearchTerms: groupSearchesByTheme(allDesignRelevantSearches, 12),
    subscriptionCategories,
    toolJourney,
  };
}

/**
 * Design Engineer Score — 0 to 100. Purely behavioral, no time component.
 *
 * Answers: "Based on what you watch and how deliberately, how strongly does your
 * YouTube behavior signal a design engineer in the making?"
 *
 * Five signals:
 *   1. Volume × trifecta purity  (40%) — how much AI/design/engineering content, absolutely
 *   2. Consistency               (25%) — active days / total days in data range
 *   3. Builder rabbit holes/mo   (15%) — deep-dive intensity in the three core categories
 *   4. Design search intent      (10%) — deliberate searching, not passive watching
 *   5. Active tool breadth        (5%) — recent tool ecosystem engagement
 *
 * No floor. A passive lurker starting early earns nothing.
 */
export function computeDesignEngineerScore(stats: YouTubeStats): number {
  const monthsInData = Math.max(stats.totalDays / 30, 1);

  // trifectaPurity: of relevant content, what share is AI+design+engineering (not startup)?
  const trifectaRaw = stats.aiPercent + stats.designPercent + stats.engineeringPercent;
  const knownSum    = trifectaRaw + stats.startupPercent;
  const trifectaPurity = knownSum > 0 ? trifectaRaw / knownSum : 0;

  // volume × focus: watching 13 relevant videos/day with 100% trifecta focus = full marks
  const volumeScore  = Math.min(stats.avgVideosPerDay / 13, 1);
  const contentScore = volumeScore * trifectaPurity;

  // active days / total days in data range
  const daysActive      = stats.dailyBuckets.filter((d) => d.count > 0).length;
  const consistencyScore = Math.min(daysActive / Math.max(stats.totalDays, 1), 1);

  // builder rabbit holes per month (AI + design + engineering only); ceiling 30/mo
  const builderRH  = (stats.rabbitHoleCategoryCounts['ai'] ?? 0)
    + (stats.rabbitHoleCategoryCounts['design'] ?? 0)
    + (stats.rabbitHoleCategoryCounts['engineering'] ?? 0);
  const depthScore = Math.min(builderRH / monthsInData / 30, 1);

  // design-relevant searches per month (searches are intentional; watches can be passive)
  const totalSearchCount = stats.topSearchTerms.reduce((sum, t) => sum + t.count, 0);
  const searchScore      = Math.min(totalSearchCount / monthsInData / 30, 1);

  // how many builder tools have you searched for recently? (recentN > 0 out of 7 tracked)
  const activeTools = stats.toolJourney.filter((t) => t.recentN > 0).length;
  const toolScore   = Math.min(activeTools / 7, 1);

  return (
    contentScore      * 0.40 +
    consistencyScore  * 0.25 +
    depthScore        * 0.15 +
    searchScore       * 0.10 +
    toolScore         * 0.05
  ) * 100;
}

/** Format hour as "2 AM", "12 PM", etc. */
export function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

/** Format a date range as "Nov 2024 – Feb 2026" */
export function formatDateRange(earliest: Date, latest: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${fmt(earliest)} – ${fmt(latest)}`;
}
