// Content data for FAQ + Methodology accordion pages.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).

export const FAQ_ITEMS = [
  { q: "Do we store your data?", a: "No. Everything runs entirely in your browser — your Takeout file never touches a server. Close the tab and it's gone." },
  { q: "What file do I need?", a: "A Google Takeout export with YouTube history and subscriptions selected. No login required — just export, upload, and explore." },
  { q: "Is this all my watch history?", a: "Not quite — by design. Shorts, music, gaming, and entertainment are all excluded. This dashboard is focused on how you learn, not cute pet videos." },
];

export const METHODOLOGY_ITEMS = [
  { label: "Videos counted", detail: "Each entry in watch-history.html is one video. Re-watches within 15 seconds are filtered as duplicates." },
  { label: "Categories", detail: "Titles and channel names are matched against keyword lists for AI, design, engineering, and startup. Everything else is excluded." },
  { label: "Builder Energy", detail: "A composite score across category balance, daily consistency, and total volume. Ranges 0–1." },
  { label: "Night owl %", detail: "How much of your watching happened between midnight and 5am." },
  { label: "Peak hour", detail: "The single hour of day where you watched the most, across your full history." },
  { label: "Binge days", detail: "Days with 15 or more videos. Your biggest single-day deep dives." },
  { label: "Rabbit holes", detail: "Days where 85% or more of your watches landed in one category, with at least 6 total. Signals a real focus day." },
  { label: "Longest streak", detail: "Most consecutive days with 5 or more videos in one category." },
  { label: "Top channel", detail: "The channel you've watched the most individual videos from." },
  { label: "Searches", detail: "Your most repeated search terms, surfaced from your search history and ranked by frequency." },
];
