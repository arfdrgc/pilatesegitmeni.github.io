// The dot figure's model: the figure of the development homepage intro
// (/dev/home-intro/, ../home-intro/dotScene.ts) and the dev-only review page
// (src/prototypes/dot-figure/DotFigure.astro). Pure data and maths, no DOM,
// no imports.
//
// The figure is a 3D body: a skeleton (feet planted, legs, pelvis, thirteen
// spinal control joints, head, arms) and the body's volume around it (a
// lofted torso, a head, a neck and tapered limbs). The volume is filled with
// dots once, by seeded dart throwing (`sampleFigure`), and each dot is bound
// to one to three bones. Posing turns the bones; each dot follows its bones
// (`skin`), and ./render.ts projects the dots for any viewing angle and draws
// them as flat circles. Nothing about a dot is random at run time: its place,
// size level, tone and bones come from the seed.
//
// The sampler uses only +, −, ×, ÷ and √ (all exactly rounded in every JS
// engine) and an integer random generator, so a seed gives the same dots in
// every browser. Units: the body is HEIGHT tall; y up from the floor, x
// towards the figure's left, z towards its front.

export type Vec3 = readonly [number, number, number];

export const HEIGHT = 171;

// ---------- Seeded random ----------

/** mulberry32: 32-bit integer state, uniform in [0, 1). */
export function random(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Small maths ----------

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
export const smootherstep = (v: number) => {
  const t = clamp01(v);
  return t * t * t * (t * (6 * t - 15) + 10);
};

/** Smooth curve through [x, ...values] keys (cubic Hermite, flat at local extremes), as in ../posture-rig/rig.ts. */
function curve(keys: readonly (readonly number[])[], column: number) {
  const n = keys.length;
  const at = (k: number) => keys[k][column];
  const slope = keys.slice(1).map((key, k) => (key[column] - at(k)) / (key[0] - keys[k][0]));
  const tangent = keys.map((_, k) => {
    if (k === 0) return slope[0];
    if (k === n - 1) return slope[n - 2];
    return slope[k - 1] * slope[k] <= 0 ? 0 : (slope[k - 1] + slope[k]) / 2;
  });
  return (v: number) => {
    if (v <= keys[0][0]) return at(0);
    if (v >= keys[n - 1][0]) return at(n - 1);
    let k = 0;
    while (v > keys[k + 1][0]) k++;
    const h = keys[k + 1][0] - keys[k][0];
    const t = (v - keys[k][0]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * at(k) + (t3 - 2 * t2 + t) * h * tangent[k] + (-2 * t3 + 3 * t2) * at(k + 1) + (t3 - t2) * h * tangent[k + 1]
    );
  };
}

// ---------- Skeleton (rest pose) ----------

const mirror = ([x, y, z]: Vec3): Vec3 => [-x, y, z];

// The figure's left side; the right is its mirror image.
const ANKLE: Vec3 = [7.6, 8.5, -0.6];
const KNEE: Vec3 = [8, 47.5, 0.8];
const HIP: Vec3 = [8.6, 88, 0];
const SHOULDER: Vec3 = [17.6, 137.5, -1];
const ELBOW: Vec3 = [20, 108.5, -2];
const WRIST: Vec3 = [21.8, 84.5, 0.8];
const FINGERTIP: Vec3 = [22.6, 67, 2.2];
const HEEL: Vec3 = [8, 3, -2];
const TOE: Vec3 = [8.6, 1.4, 18];

/** Thirteen spinal control joints, bottom up, each the pivot at a region's lower edge (as in ../female-mesh/rig.ts). */
const SPINE = [
  { id: 'L5', y: 97, z: -4.8 },
  { id: 'L4', y: 100.5, z: -3.7 },
  { id: 'L3', y: 104, z: -2.9 },
  { id: 'L2', y: 107.5, z: -2.7 },
  { id: 'L1', y: 111, z: -3 },
  { id: 'T12', y: 114.5, z: -3.6 },
  { id: 'T10', y: 119, z: -4.3 },
  { id: 'T8', y: 123.5, z: -4.9 },
  { id: 'T6', y: 128, z: -5.3 },
  { id: 'T4', y: 132.5, z: -5.4 },
  { id: 'T2', y: 137, z: -5.2 }, // carries the shoulders
  { id: 'C7', y: 142, z: -4.2 },
  { id: 'C4', y: 147, z: -2 },
] as const;
const HEAD_PIVOT: Vec3 = [0, 152.5, -0.3];
const PELVIS_PIVOT: Vec3 = [0, HIP[1], HIP[2]];

/** The spine's line, sacrum to the head's pivot: z at a height. */
const spineZ = curve([[84, -8.6], [90, -7.2], ...SPINE.map((s) => [s.y, s.z]), [HEAD_PIVOT[1], HEAD_PIVOT[2]]], 1);

export interface Bone {
  id: string;
  parent: number;
  pivot: Vec3;
  /** The figure's right side: its side bend and twist are mirrored. */
  right?: boolean;
}

// Parents come before their children. The feet are planted (the ground), so
// the chain runs up from them: shin, thigh, pelvis, spine, head. The pelvis
// hangs from the left thigh; both legs always take the same angles here, so
// the right thigh's transform is the same.
export const BONES: readonly Bone[] = (() => {
  const bones: Bone[] = [{ id: 'ground', parent: -1, pivot: [0, 0, 0] }];
  const add = (id: string, parent: string, pivot: Vec3, right?: boolean) => {
    bones.push({ id, parent: bones.findIndex((b) => b.id === parent), pivot, right });
  };
  add('shinL', 'ground', ANKLE);
  add('thighL', 'shinL', KNEE);
  add('shinR', 'ground', mirror(ANKLE), true);
  add('thighR', 'shinR', mirror(KNEE), true);
  add('pelvis', 'thighL', PELVIS_PIVOT);
  let parent = 'pelvis';
  for (const s of SPINE) {
    add(s.id, parent, [0, s.y, s.z]);
    parent = s.id;
  }
  add('head', 'C4', HEAD_PIVOT);
  add('upperArmL', 'T2', SHOULDER);
  add('forearmL', 'upperArmL', ELBOW);
  add('handL', 'forearmL', WRIST);
  add('upperArmR', 'T2', mirror(SHOULDER), true);
  add('forearmR', 'upperArmR', mirror(ELBOW), true);
  add('handR', 'forearmR', mirror(WRIST), true);
  return bones;
})();
const bone = (id: string) => BONES.findIndex((b) => b.id === id);

// ---------- Poses ----------

/**
 * Pose channels. A channel turns one bone, or both sides' bones for a paired
 * one. `shoulder` is measured from hanging straight down: the arms hang
 * whatever the trunk does, unless a pose lifts them. A negative `shoulder`
 * lifts the arm forwards (-180: straight up). `shoulderR`, `elbowR` and
 * `wristR` (2026-10-26, the homepage intro's reach) turn the figure's right
 * arm only, added to the paired channels.
 */
export const CHANNELS = ['shin', 'thigh', 'pelvis', ...SPINE.map((s) => s.id), 'head', 'shoulder', 'elbow', 'wrist', 'shoulderR', 'elbowR', 'wristR'] as const;
export type Channel = (typeof CHANNELS)[number];
/** Degrees: forward bend (positive: the top moves forward), side bend, twist. A number is a forward bend. */
export type Angles = number | readonly [flex: number, side: number, twist: number];
export type Pose = Partial<Record<Channel, Angles>>;

const CHANNEL_BONES: Record<Channel, number[]> = Object.fromEntries(
  CHANNELS.map((c) => {
    const ids: Record<string, string[]> = {
      shin: ['shinL', 'shinR'],
      thigh: ['thighL', 'thighR'],
      shoulder: ['upperArmL', 'upperArmR'],
      elbow: ['forearmL', 'forearmR'],
      wrist: ['handL', 'handR'],
      shoulderR: ['upperArmR'],
      elbowR: ['forearmR'],
      wristR: ['handR'],
    };
    return [c, (ids[c] ?? [c]).map(bone)];
  }),
) as Record<Channel, number[]>;

/** A pose as three numbers per channel, in CHANNELS order. */
export type Resolved = Float64Array;

export function resolve(pose: Pose): Resolved {
  const out = new Float64Array(CHANNELS.length * 3);
  CHANNELS.forEach((c, i) => {
    const a = pose[c] ?? 0;
    if (typeof a === 'number') out[i * 3] = a;
    else out.set(a, i * 3);
  });
  return out;
}

/** Channels from the head down: a roll-down starts at the top, a roll-up at the bottom. */
const TOP_DOWN: readonly Channel[] = ['head', 'C4', 'C7', 'T2', 'T4', 'T6', 'T8', 'T10', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5', 'pelvis', 'thigh', 'shin'];
const RANK: Record<Channel, number> = Object.fromEntries(
  CHANNELS.map((c) => {
    // The arm channels move with the top of the rib cage.
    const k = TOP_DOWN.indexOf(c as (typeof TOP_DOWN)[number]);
    return [c, (k < 0 ? TOP_DOWN.indexOf('T2') : k) / (TOP_DOWN.length - 1)];
  }),
) as Record<Channel, number>;

const flexSum = (p: Resolved) => {
  let s = 0;
  for (let i = 0; i < CHANNELS.length; i++) s += p[i * 3];
  return s;
};

/** How far a transition reaches (sum of channel changes, degrees); the player scales durations by it. */
export function distance(a: Resolved, b: Resolved) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(b[i] - a[i]);
  return s;
}

/**
 * A cascading transition at progress u (0 … 1): each channel moves in its own
 * overlapping window, the top first when the body bends further, the bottom
 * first when it straightens, so the spine articulates one region at a time.
 */
export function cascade(from: Resolved, to: Resolved, u: number, out: Resolved, spread = 0.6) {
  const down = flexSum(to) >= flexSum(from);
  CHANNELS.forEach((c, i) => {
    const rank = down ? RANK[c] : 1 - RANK[c];
    const p = smootherstep((u - rank * spread) / (1 - spread));
    for (let k = i * 3; k < i * 3 + 3; k++) out[k] = from[k] + (to[k] - from[k]) * p;
  });
  return out;
}

export const POSES = {
  // Standing: the rest geometry, arms hanging, elbows soft.
  standing: { elbow: 5 },
  // Halfway: the head, neck and upper back have rolled; the lower back has barely started.
  halfway: { head: 9, C4: 8, C7: 8, T2: 9, T4: 9, T6: 8, T8: 6.5, T10: 4.5, T12: 2.5, L1: 1, pelvis: 4, thigh: -4, shin: 2, elbow: 5 },
  // Rolled down: every region flexed, hinged at the hips, knees soft, head and arms hanging.
  down: {
    head: 14,
    C4: 12,
    C7: 12,
    T2: 7,
    T4: 7,
    T6: 7,
    T8: 7,
    T10: 7,
    T12: 7,
    L1: 6,
    L2: 6,
    L3: 6,
    L4: 6,
    L5: 6,
    pelvis: 82,
    thigh: -14,
    shin: 4,
    elbow: 5,
  },
} satisfies Record<string, Pose>;
export type PoseId = keyof typeof POSES;

// ---------- Bone transforms ----------

/** A 3 × 4 matrix per bone (row-major: rotation | translation), rest space → posed space. */
export type Matrices = Float64Array;
export const newMatrices = (): Matrices => new Float64Array(BONES.length * 12);

const RAD = Math.PI / 180;
const SHOULDERS = new Set(CHANNEL_BONES.shoulder);
/** The channels whose forward bends add up from the ground to the top of the rib cage. */
const TO_T2 = ['shin', 'thigh', 'pelvis', ...SPINE.slice(0, SPINE.findIndex((s) => s.id === 'T2') + 1).map((s) => s.id)].map((c) =>
  CHANNELS.indexOf(c as Channel),
);

export function pose(p: Resolved, out: Matrices = newMatrices()): Matrices {
  const angles = new Float64Array(BONES.length * 3);
  // Every channel adds its angles to its bones: a bone has one channel, or a
  // paired one and its one-sided addition.
  CHANNELS.forEach((c, i) => {
    for (const b of CHANNEL_BONES[c]) for (let k = 0; k < 3; k++) angles[b * 3 + k] += p[i * 3 + k];
  });
  // Hanging arms: undo the forward bend the trunk carries the shoulders through.
  let carried = 0;
  for (const i of TO_T2) carried += p[i * 3];
  for (const b of SHOULDERS) angles[b * 3] -= carried;

  BONES.forEach((b, i) => {
    const flex = angles[i * 3] * RAD;
    const side = (b.right ? -1 : 1) * angles[i * 3 + 1] * RAD;
    const twist = (b.right ? -1 : 1) * angles[i * 3 + 2] * RAD;
    // R = Ry(twist) · Rz(side) · Rx(flex); Rx turns +y towards +z (a forward bend).
    const [cx, sx, cz, sz, cy, sy] = [Math.cos(flex), Math.sin(flex), Math.cos(side), Math.sin(side), Math.cos(twist), Math.sin(twist)];
    // Rz · Rx
    const a = [cz, -sz * cx, sz * sx, sz, cz * cx, -cz * sx, 0, sx, cx];
    // Ry · (Rz · Rx)
    const r = [
      cy * a[0] + sy * a[6],
      cy * a[1] + sy * a[7],
      cy * a[2] + sy * a[8],
      a[3],
      a[4],
      a[5],
      -sy * a[0] + cy * a[6],
      -sy * a[1] + cy * a[7],
      -sy * a[2] + cy * a[8],
    ];
    const [px, py, pz] = b.pivot;
    // Local: x → R (x − pivot) + pivot.
    const local = [
      r[0], r[1], r[2], px - (r[0] * px + r[1] * py + r[2] * pz),
      r[3], r[4], r[5], py - (r[3] * px + r[4] * py + r[5] * pz),
      r[6], r[7], r[8], pz - (r[6] * px + r[7] * py + r[8] * pz),
    ];
    const o = i * 12;
    if (b.parent < 0) {
      out.set(local, o);
      return;
    }
    const q = b.parent * 12;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        let v = out[q + row * 4] * local[col] + out[q + row * 4 + 1] * local[4 + col] + out[q + row * 4 + 2] * local[8 + col];
        if (col === 3) v += out[q + row * 4 + 3];
        out[o + row * 4 + col] = v;
      }
    }
  });
  return out;
}

// ---------- Body volume ----------

/** Movement groups: the settled pose's lines join dots of the same group only. */
export const GROUPS = ['trunk', 'head', 'armL', 'armR', 'legL', 'legR'] as const;

interface Part {
  id: string;
  group: (typeof GROUPS)[number];
  /** Dot spacing relative to the density's base spacing. */
  spacing: number;
  /** How large the dots may grow here (1: the torso's core). */
  scale: number;
  box: readonly [Vec3, Vec3];
  /** 1 on the part's axis, 0 on its surface, negative outside. */
  depth(x: number, y: number, z: number): number;
  /** Bones and weights for a dot inside the part. */
  bind(x: number, y: number, z: number): [number, number][];
}

// The torso: elliptical cross-sections [y, half-width, half-depth, centre z],
// from the glute fold to the base of the neck.
const TORSO_KEYS = [
  [78.5, 5, 4, -2.5],
  [80, 9.5, 7.5, -2],
  [84, 14, 9.6, -1.8],
  [90, 15.6, 10.4, -1.6],
  [97, 14.4, 9.4, -0.8],
  [104, 12.4, 8.4, 0],
  [112, 13.2, 9, 0.6],
  [121, 14.6, 10, 1.2],
  [130, 15.6, 10.4, 1],
  [136, 16.6, 9.4, 0],
  [140, 15, 8, -0.8],
  [143.5, 9.5, 6.4, -1.2],
  [146, 6, 5.4, -1],
] as const;
const torsoA = curve(TORSO_KEYS, 1);
const torsoB = curve(TORSO_KEYS, 2);
const torsoC = curve(TORSO_KEYS, 3);
const TORSO_Y0 = TORSO_KEYS[0][0];
const TORSO_Y1 = TORSO_KEYS[TORSO_KEYS.length - 1][0];

/** The trunk's chain, bottom up, with the heights each bone carries. */
const CHAIN = [
  { bone: bone('pelvis'), y0: TORSO_Y0, y1: SPINE[0].y },
  ...SPINE.map((s, k) => ({ bone: bone(s.id), y0: s.y, y1: SPINE[k + 1]?.y ?? HEAD_PIVOT[1] })),
  { bone: bone('head'), y0: HEAD_PIVOT[1], y1: HEIGHT + 5 },
];

/** A trunk dot's bones by its height: its own region, blended with the neighbour over up to 2 units either side of a joint. */
function chainBind(y: number): [number, number][] {
  let k = 0;
  while (k < CHAIN.length - 1 && y >= CHAIN[k].y1) k++;
  const seg = CHAIN[k];
  const span = seg.y1 - seg.y0;
  const out: [number, number][] = [[seg.bone, 1]];
  const below = CHAIN[k - 1];
  const above = CHAIN[k + 1];
  if (below) {
    const h = Math.min(2, span / 2, (below.y1 - below.y0) / 2);
    const w = 0.5 * (1 - smoothstep((y - seg.y0) / h));
    if (w > 0) out.push([below.bone, w]);
  }
  if (above) {
    const h = Math.min(2, span / 2, (above.y1 - above.y0) / 2);
    const w = 0.5 * (1 - smoothstep((seg.y1 - y) / h));
    if (w > 0) out.push([above.bone, w]);
  }
  return out;
}

const torso: Part = {
  id: 'torso',
  group: 'trunk',
  spacing: 1,
  scale: 1,
  box: [
    [-17, TORSO_Y0, -13],
    [17, TORSO_Y1, 12.5],
  ],
  depth(x, y, z) {
    if (y < TORSO_Y0 || y > TORSO_Y1) return -1;
    const dx = x / torsoA(y);
    const dz = (z - torsoC(y)) / torsoB(y);
    const ends = Math.min((y - TORSO_Y0) / 3, (TORSO_Y1 - y) / 3, 1);
    return Math.min(1 - Math.sqrt(dx * dx + dz * dz), ends);
  },
  bind: (_x, y) => chainBind(y),
};

// The head: an ellipsoid, narrower and a little forward towards the jaw.
const HEAD_C: Vec3 = [0, 160.6, 1.2];
const HEAD_R: Vec3 = [7.6, 10.2, 9.4];
const head: Part = {
  id: 'head',
  group: 'head',
  spacing: 0.9,
  scale: 0.8,
  box: [
    [-8, HEAD_C[1] - HEAD_R[1], -9],
    [8, HEAD_C[1] + HEAD_R[1], 12],
  ],
  depth(x, y, z) {
    const s = clamp01((HEAD_C[1] - y) / HEAD_R[1]);
    const rx = HEAD_R[0] * (1 - 0.24 * s * s);
    const rz = HEAD_R[2] * (1 - 0.12 * s * s);
    const cz = HEAD_C[2] + s;
    const dx = x / rx;
    const dy = (y - HEAD_C[1]) / HEAD_R[1];
    const dz = (z - cz) / rz;
    return 1 - Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
  bind: () => [[bone('head'), 1]],
};

/**
 * A tapered limb from a to b: elliptical cross-sections [t, r1, r2, offset]
 * along it (r1 across the limb towards x, r2 across it the other way, offset
 * along r2's direction), with rounded ends.
 */
function limb(
  id: string,
  group: Part['group'],
  a: Vec3,
  b: Vec3,
  keys: readonly (readonly number[])[],
  opts: { spacing: number; scale: number; bind: (t: number) => [number, number][] },
): Part {
  const d0 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.sqrt(d0[0] * d0[0] + d0[1] * d0[1] + d0[2] * d0[2]);
  const d = d0.map((v) => v / len);
  // e1: x made perpendicular to the limb; e2 = d × e1.
  const e1r = [1 - d[0] * d[0], -d[0] * d[1], -d[0] * d[2]];
  const e1l = Math.sqrt(e1r[0] * e1r[0] + e1r[1] * e1r[1] + e1r[2] * e1r[2]);
  const e1 = e1r.map((v) => v / e1l);
  const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
  const r1 = curve(keys, 1);
  const r2 = curve(keys, 2);
  const off = curve(keys, 3);
  const reach = Math.max(...keys.map((k) => Math.max(k[1], k[2] + Math.abs(k[3]))));
  const lo = [0, 1, 2].map((i) => Math.min(a[i], b[i]) - reach) as unknown as Vec3;
  const hi = [0, 1, 2].map((i) => Math.max(a[i], b[i]) + reach) as unknown as Vec3;
  const local = (x: number, y: number, z: number) => {
    const v = [x - a[0], y - a[1], z - a[2]];
    const t = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / len;
    return { v, t };
  };
  return {
    id,
    group,
    spacing: opts.spacing,
    scale: opts.scale,
    box: [lo, hi],
    depth(x, y, z) {
      const { v, t } = local(x, y, z);
      const tc = clamp01(t);
      const p1 = r1(tc);
      const p2 = r2(tc);
      const s1 = (v[0] * e1[0] + v[1] * e1[1] + v[2] * e1[2]) / p1;
      const s2 = (v[0] * e2[0] + v[1] * e2[1] + v[2] * e2[2] - off(tc)) / p2;
      // Beyond either end: a rounded cap as long as the cross-section's smaller radius.
      const cap = ((t < 0 ? -t : t > 1 ? t - 1 : 0) * len) / Math.min(p1, p2);
      return 1 - Math.sqrt(s1 * s1 + s2 * s2 + cap * cap);
    },
    bind(x, y, z) {
      return opts.bind(local(x, y, z).t);
    },
  };
}

/** Own bone, blended with a neighbour near one end: share w at the end, fading to 0 over `over` of the length. */
const blendEnd = (own: number, other: number, t: number, over: number, w: number, atStart: boolean): [number, number][] => {
  const k = atStart ? 1 - smoothstep(t / over) : 1 - smoothstep((1 - t) / over);
  return k > 0 ? [[own, 1 - w * k], [other, w * k]] : [[own, 1]];
};

function side(right: boolean): Part[] {
  const m = right ? mirror : (p: Vec3) => p;
  const s = right ? 'R' : 'L';
  const b = (id: string) => bone(id + s);
  const arm = (right ? 'armR' : 'armL') as Part['group'];
  const leg = (right ? 'legR' : 'legL') as Part['group'];
  const pelvis = bone('pelvis');
  const T2 = bone('T2');
  return [
    limb(`upperArm${s}`, arm, m(SHOULDER), m(ELBOW), [[0, 4.8, 5, 0], [0.15, 4.5, 4.7, 0], [0.6, 3.7, 3.9, 0], [1, 3.1, 3.2, 0]], {
      spacing: 0.78,
      scale: 0.68,
      bind: (t) => {
        if (t > 0.9) return blendEnd(b('upperArm'), b('forearm'), t, 0.1, 0.4, false);
        return blendEnd(b('upperArm'), T2, t, 0.1, 0.25, true);
      },
    }),
    limb(`forearm${s}`, arm, m(ELBOW), m(WRIST), [[0, 3.1, 3.2, 0], [0.25, 3.3, 3.5, 0], [1, 2, 2.4, 0]], {
      spacing: 0.72,
      scale: 0.58,
      bind: (t) => blendEnd(b('forearm'), b('upperArm'), t, 0.1, 0.4, true),
    }),
    // The hand hangs palm in: thin across x, wide front to back.
    limb(`hand${s}`, arm, m(WRIST), m(FINGERTIP), [[0, 1.3, 2.4, 0], [0.3, 1.4, 3.6, 0], [0.6, 1.2, 3, 0], [1, 0.8, 1.8, 0]], {
      spacing: 0.52,
      scale: 0.4,
      bind: (t) => blendEnd(b('hand'), b('forearm'), t, 0.1, 0.4, true),
    }),
    limb(`thigh${s}`, leg, m(HIP), m(KNEE), [[0, 8.2, 8.6, 0], [0.2, 7.6, 7.8, 0], [0.7, 5.6, 5.8, 0.2], [1, 4.6, 4.8, 0.3]], {
      spacing: 0.86,
      scale: 0.95,
      bind: (t) => {
        if (t > 0.88) return blendEnd(b('thigh'), b('shin'), t, 0.12, 0.4, false);
        return blendEnd(b('thigh'), pelvis, t, 0.2, 0.5, true);
      },
    }),
    // The calf sits behind the shin's line.
    limb(`shin${s}`, leg, m(KNEE), m(ANKLE), [[0, 4.4, 4.4, 0], [0.25, 4.6, 5, -1], [0.7, 3, 3, -0.5], [1, 2.6, 2.6, 0]], {
      spacing: 0.76,
      scale: 0.8,
      bind: (t) => blendEnd(b('shin'), b('thigh'), t, 0.1, 0.4, true),
    }),
    limb(`foot${s}`, leg, m(HEEL), m(TOE), [[0, 2.8, 3, 0], [0.3, 3.5, 3.4, 0], [0.7, 3.9, 2.4, 0], [1, 3.3, 1.3, 0]], {
      spacing: 0.62,
      scale: 0.5,
      bind: () => [[0, 1]],
    }),
  ];
}

// The neck reaches into the head, so no gap opens at the back of it when the head nods.
const neck = limb('neck', 'trunk', [0, 142, -1.6], [0, 157, 0.8], [[0, 5.8, 5.6, 0], [1, 5.2, 5.4, 0]], {
  spacing: 0.72,
  scale: 0.75,
  bind: (t) => chainBind(142 + 15 * t),
});

export const PARTS: readonly Part[] = [torso, neck, head, ...side(false), ...side(true)];

// ---------- Dots ----------

/** Size levels: a dot's radius is one of LEVELS steps between the minimum and maximum radius. */
export const LEVELS = 4;
/** Tone bins along the body's height, feet to crown. */
export const TONES = 12;
/** Follow-through levels: outer dots trail their bones by up to LAGS − 1 steps. */
export const LAGS = 4;

export const DENSITIES = {
  airy: { spacing: 4.4, seed: 20261025 },
  balanced: { spacing: 3.7, seed: 20261025 },
  dense: { spacing: 3.1, seed: 20261025 },
} as const;
export type DensityId = keyof typeof DENSITIES;

export interface Dots {
  count: number;
  /** Rest positions, x y z per dot. */
  rest: Float64Array;
  /** Up to three bones per dot, and their weights (summing to 1). */
  bones: Int16Array;
  weights: Float32Array;
  level: Uint8Array;
  tone: Uint8Array;
  lag: Uint8Array;
  /** 1 for the dots placed along the spine's line. */
  spine: Uint8Array;
  /** How much a dot belongs to the rib cage, 0 … 1 (the torso from the upper belly to below the armpits): what `breathe` expands. */
  rib: Float32Array;
  /** How much a dot rises with a breath in, 0 … 1: the upper body as one, with the arms, the neck and the head, fading out into the waist. */
  lift: Float32Array;
  /** Pairs of dot indices: the settled pose's lines. */
  lines: Uint32Array;
}

/** The spine's dots: on its line, sacrum to the base of the skull, about one base spacing apart. */
function spinePoints(spacing: number): Vec3[] {
  const points: Vec3[] = [];
  const top = HEAD_PIVOT[1] - 1;
  for (let y = 86; y <= top; y += spacing * 0.92) points.push([0, y, spineZ(y)]);
  return points;
}

export function sampleFigure(id: DensityId): Dots {
  const { spacing: base, seed } = DENSITIES[id];
  const rnd = random(seed);
  const spacingAt = (part: Part, depth: number) => base * part.spacing * (0.85 + 0.3 * depth);

  // A uniform grid over the body for the spacing tests.
  const smax = base * 1.15;
  const cell = smax / 2;
  const origin = [-30, -1, -16];
  const dims = [Math.ceil(60 / cell), Math.ceil((HEIGHT + 4) / cell), Math.ceil(40 / cell)];
  const first = new Int32Array(dims[0] * dims[1] * dims[2]).fill(-1);
  const next: number[] = [];
  const pts: number[] = [];
  const space: number[] = [];
  const owner: number[] = [];
  const depthOf: number[] = [];
  const cellOf = (x: number, y: number, z: number) =>
    [Math.floor((x - origin[0]) / cell), Math.floor((y - origin[1]) / cell), Math.floor((z - origin[2]) / cell)];

  function fits(x: number, y: number, z: number, s: number) {
    const [cx, cy, cz] = cellOf(x, y, z);
    for (let i = cx - 2; i <= cx + 2; i++)
      for (let j = cy - 2; j <= cy + 2; j++)
        for (let k = cz - 2; k <= cz + 2; k++) {
          if (i < 0 || j < 0 || k < 0 || i >= dims[0] || j >= dims[1] || k >= dims[2]) continue;
          for (let q = first[(k * dims[1] + j) * dims[0] + i]; q >= 0; q = next[q]) {
            const dx = pts[q * 3] - x;
            const dy = pts[q * 3 + 1] - y;
            const dz = pts[q * 3 + 2] - z;
            const min = (s + space[q]) / 2;
            if (dx * dx + dy * dy + dz * dz < min * min) return false;
          }
        }
    return true;
  }
  function insert(x: number, y: number, z: number, s: number, part: number, depth: number) {
    const n = space.length;
    pts.push(x, y, z);
    space.push(s);
    owner.push(part);
    depthOf.push(depth);
    const [cx, cy, cz] = cellOf(x, y, z);
    const c = (cz * dims[1] + cy) * dims[0] + cx;
    next.push(first[c]);
    first[c] = n;
  }
  /** The part a point belongs to: the one it is deepest inside. */
  function ownerOf(x: number, y: number, z: number): [number, number] {
    let best = -1;
    let bestDepth = 0;
    PARTS.forEach((part, i) => {
      const [lo, hi] = part.box;
      if (x < lo[0] || y < lo[1] || z < lo[2] || x > hi[0] || y > hi[1] || z > hi[2]) return;
      const d = part.depth(x, y, z);
      if (d > bestDepth) {
        best = i;
        bestDepth = d;
      }
    });
    return [best, bestDepth];
  }

  // The spine's dots go in first, so the rest of the body fills around them.
  const spineCount = spinePoints(base).length;
  for (const [x, y, z] of spinePoints(base)) {
    const [part, depth] = ownerOf(x, y, z);
    insert(x, y, z, spacingAt(PARTS[part], depth), part, depth);
  }
  // Then dart throwing, part by part, with a fixed number of candidates per volume.
  PARTS.forEach((part, i) => {
    const [lo, hi] = part.box;
    const size = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
    const s = base * part.spacing;
    const tries = Math.ceil(((size[0] * size[1] * size[2]) / (s * s * s)) * 14);
    for (let n = 0; n < tries; n++) {
      const x = lo[0] + rnd() * size[0];
      const y = lo[1] + rnd() * size[1];
      const z = lo[2] + rnd() * size[2];
      if (y < 0.3) continue; // the floor
      const [o, depth] = ownerOf(x, y, z);
      if (o !== i) continue;
      const sp = spacingAt(part, depth);
      if (fits(x, y, z, sp)) insert(x, y, z, sp, i, depth);
    }
  });

  const count = space.length;
  const dots: Dots = {
    count,
    rest: new Float64Array(pts),
    bones: new Int16Array(count * 3),
    weights: new Float32Array(count * 3),
    level: new Uint8Array(count),
    tone: new Uint8Array(count),
    lag: new Uint8Array(count),
    spine: new Uint8Array(count),
    rib: new Float32Array(count),
    lift: new Float32Array(count),
    lines: new Uint32Array(0),
  };
  const local = random(seed ^ 0x5bd1e995);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = [pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]];
    const part = PARTS[owner[i]];
    const depth = depthOf[i];
    const binds = part.bind(x, y, z).slice(0, 3);
    const total = binds.reduce((acc, [, w]) => acc + w, 0);
    binds.forEach(([b, w], k) => {
      dots.bones[i * 3 + k] = b;
      dots.weights[i * 3 + k] = w / total;
    });
    // Larger dots towards a thick part's core, smaller towards its surface and in thin parts.
    const core = depth * (2 - depth);
    const v = core * part.scale + (local() - 0.5) * 0.3;
    dots.level[i] = i < spineCount ? 2 : Math.floor(clamp01(v) * 0.999 * LEVELS);
    const tone = clamp01(y / HEIGHT + (local() - 0.5) * 0.1);
    dots.tone[i] = Math.floor(tone * 0.999 * TONES);
    dots.lag[i] = Math.floor(clamp01(((1 - depth) * 2.4 + local() * 1.2 - 0.3) / LAGS) * 0.999 * LAGS);
    dots.spine[i] = i < spineCount ? 1 : 0;
    // The rib cage: the torso from above the waist to below the armpits, its spine left still.
    if (part === torso && i >= spineCount) dots.rib[i] = smoothstep((y - RIB_LOW) / 10) * (1 - smoothstep((y - RIB_HIGH) / 8));
    // The rise: the arms and the head whole, the trunk (and its spine) from the waist up.
    dots.lift[i] = part.group === 'armL' || part.group === 'armR' || part.group === 'head' ? 1 : part.group === 'trunk' ? smoothstep((y - LIFT_FROM) / 28) : 0;
  }

  // The settled pose's lines, kept sparse so they never read as a network:
  // about half the dots join their nearest neighbour in the same group, within
  // 1.6 local spacings; the spine's dots are left free.
  const pairs = new Set<number>();
  const lines: number[] = [];
  const pick = random(seed ^ 0x27d4eb2f);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = [pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]];
    const reach = 1.6 * space[i];
    const group = PARTS[owner[i]].group;
    const near: [number, number][] = [];
    const [cx, cy, cz] = cellOf(x, y, z);
    for (let a = cx - 3; a <= cx + 3; a++)
      for (let b = cy - 3; b <= cy + 3; b++)
        for (let c = cz - 3; c <= cz + 3; c++) {
          if (a < 0 || b < 0 || c < 0 || a >= dims[0] || b >= dims[1] || c >= dims[2]) continue;
          for (let q = first[(c * dims[1] + b) * dims[0] + a]; q >= 0; q = next[q]) {
            if (q === i || PARTS[owner[q]].group !== group) continue;
            const dx = pts[q * 3] - x;
            const dy = pts[q * 3 + 1] - y;
            const dz = pts[q * 3 + 2] - z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < reach * reach) near.push([d2, q]);
          }
        }
    near.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    if (pick() >= 0.5 || dots.spine[i]) continue;
    for (const [, q] of near.slice(0, 1)) {
      if (dots.spine[q]) continue;
      const key = Math.min(i, q) * count + Math.max(i, q);
      if (pairs.has(key)) continue;
      pairs.add(key);
      lines.push(Math.min(i, q), Math.max(i, q));
    }
  }
  dots.lines = new Uint32Array(lines);
  return dots;
}

/** The rib cage's extent in rest heights: it fades in above RIB_LOW (the upper belly) and out above RIB_HIGH (below the armpits). */
const RIB_LOW = 100;
const RIB_HIGH = 136;
/** The upper body's rise fades in above this height (the waist). */
const LIFT_FROM = 98;
/**
 * A full breath: the upper body rises this far (model units); the lower ribs
 * widen by this share of their half-width; the front of the chest and the
 * upper belly come forward by this share of their half-depth, the back a
 * quarter as much.
 */
const BREATH_LIFT = 0.9;
const BREATH_WIDE = 0.05;
const BREATH_DEEP = 0.12;
/** The lower ribs widen; above this height the widening fades out, so the sides under the arms stay still. */
const WIDE_TOP = 122;

/**
 * A breath (2026-10-26, the homepage intro; made one with the body after the
 * owner's review the same day), by `amount` (0 at rest, 1 a full breath in),
 * on posed positions from `skin`: the upper body rises as one (the chest, the
 * shoulders, the arms, the neck and the head together, fading into the
 * waist); within it the rib cage opens, the lower ribs a little to the sides,
 * the chest and the upper belly forward. Nothing slides past its neighbours.
 * For the standing pose only, where the trunk's bones barely turn, so rest
 * and posed space agree. ./timeline.ts adds the skeleton's part (the upper
 * back, the head's level and the arms).
 */
export function breathe(dots: Dots, pos: Float64Array, amount: number) {
  if (amount === 0) return pos;
  const { rest, rib, lift } = dots;
  for (let i = 0; i < dots.count; i++) {
    pos[i * 3 + 1] += BREATH_LIFT * lift[i] * amount;
    const w = rib[i] * amount;
    if (w === 0) continue;
    const y = rest[i * 3 + 1];
    const depth = rest[i * 3 + 2] - torsoC(y);
    pos[i * 3] += rest[i * 3] * BREATH_WIDE * (1 - smoothstep((y - WIDE_TOP) / 10)) * w;
    pos[i * 3 + 2] += depth * (depth > 0 ? BREATH_DEEP : BREATH_DEEP / 4) * w;
  }
  return pos;
}

/** Posed positions: each dot moved by its bones' matrices (one set per follow-through level). */
export function skin(dots: Dots, matrices: readonly Matrices[], out: Float64Array) {
  const { rest, bones, weights, lag } = dots;
  for (let i = 0; i < dots.count; i++) {
    const m = matrices[Math.min(lag[i], matrices.length - 1)];
    const x = rest[i * 3];
    const y = rest[i * 3 + 1];
    const z = rest[i * 3 + 2];
    let ox = 0;
    let oy = 0;
    let oz = 0;
    for (let k = 0; k < 3; k++) {
      const w = weights[i * 3 + k];
      if (w === 0) continue;
      const o = bones[i * 3 + k] * 12;
      ox += w * (m[o] * x + m[o + 1] * y + m[o + 2] * z + m[o + 3]);
      oy += w * (m[o + 4] * x + m[o + 5] * y + m[o + 6] * z + m[o + 7]);
      oz += w * (m[o + 8] * x + m[o + 9] * y + m[o + 10] * z + m[o + 11]);
    }
    out[i * 3] = ox;
    out[i * 3 + 1] = oy;
    out[i * 3 + 2] = oz;
  }
  return out;
}
