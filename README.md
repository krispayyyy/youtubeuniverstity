# YouTube University

A personal analytics dashboard that parses your YouTube Takeout data entirely in-browser and renders it as a polished, data-driven grid. No backend, no server, no data leaves your machine.

Built with Next.js, Storybook, TypeScript, and Framer Motion.

---

## What it does

Drop in your YouTube Takeout zip and every card updates with your real watch history, search patterns, subscription data, and tool usage trends. The dashboard is designed as a personal "wrapped"-style report for designers and engineers who learn heavily through YouTube.

---

## Getting started

```bash
npm install
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) and navigate to **YouTube > FullPage > Polished grid**. That's the main dashboard.

---

## Getting your data

1. Go to [takeout.google.com](https://takeout.google.com)
2. Deselect everything, then select only **YouTube and YouTube Music**
3. Under YouTube, select: **history** (watch + search) and **subscriptions**
4. Export and download the zip (may come in multiple parts — upload any one of them)
5. Drop the zip into the upload modal in the dashboard

> Works with any language/locale. Shorts are automatically filtered out.

---

## Data pipeline overview

All computation is client-side JavaScript. The pipeline runs in this order:

```
zip drop -> parse (JSZip) -> filter -> categorize -> compute -> render
```

Full technical detail in [`docs/data-pipeline.md`](docs/data-pipeline.md).

### Key files

| File | Role |
|------|------|
| `lib/parse-takeout.ts` | Opens zip, extracts watch/search/subscription entries |
| `lib/compute-stats.ts` | All calculations — categories, scores, tool journey |
| `lib/categories.ts` | Keyword lists for 7 content categories |
| `lib/curation.ts` | Groups raw searches into named themes |
| `lib/tool-loyalty-data.ts` | Tool trend helpers and ToolLoyaltyRow type |
| `components/ui/upload-modal.tsx` | Upload UI with progress and error handling |
| `stories/youtube/FullStory.stories.tsx` | Main grid — all cards, state, upload wiring |
| `data/stats.json` | Pre-built demo stats (for default state before upload) |

---

## Cards and what drives them

| Card | Data source |
|------|------------|
| Builder Energy | `stats.builderEnergy` — composite score (focus + consistency + volume) |
| Late Night Learning | `stats.nightOwlPercent` — % of watches midnight-5AM |
| Growth Ticker | `stats.toolJourney` — computed from search history, split at 4-month mark |
| Top Searches | `stats.topThemes` — search queries bucketed into named themes |
| Peak Hour | `stats.topHour` — most common watch hour |
| After Midnight | `stats.nightOwlPercent` |
| Most Intense Month | `stats.weeklyBuckets` + date range |
| Subscriptions | `stats.topChannels`, `stats.totalSubscriptions` |
| Category Breakdown | `stats.categoryBreakdown` |
| Longest Streak | `stats.longestStreak`, `stats.longestStreakPerCategory` |

---

## Tech stack

- **Next.js** — framework
- **Storybook (nextjs-vite)** — component dev environment; main dashboard lives here
- **TypeScript** — all computation is fully typed
- **JSZip** — in-browser zip parsing
- **PapaParse** — CSV parsing for subscriptions
- **Framer Motion** — card animations
- **Tailwind CSS 4** — styling

---

## License

MIT
