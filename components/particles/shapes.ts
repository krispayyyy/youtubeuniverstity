// Ported from enzomanuelmangano/demos — scrollable-shapes
// Technique: all shapes share N_POINTS with the same index correspondence,
// so morphing is simply lerping each point's x/y/z to its counterpart.

export const N_POINTS = 1500;
export const N_SHAPES = 11;

export const SHAPE_NAMES = ["sphere", "cube", "torus", "heart", "hand", "face", "play", "atom", "paintbrush", "gear", "rocket"] as const;
export type ShapeName = (typeof SHAPE_NAMES)[number];

export const HAND_SHAPE_INDEX = 4;
export const FACE_SHAPE_INDEX = 5;
export const PLAY_SHAPE_INDEX = 6;
export const ATOM_SHAPE_INDEX = 7;
export const PAINTBRUSH_SHAPE_INDEX = 8;
export const GEAR_SHAPE_INDEX = 9;
export const ROCKET_SHAPE_INDEX = 10;

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
const TARGET_HEIGHT = 200;

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Evenly distributes N points on a unit sphere via Fibonacci lattice.
// All other shapes use the same angular indices for consistent point correspondence.
const fibonacciPoint = (i: number, total: number) => {
  const t = i / total;
  const theta = (2 * Math.PI * i) / GOLDEN_RATIO;
  const phi = Math.acos(1 - 2 * t);
  return { theta, phi, t };
};

const normalizeShape = (points: Point3D[]): Point3D[] => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }

  const scale = TARGET_HEIGHT / (maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  return points.map(p => ({
    x: (p.x - cx) * scale,
    y: (p.y - cy) * scale,
    z: (p.z - cz) * scale,
  }));
};

const scaleShape = (points: Point3D[], factor: number): Point3D[] =>
  points.map(p => ({ x: p.x * factor, y: p.y * factor, z: p.z * factor }));

// ─── Shape generators ────────────────────────────────────────────────────────

const generateSphere = (): Point3D[] => {
  const R = 100;
  return Array.from({ length: N_POINTS }, (_, i) => {
    const { theta, phi } = fibonacciPoint(i, N_POINTS);
    return {
      x: R * Math.sin(phi) * Math.cos(theta),
      y: R * Math.sin(phi) * Math.sin(theta),
      z: R * Math.cos(phi),
    };
  });
};

// Maps each Fibonacci sphere point onto the nearest cube face
const generateCube = (): Point3D[] => {
  const s = 75; // half-size
  return Array.from({ length: N_POINTS }, (_, i) => {
    const { theta, phi } = fibonacciPoint(i, N_POINTS);
    const sx = Math.sin(phi) * Math.cos(theta);
    const sy = Math.sin(phi) * Math.sin(theta);
    const sz = Math.cos(phi);
    const max = Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz));
    return { x: (sx / max) * s, y: (sy / max) * s, z: (sz / max) * s };
  });
};

const generateTorus = (): Point3D[] => {
  const major = 50;
  const minor = 25;
  const ratio = major / minor;
  const minorSeg = Math.round(Math.sqrt(N_POINTS / ratio));
  const majorSeg = Math.round(N_POINTS / minorSeg);
  const points: Point3D[] = [];
  let idx = 0;

  for (let i = 0; i < majorSeg && idx < N_POINTS; i++) {
    const u = (i / majorSeg) * Math.PI * 2;
    for (let j = 0; j < minorSeg && idx < N_POINTS; j++) {
      const v = (j / minorSeg) * Math.PI * 2;
      points.push({
        x: (major + minor * Math.cos(v)) * Math.cos(u),
        y: (major + minor * Math.cos(v)) * Math.sin(u),
        z: minor * Math.sin(v),
      });
      idx++;
    }
  }

  while (points.length < N_POINTS) {
    const t = points.length / N_POINTS;
    const u = t * Math.PI * 2 * majorSeg;
    const v = t * Math.PI * 2 * minorSeg;
    points.push({
      x: (major + minor * Math.cos(v)) * Math.cos(u),
      y: (major + minor * Math.cos(v)) * Math.sin(u),
      z: minor * Math.sin(v),
    });
  }

  return points.slice(0, N_POINTS);
};

// Uses the same Fibonacci angles as the sphere, deformed into a heart surface
const generateHeart = (): Point3D[] => {
  const scale = 120;
  return Array.from({ length: N_POINTS }, (_, i) => {
    const { theta, phi } = fibonacciPoint(i, N_POINTS);
    const u = theta;
    const v = phi;
    const sinV = Math.sin(v);
    const hx = sinV * (15 * Math.sin(u) - 4 * Math.sin(3 * u));
    const hz = 8 * Math.cos(v);
    const hy =
      sinV * (15 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
    return {
      x: hx * scale * 0.06,
      y: -hy * scale * 0.06,
      z: hz * scale * 0.06,
    };
  });
};

// ─── Hand ─────────────────────────────────────────────────────────────────────
//
// Coordinate convention (matches the render loop):
//   x = screen left/right
//   y = screen up/down  (y < 0 = top of screen)
//   z = depth           (z < 0 = closer to viewer)
//
// Designed at exactly 200 units tall so normalizeShape(scale=1) is a no-op.
// Wrist bottom y ≈ +100, middle-finger tip y ≈ -100.
//
// Three irrational multipliers give a deterministic low-discrepancy 3D fill.
const SQRT2 = 1.41421356;
const SQRT3 = 1.73205080;
const SQRT5 = 2.23606797;

const generateHand = (): Point3D[] => {
  const points: Point3D[] = [];
  const HAND_DEPTH = 5; // half-depth (z direction) — hand is thin

  const fillBox = (cx: number, cy: number, hx: number, hy: number, n: number) => {
    for (let k = 0; k < n; k++) {
      points.push({
        x: cx + ((k * SQRT2) % 1) * 2 * hx - hx,
        y: cy + ((k * SQRT3) % 1) * 2 * hy - hy,
        z: ((k * SQRT5) % 1) * 2 * HAND_DEPTH - HAND_DEPTH,
      });
    }
  };

  // Wrist — narrow, bottom of hand
  fillBox(0, 82, 20, 18, 200);
  // Palm — wide central block
  fillBox(0, 28, 35, 36, 350);
  // Index finger
  fillBox(-20, -47, 6.5, 37, 185);
  // Middle finger (longest)
  fillBox(-6, -55, 6.5, 45, 200);
  // Ring finger
  fillBox(6, -50, 6.5, 40, 185);
  // Pinky
  fillBox(22, -43, 5.5, 33, 155);

  // Thumb — angled box from left side of palm, tucked toward upper-left
  // Base ≈ (−32, +15), tip ≈ (−48, −15), direction ≈ (−0.47, −0.88)
  {
    const n = 225;
    const tdx = -0.47, tdy = -0.88; // direction (normalised)
    const tpx =  0.88, tpy = -0.47; // perpendicular
    const halfLen = 17, halfW = 7;
    const cx = -40, cy = 0;
    for (let k = 0; k < n; k++) {
      const along = ((k * SQRT2) % 1) * 2 * halfLen - halfLen;
      const perp  = ((k * SQRT3) % 1) * 2 * halfW  - halfW;
      const depth = ((k * SQRT5) % 1) * 2 * HAND_DEPTH - HAND_DEPTH;
      points.push({
        x: cx + tdx * along + tpx * perp,
        y: cy + tdy * along + tpy * perp,
        z: depth,
      });
    }
  }

  return points.slice(0, N_POINTS);
};

// ─── Face ─────────────────────────────────────────────────────────────────────
//
// Uses the same Fibonacci (theta, phi) angles as the sphere so morphing from
// sphere → face is per-point with no index scrambling.
//
// Model axes: x = left/right, y = up/down (−y = top/forehead), z = depth (−z = nose/front).
// φ=0 → top of head (y = −H), φ=π → chin (y = +H).
// "Front" of face: sinθ = −1 (θ = 3π/2) gives z ≈ −D (closest to viewer).
//
// Features baked in: chin taper, forehead rounding, nose protrusion, brow ridge.
const generateFace = (): Point3D[] => {
  const W = 60;  // half-width
  const H = 100; // half-height  (gives 200 total Y span → normalizeShape scale = 1)
  const D = 35;  // half-depth

  return Array.from({ length: N_POINTS }, (_, i) => {
    const { theta, phi } = fibonacciPoint(i, N_POINTS);
    const sinPhi   = Math.sin(phi);
    const cosPhi   = Math.cos(phi);   // +1 = top-of-head, −1 = chin
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta); // −1 = face-front (toward viewer)

    // Base ellipsoid — full head coverage
    let x = W * sinPhi * cosTheta;
    let y = H * (-cosPhi);           // φ=0 → y = −H (top),  φ=π → y = +H (chin)
    let z = D * sinPhi * sinTheta;   // sinθ=−1 → z = −D (front), sinθ=+1 → z = +D (back)

    // Chin tapering — lower face narrows in X
    if (y > H * 0.1) {
      const t = (y / H - 0.1) / 0.9;
      x *= 1 - t * 0.55;
    }

    // Forehead rounding — upper cranium slightly narrower
    if (y < -H * 0.2) {
      const t = (-y / H - 0.2) / 0.8;
      x *= 1 - t * 0.2;
    }

    // Nose protrusion — front-facing particles only, at mid-face level
    const frontness = Math.max(0, -sinTheta); // 0 = back, 1 = front
    if (frontness > 0.5) {
      const noseVert  = Math.max(0, 1 - Math.abs(y / H + 0.05) * 5);
      const noseHoriz = Math.max(0, 1 - Math.abs(x) / 25);
      const strength  = (frontness - 0.5) / 0.5;
      z -= strength * noseVert * noseHoriz * 15; // push toward viewer
    }

    // Brow ridge — slight protrusion just above nose
    if (frontness > 0.4 && y > -H * 0.4 && y < -H * 0.1) {
      const bs = Math.max(0, frontness - 0.4) / 0.6;
      const bv = Math.max(0, 1 - Math.abs(y / H + 0.25) / 0.15);
      z -= bs * bv * 6;
    }

    return { x, y, z };
  });
};

// ─── YouTube play button ──────────────────────────────────────────────────────
//
// 3D slab: rounded rectangle body (4:3 aspect, YouTube proportions) with a
// right-pointing play triangle slightly raised from the front face.
//
// Surface regions:
//   Front face   — deterministic grid inside rounded rect
//   Back face    — sparser grid
//   Side walls   — evenly spaced angles, z from irrational sequence
//   Triangle     — extra grid on the raised play arrow face
//   Fill         — jittered copies of existing points to reach N_POINTS
//
// All arithmetic is deterministic (no Math.random) — same irrational-sequence
// approach as generateHand().
//
// Triangle particle indices are tracked in PLAY_BUTTON_TRIANGLE_MASK so the
// renderer can colour those particles independently (e.g. YouTube red).

// Populated as a side-effect of generatePlayButton(); safe because ALL_SHAPES
// is initialised before PLAY_BUTTON_TRIANGLE_MASK is exported.
let _playTriangleMask: Uint8Array = new Uint8Array(N_POINTS);

const generatePlayButton = (): Point3D[] => {
  const points: Point3D[] = [];
  const triMask = new Uint8Array(N_POINTS);

  // Dimensions (pre-normalizeShape; normalizeShape will scale to TARGET_HEIGHT)
  const W = 140, H = 100, halfD = 15, R = 22;
  const halfW = W / 2, halfH = H / 2;

  // Play triangle: left-pointing arrow centred on the button face
  const TX1 =  20, TY1 = -28; // bottom-right vertex
  const TX2 =  20, TY2 =  28; // top-right vertex
  const TX3 = -32, TY3 =   0; // left tip

  const inRoundedRect = (x: number, y: number): boolean => {
    const dx = Math.max(0, Math.abs(x) - (halfW - R));
    const dy = Math.max(0, Math.abs(y) - (halfH - R));
    return dx * dx + dy * dy <= R * R;
  };

  const inTriangle = (x: number, y: number): boolean => {
    const d1 = (x - TX2) * (TY1 - TY2) - (TX1 - TX2) * (y - TY2);
    const d2 = (x - TX3) * (TY2 - TY3) - (TX2 - TX3) * (y - TY3);
    const d3 = (x - TX1) * (TY3 - TY1) - (TX3 - TX1) * (y - TY1);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };

  // Helpers that push a point and optionally mark it as a triangle particle
  const push    = (p: Point3D)              => { points.push(p); };
  const pushTri = (p: Point3D)              => { triMask[points.length] = 1; points.push(p); };

  // Front face — 20×20 grid with quasi-random jitter
  for (let ci = 0; ci < 20; ci++) {
    for (let ri = 0; ri < 20; ri++) {
      const k = ci * 20 + ri;
      const x = -halfW + (ci + 0.5 + ((k * SQRT2) % 0.4) - 0.2) * (W / 20);
      const y = -halfH + (ri + 0.5 + ((k * SQRT3) % 0.4) - 0.2) * (H / 20);
      if (!inRoundedRect(x, y)) continue;
      if (inTriangle(x, y)) pushTri({ x, y, z: halfD + 3 });
      else                   push  ({ x, y, z: halfD });
    }
  }

  // Back face — 16×12 grid
  for (let ci = 0; ci < 16; ci++) {
    for (let ri = 0; ri < 12; ri++) {
      const k = ci * 12 + ri;
      const x = -halfW + (ci + 0.5 + ((k * SQRT2) % 0.4) - 0.2) * (W / 16);
      const y = -halfH + (ri + 0.5 + ((k * SQRT3) % 0.4) - 0.2) * (H / 12);
      if (!inRoundedRect(x, y)) continue;
      push({ x, y, z: -halfD });
    }
  }

  // Side walls — evenly spaced perimeter angles, z from irrational sequence.
  // Binary search finds the exact rounded-rect boundary at each angle.
  for (let i = 0; i < 500; i++) {
    const angle = (i / 500) * Math.PI * 2;
    const z = (((i * SQRT5) % 1) - 0.5) * halfD * 2;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    let lo = 0, hi = halfW + halfH;
    for (let iter = 0; iter < 20; iter++) {
      const mid = (lo + hi) / 2;
      if (inRoundedRect(mid * cosA, mid * sinA)) lo = mid; else hi = mid;
    }
    push({ x: lo * cosA, y: lo * sinA, z });
  }

  // Triangle face — extra layer on the play arrow (all triangle-tagged)
  for (let ci = 0; ci < 14; ci++) {
    for (let ri = 0; ri < 10; ri++) {
      const k = ci * 10 + ri;
      const x = TX1 + (ci + 0.5 + ((k * SQRT2) % 0.4) - 0.2) * ((TX3 - TX1) / 14);
      const y = TY1 + (ri + 0.5 + ((k * SQRT3) % 0.4) - 0.2) * ((TY2 - TY1) / 10);
      if (!inTriangle(x, y)) continue;
      pushTri({ x, y, z: halfD + 3 });
    }
  }

  // Fill remaining to reach N_POINTS by jittering existing points;
  // inherit the triangle tag from the source particle.
  const preFillLen = points.length;
  while (points.length < N_POINTS) {
    const k = points.length;
    const srcIdx = k % preFillLen;
    const src = points[srcIdx];
    if (triMask[srcIdx]) triMask[points.length] = 1;
    points.push({
      x: src.x + ((k * SQRT2) % 1 - 0.5) * 4,
      y: src.y + ((k * SQRT3) % 1 - 0.5) * 4,
      z: src.z + ((k * SQRT5) % 1 - 0.5) * 2,
    });
  }

  _playTriangleMask = triMask;
  return points.slice(0, N_POINTS);
};

// ─── Atom ─────────────────────────────────────────────────────────────────────
//
// Central nucleus + 3 orbital rings at 0°, 60°, 120° (rotation around Z-axis).
// From the front the rings appear as: a horizontal stripe, a +60° slash, a −60° slash
// — the classic ⚛ atom symbol. The shape rotates beautifully around the Y-axis.
//
// Ring tilt math: each ring starts in the XZ plane (axis along Y), then is
// rotated around Z by alpha. This creates the fan of three orbital ellipses.

const generateAtom = (): Point3D[] => {
  const pts: Point3D[] = [];
  const R = 65, r = 5;

  // Central nucleus — small Fibonacci sphere
  for (let i = 0; i < 180; i++) {
    const { theta, phi } = fibonacciPoint(i, 180);
    pts.push({
      x: 13 * Math.sin(phi) * Math.cos(theta),
      y: 13 * Math.sin(phi) * Math.sin(theta),
      z: 13 * Math.cos(phi),
    });
  }

  // Three orbital rings: in XZ plane, rotated around Z by 0°, 60°, 120°
  let k0 = 0;
  for (let ring = 0; ring < 3; ring++) {
    const alpha = ring * Math.PI / 3; // 0, 60°, 120°
    const cosA = Math.cos(alpha), sinA = Math.sin(alpha);
    for (let k = 0; k < 440; k++) {
      const ki = k + k0;
      const u = ((ki * SQRT2) % 1) * Math.PI * 2;
      const v = ((ki * SQRT3) % 1) * Math.PI * 2;
      // Ring in XZ plane (ring axis = Y)
      const rx = (R + r * Math.cos(v)) * Math.cos(u);
      const ry = r * Math.sin(v);
      const rz = (R + r * Math.cos(v)) * Math.sin(u);
      // Rotate around Z by alpha
      pts.push({ x: cosA * rx - sinA * ry, y: sinA * rx + cosA * ry, z: rz });
    }
    k0 += 440;
  }

  return pts.slice(0, N_POINTS);
};

// ─── Paintbrush ───────────────────────────────────────────────────────────────
//
// Vertical brush: handle at top (y = -90), bristle tip at bottom (y = +90).
// Cylindrically symmetric around Y-axis.

const fillCylinder = (cx: number, radius: number, y0: number, y1: number, n: number, k0: number, pts: Point3D[]) => {
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    const angle = ((ki * SQRT2) % 1) * Math.PI * 2;
    const r = radius * Math.sqrt((ki * SQRT3) % 1);
    const y = y0 + ((ki * SQRT5) % 1) * (y1 - y0);
    pts.push({ x: cx + r * Math.cos(angle), y, z: r * Math.sin(angle) });
  }
};

const fillConeY = (cx: number, r0: number, r1: number, y0: number, y1: number, n: number, k0: number, pts: Point3D[]) => {
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    const t = (ki * SQRT5) % 1;
    const y = y0 + t * (y1 - y0);
    const rMax = r0 + (r1 - r0) * t;
    const r = rMax * Math.sqrt((ki * SQRT2) % 1);
    const angle = ((ki * SQRT3) % 1) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(angle), y, z: r * Math.sin(angle) });
  }
};

const generatePaintbrush = (): Point3D[] => {
  const pts: Point3D[] = [];
  let k0 = 0;
  fillCylinder(0, 7, -90, 20, 550, k0, pts); k0 += 550;
  fillCylinder(0, 11, 20, 38, 150, k0, pts); k0 += 150;
  fillConeY(0, 10, 1.5, 38, 90, 800, k0, pts);
  return pts.slice(0, N_POINTS);
};

// ─── Gear ─────────────────────────────────────────────────────────────────────
//
// Mechanical cog in the XY plane (face-on to viewer). 8 teeth. z = ±12 depth.

const fillDisc = (cx: number, cy: number, radius: number, z0: number, z1: number, n: number, k0: number, pts: Point3D[]) => {
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    const angle = ((ki * SQRT2) % 1) * Math.PI * 2;
    const r = radius * Math.sqrt((ki * SQRT3) % 1);
    const z = z0 + ((ki * SQRT5) % 1) * (z1 - z0);
    pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), z });
  }
};

const fillTooth = (gCx: number, gCy: number, angle: number, innerR: number, outerR: number, halfW: number, z0: number, z1: number, n: number, k0: number, pts: Point3D[]) => {
  const cx = gCx + Math.cos(angle) * (innerR + outerR) / 2;
  const cy = gCy + Math.sin(angle) * (innerR + outerR) / 2;
  const halfH = (outerR - innerR) / 2;
  const rdx = Math.cos(angle), rdy = Math.sin(angle);
  const tdx = -Math.sin(angle), tdy = Math.cos(angle);
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    const radial     = ((ki * SQRT2) % 1) * 2 * halfH - halfH;
    const tangential = ((ki * SQRT3) % 1) * 2 * halfW - halfW;
    const z = z0 + ((ki * SQRT5) % 1) * (z1 - z0);
    pts.push({ x: cx + rdx * radial + tdx * tangential, y: cy + rdy * radial + tdy * tangential, z });
  }
};

const generateGear = (): Point3D[] => {
  const pts: Point3D[] = [];
  let k0 = 0;
  fillDisc(0, 0, 58, -12, 12, 700, k0, pts); k0 += 700;
  for (let i = 0; i < 8; i++) {
    fillTooth(0, 0, i * Math.PI / 4, 58, 78, 9, -12, 12, 100, k0, pts); k0 += 100;
  }
  return pts.slice(0, N_POINTS);
};

// ─── Rocket ───────────────────────────────────────────────────────────────────
//
// Rocket pointing up: nose at y = -90, nozzle at y = +90.
// 3 fins at 120° intervals. Cylindrically symmetric around Y-axis.

const fillConeNose = (rBase: number, yTip: number, yBase: number, n: number, k0: number, pts: Point3D[]) => {
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    const t = (ki * SQRT5) % 1;
    const y = yTip + t * (yBase - yTip);
    const rMax = rBase * t;
    const r = rMax * Math.sqrt((ki * SQRT2) % 1);
    const angle = ((ki * SQRT3) % 1) * Math.PI * 2;
    pts.push({ x: r * Math.cos(angle), y, z: r * Math.sin(angle) });
  }
};

const fillCylinderR = (radius: number, y0: number, y1: number, n: number, k0: number, pts: Point3D[]) => {
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    const angle = ((ki * SQRT2) % 1) * Math.PI * 2;
    const r = radius * Math.sqrt((ki * SQRT3) % 1);
    const y = y0 + ((ki * SQRT5) % 1) * (y1 - y0);
    pts.push({ x: r * Math.cos(angle), y, z: r * Math.sin(angle) });
  }
};

const fillFin = (v0: Point3D, v1: Point3D, v2: Point3D, theta: number, thickness: number, n: number, k0: number, pts: Point3D[]) => {
  for (let k = 0; k < n; k++) {
    const ki = k + k0;
    let s = (ki * SQRT2) % 1;
    let t = (ki * SQRT3) % 1;
    if (s + t > 1) { s = 1 - s; t = 1 - t; }
    const u = 1 - s - t;
    const d = ((ki * SQRT5) % 1) * 2 * thickness - thickness;
    pts.push({
      x: u * v0.x + s * v1.x + t * v2.x + d * (-Math.sin(theta)),
      y: u * v0.y + s * v1.y + t * v2.y,
      z: u * v0.z + s * v1.z + t * v2.z + d * Math.cos(theta),
    });
  }
};

const generateRocket = (): Point3D[] => {
  const pts: Point3D[] = [];
  let k0 = 0;
  fillConeNose(22, -90, -35, 300, k0, pts); k0 += 300;
  fillCylinderR(22, -35, 50, 500, k0, pts); k0 += 500;
  const finAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  for (const theta of finAngles) {
    fillFin(
      { x: 22 * Math.cos(theta), y: 10, z: 22 * Math.sin(theta) },
      { x: 22 * Math.cos(theta), y: 85, z: 22 * Math.sin(theta) },
      { x: 50 * Math.cos(theta), y: 85, z: 50 * Math.sin(theta) },
      theta, 2, 150, k0, pts,
    ); k0 += 150;
  }
  fillConeNose(24, 50, 90, 250, k0, pts);
  return pts.slice(0, N_POINTS);
};

// ─── Pre-compute & export ─────────────────────────────────────────────────────

const ALL_SHAPES: Point3D[][] = [
  normalizeShape(generateSphere()),
  scaleShape(normalizeShape(generateCube()), 0.75),
  scaleShape(normalizeShape(generateTorus()), 1.2),
  normalizeShape(generateHeart()),
  normalizeShape(generateHand()),
  normalizeShape(generateFace()),
  scaleShape(normalizeShape(generatePlayButton()), 0.78),
  scaleShape(normalizeShape(generateAtom()), 0.85),
  normalizeShape(generatePaintbrush()),
  normalizeShape(generateGear()),
  normalizeShape(generateRocket()),
];

// Exported after ALL_SHAPES is built (generatePlayButton sets _playTriangleMask
// as a side-effect, so this is populated by the time it is read by importers).
export const PLAY_BUTTON_TRIANGLE_MASK: Uint8Array = _playTriangleMask;

// Flat arrays structured for fast per-frame interpolation:
// ALL_SHAPES_X[pointIndex] = [sphere.x, cube.x, torus.x, heart.x]
export const ALL_SHAPES_X: Float32Array[] = Array.from(
  { length: N_POINTS },
  (_, i) => new Float32Array(ALL_SHAPES.map(s => s[i].x)),
);
export const ALL_SHAPES_Y: Float32Array[] = Array.from(
  { length: N_POINTS },
  (_, i) => new Float32Array(ALL_SHAPES.map(s => s[i].y)),
);
export const ALL_SHAPES_Z: Float32Array[] = Array.from(
  { length: N_POINTS },
  (_, i) => new Float32Array(ALL_SHAPES.map(s => s[i].z)),
);
