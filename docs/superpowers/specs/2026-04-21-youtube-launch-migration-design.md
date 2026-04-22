# YouTube University Launch Migration — Design Spec

**Date:** 2026-04-21
**Target:** Vercel-hosted Next.js 16 app at `youtubeuniverstity.vercel.app` (custom domain optional, TBD)
**Source repo:** https://github.com/krispayyyy/youtubeuniverstity (branch: `main`)
**Current deploy:** GitHub Pages serving `storybook-static/` at https://krispayyyy.github.io/youtubeuniverstity/

---

## 1. Problem Statement

The YouTube University site is a Next.js 16 project whose **entire production app is assembled inside a single Storybook story file** (`stories/youtube/FullStory.stories.tsx`, 6,140 lines containing 60 inline functions). The `app/page.tsx` is a stub that tells visitors to run Storybook locally. As a result, the "live site" is a deployed Storybook at `/youtubeuniverstity/` on GitHub Pages — a development tool masquerading as a product.

For the site to live as a real Next.js app on Vercel with native URLs, the five shipping stories (`Visualization`, `Info`, `FAQ`, `How We Calculate`, `Interview Agents`) must exist as importable React components under `components/youtube/`, consumed by both Storybook (for local dev/tuning) and the `app/` directory (for production Next.js routes).

**Non-goal:** redesigning, refactoring, or polishing. Every animation, spring, color, and timing is intentional. Extraction is mechanical code movement with three targeted adjustments: `"use client"` directives, `linkTo` → Next.js navigation conversion, and asset path unification.

---

## 2. Current State (audited 2026-04-21)

### 2.1 What's already extracted (✅ DO NOT re-extract)

**Verified via `ls components/`, `ls lib/`, `ls data/`, and reading top-60 imports of the story file.**

- **`components/youtube/` (13 files):** `builder-energy.tsx`, `category-bars.tsx`, `channel-subscribe-morph-pill.tsx`, `contribution-heatmap.tsx`, `filter-bar.tsx`, `growth-ticker.tsx`, `modal-list-styles.ts`, `odometer.tsx`, `share-card-iteration-two.tsx`, `theme-provider.tsx`, `top-searches.tsx`, `youtube-line-graph.tsx`
- **`components/youtube/modals/` (2 files):** `DataStories.tsx` (2,781 lines — TopChannelCardInner/Modal, SubscriptionsCardInner/Modal, LateNightLearningModal, LATE_NIGHT_PERSONAS, TOP_CHANNEL_MODAL_HERO_VIDEO, special-channel helpers), `EnjProgress.tsx` (1,471 lines — EnjProgress, ProgressPill, DEFAULT_GLASS, ChecklistModal1)
- **`components/ui/` (7 files + icons/):** `dot-matrix-cta.tsx` (+ `CTAContainer`, `SIZE`), `elevated-section.tsx`, `glass-surface.tsx` + `glass-surface.css`, `pixel-reveal.tsx`, `upload-modal.tsx`, and `icons/` (30+ svg components)
- **`components/particles/` (2 files):** `particle-morph.tsx`, `shapes.ts` (ALL_SHAPES_X/Y, SHAPE_NAMES, ATOM/ROCKET/PLAY_SHAPE_INDEX)
- **`components/` (hooks + utils):** `use-sound.ts`, `use-is-hydrated.ts`, `use-media-query.ts`, `use-scroll-end.ts`, `clamp.ts`, `line-minimap.tsx`
- **`lib/`:** `categories.ts`, `compute-stats.ts` (YouTubeStats type, formatHour, AVG_VIDEO_MINUTES, computeDesignEngineerScore), `curation.ts`, `parse-takeout.ts`, `tool-loyalty-data.ts` (ToolLoyaltyRow type), `utils.ts`
- **`data/`:** `stats.json` (default stats), `channel-picks.json`
- **`app/globals.css`:** Tailwind v4 `@theme`, PP Neue Montreal @font-face, Geist Mono via Google Fonts, light/dark theme variables keyed to `[data-theme]`
- **`app/layout.tsx`:** `suppressHydrationWarning` on `<html>`, `ThemeProvider` wrapping children, basic metadata

### 2.2 What's still inline in `stories/youtube/FullStory.stories.tsx` (6,140 lines)

**Total inline scope: 6,140 lines across one file.** Verified via `grep -cE "^(function|export function) "` → 60 function declarations.

#### 2.2a Shipping story exports (what end users see) — MUST extract

| Story name | Line | Renders | Becomes Next.js route |
|---|---|---|---|
| `Visualization` | 5281 | `<MainGridGinnView orangeColor="#E14920" />` | `/` |
| `InfoStory` | 5335 | `<InfoPageView />` | `/info` |
| `FAQStory` | 5340 | `<FAQPageView />` | `/faq` |
| `HowWeCalculateStory` | 5345 | `<MethodologyPageView />` | `/how-we-calculate` |
| `InterviewAgentsStory` | 5350 | `<InterviewAgentsView />` | `/interview-agents` |

#### 2.2b Inline functions — production chain

**Production root chain:**
- `MainGridGinnView` (4922, ~380 lines) — Ginn theme CSS wrapper around MainGridView
- `MainGridView` (3993, ~929 lines) — the scene. Owns all upload/modal state, renders the grid, mounts every card and modal.

**Page views (static, linkTo-navigation):**
- `InfoPageView` (977) — landing page with nav rows
- `FAQPageView` (1005) — FAQ accordion
- `MethodologyPageView` (1028) — methodology accordion
- `InterviewAgentsView` (1136) — 3-card pricing grid
- `PricingCard` (1059) — used by InterviewAgentsView

**Page shell/navigation primitives (used by pages):**
- `InfoPageBackLink` (793), `InfoPageShell` (810), `RowDivider` (822), `InfoIconBox` (834), `AccordionRow` (855), `InfoNavRow` (927), `pi()` animation helper (968)

**MainGridView modals:**
- `ShareModal` (323, ~360 lines) — share-card + X-post compositor (uses `fetch("./sphere-loop.mp4")` — asset path issue; see §2.4)
- `MorphExplorer` (2312) — focus shape picker
- `TopSearchesExplorer` (2531) — searches deep-dive
- `BuilderEnergyExplorer` (2670) — builder energy deep-dive
- `MG_RestDayModal` (3367) — rest day modal
- `MG_LongestStreakModal` (3482) — longest streak modal
- `MG_ToolLoyaltyModal` (3758) — tool loyalty modal

**MainGridView cards/leaves:**
- `GridCard` (1994) — base card primitive with grid-placement + bento-clip
- `GinnSmallCardSVG` (2144) — SVG-drawn small-card variant with corner notches
- `StreakPillMain` (3302) — streak pill
- `MG_RestDayBarChart` (3335) — DOW bar chart (used in rest-day card + modal)
- `MG_ToolLoyaltyCard` (3729) — tool loyalty card preview
- `PatternFilter` (3849) — multi-select dropdown
- `BentoResizeHandle` (3186) — dev-mode bento edit handles
- `CardMeta` (1893) — card meta-row (index + tag)

**Hero/top-of-page primitives (used by MainGridView + pages):**
- `PageCTABar` (1169) — fixed top-right bar with Share + Theme + Upload buttons
- `PageThemeToggle` (682) — theme toggle button
- `PageFooter` (741) — page footer (with link to Info)
- `RhythmCard` (1740) — heatmap/line-graph toggle card (used in MainGridView + FullStoryView)
- `BigStat` (1486) — big-stat cell (three across in MainGridView hero)
- `EnjStatsPill` (1665) — design engineer progress stats pill
- `ViewToggle` (1390) — heatmap/linegraph toggle inside RhythmCard
- `InfoIcon` (1474) — small info icon

**Sub-leaves (one-level-deep):**
- `Divider` (197), `Chapter` (206), `DomainRow` (227), `GhostAction` (253)

**Utilities + hooks (module scope):**
- `hydrateStats` (69), `DEFAULT_STATS` (94), `splitHoursMinutes` (103)
- `_focusLcgNoise` (116), `buildFocusColorMap` (155), `useIsDark` (178)
- `playTick` (1975), `playMainGridPop` (3295), `calcBuilderProfile` (2664)

**Constants (module scope):**
- `_FOCUS_N`, `_FOCUS_GOLDEN`, `FOCUS_SORTED_ORGANIC`, `FOCUS_SORTED_YOUTUBE`, `FOCUS_DIM` (focus color map system)
- `PAGE_MAX_W` (1100), `PAGE_PAD`
- `FAQ_ITEMS`, `METHODOLOGY_ITEMS` (content for pages)
- `CATEGORY_SHAPE`, `CATEGORY_SHORT` (category → shape/short-label maps)
- `MODAL_SPRING`, `MODAL_EXIT`, `MODAL_TITLE_STYLE`, `MODAL_CLOSE_BTN_STYLE` (modal tokens)
- `FOCUS_ALLOWED_SHAPES`, `FOCUS_ALLOWED_LABELS` (MorphExplorer)
- `TICK_COOLDOWN_MS`, `BE_TICK_COUNT`, `BE_TICK_H`, `BUILDER_PROFILES` (BuilderEnergy)
- `MG_ICON_COMPONENTS`, `MG_ALL_ICON_KEYS`, `MG_REST_DAY_ACTIVITIES`, `MG_toolLoyaltyTimeline`, `MG_toolLoyaltyMax`
- `STREAK_SPRINT_NAMES`, `STREAK_DOT_COLS`, `STREAK_DOT_FILL`, `STREAK_SPRING`, `STREAK_STAGGER_IN_MS`, `STREAK_STAGGER_IN_CAP`, `STREAK_STAGGER_OUT_MS`, `STREAK_STAGGER_OUT_CAP`, `STREAK_EXIT_DURATION`
- `FILTER_CATEGORIES`, `PATTERN_FILTER_OPTS`, `ALL_PATTERN_IDS`

#### 2.2c Orphan / dev-only exports — do NOT extract; preserve for post-launch cleanup

Confirmed dev-only via `meta.excludeStories: ['MainGridView', 'MainGridGinnView', 'MainGridGinnMonoView', 'MergeTimelineView', 'HoverTestView', 'GinnTestView']` AND by tracing which function gets rendered by the five shipping stories:

- `FullStoryView` (1209) — meta's `component` pointer (Docs tab only); a "merge timeline experiment" page. Not rendered by any shipping story. **Dead for production.**
- `MergeTimelineView` (1882) — dev experiment
- `MainGridGinnMonoView` (5303) — Geist Mono font experiment
- `GridView` (2891) — older grid variant (no shipping story renders it)
- `ScaleGridCard` (1914) — older card variant (appears used only inside GridView/dev variants — confirm during extraction)
- `HoverTestView` (5442), `InnerShadowCard` (5370), `GinnCard` (5646), `TraceDivider` (5740), `GinnTestView` (5771), `ScaleHoverGridView` (6018) — hover/design experiments

**Policy (preservation over cleanup, per Portfolio migration lesson):** leave dead code in the story file during migration. Flag for post-launch deletion. Safer than discovering a hidden reference mid-flight.

### 2.3 Story-to-scene navigation via `linkTo` — MUST convert

The four page views each call `@storybook/addon-links`'s `linkTo(title, story)` to navigate:

- `linkTo("YouTube University", "Visualization")` — back to main (called from InfoPageView:978, PageFooter:742)
- `linkTo("YouTube University", "Info")` — to info (InfoPageBackLink from FAQ/Methodology/InterviewAgents pages, and PageFooter:742)
- `linkTo("YouTube University", "Interview Agents")` — to agents (PageFooter:759)
- `linkTo("YouTube University", "FAQ")` — (InfoPageView:979)
- `linkTo("YouTube University", "How We Calculate")` — (InfoPageView:980)
- `linkTo("YouTube University", "Interview Agents")` — (InfoPageView:981, PageThemeToggle nearby)

`linkTo` is a Storybook-only addon and will not resolve in Next.js production. Grep verified: 9 usages, all inside extracted page views or primitives. Conversion strategy in §4.3.

### 2.4 Asset path mixing — MUST unify for Next.js

Audited via `grep -rE "\.(mp3|mp4|wav|png|otf|mov)"` across `stories/` and `components/`:

**Relative paths (`./...`) — break in Next.js:**
- `stories/youtube/FullStory.stories.tsx:393` — `fetch("./sphere-loop.mp4")` (ShareModal recording)
- `stories/youtube/FullStory.stories.tsx:1984` — `new Audio("./sounds/tick.mp3")` (playTick helper)
- `stories/youtube/FullStory.stories.tsx:3297` — `new Audio("./sounds/pop-click.wav")` (playMainGridPop)
- `components/youtube/builder-energy.tsx:17` — `new Audio("./sounds/pop-click.wav")`
- `components/youtube/modals/DataStories.tsx:587, 1358` — `new Audio("./sounds/...")`
- `components/youtube/modals/DataStories.tsx:1499` — `TOP_CHANNEL_MODAL_HERO_VIDEO = "./media/top-channel-modal-hero.mp4"`
- `components/youtube/modals/DataStories.tsx:1817-1819` — `avatarSrc: "./avatars/..."`
- `components/youtube/modals/EnjProgress.tsx:450` — `useSound("./sounds/tick.mp3", ...)`

**Absolute paths (`/...`) — correct for Next.js:**
- `stories/youtube/FullStory.stories.tsx:3122` — `poster="/charcterim.png"`
- `stories/youtube/FullStory.stories.tsx:3152` — `src="/character-pixel.png"`
- `components/youtube/youtube-line-graph.tsx:217, 218, 626, 627` — `useSound("/sounds/...")`
- `components/youtube/category-bars.tsx:38` — `new Audio("/sounds/tick.mp3")`

**External URLs (Cloudflare R2, unaffected):**
- `https://pub-53930e9a5ab94f018a9f8c1509ea8e27.r2.dev/Avatar{1,2,3}.mp4` (DataStories.tsx:1817-1819, FullStory:3121)

**Unification target:** absolute paths (`/sounds/tick.mp3`, `/media/top-channel-modal-hero.mp4`, `/avatars/character1.png`, `/sphere-loop.mp4`) — the Next.js standard. These resolve both in Storybook (which mounts `public/` as `staticDirs` in `.storybook/main.ts:14`) and in Next.js (which serves `public/` at root). **This is strictly safer than relative paths**, which break in Next.js whenever the current URL is not the root.

### 2.5 Baseline build state — BROKEN

Ran `npm run build` from current `main`:

- **Compile:** ✓ Passes (Next.js 16 / Turbopack, 913ms)
- **TypeScript:** ✗ **FAILS** on 10+ errors, all in already-extracted components:
  - `components/youtube/builder-energy.tsx:313` — invalid `exit` field inside Framer Motion `Transition` object
  - `components/youtube/growth-ticker.tsx:869, 878` — readonly tuple not assignable to mutable `ToolLoyaltyRow[]`
  - `components/youtube/modals/DataStories.tsx:1973` — duplicate JSX attribute on same element
  - `components/youtube/modals/DataStories.tsx:2541` — `Story` (undefined identifier) referenced in comment-like JSX
  - `components/youtube/modals/EnjProgress.tsx:473, 842` — useSound play() called with 1 arg (play takes 0)
  - `components/youtube/modals/EnjProgress.tsx:530, 856` — RefObject mismatch (React 19 strict ref typing)
  - `components/youtube/odometer.tsx:147` — calling a function with 2 args that expects 1

These errors do not block Storybook (Vite doesn't strict-typecheck during dev). They block Next.js production build. **Must be fixed in Phase 0 before any extraction.** The policy is identical to Portfolio's Task 0: fix baseline, then extract.

The CSS build also warns: the `@import url('https://fonts.googleapis.com/css2?family=Geist+Mono...')` in `app/globals.css:2` comes after other rules, violating CSS spec. Not a build blocker but flag for cleanup — move the Google Fonts `@import` to the top of the file, or switch to `next/font/google` loader.

### 2.6 Deploy state — MUST swap

- **Current:** `.github/workflows/deploy.yml` runs `npm run build-storybook` on push to main, uploads `storybook-static/` to GitHub Pages.
- **Target:** Vercel auto-deploy of the Next.js app. GitHub Pages workflow either disabled (recommended — rename to `.yml.disabled` or delete) or kept as an orthogonal Storybook preview under `/youtubeuniverstity/` path (subpath must be preserved in that case; the current public paths are authored for this subpath).

### 2.7 Environment and tooling — clean

- **No `.env` / `.env.local`** — project uses no secrets. No API routes. No Resend, no external APIs beyond the R2 asset URLs.
- **No dynamic imports with SSR implications** — `import("html-to-image")` at `FullStory.stories.tsx:383` is runtime-lazy inside an event handler; safe.
- **`tsconfig.json:40`** already excludes `stories` from typecheck — good for dev speed, bad for the ongoing migration where extracted components must typecheck cleanly (they'll live outside `stories/` anyway — no change needed).
- **No DialKit, no Agentation** — confirmed via grep: 0 files matching either name (outside CLAUDE.md). No dev-vs-prod gating needed for these, which simplifies extraction dramatically compared to the Portfolio migration.
- **Storybook config** (`.storybook/main.ts`) uses `@storybook/nextjs-vite` builder with `staticDirs: ["../public"]` — public/ assets resolve at `/` in Storybook. No changes needed.

---

## 3. Scope

### 3.1 Public surface (production Next.js routes)

| URL | Component |
|---|---|
| `/` | `<MainGrid orangeColor="#E14920" />` (extracted from `MainGridGinnView` wrapping `MainGridView`) |
| `/info` | `<InfoPage />` |
| `/faq` | `<FaqPage />` |
| `/how-we-calculate` | `<MethodologyPage />` |
| `/interview-agents` | `<InterviewAgentsPage />` |

### 3.2 Visitor-facing controls that ship

From the Visualization story (`MainGridView`):
- Theme toggle (dark/light via `PageThemeToggle` inside `PageCTABar`)
- Share modal (`ShareModal` — card capture via `html-to-image`, X-intent post, PNG download, video compositing path)
- Upload modal (`UploadModal` — zip drop → parse → compute stats → re-render)
- Category filter bar (selects which cards are enabled)
- Pattern filter dropdown (multi-select card visibility)
- 7 explorer modals (Morph, Top Searches, Builder Energy, Rest Day, Longest Streak, Tool Loyalty, Top Channel, Subscriptions, Late Night, Enj Progress Checklist)
- Card hover/press states, tick sounds on interactions
- Focus shape dropdown (4 options: sphere/cube/torus/play)

From the info pages:
- Cross-page navigation (Info ↔ FAQ, Info ↔ Methodology, Info ↔ Interview Agents, all pages ↔ Visualization)
- Accordion rows (FAQ + Methodology)
- Pricing card hover states (Interview Agents)

### 3.3 Stripped from production

- `FullStoryView` and its chapter-scroll content — dev experiment, not a shipping page
- All other orphan `export function` story exports listed in §2.2c
- `linkTo` calls (replaced by Next.js routing — see §4.3)
- `@storybook/addon-links` dependency in the Next.js production bundle (tree-shaken because extracted components won't import it; re-imported only in the story wrappers)

### 3.4 Storybook retention

All five shipping stories still run locally via `npm run storybook`. After extraction, their render functions become thin wrappers:

```tsx
// stories/youtube/FullStory.stories.tsx (post-migration)
export const Visualization: Story = {
  name: "Visualization",
  render: () => <MainGrid orangeColor="#E14920" />,
};
export const InfoStory: Story = {
  name: "Info",
  render: () => <InfoPage onNavigate={storybookLinkNavigator} />,
};
// ... etc.
```

where `storybookLinkNavigator` is a small adapter that maps `"info" | "faq" | ...` onto the `linkTo` calls, preserving current Storybook navigation behavior.

### 3.5 Non-goals

- Redesign, refactor, or "while I'm here" improvements
- New features, new cards, new controls
- Adding analytics, error monitoring, or SEO beyond basic metadata (flagged as post-launch)
- Rewriting `components/youtube/modals/DataStories.tsx` or `EnjProgress.tsx` despite their size (they work; don't touch them)
- Shipping `FullStoryView` (the merge timeline experiment) — preserved as dead code only
- Migrating the private source repo (`Youtube Uni (private)`) — this spec is strictly for the public repo

---

## 4. Architecture

### 4.1 Dual-target, single source of truth

```
components/
  youtube/
    (existing extracted components remain unchanged)
    main-grid/                          ← new directory
      MainGrid.tsx                      (public export: extracts MainGridGinnView + MainGridView
                                         into one component; Ginn theme + accentColor prop)
      state.ts                          (deriveStreak + sprintLabel + other useMemo logic)
      constants.ts                      (MODAL_SPRING, MODAL_EXIT, MODAL_TITLE_STYLE,
                                         MODAL_CLOSE_BTN_STYLE, FOCUS_ALLOWED_SHAPES,
                                         FOCUS_ALLOWED_LABELS, TICK_COOLDOWN_MS,
                                         BE_TICK_COUNT, BE_TICK_H, BUILDER_PROFILES,
                                         MG_ICON_COMPONENTS, MG_ALL_ICON_KEYS,
                                         MG_REST_DAY_ACTIVITIES, MG_toolLoyaltyTimeline,
                                         MG_toolLoyaltyMax, STREAK_* constants,
                                         FILTER_CATEGORIES, PATTERN_FILTER_OPTS,
                                         ALL_PATTERN_IDS, CATEGORY_SHAPE, CATEGORY_SHORT)
      cards/
        GridCard.tsx
        GinnSmallCardSVG.tsx
        StreakPillMain.tsx
        RestDayBarChart.tsx             (MG_RestDayBarChart — MG_ prefix dropped)
        ToolLoyaltyCard.tsx             (MG_ToolLoyaltyCard)
        PatternFilter.tsx
        BentoResizeHandle.tsx
        CardMeta.tsx
      modals/
        ShareModal.tsx
        MorphExplorer.tsx
        TopSearchesExplorer.tsx
        BuilderEnergyExplorer.tsx
        RestDayModal.tsx                (MG_RestDayModal)
        LongestStreakModal.tsx          (MG_LongestStreakModal)
        MainGridToolLoyaltyModal.tsx    (MG_ToolLoyaltyModal — renamed to disambiguate
                                         from the unrelated ToolLoyaltyModal already
                                         exported by components/youtube/modals/DataStories.tsx:1075)
      hooks.ts                          (useIsDark)
      sounds.ts                         (playTick + playMainGridPop module-scope audio
                                         singletons; unchanged behavior)
      index.ts                          (public exports: MainGrid)

    pages/                              ← static page views
      InfoPage.tsx
      FaqPage.tsx
      MethodologyPage.tsx
      InterviewAgentsPage.tsx
      content.ts                        (FAQ_ITEMS, METHODOLOGY_ITEMS)
      shell/
        InfoPageShell.tsx
        InfoPageBackLink.tsx
        RowDivider.tsx
        InfoIconBox.tsx
        AccordionRow.tsx
        InfoNavRow.tsx
        animation.ts                    (pi() helper)
      PricingCard.tsx
      nav.ts                            (PageTarget type + useNavigateToPage hook — see §4.3)

    chrome/                             ← top-of-page primitives
      PageCTABar.tsx
      PageThemeToggle.tsx
      PageFooter.tsx
      BigStat.tsx
      EnjStatsPill.tsx
      RhythmCard.tsx                    (+ ViewToggle + InfoIcon inline)

    hero/
      Divider.tsx
      Chapter.tsx
      DomainRow.tsx
      GhostAction.tsx

    focus-color-map.ts                  (_FOCUS_N, FOCUS_SORTED_ORGANIC,
                                         FOCUS_SORTED_YOUTUBE, FOCUS_DIM,
                                         buildFocusColorMap, _focusLcgNoise)

lib/
  hydrate-stats.ts                      (hydrateStats + DEFAULT_STATS)
  format-helpers.ts                     (splitHoursMinutes)
  calc-builder-profile.ts               (calcBuilderProfile + BuilderProfileId type)
  page-constants.ts                     (PAGE_MAX_W, PAGE_PAD)

app/
  layout.tsx                            ← updated metadata + shared chrome if reused
  page.tsx                              ← renders <MainGrid orangeColor="#E14920" />
  info/page.tsx                         ← renders <InfoPage />
  faq/page.tsx                          ← renders <FaqPage />
  how-we-calculate/page.tsx             ← renders <MethodologyPage />
  interview-agents/page.tsx             ← renders <InterviewAgentsPage />
  globals.css                           ← Google Fonts @import moved to top (optional cleanup)

stories/
  youtube/
    FullStory.stories.tsx               ← thinned to ~400 lines:
                                          - 5 shipping story wrappers (render extracted components
                                            with linkTo-based onNavigate adapter)
                                          - preserved orphan exports (dev experiments)
    mock-data.ts                        ← unchanged

.github/workflows/
  deploy.yml                            ← DELETED or renamed .disabled (Vercel replaces it)
```

### 4.2 Client directive

Every extracted component that uses hooks, event handlers, Framer Motion, or browser APIs requires `"use client"` as line 1. This is the **only line added** that wasn't in the original story code (aside from explicit import statements and exports).

Pure data/constants files (`content.ts`, `constants.ts`, `format-helpers.ts`, `calc-builder-profile.ts`, `page-constants.ts`) do NOT need `"use client"`.

### 4.3 Navigation: `linkTo` → Next.js routes via prop injection

**Production principle (from Portfolio migration):** extracted components are agnostic to Storybook dev tools. Dev tooling lives in the Storybook wrapper; production is unaware of it. Apply the same principle to navigation.

**Pages accept a navigation callback prop:**

```tsx
// components/youtube/pages/nav.ts
export type PageTarget = "visualization" | "info" | "faq" | "methodology" | "agents";

export interface PageNavProps {
  onNavigate?: (target: PageTarget) => void;
}
```

**Production wiring (`app/info/page.tsx` etc.):**
```tsx
"use client";
import { useRouter } from "next/navigation";
import { InfoPage } from "@/components/youtube/pages/InfoPage";
import type { PageTarget } from "@/components/youtube/pages/nav";

const TARGET_TO_PATH: Record<PageTarget, string> = {
  visualization: "/",
  info: "/info",
  faq: "/faq",
  methodology: "/how-we-calculate",
  agents: "/interview-agents",
};

export default function Page() {
  const router = useRouter();
  return <InfoPage onNavigate={(t) => router.push(TARGET_TO_PATH[t])} />;
}
```

**Storybook wiring (inside `FullStory.stories.tsx` render function):**
```tsx
import { linkTo } from "@storybook/addon-links";

const STORY_TARGETS: Record<PageTarget, [string, string]> = {
  visualization: ["YouTube University", "Visualization"],
  info:          ["YouTube University", "Info"],
  faq:           ["YouTube University", "FAQ"],
  methodology:   ["YouTube University", "How We Calculate"],
  agents:        ["YouTube University", "Interview Agents"],
};

function navigateInStorybook(target: PageTarget) {
  const [title, name] = STORY_TARGETS[target];
  linkTo(title, name)();
}

export const InfoStory: Story = {
  name: "Info",
  render: () => <InfoPage onNavigate={navigateInStorybook} />,
};
```

**Inside extracted components** (e.g., `InfoPageView` becomes `InfoPage`):
```tsx
// Before:
const goBack = linkTo("YouTube University", "Visualization");
// ...
<InfoPageBackLink label="Visualization" onClick={goBack} />

// After:
export function InfoPage({ onNavigate }: PageNavProps) {
  const go = (target: PageTarget) => () => onNavigate?.(target);
  return (
    <InfoPageShell>
      <InfoPageBackLink label="Visualization" onClick={go("visualization")} />
      {/* ... */}
```

**Result:** `@storybook/addon-links` is imported ONLY in the story file. Next.js bundles are clean of it. Navigation works in both environments with zero shared code between them beyond the `PageTarget` type. If `onNavigate` is not provided (e.g., isolated Storybook story without wrapper), clicks are silently no-op — acceptable.

### 4.4 Asset path unification

Every path in `public/` should be referenced as `/assetname.ext` (Next.js convention). Strategy:

1. Grep all extracted files after extraction for `"./sounds/"`, `"./media/"`, `"./avatars/"`, `"./sphere-loop.mp4"`, `"./character*.png"`, `"./charcterim.png"`, `"./vid*.mp4"`.
2. Replace each with absolute path.
3. Verify in Storybook (still works — `staticDirs: ["../public"]` serves `public/` at `/`) and in `npm run dev` (Next.js default behavior).

Because some of these references live in already-extracted components (see §2.4 list), this is a small batch of find-and-replace edits, not a full-file refactor.

### 4.5 Why MainGridGinnView and MainGridView merge into one `MainGrid`

`MainGridGinnView` is a thin CSS-theme wrapper: it renders a `<style>` block with `--accent`, `--card-surface-bg`, and the Ginn-specific tick colors, then `<div className="mg-ginn-test"><MainGridView ginnMode accentColor={orangeColor} /></div>`. The Visualization story always renders it with `orangeColor="#E14920"`.

**Extraction plan:** `components/youtube/main-grid/MainGrid.tsx` exports a single `MainGrid` component that composes both: it wraps with the Ginn theme `<style>` block AND the `mg-ginn-test` `<div>` AND renders the grid body (formerly `MainGridView`). Props: `{ orangeColor?: string }`. Default value preserved (`#E14920`). The `ginnMode` prop inside `MainGridView` was always `true` via this wrapping; other callers (non-Ginn `GridView` in dev) stay inside the story file as dead-code or get deleted post-launch.

This consolidation is safe because:
- Only one shipping call site (`Visualization` story) uses this chain
- `MainGridGinnView` has no other consumers (verified via grep)
- `MainGridGinnMonoView` (font experiment) calls `MainGridGinnView` — but it's dev-only and stays in the story file

### 4.6 Theme toggle: existing ThemeProvider stays in place

`app/layout.tsx` already wires `ThemeProvider` from `components/youtube/theme-provider.tsx`. Production theme toggle must use the same provider. `PageThemeToggle` currently reads `document.documentElement.getAttribute("data-theme")` and sets it directly (confirmed via reading lines 682-740 of the story file — the toggle uses DOM attribute, not React context). After extraction, leave this behavior unchanged — `ThemeProvider` in layout.tsx already sets up the attribute on hydration. No refactor needed.

---

## 5. Migration Strategy

### 5.1 Phases (sequential; each phase ends in a green state — TS clean, Storybook renders)

**Phase 0 — Baseline repair.** Fix the 10+ existing TypeScript errors blocking production build. Commit. Verify `npm run build` → `✓ Compiled successfully + Running TypeScript ...` clean.

**Phase 1 — Module-scope helpers.** Move pure-function and pure-constant extractions first (lowest risk). Destinations: `lib/hydrate-stats.ts`, `lib/format-helpers.ts`, `lib/calc-builder-profile.ts`, `lib/page-constants.ts`, `components/youtube/focus-color-map.ts`, `components/youtube/main-grid/constants.ts`, `components/youtube/pages/content.ts`, `components/youtube/main-grid/sounds.ts`, `components/youtube/main-grid/hooks.ts`.

**Phase 2 — Page shell + static pages (no state, no modals — simpler than main grid).**
1. Page shell primitives → `components/youtube/pages/shell/*.tsx`
2. `PricingCard` → `components/youtube/pages/PricingCard.tsx`
3. `InfoPageView` / `FAQPageView` / `MethodologyPageView` / `InterviewAgentsView` → `components/youtube/pages/{InfoPage,FaqPage,MethodologyPage,InterviewAgentsPage}.tsx` with `onNavigate` prop
4. Define `PageTarget` + `nav.ts`
5. Wire `app/info/page.tsx`, `app/faq/page.tsx`, `app/how-we-calculate/page.tsx`, `app/interview-agents/page.tsx`
6. Update story wrappers to pass `navigateInStorybook`
7. Verify: each route loads in `npm run dev`, each story renders in Storybook, cross-page links work in both

**Phase 3 — Hero + chrome primitives** (used by both main grid and pages). `Divider`, `Chapter`, `DomainRow`, `GhostAction`, `PageThemeToggle`, `PageFooter`, `PageCTABar`, `BigStat`, `EnjStatsPill`, `RhythmCard` (with `ViewToggle` + `InfoIcon` inline). Parallelizable via `superpowers:dispatching-parallel-agents` — none depend on each other.

**Phase 4 — Main grid cards (leaves).** `CardMeta`, `GridCard`, `GinnSmallCardSVG`, `StreakPillMain`, `RestDayBarChart`, `ToolLoyaltyCard`, `PatternFilter`, `BentoResizeHandle`. Parallelizable.

**Phase 5 — Main grid modals.** `ShareModal`, `MorphExplorer`, `TopSearchesExplorer`, `BuilderEnergyExplorer`, `RestDayModal`, `LongestStreakModal`, `MainGridToolLoyaltyModal`. Sequential (some reference each other's state patterns; safest in order).

**Phase 6 — Main grid root.** Extract `MainGridView` + `MainGridGinnView` into `components/youtube/main-grid/MainGrid.tsx`. Single public export: `MainGrid`. Update story wrapper. Wire `app/page.tsx`.

**Phase 7 — Asset path unification.** Grep-and-replace `"./sounds/"` → `"/sounds/"`, `"./media/"` → `"/media/"`, `"./avatars/"` → `"/avatars/"`, `"./sphere-loop.mp4"` → `"/sphere-loop.mp4"`, `"./charcterim.png"` → `"/charcterim.png"`, `"./vid*.mp4"` → `"/vid*.mp4"`. Across `components/` and the (now-thin) `stories/` file. Single commit.

**Phase 8 — Storybook story file cleanup.** `FullStory.stories.tsx` should now be ~400 lines: the five story wrappers + preserved orphan dev exports. Re-verify orphan list (§2.2c) still type-checks in isolation. Ensure `meta.excludeStories` still references valid names (any renamed exports removed from the list).

**Phase 9 — Final build + bundle sanity + QA.** `npm run build` clean. `npx tsc --noEmit` clean. Every route loads in `npm run dev`. Side-by-side Storybook vs Next.js for each page — pixel-level visual parity expected. Check `.next/static/chunks/` has no `@storybook/addon-links` string.

**Phase 10 — Deploy swap.** Rename `.github/workflows/deploy.yml` → `.yml.disabled` (or delete; keep a copy in commit history). Create Vercel project. Verify the Vercel preview deployment matches local Next.js. Optional: custom domain.

**Phase 11 — Post-launch cleanup (NOT in this migration).** Delete orphan dev functions from story file. Delete `public/sphere-loop.mp4` if the share feature stops using it. Remove `@storybook/addon-links` from deps if no orphan dev stories use it.

### 5.2 Mechanical extraction rules (same as Portfolio migration)

- **Copy code verbatim.** No renames (except the public-facing `MG_` prefix drop and `MainGridGinnView` → `MainGrid` merge, both declared in §4.1/4.5), no style reformatting, no "while I'm here" cleanups.
- **Add `"use client"` as line 1** for every file containing hooks, handlers, or Framer Motion.
- **Export the function.** Re-resolve imports at the top of the new file by grep'ing the function body for every external reference.
- **Update the story file** to import the new location after each extraction.
- **Verify** (§6) before proceeding to the next extraction.

### 5.3 Parallelization

Phases 3 + 4 have parallelizable batches. Use `superpowers:dispatching-parallel-agents` with this prompt template per agent:

> **Task:** Extract `<FUNCTION_NAME>` from `stories/youtube/FullStory.stories.tsx` starting at line `<LINE>` into `<DESTINATION_PATH>`.
>
> **Rules:** Copy verbatim. Add `"use client"` line 1. Resolve imports by grep'ing the function body. Export the function. Do NOT yet remove the original from the story file. Run `npx tsc --noEmit` and report any new errors touching your file.
>
> **Report:** file path + import list + tsc status.

Phases 0, 1, 2, 5, 6, 7, 8, 9, 10 are sequential.

---

## 6. Verification

### 6.1 Per-extraction

1. **Code-diff check.** `git diff <extracted-file>` vs original block from story file — expect differences ONLY in imports, `"use client"` directive, and `export` keywords.
2. **TypeScript clean.** `npx tsc --noEmit` exits 0.
3. **Storybook smoke.** Open the affected story (`Visualization` / `Info` / `FAQ` / `How We Calculate` / `Interview Agents`) at `http://localhost:6006`. Render should be visually identical to pre-extraction.
4. **Next.js dev smoke (after Phase 2+ routes wired).** Open the corresponding route at `http://localhost:3000`. Should match Storybook.

### 6.2 Per-phase

- Phase 0 — `npm run build` exits clean; TS error count = 0.
- Phase 1 — unchanged Storybook render; `npm run build` still clean.
- Phase 2 — all 4 info routes load at `localhost:3000`; cross-page links navigate correctly in BOTH Storybook and Next.js dev.
- Phase 3–6 — Visualization story at `localhost:6006` and `localhost:3000/` are visually identical; all 10+ modals open, every control works (theme, share, upload, category filter, pattern filter, focus shape, hover states on every card, all explorer modals).
- Phase 7 — all sounds play; all videos load; all images render. (Grep for remaining `"./"` asset paths — expected: 0.)
- Phase 8 — story file line count ~400; no invalid imports; `excludeStories` list valid.
- Phase 9 — `npm run build` clean, `.next/static/chunks/` free of `addon-links`/`storybook` strings; all 5 routes render in production build.

### 6.3 End-to-end (before Vercel DNS switch)

- Side-by-side browser comparison — Storybook vs Next.js dev — for every state of every modal and control.
- `npm run build && npm run start` at `localhost:3000` — verify production build serves identically.
- Browser matrix: Chrome → Safari desktop → Mobile Safari. Flag divergence in post-launch backlog; fix showstoppers inline.
- Upload flow end-to-end: drag a real YouTube Takeout zip, verify stats recompute and cards update.
- Share flow: attempt to capture card to PNG; attempt X-intent post (the sphere-loop.mp4 video compositing should work with absolute path).
- Navigation: click every cross-page link. Confirm correct URL, back-button works.

### 6.4 Out of scope for verification

- Screenshot regression suite (code identity covers it)
- Unit tests (none exist today; adding them is out of scope)
- Lighthouse / Core Web Vitals beyond a spot-check
- Accessibility audit (flagged for post-launch)

---

## 7. Deployment

### 7.0 Hosting topology — subpath on `karimsaleh.design`

**Decision (2026-04-21):** serve YouTube University at `karimsaleh.design/youtubeuniversity` via Next.js subpath hosting. Two independent Vercel projects, linked by a rewrite in the portfolio project.

**Why subpath over separate domain:**
- One domain to manage (no extra DNS at Squarespace, no extra annual cost).
- Karim's other projects already live on `karimsaleh.design`; consistent brand surface.
- Subdomains (e.g. `yt.karimsaleh.design`) would also work but require DNS setup and a separate apex identity.

**Config changes required:**

1. **In this repo (`youtubeuniverstity`) — `next.config.ts`:**
   ```ts
   // basePath: declares the app lives under /youtubeuniversity. Next.js auto-prepends
   // this to every internal <Link>, router.push, and asset reference, so the code can
   // continue to write /info or /sounds/tick.mp3 and it resolves correctly.
   export default {
     basePath: "/youtubeuniversity",
   };
   ```
   No other code changes required. Phase 7 (asset path unification to absolute `/...`) is still the correct work — basePath prepends itself to absolute paths automatically.

2. **In the portfolio repo (`portfolio-update`) — `next.config.ts`:**
   ```ts
   // rewrites: a server-side proxy. Browser keeps seeing karimsaleh.design/youtubeuniversity/*
   // while Vercel fetches the response from the YouTube project's deployment URL.
   export default {
     async rewrites() {
       return [
         {
           source: "/youtubeuniversity/:path*",
           destination: "https://youtubeuniverstity.vercel.app/youtubeuniversity/:path*",
         },
       ];
     },
   };
   ```
   Portfolio continues to own everything else. The rewrite is narrow (`/youtubeuniversity/` prefix only) so no risk of shadowing portfolio routes.

**What does NOT break:**
- Portfolio's root `/`, contact form, and every other existing route. Rewrites are path-prefix matched; no overlap.
- Bundle isolation: two separate Vercel projects, two separate Next.js builds. No React version conflicts, no Tailwind collision, no font deduplication concerns.
- YouTube Storybook at `npm run storybook` — unchanged. Storybook doesn't honor Next.js basePath; the `staticDirs: ["../public"]` config keeps assets at `/sounds/*` inside Storybook, matching the in-code references.

**What to watch:**
- A few extra milliseconds of latency on the first request (Vercel's edge proxy adds ~30–80ms over direct hosting — negligible for this static-style site).
- If Karim later wants to swap to a proper subdomain, the change is: remove `basePath` from YouTube, add CNAME in Squarespace, add domain in the YouTube Vercel project. ~15 minutes of work, no code refactor.

### 7.1 Vercel project setup

| Step | Actor | Details |
|---|---|---|
| Create project | Karim | vercel.com → Add Project → import `krispayyyy/youtubeuniverstity`. Framework auto-detects Next.js. Build command default (`npm run build`). Output default. |
| First deploy | Vercel | At commit of Phase 0 (pre-extraction), the deploy will succeed but the root URL shows the "Run npm run storybook" stub. This is expected — real content lands at Phase 6. |
| Preview URL | Karim + Claude | Note the assigned `youtubeuniverstity.vercel.app` URL. Use it for preview QA after each phase's commit. |
| Env vars | None needed | No secrets. No API keys. Explicitly confirmed in §2.7. |
| Custom domain | Karim (optional) | If a custom domain is purchased, add it via Settings → Domains. Not required for launch. |

### 7.2 GitHub Pages retirement

- **Option A (recommended):** rename `.github/workflows/deploy.yml` → `deploy.yml.disabled`. Commit. The existing GitHub Pages site continues to serve the last Storybook build but no longer updates on push. Optional second step: delete the workflow entirely after confirming Vercel is live.
- **Option B:** keep the Storybook deploy alongside Vercel. The GitHub Pages URL remains at `/youtubeuniverstity/` subpath; Vercel serves at root. Two targets, double the deploy overhead. Not recommended unless the Storybook URL has existing backlinks worth preserving.

Decision: Option A.

### 7.3 `app/layout.tsx` metadata

Current metadata is minimal ("YouTube University" title + one-line description). Upgrade:

```tsx
export const metadata: Metadata = {
  title: "YouTube University — Your learning, visualized",
  description: "Drop in your YouTube Takeout and see your real watch history, search patterns, and learning habits as a polished data-driven dashboard. All client-side, no backend.",
  openGraph: {
    title: "YouTube University",
    description: "Your YouTube watch history as a polished data-driven dashboard.",
    url: "https://youtubeuniverstity.vercel.app",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube University",
    description: "Your YouTube watch history as a polished data-driven dashboard.",
  },
};
```

Exact copy reviewable with Karim during Phase 2 (layout update).

### 7.4 `next.config.ts`

Current: empty default. No changes needed for launch. Vercel builds + serves Next.js 16 / Turbopack out of the box.

---

## 8. Pre-Launch Checklist (before Vercel deploy public)

- [ ] Phase 0 — TypeScript errors at baseline all fixed; `npm run build` clean
- [ ] Phases 1–9 — every phase verified per §6
- [ ] `npm run build` on `main` passes with zero TS or compile errors
- [ ] All 5 routes (`/`, `/info`, `/faq`, `/how-we-calculate`, `/interview-agents`) render at `localhost:3000`
- [ ] Side-by-side Storybook vs Next.js dev for every page — pixel parity confirmed
- [ ] Browser QA pass: Chrome → Safari → Mobile Safari
- [ ] Upload flow end-to-end works (real Takeout zip drops in, cards re-render)
- [ ] Share flow end-to-end works (PNG capture, X-intent, video compositing)
- [ ] All 10+ modals open, close, and render content correctly
- [ ] Theme toggle works; `data-theme` attribute updates correctly on both Storybook and Next.js
- [ ] Cross-page navigation works in both Storybook (`linkTo`) and Next.js (`router.push`)
- [ ] No `"./sounds/"`, `"./media/"`, `"./avatars/"` references remaining (grep returns 0 matches)
- [ ] `.github/workflows/deploy.yml` renamed or deleted
- [ ] Vercel preview URL QA passes
- [ ] Bundle sanity: `.next/static/chunks/` contains no `@storybook/addon-links` string
- [ ] Post-launch backlog noted (orphan cleanup, custom domain, Lighthouse, a11y audit)

---

## 9. Work Split

### 9.1 Karim (in parallel with Claude's extraction work)

1. Sign in to Vercel, import `krispayyyy/youtubeuniverstity`, accept defaults. First preview deploys immediately (stub page until Phase 6).
2. Note the auto-assigned `*.vercel.app` URL.
3. (Optional) Decide on custom domain; purchase if wanted.
4. After Phase 6 staging preview is QA'd and Phase 10 is reached, confirm Claude can rename the GitHub Pages workflow.
5. Browser QA on Karim's devices (Safari + mobile Safari) when requested — flag divergence.

### 9.2 Claude

1. Execute Phases 0–10 per §5.1. Verify per §6 after each phase.
2. Report progress after each phase commit; pause for Karim review at phase boundaries that have visible impact (Phase 2, Phase 6, Phase 10).
3. Produce the final punch list for Karim to tick before flipping Vercel to production.

---

## 10. Open Risks + Mitigations

- **TypeScript errors in already-extracted components may reveal deeper issues.** Mitigation: Phase 0 addresses each individually. If the `exit` field in `Transition` is load-bearing (unlikely — Framer Motion likely ignored it), verify the animation still looks correct post-fix.
- **`html-to-image` + `fetch("./sphere-loop.mp4")` share-card recording.** Verify post-Phase-7 that the X-intent flow still composes the video into the PNG correctly. This is the only code that actively fetches a public asset at runtime beyond image/video tags.
- **`linkTo` is a Storybook runtime-only API.** If any extracted component references it directly (outside of a wrapper), the Next.js production import graph will reach `@storybook/addon-links`. Mitigation: grep after Phase 8 for `linkTo` in `components/` and `app/`; expect 0 matches.
- **Asset path divergence between Storybook and Next.js.** Storybook serves `public/` at `/` via `staticDirs`. Next.js also serves `public/` at `/`. Absolute paths (`/sounds/tick.mp3`) work in both. No mitigation needed after Phase 7.
- **`useSound` arity errors in EnjProgress + odometer.** These are real bugs pre-existing in baseline. The call sites are probably `play(arg)` where `play` is the returned function (which accepts zero args). Fix: remove the argument. Verify the sound still plays.
- **Readonly tuple vs mutable `ToolLoyaltyRow[]` in growth-ticker.** Simplest fix: remove `as const` from the data literal OR change the type to `readonly ToolLoyaltyRow[]`.
- **Storybook `nextjs-vite` router mock.** When extracted pages use `useRouter` from `next/navigation`, Storybook's `nextjs-vite` builder provides a mock. Navigation via router.push inside Storybook will push to a URL that doesn't exist there (iframe mounting). **This is why the migration uses `onNavigate` props with a Storybook adapter (`linkTo`-based) instead of `useRouter` inside extracted components.**
- **Theme toggle uses `document.documentElement.setAttribute`.** This works in both Storybook (theme-decorator.tsx does the same thing) and Next.js (`ThemeProvider` in layout.tsx sets initial state). Keep unchanged.
- **CSS `@import` order warning in globals.css.** Not a blocker; flag as cleanup. Move the Google Fonts `@import` above `@font-face` OR switch to `next/font/google`.
- **`MergeTimelineView` and other orphan exports.** If TypeScript compilation reaches them (they're in the story file, and stories are excluded from tsconfig) they don't affect the build. If they reference newly-moved symbols after Phase 1 (e.g., `hydrateStats`, `DEFAULT_STATS`), update the imports in the story file alongside the move.

---

## 11. Out of Scope (for this migration)

- Visual redesign or polish ("while I'm here")
- New features / new cards / new controls
- Private repo migration (separate project)
- Custom domain purchase or DNS setup (optional, user decision)
- Analytics (Plausible / GA / Vercel Analytics) — post-launch
- Error monitoring (Sentry) — post-launch
- Accessibility audit — post-launch
- Unit or integration tests — project has none today
- Performance optimization beyond Next.js defaults
- Removing/deleting the preserved orphan dev exports (`FullStoryView`, `MergeTimelineView`, etc.)

---

## 12. Definition of Done

- `youtubeuniverstity.vercel.app` (or custom domain if set) resolves to a Vercel-hosted Next.js deploy of this repo.
- All 5 routes (`/`, `/info`, `/faq`, `/how-we-calculate`, `/interview-agents`) render and are visually identical to their corresponding Storybook stories, minus the Storybook canvas chrome.
- Storybook at `npm run storybook` still runs locally; all 5 shipping stories render; orphan dev exports (MergeTimelineView etc.) still work.
- `npm run build` exits clean on `main`.
- Production bundle contains no `@storybook/addon-links` or other Storybook-only code.
- GitHub Pages deploy workflow is disabled or removed.
- Code in `components/youtube/` beyond pre-existing files is byte-identical to original story code, modulo `"use client"` directives, import/export wrapping, `linkTo` → `onNavigate` prop conversion, asset path unification, and the `MainGridGinnView`/`MainGridView` merge into `MainGrid`.

---

## 13. Audit Log (for agent executing this plan)

**This section exists because of the 2026-04-19 Portfolio Migration lesson: never anchor a plan on summaries — anchor it on directly-observed repo state. This spec was written AFTER the following tool calls were run against the repo on 2026-04-21:**

1. `ls -la` on `/app`, `/components`, `/components/youtube`, `/components/youtube/modals`, `/components/ui`, `/components/particles`, `/stories/youtube`, `/lib`, `/data`, `/public`, `/.github/workflows`, `/.storybook` — confirmed file tree from §2.1.
2. `wc -l` on `FullStory.stories.tsx`, `DataStories.tsx`, `EnjProgress.tsx`, `mock-data.ts` — confirmed line counts 6,140 / 2,781 / 1,471 / 247.
3. `grep -cE "^(function|export function) "` on the story file — confirmed 60 function declarations.
4. `grep -nE "^(function|export function) "` on the story file — captured all line numbers in §2.2b.
5. `grep -n "Story|Meta|^const meta"` on the story file — confirmed story exports list (§2.2a) and `excludeStories` (§2.2c).
6. `grep -nE "linkTo\("` on the story file — confirmed 9 `linkTo` usages and their targets (§2.3).
7. `grep -rnE "\.(mp3|mp4|wav|png|otf|mov)"` across `stories/` and `components/` — confirmed the mixed `./` vs `/` asset paths (§2.4) with file:line citations.
8. `grep -l "dialkit|agentation|useDialKit|DialRoot|Agentation"` — 1 file (CLAUDE.md only; no component usage).
9. `grep -l "process\.env|NEXT_PUBLIC_|RESEND|API_KEY"` — 0 files.
10. `grep -n "dynamic\(|next/dynamic"` — 0 matches.
11. `npm run build` — observed compile success + TypeScript failure with 10+ errors; captured each in §2.5.
12. `npx tsc --noEmit` — captured full error list; same source as #11.
13. Read of `app/page.tsx`, `app/layout.tsx`, `next.config.ts`, `tsconfig.json`, `.storybook/main.ts`, `.storybook/preview.ts`, `.storybook/theme-decorator.tsx`, `.github/workflows/deploy.yml`, `package.json`, `app/globals.css` — informed §2.6 / §2.7 / §4.6.
14. Read of `FullStory.stories.tsx` lines 1–120 (imports), 968–1170 (all 4 page views + shell primitives), 1209–1400 (FullStoryView + meta), 3993–4053 (MainGridView state setup), 4922–5055 (MainGridGinnView CSS), 5230–5360 (MainGridGinnView end + MainGridGinnMonoView + all 5 story exports) — directly verified the role of each shipping story.
15. `du -h` on the largest public/ assets — `sphere-loop.mp4` 9.5M, `character-pixel.png` 1.2M, `charcterim.png` 844K — flagged for post-launch size audit.
16. `git status --short` + `git log --oneline -10` — confirmed trivial uncommitted CLAUDE.md path edit; otherwise clean tree.

**All §2 claims are backed by the observations above. No part of this spec was inferred from memory or from conversation summaries. Any revision to this spec should be preceded by a re-audit.**
