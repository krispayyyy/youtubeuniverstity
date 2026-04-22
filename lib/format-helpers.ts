// Formatting helpers shared by main-grid + cards.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).

/** Splits decimal hours into { h, m } for "2H 36M" display */
export function splitHoursMinutes(hours: number): { h: number; m: number } {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return { h, m };
}
