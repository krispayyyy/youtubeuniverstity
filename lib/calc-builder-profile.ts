// Builder-energy score → profile tier mapping.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).

// display = the bar fill target for that tier (used when the user explores)
export const BUILDER_PROFILES = [
  {
    id:      "intern"  as const,
    label:   "Eng Intern",
    range:   [0, 59]   as [number, number],
    display: 30,
    desc:    "Taking everything in, committing to nothing. Exploring the surface — still finding your stack.",
  },
  {
    id:      "pr"      as const,
    label:   "PR Pusher",
    range:   [60, 79]  as [number, number],
    display: 70,
    desc:    "Shipping consistently across the stack. Solid breadth, starting to build depth in one place.",
  },
  {
    id:      "builder" as const,
    label:   "Full-Stack Builder",
    range:   [80, 100] as [number, number],
    display: 100,
    desc:    "Deep in the stack, no half measures. High focus, strong output — fully committed.",
  },
] as const;

export type BuilderProfileId = (typeof BUILDER_PROFILES)[number]["id"];

export function calcBuilderProfile(score: number): BuilderProfileId {
  if (score <= 59) return "intern";
  if (score <= 79) return "pr";
  return "builder";
}
