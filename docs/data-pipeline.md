# YouTube Analytics Data Pipeline

Plain-English handoff document. Everything runs in the browser — no backend, no server, no data ever leaves the user's machine.

---

## Where the data comes from

YouTube lets you download your own data via **Google Takeout** (`takeout.google.com`). The user requests their YouTube data and receives a zip file (sometimes split across multiple parts). Inside that zip are three files we care about:

| File | What it is |
|------|-----------|
| `watch-history.html` | Every video you watched, with title, channel, and timestamp |
| `search-history.html` | Every search you typed on YouTube, with timestamp |
| `subscriptions.csv` | Every channel you're subscribed to |

The zip structure varies by language/locale, so we match files by suffix rather than hardcoded path.

---

## Step 1: Parse the zip (`lib/parse-takeout.ts`)

The user drops their zip file into the upload modal. We use **JSZip** to open it in-browser, then:

- Find `watch-history.html` by suffix-matching inside the zip
- Parse each `<a>` element to extract: video title, channel name, timestamp
- Find `search-history.html` the same way
- Parse each entry to extract: query string, timestamp
- Find `subscriptions.csv`, parse with **PapaParse**

Output: three arrays — `WatchEntry[]`, `SearchEntry[]`, `Subscription[]`

---

## Step 2: Filter to relevant content (`lib/compute-stats.ts → filterToRelevant()`)

Raw watch history includes everything — cooking videos, sports, Shorts. We strip it down to only content relevant to the user's design/engineering journey:

- **Remove YouTube Shorts** (duration < ~60s, identified by URL pattern)
- **Keep only videos that match design/engineering categories** — if a video's channel doesn't match any category keyword, it's excluded

This filtered set is what all the stats are computed from. The raw counts (before filtering) are preserved separately for context.

---

## Step 3: Categorize (`lib/categories.ts`)

Seven categories, each with a keyword list matched against channel names and video titles. First match wins.

| ID | Category | Examples |
|----|----------|---------|
| `ai` | AI & Machine Learning | Andrej Karpathy, Two Minute Papers |
| `design` | Design | The Futur, Figma, Dribbble |
| `engineering` | Engineering | Fireship, Theo, Kevin Powell |
| `startup` | Startup / Business | Y Combinator, My First Million |
| `productivity` | Productivity | Ali Abdaal, Thomas Frank |
| `culture` | Tech culture | MKBHD, Linus Tech Tips |
| `other` | Everything else | — |

Categories with `designRelevant: true` count toward the builder's core focus score.

---

## Step 4: Compute stats (`lib/compute-stats.ts → computeStats()`)

With filtered, categorized watch history and raw search history, we compute every field in the `YouTubeStats` interface. Key computations:

### Volume
- `totalVideos` — count of filtered watch entries
- `avgHoursPerDay` — `(totalVideos × 15 min) ÷ days in date range ÷ 60`. The `15 min` is a constant average video length (`AVG_VIDEO_MINUTES`), not a measured value.

### Time patterns
- `topHour` — which hour of day appears most in timestamps (0–23)
- `nightOwlPercent` — % of watches between midnight and 5 AM
- `weeklyBuckets` — watch count grouped by day of week

### Categories
- `topCategory` — highest-percentage category
- `categoryBreakdown` — all seven categories with counts and percentages
- `engineeringPercent`, `designPercent`, etc. — convenience fields

### Builder Energy (composite score, 0–1)
Four sub-scores combined into one number representing how focused and consistent the user's learning habit is:

```
builderEnergy =
  0.15 (base)
  + focusScore    × 0.35   (% of time in AI + design + engineering)
  + consistencyScore × 0.30   (how evenly spread across days of week)
  + volumeScore   × 0.20   (watches per day, capped at 100/day = 1.0)
```

### Top searches / themes (`lib/curation.ts → groupSearchesByTheme()`)
Raw search queries are bucketed into ~17 hand-defined themes using keyword lists. Each theme has a priority multiplier. Score = `log(matchCount + 1) × priority`. Top themes surface in the "Top Searches" card.

### Tool journey (`lib/compute-stats.ts → computeToolJourney()`)
For the Growth Ticker card, we detect tool usage from search history:

1. Define `TOOL_THEMES` — 8 tools with keyword arrays (e.g. Cursor → `['cursor', 'cursor ai', 'cursor editor', ...]`)
2. Split search history at **earliest date + 4 months** (the "early" period vs. "recent")
3. Count how many searches match each tool in each period → `earlyN`, `recentN`
4. Filter to tools with at least one search

This produces `toolJourney: ToolLoyaltyRow[]` — the raw data the Growth Ticker renders.

### Subscriptions
- `topChannels` — channels with the most watch activity
- `totalSubscriptions` — count of subscribed channels
- Top subscriptions sorted by watch count

### Streak / binge
- `longestStreak` — longest consecutive days with at least one watch
- `bingeSessions` — days where watch count was unusually high

---

## Step 5: Display

`computeStats()` returns a `YouTubeStats` object. That object flows into React state in `MainGridView` (`stories/youtube/FullStory.stories.tsx`). Every card reads directly from this state — no intermediate store, no derived state layer.

When the user uploads a new zip, `setStats(newStats)` triggers a re-render and every card updates simultaneously.

---

## Pre-built default data (`data/stats.json`)

For demo/first-load, `stats.json` is a pre-computed snapshot of real usage data. It's loaded via `DEFAULT_STATS` and used until the user uploads their own zip. Rebuild it with:

```bash
npm run build-stats
```

The build script runs `computeStats()` over the real takeout files and writes the output to `data/stats.json`.

---

## What a new user upload looks like end-to-end

```
User drops zip
  → JSZip opens it in browser
  → parseTakeout() extracts watch, search, subscription arrays
  → filterToRelevant() strips non-design content and Shorts
  → computeStats() runs all calculations
  → setStats(newStats) updates React state
  → Every card re-renders with the user's real data
```

Total time: ~1–3 seconds depending on zip size. No network requests.

---

## Key files

| File | Role |
|------|------|
| `lib/parse-takeout.ts` | Zip parsing, HTML/CSV extraction |
| `lib/compute-stats.ts` | All calculations, YouTubeStats interface |
| `lib/categories.ts` | Category keyword lists |
| `lib/curation.ts` | Search theme grouping |
| `lib/tool-loyalty-data.ts` | ToolLoyaltyRow type, helper functions |
| `components/ui/upload-modal.tsx` | Upload UI, progress display |
| `stories/youtube/FullStory.stories.tsx` | MainGridView, all card renders |
| `stories/youtube/DataStories.stories.tsx` | Modal components, persona definitions |
| `data/stats.json` | Pre-built default stats |
