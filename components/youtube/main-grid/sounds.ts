"use client";
// Module-scope audio singletons for main-grid interaction feedback.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).
//
// Asset paths use absolute "/sounds/..." to match the Next.js public/ convention
// and the pattern already used in components/youtube/youtube-line-graph.tsx.
// Under Next.js basePath, a small lib/asset-url.ts helper may wrap these later.

let _tickAudio: HTMLAudioElement | null = null;
// cooldown: prevents rapid-fire ticks when moving quickly across card edges
let _lastTickTime = 0;
export const TICK_COOLDOWN_MS = 80;

export function playTick() {
  // SSR guard: Audio API only exists in the browser
  if (typeof window === "undefined") return;
  const now = Date.now();
  // throttle: ignore calls that arrive within the cooldown window
  if (now - _lastTickTime < TICK_COOLDOWN_MS) return;
  _lastTickTime = now;
  if (!_tickAudio) {
    // lazy init: create once on first hover, avoids blocking page load
    _tickAudio = new Audio("/sounds/tick.mp3");
    // volume: 0.35 sits under the visual feedback without competing (try 0.1–0.6)
    _tickAudio.volume = 0.35;
  }
  // reset: allows re-triggering before the previous play finishes
  _tickAudio.currentTime = 0;
  // catch: browsers block autoplay until a user gesture has occurred — safe to ignore
  _tickAudio.play().catch(() => {});
}

let _mainGridPopAudio: HTMLAudioElement | null = null;

export function playMainGridPop() {
  if (typeof window === "undefined") return;
  if (!_mainGridPopAudio) { _mainGridPopAudio = new Audio("/sounds/pop-click.wav"); _mainGridPopAudio.volume = 0.45; }
  _mainGridPopAudio.currentTime = 0;
  _mainGridPopAudio.play().catch(() => {});
}
