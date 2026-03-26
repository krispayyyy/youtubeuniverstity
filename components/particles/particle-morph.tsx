"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMediaQuery } from "@/components/use-media-query";
import { useMotionValue, animate } from "framer-motion";
import {
  N_POINTS,
  N_SHAPES,
  SHAPE_NAMES,
  ALL_SHAPES_X,
  ALL_SHAPES_Y,
  ALL_SHAPES_Z,
  PLAY_SHAPE_INDEX,
  PLAY_BUTTON_TRIANGLE_MASK,
} from "./shapes";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSPECTIVE = 350;
const X_TILT = 0.2;
const DEFAULT_ROTATION_SPEED = 0.35; // rad/sec

// Physics-tuned values (Physics Tuner story baseline, Feb 2026).
// Damping ratio ζ = damping / (2 * √(stiffness × mass)).
// Previous values gave ζ ≈ 0.375 (underdamped → visible overshoot/bounce).
// New values: ζ = 22 / (2 × √(100 × 1)) = 22/20 = 1.1 — just over critical,
// so morphProgress glides smoothly into the target with no bounce at all.
const MORPH_SPRING = {
  type: "spring" as const,
  stiffness: 100,
  damping: 22,
  mass: 1,
};

// Dispersion physics constants
//
// Principle (Simulating Physics):
// Cursor hover carries no real momentum → near-critical damping, no dramatic bounce.
// The subtle elastic quality comes from a well-damped spring (one smooth arc back),
// NOT from low friction / multiple oscillations.
//
// Equilibrium displacement formula: dispMax ≈ repelStrength / SPRING_K
// → 0.35 / 0.05 ≈ 7px at cursor centre — matches Gunnar's soft dimple.
const SPRING_K = 0.05;    // spring stiffness — lower = slower, smoother return arc
const FRICTION = 0.84;    // lower value = more damping = single smooth arc, settles fast
const VELOCITY_SCALE = 0.025; // cursor speed amplification — keep very low

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParticleMorphProps {
  /** Starting shape index (0–6: sphere, cube, torus, heart, hand, face, play) */
  initialShape?: number;
  /** Controlled shape index — animates to this shape when it changes */
  shape?: number;
  /** Radians per second for continuous Y-axis rotation (horizontal spin) */
  rotationSpeed?: number;
  /** Radians per second for continuous X-axis rotation (vertical tumble) */
  rotationSpeedX?: number;
  /** Radians per second for continuous Z-axis rotation (barrel roll) */
  rotationSpeedZ?: number;
  /** Particle color as hex string */
  particleColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Enable cursor dispersion with velocity-based physics */
  cursorDispersion?: boolean;
  /** Radius in screen pixels within which particles are repelled (larger = softer gradient) */
  cursorRadius?: number;
  /** Peak repulsion force at the cursor center — keep low for a subtle dimple */
  repelStrength?: number;
  /** Impulse force applied to all particles on click */
  clickForce?: number;
  /** Hide the shape selector buttons */
  hideControls?: boolean;
  /**
   * Looping wrist-wave oscillation. Rotates all particles around a pivot on the
   * Z-axis (depth) in model XY space, so the hand swings naturally left/right.
   * Designed for the hand shape (index 4) but works on any shape.
   */
  waveAnimation?: boolean;
  /** Full period of one wave cycle in seconds (default 2.2) */
  wavePeriod?: number;
  /** Peak swing angle in radians (default 0.28 ≈ 16°) */
  waveAmplitude?: number;
  /** Y coordinate of the pivot point in model space — set to wrist bottom (default 100) */
  wavePivotY?: number;
  /**
   * Per-segment particle colors. Each entry claims a fraction of the 1500 particles
   * (in index order) and assigns them a color. Fractions should sum to ≤1; the
   * remainder uses particleColor. When undefined, all particles use particleColor.
   */
  particleSegments?: Array<{ color: string; fraction: number }>;
  /**
   * Direct per-particle color override — a hex string for every one of the 1500
   * particles. Takes priority over particleSegments. Use this when you need
   * spatial control (e.g. longitude-sector blobs) that the fraction API can't express.
   */
  particleColorMap?: string[];
  /** Disable the scroll-to-morph interaction (useful when the sphere is inside a scrollable page) */
  disableScroll?: boolean;
  /**
   * Restrict morphing to a subset of shapes. Virtual indices 0, 1, 2… map to
   * the actual shape indices in this array — morphs jump directly between them
   * with no intermediate shapes in between.
   *
   * Example — sphere → cube → play with no torus/heart/hand in between:
   *   shapeSequence={[0, 1, 6]}
   */
  shapeSequence?: number[];
  className?: string;
  style?: React.CSSProperties;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRGB(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ParticleMorph({
  initialShape = 0,
  shape: controlledShape,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  rotationSpeedX = 0,
  rotationSpeedZ = 0,
  particleColor = "#ffffff",
  backgroundColor = "#000000",
  cursorDispersion = true,
  cursorRadius = 195,
  repelStrength = 1.20,
  clickForce = 3.0,
  hideControls = false,
  waveAnimation = false,
  wavePeriod = 2.2,
  waveAmplitude = 0.28,
  wavePivotY = 100,
  particleSegments,
  particleColorMap,
  disableScroll = false,
  shapeSequence,
  className,
  style,
}: ParticleMorphProps) {
  // disable all pointer interaction on touch devices — no hover or click, just render
  const isTouch = useMediaQuery("(hover: none)");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Controlled mode: use the controlled shape as the starting value so
  // there's no visible morph from the wrong shape on first frame.
  const effectiveInitial = controlledShape ?? initialShape;
  const morphProgress = useMotionValue(effectiveInitial);

  // Mutable config refs — never restarts the RAF loop on prop change
  const rotationSpeedRef = useRef(rotationSpeed);
  const rotationSpeedXRef = useRef(rotationSpeedX);
  const rotationSpeedZRef = useRef(rotationSpeedZ);
  const colorRef = useRef(hexToRGB(particleColor));
  const bgColorRef = useRef(backgroundColor);
  const activeShapeRef = useRef(effectiveInitial);
  const cursorDispersionRef = useRef(cursorDispersion);
  const cursorRadiusRef = useRef(cursorRadius);
  const repelStrengthRef = useRef(repelStrength);
  const clickForceRef = useRef(clickForce);
  const waveAnimationRef = useRef(waveAnimation);
  const wavePeriodRef = useRef(wavePeriod);
  const waveAmplitudeRef = useRef(waveAmplitude);
  const wavePivotYRef = useRef(wavePivotY);

  useEffect(() => { rotationSpeedRef.current = rotationSpeed; }, [rotationSpeed]);
  useEffect(() => { rotationSpeedXRef.current = rotationSpeedX; }, [rotationSpeedX]);
  useEffect(() => { rotationSpeedZRef.current = rotationSpeedZ; }, [rotationSpeedZ]);
  useEffect(() => { colorRef.current = hexToRGB(particleColor); }, [particleColor]);
  useEffect(() => { bgColorRef.current = backgroundColor; }, [backgroundColor]);
  useEffect(() => { cursorDispersionRef.current = cursorDispersion; }, [cursorDispersion]);
  useEffect(() => { cursorRadiusRef.current = cursorRadius; }, [cursorRadius]);
  useEffect(() => { repelStrengthRef.current = repelStrength; }, [repelStrength]);
  useEffect(() => { clickForceRef.current = clickForce; }, [clickForce]);
  useEffect(() => { waveAnimationRef.current = waveAnimation; }, [waveAnimation]);
  useEffect(() => { wavePeriodRef.current = wavePeriod; }, [wavePeriod]);
  useEffect(() => { waveAmplitudeRef.current = waveAmplitude; }, [waveAmplitude]);
  useEffect(() => { wavePivotYRef.current = wavePivotY; }, [wavePivotY]);

  const shapeSequenceRef = useRef(shapeSequence ?? null);
  useEffect(() => { shapeSequenceRef.current = shapeSequence ?? null; }, [shapeSequence]);

  // ─── Direct per-particle color map (takes priority over particleSegments) ─
  const particleColorMapRef = useRef<string[] | null>(particleColorMap ?? null);
  useEffect(() => { particleColorMapRef.current = particleColorMap ?? null; }, [particleColorMap]);

  // ─── Per-particle segment colors ──────────────────────────────────────────
  //
  // When particleSegments is provided, we pre-compute a string[] of length N_POINTS
  // so the RAF loop does a single O(1) array lookup per particle instead of any math.
  // Each segment claims Math.round(fraction * N_POINTS) consecutive particles.
  const perParticleColorsRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (!particleSegments || particleSegments.length === 0) {
      perParticleColorsRef.current = null;
      return;
    }
    // pre-compute: assign a hex color string to each particle index
    const colors = new Array<string>(N_POINTS);
    let offset = 0;
    for (const seg of particleSegments) {
      const count = Math.round(seg.fraction * N_POINTS);
      const end = Math.min(offset + count, N_POINTS);
      for (let i = offset; i < end; i++) colors[i] = seg.color;
      offset = end;
    }
    // fill any remainder (fractions didn't sum to 1) with the base particleColor
    const fallback = `rgb(${colorRef.current.join(",")})`;
    for (let i = offset; i < N_POINTS; i++) colors[i] = fallback;
    perParticleColorsRef.current = colors;
  }, [particleSegments]);

  const [activeShape, setActiveShape] = useState(effectiveInitial);

  // Controlled mode: animate when prop changes externally.
  // Returns a cleanup that stops the animation — prevents stale springs in
  // React Strict Mode's double-mount cycle.
  useEffect(() => {
    if (controlledShape === undefined) return;
    if (controlledShape === activeShapeRef.current) return;
    activeShapeRef.current = controlledShape;
    setActiveShape(controlledShape);
    const controls = animate(morphProgress, controlledShape, MORPH_SPRING);
    return () => controls.stop();
  }, [controlledShape, morphProgress]);

  // ─── Per-particle dispersion state (allocated once, never causes re-render)

  const dispX = useRef(new Float32Array(N_POINTS));
  const dispY = useRef(new Float32Array(N_POINTS));
  const velX = useRef(new Float32Array(N_POINTS));
  const velY = useRef(new Float32Array(N_POINTS));

  // Cursor state tracked in a single object ref to avoid multiple lookups
  const cursor = useRef({ x: -9999, y: -9999, vx: 0, vy: 0, speed: 0 });
  // Click burst: set force here, consumed on next frame
  const pendingBurst = useRef<{ x: number; y: number; force: number } | null>(null);

  // ─── Canvas render loop ───────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    let rafId = 0;
    let lastTime = 0;
    let rotY = 0;
    let rotXAccum = 0;
    let rotZAccum = 0;
    let width = 0;
    let height = 0;

    const setupSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    setupSize();
    const observer = new ResizeObserver(setupSize);
    observer.observe(canvas);

    const render = (timestamp: number) => {
      if (!ctx || width === 0) { rafId = requestAnimationFrame(render); return; }

      const dt = lastTime === 0 ? 0 : Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;
      rotY += rotationSpeedRef.current * dt;
      rotXAccum += rotationSpeedXRef.current * dt;
      rotZAccum += rotationSpeedZRef.current * dt;

      ctx.fillStyle = bgColorRef.current;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // When shapeSequence is set, virtual mp (0, 1, 2…) maps to actual shape
      // indices via the sequence — morphs skip straight between listed shapes.
      const seq = shapeSequenceRef.current;
      const seqLen = seq ? seq.length : N_SHAPES;
      const mp = Math.max(0, Math.min(morphProgress.get(), seqLen - 1));
      const segIdx = Math.min(Math.floor(mp), seqLen - 2);
      const t = mp - segIdx;
      const shapeIdx = seq ? seq[segIdx]     : segIdx;
      const nextIdx  = seq ? seq[segIdx + 1] : segIdx + 1;

      // Rotation: base X tilt + accumulated X/Y/Z rotation from props
      const totalX = X_TILT + rotXAccum;
      const cosXT = Math.cos(totalX);
      const sinXT = Math.sin(totalX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZAccum);
      const sinZ = Math.sin(rotZAccum);

      const [r, g, b] = colorRef.current;

      // playBlend: 1 when fully on play shape, 0 when ≥1 step away.
      // With a sequence, find the virtual index of PLAY_SHAPE_INDEX in the seq.
      const playVirtualIdx = seq ? seq.indexOf(PLAY_SHAPE_INDEX) : PLAY_SHAPE_INDEX;
      const playBlend = playVirtualIdx >= 0
        ? Math.max(0, 1 - Math.abs(mp - playVirtualIdx))
        : 0;
      const baseColorStr = `rgb(${r},${g},${b})`;
      const triColorStr = playBlend > 0.01
        ? `rgb(${Math.round(r + (255 - r) * playBlend)},${Math.round(g * (1 - playBlend * 0.82))},${Math.round(b * (1 - playBlend * 0.82))})`
        : baseColorStr;

      // Dispersion inputs — read once per frame
      const doDispersion = cursorDispersionRef.current;
      const mx = cursor.current.x;
      const my = cursor.current.y;
      const cursorSpeed = cursor.current.speed;
      const R = cursorRadiusRef.current;
      const R2 = R * R;
      const strength = repelStrengthRef.current;
      const burst = pendingBurst.current;
      pendingBurst.current = null;

      // Wave animation — Z-axis rotation (XY plane) around wrist pivot
      const doWave = waveAnimationRef.current;
      const waveAngle = doWave
        ? Math.sin((timestamp / 1000) * (Math.PI * 2) / wavePeriodRef.current) * waveAmplitudeRef.current
        : 0;
      const cosW = doWave ? Math.cos(waveAngle) : 1;
      const sinW = doWave ? Math.sin(waveAngle) : 0;
      const pivot = wavePivotYRef.current;

      const dxArr = dispX.current;
      const dyArr = dispY.current;
      const vxArr = velX.current;
      const vyArr = velY.current;

      for (let i = 0; i < N_POINTS; i++) {
        // ── 3D interpolation ──────────────────────────────────────────────
        const shX = ALL_SHAPES_X[i];
        const shY = ALL_SHAPES_Y[i];
        const shZ = ALL_SHAPES_Z[i];

        let bx = shX[shapeIdx] + t * (shX[nextIdx] - shX[shapeIdx]);
        let by = shY[shapeIdx] + t * (shY[nextIdx] - shY[shapeIdx]);
        let bz = shZ[shapeIdx] + t * (shZ[nextIdx] - shZ[shapeIdx]);

        // ── Wave rotation (Z-axis, pivoting at wrist) ─────────────────────
        if (doWave) {
          const relY = by - pivot;
          const wbx = bx * cosW - relY * sinW;
          const wby = bx * sinW + relY * cosW + pivot;
          bx = wbx;
          by = wby;
        }

        // ── 3D rotation: X (tilt + tumble) → Y (horizontal spin) → Z (barrel roll)
        const ry1 = by * cosXT - bz * sinXT;
        const rz1 = by * sinXT + bz * cosXT;
        const rx2 = bx * cosY + rz1 * sinY;
        const rz2 = -bx * sinY + rz1 * cosY;
        const rx = rx2 * cosZ - ry1 * sinZ;
        const ry = rx2 * sinZ + ry1 * cosZ;
        const rz = rz2;

        // ── Perspective projection ────────────────────────────────────────
        const scale = PERSPECTIVE / (PERSPECTIVE + rz);
        const sx = cx + rx * scale;
        const sy = cy + ry * scale;

        // ── Cursor dispersion physics (screen-space) ──────────────────────
        if (doDispersion) {
          const cdx = sx - mx;
          const cdy = sy - my;
          const dist2 = cdx * cdx + cdy * cdy;

          // Repulsion: quadratic falloff within cursor radius,
          // amplified by how fast the cursor is moving (velocity-based physics)
          if (dist2 < R2 && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const falloff = (1 - dist / R) ** 2;
            const force = falloff * strength * (1 + cursorSpeed * VELOCITY_SCALE);
            vxArr[i] += (cdx / dist) * force;
            vyArr[i] += (cdy / dist) * force;
          }

          // Click burst: radial impulse from click point
          if (burst) {
            const bdx = sx - burst.x;
            const bdy = sy - burst.y;
            const bd2 = bdx * bdx + bdy * bdy;
            if (bd2 > 0.01) {
              const bd = Math.sqrt(bd2);
              // Force falls off with distance but covers the whole sphere
              const falloff = Math.max(0, 1 - bd / (R * 4));
              const f = falloff * burst.force;
              vxArr[i] += (bdx / bd) * f;
              vyArr[i] += (bdy / bd) * f;
            }
          }

          // Spring back toward rest position (0 displacement)
          vxArr[i] += -dxArr[i] * SPRING_K;
          vyArr[i] += -dyArr[i] * SPRING_K;

          // Velocity damping — this is what creates the elastic, gravity-well return
          vxArr[i] *= FRICTION;
          vyArr[i] *= FRICTION;

          // Integrate
          dxArr[i] += vxArr[i];
          dyArr[i] += vyArr[i];
        }

        // ── Draw ──────────────────────────────────────────────────────────
        const finalX = doDispersion ? sx + dxArr[i] : sx;
        const finalY = doDispersion ? sy + dyArr[i] : sy;

        const radius = Math.max(0.3, 1.1 * scale);
        const alpha = Math.min(0.95, Math.max(0.04, scale * 0.85));

        ctx.globalAlpha = alpha;
        // color priority: particleColorMap (direct) > particleSegments (fraction-based) > default
        // When a colorMap is active it is fully authoritative — triangle override is
        // suppressed so the percentage distribution reads correctly on the play shape.
        // The red triangle effect is preserved for stories that use no colorMap.
        // Triangle mask is the top-most layer — it always renders red on the play
        // shape so the YouTube logo is always recognisable, regardless of colorMap.
        // colorMap governs every other particle.
        const ppc = particleColorMapRef.current ?? perParticleColorsRef.current;
        ctx.fillStyle = (PLAY_BUTTON_TRIANGLE_MASK[i] && playBlend > 0.01)
          ? triColorStr
          : (ppc ? ppc[i] : baseColorStr);
        ctx.beginPath();
        ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafId); observer.disconnect(); };
  }, [morphProgress]);

  // ─── Morph trigger ────────────────────────────────────────────────────────

  const scrollAccumRef = useRef(effectiveInitial * 400);

  const morphTo = useCallback(
    (index: number) => {
      if (index === activeShapeRef.current) return;
      activeShapeRef.current = index;
      setActiveShape(index);
      scrollAccumRef.current = index * 400;
      animate(morphProgress, index, MORPH_SPRING);
    },
    [morphProgress],
  );

  // ─── Scroll-to-morph ─────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      scrollAccumRef.current += e.deltaY;
      const target = Math.round(
        Math.max(0, Math.min(N_SHAPES - 1, scrollAccumRef.current / 400)),
      );
      if (target !== activeShapeRef.current) morphTo(target);
    },
    [morphTo],
  );

  // ─── Cursor tracking ─────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    const dvx = nx - cursor.current.x;
    const dvy = ny - cursor.current.y;
    cursor.current.vx = dvx;
    cursor.current.vy = dvy;
    cursor.current.speed = Math.sqrt(dvx * dvx + dvy * dvy);
    cursor.current.x = nx;
    cursor.current.y = ny;
  }, []);

  const handleMouseLeave = useCallback(() => {
    cursor.current = { x: -9999, y: -9999, vx: 0, vy: 0, speed: 0 };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    pendingBurst.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      force: clickForceRef.current,
    };
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", cursor: isTouch || !cursorDispersion ? "default" : "crosshair", ...style }}
      onMouseMove={isTouch ? undefined : handleMouseMove}
      onMouseLeave={isTouch ? undefined : handleMouseLeave}
      onClick={isTouch ? undefined : handleClick}
      onWheel={disableScroll ? undefined : handleWheel}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      {!hideControls && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            pointerEvents: "all",
          }}
        >
          {SHAPE_NAMES.map((name, i) => {
            const isActive = activeShape === i;
            return (
              <button
                key={name}
                onClick={(e) => { e.stopPropagation(); morphTo(i); }}
                style={{
                  background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                  color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 20,
                  padding: "6px 18px",
                  cursor: "pointer",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  fontFamily: "ui-monospace, monospace",
                  textTransform: "uppercase",
                  transition: "background 0.2s, color 0.2s, border-color 0.2s",
                  outline: "none",
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
