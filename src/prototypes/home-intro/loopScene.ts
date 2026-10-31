// The menu scenes in a loop (owner, 2026-10-29), at /dev/home-menu/#loop and
// /en/dev/home-menu/#loop (./HomeIntroPreview.astro), on the menu's idle
// frame, and on the homepage once its intro has ended, on the intro's canvas
// (../../components/home-intro/homepage.ts, owner, 2026-10-30): IDLE →
// Hundred → Hanging Pull-Up → Swan → Teaser → Ladder Barrel → Up Stretch →
// IDLE, for ever.
// - Each state is held HOLD ms; then every transition is the scenes' own two
//   steps: her dots (the figure's and the equipment's) gather into the disc
//   at the ring's centre (LOOP_GATHER ms), the disc holds (LOOP_DISC ms), and
//   it morphs into the next state (LOOP_MORPH ms), IDLE included. The loop
//   and the hover have their own, faster times (owner, 2026-10-30); the scene
//   frames keep theirs.
// - The states are the approved ones, built from their own modules with the
//   scenes' own rules (the same disc, the same matching of dots to the
//   equipment, the same tones, sizes, lines and spine accent), so each held
//   state is the one its own preview ends on: IDLE as the menu's idle
//   (../../components/home-intro/dotScene.ts), the Hundred as
//   ./inspirationScene.ts, the Hanging Pull-Up as ./repertoireScene.ts, the
//   Chair Swan as ./swanScene.ts, the Teaser as ./poseConcepts.ts lays it out,
//   moved whole to the ring's centre (`centred`), the Ladder Barrel as
//   ./barrelScene.ts, the Reformer Up Stretch as ./upStretchScene.ts.
// - The item a state presents is active from the gathering that leads to
//   it, through its hold; IDLE presents none. In the loop the Hundred
//   presents Miras (10:30) and the Hanging Pull-Up Repertuar (03:00) (owner,
//   2026-10-29; the Inspiration scene itself is unchanged), the Chair Swan
//   İlham (04:30) (owner, 2026-10-30), the Teaser Bedenin Dili (01:30) and the
//   Ladder Barrel Contrology (09:00) and the Up Stretch 7 Prensip (07:30)
//   (owner, 2026-10-31).
// - The labels (owner, 2026-10-29): as the loop starts, all six fade out;
//   after that only the presented item's label shows. Leaving a state, its
//   label fades out at the start of the gathering, and only once it has gone
//   does the next state's label fade in, both within the transition. Each
//   fades with a small move outwards, away from the ring. The icons stay as
//   they are. On the loop's frame only, on its own clock.
// - Hover to inspect (owner, 2026-10-29): a pointer that hovers (not touch)
//   entering an item (its icon or its label: one link) stops the loop's
//   clock at once and shows the pose that item presents (an item no pose
//   presents shows IDLE), flowing, with that item active and only its label,
//   always through the disc (a state held, or a morph forming, that very
//   pose just stays or goes on), never from one pose straight into another.
//   Leaving (owner, 2026-10-31), that pose gathers into the disc and its label
//   fades out; the disc, once formed, holds LEAVE_DISC ms, flowing, with no
//   label and no item active; then it morphs (at the loop's pace) into the
//   state the loop was heading for (the next one, if a state was held; the
//   one after, if that is the pose just shown), its label fading in, and the
//   loop goes on from that state's hold. Another item hovered before then
//   forms its pose out of the disc at once. An item no pose presents, hovered
//   while the loop holds IDLE, changes nothing, and leaving it just lets the
//   loop's clock go on. Stopped, there is no wait (see `halt`). While paused
//   (and with reduced motion) hovering shows the pose at once and leaving
//   gives back the paused frame.
// - The flow (owner, 2026-10-30, a trial): her dots never stop. Every shape
//   (each state and the disc) has closed rings through it (her head, torso,
//   arms, legs and feet, front and back apart; each piece of the equipment;
//   the disc's two halves), each ring a smooth path through the dots' own
//   places, so the shape and its density hold as they travel, the colours
//   and the spine's accent staying where they were. They flow on one clock,
//   through the holds, the gatherings and the morphs alike: a transition
//   goes between two shapes both flowing, each dot heading for the place, in
//   the next shape, of the place it is nearest in the one it leaves, so the
//   scenes' matching holds. It gets up to speed from still once, as the loop
//   starts. None with reduced motion; a pause stops it.
// - Her life while still (owner, 2026-10-30): `drift` (the dev preview's
//   `?motion=drift`) instead keeps the earlier trial, to compare: no flow,
//   and while a pose or the disc is held each dot drifts slowly about its
//   place, under 1.2 px on screen, easing in with the stillness and out as
//   soon as she moves.
// - A pose approved later joins the loop as one more entry in POSES.
import { LAGS, newMatrices, pose, resolve, sampleFigure, skin, type Dots } from '../../components/dot-figure/model';
import { PALETTES } from '../../components/dot-figure/palettes';
import { colours, Stage, type Look, type Placement } from '../../components/dot-figure/render';
import { END, LINES_IN, LINES_OUT, LOOK, SETTLE, ease, poseAt, smooth } from '../../components/dot-figure/timeline';
import { DOT_FLOOR } from '../../components/home-intro/dotScene';
import { RING, STAGE } from '../../components/home-intro/geometry';
import type { Scene } from '../../components/home-intro/scene';
import { compose as barrel, flowPart } from './barrelScene';
import { layoutHundred, sampleReformer } from './inspirationScene';
import { CENTRE, clamp01, DISC_R, sampleParts, UNIT } from './particleScene';
import { composePrinciples as teaser } from './poseConcepts';
import { compose as pullUp } from './repertoireScene';
import { compose as swan } from './swanScene';
import { compose as upStretch, flowPart as upStretchFlow } from './upStretchScene';

/** How long each state is held, once formed, before the next gathering (owner: 3 s). */
export const HOLD = 3000;
/** The loop's gathering into the disc, the disc held, and its morph out of it (owner, 2026-10-30: 400, 200 and 400 ms). */
const LOOP_GATHER = 400;
const LOOP_DISC = 200;
const LOOP_MORPH = 400;
/** After a pointer leaves an item, how long the disc stays, once formed, before the loop goes on (owner, 2026-10-31: 3 s); a new hover ends it at once. */
const LEAVE_DISC = 3000;
/** A hover's gathering into the disc and morph out of it (owner, 2026-10-30: 250 ms each; the scene frames keep ./particleScene.ts's 1000). */
const GATHER = 250;
const MORPH = 250;
/** A label's fade out or in (ms), the pause between the outgoing one gone and the incoming one starting, and how far it moves outwards when hidden (px): out with the gathering, in with the morph (were 400 and 150, which no longer fit). */
export const LABEL_FADE = 250;
const LABEL_GAP = 0;
const LABEL_SHIFT = 6;
/** Her life while still (with `drift`): each dot's drift on screen (px, least and most), its slow rate (Hz, least and most), and how fast the drift comes in and goes with the stillness (ms, a time constant). */
const ALIVE_PX = [0.5, 1.2];
const ALIVE_HZ = [0.18, 0.32];
const ALIVE_EASE = 300;
/** The flow: how fast dots ride their rings (units a second), how long it takes to get up to speed as the loop starts (s, a time constant), and how much neighbouring rings' speeds differ. */
const FLOW_SPEED = 2.5;
const FLOW_EASE = 0.8;
const FLOW_VARY = 0.25;
/** A transition stopped part way by a hover coasts to a stop (ms, a time constant) while the gathering out of it gets going, so no dot turns back at once. */
const COAST = 120;
/** How closely a dot keeps to the places it passes (0: its own offset from the ring's smoothed path, carried along, the smoothest; 1: the places themselves, the truest to the shape): halfway. */
const HUG = 0.5;

// ---------- The scenes' shared rules (as ./inspirationScene.ts and ./particleScene.ts) ----------

/** Each dot's own way, as a share of its stage; the starts spread over the rest. */
const TRAVEL = 0.6;
const PLACEMENT: Placement = { scale: UNIT / STAGE, x: RING.cx / STAGE, floor: DOT_FLOOR / STAGE };
const hash = (i: number) => ((i * 2654435761) >>> 0) / 2 ** 32;
/** The share of her dots that stay her in a scene; her thin parts and her spine keep every dot. */
const PERSON = 0.42;
const isArm = (dots: Dots, i: number) => Math.abs(dots.rest[i * 3]) > 18.5 && dots.rest[i * 3 + 1] > 62 && dots.rest[i * 3 + 1] < 136;
const isShin = (dots: Dots, i: number) => dots.rest[i * 3 + 1] < 40;
const MAX_STEP = 50;
/** Her parts, for the flow: head and neck, torso, arms, legs and feet (seen from the front a foot is short and deep, so on its own), each in halves (even the left, odd the right). */
function partOf(dots: Dots, i: number) {
  const [x, y] = [dots.rest[i * 3], dots.rest[i * 3 + 1]];
  const half = x < 0 ? 0 : 1;
  if (isArm(dots, i)) return 4 + half;
  if (y >= 144) return half;
  if (y < 6) return 8 + half;
  if (y < 75) return 6 + half;
  return 2 + half;
}

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

// ---------- States ----------

/** A state of the loop, formed: every dot's place (x, y, depth in the menu's framing), tone and size, its lines, and the view (0 the front, 90 the side: the spine's accent). */
interface State {
  place: Float64Array;
  tone: Uint8Array;
  level: Uint8Array;
  lines: Uint32Array;
  yaw: number;
  /** For the flow: each dot's part, and which way each part turns (±1). */
  part: Int32Array;
  sense: (part: number) => number;
}

/** Pieces, for the flow (the equipment's, a layer's): dots that hang together, each within `reach` units of another; a piece too small to flow goes with the nearest, if that is within `join` units. */
function piecesOf(place: Float64Array, members: number[], reach = 2.6, least = 8, join = 12): number[][] {
  const root = members.map((_, a) => a);
  const find = (a: number): number => (root[a] === a ? a : (root[a] = find(root[a])));
  const far = (a: number, b: number) => (place[members[a] * 3] - place[members[b] * 3]) ** 2 + (place[members[a] * 3 + 1] - place[members[b] * 3 + 1]) ** 2;
  for (let a = 0; a < members.length; a++) for (let b = a + 1; b < members.length; b++) if (far(a, b) < reach * reach) root[find(a)] = find(b);
  const count = new Map<number, number>();
  members.forEach((_, a) => count.set(find(a), (count.get(find(a)) ?? 0) + 1));
  for (let a = 0; a < members.length; a++) {
    if (count.get(find(a))! >= least) continue;
    let [best, to] = [join * join, -1];
    for (let b = 0; b < members.length; b++) if (find(b) !== find(a) && count.get(find(b))! >= least && far(a, b) < best) [best, to] = [far(a, b), b];
    if (to >= 0) root[find(a)] = find(to);
  }
  const pieces = new Map<number, number[]>();
  members.forEach((i, a) => {
    const r = find(a);
    if (!pieces.has(r)) pieces.set(r, []);
    pieces.get(r)!.push(i);
  });
  return [...pieces.values()];
}

/** What a state is built from: her dots, their places standing (the menu's idle) and in the disc. */
interface Context {
  dots: Dots;
  idle: Float64Array;
  disc: Float64Array;
}

/** The equipment's dots, as the scenes sample them. */
type Equipment = (count: number) => { points: { x: number; y: number; k: number; tone: number; level: number }[]; lines: [number, number][] };

/** An exercise's state, as ./particleScene.ts (and ./inspirationScene.ts) end on it: her kept dots in her pose, the rest on the equipment. */
function exercise({ dots, disc }: Context, person: Float64Array, keep: Uint8Array | undefined, equipment: Equipment): State {
  const n = dots.count;
  const place = new Float64Array(n * 3);
  const own = Uint8Array.from({ length: n }, (_, i) => (dots.spine[i] || isArm(dots, i) || isShin(dots, i) || keep?.[i] || hash(i) < PERSON ? 1 : 0));
  const pool: number[] = [];
  for (let i = 0; i < n; i++) {
    if (own[i]) place.set(person.subarray(i * 3, i * 3 + 3), i * 3);
    else pool.push(i);
  }
  const { points, lines: partLines } = equipment(pool.length);
  const copies = pool.map((_, j) => Math.floor((j * points.length) / pool.length));
  const pairs = match(
    pool.map((i) => [disc[i * 3], disc[i * 3 + 1]]),
    copies.map((c) => [points[c].x, points[c].y]),
  );
  const tone = new Uint8Array(dots.tone);
  const level = new Uint8Array(dots.level);
  const lead = new Int32Array(points.length).fill(-1);
  pool.forEach((i, j) => {
    const c = copies[pairs[j]];
    const { x, y, k } = points[c];
    place.set([x, y, k], i * 3);
    tone[i] = points[c].tone;
    level[i] = points[c].level;
    if (lead[c] < 0) lead[c] = i;
  });
  const lines: number[] = [];
  for (let k = 0; k < dots.lines.length; k += 2) if (own[dots.lines[k]] && own[dots.lines[k + 1]]) lines.push(dots.lines[k], dots.lines[k + 1]);
  for (const [a, b] of partLines) if (lead[a] >= 0 && lead[b] >= 0) lines.push(lead[a], lead[b]);
  // The flow's parts: hers as standing, the halves turning alike (in profile they lie over each other), and each piece of the equipment.
  const part = Int32Array.from({ length: n }, (_, i) => (own[i] ? partOf(dots, i) : 0));
  piecesOf(place, pool).forEach((piece, c) => piece.forEach((i) => (part[i] = 10 + c)));
  const sense = (p: number) => (p < 10 ? (Math.floor(p / 2) % 2 ? -1 : 1) : p % 2 ? 1 : -1);
  return { place, tone, level, lines: Uint32Array.from(lines), yaw: 90, part, sense };
}

/** A state moved as one, with nothing else about it changed, so that the box round her own dots (the parts under 10, not the equipment's) has its centre on the ring's. */
function centred(state: State): State {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < state.part.length; i++) {
    if (state.part[i] >= 10) continue;
    const [x, y] = [state.place[i * 3], state.place[i * 3 + 1]];
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  }
  const [dx, dy] = [CENTRE.x - (x0 + x1) / 2, CENTRE.y - (y0 + y1) / 2];
  const place = Float64Array.from(state.place);
  for (let i = 0; i < state.part.length; i++) [place[i * 3], place[i * 3 + 1]] = [place[i * 3] + dx, place[i * 3 + 1] + dy];
  return { ...state, place };
}

/** A pose of the loop: its id, the menu item it presents (by hour on the ring; none for IDLE), and how its state is built. */
export interface LoopPose {
  id: string;
  hour: number | null;
  build: (context: Context) => State;
}

/** The loop, in order (owner, 2026-10-29; the Swan appended 2026-10-30, the Teaser, the Ladder Barrel and the Up Stretch 2026-10-31). A pose approved later is one more entry here. */
export const POSES: LoopPose[] = [
  {
    id: 'idle',
    hour: null,
    // Seen from the front, each half turns against its mirror.
    build: ({ dots, idle }) => ({ place: idle, tone: dots.tone, level: dots.level, lines: dots.lines, yaw: 0, part: Int32Array.from({ length: dots.count }, (_, i) => partOf(dots, i)), sense: (p) => (p % 2 ? -1 : 1) }),
  },
  {
    id: 'hundred',
    hour: 10.5,
    build: (context) => {
      const layout = layoutHundred(context.dots);
      return exercise(context, layout.person, layout.contact, (count) => sampleReformer(layout.parts, layout.place, count));
    },
  },
  {
    id: 'pull-up',
    hour: 3,
    build: (context) => {
      const scene = pullUp(context.dots);
      return exercise(context, scene.person, scene.keep, (count) => sampleParts(scene.parts, count));
    },
  },
  {
    id: 'swan',
    hour: 4.5,
    build: (context) => {
      const scene = swan(context.dots);
      const state = exercise(context, scene.person, scene.keep, (count) => sampleParts(scene.parts, count));
      // Her legs, upright and on their own, flow with her trunk: apart, their rings' rounded ends pinch across the thighs.
      return { ...state, part: state.part.map((p) => (p === 6 || p === 7 ? p - 4 : p)) };
    },
  },
  {
    id: 'teaser',
    hour: 1.5,
    build: (context) => {
      const scene = teaser(context.dots);
      // Her pose as ./poseConcepts.ts lays it out, moved whole, with its mat, to the ring's centre (owner, 2026-10-31).
      return centred(exercise(context, scene.person, scene.keep, (count) => sampleParts(scene.parts, count)));
    },
  },
  {
    id: 'ladder-barrel',
    hour: 9,
    build: (context) => {
      const scene = barrel(context.dots);
      const state = exercise(context, scene.person, scene.keep, (count) => sampleParts(scene.parts, count));
      // The barrel's panel and its pad, touching, flow each on its own: as one piece their rings cross, and the arch is lost.
      return { ...state, part: state.part.map((p, i) => (p < 10 ? p : (flowPart(state.place[i * 3 + 2]) ?? p))) };
    },
  },
  {
    id: 'up-stretch',
    hour: 7.5,
    build: (context) => {
      const scene = upStretch(context.dots);
      const state = exercise(context, scene.person, scene.keep, (count) => sampleParts(scene.parts, count));
      // The Reformer's pieces all touch on screen: each flows on its own, or their rings cross and the frame goes soft.
      return { ...state, part: state.part.map((p, i) => (p < 10 ? p : upStretchFlow(scene.parts, state.place[i * 3], state.place[i * 3 + 1], state.place[i * 3 + 2]))) };
    },
  },
];

// ---------- The flow ----------

/**
 * A shape's flow: its dots ride closed rings, each a smooth path
 * through the places of the dots on it, in order, so that travelling they
 * keep the shape and its density; each dot keeps its own offset from the
 * smoothed path. Per dot: its ring and its slot on it; per ring: where its
 * slots start, how many, and its rate (slots a second, signed); per slot:
 * the path's point (x, y, depth) and the dot whose place it is.
 */
interface Flow {
  ring: Int32Array;
  slot: Int32Array;
  first: Int32Array;
  size: Int32Array;
  rate: Float32Array;
  path: Float64Array;
  owner: Int32Array;
}

/** One part's rings: its dots in bands by how deep they lie inside the part (the distance to its outline, on a grid of its dots with the gaps between them closed), so each ring follows the outline: `band` units deep each, and each in order round the part. A band too small to ride goes in with the next one in. */
function ringsOf(place: Float64Array, members: number[], band: number): number[][] {
  const m = members.length;
  if (m < 8) return [members];
  // The grid: cells of CELL units, PAD empty cells round it, the gaps closed by growing CLOSE cells and shrinking back.
  const [CELL, PAD, CLOSE] = [2, 4, 2];
  let [x0, y0, x1, y1, cx, cy] = [Infinity, Infinity, -Infinity, -Infinity, 0, 0];
  for (const i of members) {
    const [x, y] = [place[i * 3], place[i * 3 + 1]];
    [x0, y0, x1, y1, cx, cy] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y), cx + x / m, cy + y / m];
  }
  const w = Math.floor((x1 - x0) / CELL) + 1 + 2 * PAD;
  const h = Math.floor((y1 - y0) / CELL) + 1 + 2 * PAD;
  const cellOf = (i: number) => (Math.floor((place[i * 3 + 1] - y0) / CELL) + PAD) * w + Math.floor((place[i * 3] - x0) / CELL) + PAD;
  let mask = new Uint8Array(w * h);
  for (const i of members) mask[cellOf(i)] = 1;
  const morph = (src: Uint8Array, grow: boolean) => {
    const out = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        let hit = !grow;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!!src[(y + dy) * w + x + dx] === grow) hit = grow;
        out[y * w + x] = +hit;
      }
    return out;
  };
  for (let k = 0; k < CLOSE; k++) mask = morph(mask, true);
  for (let k = 0; k < CLOSE; k++) mask = morph(mask, false);
  for (const i of members) mask[cellOf(i)] = 1;
  // How deep each cell lies (units): the distance to the nearest cell outside, in two passes.
  const depth = Float64Array.from(mask, (v) => (v ? Infinity : 0));
  const pass = (from: number, to: number, step: number, near: [number, number, number][]) => {
    for (let y = from; y !== to; y += step)
      for (let x = from === 0 ? 0 : w - 1; x !== (from === 0 ? w : -1); x += step) {
        const c = y * w + x;
        if (!depth[c]) continue;
        for (const [dx, dy, cost] of near) {
          const [nx, ny] = [x + dx, y + dy];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) depth[c] = Math.min(depth[c], depth[ny * w + nx] + cost);
        }
      }
  };
  pass(0, h, 1, [[-1, 0, 1], [0, -1, 1], [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2]]);
  pass(h - 1, -1, -1, [[1, 0, 1], [0, 1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2]]);
  // The outline, cell by cell all the way round (Moore tracing), and each dot's place along it: where the outline is nearest.
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const start = mask.indexOf(1);
  const outline = [start];
  // It stops back at the start about to go the same way again (it may pass the start before, through a narrow neck).
  for (let [cur, look, guard] = [start, 5, 0]; guard < 4 * w * h; guard++) {
    let next = -1;
    for (let k = 0; k < 8 && next < 0; k++) {
      const d = (look + k) % 8;
      if (mask[cur + DIRS[d][1] * w + DIRS[d][0]]) [next, look] = [cur + DIRS[d][1] * w + DIRS[d][0], (d + 5) % 8];
    }
    if (next < 0 || (cur === start && outline.length > 2 && next === outline[1])) break;
    outline.push((cur = next));
  }
  if (outline.length > 1 && outline[outline.length - 1] === start) outline.pop();
  // Many dots share their nearest cell, so each goes on from it by how far along the outline it lies (its offset along the outline there).
  const along = new Map<number, number>();
  const O = outline.length;
  for (const i of members) {
    const [px, py] = [(place[i * 3] - x0) / CELL + PAD - 0.5, (place[i * 3 + 1] - y0) / CELL + PAD - 0.5];
    let [best, at] = [Infinity, 0];
    outline.forEach((o, k) => {
      const d = ((o % w) - px) ** 2 + (Math.floor(o / w) - py) ** 2;
      if (d < best) [best, at] = [d, k];
    });
    const [a, b] = [outline[(at + O - 2) % O], outline[(at + 2) % O]];
    const [tx, ty] = [(b % w) - (a % w), Math.floor(b / w) - Math.floor(a / w)];
    const off = O > 4 && (tx || ty) ? (4 * ((px - (outline[at] % w)) * tx + (py - Math.floor(outline[at] / w)) * ty)) / (tx * tx + ty * ty) : 0;
    along.set(i, at + Math.max(-2, Math.min(2, off)));
  }
  const banded: number[][] = [];
  for (const i of members) (banded[Math.floor((depth[cellOf(i)] * CELL) / band)] ??= []).push(i);
  const rings: number[][] = [];
  let carry: number[] = [];
  for (const band of banded) {
    carry.push(...(band ?? []));
    if (carry.length < 6) continue;
    rings.push(carry);
    carry = [];
  }
  if (carry.length) rings.length ? rings[rings.length - 1].push(...carry) : rings.push(carry);
  // Each ring round the part along its outline (deep inside, up one side and down the other).
  return rings.map((ring) => ring.sort((p, q) => along.get(p)! - along.get(q)!));
}

/** A shape's flow: per part (`part` of each dot), front and back apart if the part has depth, so that no dot passes through her, and by the pieces each falls into, its rings, turning the part's way (`sense`, ±1), `band` units wide. */
function flowOf(place: Float64Array, part: Int32Array, sense: (part: number) => number, band: number): Flow {
  const n = part.length;
  const parts = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    if (!parts.has(part[i])) parts.set(part[i], []);
    parts.get(part[i])!.push(i);
  }
  const rings: number[][] = [];
  const senses: number[] = [];
  for (const [p, members] of parts) {
    const depths = members.map((i) => place[i * 3 + 2]).sort((a, b) => a - b);
    const mid = depths[depths.length >> 1];
    const layers = depths[depths.length - 1] - depths[0] > 2 ? [members.filter((i) => place[i * 3 + 2] >= mid), members.filter((i) => place[i * 3 + 2] < mid)] : [members];
    // Each layer by the pieces it falls into (a frame's posts, seen in profile), so no ring leaps between them.
    for (const piece of layers.flatMap((layer) => (layer.length ? piecesOf(place, layer, 4, 3) : [])))
      for (const ring of ringsOf(place, piece, band)) {
        rings.push(ring);
        senses.push(sense(p));
      }
  }
  const flow: Flow = { ring: new Int32Array(n), slot: new Int32Array(n), first: new Int32Array(rings.length), size: new Int32Array(rings.length), rate: new Float32Array(rings.length), path: new Float64Array(n * 3), owner: new Int32Array(n) };
  const WEIGHTS = [1, 2, 3, 2, 1];
  let at = 0;
  rings.forEach((ring, r) => {
    const L = ring.length;
    [flow.first[r], flow.size[r]] = [at, L];
    ring.forEach((i, k) => ([flow.ring[i], flow.slot[i], flow.owner[at + k]] = [r, k, i]));
    // The path: each slot's place, smoothed with its neighbours along the ring.
    for (let k = 0; k < L; k++)
      for (let c = 0; c < 3; c++) {
        let [sum, weight] = [0, 0];
        for (let d = L < 5 ? 0 : -2; d <= (L < 5 ? 0 : 2); d++) [sum, weight] = [sum + WEIGHTS[d + 2] * place[ring[(k + d + L) % L] * 3 + c], weight + WEIGHTS[d + 2]];
        flow.path[(at + k) * 3 + c] = sum / weight;
      }
    let length = 0;
    for (let k = 0; k < L; k++) {
      const [a, b] = [(at + k) * 3, (at + ((k + 1) % L)) * 3];
      length += Math.hypot(flow.path[b] - flow.path[a], flow.path[b + 1] - flow.path[a + 1]);
    }
    flow.rate[r] = L > 1 ? (senses[r] * FLOW_SPEED * (1 + FLOW_VARY * Math.sin(2.4 * r + 1.3))) / Math.max(length / L, 0.5) : 0;
    at += L;
  });
  return flow;
}

/** A shape that flows: its dots' places, its flow, its lines (pairs of places, see ringLines), the longest a line may be (units: a little over the longest of the states' own, so a line that stretches where its ring crosses a gap is left out until it is short again) and its view. */
interface Form {
  place: Float64Array;
  flow: Flow;
  lines: Uint32Array;
  reach: number;
  yaw: number;
}

/** A form's lines, kept to pairs that travel together: a state's own where both places are on one ring and near along it; any other joins its first place to the nearest of the places either side of it on its ring, if that is within `reach`. */
function ringLines(lines: Uint32Array, flow: Flow, place: Float64Array, reach: number): Uint32Array {
  const out: number[] = [];
  const pairs = new Set<number>();
  for (let k = 0; k < lines.length; k += 2) {
    let [a, b] = [lines[k], lines[k + 1]];
    const r = flow.ring[a];
    const L = flow.size[r];
    const gap = (flow.slot[b] - flow.slot[a] + L) % L;
    if (flow.ring[b] !== r || Math.min(gap, L - gap) > 2) {
      let best = reach * reach;
      const near = b;
      for (const d of [-2, -1, 1, 2]) {
        const q = flow.owner[flow.first[r] + ((flow.slot[a] + d + 2 * L) % L)];
        const far = (place[q * 3] - place[a * 3]) ** 2 + (place[q * 3 + 1] - place[a * 3 + 1]) ** 2;
        if (q !== a && far < best) [best, b] = [far, q];
      }
      if (b === near) continue;
    }
    const key = Math.min(a, b) * flow.ring.length + Math.max(a, b);
    if (pairs.has(key)) continue;
    pairs.add(key);
    out.push(a, b);
  }
  return Uint32Array.from(out);
}

/**
 * A shape flowing: each dot's place in it (`vid`: whose place, where it
 * was when this flow began, at `epoch` on the flow's clock, ms), and what
 * its places show: tones and the spine's accent by place (they stay where
 * they are), sizes by dot (each keeps its own); its lines, between the dots
 * on their places as it began.
 */
interface Term {
  form: Form;
  vid: Int32Array;
  epoch: number;
  tone: Uint8Array;
  level: Uint8Array;
  spine: Uint8Array;
  lines?: Uint32Array;
}

/** What is drawn of each dot: its place, tone, size and whether it is the spine's. */
interface Frame {
  place: Float64Array;
  tone: Uint8Array;
  level: Uint8Array;
  spine: Uint8Array;
}

/** A term `s` seconds into its flow, into `out`: each dot its place moved along its ring (Catmull-Rom curves through the path's points and through the places, HUG of the way to the latter), with the tone and accent of the place it is nearest, whose that place is into `own` if given. */
function termInto(term: Term, s: number, out: Frame, own?: Int32Array) {
  const { place, flow } = term.form;
  const { path } = flow;
  for (let i = 0; i < term.vid.length; i++) {
    const v = term.vid[i];
    const [r, k0] = [flow.ring[v], flow.slot[v]];
    const [L, f0] = [flow.size[r], flow.first[r]];
    const u = (((k0 + flow.rate[r] * s) % L) + L) % L;
    const k = Math.floor(u) % L;
    const t = u - Math.floor(u);
    const [a, b, c, d, o] = [(f0 + ((k + L - 1) % L)) * 3, (f0 + k) * 3, (f0 + ((k + 1) % L)) * 3, (f0 + ((k + 2) % L)) * 3, (f0 + k0) * 3];
    const [qa, qb, qc, qd] = [flow.owner[a / 3] * 3, flow.owner[b / 3] * 3, flow.owner[c / 3] * 3, flow.owner[d / 3] * 3];
    for (let x = 0; x < 3; x++) {
      const [p0, p1, p2, p3] = [path[a + x], path[b + x], path[c + x], path[d + x]];
      const p = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
      const [r0, r1, r2, r3] = [place[qa + x], place[qb + x], place[qc + x], place[qd + x]];
      const q = 0.5 * (2 * r1 + (r2 - r0) * t + (2 * r0 - 5 * r1 + 4 * r2 - r3) * t * t + (3 * r1 - r0 - 3 * r2 + r3) * t * t * t);
      out.place[i * 3 + x] = (1 - HUG) * (place[v * 3 + x] + (p - path[o + x])) + HUG * q;
    }
    const near = flow.owner[f0 + (t < 0.5 ? k : (k + 1) % L)];
    out.tone[i] = term.tone[near];
    out.spine[i] = term.spine[near];
    out.level[i] = term.level[v];
    if (own) own[i] = near;
  }
}

/** Each dot `w` of the way from frame `a` to frame `b`, into `out`; past halfway it shows what `b` shows. */
function blend(a: Frame, b: Frame, w: Float32Array, out: Frame) {
  for (let i = 0; i < w.length; i++) {
    for (let c = i * 3; c < i * 3 + 3; c++) out.place[c] = a.place[c] + (b.place[c] - a.place[c]) * w[i];
    const f = w[i] >= 0.5 ? b : a;
    out.tone[i] = f.tone[i];
    out.level[i] = f.level[i];
    out.spine[i] = f.spine[i];
  }
}

/** What a gathering leaves: a shape flowing (`a`), or a transition stopped part way at `at` on the flow's clock, each dot `p` of its way from `a` to `b` and going on at `rate` (a ms) as it coasts to a stop, both flowing on. */
interface Live {
  a: Term;
  b?: Term;
  p?: Float32Array;
  rate?: Float32Array;
  at?: number;
}

/**
 * A detour (hover to inspect), one step at a time, `at` the time into it:
 * what is drawn gathering into the disc (its lines fading, its view kept),
 * the disc held after the pointer has left, the disc morphing into state `to`
 * (lasting `span` ms), or that state formed; each flowing. `keep`: the loop's
 * own IDLE, held as it was under an item no pose presents, so leaving it just
 * gives the clock back.
 */
type Step =
  | { kind: 'gather'; from: Live; disc: Term; delays: Float32Array; at: number; lineAlpha: number; yaw: number }
  | { kind: 'disc'; disc: Term; at: number; yaw: number }
  | { kind: 'morph'; disc: Term; to: number; term: Term; delays: Float32Array; at: number; span: number; yaw: number }
  | { kind: 'still'; to: number; term: Term; at: number; first?: boolean; keep?: boolean };

// ---------- The loop ----------

/** The loop's player; `enabled` off, it neither answers the pointer nor draws on a resize (the homepage, while its intro plays on the same canvas). */
export interface LoopScene extends Scene {
  enabled: boolean;
  /**
   * The cycling stopped while it plays (the homepage's stop control, owner,
   * 2026-10-30): what is drawn goes through the disc into IDLE at the
   * hover's pace and stays there, flowing on, all six labels shown; hovering
   * an item still shows its pose through the disc, and leaving it goes back
   * through the disc into IDLE. Until the next seek, or `resume`.
   */
  halt(): void;
  /**
   * The cycling on again after `halt` (owner, 2026-10-31): once IDLE is
   * formed and settled, with no item hovered, the loop goes on from a full
   * hold of it, its labels fading out as at the loop's start.
   */
  resume(): void;
}

export function createLoopScene(root: HTMLElement, poses: LoopPose[] = POSES, { drift = false }: { drift?: boolean } = {}): LoopScene {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-dot-figure]')!;
  const stage = new Stage(canvas);
  const dots = sampleFigure('dense');
  const n = dots.count;

  const idle = new Float64Array(n * 3);
  const scratch = resolve({});
  skin(dots, Array.from({ length: LAGS }, (_, level) => pose(poseAt(END, level, scratch), newMatrices())), idle);
  const disc = discOf(idle, n);
  const states = poses.map((p) => p.build({ dots, idle, disc }));

  // Each dot's start within a stage, per state: leaving it, the farthest go first; forming it, from the centre out.
  const spread = (d: number, i: number) => (1 - TRAVEL) * (0.7 * d + 0.3 * hash(i ^ 0x9e3779b9));
  const distances = states.map(({ place }) => Float32Array.from({ length: n }, (_, i) => Math.hypot(place[i * 3] - CENTRE.x, place[i * 3 + 1] - CENTRE.y)));
  const gatherAt = distances.map((d) => {
    const most = Math.max(...d);
    return Float32Array.from(d, (v, i) => spread(1 - v / most, i));
  });
  const morphAt = distances.map((d) => {
    const most = Math.max(...d);
    return Float32Array.from(d, (v, i) => spread(v / most, i));
  });

  // Each dot's drift: its own size, and per axis two slow sines (the second faster and fainter) whose phases follow its place on her, so near dots move alike, with a little of its own.
  const TURN = 2 * Math.PI;
  const driftPx = Float32Array.from({ length: n }, (_, i) => ALIVE_PX[0] + (ALIVE_PX[1] - ALIVE_PX[0]) * hash(i ^ 0x51ed27));
  const driftHz = new Float32Array(n * 4);
  const driftPhase = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const along = dots.rest[i * 3] / 60 + dots.rest[i * 3 + 1] / 90;
    for (let c = 0; c < 4; c++) {
      const k = i * 4 + c;
      driftHz[k] = TURN * (ALIVE_HZ[0] + (ALIVE_HZ[1] - ALIVE_HZ[0]) * hash(k ^ 0x2545f491)) * (c % 2 ? 1.6 : 1);
      driftPhase[k] = TURN * (along * (c < 2 ? 1 : -1) + 0.35 * hash(k ^ 0x68e31da4));
    }
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // The flow: every state's rings (4 units wide) and the disc's (3 units: its two halves, turning against each other).
  const flowing = !drift;
  // A line may be a little longer than the longest of any state's own. The Teaser, the Ladder Barrel and the Up Stretch have their own limits, leaving the others' as they were.
  const longestOf = ({ place, lines }: State) => {
    let most = 0;
    for (let k = 0; k < lines.length; k += 2) most = Math.max(most, Math.hypot(place[lines[k] * 3] - place[lines[k + 1] * 3], place[lines[k] * 3 + 1] - place[lines[k + 1] * 3 + 1]));
    return most;
  };
  const longest = Math.max(...states.filter((_, k) => poses[k].id !== 'teaser' && poses[k].id !== 'ladder-barrel' && poses[k].id !== 'up-stretch').map(longestOf));
  const forms: Form[] = states.map((state) => {
    const flow = flowOf(state.place, state.part, state.sense, 4);
    const reach = 1.2 * Math.max(longest, longestOf(state));
    return { place: state.place, flow, lines: ringLines(state.lines, flow, state.place, reach), reach, yaw: state.yaw };
  });
  const discForm: Form = { place: disc, flow: flowOf(disc, Int32Array.from({ length: n }, (_, i) => +(disc[i * 3] >= CENTRE.x)), (p) => (p ? -1 : 1), 3), lines: new Uint32Array(0), reach: 0, yaw: 0 };
  /** The flow's clock (ms, on the frames' clock, so it stops with a pause and goes with the speed); the loop's start sets it to the loop's time. */
  let flowClock = 0;
  /** How far a term has flowed (s) by `at` on the flow's clock: getting up to speed from still as the clock starts. None with reduced motion, or with the drift instead. */
  const run = (t: number) => (t <= 0 ? 0 : t - FLOW_EASE * (1 - Math.exp(-t / FLOW_EASE)));
  const since = (term: Term, at = flowClock) => (!flowing || reducedMotion.matches ? 0 : run(at / 1000) - run(term.epoch / 1000));

  const identity = Int32Array.from({ length: n }, (_, i) => i);
  const stateTerm = (k: number, vid: Int32Array, epoch: number): Term => ({ form: forms[k], vid, epoch, tone: states[k].tone, level: states[k].level, spine: dots.spine });
  const blank = (): Frame => ({ place: new Float64Array(n * 3), tone: new Uint8Array(n), level: new Uint8Array(n), spine: new Uint8Array(n) });
  const [fa, fb, fc, fd] = [blank(), blank(), blank(), blank()];
  const weight = new Float32Array(n);
  const coasted = new Float32Array(n);

  function liveInto(live: Live, out: Frame, at = flowClock) {
    if (!live.b) return termInto(live.a, since(live.a, at), out);
    termInto(live.a, since(live.a, at), fa);
    termInto(live.b, since(live.b, at), fb);
    const coast = live.rate ? COAST * (1 - Math.exp(-Math.max(0, at - live.at!) / COAST)) : 0;
    for (let i = 0; i < n; i++) coasted[i] = clamp01(live.p![i] + (live.rate ? live.rate[i] * coast : 0));
    blend(fa, fb, coasted, out);
  }
  /** A gathering out of `from` beginning at `at` on the flow's clock: each dot heads for the disc's place of the place it is nearest in what it leaves (in a transition stopped part way, in the shape it came from), and gives that place what it shows. */
  function discFrom(from: Live, at: number): Term {
    const vid = new Int32Array(n);
    termInto(from.a, since(from.a, at), fd, vid);
    liveInto(from, fc, at);
    const term: Term = { form: discForm, vid, epoch: at, tone: new Uint8Array(n), level: new Uint8Array(n), spine: new Uint8Array(n) };
    for (let i = 0; i < n; i++) [term.tone[vid[i]], term.level[vid[i]], term.spine[vid[i]]] = [fc.tone[i], fc.level[i], fc.spine[i]];
    return term;
  }
  /** A morph out of the disc into state `k` beginning at `at`: each dot heads for the state's place of the disc's place it is nearest. */
  function stateFrom(disc: Term, k: number, at: number): Term {
    const vid = new Int32Array(n);
    termInto(disc, since(disc, at), fd, vid);
    return stateTerm(k, vid, at);
  }
  /** A term's lines as drawn now: those no longer than its form allows (after its dots are placed). */
  const none = new Uint32Array(0);
  const lineBuf = new Uint32Array(Math.max(0, ...forms.map((f) => f.lines.length)));
  function linesNow(term: Term) {
    const all = termLines(term);
    const reach = term.form.reach ** 2;
    let m = 0;
    for (let k = 0; k < all.length; k += 2) {
      const [a, b] = [all[k] * 3, all[k + 1] * 3];
      if ((pos[a] - pos[b]) ** 2 + (pos[a + 1] - pos[b + 1]) ** 2 <= reach) [lineBuf[m++], lineBuf[m++]] = [all[k], all[k + 1]];
    }
    return lineBuf.subarray(0, m);
  }
  /** A term's lines, between the dots on their places as it began. */
  function termLines(term: Term) {
    if (term.lines) return term.lines;
    const on = new Int32Array(n);
    term.vid.forEach((v, i) => (on[v] = i));
    return (term.lines = Uint32Array.from(term.form.lines, (v) => on[v]));
  }

  /**
   * The loop's turn: the state `j` held, flowing as the morph into it began,
   * and, made once when first needed, the gathering out of it and the morph
   * into the next (where each dot heads, and when it starts). Each begins
   * after the one before by its time, so the turn is the same however the
   * frames fall.
   */
  interface Turn {
    j: number;
    hold: Term;
    /** When the hold began, on the flow's clock. */
    at: number;
    gather?: { disc: Term; delays: Float32Array };
    morph?: { term: Term; delays: Float32Array };
  }
  const firstTurn = (): Turn => ({ j: 0, hold: stateTerm(0, identity, -LOOP_MORPH), at: 0 });
  let turn = firstTurn();
  function gatherOf(T: Turn) {
    if (!T.gather) {
      const disc = discFrom({ a: T.hold }, T.at + HOLD);
      T.gather = { disc, delays: Float32Array.from(disc.vid, (v) => gatherAt[T.j][v]) };
    }
    return T.gather;
  }
  function morphOf(T: Turn) {
    if (!T.morph) {
      const { disc } = gatherOf(T);
      const k = (T.j + 1) % poses.length;
      const term = stateFrom(disc, k, disc.epoch + LOOP_GATHER + LOOP_DISC);
      T.morph = { term, delays: Float32Array.from(term.vid, (v) => morphAt[k][v]) };
    }
    return T.morph;
  }
  /** The loop's turn brought on to state `j`, a turn at a time. */
  function turnTo(j: number) {
    while (turn.j !== j) {
      const { term } = morphOf(turn);
      turn = { j: (turn.j + 1) % poses.length, hold: term, at: term.epoch + LOOP_MORPH };
    }
  }

  const items = poses.map((p) => (p.hour === null ? null : root.querySelector<HTMLElement>(`.ring-menu__item[data-hour='${p.hour}']`)));
  let active: HTMLElement | null = null;
  const activate = (item: HTMLElement | null) => {
    if (item === active) return;
    active?.removeAttribute('data-active');
    item?.setAttribute('data-active', '');
    active = item;
  };

  // Every item's label, and which way is outwards for it (the left half's labels sit to the left of their icons).
  const labels = [...root.querySelectorAll<HTMLElement>('.ring-menu__item')].map((item) => ({
    item,
    label: item.querySelector<HTMLElement>('.ring-menu__label')!,
    out: item.classList.contains('ring-menu__item--start') ? -1 : 1,
    shown: '',
  }));
  /** A label shown by `v` (0 hidden … 1 as the menu has it): faded, and moved outwards as it goes. Only written when it changes. */
  const showLabel = (entry: (typeof labels)[number], v: number) => {
    const key = v.toFixed(3);
    if (key === entry.shown) return;
    entry.shown = key;
    entry.label.style.opacity = key;
    entry.label.style.transform = v >= 1 ? '' : `translateX(${((1 - v) * LABEL_SHIFT * entry.out).toFixed(2)}px)`;
  };
  type Entry = (typeof labels)[number];
  const fade = (ms: number) => ease(clamp01(ms / LABEL_FADE));
  /** The labels at a point of the loop: `j` the state held or left, `k` the next, `local` the time into j's turn. The loop's first IDLE fades out what the menu showed. */
  function labelsAt(j: number, k: number, local: number) {
    for (const entry of labels) {
      let v = 0;
      if (local < HOLD) {
        if (j === 0 && start === 'menu') v = 1 - fade(local);
        else v = entry.item === items[j] ? 1 : 0;
      } else {
        const into = local - HOLD;
        if (entry.item === items[j]) v = 1 - fade(into);
        else if (entry.item === items[k]) v = fade(into - LABEL_FADE - LABEL_GAP);
      }
      showLabel(entry, v);
    }
  }

  const ground = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
  const fill = colours(PALETTES.find((p) => p.id === 'clay-sage')!, ground);
  const look: Look = { ...LOOK, lineAlpha: 1 };
  const shown: Dots = { ...dots, tone: new Uint8Array(dots.tone), level: new Uint8Array(dots.level), spine: new Uint8Array(dots.spine), lines: dots.lines };
  /** Every dot's place as laid out, and as drawn, the view's turn undone on it; the view last drawn; what is drawn, flowing (a hover gathers from it). */
  const pos = new Float64Array(n * 3);
  const seen = new Float64Array(n * 3);
  let yawNow = 0;
  let drawn: Live = { a: turn.hold };
  /** The transition last drawn: how far through it (0 … 1), each dot's start, and how long it lasts (ms). */
  let going: { u: number; delays: Float32Array; span: number } = { u: 0, delays: weight, span: 1 };
  const out: Frame = { place: pos, tone: shown.tone, level: shown.level, spine: shown.spine };
  /** A transition from `from` into `to`, `u` of the way through, each dot starting at its own `delays`, both flowing. */
  function transit(from: Live, to: Term, delays: Float32Array, u: number, span: number) {
    liveInto(from, fc);
    termInto(to, since(to), fd);
    for (let i = 0; i < n; i++) weight[i] = ease(clamp01((u - delays[i]) / TRAVEL));
    blend(fc, fd, weight, out);
    drawn = { a: from.a, b: to };
    going = { u, delays, span };
  }
  /** A shape flowing, drawn. */
  function hold(term: Term) {
    termInto(term, since(term), out);
    drawn = { a: term };
  }

  /** One state's turn: its hold, then the gathering out of it, the disc held and the morph into the next. */
  const STEP = HOLD + LOOP_GATHER + LOOP_DISC + LOOP_MORPH;
  const duration = poses.length * STEP;
  /** A state's lines once formed: in after it has settled (as after any settled pose), already in for the loop's very first state; and gone within the gathering out of it. */
  const linesIn = (held: number, first: boolean) => (first ? 1 : clamp01((held - SETTLE) / LINES_IN));
  const LINES_GO = Math.min(LINES_OUT, GATHER);
  const LOOP_LINES_GO = Math.min(LINES_OUT, LOOP_GATHER);

  function draw(t: number) {
    const j = Math.min(poses.length - 1, Math.floor(t / STEP));
    const k = (j + 1) % poses.length;
    const local = t - j * STEP;
    const from = states[j];
    const first = j === 0 && start !== 'loop';
    let yaw = from.yaw;
    turnTo(j);
    if (local < HOLD) {
      // Held, flowing on from the morph (the very first IDLE is the menu's own).
      hold(turn.hold);
      shown.lines = linesNow(turn.hold);
      look.lineAlpha = linesIn(local, first);
      activate(items[j]);
    } else if (local < HOLD + LOOP_GATHER) {
      // Into the disc, her lines going as it starts.
      const { disc, delays } = gatherOf(turn);
      transit({ a: turn.hold }, disc, delays, (local - HOLD) / LOOP_GATHER, LOOP_GATHER);
      shown.lines = linesNow(turn.hold);
      look.lineAlpha = linesIn(HOLD, first) * (1 - clamp01((local - HOLD) / LOOP_LINES_GO));
      activate(items[k]);
    } else if (local < HOLD + LOOP_GATHER + LOOP_DISC) {
      // The disc held, flowing.
      hold(gatherOf(turn).disc);
      look.lineAlpha = 0;
      activate(items[k]);
    } else {
      yaw = morphInto(gatherOf(turn).disc, k, morphOf(turn), from.yaw, (local - HOLD - LOOP_GATHER - LOOP_DISC) / LOOP_MORPH, LOOP_MORPH);
      activate(items[k]);
    }
    paint(yaw);
    labelsAt(j, k, local);
    player.onUpdate?.(t);
  }

  /** Out of the disc into state `k`, `v` of the way through the morph, which lasts `span` ms; halfway, a dot takes its new tone and size; the view turns with it. Returns the view. */
  function morphInto(disc: Term, k: number, { term, delays }: { term: Term; delays: Float32Array }, yaw: number, v: number, span: number) {
    transit({ a: disc }, term, delays, v, span);
    shown.lines = states[k].lines;
    look.lineAlpha = 0;
    return yaw + (states[k].yaw - yaw) * smooth(clamp01(v));
  }

  function paint(yaw: number) {
    // The places are laid out as seen; the view's turn is undone on them, so it only brings the spine's accent in or out.
    const cy = Math.cos((yaw * Math.PI) / 180);
    const sy = Math.sin((yaw * Math.PI) / 180);
    // Her life while still: each dot's drift, in px on screen, by how still she is (none with reduced motion).
    const unit = reducedMotion.matches || !pxWidth ? 0 : alive / (PLACEMENT.scale * pxWidth);
    const s = life / 1000;
    for (let i = 0; i < n * 3; i += 3) {
      let [x, y] = [pos[i], pos[i + 1]];
      if (unit > 1e-4 / ALIVE_PX[1]) {
        const k = (i / 3) * 4;
        // Each axis gets 1/√2 of it, so the two together never take a dot further than its own size.
        const a = driftPx[i / 3] * unit * Math.SQRT1_2;
        x += a * (0.7 * Math.sin(driftHz[k] * s + driftPhase[k]) + 0.3 * Math.sin(driftHz[k + 1] * s + driftPhase[k + 1]));
        y += a * (0.7 * Math.sin(driftHz[k + 2] * s + driftPhase[k + 2]) + 0.3 * Math.sin(driftHz[k + 3] * s + driftPhase[k + 3]));
      }
      const depth = pos[i + 2];
      seen[i] = x * cy - depth * sy;
      seen[i + 1] = y;
      seen[i + 2] = x * sy + depth * cy;
    }
    yawNow = yaw;
    stage.draw(shown, seen, yaw, look, fill, PLACEMENT);
    canvas.dataset.drawn = '';
  }

  /** While paused (or with reduced motion), the state the inspected item presents, formed and still, as the loop holds it (IDLE for an item no pose presents), with that item active and only its label shown. */
  function drawInspected(entry: Entry) {
    const state = states[poseOf(entry)];
    pos.set(state.place);
    shown.tone.set(state.tone);
    shown.level.set(state.level);
    shown.spine.set(dots.spine);
    shown.lines = state.lines;
    look.lineAlpha = 1;
    paint(state.yaw);
    activate(entry.item);
    for (const other of labels) showLabel(other, other === entry ? 1 : 0);
  }

  // ---------- Hover to inspect: the detour through the disc ----------

  /** The state an item presents (IDLE for an item no pose presents). */
  const poseOf = (entry: Entry) => Math.max(0, items.indexOf(entry.item));
  /** Each dot's start in a gathering out of `place`, by the loop's rule: the farthest go first. */
  function delaysOf(place: Float64Array) {
    const d = Float32Array.from({ length: n }, (_, i) => Math.hypot(place[i * 3] - CENTRE.x, place[i * 3 + 1] - CENTRE.y));
    const most = Math.max(...d) || 1;
    return Float32Array.from(d, (v, i) => spread(1 - v / most, i));
  }
  /** What is drawn now, to gather from: a shape flowing, or a transition stopped where it is, both flowing on. */
  function current(): Live {
    if (!drawn.b) return drawn;
    const { u, delays, span } = going;
    const ahead = 0.002;
    const rate = Float32Array.from(delays, (d) => (ease(clamp01((u + ahead - d) / TRAVEL)) - ease(clamp01((u - d) / TRAVEL))) / (ahead * span));
    return { ...drawn, p: weight.slice(), rate, at: flowClock };
  }
  /** What is drawn gathering into the disc from now, its dots starting by `delays` of where they head (else by where they are), its lines fading, its view kept. */
  function gathering(from: Live, delays?: Float32Array): Step {
    const disc = discFrom(from, flowClock);
    return { kind: 'gather', from, disc, delays: delays ? Float32Array.from(disc.vid, (v) => delays[v]) : delaysOf(pos), at: 0, lineAlpha: look.lineAlpha, yaw: yawNow };
  }
  /** The disc morphing into state `to`, begun `at` ago, lasting `span` ms. */
  function morphing(step: { disc: Term; yaw: number }, to: number, at: number, span = MORPH): Step {
    const term = stateFrom(step.disc, to, flowClock - at);
    return { kind: 'morph', disc: step.disc, to, term, delays: Float32Array.from(term.vid, (v) => morphAt[to][v]), at, span, yaw: step.yaw };
  }

  function drawDetour(step: Step) {
    let yaw: number;
    if (step.kind === 'gather') {
      transit(step.from, step.disc, step.delays, step.at / GATHER, GATHER);
      shown.lines = step.from.b ? none : linesNow(step.from.a);
      look.lineAlpha = step.lineAlpha * (1 - clamp01(step.at / LINES_GO));
      yaw = step.yaw;
    } else if (step.kind === 'disc') {
      hold(step.disc);
      look.lineAlpha = 0;
      yaw = step.yaw;
    } else if (step.kind === 'morph') {
      yaw = morphInto(step.disc, step.to, step, step.yaw, step.at / step.span, step.span);
    } else {
      hold(step.term);
      shown.lines = linesNow(step.term);
      look.lineAlpha = step.first ? 1 : linesIn(step.at, false);
      yaw = states[step.to].yaw;
    }
    paint(yaw);
    // The hovered item, active with only its label; else, morphing on into the loop, the item that state presents, its label fading in; else none, the label just left fading out.
    if (leaving && clock - leaving.at >= LABEL_FADE) leaving = null;
    const auto = !hovered && step.kind === 'morph';
    activate(hovered ? hovered.item : auto ? items[step.to] : null);
    for (const entry of labels) {
      let v = 0;
      if (hovered) v = entry === hovered ? 1 : 0;
      // Stopped, not hovering: all six, those shown staying, the others fading in.
      else if (halted) v = lit.includes(entry) ? 1 : fade(clock - litAt);
      else if (entry === leaving?.entry) v = 1 - fade(clock - leaving.at);
      else if (auto && entry.item === items[step.to]) v = fade(step.at);
      showLabel(entry, v);
    }
    player.onUpdate?.(time);
  }

  /** The detour's time goes on by `dt` (the flow's clock with it); each step hands what is left of it to the next, so every step lasts exactly its time. */
  function advance(dt: number) {
    clock += dt;
    let step = detour!;
    step.at += dt;
    for (;;) {
      // Gathered: the disc morphs at once into the hovered state, or into IDLE once stopped; with the pointer gone, it holds first.
      if (step.kind === 'gather' && step.at >= GATHER) {
        const over = step.at - GATHER;
        step = hovered || halted ? morphing(step, hovered ? poseOf(hovered) : next, over) : { kind: 'disc', disc: step.disc, at: over, yaw: step.yaw };
      } else if (step.kind === 'disc' && step.at >= LEAVE_DISC) step = morphing(step, next === shownPose ? (next + 1) % poses.length : next, step.at - LEAVE_DISC, LOOP_MORPH);
      else if (step.kind === 'morph' && step.at >= step.span && (hovered || halted)) step = { kind: 'still', to: step.to, term: step.term, at: step.at - step.span };
      else if (step.kind === 'morph' && step.at >= step.span) {
        // Formed: the loop goes on from here, at the start of this state's hold, flowing on.
        time = step.to * STEP + (step.at - step.span);
        turn = { j: step.to, hold: step.term, at: flowClock - (step.at - step.span) };
        start = 'loop';
        detour = null;
        return;
      } else if (step.kind === 'still' && resuming && !hovered && step.to === 0 && (step.first || step.at >= SETTLE + LINES_IN) && clock - litAt >= LABEL_FADE) {
        // IDLE formed, its lines and labels all in: the loop starts here, from the menu's own IDLE, flowing on.
        time = 0;
        turn = { j: 0, hold: step.term, at: flowClock };
        start = 'menu';
        halted = false;
        resuming = false;
        detour = null;
        return;
      } else if (step.kind === 'still' && step.keep && !hovered && !halted && !leaving) {
        // Its label gone: the loop's clock goes on where it stopped (past wherever the lines had come to, so they don't step back).
        time = Math.max(time, Math.min(step.at, SETTLE + LINES_IN));
        detour = null;
        return;
      } else break;
    }
    detour = step;
  }

  const render = () => (inspected ? drawInspected(inspected) : detour ? drawDetour(detour) : draw(time));

  let time = 0;
  /**
   * How the loop's first IDLE was come to: from the menu (its lines in, all
   * six labels to fade out), or round the loop (its lines to come in).
   */
  let start: 'menu' | 'loop' = 'menu';
  /** While paused (or with reduced motion), the item inspected, shown still. */
  let inspected: Entry | null = null;
  /**
   * While playing: the detour the hover started (none while the loop plays),
   * the item hovered, the state the loop goes on with after it, the label
   * just left (fading out from `at` on the detour's own clock) and that
   * clock.
   */
  let detour: Step | null = null;
  let hovered: Entry | null = null;
  let next = 0;
  let leaving: { entry: Entry; at: number } | null = null;
  /** The pose last shown in this detour (formed, or past halfway forming), which the loop then doesn't go straight back to; -1 for none. */
  let shownPose = -1;
  /** The cycling stopped (`halt`), and the labels then shown, staying while the others fade in from `litAt`. */
  let halted = false;
  let lit: Entry[] = [];
  let litAt = 0;
  /** The cycling on again, waiting for IDLE (`resume`). */
  let resuming = false;
  let clock = 0;
  /** Her life while still: its own time (ms, on the frames' clock, so it stops with a pause and slows with the speed), how much of it shows (0 … 1, easing in while a pose or the disc is held and out as soon as anything moves), and the canvas's width (px). */
  let life = 0;
  let alive = 0;
  let pxWidth = 0;
  let playing = false;
  let frame = 0;
  let last = 0;

  function tick(now: number) {
    // A frame's timestamp can be a little before play() was called: never a step back.
    const dt = Math.max(0, Math.min(now - last, MAX_STEP)) * player.rate;
    last = now;
    flowClock += dt;
    if (detour) advance(dt);
    else {
      time += dt;
      if (time >= duration) {
        time -= duration;
        start = 'loop';
      }
    }
    life += dt;
    // With the drift instead of the flow, it shows while a pose or the disc is held.
    const local = time % STEP;
    const held = !flowing && (detour ? detour.kind === 'still' || detour.kind === 'disc' : local < HOLD || (local >= HOLD + LOOP_GATHER && local < HOLD + LOOP_GATHER + LOOP_DISC));
    alive = +held + (alive - +held) * Math.exp(-dt / ALIVE_EASE);
    render();
    frame = requestAnimationFrame(tick);
  }

  const player: LoopScene = {
    enabled: true,
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
      playing = true;
      last = performance.now();
      // An item inspected while paused is hovered now that it plays.
      const entry = inspected;
      inspected = null;
      if (entry) hover(entry);
      else render();
      frame = requestAnimationFrame(tick);
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      player.onUpdate?.(time);
    },
    /** The loop's end is its start: IDLE, still, as the menu's (reduced motion shows it so). Any detour is dropped; the flow is as it would be played from the start. */
    seek(ms) {
      time = ms >= duration ? 0 : Math.max(0, ms);
      flowClock = time;
      turn = firstTurn();
      start = 'menu';
      inspected = null;
      detour = null;
      hovered = null;
      leaving = null;
      halted = false;
      resuming = false;
      alive = 0;
      draw(time);
    },
    halt() {
      resuming = false;
      if (halted) return;
      halted = true;
      next = 0;
      if (hovered) return;
      litFrom();
      detourTo(0);
      render();
    },
    resume() {
      if (halted) resuming = true;
    },
    replay() {
      player.pause();
      player.seek(0);
      player.play();
    },
  };

  /**
   * Hovering an item while it plays. From the loop: a state held gathers
   * into the disc, as the loop gathers it, and the hovered state forms out of
   * it (if it is the hovered state, it just stays, flowing on); in a
   * gathering, it goes on into the disc; in a morph, it goes on if it is
   * forming the hovered state, and otherwise gathers back into the disc from
   * where it is (coasting to a stop as it turns). In a detour gathering, the
   * hovered state forms out of the disc once it is gathered; from a detour
   * forming another state, that gathers back into the disc first. Either
   * way it never passes from one pose to another but through the disc.
   */
  function hover(entry: Entry) {
    if (hovered === entry) return;
    hovered = entry;
    leaving = null;
    detourTo(poseOf(entry));
    render();
  }

  /** The detour (hover, or the cycling stopped) heading for state `to`, by the rules above. */
  function detourTo(to: number) {
    const step = detour;
    if (!step) {
      // The loop stops here, and after the detour goes on with the state it was heading for (the next one, from a state held; IDLE once stopped).
      const j = Math.min(poses.length - 1, Math.floor(time / STEP));
      const k = (j + 1) % poses.length;
      const local = time - j * STEP;
      const first = j === 0 && start !== 'loop';
      next = halted ? 0 : k;
      shownPose = -1;
      turnTo(j);
      // (Whatever it is, it flows on as it was: the loop's own terms carry on into the detour.)
      if (local < HOLD && to === j) detour = { kind: 'still', to, term: turn.hold, at: local, first, keep: j === 0 };
      else if (local < HOLD) detour = gathering({ a: turn.hold }, gatherAt[j]);
      else if (local < HOLD + LOOP_GATHER) {
        // It goes on at the hover's pace from as far as it has come, its lines as faint as they are.
        const { disc, delays } = gatherOf(turn);
        const at = ((local - HOLD) / LOOP_GATHER) * GATHER;
        const lineAlpha = look.lineAlpha / Math.max(1e-6, 1 - clamp01(at / LINES_GO));
        detour = { kind: 'gather', from: { a: turn.hold }, disc, delays, at, lineAlpha, yaw: states[j].yaw };
      } else if (local < HOLD + LOOP_GATHER + LOOP_DISC) detour = morphing({ disc: gatherOf(turn).disc, yaw: states[j].yaw }, to, 0);
      else if (to === k) detour = { kind: 'morph', disc: gatherOf(turn).disc, to, ...morphOf(turn), at: ((local - HOLD - LOOP_GATHER - LOOP_DISC) / LOOP_MORPH) * MORPH, span: MORPH, yaw: states[j].yaw };
      else detour = gathering(current());
    } else if (step.kind === 'disc') detour = morphing(step, to, 0);
    else if ((step.kind === 'morph' || step.kind === 'still') && step.to !== to) detour = gathering(current());
  }

  /** Leaving it: what is formed of it gathers into the disc, which holds LEAVE_DISC before the state the loop goes on with (once stopped, it morphs at once into IDLE, where an IDLE already there just stays; the loop's own IDLE under an item no pose presents stays too, and the loop goes on); its label fades out. */
  function unhover(entry: Entry) {
    hovered = null;
    leaving = { entry, at: clock };
    if (halted) {
      litFrom();
      detourTo(0);
    } else if (detour?.kind === 'morph' || (detour?.kind === 'still' && !detour.keep)) {
      if (detour.kind === 'still' || detour.at >= detour.span / 2) shownPose = detour.to;
      detour = gathering(current());
    }
    render();
  }

  /** The labels shown now, which stay as the others fade in. */
  function litFrom() {
    lit = labels.filter((entry) => Number(entry.shown) >= 1);
    litAt = clock;
  }

  // The item's whole link (icon, gap and label) is inside it, so entering any of it counts. Touch keeps the loop as it is.
  for (const entry of labels) {
    entry.item.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch' || !player.enabled) return;
      if (playing) hover(entry);
      else {
        inspected = entry;
        render();
      }
    });
    entry.item.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch' || !player.enabled) return;
      if (inspected === entry) {
        // Paused: back to the still frame it was paused on.
        inspected = null;
        render();
      }
      if (hovered === entry) unhover(entry);
    });
  }

  new ResizeObserver(() => {
    if (!stage.resize()) return;
    pxWidth = canvas.getBoundingClientRect().width;
    if (player.enabled) render();
  }).observe(canvas);
  stage.resize();
  pxWidth = canvas.getBoundingClientRect().width;
  draw(0);
  return player;
}
