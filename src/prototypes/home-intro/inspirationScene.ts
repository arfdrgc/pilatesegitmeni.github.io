// The first menu scene, İlham / Inspiration: the Reformer Hundred (owner,
// 2026-10-29). Development preview only, at /dev/home-menu/#inspiration and
// /en/dev/home-menu/#inspiration (./HomeIntroPreview.astro), on the menu's
// idle frame. Nothing in the homepage's scene changes: this draws on the
// frame's own canvas with the dot figure's model, renderer and palette.
// - From the menu's idle (standing in the front view, arms hanging, exactly
//   as ../../components/home-intro/dotScene.ts ends), BEGIN ms still;
// - the gathering (GATHER ms): her dots draw into a small disc at the ring's
//   centre, a fifth of the ring's diameter, keeping their order (the crown's
//   dots at its top, the feet's at its bottom), her lines fading as they go;
// - the morph (MORPH ms): the same dots spread out of it into a side view of
//   a Reformer and of her lying on its carriage in the Hundred: the back on
//   the carriage, the head and the shoulders curled up, the head to the
//   right, the arms long by her sides holding the straps, the legs long at
//   about 50°, the feet pointed, reaching towards the item at half past 10
//   (Miras / Legacy);
// - the hold: the pose, still (no pumping arms yet); the lines come back once
//   it has settled, as after any settled pose.
// Every dot is one of hers throughout. A share of them stays her (PERSON);
// the rest become the Reformer, drawn in her own way (owner's review,
// 2026-10-29): each part a volume of dots, the larger ones at its core,
// spread across its width in depth, its edges soft, in the palette's sage
// and sand, with sparse lines.
import { BONES, LAGS, LEVELS, newMatrices, pose, random, resolve, sampleFigure, skin, type Dots, type Matrices } from '../../components/dot-figure/model';
import { PALETTES } from '../../components/dot-figure/palettes';
import { colours, Stage, type Look, type Placement } from '../../components/dot-figure/render';
import { END, LINES_IN, LINES_OUT, LOOK, SETTLE, ease, poseAt, smooth } from '../../components/dot-figure/timeline';
import { DOT_FLOOR } from '../../components/home-intro/dotScene';
import { RING, ringPoint, STAGE } from '../../components/home-intro/geometry';
import type { Scene } from '../../components/home-intro/scene';
import { homeMenu } from '../../config/home-menu';

// ---------- Timing (ms) ----------

/** The menu's idle, still, before the gathering. */
export const BEGIN = 600;
/** The gathering into the disc, and the morph out of it: a second each (owner). */
export const GATHER = 1000;
export const MORPH = 1000;
/** Each dot's own way, as a share of its stage; the starts spread over the rest. */
const TRAVEL = 0.6;

// ---------- The menu's framing, in model units ----------

/** The menu's placement, as ../../components/home-intro/dotScene.ts draws its idle: her hair 4% of the ring's diameter below its top, her soles on the line. */
const UNIT = (2 * RING.r * 0.92) / 171;
const PLACEMENT: Placement = { scale: UNIT / STAGE, x: RING.cx / STAGE, floor: DOT_FLOOR / STAGE };
/** The ring's centre and radius in model units (x 0 on her axis, y up from her soles). */
const CENTRE = { x: 0, y: (DOT_FLOOR - RING.cy) / UNIT };
const RADIUS = RING.r / UNIT;
/** The disc: a fifth of the ring's diameter (owner). */
export const DISC_R = RADIUS / 5;

/** The item her legs reach towards: Miras / Legacy, at half past 10. */
const TOWARDS = (() => {
  const { x, y } = ringPoint(homeMenu.find((item) => item.id === 'legacy')!.hour);
  return { x: (x - RING.cx) / UNIT, y: (DOT_FLOOR - y) / UNIT };
})();

// ---------- The Hundred ----------

/** The scene's size: model units per centimetre of the figure (171 tall) and of the Reformer. */
const SCALE = 0.68;
/** The share of her dots that stay her (smaller, so as dense as standing); the rest become the Reformer. Her thin parts (the arms, the shins and feet), her spine and her back on the carriage keep every dot, so their lines stay unbroken. */
const PERSON = 0.42;
const isArm = (dots: Dots, i: number) => Math.abs(dots.rest[i * 3]) > 18.5 && dots.rest[i * 3 + 1] > 62 && dots.rest[i * 3 + 1] < 136;
const isShin = (dots: Dots, i: number) => dots.rest[i * 3 + 1] < 40;

const bone = (id: string) => BONES.findIndex((b) => b.id === id);
const HIP = BONES[bone('pelvis')].pivot;

/**
 * The Hundred on her own skeleton, the feet planted as the model has them:
 * the trunk folds forward over the legs by the legs' angle to the carriage
 * (`legs`); the lower and middle back stay long on the carriage; only the
 * upper back (the shoulder blades), the neck and the head curl forward, in
 * one even curve (about 40° in all, the gaze towards the thighs); the arms
 * reach long towards the feet, lifted a little, clear of the body. Turned
 * onto her back below (lie).
 */
const hundred = (legs: number) =>
  resolve({
    pelvis: legs,
    T6: 3,
    T4: 7,
    T2: 9,
    C7: 8,
    C4: 6,
    head: 6,
    // From hanging, back to along the carriage (`legs`), then up off it, clear of her front.
    shoulder: legs - 16,
  });

/**
 * Pointed feet (owner's review, 2026-10-29: shin → ankle → instep → pointed
 * toes in one line). The model's foot is a flat slab under a narrow ankle
 * (rest heights 0 to FOOT_TOP, from the heel at HEEL to the toes at TOE,
 * forward), so no turn of it about the ankle can meet the shin's front
 * without a step. Instead each of its dots is placed by where it is along the
 * foot (heel to toes: `s`) and how high in it (sole to instep: `t`) in a
 * pointed foot that carries straight on from the end of the shin, down the
 * leg's line, FOOT_LENGTH long: its front (the instep) starts at the shin's
 * front and swells gently forward; its back starts at the shin's back with
 * the heel just behind the ankle, and runs on as the sole; both taper to the
 * toes, the whole curving softly towards the sole.
 */
const FOOT_TOP = 6.5;
const HEEL = -4.5;
const TOE = 18.8;
const FOOT_LENGTH = 18;
/** The pointed foot's front and back (forward offsets, model units) and its middle line's curve, at `s` from the ankle (0) to the toes (1). */
const instep = (s: number) => 1.4 + 1.6 * Math.sin(Math.PI * s) * (1 - 0.45 * s) - s;
const sole = (s: number) => -2.4 + 1.5 * s ** 1.3 - 1.5 * Math.exp(-(((s - 0.07) / 0.1) ** 2));
const arch = (s: number) => -2.2 * s * s;

/** A foot's dot (rest place) in the pointed foot, still in rest space with the foot hanging on down the leg; the rest of her unchanged. */
function pointed(x: number, y: number, z: number): [number, number, number] {
  if (y >= FOOT_TOP) return [x, y, z];
  const s = clamp01((z - HEEL) / (TOE - HEEL));
  const t = clamp01(y / FOOT_TOP);
  return [x, FOOT_TOP - s * FOOT_LENGTH, arch(s) + sole(s) + (instep(s) - sole(s)) * t];
}
/** Halfway from the wrist to the fingertips (../../components/dot-figure/model.ts's WRIST and FINGERTIP): where she holds the strap. */
const GRIP: readonly [number, number, number] = [0.4, -8.75, 0.7];

/** A point turned onto her back (model units, the hip at the origin): x along the carriage (the head to the right), y up from it, k towards the viewer (her left side). */
type Flat = [x: number, y: number, k: number];

function lie(legs: number, [x, y, z]: ArrayLike<number> & Iterable<number>): Flat {
  const a = y - HIP[1];
  const b = z - HIP[2];
  const r = (legs * Math.PI) / 180;
  return [a * Math.cos(r) + b * Math.sin(r), -a * Math.sin(r) + b * Math.cos(r), x];
}

const at = (m: Matrices, id: string, offset: readonly number[] = [0, 0, 0]) => {
  const o = bone(id) * 12;
  const [x, y, z] = BONES[bone(id)].pivot.map((v, k) => v + offset[k]);
  return [0, 1, 2].map((r) => m[o + r * 4] * x + m[o + r * 4 + 1] * y + m[o + r * 4 + 2] * z + m[o + r * 4 + 3]);
};

// ---------- The Reformer: parts as volumes of dots ----------

/** A part of the Reformer, in centimetres of the scene's side view (her hip at the origin). */
interface Part {
  /** Signed distance (cm): negative inside. */
  sdf: (x: number, y: number) => number;
  box: [x0: number, y0: number, x1: number, y1: number];
  /** Half its thickness (cm): the deeper inside, the larger the dot. */
  half: number;
  /** Its extent across the Reformer's width (cm): the dots' depth. */
  depth: [number, number];
  /** Its tone (the palette's, 0 the feet's sage … 11 the crown's clay) and the largest size level its dots take. */
  tone: number;
  level: number;
  /** How much denser than the frame. */
  density?: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const roundBox = (x0: number, y0: number, x1: number, y1: number, r: number) => (x: number, y: number) => {
  const qx = Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2 + r;
  const qy = Math.abs(y - (y0 + y1) / 2) - (y1 - y0) / 2 + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const capsule = (ax: number, ay: number, bx: number, by: number, r: number) => (x: number, y: number) => {
  const [dx, dy] = [bx - ax, by - ay];
  const h = clamp01(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - ax - dx * h, y - ay - dy * h) - r;
};
const boxOf = (ax: number, ay: number, bx: number, by: number, r: number): Part['box'] => [Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r];

/**
 * The Reformer in side view, in centimetres (the figure's units, before
 * SCALE), built around her: the carriage under her from below the hips to
 * past the head, its top where her back rests (`back`), with the headrest at
 * its end and the shoulder rests just above her shoulders; the frame below
 * it, longer at both ends, on short legs; at its left end the footbar and the
 * springs to the carriage; at its right end the riser, its pulley low,
 * a little above the carriage, and the strap from it to her hand.
 */
function reformer(back: number, hipX: number, shoulder: Flat, headX: number, hand: Flat) {
  const carriage = { x0: hipX - 44, x1: headX + 14, y0: back - 8, y1: back };
  const frame = { x0: carriage.x0 - 56, x1: carriage.x1 + 30, y0: carriage.y0 - 17, y1: carriage.y0 - 4 };
  const riserX = frame.x1 - 8;
  // The pulley low on its riser, a little above the carriage: the strap runs down from her hand past her shoulder, under her face.
  const pulley = { x: riserX, y: back + 9 };
  const springs = { x0: frame.x0 + 18, x1: carriage.x0 + 1 };
  const coil = (y: number) => (x: number, yy: number) => Math.max(Math.abs(yy - (y + 1.1 * Math.sin(((x - springs.x0) / 3.2) * 2 * Math.PI))) - 0.7, springs.x0 - x, x - springs.x1);
  const parts: Part[] = [
    // The frame: a long rail with soft ends, and its short legs.
    { sdf: roundBox(frame.x0, frame.y0, frame.x1, frame.y1, 3), box: [frame.x0, frame.y0, frame.x1, frame.y1], half: 6.5, depth: [-28, 28], tone: 0, level: 2, density: 0.8 },
    { sdf: capsule(frame.x0 + 7, frame.y0, frame.x0 + 7, frame.y0 - 12, 1.9), box: boxOf(frame.x0 + 7, frame.y0, frame.x0 + 7, frame.y0 - 12, 1.9), half: 1.9, depth: [-28, 28], tone: 0, level: 1, density: 1.3 },
    { sdf: capsule(frame.x1 - 7, frame.y0, frame.x1 - 7, frame.y0 - 12, 1.9), box: boxOf(frame.x1 - 7, frame.y0, frame.x1 - 7, frame.y0 - 12, 1.9), half: 1.9, depth: [-28, 28], tone: 0, level: 1, density: 1.3 },
    // The carriage, padded: warmer than the frame, between the frame's sage and her sand.
    { sdf: roundBox(carriage.x0, carriage.y0, carriage.x1, carriage.y1, 2.5), box: [carriage.x0, carriage.y0, carriage.x1, carriage.y1], half: 4, depth: [-22, 22], tone: 4, level: 2, density: 1.2 },
    // The headrest at its end, and the shoulder rests.
    { sdf: roundBox(carriage.x1 - 17, back, carriage.x1, back + 3.6, 1.6), box: [carriage.x1 - 17, back, carriage.x1, back + 3.6], half: 1.8, depth: [-10, 10], tone: 4, level: 1, density: 1.8 },
    { sdf: capsule(shoulder[0] + 9, back + 1, shoulder[0] + 9, back + 11, 2.6), box: boxOf(shoulder[0] + 9, back + 1, shoulder[0] + 9, back + 11, 2.6), half: 2.6, depth: [-13, -8], tone: 4, level: 1, density: 2 },
    // The footbar, leaning in towards her, and the bar seen end on.
    { sdf: capsule(frame.x0 + 10, frame.y1, frame.x0 + 21, frame.y1 + 33, 2), box: boxOf(frame.x0 + 10, frame.y1, frame.x0 + 21, frame.y1 + 33, 2), half: 2, depth: [-26, 26], tone: 0, level: 1, density: 2.2 },
    { sdf: (x, y) => Math.hypot(x - frame.x0 - 22, y - frame.y1 - 36) - 3.3, box: [frame.x0 + 18.5, frame.y1 + 32.5, frame.x0 + 25.5, frame.y1 + 39.5], half: 3.3, depth: [-26, 26], tone: 1, level: 2, density: 2.2 },
    // Two springs from the footbar's end to the carriage.
    { sdf: coil(frame.y1 + 1.6), box: [springs.x0, frame.y1, springs.x1, frame.y1 + 3.2], half: 0.7, depth: [-10, 10], tone: 2, level: 0, density: 2 },
    { sdf: coil(frame.y1 + 4.6), box: [springs.x0, frame.y1 + 3, springs.x1, frame.y1 + 6.2], half: 0.7, depth: [-10, 10], tone: 2, level: 0, density: 2 },
    // The riser, its pulley, and the strap to her hand (on her near side).
    { sdf: capsule(riserX, frame.y1, riserX, pulley.y - 3, 1.8), box: boxOf(riserX, frame.y1, riserX, pulley.y - 3, 1.8), half: 1.8, depth: [-26, 26], tone: 0, level: 1, density: 2 },
    { sdf: (x, y) => Math.abs(Math.hypot(x - pulley.x, y - pulley.y) - 3) - 1.1, box: [pulley.x - 4.2, pulley.y - 4.2, pulley.x + 4.2, pulley.y + 4.2], half: 1.1, depth: [14, 18], tone: 1, level: 1, density: 2.4 },
    { sdf: capsule(hand[0], hand[1], pulley.x - 1, pulley.y + 2.8, 0.7), box: boxOf(hand[0], hand[1], pulley.x - 1, pulley.y + 2.8, 0.7), half: 0.7, depth: [15, 17], tone: 5, level: 1, density: 2 },
  ];
  return { parts, carriage };
}

/** A dot of the Reformer, in the menu's framing: its place and depth, tone and size, and its part. */
export interface ReformerPoint {
  x: number;
  y: number;
  k: number;
  tone: number;
  level: number;
  part: number;
}

/** The Reformer's dots apart, in model units of the menu's framing (hers are 3.1 apart standing, nearer in her smaller size here). */
const SPACING = 1.6;
/** How soft the parts' edges are (cm): a dot's place is accepted up to this far either side of the edge. */
const EDGE = 1.3;

/**
 * The Reformer's dots: as many as its parts' areas ask for at SPACING (at
 * most `count`), shared out by area and density, each part's spread evenly
 * but irregularly (best candidate of several, so never on a grid), its edges
 * soft; then their depth, size (the larger at a part's core, as in her
 * figure), tone, and her kind of lines: about half the dots joined to their
 * nearest neighbour in the same part.
 */
export function sampleReformer(parts: Part[], place: (p: readonly number[]) => number[], count: number, seed = 20261029) {
  const rnd = random(seed);
  const cm = SPACING / SCALE;
  const inside = (part: Part) => {
    const [x0, y0, x1, y1] = part.box;
    let hits = 0;
    for (let n = 0; n < 2000; n++) if (part.sdf(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)) < 0) hits++;
    return ((x1 - x0) * (y1 - y0) * hits) / 2000;
  };
  const weights = parts.map((part) => (inside(part) * (part.density ?? 1)) / (cm * cm));
  const total = Math.min(count, Math.round(weights.reduce((a, b) => a + b, 0)));
  const sum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.floor((w / sum) * total));
  for (let n = 0; counts.reduce((a, b) => a + b, 0) < total; n++) counts[n % counts.length]++;

  const points: ReformerPoint[] = [];
  const lines: [number, number][] = [];
  parts.forEach((part, p) => {
    const [x0, y0, x1, y1] = part.box;
    const own: [number, number][] = [];
    const candidate = (): [number, number] => {
      for (let tries = 0; tries < 60; tries++) {
        const x = x0 - EDGE + rnd() * (x1 - x0 + 2 * EDGE);
        const y = y0 - EDGE + rnd() * (y1 - y0 + 2 * EDGE);
        if (part.sdf(x, y) < EDGE * (rnd() - 0.5) * 1.2) return [x, y];
      }
      return [(x0 + x1) / 2, (y0 + y1) / 2];
    };
    for (let n = 0; n < counts[p]; n++) {
      let best = candidate();
      let far = -1;
      for (let c = 0; c < 10; c++) {
        const q = c === 0 ? best : candidate();
        let d = Infinity;
        for (const o of own) d = Math.min(d, (o[0] - q[0]) ** 2 + (o[1] - q[1]) ** 2);
        if (d > far) [best, far] = [q, d];
      }
      own.push(best);
    }
    const first = points.length;
    for (const [x, y] of own) {
      const core = clamp01(-part.sdf(x, y) / part.half);
      const [px, py, pk] = place([x, y, part.depth[0] + rnd() * (part.depth[1] - part.depth[0])]);
      const level = Math.min(part.level, Math.floor(clamp01(0.2 + 0.65 * core + (rnd() - 0.5) * 0.5) * 0.999 * LEVELS));
      points.push({ x: px, y: py, k: pk, tone: part.tone + (rnd() < 0.3 ? 1 : 0), level, part: p });
    }
    // Her kind of lines: about half the dots joined to the nearest in the part, within 1.6 spacings.
    for (let a = first; a < points.length; a++) {
      if (rnd() >= 0.5) continue;
      let near = -1;
      let best = (1.6 * SPACING) ** 2;
      for (let b = first; b < points.length; b++) {
        const d = (points[a].x - points[b].x) ** 2 + (points[a].y - points[b].y) ** 2;
        if (b !== a && d < best) [near, best] = [b, d];
      }
      if (near >= 0) lines.push([a, near]);
    }
  });
  return { points, lines };
}

export interface Layout {
  /** Her dots in the Hundred (model units of the menu's framing: x, y, depth). */
  person: Float64Array;
  /** Her dots on the carriage (the back's contact), kept whole. */
  contact: Uint8Array;
  /** The Reformer's parts (centimetres) and the placing from them into the menu's framing. */
  parts: Part[];
  place: (p: readonly number[]) => number[];
  /** The legs' angle to the carriage (degrees), and the hip, in the menu's framing. */
  legs: number;
  hip: { x: number; y: number };
}

/**
 * The scene in the menu's framing: her pose and the Reformer's parts, scaled
 * and centred on the ring, the legs' angle found so that they point at the
 * item from where the hip ends up (a few rounds, as centring moves the hip).
 */
export function layoutHundred(dots: Dots): Layout {
  const posed = new Float64Array(dots.count * 3);
  const hashes = Float32Array.from({ length: dots.count }, (_, i) => hash(i ^ 0x2545f491));
  let legs = 45;
  let result: Layout | undefined;
  for (let round = 0; round < 4; round++) {
    const m = pose(hundred(legs));
    skin(dots, Array.from({ length: LAGS }, () => m), posed);
    const flat: Flat[] = [];
    // The feet aren't posed (they stand on the ground), so a foot's dot is placed from its rest place, pointed.
    for (let i = 0; i < dots.count; i++) {
      const [x, y, z] = dots.rest.subarray(i * 3, i * 3 + 3);
      flat.push(lie(legs, y < FOOT_TOP ? pointed(x, y, z) : posed.subarray(i * 3, i * 3 + 3)));
    }
    // Where she rests: the lowest of her lower and middle back (not the seat, which stays with the thighs); the head's crown.
    let back = Infinity;
    let headX = -Infinity;
    flat.forEach(([x, y], i) => {
      const restY = dots.rest[i * 3 + 1];
      if (restY > 97 && restY < 124) back = Math.min(back, y);
      if (restY > 153) headX = Math.max(headX, x);
    });
    const shoulder = lie(legs, at(m, 'upperArmL'));
    const { parts, carriage } = reformer(back, 0, shoulder, headX, lie(legs, at(m, 'handL', GRIP)));
    // On the carriage, nothing sinks into it (the seat settles onto it); her back's dots there, up to the spine, are all kept, so she lies on it.
    const contact = new Uint8Array(dots.count);
    flat.forEach((p, i) => {
      if (p[0] < carriage.x0 || p[0] > shoulder[0]) return;
      if (p[1] < back) p[1] = back + 0.5 * hashes[i];
      if (p[1] - back < 4.5) contact[i] = 1;
    });
    // Centred on the ring: the middle of everything drawn.
    const xs = [...flat.map((p) => p[0]), ...parts.flatMap((p) => [p.box[0], p.box[2]])];
    const ys = [...flat.map((p) => p[1]), ...parts.flatMap((p) => [p.box[1], p.box[3]])];
    const mid = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
    const place = ([x, y, k]: readonly number[]) => [CENTRE.x + (x - mid.x) * SCALE, CENTRE.y + (y - mid.y) * SCALE, k * SCALE];
    const person = new Float64Array(dots.count * 3);
    flat.forEach((p, i) => person.set(place(p), i * 3));
    const hip = { x: CENTRE.x - mid.x * SCALE, y: CENTRE.y - mid.y * SCALE };
    result = { person, contact, parts, place, legs, hip };
    // The legs along the line from the hip to the item.
    legs = (Math.atan2(TOWARDS.y - hip.y, hip.x - TOWARDS.x) * 180) / Math.PI;
  }
  return result!;
}

/** The farthest of these points from the ring's centre, as a share of its radius. */
export const reachOf = (xy: Iterable<readonly [number, number]>) => {
  let far = 0;
  for (const [x, y] of xy) far = Math.max(far, Math.hypot(x - CENTRE.x, y - CENTRE.y));
  return far / RADIUS;
};

// ---------- The scene ----------

const hash = (i: number) => ((i * 2654435761) >>> 0) / 2 ** 32;
const MAX_STEP = 50;

/**
 * The disc's points, as many as her dots, spread evenly (a sunflower), each
 * given to one of her dots so that the order holds: banded by height, then
 * by x within each band, for both.
 */
function discOf(start: Float64Array, count: number): Float64Array {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const disc = Array.from({ length: count }, (_, k) => {
    const r = DISC_R * Math.sqrt((k + 0.5) / count);
    return [CENTRE.x + r * Math.cos(k * golden), CENTRE.y + r * Math.sin(k * golden)];
  });
  const out = new Float64Array(count * 3);
  const bands = Math.round(Math.sqrt(count));
  const byHeight = (ys: (k: number) => number) => Array.from({ length: count }, (_, k) => k).sort((a, b) => ys(b) - ys(a));
  const spots = byHeight((k) => disc[k][1]);
  const own = byHeight((i) => start[i * 3 + 1]);
  for (let b = 0; b < bands; b++) {
    const from = Math.floor((b * count) / bands);
    const to = Math.floor(((b + 1) * count) / bands);
    const s = spots.slice(from, to).sort((p, q) => disc[p][0] - disc[q][0]);
    const o = own.slice(from, to).sort((p, q) => start[p * 3] - start[q * 3]);
    o.forEach((i, n) => out.set([...disc[s[n]], 0], i * 3));
  }
  return out;
}

/**
 * Pairs sources and targets (equal numbers, 2D, each about its own centre)
 * so that nothing travels far across the others: in rings of equal count by
 * distance from the centre, then by angle within each ring.
 */
function match(sources: [number, number][], targets: [number, number][], rings = 10) {
  const order = (pts: [number, number][]) => {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const byR = pts.map((_, k) => k).sort((a, b) => Math.hypot(pts[a][0] - cx, pts[a][1] - cy) - Math.hypot(pts[b][0] - cx, pts[b][1] - cy));
    const angle = (k: number) => Math.atan2(pts[k][1] - cy, pts[k][0] - cx);
    const out: number[] = [];
    for (let r = 0; r < rings; r++) out.push(...byR.slice(Math.floor((r * pts.length) / rings), Math.floor(((r + 1) * pts.length) / rings)).sort((a, b) => angle(a) - angle(b)));
    return out;
  };
  const s = order(sources);
  const t = order(targets);
  const pairs = new Array<number>(sources.length);
  s.forEach((k, n) => (pairs[k] = t[n]));
  return pairs;
}

export function createInspirationScene(root: HTMLElement): Scene {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-dot-figure]')!;
  const stage = new Stage(canvas);
  const dots = sampleFigure('dense');
  const n = dots.count;

  // Where each dot starts: the menu's idle (standing, front view).
  const start = new Float64Array(n * 3);
  const scratch = resolve({});
  skin(dots, Array.from({ length: LAGS }, (_, level) => pose(poseAt(END, level, scratch), newMatrices())), start);
  const disc = discOf(start, n);

  // Where each ends: hers (her spine, arms and back on the carriage, and a share of the rest) or the Reformer's.
  const layout = layoutHundred(dots);
  const end = new Float64Array(n * 3);
  const person = Uint8Array.from({ length: n }, (_, i) => (dots.spine[i] || isArm(dots, i) || isShin(dots, i) || layout.contact[i] || hash(i) < PERSON ? 1 : 0));
  const pool: number[] = [];
  for (let i = 0; i < n; i++) {
    if (person[i]) end.set(layout.person.subarray(i * 3, i * 3 + 3), i * 3);
    else pool.push(i);
  }
  const reformer = sampleReformer(layout.parts, layout.place, pool.length);
  // Each of the pool to a point of the Reformer; if there are more of them, a few share a point (they come from one part of the disc).
  const copies = pool.map((_, j) => Math.floor((j * reformer.points.length) / pool.length));
  const pairs = match(
    pool.map((i) => [disc[i * 3], disc[i * 3 + 1]]),
    copies.map((c) => [reformer.points[c].x, reformer.points[c].y]),
  );
  const sceneTone = new Uint8Array(dots.tone);
  const sceneLevel = new Uint8Array(dots.level);
  /** The first dot on each of the Reformer's points: the one its lines join. */
  const lead = new Int32Array(reformer.points.length).fill(-1);
  pool.forEach((i, j) => {
    const c = copies[pairs[j]];
    const { x, y, k, tone, level } = reformer.points[c];
    end.set([x, y, k], i * 3);
    sceneTone[i] = tone;
    sceneLevel[i] = level;
    if (lead[c] < 0) lead[c] = i;
  });

  // Her lines among the dots she keeps; the Reformer's within its parts.
  const sceneLines: number[] = [];
  for (let k = 0; k < dots.lines.length; k += 2) if (person[dots.lines[k]] && person[dots.lines[k + 1]]) sceneLines.push(dots.lines[k], dots.lines[k + 1]);
  for (const [a, b] of reformer.lines) if (lead[a] >= 0 && lead[b] >= 0) sceneLines.push(lead[a], lead[b]);
  const shown: Dots = { ...dots, tone: new Uint8Array(dots.tone), level: new Uint8Array(dots.level), lines: dots.lines };
  const lines = { figure: dots.lines, scene: Uint32Array.from(sceneLines) };

  // Each dot's start within its stage: the gathering takes the farthest first, the morph forms from the centre out.
  const spread = (d: number, i: number) => (1 - TRAVEL) * (0.7 * d + 0.3 * hash(i ^ 0x9e3779b9));
  const far = Float32Array.from({ length: n }, (_, i) => Math.hypot(start[i * 3] - CENTRE.x, start[i * 3 + 1] - CENTRE.y));
  const out = Float32Array.from({ length: n }, (_, i) => Math.hypot(end[i * 3] - CENTRE.x, end[i * 3 + 1] - CENTRE.y));
  const farMax = Math.max(...far);
  const outMax = Math.max(...out);
  const gatherAt = Float32Array.from({ length: n }, (_, i) => spread(1 - far[i] / farMax, i));
  const morphAt = Float32Array.from({ length: n }, (_, i) => spread(out[i] / outMax, i));

  const ground = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
  const fill = colours(PALETTES.find((p) => p.id === 'clay-sage')!, ground);
  const look: Look = { ...LOOK, lineAlpha: 1 };
  const pos = new Float64Array(n * 3);
  const MORPH_AT = BEGIN + GATHER;
  const SETTLED = MORPH_AT + MORPH;
  const duration = SETTLED + SETTLE + LINES_IN;

  function draw(t: number) {
    const u = (t - BEGIN) / GATHER;
    const v = (t - MORPH_AT) / MORPH;
    // The view turns from the front to the side through the morph, the dots
    // counter-turned so the picture is the one laid out: only the spine's
    // accent comes in with it, as in the intro's side view.
    const yaw = 90 * smooth(clamp01(v));
    const c = Math.cos((yaw * Math.PI) / 180);
    const s = Math.sin((yaw * Math.PI) / 180);
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      const [from, to, p] = v <= 0 ? [start, disc, ease(clamp01((u - gatherAt[i]) / TRAVEL))] : [disc, end, ease(clamp01((v - morphAt[i]) / TRAVEL))];
      const x = from[k] + (to[k] - from[k]) * p;
      const depth = from[k + 2] + (to[k + 2] - from[k + 2]) * p;
      pos[k] = x * c - depth * s;
      pos[k + 1] = from[k + 1] + (to[k + 1] - from[k + 1]) * p;
      pos[k + 2] = x * s + depth * c;
      // Halfway out of the disc, a dot takes its new tone and size.
      const scene = v > 0 && p >= 0.5;
      shown.tone[i] = scene ? sceneTone[i] : dots.tone[i];
      shown.level[i] = scene ? sceneLevel[i] : dots.level[i];
    }
    // Her lines out as the gathering starts; the scene's in once it has settled.
    shown.lines = v <= 0 ? lines.figure : lines.scene;
    look.lineAlpha = v <= 0 ? 1 - clamp01((t - BEGIN) / LINES_OUT) : clamp01((t - SETTLED - SETTLE) / LINES_IN);
    stage.draw(shown, pos, yaw, look, fill, PLACEMENT);
    canvas.dataset.drawn = '';
    scene.onUpdate?.(t);
  }

  let time = 0;
  let playing = false;
  let frame = 0;
  let last = 0;

  function tick(now: number) {
    time = Math.min(duration, time + Math.min(now - last, MAX_STEP) * scene.rate);
    last = now;
    draw(time);
    if (time >= duration) {
      playing = false;
      frame = 0;
      scene.onUpdate?.(time);
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  const scene: Scene = {
    rate: 1,
    duration,
    get time() {
      return time;
    },
    get playing() {
      return playing;
    },
    play() {
      if (playing) return;
      if (time >= duration) time = 0;
      playing = true;
      last = performance.now();
      draw(time);
      frame = requestAnimationFrame(tick);
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      scene.onUpdate?.(time);
    },
    seek(ms) {
      time = Math.min(duration, Math.max(0, ms));
      draw(time);
    },
    replay() {
      scene.pause();
      scene.seek(0);
      scene.play();
    },
  };

  // The canvas follows the frame's size (a hidden frame has none): the current time is drawn again.
  new ResizeObserver(() => {
    if (stage.resize()) draw(time);
  }).observe(canvas);
  stage.resize();
  draw(0);
  return scene;
}
