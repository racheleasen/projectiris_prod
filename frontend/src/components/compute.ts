/* eslint-disable @typescript-eslint/ban-ts-comment */

// ---------- Constants ----------
export const SQ5 = Math.sqrt(5);
export const PHI = (1 + SQ5) / 2;                       // Golden ratio
export const K = (3 * SQ5 - 7) / 2;                     // Custom scaling constant used in dome()

// ---------- Types ----------
export type LM = { x: number; y: number };              // 2D landmark type

type EyeSpec = {
  pupil: number;                                        // Iris center
  corner1: number; corner2: number;                     // Left/right eye corners
  upper: number; lower: number;                         // Upper/lower eyelid
  irisRing: number[];                                   // Landmarks around iris ring
};

export type GazeResult = {
  x: number; y: number; z: number;                      // Gaze vector components
  theta_deg: number; radius: number; bias_deg: number;  // Angular info
  ox: number; oy: number;                               // Gaze origin (midpoint of pupils)
  lx: number; ly: number;                               // Left eye iris center
  rx: number; ry: number;                               // Right eye iris center
};

// ---------- Eye Landmark Mapping ----------
const RIGHT_EYE: EyeSpec = {
  pupil: 468, corner1: 33,  corner2: 133, upper: 159, lower: 145, irisRing: [469,470,471,472],
};
const LEFT_EYE: EyeSpec = {
  pupil: 473, corner1: 263, corner2: 362, upper: 386, lower: 374, irisRing: [474,475,476,477],
};

// ---------- Dome Function ----------
function dome(x: number, y: number, k: number = K): number {
  const r2 = x * x + y * y;
  return Math.exp(-k * r2);                             // Gaussian-like radial decay
}

// ---------- Smoother for Gaze Stability ----------
class Smoother {
  private vx = 0; private vy = 0; private init = false;
  constructor(public alpha = 0.20) {}

  reset() {
    this.vx = 0; this.vy = 0; this.init = false;
  }

  update(nx: number, ny: number): [number, number] {
    if (!this.init) {
      this.vx = nx; this.vy = ny; this.init = true;
    } else {
      const a = this.alpha, b = 1 - a;
      this.vx = a * nx + b * this.vx;
      this.vy = a * ny + b * this.vy;
    }
    return [this.vx, this.vy];
  }
}

// ---------- Bias Correction ----------
function getBiasFromTheta(thetaDeg: number): number {
  // Correct vertical bias in certain gaze angles
  if (-180 < thetaDeg && thetaDeg <= -135) return thetaDeg + 90;
  if ( -45 < thetaDeg && thetaDeg <=    0) return thetaDeg + 90;
  return 0;
}

function applyVerticalBias(x: number, y: number, biasDeg: number): [number, number] {
  if (!biasDeg) return [x, y];
  const b = biasDeg * Math.PI / 180, c = Math.cos(b), s = Math.sin(b);
  return [c * x - s * y, s * x + c * y];
}

// ---------- Index Map Conversion ----------
type EyeIdx = { p: number; c1: number; c2: number; u: number; l: number; ring: number[]; };
const idx = (e: EyeSpec): EyeIdx => ({
  p: e.pupil << 1,
  c1: e.corner1 << 1, c2: e.corner2 << 1,
  u: e.upper << 1, l: e.lower << 1,
  ring: e.irisRing.map(i => i << 1),
});
const L = idx(LEFT_EYE);
const R = idx(RIGHT_EYE);

// ---------- Eye Geometry Helpers ----------
function eyeCenterFromBuf(buf: Float32Array, c1: number, c2: number, u: number, l: number, out: Float32Array) {
  out[0] = (buf[c1] + buf[c2] + buf[u] + buf[l]) * 0.25;
  out[1] = (buf[c1+1] + buf[c2+1] + buf[u+1] + buf[l+1]) * 0.25;
}

function eyeRadiusFromBuf(buf: Float32Array, cx: number, cy: number, c1: number, c2: number, u: number, l: number, phi = PHI) {
  // Average distance from eye center to corners/edges
  const d1 = Math.hypot(buf[c1] - cx, buf[c1+1] - cy);
  const d2 = Math.hypot(buf[c2] - cx, buf[c2+1] - cy);
  const d3 = Math.hypot(buf[u]  - cx, buf[u+1]  - cy);
  const d4 = Math.hypot(buf[l]  - cx, buf[l+1]  - cy);
  return ((d1 + d2 + d3 + d4) * 0.25) * (phi ** 3);
}

function irisCenterFromBuf(buf: Float32Array, pupil: number, ring: number[]): [number, number] {
  const px = buf[pupil], py = buf[pupil+1];
  let sx = 0, sy = 0;
  for (const r of ring) {
    sx += buf[r]; sy += buf[r+1];
  }
  const rx = sx / ring.length, ry = sy / ring.length;
  return [0.6 * px + 0.4 * rx, 0.6 * py + 0.4 * ry];  // Blend of pupil + iris ring
}

function normalizedEyeOffset(buf: Float32Array, eye: EyeIdx, tmp: Float32Array, phi = PHI) {
  eyeCenterFromBuf(buf, eye.c1, eye.c2, eye.u, eye.l, tmp);
  const ecx = tmp[0], ecy = tmp[1];

  const radius = eyeRadiusFromBuf(buf, ecx, ecy, eye.c1, eye.c2, eye.u, eye.l, phi) || 1;
  const [ix, iy] = irisCenterFromBuf(buf, eye.p, eye.ring);

  const scale = radius / (phi * phi);
  const xNorm = (ix - ecx) / scale;
  const yNorm = (iy - ecy) / scale;

  const inv = 1 / (dome(xNorm, yNorm, PHI) || 1);  // Nonlinear radial rescaling
  return { x: xNorm * inv, y: yNorm * inv, ix, iy };
}

// ---------- Buffer Utilities ----------
const bufferPool = {
  lmBuf: null as Float32Array | null,
  ensure(n: number) {
    if (!this.lmBuf || this.lmBuf.length < n)
      this.lmBuf = new Float32Array(n);
  },
  reset() { this.lmBuf = null; }
};

function flattenLM(lm: LM[]): Float32Array {
  const need = lm.length << 1;
  bufferPool.ensure(need);
  const out = bufferPool.lmBuf!;
  for (let i = 0, j = 0; i < lm.length; i++) {
    out[j++] = lm[i].x;
    out[j++] = lm[i].y;
  }
  return out.subarray(0, need);
}

// ---------- Main Gaze Projection Class ----------
export class GazeProjectionTS {
  private smoother = new Smoother(0.20);
  private tmpL = new Float32Array(2);
  private tmpR = new Float32Array(2);

  constructor(private mirrorX = false) {}

  computeTyped(buf: Float32Array, n: number): GazeResult | null {
    if (!buf || n < 478) return null;

    // Get normalized offsets and iris centers
    const Loff = normalizedEyeOffset(buf, L, this.tmpL);
    const Roff = normalizedEyeOffset(buf, R, this.tmpR);

    const rx = 0.5 * (Loff.x + Roff.x);
    const ry = 0.5 * (Loff.y + Roff.y);

    const theta = Math.atan2(ry, rx);
    const thetaDeg = theta * 180 / Math.PI;
    const biasDeg = getBiasFromTheta(thetaDeg);
    const [bx, by] = applyVerticalBias(rx, ry, biasDeg);
    const [gx, gy] = this.smoother.update(bx, by);
    const radius = Math.hypot(gx, gy);

    const z = Math.abs(dome(Loff.x, Loff.y, PHI) ** 2 + dome(Roff.x, Roff.y, PHI) ** 2);

    // Gaze origin = midpoint of iris centers
    let ox = 0.5 * (Loff.ix + Roff.ix);
    let oy = 0.5 * (Loff.iy + Roff.iy);
    if (this.mirrorX) ox = 1 - ox;

    return {
      x: gx, y: gy, z,
      theta_deg: thetaDeg, radius, bias_deg: biasDeg,
      ox, oy,
      lx: Loff.ix, ly: Loff.iy,
      rx: Roff.ix, ry: Roff.iy
    };
  }

  compute(landmarks: LM[]): GazeResult | null {
    if (!landmarks || landmarks.length < 478) return null;
    const buf = flattenLM(landmarks);
    return this.computeTyped(buf, landmarks.length);
  }

  reset() {
    this.smoother.reset();
    bufferPool.reset();
    this.tmpL[0] = this.tmpL[1] = this.tmpR[0] = this.tmpR[1] = 0;
  }

  logBufferSize() {
    console.log("[GazeProjectionTS] lmBuf size:", bufferPool.lmBuf?.byteLength ?? 0, "bytes");
  }
}
