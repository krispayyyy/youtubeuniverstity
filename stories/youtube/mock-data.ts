/**
 * Mock data for YouTube component stories.
 * Approximates a real takeout data shape for isolated development.
 */

import type { HourBucket, CategoryStat, ChannelStat, WeekBucket, DayBucket, YouTubeStats } from '@/lib/compute-stats';
import type { ToolLoyaltyRow } from '@/lib/tool-loyalty-data';

// ─── Deterministic seeded RNG ─────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ─── Daily buckets (Nov 10, 2024 → Feb 18, 2026) ─────────────────────────────
// Educational content only — no Shorts/Reels.
// Realistic for AI/design/engineering tutorials (avg 13 min per video):
//   • Typical day: 5–12 educational videos (~1–2.5h of focused content)
//   • Weekend boost: +30% (more uninterrupted time)
//   • Binge days (specific dates): 34–44 videos (~7–9.5h, e.g. hackathon or holiday)
//   • Random deep-dive days (2%): 20–30 videos
//   • Quiet days (5%): 1–3 videos
//   • Min: 1 (at least something, this is a learner)
function generateDailyBuckets(): DayBucket[] {
  const rng = makeRng(42);
  const buckets: DayBucket[] = [];
  const start = new Date('2024-11-10');
  const end = new Date('2026-02-18');
  const cursor = new Date(start);

  // Intentional binge dates — long learning sessions on memorable days
  const bingeDays = new Set([
    '2025-03-14', '2025-01-22', '2024-12-08', '2025-07-04',
    '2025-09-19', '2025-11-28', '2025-05-30', '2025-08-16',
    '2025-04-12', '2025-12-26',
  ]);

  let dayIndex = 0;
  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dow = cursor.getDay(); // 0=Sun, 6=Sat
    const monthsIn = dayIndex / 30;
    const trendFactor = 0.75 + (monthsIn / 15) * 0.5; // 0.75 → 1.25 over 15 months
    const weekendFactor = (dow === 0 || dow === 6) ? 1.3 : 1.0;
    const base = 9 * weekendFactor * trendFactor; // avg ~9/day educational videos
    const noise = (rng() - 0.45) * 7; // ±3–4 videos of variance

    let count: number;
    if (bingeDays.has(dateStr)) {
      // Deep learning sessions: 34–44 educational videos (~7–9.5h)
      count = 34 + Math.round(rng() * 10);
    } else if (rng() < 0.02) {
      // Spontaneous deep-dive: 20–30 videos (~4–6.5h)
      count = 20 + Math.round(rng() * 10);
    } else if (rng() < 0.08) {
      // Offline day: sick, traveling, busy — no educational content
      count = 0;
    } else if (rng() < 0.05) {
      // Quiet day: 1–3 videos, brief catch-up
      count = 1 + Math.round(rng() * 2);
    } else {
      count = Math.max(1, Math.round(base + noise));
    }

    buckets.push({ date: dateStr, count });
    cursor.setDate(cursor.getDate() + 1);
    dayIndex++;
  }
  return buckets;
}

export const MOCK_DAILY_BUCKETS: DayBucket[] = generateDailyBuckets();

// ─── Hour buckets (24hr clock) ────────────────────────────────────────────────
// Matches a real usage pattern: big 12-1pm spike, consistent midnight-4am block
export const MOCK_HOUR_BUCKETS: HourBucket[] = [
  { hour: 0,  count: 1508, percentage: 2.69 },
  { hour: 1,  count: 1523, percentage: 2.72 },
  { hour: 2,  count: 1308, percentage: 2.33 },
  { hour: 3,  count: 2153, percentage: 3.84 },
  { hour: 4,  count: 2116, percentage: 3.77 },
  { hour: 5,  count: 3071, percentage: 5.48 },
  { hour: 6,  count: 3661, percentage: 6.53 },
  { hour: 7,  count: 2992, percentage: 5.34 },
  { hour: 8,  count: 2028, percentage: 3.62 },
  { hour: 9,  count: 2400, percentage: 4.28 },
  { hour: 10, count: 2819, percentage: 5.03 },
  { hour: 11, count: 4502, percentage: 8.03 },
  { hour: 12, count: 6449, percentage: 11.50 },
  { hour: 13, count: 6237, percentage: 11.12 },
  { hour: 14, count: 2765, percentage: 4.93 },
  { hour: 15, count: 1363, percentage: 2.43 },
  { hour: 16, count: 360,  percentage: 0.64 },
  { hour: 17, count: 346,  percentage: 0.62 },
  { hour: 18, count: 489,  percentage: 0.87 },
  { hour: 19, count: 466,  percentage: 0.83 },
  { hour: 20, count: 1021, percentage: 1.82 },
  { hour: 21, count: 2094, percentage: 3.73 },
  { hour: 22, count: 1881, percentage: 3.35 },
  { hour: 23, count: 2516, percentage: 4.49 },
];

// ─── Category breakdown ───────────────────────────────────────────────────────
// Note: raw watch data includes everything; the design narrative filters to
// ai / design / engineering / startup for all story sections
export const MOCK_CATEGORIES: CategoryStat[] = [
  { id: 'ai',          label: 'AI & Machine Learning',  count: 22600, percentage: 40.3, color: '#888' },
  { id: 'design',      label: 'Design & Creative',      count: 13800, percentage: 24.6, color: '#888' },
  { id: 'engineering', label: 'Engineering & Dev',      count: 10200, percentage: 18.2, color: '#888' },
  { id: 'startup',     label: 'Startups & Product',     count: 9468,  percentage: 16.9, color: '#888' },
];

// ─── Top channels — design / AI / engineering only ────────────────────────────
export const MOCK_CHANNELS: ChannelStat[] = [
  { name: 'Figma',                 count: 2840, categoryId: 'design',      color: '#888' },
  { name: 'AI Engineer',           count: 2200, categoryId: 'ai',          color: '#888' },
  { name: 'Vercel',                count: 1900, categoryId: 'engineering', color: '#888' },
  { name: 'How I AI',              count: 1650, categoryId: 'ai',          color: '#888' },
  { name: 'Webflow',               count: 1420, categoryId: 'design',      color: '#888' },
  { name: 'Andrej Karpathy',       count: 1200, categoryId: 'ai',          color: '#888' },
  { name: 'Olivier Larose',        count: 980,  categoryId: 'design',      color: '#888' },
  { name: 'The Futur',             count: 860,  categoryId: 'design',      color: '#888' },
  { name: 'Linear',                count: 820,  categoryId: 'engineering', color: '#888' },
  { name: 'Theo (t3.gg)',          count: 760,  categoryId: 'engineering', color: '#888' },
  { name: 'Motion Design School',  count: 680,  categoryId: 'design',      color: '#888' },
  { name: 'Lex Fridman',           count: 620,  categoryId: 'ai',          color: '#888' },
  { name: 'UI.dev',                count: 540,  categoryId: 'engineering', color: '#888' },
  { name: 'corbin',                count: 440,  categoryId: 'engineering', color: '#888' },
  { name: 'NXCRE',                 count: 410,  categoryId: 'engineering', color: '#888' },
  { name: 'Sam Altman',            count: 380,  categoryId: 'ai',          color: '#888' },
  { name: 'Pieter Levels',         count: 340,  categoryId: 'startup',     color: '#888' },
  { name: 'Awwwards',              count: 310,  categoryId: 'design',      color: '#888' },
  { name: 'Paul Hudson',           count: 290,  categoryId: 'engineering', color: '#888' },
  { name: 'Design Details',        count: 260,  categoryId: 'design',      color: '#888' },
];

// ─── Weekly buckets (15 months) ───────────────────────────────────────────────
function generateWeeklyBuckets(): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  const start = new Date('2024-11-11');
  // 65 weeks ≈ 15 months
  const pattern = [
    280, 310, 420, 380, 290, 450, 520, 480, 600, 720,
    550, 480, 390, 820, 940, 1020, 880, 760, 680, 590,
    510, 620, 740, 810, 920, 1100, 980, 850, 720, 660,
    580, 490, 420, 380, 440, 520, 610, 700, 790, 870,
    960, 1080, 1200, 1050, 920, 780, 640, 550, 480, 420,
    390, 450, 510, 580, 640, 710, 780, 850, 920, 1000,
    880, 760, 640, 540, 480,
  ];
  for (let i = 0; i < pattern.length; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + i * 7);
    buckets.push({ weekStart, count: pattern[i] });
  }
  return buckets;
}

export const MOCK_WEEKLY_BUCKETS: WeekBucket[] = generateWeeklyBuckets();

// ─── Full stats object ────────────────────────────────────────────────────────
export const MOCK_STATS: YouTubeStats = {
  totalVideos: 4820,
  totalSearches: 3240,
  totalSubscriptions: 32,
  dateRange: {
    earliest: new Date('2024-11-10'),
    latest: new Date('2026-02-18'),
  },
  totalDays: 466,
  avgVideosPerDay: 10.3,
  avgHoursPerDay: +(10.3 * 15 / 60).toFixed(1),
  rabbitHoleCount: 5,
  rabbitHoleDates: ["2025-01-15", "2025-02-20", "2025-03-14", "2025-04-07", "2025-05-09"],
  topRabbitHoleCategory: "AI & Machine Learning",
  rabbitHoleCategoryCounts: { ai: 3, engineering: 1, design: 1 },
  hourBuckets: MOCK_HOUR_BUCKETS,
  nightOwlPercent: 12.58,
  topHour: 12,
  topHourCount: 6449,
  topChannels: MOCK_CHANNELS,
  categoryBreakdown: MOCK_CATEGORIES,
  topCategory: MOCK_CATEGORIES[0],
  aiPercent: 40.3,
  engineeringPercent: 18.2,
  designPercent: 24.6,
  startupPercent: 16.9,
  builderEnergy: 0.88,
  dailyBuckets: MOCK_DAILY_BUCKETS,
  weeklyBuckets: MOCK_WEEKLY_BUCKETS,
  bingeSessions: [
    { date: '2025-03-14', count: 44 },
    { date: '2025-01-22', count: 41 },
    { date: '2024-12-08', count: 39 },
    { date: '2025-07-04', count: 37 },
    { date: '2025-09-19', count: 34 },
  ],
  topSearchTerms: [
    { term: 'claude api',               count: 12 },
    { term: 'cursor ai tutorial',        count: 9 },
    { term: 'figma variables',           count: 8 },
    { term: 'nextjs app router',         count: 7 },
    { term: 'framer motion',             count: 7 },
    { term: 'shadcn ui components',      count: 6 },
    { term: 'openai api',                count: 5 },
    { term: 'webflow interactions',      count: 5 },
    { term: 'design system tokens',      count: 5 },
    { term: 'react server components',   count: 4 },
    { term: 'design engineering',        count: 4 },
    { term: 'tailwind v4',               count: 3 },
    { term: 'typescript generics',       count: 3 },
    { term: 'vercel edge functions',     count: 3 },
    { term: 'three.js shaders',          count: 3 },
  ],
  featuredSearchTerms: [
    { term: 'claude api',               count: 12 },
    { term: 'cursor ai tutorial',        count: 9 },
    { term: 'figma variables',           count: 8 },
    { term: 'nextjs app router',         count: 7 },
    { term: 'framer motion',             count: 7 },
    { term: 'shadcn ui components',      count: 6 },
    { term: 'openai api',                count: 5 },
    { term: 'webflow interactions',      count: 5 },
    { term: 'design system tokens',      count: 5 },
    { term: 'react server components',   count: 4 },
    { term: 'design engineering',        count: 4 },
    { term: 'three.js shaders',          count: 3 },
  ],
  subscriptionCategories: [
    { label: 'Startups & Business',    count: 9,  color: '#fbbf24' },
    { label: 'AI & Machine Learning',  count: 7,  color: '#818cf8' },
    { label: 'Design & Creative',      count: 6,  color: '#f472b6' },
    { label: 'Fitness & Sport',        count: 5,  color: '#fb923c' },
    { label: 'Finance & Investing',    count: 3,  color: '#6ee7b7' },
    { label: 'Engineering & Dev',      count: 2,  color: '#34d399' },
  ],
  toolJourney: [
    { tool: 'Cursor',        earlyN: 4,   recentN: 52 },
    { tool: 'Claude Code',   earlyN: 0,   recentN: 52 },
    { tool: 'Figma',         earlyN: 120, recentN: 49 },
    { tool: 'ChatGPT',       earlyN: 10,  recentN: 5  },
    { tool: 'Webflow',       earlyN: 10,  recentN: 4  },
  ] as ToolLoyaltyRow[],
  longestStreakPerCategory: {},
};
