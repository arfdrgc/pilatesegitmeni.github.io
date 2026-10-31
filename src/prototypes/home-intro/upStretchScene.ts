// The 7 Prensip pose (07:30), approved by the owner on 2026-10-31: the Reformer
// Up Stretch, Round Back, in a three-quarter view. Played in the loop and on
// hovering the item (./loopScene.ts); also, for review, dev only, at
// /dev/home-menu/#pose-up-stretch (./HomeIntroPreview.astro) and on the board
// /dev/up-stretch-concept/ (./UpStretchConcept.astro).
// - The Reformer and her body are laid out together in one 3D space (x across,
//   her left; y up from the carriage's top; z along the Reformer, towards the
//   footbar), then turned as one by a single camera: VIEW degrees round, TILT
//   degrees down. The picture is still orthographic, as every other scene is,
//   and depth reaches the renderer as its usual fade and shrink.
// - Her feet on the carriage, heels raised against the shoulder rests; legs
//   straight; hips the highest point; the back one rounded curve; the head
//   following it down between the arms; both arms straight to the footbar.
// - The footbar is placed from her hands, so hands and bar always meet.
import { LAGS, pose, resolve, skin, type Dots } from '../../components/dot-figure/model';
import type { Scene } from '../../components/home-intro/scene';
import { BEGIN, boxOf, capsule, CENTRE, createParticleScene, FOOT_TOP, GRIP, jointAt, type Composition, type Part } from './particleScene';

const RAD = Math.PI / 180;
const hash = (i: number) => ((i * 2654435761) >>> 0) / 2 ** 32;

/**
 * A version of the concept. `scale`: model units of the menu's framing per unit of
 * her own. `depth`: the depth the renderer gets, per unit of her own scaled by it.
 * `back`: where the frame ends behind her. `density`: all the Reformer's dot shares
 * together. `cuts`: pieces of the near and far rail. `rear`: the far rail's and rear
 * crossbar's own share, for an end that lies far off and pale.
 */
export interface Layout {
  scale: number;
  depth: number;
  back: number;
  density: number;
  cuts: readonly [near: number, far: number];
  rear: number;
}
/** The first concept, kept for comparison (the review board's "before"). */
export const BEFORE: Layout = { scale: 0.78, depth: 0.7, back: -52, density: 1, cuts: [8, 6], rear: 1 };
/**
 * The revision (owner, 2026-10-31): the frame longer behind the carriage, then the
 * whole composition at 70%. Every dot's depth stays what it was, so the fade reads
 * the same; the Reformer's shares rise as 1/0.7², so the same number of dots lies
 * on the smaller parts instead of many sharing a place.
 */
export const AFTER: Layout = { scale: 0.78 * 0.7, depth: 0.7 / 0.7, back: -110, density: 1 / (0.7 * 0.7), cuts: [11, 8], rear: 1.8 };

/** The camera: 0 is a pure side view with her front to the left, 90 her front towards us; and how far it looks down. */
const VIEW = 45;
const TILT = 20;

/** The legs' lean forward from the ankles. */
const LEAN = 16;
/** Heels raised: each foot's turn about the ball, toes flat on the carriage. */
const HEEL_RISE = 26;
const BALL = 12;
/** The feet apart at the ankle beyond the rest stance, so the heels meet the rests; the legs fan to it from the hips. */
const STANCE = 6;

/**
 * Her pose in her own space, the feet planted. `pelvis` hinges her over the legs;
 * L5 to T2 draw the even curve of the back (the round back itself); the neck and
 * head carry it on, so the head hangs. `shoulder` is measured from hanging straight
 * down in the world, whatever the trunk does; `elbow` takes the rest bend out.
 */
const ROUND_BACK = resolve({
  shin: LEAN,
  pelvis: 66,
  L5: 5.5,
  L4: 5.5,
  L3: 5.5,
  L2: 5.5,
  L1: 5.5,
  T12: 5.5,
  T10: 5.5,
  T8: 5.5,
  T6: 5.5,
  T4: 5,
  T2: 4,
  C7: 10,
  C4: 10,
  head: 12,
  shoulder: [-32, 6, 0],
  elbow: 8,
  wrist: -6,
});

/** The Reformer, in her own units; the footbar's place comes from her hands. */
const CARRIAGE = { half: 27, z0: -22, z1: 60, thick: 7 };
const RAILS = { x: 32, half: 2.6, y0: -20, y1: -11, overFootbar: 16 };
const FLOOR_Y = -29;
const REST = { x: 13.6, half: 4.4, z0: -9, z1: -3, top: 13 };
const FOOTBAR = { half: 31, r: 2.1 };

/** The Reformer's pieces, for the loop's flow: each has its own rings, so that a rail stays a rail and no ring crosses from one piece into the next. */
const FLOW = { farRail: 100, nearRail: 101, frontBar: 102, rearBar: 103, top: 104, sides: 105, edges: 106, rests: 107, footbar: 108 };
type FlowingPart = Part & { flow: number };

type V3 = readonly [x: number, y: number, z: number];

/** A closed outline in the picture. Signed distance, negative inside. */
const outline = (points: readonly (readonly [number, number])[]) => (x: number, y: number) => {
  let [near, inside] = [Infinity, false];
  points.forEach(([ax, ay], k) => {
    const [bx, by] = points[(k + 1) % points.length];
    const [dx, dy] = [bx - ax, by - ay];
    const u = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    near = Math.min(near, Math.hypot(x - ax - u * dx, y - ay - u * dy));
    if (ay > y !== by > y && x < ax + ((y - ay) * dx) / dy) inside = !inside;
  });
  return inside ? -near : near;
};

/** The dots she keeps in a scene, as ./particleScene.ts chooses them; the review board shows her and the Reformer apart with this. */
export const staysHers = (dots: Dots, keep: Uint8Array | undefined, i: number) => {
  const [x, y] = [dots.rest[i * 3], dots.rest[i * 3 + 1]];
  return Boolean(dots.spine[i] || (Math.abs(x) > 18.5 && y > 62 && y < 136) || y < 40 || keep?.[i] || hash(i) < 0.42);
};

/** The flow's part of an apparatus dot, from its place and depth: the piece it was sampled on (of those at its depth, the one it lies deepest in). */
export function flowPart(parts: readonly FlowingPart[], x: number, y: number, depth: number) {
  let [best, flow] = [Infinity, FLOW.nearRail];
  for (const part of parts) {
    if (depth < part.depth[0] || depth > part.depth[1]) continue;
    const d = part.sdf(x, y);
    if (d < best) [best, flow] = [d, part.flow];
  }
  return flow;
}

export function compose(dots: Dots, layout: Layout = AFTER): Composition & { parts: FlowingPart[] } {
  const { scale: SCALE, depth: DEPTH } = layout;
  const m = pose(ROUND_BACK);
  const posed = new Float64Array(dots.count * 3);
  skin(dots, Array.from({ length: LAGS }, () => m), posed);

  // Each foot turned about its ball; the body carried on from where that takes the ankle.
  const [ch, sh] = [Math.cos(HEEL_RISE * RAD), Math.sin(HEEL_RISE * RAD)];
  const foot = (y: number, z: number): [number, number] => {
    if (z >= BALL) return [y, z];
    const dz = z - BALL;
    return [y * ch - dz * sh, dz * ch + y * sh + BALL];
  };
  const [ankleY, ankleZ] = foot(8.5, -0.6);
  const lift = { y: ankleY - 8.5, z: ankleZ + 0.6 };
  const world = (p: ArrayLike<number>): V3 => [p[0], p[1] + lift.y, p[2] + lift.z];

  const own = new Float64Array(dots.count * 3);
  for (let i = 0; i < dots.count; i++) {
    const [x, y, z] = dots.rest.subarray(i * 3, i * 3 + 3);
    if (y < FOOT_TOP + 1.5) {
      const [fy, fz] = foot(y, z);
      own.set([x + Math.sign(x) * STANCE, fy + 0.4, fz], i * 3);
    } else {
      own.set(world(posed.subarray(i * 3, i * 3 + 3)), i * 3);
      if (y < 88 && Math.abs(x) < 18.5) own[i * 3] += Math.sign(x) * STANCE * Math.min(1, (88 - y) / 79.5);
    }
  }

  // The footbar under her hands.
  const hand = world(jointAt(m, 'handL', GRIP));
  const bar = { y: hand[1] - FOOTBAR.r - 0.6, z: hand[2] };
  const rails = { ...RAILS, back: layout.back, front: bar.z + RAILS.overFootbar };

  // The camera.
  const [cv, sv, ct, st] = [Math.cos(VIEW * RAD), Math.sin(VIEW * RAD), Math.cos(TILT * RAD), Math.sin(TILT * RAD)];
  const raw = ([x, y, z]: V3): V3 => {
    const near = x * cv + z * sv;
    return [x * sv - z * cv, y * ct - near * st, near * ct + y * st];
  };

  // The whole composition's box, her and the Reformer, centred on the ring.
  const corners: V3[] = [];
  for (const x of [-rails.x, rails.x]) for (const y of [FLOOR_Y, bar.y]) for (const z of [rails.back, rails.front]) corners.push([x, y, z]);
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  const grow = ([a, b]: V3) => {
    [x0, x1, y0, y1] = [Math.min(x0, a), Math.max(x1, a), Math.min(y0, b), Math.max(y1, b)];
  };
  corners.forEach((p) => grow(raw(p)));
  for (let i = 0; i < dots.count; i++) grow(raw([own[i * 3], own[i * 3 + 1], own[i * 3 + 2]]));
  const [ox, oy] = [CENTRE.x - (SCALE * (x0 + x1)) / 2, CENTRE.y - (SCALE * (y0 + y1)) / 2];
  const place = (p: V3): V3 => {
    const [a, b, c] = raw(p);
    return [ox + SCALE * a, oy + SCALE * b, DEPTH * SCALE * c];
  };

  const person = new Float64Array(dots.count * 3);
  for (let i = 0; i < dots.count; i++) person.set(place([own[i * 3], own[i * 3 + 1], own[i * 3 + 2]]), i * 3);

  // Parts follow depth by being cut into pieces: a part has one depth range, so a long one gets several.
  const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const parts: FlowingPart[] = [];
  let flow = FLOW.nearRail;
  const rod = (a: V3, b: V3, r: number, cuts: number, tone: number, level: number, density: number) => {
    for (let n = 0; n < cuts; n++) {
      const [p, q] = [place(mix(a, b, n / cuts)), place(mix(a, b, (n + 1) / cuts))];
      const R = SCALE * r;
      parts.push({ sdf: capsule(p[0], p[1], q[0], q[1], R), box: boxOf(p[0], p[1], q[0], q[1], R), half: R, depth: [Math.min(p[2], q[2]), Math.max(p[2], q[2]) + 0.01], tone, level, density: density * layout.density, flow });
    }
  };
  /** A flat face a-b-c-d, cut along a→b. */
  const face = (a: V3, b: V3, c: V3, d: V3, cuts: number, tone: number, level: number, density: number, half = 3) => {
    for (let n = 0; n < cuts; n++) {
      const corner = [mix(a, b, n / cuts), mix(a, b, (n + 1) / cuts), mix(d, c, (n + 1) / cuts), mix(d, c, n / cuts)].map(place);
      const flat = corner.map(([x, y]) => [x, y] as const);
      const [xs, ys, ks] = [corner.map((p) => p[0]), corner.map((p) => p[1]), corner.map((p) => p[2])];
      parts.push({ sdf: outline(flat), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], half, depth: [Math.min(...ks), Math.max(...ks) + 0.01], tone, level, density: density * layout.density, flow });
    }
  };

  // The frame: the two long rails, the crossbars at their ends, short feet. The far rail first, behind everything.
  const { x: rx, y0: ry0, y1: ry1, back, front } = rails;
  const railY = (ry0 + ry1) / 2;
  flow = FLOW.farRail;
  rod([-rx, railY, back], [-rx, railY, front], 2.6, layout.cuts[1], 1, 1, 0.35 * layout.rear);
  flow = FLOW.nearRail;
  rod([rx, railY, back], [rx, railY, front], 3, layout.cuts[0], 0, 2, 0.75);
  flow = FLOW.frontBar;
  rod([-rx, railY, front], [rx, railY, front], 2.8, 3, 0, 2, 0.8);
  flow = FLOW.rearBar;
  rod([-rx, railY, back], [rx, railY, back], 2.4, 3, 1, 1, 0.4 * layout.rear);
  flow = FLOW.nearRail;
  // Two feet on the near side only: the far front one would run into the 7:30 icon on phones.
  for (const [x, z] of [[rx, front - 7], [rx, back + 7]] as const) rod([x, ry0, z], [x, FLOOR_Y, z], 2.2, 1, 0, 1, 0.6);

  // The carriage: its top and its two faces towards us, warmer than the frame, as on the Hundred's Reformer; its edges firmer.
  const { half: ch2, z0: cz0, z1: cz1, thick } = CARRIAGE;
  flow = FLOW.top;
  face([-ch2, 0, cz0], [-ch2, 0, cz1], [ch2, 0, cz1], [ch2, 0, cz0], 5, 4, 2, 0.47);
  flow = FLOW.sides;
  face([ch2, 0, cz0], [ch2, 0, cz1], [ch2, -thick, cz1], [ch2, -thick, cz0], 5, 3, 2, 0.75, 1.5);
  face([-ch2, 0, cz1], [ch2, 0, cz1], [ch2, -thick, cz1], [-ch2, -thick, cz1], 3, 3, 2, 0.75, 1.5);
  flow = FLOW.edges;
  rod([ch2, 0, cz0], [ch2, 0, cz1], 1, 5, 5, 1, 1);
  rod([-ch2, 0, cz1], [ch2, 0, cz1], 1, 3, 5, 1, 1);
  rod([-ch2, 0, cz0], [-ch2, 0, cz1], 0.9, 5, 4, 1, 0.8);
  rod([-ch2, 0, cz0], [ch2, 0, cz0], 0.9, 3, 4, 1, 0.8);

  // The shoulder rests behind her heels.
  flow = FLOW.rests;
  for (const x of [-REST.x, REST.x]) {
    const { half, z0, z1, top } = REST;
    face([x - half, top, z0], [x - half, top, z1], [x + half, top, z1], [x + half, top, z0], 1, 5, 1, 1.5, 1.5);
    face([x + half, top, z0], [x + half, top, z1], [x + half, 0, z1], [x + half, 0, z0], 1, 4, 1, 1.5, 1.5);
    face([x - half, top, z1], [x + half, top, z1], [x + half, 0, z1], [x - half, 0, z1], 1, 4, 1, 1.5, 1.5);
  }

  // The footbar: its two uprights, leaning in from the frame, and the bar her hands hold.
  flow = FLOW.footbar;
  for (const x of [-FOOTBAR.half, FOOTBAR.half]) rod([x, ry1, bar.z + 9], [x, bar.y, bar.z], 1.5, 2, x < 0 ? 1 : 0, 1, 0.7);
  rod([-FOOTBAR.half, bar.y, bar.z], [FOOTBAR.half, bar.y, bar.z], FOOTBAR.r, 4, 1, 2, 1.2);

  // Most of her head and neck stay hers, so the head reads between the arms without weighing like a solid mass.
  const keep = Uint8Array.from({ length: dots.count }, (_, i) => (dots.rest[i * 3 + 1] >= 146 && hash(i) < 0.75 ? 1 : 0));
  return { person, keep, parts };
}

export function createUpStretchScene(root: HTMLElement): Scene {
  const item = root.querySelector<HTMLElement>(".ring-menu__item[data-hour='7.5']");
  // The review board asks for the first concept with ?upStretch=before.
  const layout = new URLSearchParams(location.search).get('upStretch') === 'before' ? BEFORE : AFTER;
  return createParticleScene(root, (dots) => compose(dots, layout), (t) => item?.toggleAttribute('data-active', t >= BEGIN));
}
