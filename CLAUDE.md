# YouTube University — Public Repo

This is the **public-facing** version of a private development repo. It contains only the polished grid visualization and its exact dependencies.

**Live site:** https://krispayyyy.github.io/youtubeuniverstity/
**GitHub:** https://github.com/krispayyyy/youtubeuniverstity

---

## Source repo

The private source repo is at `~/Desktop/Code/Youtube Extract` (GitHub: `krispayyyy/youtube-extractor`, private). That repo contains drafts, experiments, personal data, internal tooling, and course materials. This public repo is a curated subset.

---

## What's different from the source

| Aspect | Source repo | This repo |
|---|---|---|
| Story files | Many stories (30+) | 1 story: Visualization |
| DataStories / EnjProgress | In `stories/youtube/` with Storybook Meta exports | Moved to `components/youtube/modals/` (no Meta, not indexed by Storybook) |
| Raw data imports | `DataStories` imports `watch-history.json` + `search-history.json` | Replaced with empty arrays — modals show graceful defaults |
| Asset paths | Absolute (`/sounds/tick.mp3`) | Relative (`./sounds/tick.mp3`) for GitHub Pages subpath |
| Personal references | Karim, Rauno, Devouring Details in comments | All scrubbed to generic language |
| Personal URLs | `youtube-profile.vercel.app/karim-saleh` | `youtubeuniverstity.vercel.app` |
| Filenames | `karim-saleh-sphere-loop.mp4` | `sphere-loop.mp4` |
| Video files | Original .mov (109MB+) | Compressed .mp4 (1-10MB) |
| Dependencies | gsap, three, dialkit, lucide-react, motion | Only what's used by the grid |
| package.json name | `devour-components` | `youtubeuniverstity` |

---

## Deployment

GitHub Pages auto-deploys on every push to `main` via `.github/workflows/deploy.yml`. The workflow runs `npm run build-storybook` and deploys the `storybook-static/` output.

---

## Syncing changes from source

This repo does NOT auto-sync from the source. When changes are made in the source repo, they must be manually copied here with scrubs applied. The source repo's CLAUDE.md has the full sync checklist.

**Key scrubs when copying FullStory.stories.tsx from source:**

1. Replace personal URLs/filenames (`karim-saleh` → generic)
2. Fix import paths (`./DataStories.stories` → `../../components/youtube/modals/DataStories`)
3. Change meta title (`YouTube/FullPage` → `YouTube University`)
4. Convert asset paths to relative (`/sounds/` → `./sounds/`)
5. Remove draft story exports (keep only `Visualization`)
6. Remove Rauno/Karim/Devouring Details comment attributions

**Verification after sync:**

```bash
# Check no personal refs leaked
grep -rni "karim\|rauno\|devouring" --include="*.tsx" --include="*.ts" --include="*.css" .

# Build
npx storybook build

# Push (auto-deploys)
git add -A && git commit -m "Sync from source" && git push
```

---

## Running locally

```bash
npm install
npm run storybook
# Open http://localhost:6006 → YouTube University → Visualization
```

---

## Key files

| File | Role |
|---|---|
| `stories/youtube/FullStory.stories.tsx` | The grid — all cards, layout, state, upload wiring |
| `components/youtube/modals/DataStories.tsx` | Modal components (Top Channel, Subscriptions, Late Night Learning) |
| `components/youtube/modals/EnjProgress.tsx` | Design Engineer Progress ruler component |
| `stories/youtube/mock-data.ts` | Mock data for isolated development |
| `data/stats.json` | Pre-built demo stats (default state before upload) |
| `app/globals.css` | Theme system (dark/light CSS variables) |
| `lib/compute-stats.ts` | All stat calculations from raw YouTube data |
| `lib/parse-takeout.ts` | In-browser zip parsing for YouTube Takeout |
| `.github/workflows/deploy.yml` | GitHub Pages deployment workflow |
