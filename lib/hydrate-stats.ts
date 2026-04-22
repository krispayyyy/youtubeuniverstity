// Re-hydrate Date fields that JSON.stringify serialized to ISO strings.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).

import rawDefaultStats from "@/data/stats.json";
import type { YouTubeStats } from "@/lib/compute-stats";
import { AVG_VIDEO_MINUTES } from "@/lib/compute-stats";

/** Re-hydrate Date fields that JSON.stringify serialized to ISO strings */
export function hydrateStats(raw: typeof rawDefaultStats): YouTubeStats {
  const base = {
    ...(raw as unknown as YouTubeStats),
    dateRange: {
      earliest: new Date(raw.dateRange.earliest as unknown as string),
      latest:   new Date(raw.dateRange.latest   as unknown as string),
    },
    weeklyBuckets: raw.weeklyBuckets.map((b) => ({
      ...b,
      weekStart: new Date(b.weekStart as unknown as string),
    })),
  };
  // Derive avgHoursPerDay if missing (e.g. stats.json built before this field was added)
  return {
    ...base,
    avgHoursPerDay: base.avgHoursPerDay ?? (base.avgVideosPerDay * AVG_VIDEO_MINUTES / 60),
    rabbitHoleCount: base.rabbitHoleCount ?? 0,
    rabbitHoleDates: base.rabbitHoleDates ?? [],
    topRabbitHoleCategory: base.topRabbitHoleCategory ?? "AI & Machine Learning",
    rabbitHoleCategoryCounts: base.rabbitHoleCategoryCounts ?? {},
    longestStreakPerCategory: base.longestStreakPerCategory ?? {},
    toolJourney: base.toolJourney ?? [],
  };
}

export const DEFAULT_STATS: YouTubeStats = hydrateStats(rawDefaultStats);
