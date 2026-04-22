"use client";
// Focus color map — organic blob sort + YouTube play-button spatial sort.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).
// Shared across all MainGridView instances; pre-computed once at module load.

import * as React from "react";
import { ALL_SHAPES_X, ALL_SHAPES_Y, PLAY_SHAPE_INDEX } from "@/components/particles/shapes";

const _FOCUS_N      = 1500;
const _FOCUS_GOLDEN = (1 + Math.sqrt(5)) / 2;

function _focusLcgNoise(i: number): number {
  let s = (i * 1664525 + 1013904223) & 0x7fffffff;
  s = (s * 22695477 + 1) & 0x7fffffff;
  return s / 0x7fffffff;
}

const _focusScores = Array.from({ length: _FOCUS_N }, (_, i) => {
  const theta = (2 * Math.PI * i) / _FOCUS_GOLDEN;
  const phi   = Math.acos(1 - (2 * i) / (_FOCUS_N - 1));
  return (
    theta
    + 0.6 * Math.sin(4  * phi  + 0.7)
    + 0.4 * Math.sin(7  * theta + phi  * 2)
    + 0.3 * Math.sin(13 * phi  - theta * 1.5)
    + 0.2 * (2 * _focusLcgNoise(i) - 1)
  );
});

export const FOCUS_SORTED_ORGANIC: number[] = Array.from({ length: _FOCUS_N }, (_, i) => i)
  .sort((a, b) => _focusScores[a] - _focusScores[b]);

// YouTube play-button sort — spatial x-position split so 72% AI sits on the left face.
// Same algorithm as ParticleSphere.stories.tsx SORTED_YOUTUBE.
const _playX    = Array.from({ length: _FOCUS_N }, (_, i) => ALL_SHAPES_X[i][PLAY_SHAPE_INDEX]);
const _playY    = Array.from({ length: _FOCUS_N }, (_, i) => ALL_SHAPES_Y[i][PLAY_SHAPE_INDEX]);
const _playXMax = Math.max(..._playX.map(Math.abs)) || 1;
const _playYMax = Math.max(..._playY.map(Math.abs)) || 1;

export const FOCUS_SORTED_YOUTUBE: number[] = Array.from({ length: _FOCUS_N }, (_, i) => i)
  .sort((a, b) => {
    const score = (x: number, y: number, i: number) =>
      x / _playXMax + 0.25 * (y / _playYMax) + 0.12 * (2 * _focusLcgNoise(i) - 1);
    return score(_playX[a], _playY[a], a) - score(_playX[b], _playY[b], b);
  });

export const FOCUS_DIM = "#333333";

// FOCUS_ALLOWED_SHAPES virtual index → actual shape index (defined by consumers)
// 0=sphere, 1=cube, 2=torus, 3=PLAY_SHAPE_INDEX
export function buildFocusColorMap(
  areas: Array<{ id: string; pct: number }>,
  selectedId: string,
  activeColor: string,
  dimColor = FOCUS_DIM,
  actualShapeIndex = 0,
): string[] {
  const sorted = actualShapeIndex === PLAY_SHAPE_INDEX ? FOCUS_SORTED_YOUTUBE : FOCUS_SORTED_ORGANIC;
  const map = new Array<string>(_FOCUS_N);
  let offset = 0;
  for (const f of areas) {
    const count = Math.round((f.pct / 100) * _FOCUS_N);
    const end   = Math.min(offset + count, _FOCUS_N);
    const color = f.id === selectedId ? activeColor : dimColor;
    for (let k = offset; k < end; k++) map[sorted[k]] = color;
    offset = end;
  }
  for (let k = offset; k < _FOCUS_N; k++) map[sorted[k]] = dimColor;
  return map;
}

// Theme hook — subscribes to data-theme attribute changes on <html>, same source as PageThemeToggle.
export function useIsDark(): boolean {
  const [isDark, setIsDark] = React.useState(
    () => (typeof document !== "undefined") ? document.documentElement.getAttribute("data-theme") !== "light" : true,
  );
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}
