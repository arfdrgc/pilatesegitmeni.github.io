// A menu scene's particle engine (development preview only), for the scenes
// after the first: the same steps and look as ./inspirationScene.ts (the
// approved Inspiration · Reformer Hundred, left as it is), shared here so
// each later scene only composes its pose and its equipment.
// - From the menu's idle (standing in the front view, exactly as
//   ../../components/home-intro/dotScene.ts ends), BEGIN ms still;
// - the gathering (GATHER ms): her dots draw into a disc at the ring's
//   centre, a fifth of the ring's diameter, keeping their order, her lines
//   fading as they go;
// - the morph (MORPH ms): the same dots spread out of it into the scene: a
//   share of them stays her (in the scene's pose), the rest become the
//   equipment, drawn in her own way (each part a volume of dots, the larger
//   ones at its core, spread across its width in depth, soft edges, the
//   palette's tones, sparse lines);
// - the hold: still; the lines come back once it has settled.
// Nothing in the homepage's scene changes: a scene draws on its frame's own
// canvas with the dot figure's model, renderer and palette.
import { BONES, LAGS, LEVELS, newMatrices, pose, random, resolve, sampleFigure, skin, type Dots, type Matrices } from '../../components/dot-figure/model';
import { PALETTES } from '../../components/dot-figure/palettes';
import { colours, Stage, type Look, type Placement } from '../../components/dot-figure/render';
import { END, LINES_IN, LINES_OUT, LOOK, SETTLE, ease, poseAt, smooth } from '../../components/dot-figure/timeline';
import { DOT_FLOOR } from '../../components/home-intro/dotScene';
import { RING, STAGE } from '../../components/home-intro/geometry';
import type { Scene } from '../../components/home-intro/scene';

// ---------- Timing (ms), as the Inspiration scene's ----------

/** The menu's idle, still, before the gathering. */
export const BEGIN = 600;
/** The gathering into the disc, and the morph out of it: a second each (owner). */
export const GATHER = 1000;
export const MORPH = 1000;
/** Each dot's own way, as a share of its stage; the starts spread over the rest. */
const TRAVEL = 0.6;

// ---------- The menu's framing, in model units ----------

/** The menu's placement, as ../../components/home-intro/dotScene.ts draws its idle: her hair 4% of the ring's diameter below its top, her soles on the line. */
export const UNIT = (2 * RING.r * 0.92) / 171;
const PLACEMENT: Placement = { scale: UNIT / STAGE, x: RING.cx / STAGE, floor: DOT_FLOOR / STAGE };
/** The ring's centre and radius in model units (x 0 on her axis, y up from her soles). */
export const CENTRE = { x: 0, y: (DOT_FLOOR - RING.cy) / UNIT };
export const RADIUS = RING.r / UNIT;
/** The disc: a fifth of the ring's diameter (owner). */
export const DISC_R = RADIUS / 5;

/** A menu item's place on the ring in model units (as ../../components/home-intro/geometry.ts's ringPoint, in stage units). */
export const ringAt = (hour: number) => {
  const a = (hour / 12) * 2 * Math.PI;
  return { x: CENTRE.x + RADIUS * Math.sin(a), y: CENTRE.y + RADIUS * Math.cos(a) };
};

// ---------- Her body ----------

const bone = (id: string) => BONES.findIndex((b) => b.id === id);

/** A bone's pivot (plus `offset`, rest space) where a pose takes it. */
export const jointAt = (m: Matrices, id: string, offset: readonly number[] = [0, 0, 0]) => {
  const o = bone(id) * 12;
  const [x, y, z] = BONES[bone(id)].pivot.map((v, k) => v + offset[k]);
  return [0, 1, 2].map((r) => m[o + r * 4] * x + m[o + r * 4 + 1] * y + m[o + r * 4 + 2] * z + m[o + r * 4 + 3]);
};

/** Halfway from the wrist to the fingertips (../../components/dot-figure/model.ts's WRIST and FINGERTIP): where she grips. */
export const GRIP: readonly [number, number, number] = [0.4, -8.75, 0.7];

/**
 * Pointed feet, as in ./inspirationScene.ts (owner's review, 2026-10-29:
 * shin → ankle → instep → pointed toes in one line): each of the foot's dots
 * placed by where it is along the foot (heel to toes) and how high in it
 * (sole to instep) in a pointed foot that carries straight on from the end of
 * the shin, down the leg's line. Rest space, the foot hanging on down the leg.
 */
export const FOOT_TOP = 6.5;
const HEEL = -4.5;
const TOE = 18.8;
const FOOT_LENGTH = 18;
const instep = (s: number) => 1.4 + 1.6 * Math.sin(Math.PI * s) * (1 - 0.45 * s) - s;
const sole = (s: number) => -2.4 + 1.5 * s ** 1.3 - 1.5 * Math.exp(-(((s - 0.07) / 0.1) ** 2));
const arch = (s: number) => -2.2 * s * s;
export function pointed(x: number, y: number, z: number): [number, number, number] {
  if (y >= FOOT_TOP) return [x, y, z];
  const s = clamp01((z - HEEL) / (TOE - HEEL));
  const t = clamp01(y / FOOT_TOP);
  return [x, FOOT_TOP - s * FOOT_LENGTH, arch(s) + sole(s) + (instep(s) - sole(s)) * t];
}

/** The share of her dots that stay her in a scene (smaller, so as dense as standing); her thin parts (the arms, the shins and feet) and her spine keep every dot, so their lines stay unbroken. */
const PERSON = 0.42;
const isArm = (dots: Dots, i: number) => Math.abs(dots.rest[i * 3]) > 18.5 && dots.rest[i * 3 + 1] > 62 && dots.rest[i * 3 + 1] < 136;
const isShin = (dots: Dots, i: number) => dots.rest[i * 3 + 1] < 40;

// ---------- Equipment: parts as volumes of dots ----------

/** A part of a scene's equipment, in model units of the menu's framing (side view). */
export interface Part {
  /** Signed distance: negative inside. */
  sdf: (x: number, y: number) => number;
  box: [x0: number, y0: number, x1: number, y1: number];
  /** Half its thickness: the deeper inside, the larger the dot. */
  half: number;
  /** Its extent across the equipment's width: the dots' depth. */
  depth: [number, number];
  /** Its tone (the palette's, 0 the feet's sage … 11 the crown's clay) and the largest size level its dots take. */
  tone: number;
  level: number;
  /** How much denser than a plain part. */
  density?: number;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const roundBox = (x0: number, y0: number, x1: number, y1: number, r: number) => (x: number, y: number) => {
  const qx = Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2 + r;
  const qy = Math.abs(y - (y0 + y1) / 2) - (y1 - y0) / 2 + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
export const capsule = (ax: number, ay: number, bx: number, by: number, r: number) => (x: number, y: number) => {
  const [dx, dy] = [bx - ax, by - ay];
  const h = clamp01(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - ax - dx * h, y - ay - dy * h) - r;
};
export const boxOf = (ax: number, ay: number, bx: number, by: number, r: number): Part['box'] => [Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r];

/** The equipment's dots apart, in model units of the menu's framing (as the Reformer's). */
const SPACING = 1.6;
/** How soft the parts' edges are: a dot's place is accepted up to this far either side of the edge. */
const EDGE = 0.9;

interface Point {
  x: number;
  y: number;
  k: number;
  tone: number;
  level: number;
}

/**
 * The equipment's dots: as many as its parts' areas ask for at SPACING (at
 * most `count`), shared out by area and density, each part's spread evenly
 * but irregularly (best candidate of several), its edges soft; then their
 * depth, size (the larger at a part's core), tone, and her kind of lines:
 * about half the dots joined to their nearest neighbour in the same part.
 */
export function sampleParts(parts: Part[], count: number, seed = 20261029) {
  const rnd = random(seed);
  const inside = (part: Part) => {
    const [x0, y0, x1, y1] = part.box;
    let hits = 0;
    for (let n = 0; n < 2000; n++) if (part.sdf(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)) < 0) hits++;
    return ((x1 - x0) * (y1 - y0) * hits) / 2000;
  };
  const weights = parts.map((part) => (inside(part) * (part.density ?? 1)) / (SPACING * SPACING));
  const sum = weights.reduce((a, b) => a + b, 0);
  const total = Math.min(count, Math.round(sum));
  const counts = weights.map((w) => Math.floor((w / sum) * total));
  for (let n = 0; counts.reduce((a, b) => a + b, 0) < total; n++) counts[n % counts.length]++;

  const points: Point[] = [];
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
      const level = Math.min(part.level, Math.floor(clamp01(0.2 + 0.65 * core + (rnd() - 0.5) * 0.5) * 0.999 * LEVELS));
      points.push({ x, y, k: part.depth[0] + rnd() * (part.depth[1] - part.depth[0]), tone: part.tone + (rnd() < 0.3 ? 1 : 0), level });
    }
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

/** The farthest of these points from the ring's centre, as a share of its radius. */
export const reachOf = (xy: Iterable<readonly [number, number]>) => {
  let far = 0;
  for (const [x, y] of xy) far = Math.max(far, Math.hypot(x - CENTRE.x, y - CENTRE.y));
  return far / RADIUS;
};

// ---------- The scene ----------

/** What a scene composes: her dots' places in the scene (x, y, depth; menu framing; every dot), the dots she must keep, and the equipment. */
export interface Composition {
  person: Float64Array;
  keep?: Uint8Array;
  parts: Part[];
}

const hash = (i: number) => ((i * 2654435761) >>> 0) / 2 ** 32;
const MAX_STEP = 50;

/** The disc's points, as many as her dots, spread evenly (a sunflower), each given to one of her dots so that the order holds (banded by height, then by x). */
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

/** Pairs sources and targets (equal numbers) so that nothing travels far across the others: rings of equal count by distance from each set's centre, then by angle. */
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

/** A menu scene on `root`'s canvas: `compose` lays out her pose and the equipment; `onDraw` follows the scene's time (for the menu's active item). */
export function createParticleScene(root: HTMLElement, compose: (dots: Dots) => Composition, onDraw?: (t: number) => void): Scene {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-dot-figure]')!;
  const stage = new Stage(canvas);
  const dots = sampleFigure('dense');
  const n = dots.count;

  // Where each dot starts: the menu's idle (standing, front view).
  const start = new Float64Array(n * 3);
  const scratch = resolve({});
  skin(dots, Array.from({ length: LAGS }, (_, level) => pose(poseAt(END, level, scratch), newMatrices())), start);
  const disc = discOf(start, n);

  // Where each ends: hers or the equipment's.
  const scene = compose(dots);
  const end = new Float64Array(n * 3);
  const person = Uint8Array.from({ length: n }, (_, i) => (dots.spine[i] || isArm(dots, i) || isShin(dots, i) || scene.keep?.[i] || hash(i) < PERSON ? 1 : 0));
  const pool: number[] = [];
  for (let i = 0; i < n; i++) {
    if (person[i]) end.set(scene.person.subarray(i * 3, i * 3 + 3), i * 3);
    else pool.push(i);
  }
  const equipment = sampleParts(scene.parts, pool.length);
  // Each of the pool to a point of the equipment; if there are more of them, a few share a point.
  const copies = pool.map((_, j) => Math.floor((j * equipment.points.length) / pool.length));
  const pairs = match(
    pool.map((i) => [disc[i * 3], disc[i * 3 + 1]]),
    copies.map((c) => [equipment.points[c].x, equipment.points[c].y]),
  );
  const sceneTone = new Uint8Array(dots.tone);
  const sceneLevel = new Uint8Array(dots.level);
  /** The first dot on each of the equipment's points: the one its lines join. */
  const lead = new Int32Array(equipment.points.length).fill(-1);
  pool.forEach((i, j) => {
    const c = copies[pairs[j]];
    const { x, y, k, tone, level } = equipment.points[c];
    end.set([x, y, k], i * 3);
    sceneTone[i] = tone;
    sceneLevel[i] = level;
    if (lead[c] < 0) lead[c] = i;
  });

  // Her lines among the dots she keeps; the equipment's within its parts.
  const sceneLines: number[] = [];
  for (let k = 0; k < dots.lines.length; k += 2) if (person[dots.lines[k]] && person[dots.lines[k + 1]]) sceneLines.push(dots.lines[k], dots.lines[k + 1]);
  for (const [a, b] of equipment.lines) if (lead[a] >= 0 && lead[b] >= 0) sceneLines.push(lead[a], lead[b]);
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
    onDraw?.(t);
    player.onUpdate?.(t);
  }

  let time = 0;
  let playing = false;
  let frame = 0;
  let last = 0;

  function tick(now: number) {
    time = Math.min(duration, time + Math.min(now - last, MAX_STEP) * player.rate);
    last = now;
    draw(time);
    if (time >= duration) {
      playing = false;
      frame = 0;
      player.onUpdate?.(time);
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  const player: Scene = {
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
      player.onUpdate?.(time);
    },
    seek(ms) {
      time = Math.min(duration, Math.max(0, ms));
      draw(time);
    },
    replay() {
      player.pause();
      player.seek(0);
      player.play();
    },
  };

  // The canvas follows the frame's size (a hidden frame has none): the current time is drawn again.
  new ResizeObserver(() => {
    if (stage.resize()) draw(time);
  }).observe(canvas);
  stage.resize();
  draw(0);
  return player;
}
