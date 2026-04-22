# YouTube University Launch Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task-by-task. Steps use checkbox syntax (`- [ ]`) for progress tracking.

**Goal:** Move the five shipping Storybook stories from `stories/youtube/FullStory.stories.tsx` into real React components under `components/youtube/`, wire five Next.js routes in `app/`, unify asset paths, and swap deploys from GitHub Pages to Vercel.

**Architecture:** Dual-target — one source of truth in `components/youtube/`, consumed by both Storybook (local dev) and `app/<route>/page.tsx` (Vercel production). Navigation uses prop injection (`onNavigate`) so `@storybook/addon-links` never enters the Next.js bundle. Extraction is mechanical code movement — no rewrites.

**Tech Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Framer Motion, Tailwind v4, Storybook 10 (nextjs-vite builder), JSZip (upload parsing), html-to-image (share capture).

**Source spec:** [`../specs/2026-04-21-youtube-launch-migration-design.md`](../specs/2026-04-21-youtube-launch-migration-design.md)

**Base branch:** `main` (repo: `krispayyyy/youtubeuniverstity`)

**Expected file count delta:** ~40 new files in `components/youtube/`, 4 new `app/<route>/page.tsx` files, 1 modified `app/page.tsx`, 1 modified `app/layout.tsx`, 1 renamed `.github/workflows/deploy.yml`, 1 thinned `stories/youtube/FullStory.stories.tsx` (6,140 → ~400 lines), ~8 modified existing component files (asset paths + TS fixes).

---

## Phase 0 — Baseline Repair

The production build currently fails TypeScript with 10+ errors in already-extracted components. Migration is pointless on a broken baseline. Fix first.

### Task 0.1: Fix `components/youtube/builder-energy.tsx:313` (invalid `exit` in Transition)

**Context:** Framer Motion's `Transition` type does not include an `exit` field. An inline `transition={{ duration: 0.35, ease: [...], exit: { duration: 0.18, ease: [...] } }}` was written expecting `exit` overrides at the transition level, which isn't how the API works. The correct pattern is a separate `exit` prop on the motion element with its own transition.

- [ ] **Step 1:** Read `components/youtube/builder-energy.tsx` around line 300–340 for full context.
- [ ] **Step 2:** Remove the `exit: { duration: 0.18, ease: [...] }` line from the `transition={{...}}` object literal. If an exit override is important for the animation, move it to `exit={{ transition: { duration: 0.18, ease: [0.23, 0.88, 0.26, 0.92] } }}` on the motion element. If the element doesn't have an `exit` prop and removing doesn't visibly affect the animation, just delete the line.
- [ ] **Step 3:** Verify `npx tsc --noEmit` no longer reports this error.
- [ ] **Step 4:** Verify in Storybook (BuilderEnergy usage) that the animation still looks correct.

### Task 0.2: Fix `components/youtube/growth-ticker.tsx:869,878` (readonly tuple vs mutable array)

**Context:** A data literal declared with `as const` becomes a readonly tuple; assigning it to a mutable `ToolLoyaltyRow[]` prop fails.

- [ ] **Step 1:** Read `components/youtube/growth-ticker.tsx` around lines 860–885.
- [ ] **Step 2:** Pick one of two fixes:
  - (a) Remove the `as const` from the literal.
  - (b) Change the consuming prop type to `readonly ToolLoyaltyRow[]`.
  - Prefer (a) if no other code depends on the literal being a tuple; (b) if the specific indices matter.
- [ ] **Step 3:** Verify `npx tsc --noEmit` no longer reports these two errors.

### Task 0.3: Fix `components/youtube/modals/DataStories.tsx:1973` (duplicate JSX attribute)

**Context:** Two attributes with the same name on one JSX element.

- [ ] **Step 1:** Read `components/youtube/modals/DataStories.tsx` around lines 1965–1985.
- [ ] **Step 2:** Identify the duplicate attribute (likely `style`, `className`, or `onClick`). Keep the intended one; delete the other. If both were intentional partial values, merge them.
- [ ] **Step 3:** Verify no visual change in Storybook.

### Task 0.4: Fix `components/youtube/modals/DataStories.tsx:2541` (`Story` identifier not found)

- [ ] **Step 1:** Read lines 2530–2550.
- [ ] **Step 2:** `Story` is likely a leftover from when DataStories lived in `stories/` and was a Storybook `Meta<typeof ...>`. Either remove the reference, or import from `@storybook/nextjs-vite` if the code legitimately needs the type. Most likely this is dead leftover — delete.
- [ ] **Step 3:** Verify `npx tsc --noEmit` clean on that file.

### Task 0.5: Fix `components/youtube/modals/EnjProgress.tsx:473, 842` (useSound arity)

**Context:** `useSound(src, options)` returns a `play()` function that takes zero arguments. Error says "Expected 0 arguments, but got 1", meaning somewhere `play(something)` is called.

- [ ] **Step 1:** Read `EnjProgress.tsx` around lines 470–480 and 840–850.
- [ ] **Step 2:** Find the `play()` call (or whatever variable holds the useSound return) and remove its argument. Verify the intended behavior still happens (tick plays on the event).

### Task 0.6: Fix `components/youtube/modals/EnjProgress.tsx:530, 856` (RefObject nullable mismatch)

**Context:** React 19 tightened ref typings — `RefObject<HTMLDivElement | null>` can't be assigned where `RefObject<HTMLDivElement>` is expected without an assertion.

- [ ] **Step 1:** Read lines 525–540 and 850–870.
- [ ] **Step 2:** Fix by either:
  - Narrowing: `ref as React.RefObject<HTMLDivElement>` at the call site (if the non-null has already been guarded).
  - Or update the consuming type signature to accept `RefObject<HTMLDivElement | null>`.
  - Choose the option matching the pattern used elsewhere in the project. Check DataStories.tsx for precedent.

### Task 0.7: Fix `components/youtube/odometer.tsx:147` (arity mismatch)

- [ ] **Step 1:** Read around line 147.
- [ ] **Step 2:** Likely another `play(arg)` → `play()` fix. Confirm and apply.

### Task 0.8: Commit Phase 0 fixes

- [ ] **Step 1:** Verify entire baseline:
  ```bash
  npx tsc --noEmit
  ```
  Expected: exit 0, zero errors.
- [ ] **Step 2:** Verify full build:
  ```bash
  npm run build
  ```
  Expected: `✓ Compiled successfully` AND `Running TypeScript ...` completes with no errors.
- [ ] **Step 3:** Commit:
  ```bash
  git add components/youtube/builder-energy.tsx components/youtube/growth-ticker.tsx components/youtube/modals/DataStories.tsx components/youtube/modals/EnjProgress.tsx components/youtube/odometer.tsx
  git commit -m "$(cat <<'EOF'
  chore: repair baseline TS errors blocking Vercel build

  - builder-energy: remove invalid 'exit' field from Transition literal
  - growth-ticker: drop 'as const' on tool-loyalty data so it matches mutable prop
  - DataStories: remove duplicate JSX attribute and stale Story reference
  - EnjProgress: remove stray argument passed to useSound's play() return; fix React 19 Ref typing
  - odometer: drop extra argument to 0-arg callable

  Production build now compiles AND type-checks cleanly. This unblocks the Storybook-to-Next.js migration.
  EOF
  )"
  ```
- [ ] **Step 4:** Stash the CLAUDE.md uncommitted diff (trivial path edit) or commit separately; do NOT leave it mingled with Phase 0.

---

## Phase 1 — Module-Scope Helpers (pure-function / pure-constant extractions)

Each extraction here is a pure file move with verbatim copy + import updates. Lowest risk. Good warmup.

### Task 1.1: Move `hydrateStats` + `DEFAULT_STATS` → `lib/hydrate-stats.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:69–94`

**Files:**
- Create: `lib/hydrate-stats.ts`
- Modify: `stories/youtube/FullStory.stories.tsx` (remove the functions, add import)

- [ ] **Step 1:** Read story file lines 64–95 to capture `hydrateStats` + `DEFAULT_STATS`.
- [ ] **Step 2:** Create `lib/hydrate-stats.ts`:
  ```tsx
  // Re-hydrate Date fields that JSON.stringify serialized to ISO strings.
  // Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).

  import rawDefaultStats from "@/data/stats.json";
  import type { YouTubeStats } from "@/lib/compute-stats";
  import { AVG_VIDEO_MINUTES } from "@/lib/compute-stats";

  export function hydrateStats(raw: typeof rawDefaultStats): YouTubeStats {
    // ... exact body from lines 69–92 ...
  }

  export const DEFAULT_STATS: YouTubeStats = hydrateStats(rawDefaultStats);
  ```
- [ ] **Step 3:** Update story file: delete the moved block (lines 64–95 area), add at top:
  ```tsx
  import { DEFAULT_STATS } from "@/lib/hydrate-stats";
  ```
- [ ] **Step 4:** Verify `npx tsc --noEmit` clean.
- [ ] **Step 5:** Verify Storybook renders `Visualization` story identically.
- [ ] **Step 6:** Commit: `refactor(lib): extract hydrateStats + DEFAULT_STATS`

### Task 1.2: Move `splitHoursMinutes` → `lib/format-helpers.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:103–107`

- [ ] Create `lib/format-helpers.ts`, copy verbatim, export.
- [ ] Update story import.
- [ ] Verify + commit.

### Task 1.3: Move `calcBuilderProfile` → `lib/calc-builder-profile.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:2664–2668` + `BuilderProfileId` type + `BUILDER_PROFILES` constant.

- [ ] Read lines 2635–2670 for `BUILDER_PROFILES` + `calcBuilderProfile`.
- [ ] `BUILDER_PROFILES` likely defines the `BuilderProfileId` type; co-locate them.
- [ ] Create `lib/calc-builder-profile.ts` exporting both the const and the function (and the derived type).
- [ ] Update story imports.
- [ ] Verify + commit.

### Task 1.4: Move `PAGE_MAX_W` + `PAGE_PAD` → `lib/page-constants.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:193–194`

- [ ] Create file, export both, update story.
- [ ] Verify + commit.

### Task 1.5: Move focus color map → `components/youtube/focus-color-map.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:109–195` — `_FOCUS_N`, `_FOCUS_GOLDEN`, `_focusLcgNoise`, `_focusScores`, `FOCUS_SORTED_ORGANIC`, `_playX`, `_playY`, `FOCUS_SORTED_YOUTUBE`, `FOCUS_DIM`, `buildFocusColorMap`, `useIsDark`.

**Files:**
- Create: `components/youtube/focus-color-map.ts`
- Modify: story file imports

- [ ] **Step 1:** Read story lines 108–195.
- [ ] **Step 2:** Create file. Since `buildFocusColorMap` is pure, and `useIsDark` is a hook, the file will be primarily constants + utility, with `useIsDark` exported separately. Module imports: `ALL_SHAPES_X`, `ALL_SHAPES_Y`, `PLAY_SHAPE_INDEX` from `@/components/particles/shapes`.
- [ ] **Step 3:** Add `"use client";` at top (because of `useIsDark` hook using useEffect + useState, which need this file to be client-code).
- [ ] **Step 4:** Export all of: `FOCUS_SORTED_ORGANIC`, `FOCUS_SORTED_YOUTUBE`, `FOCUS_DIM`, `buildFocusColorMap`, `useIsDark`. Keep the underscore-prefixed helpers non-exported.
- [ ] **Step 5:** Update story imports.
- [ ] **Step 6:** Verify + commit.

### Task 1.6: Move shared constants used by main grid → `components/youtube/main-grid/constants.ts`

**Source lines in the story file:**
- `MODAL_SPRING` (2289), `MODAL_EXIT` (2290), `MODAL_TITLE_STYLE` (2294), `MODAL_CLOSE_BTN_STYLE` (2298)
- `FOCUS_ALLOWED_SHAPES` (2304), `FOCUS_ALLOWED_LABELS` (2305)
- `CATEGORY_SHORT` (2308), `CATEGORY_SHAPE` (1202)
- `TICK_COOLDOWN_MS` (1973)
- `BE_TICK_COUNT` (2634), `BE_TICK_H` (2635), `BUILDER_PROFILES` (2638) — **if not already moved to `lib/calc-builder-profile.ts` in Task 1.3**
- `MG_ICON_COMPONENTS` (3264), `MG_ALL_ICON_KEYS` (3273), `MG_REST_DAY_ACTIVITIES` (3274), `MG_toolLoyaltyTimeline` (3283), `MG_toolLoyaltyMax` (3290)
- `STREAK_SPRINT_NAMES` (3465), `STREAK_DOT_COLS` (3472), `STREAK_DOT_FILL` (3474), `STREAK_SPRING` (3475), `STREAK_STAGGER_IN_MS` (3476), `STREAK_STAGGER_IN_CAP` (3477), `STREAK_STAGGER_OUT_MS` (3478), `STREAK_STAGGER_OUT_CAP` (3479), `STREAK_EXIT_DURATION` (3480)
- `FILTER_CATEGORIES` (3815), `PATTERN_FILTER_OPTS` (3841), `ALL_PATTERN_IDS` (3847)

**Files:**
- Create: `mkdir -p components/youtube/main-grid && touch components/youtube/main-grid/constants.ts`

- [ ] **Step 1:** Copy each constant verbatim from its line in the story file into `components/youtube/main-grid/constants.ts`, in source order.
- [ ] **Step 2:** At the top of the file, add necessary imports for any types/values referenced (icons from `@/components/ui/icons/*`, `PLAY_SHAPE_INDEX` from `@/components/particles/shapes`, etc.).
- [ ] **Step 3:** Add one-line comment at top: `// Module-scope constants for MainGridView — moved verbatim from FullStory.stories.tsx.`
- [ ] **Step 4:** No `"use client"` needed (pure data).
- [ ] **Step 5:** Export every constant.
- [ ] **Step 6:** Delete original definitions from story file.
- [ ] **Step 7:** At top of story file, add import:
  ```tsx
  import {
    MODAL_SPRING, MODAL_EXIT, MODAL_TITLE_STYLE, MODAL_CLOSE_BTN_STYLE,
    FOCUS_ALLOWED_SHAPES, FOCUS_ALLOWED_LABELS, CATEGORY_SHORT, CATEGORY_SHAPE,
    TICK_COOLDOWN_MS, BE_TICK_COUNT, BE_TICK_H,
    MG_ICON_COMPONENTS, MG_ALL_ICON_KEYS, MG_REST_DAY_ACTIVITIES,
    MG_toolLoyaltyTimeline, MG_toolLoyaltyMax,
    STREAK_SPRINT_NAMES, STREAK_DOT_COLS, STREAK_DOT_FILL, STREAK_SPRING,
    STREAK_STAGGER_IN_MS, STREAK_STAGGER_IN_CAP,
    STREAK_STAGGER_OUT_MS, STREAK_STAGGER_OUT_CAP, STREAK_EXIT_DURATION,
    FILTER_CATEGORIES, PATTERN_FILTER_OPTS, ALL_PATTERN_IDS,
  } from "@/components/youtube/main-grid/constants";
  ```
- [ ] **Step 8:** Verify TS + Storybook; commit.

### Task 1.7: Move `FAQ_ITEMS` + `METHODOLOGY_ITEMS` → `components/youtube/pages/content.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:773–792`

- [ ] Create `components/youtube/pages/content.ts`, copy both arrays, export.
- [ ] Update story imports.
- [ ] Verify + commit.

### Task 1.8: Move `pi()` animation helper → `components/youtube/pages/shell/animation.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:968–974`

- [ ] Create `mkdir -p components/youtube/pages/shell`, write `animation.ts` with `pi` exported.
- [ ] Update story imports.
- [ ] Verify + commit.

### Task 1.9: Move `playTick` + `playMainGridPop` → `components/youtube/main-grid/sounds.ts`

**Source:** `stories/youtube/FullStory.stories.tsx:1975` + module-scope `_tickAudio`, `_lastTick` (watch for related singletons just above), and `3295` + `_mainGridPopAudio`.

- [ ] **Step 1:** Read around lines 1973–1995 + 3293–3302 to capture the full audio singleton pattern (module-scope `let _tickAudio` declarations).
- [ ] **Step 2:** Create `components/youtube/main-grid/sounds.ts`. Add `"use client";` (because it uses `window` / `Audio` which is browser-only; but since it guards with `typeof window !== "undefined"` check, it's actually safe SSR — but add the directive anyway since consumers are client components).
- [ ] **Step 3:** Export `playTick`, `playMainGridPop`. Note: these functions currently use absolute paths `./sounds/tick.mp3` and `./sounds/pop-click.wav` — **leave as-is for now**; they're fixed in Phase 7.
- [ ] **Step 4:** Remove from story file, add imports.
- [ ] **Step 5:** Verify + commit.

### Task 1.10: Move `useIsDark` (if not already moved in Task 1.5)

If Task 1.5 moved `useIsDark` inside `focus-color-map.ts`, skip this task. If kept separate, extract to `components/youtube/main-grid/hooks.ts` now. Check before proceeding.

- [ ] Verify by grepping `useIsDark` in the repo after Phase 1 — should be exported from exactly one location.

---

## Phase 2 — Static Pages + Page Shell

Pages are simpler than the main grid (no upload/modal state machine). Do them first to lock in the `onNavigate` pattern.

### Task 2.1: Extract page shell primitives → `components/youtube/pages/shell/*.tsx`

**Files + source lines:**
| Function | Source line | Destination file |
|---|---|---|
| `InfoPageBackLink` | 793 | `components/youtube/pages/shell/InfoPageBackLink.tsx` |
| `InfoPageShell` | 810 | `components/youtube/pages/shell/InfoPageShell.tsx` |
| `RowDivider` | 822 | `components/youtube/pages/shell/RowDivider.tsx` |
| `InfoIconBox` | 834 | `components/youtube/pages/shell/InfoIconBox.tsx` |
| `AccordionRow` | 855 | `components/youtube/pages/shell/AccordionRow.tsx` |
| `InfoNavRow` | 927 | `components/youtube/pages/shell/InfoNavRow.tsx` |

**Parallelizable** — these six are independent (only AccordionRow may reference RowDivider; check during extraction).

- [ ] **Step 1:** Dispatch parallel agents (or extract sequentially), each with the verbatim-extraction prompt from the spec §5.3. Each agent:
  - Reads the function body from the story file at the specified line.
  - Writes it to the destination with `"use client";` + imports + `export function`.
  - Reports back with the import list.
- [ ] **Step 2:** After all complete, add imports to the top of the story file:
  ```tsx
  import { InfoPageBackLink } from "@/components/youtube/pages/shell/InfoPageBackLink";
  import { InfoPageShell }    from "@/components/youtube/pages/shell/InfoPageShell";
  import { RowDivider }       from "@/components/youtube/pages/shell/RowDivider";
  import { InfoIconBox }      from "@/components/youtube/pages/shell/InfoIconBox";
  import { AccordionRow }     from "@/components/youtube/pages/shell/AccordionRow";
  import { InfoNavRow }       from "@/components/youtube/pages/shell/InfoNavRow";
  ```
- [ ] **Step 3:** Remove the six function bodies from the story file.
- [ ] **Step 4:** Verify TS + Storybook renders `InfoStory`, `FAQStory`, `HowWeCalculateStory`, `InterviewAgentsStory` identically.
- [ ] **Step 5:** Commit: `refactor(pages): extract 6 page shell primitives`

### Task 2.2: Create `PageTarget` type + navigation helpers → `components/youtube/pages/nav.ts`

- [ ] **Step 1:** Create `components/youtube/pages/nav.ts`:
  ```tsx
  // Navigation abstraction — extracted pages accept onNavigate(target) instead of
  // calling linkTo directly, so production (Next.js router) and Storybook (linkTo)
  // can each provide their own implementation.

  export type PageTarget = "visualization" | "info" | "faq" | "methodology" | "agents";

  export interface PageNavProps {
    onNavigate?: (target: PageTarget) => void;
  }

  export const TARGET_TO_PATH: Record<PageTarget, string> = {
    visualization: "/",
    info: "/info",
    faq: "/faq",
    methodology: "/how-we-calculate",
    agents: "/interview-agents",
  };
  ```
- [ ] **Step 2:** Commit: `feat(pages): add PageTarget + onNavigate abstraction`

### Task 2.3: Extract `PricingCard` → `components/youtube/pages/PricingCard.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1059–1134`

- [ ] **Step 1:** Read the function body + its `PricingCardProps` interface at line 1052.
- [ ] **Step 2:** Create `components/youtube/pages/PricingCard.tsx`. Copy verbatim. Add `"use client";` + imports (React, Framer Motion, `playTick` from `@/components/youtube/main-grid/sounds`).
- [ ] **Step 3:** Export both `PricingCard` and `PricingCardProps`.
- [ ] **Step 4:** Update story file: import from new location, delete inline definition.
- [ ] **Step 5:** Verify + commit.

### Task 2.4: Extract `InfoPageView` → `components/youtube/pages/InfoPage.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:977–1002`

**Conversion:** rename `InfoPageView` → `InfoPage` (drops the `View` suffix since it's no longer a "view in a story"), replace `linkTo(...)` calls with `onNavigate` prop calls.

- [ ] **Step 1:** Create `components/youtube/pages/InfoPage.tsx`:
  ```tsx
  "use client";
  import { motion } from "framer-motion";
  import { InfoPageShell } from "./shell/InfoPageShell";
  import { InfoPageBackLink } from "./shell/InfoPageBackLink";
  import { InfoNavRow } from "./shell/InfoNavRow";
  import { pi } from "./shell/animation";
  import { BookTextIcon } from "@/components/ui/icons/book-text";
  import { ZapIcon } from "@/components/ui/icons/zap";
  import { CompassIcon } from "@/components/ui/icons/compass";
  import type { PageNavProps } from "./nav";

  export function InfoPage({ onNavigate }: PageNavProps) {
    const go = (target: "visualization" | "faq" | "methodology" | "agents") => () =>
      onNavigate?.(target);

    return (
      <InfoPageShell>
        <InfoPageBackLink label="Visualization" onClick={go("visualization")} />
        <motion.h2 {...pi(0)} className="select-none" style={{ fontSize: 32, color: "#fff", fontWeight: 600, margin: "8px 0 32px", lineHeight: 1.1 }}>Info</motion.h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { label: "FAQ", onClick: go("faq"), icon: <BookTextIcon size={14} /> },
            { label: "Interview agents", onClick: go("agents"), icon: <ZapIcon size={14} /> },
            { label: "How we calculate", onClick: go("methodology"), icon: <CompassIcon size={14} /> },
          ].map((row, i) => (
            <motion.div key={row.label} {...pi(0.08 + i * 0.06)}>
              <InfoNavRow label={row.label} onClick={row.onClick} icon={row.icon} />
            </motion.div>
          ))}
        </div>
      </InfoPageShell>
    );
  }
  ```
- [ ] **Step 2:** Keep the original `InfoPageView` inline in the story file for now — we'll delete at the end of Phase 2 after wiring Next.js routes + story wrappers. Alternatively, delete immediately and let the story fail temporarily (acceptable if confident).
- [ ] **Step 3:** Verify TS clean.

### Task 2.5: Extract `FAQPageView` → `components/youtube/pages/FaqPage.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1005–1025`

- [ ] Same pattern. Rename `FAQPageView` → `FaqPage`. Replace `linkTo("YouTube University", "Info")` with `go("info")`. Imports: `FAQ_ITEMS` from `@/components/youtube/pages/content`.

### Task 2.6: Extract `MethodologyPageView` → `components/youtube/pages/MethodologyPage.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1028–1048`

- [ ] Same pattern. Rename `MethodologyPageView` → `MethodologyPage`. Imports: `METHODOLOGY_ITEMS` from `content.ts`.

### Task 2.7: Extract `InterviewAgentsView` → `components/youtube/pages/InterviewAgentsPage.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1136–1167`

- [ ] Same pattern. Rename `InterviewAgentsView` → `InterviewAgentsPage`. Imports: `PricingCard`, `PAGE_MAX_W` from `lib/page-constants`, `useMediaQuery` from `@/components/use-media-query`.

### Task 2.8: Wire 4 new Next.js routes

**Files (all new):**
- `app/info/page.tsx`
- `app/faq/page.tsx`
- `app/how-we-calculate/page.tsx`
- `app/interview-agents/page.tsx`

Each follows this pattern (example for info):

```tsx
// app/info/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { InfoPage } from "@/components/youtube/pages/InfoPage";
import { TARGET_TO_PATH } from "@/components/youtube/pages/nav";
import type { PageTarget } from "@/components/youtube/pages/nav";

export default function Page() {
  const router = useRouter();
  const onNavigate = (target: PageTarget) => router.push(TARGET_TO_PATH[target]);
  return <InfoPage onNavigate={onNavigate} />;
}
```

- [ ] **Step 1:** Create all four page files with the pattern above (swap component name per route).
- [ ] **Step 2:** Verify `npm run dev` — each route loads at `localhost:3000/info`, `/faq`, `/how-we-calculate`, `/interview-agents`.
- [ ] **Step 3:** Click through navigation in both browsers — from Info to FAQ and back, etc.
- [ ] **Step 4:** Commit: `feat(app): add 4 new routes for info pages`

### Task 2.9: Update story wrappers for info pages

- [ ] **Step 1:** In `stories/youtube/FullStory.stories.tsx`, at top (after existing imports) add:
  ```tsx
  import { linkTo } from "@storybook/addon-links";
  import type { PageTarget } from "@/components/youtube/pages/nav";
  import { InfoPage } from "@/components/youtube/pages/InfoPage";
  import { FaqPage } from "@/components/youtube/pages/FaqPage";
  import { MethodologyPage } from "@/components/youtube/pages/MethodologyPage";
  import { InterviewAgentsPage } from "@/components/youtube/pages/InterviewAgentsPage";

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
  ```

  The existing `import { linkTo }` at line 3 can be removed if no inline `linkTo(...)` calls remain; otherwise keep it once.

- [ ] **Step 2:** Replace the four page story exports:
  ```tsx
  export const InfoStory: Story = {
    name: "Info",
    render: () => <InfoPage onNavigate={navigateInStorybook} />,
  };
  export const FAQStory: Story = {
    name: "FAQ",
    render: () => <FaqPage onNavigate={navigateInStorybook} />,
  };
  export const HowWeCalculateStory: Story = {
    name: "How We Calculate",
    render: () => <MethodologyPage onNavigate={navigateInStorybook} />,
  };
  export const InterviewAgentsStory: Story = {
    name: "Interview Agents",
    render: () => <InterviewAgentsPage onNavigate={navigateInStorybook} />,
  };
  ```
- [ ] **Step 3:** Delete the now-orphan inline definitions: `InfoPageView`, `FAQPageView`, `MethodologyPageView`, `InterviewAgentsView`. (Keep `PricingCard` if already moved, delete inline.)
- [ ] **Step 4:** Verify Storybook — all four stories render, navigation between them works via `linkTo`.
- [ ] **Step 5:** Verify Next.js — all four routes render, navigation via `router.push` works.
- [ ] **Step 6:** Commit: `refactor(stories): migrate info pages to extracted components with onNavigate`

### Task 2.10: Update `PageThemeToggle` and `PageFooter` `linkTo` usages

Both reference `linkTo` at lines 742, 759 (both inside chrome primitives). They'll be extracted in Phase 3. For now, mark them for conversion but leave inline — they're not blocking.

- [ ] (defer to Phase 3)

---

## Phase 3 — Hero + Chrome Primitives (parallelizable)

### Task 3.1: Extract sub-leaves (parallelizable batch)

**Files:**
| Function | Source line | Destination |
|---|---|---|
| `Divider` | 197 | `components/youtube/hero/Divider.tsx` |
| `Chapter` | 206 | `components/youtube/hero/Chapter.tsx` |
| `DomainRow` | 227 | `components/youtube/hero/DomainRow.tsx` |
| `GhostAction` | 253 | `components/youtube/hero/GhostAction.tsx` |

- [ ] **Step 1:** `mkdir -p components/youtube/hero`
- [ ] **Step 2:** Dispatch 4 parallel agents with the verbatim-extraction prompt.
- [ ] **Step 3:** Update story imports, remove inline definitions.
- [ ] **Step 4:** Verify + commit.

### Task 3.2: Extract `PageThemeToggle` → `components/youtube/chrome/PageThemeToggle.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:682–737`

**Behavior:** dark/light mode toggle only. Reads and writes `document.documentElement.dataset.theme`. No navigation, no `linkTo`. Straight verbatim extraction.

- [ ] **Step 1:** Read lines 682–737 and copy verbatim.
- [ ] **Step 2:** Add `"use client"`. Resolve imports (React hooks + icons).
- [ ] **Step 3:** Update story import + remove inline definition.
- [ ] **Step 4:** Verify + commit.

### Task 3.3: Extract `PageFooter` → `components/youtube/chrome/PageFooter.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:741–770`

**Behavior:** footer with two text buttons — "Info" (→ Info page) and "Agents" (→ Interview Agents page). Both currently use `linkTo`; both ship to production.

- [ ] **Step 1:** Extract with `onNavigate?: (target: PageTarget) => void` prop. Replace `linkTo(...)("Info")` with `onNavigate?.("info")` and `linkTo(...)("Interview Agents")` with `onNavigate?.("agents")`.
- [ ] **Step 2:** Verify + commit.

### Task 3.4: Extract `PageCTABar` → `components/youtube/chrome/PageCTABar.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1169–1208`

- [ ] **Step 1:** Read; it consumes `DotMatrixCTA`, `SIZE`, `PageThemeToggle`. If `PageThemeToggle` takes `onNavigate`, pass through.
- [ ] **Step 2:** Extract with forwarded props (`onShare`, `onUpload`, optional `onNavigate`).
- [ ] **Step 3:** Verify + commit.

### Task 3.5: Extract `BigStat` → `components/youtube/chrome/BigStat.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1486–1663`

- [ ] Extract verbatim.

### Task 3.6: Extract `EnjStatsPill` → `components/youtube/chrome/EnjStatsPill.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1665–1738`

- [ ] Extract verbatim.

### Task 3.7: Extract `RhythmCard` → `components/youtube/chrome/RhythmCard.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:1740–1880` (includes `ViewToggle` at 1390 + `InfoIcon` at 1474 as sub-leaves).

- [ ] **Step 1:** Read the full range to understand coupling between `RhythmCard` and its sub-components.
- [ ] **Step 2:** Co-locate `ViewToggle` + `InfoIcon` inside the same file (they're small, tightly-coupled helpers). Or split into sub-files if they're reused elsewhere (grep first).
- [ ] **Step 3:** Extract. Verify. Commit.

---

## Phase 4 — Main-Grid Cards (parallelizable)

### Task 4.1: Extract 8 card/leaf components (parallelizable batch)

**Files:**
| Function | Source line | Destination |
|---|---|---|
| `CardMeta` | 1893 | `components/youtube/main-grid/cards/CardMeta.tsx` |
| `GridCard` | 1994 | `components/youtube/main-grid/cards/GridCard.tsx` |
| `GinnSmallCardSVG` | 2144 | `components/youtube/main-grid/cards/GinnSmallCardSVG.tsx` |
| `StreakPillMain` | 3302 | `components/youtube/main-grid/cards/StreakPillMain.tsx` |
| `MG_RestDayBarChart` | 3335 | `components/youtube/main-grid/cards/RestDayBarChart.tsx` (rename: drop `MG_` prefix) |
| `MG_ToolLoyaltyCard` | 3729 | `components/youtube/main-grid/cards/ToolLoyaltyCard.tsx` |
| `PatternFilter` | 3849 | `components/youtube/main-grid/cards/PatternFilter.tsx` |
| `BentoResizeHandle` | 3186 | `components/youtube/main-grid/cards/BentoResizeHandle.tsx` |

**Rename decisions:**
- `MG_RestDayBarChart` → export name `RestDayBarChart` (internal `MG_` prefix was a namespace hack inside the story file; unnecessary now that the file lives in `main-grid/cards/`).
- `MG_ToolLoyaltyCard` → export name `ToolLoyaltyCard`.

- [ ] **Step 1:** `mkdir -p components/youtube/main-grid/cards`
- [ ] **Step 2:** Dispatch 8 parallel agents. Each reports new file path + import list.
- [ ] **Step 3:** Update story imports:
  ```tsx
  import { CardMeta }           from "@/components/youtube/main-grid/cards/CardMeta";
  import { GridCard }           from "@/components/youtube/main-grid/cards/GridCard";
  import { GinnSmallCardSVG }   from "@/components/youtube/main-grid/cards/GinnSmallCardSVG";
  import { StreakPillMain }     from "@/components/youtube/main-grid/cards/StreakPillMain";
  import { RestDayBarChart as MG_RestDayBarChart } from "@/components/youtube/main-grid/cards/RestDayBarChart";
  import { ToolLoyaltyCard as MG_ToolLoyaltyCard } from "@/components/youtube/main-grid/cards/ToolLoyaltyCard";
  import { PatternFilter }      from "@/components/youtube/main-grid/cards/PatternFilter";
  import { BentoResizeHandle }  from "@/components/youtube/main-grid/cards/BentoResizeHandle";
  ```
  The `as MG_*` aliases preserve existing call sites inside the still-inline `MainGridView` without rewriting them. Once `MainGridView` itself is extracted (Phase 6), drop the aliases.
- [ ] **Step 4:** Delete inline definitions.
- [ ] **Step 5:** Verify TS clean.
- [ ] **Step 6:** Verify Storybook — `Visualization` renders; all cards appear; hover/press interactions work.
- [ ] **Step 7:** Commit: `refactor(main-grid): extract 8 card/leaf components`

---

## Phase 5 — Main-Grid Modals (sequential)

Extract in order — ShareModal first (it's the most independent), then the MG_* modals grouped, then the explorer modals.

### Task 5.1: Extract `ShareModal` → `components/youtube/main-grid/modals/ShareModal.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:323–681`

**Note:** ~360 lines. Uses `html-to-image` (lazy-imported, good), `fetch("./sphere-loop.mp4")` (will fix in Phase 7), `useRef`, many DOM-manipulation sections.

- [ ] **Step 1:** Read the full range to understand the full flow.
- [ ] **Step 2:** Extract verbatim. Imports: React hooks, Framer Motion, `ShareCardIterationTwo` from `@/components/youtube/share-card-iteration-two`, icons from `@/components/ui/icons/*`, `html-to-image` is dynamic-imported inside the function (leave as-is).
- [ ] **Step 3:** Do NOT fix the `./sphere-loop.mp4` path yet — that's Phase 7.
- [ ] **Step 4:** Verify + commit.

### Task 5.2: Extract `MG_RestDayModal` → `components/youtube/main-grid/modals/RestDayModal.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:3367–3463`

- [ ] Rename export: `RestDayModal`. Add story import alias `as MG_RestDayModal` inside the still-inline `MainGridView` call site.
- [ ] Extract verbatim. Verify + commit.

### Task 5.3: Extract `MG_LongestStreakModal` → `components/youtube/main-grid/modals/LongestStreakModal.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:3482–3727`

- [ ] Same pattern. Uses `STREAK_*` constants from `components/youtube/main-grid/constants.ts` (already moved in Task 1.6).

### Task 5.4: Extract `MG_ToolLoyaltyModal` → `components/youtube/main-grid/modals/MainGridToolLoyaltyModal.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:3758–3813`

**Naming note (name-collision avoidance):** `components/youtube/modals/DataStories.tsx:1075` already exports an unrelated `ToolLoyaltyModal` (a channel-oriented modal). Both render inside `MainGridView` as independent features. To keep IDE auto-complete unambiguous, extract the main-grid variant as `MainGridToolLoyaltyModal` (exported name AND filename) and in the still-inline `MainGridView` call site, add the import alias `import { MainGridToolLoyaltyModal as MG_ToolLoyaltyModal } from "@/components/youtube/main-grid/modals/MainGridToolLoyaltyModal";` to preserve the call site verbatim.

- [ ] Same pattern as 5.2/5.3 but with the rename + alias above. Drop the alias in Task 6.1 when `MainGridView` moves into `MainGrid.tsx` (replace the `MG_ToolLoyaltyModal` JSX reference with `MainGridToolLoyaltyModal` directly).

### Task 5.5: Extract `MorphExplorer` → `components/youtube/main-grid/modals/MorphExplorer.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:2312–2529`

- [ ] Extract verbatim. Uses `ParticleMorph`, `FOCUS_ALLOWED_*` constants.

### Task 5.6: Extract `TopSearchesExplorer` → `components/youtube/main-grid/modals/TopSearchesExplorer.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:2531–2632`

### Task 5.7: Extract `BuilderEnergyExplorer` → `components/youtube/main-grid/modals/BuilderEnergyExplorer.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:2670–2889`

- [ ] Uses `BuilderEnergy`, `calcBuilderProfile` (from `@/lib/calc-builder-profile`), `BE_*` constants.

### Task 5.8: Commit Phase 5

- [ ] `git commit -m "refactor(main-grid): extract 7 modals"`

---

## Phase 6 — Main-Grid Root Extraction

### Task 6.1: Extract `MainGridView` → `components/youtube/main-grid/MainGrid.tsx`

**Source:** `stories/youtube/FullStory.stories.tsx:3993–4920` (MainGridView) + `4922–5301` (MainGridGinnView) merged.

**Merge strategy per spec §4.5:**
- The production `MainGrid` component takes `orangeColor` as prop (defaults to `"#E14920"`).
- It wraps the MainGridView body with the `<style>{...}</style>` block + `<div className="mg-ginn-test">` from `MainGridGinnView`.
- The `ginnMode` branch inside MainGridView remains; `MainGrid` always passes `ginnMode={true}`.

- [ ] **Step 1:** Read `MainGridView` in full (lines 3993–4920 — ~930 lines).
- [ ] **Step 2:** Read `MainGridGinnView` in full (lines 4922–5278 — ~360 lines of CSS-in-JS).
- [ ] **Step 3:** Create `components/youtube/main-grid/MainGrid.tsx`:
  ```tsx
  "use client";
  import * as React from "react";
  // ... full set of imports: React, framer-motion, icons, all extracted cards,
  //     all extracted modals, all constants, DEFAULT_STATS, ParticleMorph, etc.

  interface MainGridProps {
    orangeColor?: string;
  }

  export function MainGrid({ orangeColor = "#E14920" }: MainGridProps) {
    return (
      <>
        <style>{`
          // ...(exact CSS block from MainGridGinnView)
        `}</style>
        <div className="mg-ginn-test">
          <MainGridBody accentColor={orangeColor} />
        </div>
      </>
    );
  }

  // Private internal: was MainGridView in the story file, ginnMode=true always.
  function MainGridBody({ accentColor }: { accentColor: string }) {
    // ... exact body from MainGridView, with ginnMode replaced by literal `true`
  }
  ```
  **Alternative (simpler):** preserve both `MainGridView` and `MainGridGinnView` as separate internal functions inside this file. Export a single `MainGrid` that is `MainGridGinnView`. Minimal refactor.
- [ ] **Step 4:** Create `components/youtube/main-grid/index.ts`:
  ```tsx
  export { MainGrid } from "./MainGrid";
  ```
- [ ] **Step 5:** Update story file: replace inline `MainGridView` + `MainGridGinnView` with import:
  ```tsx
  import { MainGrid } from "@/components/youtube/main-grid";
  ```
  Update `Visualization` story render:
  ```tsx
  export const Visualization: Story = {
    name: "Visualization",
    render: () => <MainGrid orangeColor="#E14920" />,
  };
  ```
  **Preserve** the `MainGridGinnMonoView` orphan — it calls `MainGridGinnView`. Either:
  - (a) Have `MainGridGinnMonoView` call `MainGrid` (likely fine — Ginn Mono is just font-swap over the same Ginn layout).
  - (b) Or leave `MainGridGinnView` internal-exported from `components/youtube/main-grid/MainGrid.tsx` and update the story import.
  - Prefer (a).
- [ ] **Step 6:** Delete the inline `MainGridView` + `MainGridGinnView` from the story file.
- [ ] **Step 7:** Drop the `as MG_*` import aliases (Task 4.1, 5.2, 5.3, 5.4) — the aliases existed to support still-inline `MainGridView` call sites that now live inside `MainGrid.tsx`, where direct names are used.
- [ ] **Step 8:** Verify TS clean; verify `Visualization` story renders identically.
- [ ] **Step 9:** Commit: `refactor(main-grid): extract MainGrid root consolidating Ginn theme + grid`

### Task 6.2: Wire `app/page.tsx` to render the production Scene

**Current content:** 10-line stub.

- [ ] **Step 1:** Replace `app/page.tsx` with:
  ```tsx
  "use client";
  import { MainGrid } from "@/components/youtube/main-grid";

  export default function Home() {
    return <MainGrid orangeColor="#E14920" />;
  }
  ```
- [ ] **Step 2:** Run `npm run dev`, open `http://localhost:3000/`. Should render the full grid identical to Storybook `Visualization`.
- [ ] **Step 3:** Test every interaction: upload modal, share modal, theme toggle, all 10+ explorer modals, category filter, pattern filter, focus shape dropdown, every card hover.
- [ ] **Step 4:** Side-by-side with Storybook at `:6006`. Document any divergence for follow-up.
- [ ] **Step 5:** Commit: `feat(app): wire / route to render MainGrid`

### Task 6.3: Update `app/layout.tsx` metadata

- [ ] **Step 1:** Replace current metadata per spec §7.3 (show copy to Karim before committing if in an interactive session).
- [ ] **Step 2:** Commit: `feat(app): update layout metadata for Vercel launch`

---

## Phase 7 — Asset Path Unification

### Task 7.1: Replace relative asset paths with absolute across the codebase

**Files affected (from spec §2.4):**
- `components/youtube/builder-energy.tsx:17` — `./sounds/pop-click.wav` → `/sounds/pop-click.wav`
- `components/youtube/modals/DataStories.tsx:587, 1358, 1499, 1817, 1818, 1819` — all relative paths
- `components/youtube/modals/EnjProgress.tsx:450` — `./sounds/tick.mp3` → `/sounds/tick.mp3`
- `components/youtube/main-grid/sounds.ts` (formerly story file lines 1984, 3297) — `./sounds/...` → `/sounds/...`
- `components/youtube/main-grid/modals/ShareModal.tsx` (formerly story line 393) — `fetch("./sphere-loop.mp4")` → `fetch("/sphere-loop.mp4")`
- Any remaining asset references in the (now-thin) story file.

- [ ] **Step 1:** Run pre-verification grep:
  ```bash
  grep -rE "[\"']\.\/(sounds|media|avatars|sphere-loop|character-pixel|charcterim|vid[23]|character\.mp4)" components/ stories/ app/
  ```
  Expect some matches. Record for surgical replacement.

- [ ] **Step 2:** For each match, replace `./` prefix with `/`. Use `Edit` tool with `old_string` including enough context to make each match unique.

- [ ] **Step 3:** Post-verification grep:
  ```bash
  grep -rE "[\"']\.\/(sounds|media|avatars|sphere-loop|character-pixel|charcterim|vid[23]|character\.mp4)" components/ stories/ app/
  ```
  Expect: 0 matches.

- [ ] **Step 4:** Verify in `npm run dev`:
  - [ ] Theme toggle tick sound plays
  - [ ] Main-grid pop sound plays
  - [ ] Top Channel modal hero video loads
  - [ ] Late Night modal avatars load
  - [ ] Builder Energy pop sound plays
  - [ ] EnjProgress tick sound plays
  - [ ] Share flow: PNG capture works; video compositing works

- [ ] **Step 5:** Verify in Storybook — same assets still load (since `staticDirs` serves `public/` at `/`).

- [ ] **Step 6:** Commit: `refactor: unify all public/ asset paths to absolute /`

---

## Phase 8 — Storybook Story File Cleanup

### Task 8.1: Thin down `stories/youtube/FullStory.stories.tsx`

After Phases 1–7, the story file should contain only:
- Imports (~80 lines)
- `linkTo` adapter + `STORY_TARGETS` + `navigateInStorybook` (~15 lines)
- `meta` definition (~15 lines)
- 5 shipping story exports (~30 lines)
- Orphan dev exports: `MergeTimelineView`, `FullStoryView`, `MainGridGinnMonoView`, `HoverTestView`, `GinnTestView`, `GinnCard` + `TraceDivider` + `GhostAction` if still inline, `InnerShadowCard`, `ScaleHoverGridView`, `ScaleGridCard`, `GridView` (plus anything they depend on) — total likely ~200–250 lines
- **Total expected:** ~400–500 lines (vs 6,140 original).

- [ ] **Step 1:** Run `wc -l stories/youtube/FullStory.stories.tsx` — record the number.
- [ ] **Step 2:** Walk through the file top-to-bottom. For any function/component still inline, confirm:
  - (a) It's only referenced by orphan dev exports OR by the Storybook meta's `component` field.
  - (b) It's not shadowing an extracted component (would cause name collision).
- [ ] **Step 3:** If any function is inline but unused (including by orphan dev exports), mark for deletion in a post-launch cleanup commit — do NOT delete here (preservation principle).
- [ ] **Step 4:** Verify `meta.excludeStories` list is still valid — every name in it corresponds to an existing `export function` in the file.
- [ ] **Step 5:** Verify TS clean.
- [ ] **Step 6:** Verify Storybook — all 5 shipping stories + all orphan exports render.
- [ ] **Step 7:** Commit: `refactor(stories): final cleanup of FullStory.stories.tsx`

---

## Phase 9 — Final Build + Bundle Sanity + QA

### Task 9.1: Clean production build

- [ ] **Step 1:** Clean artifacts:
  ```bash
  rm -rf .next
  ```
- [ ] **Step 2:** Full build:
  ```bash
  npm run build
  ```
  Expected: `✓ Compiled successfully`; `Running TypeScript ...` passes; 5 routes shown (`/`, `/info`, `/faq`, `/how-we-calculate`, `/interview-agents`).
- [ ] **Step 3:** Serve production build:
  ```bash
  npm run start
  ```
  Expected: serves on `:3000`. Manually test all 5 routes — they render identically to `npm run dev`.

### Task 9.2: Bundle sanity — Storybook-only modules excluded from production

- [ ] **Step 1:** Grep production client chunks for Storybook-only strings:
  ```bash
  grep -rE "@storybook/addon-links|@storybook/nextjs-vite|storybook/internal|linkTo" .next/static/chunks/ 2>/dev/null | head -20
  ```
  Expected: **0 matches**.
- [ ] **Step 2:** If matches appear, an extracted component is importing something it shouldn't. Fix by grep'ing the source for the offending import path and re-routing.

### Task 9.3: TypeScript full pass

- [ ] Run `npx tsc --noEmit`. Expected: exit 0, no errors.

### Task 9.4: Browser QA

- [ ] **Chrome desktop** — every route, every modal, every interaction. Use checklist:
  - [ ] `/` — MainGrid renders; odometer animates; particle morph renders; all 20+ cards visible; hover works on every card
  - [ ] `/` — Share modal: opens, card captures, X-intent opens, PNG downloads
  - [ ] `/` — Upload modal: opens, a zip drop recomputes stats
  - [ ] `/` — Morph explorer, Top Searches, Builder Energy, Rest Day, Longest Streak, Tool Loyalty, Top Channel, Subscriptions, Late Night, Enj Progress Checklist — all open + close cleanly
  - [ ] `/` — Theme toggle: dark ↔ light transition is smooth; tick sound plays
  - [ ] `/` — Category filter bar, Pattern filter dropdown, Focus shape dropdown all work
  - [ ] `/info` — renders; 3 nav rows navigate to FAQ / Interview Agents / Methodology
  - [ ] `/info` — back link returns to `/`
  - [ ] `/faq` — renders; accordions expand
  - [ ] `/faq` — back link to `/info`
  - [ ] `/how-we-calculate` — renders; accordions expand
  - [ ] `/how-we-calculate` — back link to `/info`
  - [ ] `/interview-agents` — renders; 3 pricing cards; hover states; responsive grid (1/2/3 cols)
  - [ ] `/interview-agents` — back link to `/info`
- [ ] **Safari desktop** — same checklist. Flag any divergence.
- [ ] **Mobile Safari** (if available) — spot check on iPhone via local network IP.

### Task 9.5: Commit final QA fixes

- [ ] If QA surfaces any fixable issues, commit per issue: `fix(...): ...`

---

## Phase 10 — Deploy Swap

### Task 10.1 (Karim — parallel, can start during Phase 2+)

- [ ] Sign in to vercel.com with GitHub
- [ ] "Add New" → "Project" → import `krispayyyy/youtubeuniverstity`
- [ ] Framework: Next.js (auto-detected). Build command: default (`npm run build`). Output: default.
- [ ] Deploy. First deploy (still on Phase 0 commit) shows the "Run npm run storybook" stub — this is expected until Phase 6 lands.
- [ ] Note the assigned URL (`*.vercel.app`).

### Task 10.2 (Karim): Verify preview URL end-to-end

Once Phase 6 lands and Vercel auto-deploys the branch:

- [ ] Visit the Vercel preview URL.
- [ ] Walk through the Task 9.4 Chrome checklist on real Vercel infra.
- [ ] Confirm all 5 routes work, all modals open, all assets load (sounds, videos, images).

### Task 10.3: Subpath hosting on `karimsaleh.design/youtubeuniversity`

Per spec §7.0, ship YouTube University as a subpath under the portfolio domain. Two small config changes — one per repo.

- [ ] **Step 1 (YouTube repo, this project):** edit `next.config.ts`:
  ```ts
  // basePath: Next.js serves everything under /youtubeuniversity. All <Link>, router.push,
  // and public/ asset paths auto-prepend this. Code can still reference /info or /sounds/tick.mp3.
  const nextConfig: NextConfig = {
    basePath: "/youtubeuniversity",
  };
  export default nextConfig;
  ```
- [ ] **Step 2:** verify in `npm run dev` — app now only responds at `http://localhost:3000/youtubeuniversity` (root gives 404, expected). All routes still work under the prefix.
- [ ] **Step 3 (YouTube repo):** commit the basePath change. Push. Vercel auto-deploys.
- [ ] **Step 4:** verify the Vercel deployment URL (`youtubeuniverstity.vercel.app/youtubeuniversity`) serves the site and each route. Bare domain root returns 404 — that's correct.
- [ ] **Step 5 (portfolio repo):** edit portfolio's `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = {
    async rewrites() {
      return [
        {
          // rewrites: server-side proxy; browser URL stays karimsaleh.design/youtubeuniversity/...
          // destination: Vercel fetches from the YouTube project's deployment URL transparently.
          source: "/youtubeuniversity/:path*",
          destination: "https://youtubeuniverstity.vercel.app/youtubeuniversity/:path*",
        },
      ];
    },
  };
  export default nextConfig;
  ```
- [ ] **Step 6:** verify in portfolio's `npm run dev` that `localhost:3000/youtubeuniversity` proxies to the Vercel-hosted YouTube site (assumes the YouTube Vercel deploy is live from Step 3).
- [ ] **Step 7 (portfolio repo):** commit, push; Vercel auto-deploys portfolio.
- [ ] **Step 8:** verify `https://karimsaleh.design/youtubeuniversity` serves the live YouTube University, and `https://karimsaleh.design/` still serves the portfolio unchanged.
- [ ] **Step 9:** test cross-page navigation on the live domain: clicking "Info" from the main page should land at `karimsaleh.design/youtubeuniversity/info`, etc. No URL leakage to `*.vercel.app`.

**Rollback:** delete the portfolio's rewrite (one-line revert) to hide the YouTube site; delete `basePath` from YouTube config to restore root-hosted behavior for future standalone use.

### Task 10.4: Retire GitHub Pages workflow

- [ ] **Step 1:** Confirm with Karim the Vercel preview has been end-to-end QA'd.
- [ ] **Step 2:** Rename the workflow file:
  ```bash
  mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
  ```
- [ ] **Step 3:** Commit: `chore: disable GitHub Pages deploy; now serving via Vercel`
- [ ] **Step 4:** Note: the existing GitHub Pages URL continues to serve the last Storybook build until Karim goes to Settings → Pages in GitHub and disables the environment. Flag that in the punch list.

### Task 10.5: Flip Vercel deployment to "Production" branch

- [ ] Confirm `main` is set as the Production branch in Vercel → Settings → Git. (Default for imported projects.)
- [ ] Merge the migration branch to `main` if work was on a branch. Auto-deploy triggers.
- [ ] Once the production deployment is green, the site is live.

### Task 10.6: Post-launch smoke

- [ ] Open the production URL fresh in Chrome, Safari, Firefox. Test each route.
- [ ] Note any issues in a post-launch backlog:
  - Orphan cleanup (`FullStoryView`, `MergeTimelineView`, etc.)
  - Custom domain (if deferred)
  - Lighthouse pass
  - Accessibility audit
  - Analytics (Vercel Analytics toggle is a 1-click add if wanted)
  - Recompressing `sphere-loop.mp4` (9.5MB) and `character-pixel.png` (1.2MB)

---

## Self-Review (post-authoring)

### 1. Spec coverage

- §2.2a (5 shipping stories) → Tasks 2.4–2.9, 6.1–6.2 ✓
- §2.2b (every listed inline function) → Tasks 1.1–1.10, 2.1–2.7, 3.1–3.7, 4.1, 5.1–5.8, 6.1 — cross-referenced below
- §2.2c (orphans) → Phase 8 preserves them ✓
- §2.3 (linkTo conversion) → Task 2.2 (nav.ts), Task 2.4–2.7 (per-page conversion), Task 2.9 (story adapter), Tasks 3.2–3.4 (PageThemeToggle/PageFooter/PageCTABar handling) ✓
- §2.4 (asset paths) → Phase 7 ✓
- §2.5 (baseline broken) → Phase 0 ✓
- §2.6 (GitHub Pages) → Task 10.4 ✓
- §2.7 (no env) → confirmed no tasks needed ✓
- §3.1 (5 routes) → Tasks 2.8 + 6.2 ✓
- §3.3 (stripped) → Phase 8 preservation policy ✓
- §3.4 (Storybook) → Task 2.9, 6.1 (story wrappers) ✓
- §4.1 (architecture) → file structure matches phases ✓
- §4.3 (nav abstraction) → Task 2.2 + per-page tasks ✓
- §4.5 (merge MainGridView + MainGridGinnView) → Task 6.1 ✓
- §6 (verification) → every task has TS + Storybook + commit steps, Phase 9 is the end-to-end pass ✓
- §7 (deployment) → Phase 10 ✓
- §8 (pre-launch checklist) → captured in Task 9.4 + Task 10.2 ✓
- §10 (risks) → each risk referenced inline

### 2. Inline function coverage cross-check

Every `function` / `export function` in `FullStory.stories.tsx` (60 total) is either:
- Extracted in a specific task, OR
- Preserved as orphan per §2.2c (Phase 8 leaves them)

**Extracted functions:** hydrateStats (1.1), splitHoursMinutes (1.2), _focusLcgNoise + buildFocusColorMap + useIsDark (1.5), Divider + Chapter + DomainRow + GhostAction (3.1), ShareModal (5.1), PageThemeToggle + PageFooter (3.2/3.3), InfoPageBackLink + InfoPageShell + RowDivider + InfoIconBox + AccordionRow + InfoNavRow (2.1), pi (1.8), InfoPageView + FAQPageView + MethodologyPageView + PricingCard + InterviewAgentsView (2.4/2.5/2.6/2.3/2.7), PageCTABar (3.4), ViewToggle + InfoIcon + RhythmCard (3.7), BigStat (3.5), EnjStatsPill (3.6), CardMeta + ScaleGridCard? + playTick + GridCard + GinnSmallCardSVG (4.1 + 1.9; ScaleGridCard preserved as orphan per §2.2c), MorphExplorer + TopSearchesExplorer + BuilderEnergyExplorer (5.5/5.6/5.7), calcBuilderProfile (1.3), BentoResizeHandle + playMainGridPop + StreakPillMain + MG_RestDayBarChart + MG_ToolLoyaltyCard + PatternFilter (4.1 + 1.9), MG_RestDayModal + MG_LongestStreakModal + MG_ToolLoyaltyModal (5.2/5.3/5.4), MainGridView + MainGridGinnView (6.1).

**Orphans preserved:** FullStoryView, MergeTimelineView, MainGridGinnMonoView, InnerShadowCard, HoverTestView, GinnCard, TraceDivider, GinnTestView, ScaleHoverGridView, ScaleGridCard, GridView.

**Count check:** 60 total — 49 extracted + 11 orphans preserved = 60 ✓

### 3. Placeholder scan

- Task 6.1 Step 3 describes the MainGrid wrapping pattern but doesn't paste the full 360-line CSS-in-JS block; agent reads the source. Acceptable.
- Task 0.X steps say "Pick one of two fixes" for some TypeScript errors — acceptable, decision criterion provided.
- Task 10.3 (custom domain) is explicitly marked optional / Karim's decision — not a placeholder.

### 4. Contradiction check

- Task 1.3 moves `BUILDER_PROFILES` to `lib/calc-builder-profile.ts` while Task 1.6 mentions `BUILDER_PROFILES` (2638) in the shared constants list — **potential conflict resolved by the "if not already moved" note in Task 1.6**. Agent checks before proceeding.
- Task 1.5 moves `useIsDark` while Task 1.10 calls out "move useIsDark if not done in 1.5" — same pattern. Explicit.

### 5. Dependency ordering

- Tasks 0.1–0.8 must complete before anything else (broken build blocks downstream verification).
- Task 1.6 (constants) must complete before Phase 4–6 (cards and modals import the constants).
- Task 1.9 (sounds) must complete before Phase 4–5 extractions that call `playTick` or `playMainGridPop`.
- Task 2.2 (nav.ts) must complete before Tasks 2.4–2.7 (pages import `PageNavProps`).
- Task 6.1 (MainGrid extraction) must complete before Task 6.2 (app/page.tsx wiring).
- Phase 7 (asset paths) must complete before Phase 9 (production build final verification — asset loading is part of QA).

No circular dependencies found.

### 6. Verification completeness

Every task has a TS + Storybook check. Phase 9 adds the production build + bundle + QA pass. Task 10.2 adds real-Vercel QA. Three layers of verification end-to-end. Matches Portfolio migration rigor.

---

## Execution Handoff

Two options:

**1. Subagent-Driven (recommended)** — Claude dispatches one subagent per task, reviews output between tasks, maintains context in the main session. Excellent for parallelization (especially Tasks 2.1, 3.1, 4.1). Use `superpowers:subagent-driven-development`.

**2. Inline Execution** — Claude executes tasks one at a time in the current session. Slower but maximally deliberate.

Karim — pick one when ready to execute. Recommendation: subagent-driven, with review checkpoints at Phase 0, Phase 2, Phase 6, Phase 10.
