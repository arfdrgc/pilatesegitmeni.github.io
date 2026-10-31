// The Contrology pose (09:00): over the Ladder Barrel. Played in the loop and on
// hovering the item (./loopScene.ts). Two photos (owner, 2026-10-31, kept in
// ../reference_assets/): ladder_barrel_movement_reference.jpg for her movement,
// ladder_barrel_apparatus_reference.jpg, the primary one, for the apparatus and
// how a body lies on it. Its measures, at 2.08 px a model unit (the whole body
// along its bends, a single limb being foreshortened), are BARREL, RAILS,
// BRACKET and LADDER below.
// - The Ladder Barrel: the barrel's broad end towards us, a solid panel with a
//   semicircular top, straight sides and a flat foot; its pad round the crown; a
//   plinth to the left; to the right the two rails and the two curved brackets
//   carrying the ladder, posts and rungs. All one piece, on the floor.
// - She is seen from the side, head to the left, front down. Her pelvis and upper
//   thigh lie on the crown, her trunk wraps round the pad and overhangs its left
//   side, the head hangs towards the floor between the barrel and her arms, and
//   both arms go down to the floor, apart. The legs split from the hips, straight:
//   the near one up, the far one to the ladder, the foot at a rung.
import { BONES, LAGS, pose, resolve, skin, type Dots, type Matrices } from '../../components/dot-figure/model';
import { boxOf, capsule, CENTRE, FOOT_TOP, pointed, RADIUS, type Composition, type Part } from './particleScene';

const RAD = Math.PI / 180;
const hash = (i: number) => ((i * 2654435761) >>> 0) / 2 ** 32;
const boneIndex = (id: string) => BONES.findIndex((b) => b.id === id);
const LEG_L = [boneIndex('shinL'), boneIndex('thighL')];
const LEG_R = [boneIndex('shinR'), boneIndex('thighR')];
const SHIN_L = boneIndex('shinL');
const SHIN_R = boneIndex('shinR');

/** Her size in the scene (model units per unit of her own). */
const SCALE = 0.7;
/** How far her dots lie across the view (of her own): less than her size, so the far arm and leg stay strong enough to read. */
const DEPTH = 0.45;
/** How far her top reaches up the ring, as a share of its radius: no item stands at 12:00, so she may go near it. */
const TOP = 0.93;
/** Her legs and hips (rest heights) keep this share of their dots, over the others' 42%: seen from the side they are thin, and they are what the pose says. The rest go to the apparatus. */
const SOLID = [38, 100];
const KEEP = 0.42;
/** Her head and neck (rest height up from here) keep every dot: hanging by her arms, the head must read on its own. */
const HEAD = 146;

/** Her hips (rest space), where the legs turn. */
const HIP = { y: 88, z: 0 };
/** Her hips in her own units of the floor: x 0 is the barrel's axis, y up from the floor. */
const HIP_AT = { x: -15, y: 100 };

/**
 * Her pose in her own space, where (seen from the side, as placed below) her rest
 * "up" is the scene's left and her front the scene's down, and a positive angle
 * turns anticlockwise: the pelvis tipping over the crown; the back rounding on to
 * straight down beside the barrel; the neck and head tucking on towards it; the
 * arms measured from hanging (to the right in the scene), turned past straight
 * down, the far one less than the near one, so that they part and the head stays
 * clear of both; the far hand bends to lie on the floor (it reaches further).
 */
const FOLD = resolve({
  pelvis: 33,
  L5: 3,
  L4: 3,
  L3: 4,
  L2: 4,
  L1: 5,
  T12: 5,
  T10: 6,
  T8: 6,
  T6: 6,
  T4: 6,
  T2: 6,
  C7: 12,
  C4: 13,
  head: 15,
  shoulder: -117,
  elbow: 3,
  wrist: 14,
  shoulderR: 8,
  elbowR: 9,
  wristR: 36,
});

/** The legs, from her rest line (hanging: to the right in the scene), turned anticlockwise: the near one straight up, the far one just below level to the ladder. */
const LEG_UP = 90;
const LEG_LEVEL = -10;

/** How deep the panel and the pad lie, each its own: `flowPart` tells their dots by it, so that each flows round its own arch and they keep apart. */
const PANEL: [number, number] = [0, 1];
const PAD: [number, number] = [3, 4];

/** The Ladder Barrel in her own units: x 0 the barrel's axis, y up from the floor. */
const BARREL = { half: 28, top: 90, padHalf: 31.5, padTop: 95, padTo: 58 };
const PLINTH = { x0: -41, height: 7.7 };
const RAILS = { low: [1.5, 5.5], rear: [17.5, 21.5] };
const LADDER = { rearX: 70, frontX: 88, top: 108, slant: 3, rungs: [100, 83, 66, 49], knob: 93 };
/** The ladder's feet, traced from the photo: the near bracket, solid on the floor, sweeping up to its post; the far one above the rear rail. */
const BRACKET: [number, number][] = [
  [53.4, 0],
  [53.4, 5],
  [55, 7.5],
  [59.7, 10.6],
  [72.7, 12.5],
  [78.9, 17.3],
  [80.8, 27],
  [84.7, 36.5],
  [90.5, 38],
  [90.5, 0],
];
const BRACKET_REAR: [number, number][] = [
  [49, 18],
  [49, 22],
  [52, 25],
  [64.9, 28.4],
  [68.6, 34.6],
  [69, 41],
  [72, 48.6],
  [72, 18],
];

/** Each leg straight from its hip, turned about the hips' line (the model's legs share their channels and hang from the ground, not the pelvis). */
function legsOut(m: Matrices): Matrices {
  const out = Float64Array.from(m);
  const set = (bones: number[], angle: number) => {
    const [c, s] = [Math.cos(angle * RAD), Math.sin(angle * RAD)];
    // Rx(angle) about the line through (y, z) = HIP: +y turns towards +z.
    const row = [1, 0, 0, 0, 0, c, -s, HIP.y - (c * HIP.y - s * HIP.z), 0, s, c, HIP.z - (s * HIP.y + c * HIP.z)];
    for (const b of bones) out.set(row, b * 12);
  };
  set(LEG_L, LEG_UP);
  set(LEG_R, LEG_LEVEL);
  return out;
}

/** An arch standing on its foot: its top a half circle. Signed distance, negative inside. */
const arch = (cx: number, half: number, foot: number, top: number) => {
  const spring = top - half;
  return (x: number, y: number) => (y > spring ? Math.hypot(x - cx, y - spring) - half : Math.max(Math.abs(x - cx) - half, foot - y));
};

/** A closed outline. Signed distance, negative inside. */
const outline = (points: [number, number][]) => (x: number, y: number) => {
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

/** The flow's part of an apparatus dot at this depth: the panel, the pad, or none (the rest stays as the loop parts it). */
export const flowPart = (depth: number) => (depth >= PAD[0] ? 201 : depth >= PANEL[0] ? 200 : null);

export function compose(dots: Dots): Composition {
  const m = legsOut(pose(FOLD));
  const posed = new Float64Array(dots.count * 3);
  skin(dots, Array.from({ length: LAGS }, () => m), posed);

  // Her own space onto the floor's: rest up is left, her front is down; her left (+x) towards us.
  const own = new Float64Array(dots.count * 3);
  const flat = (y: number, z: number) => [HIP_AT.x - (y - HIP.y), HIP_AT.y - (z - HIP.z)];
  for (let i = 0; i < dots.count; i++) {
    const [x, y, z] = dots.rest.subarray(i * 3, i * 3 + 3);
    let p: ArrayLike<number> = posed.subarray(i * 3, i * 3 + 3);
    // The feet, pointed down the legs' line.
    if (y < FOOT_TOP) {
      const [fx, fy, fz] = pointed(x, y, z);
      const o = (x < 0 ? SHIN_R : SHIN_L) * 12;
      p = [fx, m[o + 4] * fx + m[o + 5] * fy + m[o + 6] * fz + m[o + 7], m[o + 8] * fx + m[o + 9] * fy + m[o + 10] * fz + m[o + 11]];
    }
    const [sx, sy] = flat(p[1], p[2]);
    own.set([sx, sy, p[0]], i * 3);
  }

  // The composition's place: centred across on its own width, its top at TOP of the ring's radius above the centre.
  let [x0, x1, y1] = [BRACKET[8][0], BRACKET[8][0], LADDER.top];
  for (let i = 0; i < dots.count; i++) {
    x0 = Math.min(x0, own[i * 3]);
    x1 = Math.max(x1, own[i * 3]);
    y1 = Math.max(y1, own[i * 3 + 1]);
  }
  const [ox, floorY] = [(x0 + x1) / 2, CENTRE.y + TOP * RADIUS - SCALE * y1];
  const X = (x: number) => CENTRE.x + SCALE * (x - ox);
  const Y = (y: number) => floorY + SCALE * y;

  const person = new Float64Array(dots.count * 3);
  for (let i = 0; i < dots.count; i++) person.set([X(own[i * 3]), Y(own[i * 3 + 1]), DEPTH * own[i * 3 + 2]], i * 3);

  const bar = (ax: number, ay: number, bx: number, by: number, r: number, depth: [number, number], tone: number, density: number, level = 1): Part => ({
    sdf: capsule(X(ax), Y(ay), X(bx), Y(by), SCALE * r),
    box: boxOf(X(ax), Y(ay), X(bx), Y(by), SCALE * r),
    half: SCALE * r,
    depth,
    tone,
    level,
    density,
  });
  const shape = (points: [number, number][], depth: [number, number], tone: number, density: number, level: number): Part => {
    const placed = points.map(([x, y]): [number, number] => [X(x), Y(y)]);
    const [xs, ys] = [placed.map((p) => p[0]), placed.map((p) => p[1])];
    return { sdf: outline(placed), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], half: 2, depth, tone, level, density };
  };
  const { half, top, padHalf, padTop, padTo } = BARREL;
  const face = arch(X(0), SCALE * half, Y(0), Y(top));
  const pad = arch(X(0), SCALE * padHalf, Y(padTo), Y(padTop));
  const parts: Part[] = [
    // The floor, a fine line from under her hands to the plinth: what her hands reach.
    bar(x0 - 5, 0, PLINTH.x0, 0, 0.7, [-2, -1], 0, 1.4),
    // The barrel's front panel: broad and solid, its dots large and close, its straight sides and foot drawn firmer.
    { sdf: face, box: [X(-half), Y(0), X(half), Y(top)], half: 1.5, depth: PANEL, tone: 3, level: 2, density: 0.46 },
    bar(-half, top - half, -half, 0.8, 0.9, PANEL, 3, 1.5, 2),
    bar(half, top - half, half, 0.8, 0.9, PANEL, 3, 1.5, 2),
    bar(-half, 0.8, half, 0.8, 0.9, PANEL, 3, 1.5, 2),
    // The pad round the crown (warmer, as the Reformer's carriage).
    { sdf: (x, y) => Math.max(pad(x, y), -face(x, y)), box: [X(-padHalf), Y(padTo), X(padHalf), Y(padTop)], half: 2, depth: PAD, tone: 0, level: 1, density: 2 },
    // The plinth to the left, the two rails to the right.
    { sdf: (x, y) => Math.max(X(PLINTH.x0) - x, x - X(-half), Y(0) - y, y - Y(PLINTH.height)), box: [X(PLINTH.x0), Y(0), X(-half), Y(PLINTH.height)], half: 2, depth: [-2, -1], tone: 3, level: 2, density: 1.1 },
    bar(half, (RAILS.low[0] + RAILS.low[1]) / 2, BRACKET[0][0] + 1, (RAILS.low[0] + RAILS.low[1]) / 2, 2, [-2, -1], 3, 1.7, 2),
    bar(half, (RAILS.rear[0] + RAILS.rear[1]) / 2, LADDER.rearX, (RAILS.rear[0] + RAILS.rear[1]) / 2, 2, [-6, -5], 1, 1.4, 2),
    // The ladder's feet.
    shape(BRACKET, [-2, -1], 3, 0.8, 2),
    shape(BRACKET_REAR, [-6, -5], 1, 0.35, 1),
    // The ladder: its posts, its rungs slanting from the far one to the near one, the top one running on to its knob.
    bar(LADDER.frontX, BRACKET[8][1] - 1, LADDER.frontX, LADDER.top - LADDER.slant, 2.1, [-2, -1], 3, 0.9, 2),
    bar(LADDER.rearX, BRACKET_REAR[6][1] - 1, LADDER.rearX, LADDER.top, 2, [-6, -5], 1, 0.8, 1),
    bar(LADDER.rearX, LADDER.top, LADDER.knob, LADDER.top - LADDER.slant - 1, 1.3, [-2, -1], 3, 2, 2),
    ...LADDER.rungs.map((y) => bar(LADDER.rearX + 2, y, LADDER.frontX - 2, y - LADDER.slant, 1.2, [-5.5, -5], 6, 4, 2)),
  ];
  return { person, keep: Uint8Array.from({ length: dots.count }, (_, i) => (dots.rest[i * 3 + 1] >= HEAD || (hash(i) < KEEP && dots.rest[i * 3 + 1] > SOLID[0] && dots.rest[i * 3 + 1] < SOLID[1]) ? 1 : 0)), parts };
}
