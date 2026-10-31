// Dev-only: the spine rig of the female mesh-deformation prototype
// (./FemaleMesh.astro). Pure data and maths, no DOM.
//
// Coordinates are pixels of ./assets/side-body-reconstructed.png, which is the
// box (220, 40)–(360, 700) of reference_assets/kadın_karakter_body_parts_v2.png
// (the "Side (Right)" full figure, near arm removed, the torso behind it
// rebuilt; ../../../../female-mesh-assets/tools/extract.py). The joints were
// placed on that figure by eye, in sheet pixels, and are kept in sheet pixels
// here so they can be checked against the sheet.
//
// Bones: the pelvis (turning at the hip), thirteen spinal control regions
// (L5 … L1, six thoracic pairs, two cervical groups) and the head. Every
// vertex is weighted to these by where it lies along the spine, with a
// Gaussian falloff, so neighbouring regions blend and the one continuous mesh
// bends; the legs below the hip line stay still, the head above the jaw line
// turns as one. The near arm is a separate rigid piece hung from T2–T1.

export type Pt = readonly [number, number];
export type Mat = [number, number, number, number, number, number]; // a b c d e f: x' = a x + c y + e, y' = b x + d y + f

/** The crop's origin in the sheet. */
export const ORIGIN: Pt = [220, 40];
const local = ([x, y]: Pt): Pt => [x - ORIGIN[0], y - ORIGIN[1]];

export interface Bone {
  name: string;
  /** Spinal control region (as opposed to the pelvis and the head). */
  spinal: boolean;
  /** Forward bend at the end of the roll-down, degrees. */
  max: number;
}

/** Joint i is bone i's pivot; joint i + 1 its far end (the last is the head's top, for drawing). */
export const SHEET_JOINTS: Pt[] = [
  [284, 342], // hip (femoral head, approx.)
  [271, 318], // L5/S1
  [274, 306], // L4/L5
  [276, 294], // L3/L4
  [277, 282], // L2/L3
  [276, 270], // L1/L2
  [274, 258], // T12/L1
  [271, 244], // T10/T11
  [269, 230], // T8/T9
  [267, 216], // T6/T7
  [266, 202], // T4/T5
  [266, 188], // T2/T3
  [268, 174], // T1/C7
  [272, 153], // C4/C5
  [277, 131], // C1/occiput: the head's pivot
  [282, 62], // top of the head
];

export const BONES: Bone[] = [
  { name: 'Pelvis (hip)', spinal: false, max: 55 },
  { name: 'L5', spinal: true, max: 5 },
  { name: 'L4', spinal: true, max: 5 },
  { name: 'L3', spinal: true, max: 5 },
  { name: 'L2', spinal: true, max: 5 },
  { name: 'L1', spinal: true, max: 5 },
  { name: 'T12–T11', spinal: true, max: 6 },
  { name: 'T10–T9', spinal: true, max: 6 },
  { name: 'T8–T7', spinal: true, max: 6 },
  { name: 'T6–T5', spinal: true, max: 6 },
  { name: 'T4–T3', spinal: true, max: 6 },
  { name: 'T2–T1', spinal: true, max: 6 },
  { name: 'C7–C5', spinal: true, max: 10 },
  { name: 'C4–C1', spinal: true, max: 10 },
  { name: 'Head', spinal: false, max: 15 },
];

export const HEAD = BONES.length - 1;
/** The arm hangs from the upper thoracic region, turning at the shoulder. */
export const ARM_PARENT = 11;
export const SHEET_SHOULDER: Pt = [273, 182];

/** Below this line (glute fold to hip crease) the legs stay still; above it the pelvis turns. */
export const SHEET_HIP_LINE: [Pt, Pt] = [
  [246, 388],
  [325, 326],
];
/** Above this line (nape to under the chin) the head turns as one piece. */
export const SHEET_HEAD_LINE: [Pt, Pt] = [
  [255, 130],
  [330, 156],
];

export interface Rig {
  joints: Pt[];
  shoulder: Pt;
  hipLine: [Pt, Pt];
  headLine: [Pt, Pt];
  /** Half-width of the legs/pelvis and neck/head blends, px. */
  hipBlend: number;
  headBlend: number;
  /** Gaussian falloff of the spinal weights, in segment lengths. */
  falloff: number;
}

export function defaultRig(): Rig {
  return {
    joints: SHEET_JOINTS.map(local),
    shoulder: local(SHEET_SHOULDER),
    hipLine: [local(SHEET_HIP_LINE[0]), local(SHEET_HIP_LINE[1])],
    headLine: [local(SHEET_HEAD_LINE[0]), local(SHEET_HEAD_LINE[1])],
    hipBlend: 14,
    headBlend: 5,
    falloff: 0.7,
  };
}

/** Signed distance to the line a→b, positive on the side away from the feet (smaller y). */
function side(p: Pt, [a, b]: [Pt, Pt]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const d = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
  // d is measured along the normal (dy, −dx); orient it so the head's side (smaller y) is positive
  return -dx / len <= 0 ? d : -d;
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Arc length along the spine polyline (L5/S1 … C1) of p's nearest point; the ends extend straight. */
function spineParam(p: Pt, spine: Pt[], acc: number[]) {
  let best = Infinity;
  let s = 0;
  const last = spine.length - 2;
  for (let k = 0; k <= last; k++) {
    const [ax, ay] = spine[k];
    const [bx, by] = spine[k + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2;
    if (k > 0) t = Math.max(0, t);
    if (k < last) t = Math.min(1, t);
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = Math.hypot(p[0] - qx, p[1] - qy);
    if (d < best) {
      best = d;
      s = acc[k] + t * Math.sqrt(len2);
    }
  }
  return s;
}

/**
 * Per-vertex bone weights (row-major, BONES.length per vertex), from the rig.
 * The legs keep 1 − Σ (they follow no bone).
 */
export function computeWeights(rig: Rig, rest: Float32Array): Float32Array {
  const n = rest.length / 2;
  const nb = BONES.length;
  const out = new Float32Array(n * nb);
  const spine = rig.joints.slice(1, HEAD + 1); // L5/S1 … C1
  const acc = [0];
  for (let k = 1; k < spine.length; k++) acc.push(acc[k - 1] + Math.hypot(spine[k][0] - spine[k - 1][0], spine[k][1] - spine[k - 1][1]));
  // centre and length of each spinal region along the spine; the pelvis sits one L5 length under L5/S1
  const centre = BONES.map((_, i) => (i === 0 ? -(acc[1] - acc[0]) / 2 : i < HEAD ? (acc[i - 1] + acc[i]) / 2 : 0));
  const length = BONES.map((_, i) => (i === 0 ? acc[1] - acc[0] : i < HEAD ? acc[i] - acc[i - 1] : 1));
  const g = new Float64Array(HEAD);
  for (let v = 0; v < n; v++) {
    const p: Pt = [rest[2 * v], rest[2 * v + 1]];
    const body = smoothstep(-rig.hipBlend, rig.hipBlend, side(p, rig.hipLine));
    const head = smoothstep(-rig.headBlend, rig.headBlend, side(p, rig.headLine));
    const trunk = body * (1 - head);
    const s = spineParam(p, spine, acc);
    let sum = 0;
    for (let i = 0; i < HEAD; i++) {
      // below L5/S1 everything belongs to the pelvis; above, a Gaussian per region
      const z = (s - centre[i]) / (rig.falloff * length[i]);
      g[i] = i === 0 && s < centre[0] ? 1 : Math.exp(-z * z);
      sum += g[i];
    }
    for (let i = 0; i < HEAD; i++) out[v * nb + i] = (trunk * g[i]) / sum;
    out[v * nb + HEAD] = body * head;
  }
  return out;
}

/** Roll-down progress p (0 upright … 1 hanging) → each bone's angle, radians. Top down: head first, hip last. */
export function anglesAt(p: number, bones: Bone[] = BONES): number[] {
  const n = bones.length;
  const span = 0.4; // each bone's share of the roll
  return bones.map((bone, i) => {
    const order = n - 1 - i; // head = 0, pelvis = n − 1
    const start = (order / (n - 1)) * (1 - span);
    return ((bone.max * Math.PI) / 180) * smoothstep(start, start + span, p);
  });
}

const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

/** Turn by a (radians, positive = forward, clockwise on screen) about (cx, cy). */
export function rotateAbout(a: number, [cx, cy]: Pt): Mat {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
}

export const apply = (m: Mat, x: number, y: number): Pt => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/** World matrix of every bone (each turns about its own rest pivot, carried by its parent), and the arm's. */
export function pose(rig: Rig, angles: number[], armHang: number) {
  const bones: Mat[] = [];
  let m: Mat = [1, 0, 0, 1, 0, 0];
  let total = 0;
  for (let i = 0; i < angles.length; i++) {
    m = mul(m, rotateAbout(angles[i], rig.joints[i]));
    bones.push(m);
    if (i <= ARM_PARENT) total += angles[i];
  }
  // The arm keeps part of its rest direction against gravity: it turns back
  // by armHang of the bend it is carried through.
  const arm = mul(bones[ARM_PARENT], rotateAbout(-armHang * total, rig.shoulder));
  return { bones, arm };
}

/** Linear blend skinning: out = Σ wᵢ Mᵢ v (+ legs' share unmoved). */
export function skin(rest: Float32Array, weights: Float32Array, mats: Mat[], out: Float32Array) {
  const nb = mats.length;
  const n = rest.length / 2;
  for (let v = 0; v < n; v++) {
    const x = rest[2 * v];
    const y = rest[2 * v + 1];
    let ox = 0;
    let oy = 0;
    let sum = 0;
    for (let i = 0; i < nb; i++) {
      const w = weights[v * nb + i];
      if (w === 0) continue;
      const m = mats[i];
      ox += w * (m[0] * x + m[2] * y + m[4]);
      oy += w * (m[1] * x + m[3] * y + m[5]);
      sum += w;
    }
    out[2 * v] = ox + (1 - sum) * x;
    out[2 * v + 1] = oy + (1 - sum) * y;
  }
}

/** Serializable rig state, in sheet pixels, for refining by hand. */
export function rigJson(rig: Rig, bones: Bone[] = BONES) {
  const sheet = ([x, y]: Pt) => [Math.round((x + ORIGIN[0]) * 10) / 10, Math.round((y + ORIGIN[1]) * 10) / 10];
  return {
    units: 'sheet px of reference_assets/kadın_karakter_body_parts_v2.png',
    joints: rig.joints.map(sheet),
    bones: bones.map((b, i) => ({ name: b.name, pivot: sheet(rig.joints[i]), maxDeg: b.max })),
    shoulder: sheet(rig.shoulder),
    hipLine: rig.hipLine.map(sheet),
    headLine: rig.headLine.map(sheet),
    hipBlend: rig.hipBlend,
    headBlend: rig.headBlend,
    falloff: rig.falloff,
  };
}
