"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type PixelRevealDirection =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "random";

export type PixelRevealEasing =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut";

export interface PixelRevealProps {
  id?: string;
  children: React.ReactNode;
  /** Size of each pixel cell in CSS px — matches uGridSize in the reference (default: 20) */
  cellSize?: number;
  /** Total animation duration in ms (default: 500) */
  duration?: number;
  /** Color of the pixel cells (default: #111) */
  pixelColor?: string;
  /** Direction the reveal sweeps from (default: "top") */
  direction?: PixelRevealDirection;
  /** 0–1: how much direction influences vs pure random scatter (default: 0.6) */
  directionBias?: number;
  /** Timing curve applied to the overall progress (default: "linear") */
  easing?: PixelRevealEasing;
  /** Called once the reveal animation completes */
  onComplete?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

// ─── Easing functions ──────────────────────────────────────────────────────────

function applyEasing(t: number, easing: PixelRevealEasing): number {
  switch (easing) {
    case "easeIn":
      return t * t;
    case "easeOut":
      return 1 - (1 - t) * (1 - t);
    case "easeInOut":
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    case "linear":
    default:
      return t;
  }
}

// ─── Directional threshold ─────────────────────────────────────────────────────
// Returns a 0–1 value based on a cell's grid position and the chosen direction.

function directionalValue(
  row: number,
  col: number,
  rows: number,
  cols: number,
  direction: PixelRevealDirection,
): number {
  const ny = row / Math.max(rows - 1, 1);
  const nx = col / Math.max(cols - 1, 1);

  switch (direction) {
    case "top":
      return ny; // top reveals first (low threshold)
    case "bottom":
      return 1 - ny;
    case "left":
      return nx;
    case "right":
      return 1 - nx;
    case "center": {
      // Distance from center, normalized 0–1
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      return Math.sqrt(dx * dx + dy * dy) / Math.SQRT1_2; // max dist = √0.5
    }
    case "random":
      return Math.random();
    default:
      return ny;
  }
}

export function PixelReveal({
  children,
  cellSize = 20,
  duration = 500,
  pixelColor = "#111111",
  direction = "top",
  directionBias = 0.6,
  easing = "linear",
  onComplete,
  style,
  className,
}: PixelRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [done, setDone] = useState(false);

  useLayoutEffect(() => {
    if (done) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cols = Math.ceil(width / cellSize) + 1;
    const rows = Math.ceil(height / cellSize) + 1;

    // Each cell gets a threshold: the progress value at which it disappears.
    // `directionBias` controls how much the directional sweep matters vs
    // pure randomness — 1.0 is a clean wipe, 0.0 is fully random scatter.
    const bias = Math.max(0, Math.min(1, directionBias));
    const thresholds = new Float32Array(cols * rows);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dv = directionalValue(row, col, rows, cols, direction);
        thresholds[row * cols + col] =
          dv * bias + Math.random() * (1 - bias);
      }
    }

    // Solid cover before the first frame — prevents any flash of real content
    ctx.fillStyle = pixelColor;
    ctx.fillRect(0, 0, width, height);

    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const progress = applyEasing(raw, easing);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = pixelColor;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Cell is still "dark" if its threshold hasn't been crossed yet
          if (thresholds[row * cols + col] > progress) {
            ctx.fillRect(
              col * cellSize,
              row * cellSize,
              cellSize,
              cellSize,
            );
          }
        }
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [done, duration, cellSize, pixelColor, direction, directionBias, easing, onComplete]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", ...style }}
    >
      {children}
      {!done && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
