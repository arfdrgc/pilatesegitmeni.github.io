// First concepts for the three menu items that have no pose yet (owner,
// 2026-10-31), for review. Development preview only, at /dev/home-menu/ and
// /en/dev/home-menu/, frames #pose-7-prensip, #pose-contrology and
// #pose-bedenin-dili (./HomeIntroPreview.astro), played by ./particleScene.ts
// (the gathering into the disc, the morph, the hold). Only the Teaser goes
// further (owner, 2026-10-31): ./loopScene.ts takes composePrinciples, moves it
// whole to the ring's centre and has it present Bedenin Dili. The other two, and
// these frames on the ground line, stay in the preview.
// - Same figure, palette, dot sizes, spine accent and depth as every other
//   scene: only her pose and a mat are new. Her dots that don't stay her become
//   the mat, as the others' become their apparatus.
// - Seen at the figure's approved 70° (the other scenes are laid out at a pure
//   side view): her sagittal plane is pitched into place, then turned 70° from
//   the viewer, so the near and far limbs separate a little.
// - All three rest on the ring's ground line, her ground in the menu's IDLE, on
//   a thin mat, which is where these movements are done.
import { BONES, LAGS, pose, resolve, skin, type Dots, type Matrices, type Pose } from '../../components/dot-figure/model';
import { YAW } from '../../components/dot-figure/timeline';
import type { Scene } from '../../components/home-intro/scene';
import { BEGIN, createParticleScene, FOOT_TOP, jointAt, pointed, roundBox, type Composition, type Part } from './particleScene';

const RAD = Math.PI / 180;
const hash = (i: number) => ((i * 2654435761) >>> 0) / 2 ** 32;
const boneIndex = (id: string) => BONES.findIndex((b) => b.id === id);
const SHIN_L = boneIndex('shinL');
const SHIN_R = boneIndex('shinR');
const THIGH_R = boneIndex('thighR');

/** The mat on the ground line: its half-length, its thickness, how much denser than a plain part. */
const MAT = { half: 40, thick: 2.6, density: 2.6 };
const FLOOR = 0.5;
const matPart = (centre = 0, half = MAT.half): Part => ({
  sdf: roundBox(centre - half, FLOOR, centre + half, FLOOR + MAT.thick, MAT.thick / 2),
  box: [centre - half, FLOOR, centre + half, FLOOR + MAT.thick],
  half: MAT.thick / 2,
  depth: [-16, 16],
  tone: 0,
  level: 1,
  density: MAT.density,
});
/** Top of the mat, where she rests. */
const REST = FLOOR + MAT.thick - 0.4;

/** A share of her dots stays her in these scenes (they have no apparatus to fill, and she is larger): as many more than the others' 42% as her size asks for. */
const keepOf = (dots: Dots, share: number) => Uint8Array.from({ length: dots.count }, (_, i) => (hash(i) < share ? 1 : 0));

/**
 * Takes the figure's right leg (its shin and thigh) off the left's, which the
 * pelvis hangs from, by turning it about the hip: `forward` degrees towards her
 * front (the model's legs share their channels, so a split is made here, on the
 * matrices, and nothing in the model changes).
 */
function splitRightLeg(m: Matrices, forward: number): Matrices {
  const out = Float64Array.from(m);
  const hip = jointAt(m, 'pelvis');
  const [c, s] = [Math.cos(-forward * RAD), Math.sin(-forward * RAD)];
  for (const b of [SHIN_R, THIGH_R]) {
    const o = b * 12;
    for (let col = 0; col < 4; col++) {
      const [y, z] = [m[o + 4 + col], m[o + 8 + col]];
      const [py, pz] = col === 3 ? [hip[1], hip[2]] : [0, 0];
      out[o + 4 + col] = c * (y - py) - s * (z - pz) + py;
      out[o + 8 + col] = s * (y - py) + c * (z - pz) + pz;
    }
  }
  return out;
}

/** How she is laid out: `pitch` turns her sagittal plane (degrees, counter-clockwise as seen with her front to the right); `facing` is which way her front looks. */
interface View {
  pitch: number;
  facing: 1 | -1;
  scale: number;
  /** Where the hip's pivot goes before she is settled on the mat (x only matters; y is found from `rests`). */
  x: number;
}

/** Her own posed space onto the picture: pitched about the hip, turned 70° from the viewer, scaled. */
const viewOf = (hip: readonly number[], { pitch, facing, scale, x }: View) => {
  const [cp, sp] = [Math.cos(pitch * RAD), Math.sin(pitch * RAD)];
  const yaw = facing * YAW * RAD;
  const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)];
  return (p: ArrayLike<number>): [number, number, number] => {
    const [dy, dz] = [p[1] - hip[1], p[2] - hip[2]];
    const front = dz * cp - dy * sp;
    const up = dz * sp + dy * cp;
    return [x + scale * (p[0] * cy + front * sy), scale * up, scale * (-p[0] * sy + front * cy)];
  };
};

/** Lays a posed figure out: pointed feet from their own shins, `rests` choosing the dots that sit on the mat. */
function layOut(dots: Dots, m: Matrices, view: View, rests: (restY: number) => boolean) {
  const posed = new Float64Array(dots.count * 3);
  skin(dots, Array.from({ length: LAGS }, () => m), posed);
  const place = viewOf(jointAt(m, 'pelvis'), view);
  const person = new Float64Array(dots.count * 3);
  let low = Infinity;
  for (let i = 0; i < dots.count; i++) {
    const [x, y, z] = dots.rest.subarray(i * 3, i * 3 + 3);
    let at: ArrayLike<number> = posed.subarray(i * 3, i * 3 + 3);
    if (y < FOOT_TOP) {
      const [fx, fy, fz] = pointed(x, y, z);
      const o = (x < 0 ? SHIN_R : SHIN_L) * 12;
      at = [m[o] * fx + m[o + 1] * fy + m[o + 2] * fz + m[o + 3], m[o + 4] * fx + m[o + 5] * fy + m[o + 6] * fz + m[o + 7], m[o + 8] * fx + m[o + 9] * fy + m[o + 10] * fz + m[o + 11]];
    }
    const p = place(at);
    person.set(p, i * 3);
    if (rests(y)) low = Math.min(low, p[1]);
  }
  const lift = REST - low;
  for (let i = 0; i < dots.count; i++) person[i * 3 + 1] = Math.max(person[i * 3 + 1] + lift, REST);
  return { person, place: (p: ArrayLike<number>) => { const q = place(p); return [q[0], q[1] + lift, q[2]]; } };
}

// ---------- 7 Prensip: the Teaser ----------

/**
 * Balanced on the sit bones, a V held from the centre: long legs rising one way,
 * a long lifted trunk the other, the arms reaching parallel to the legs. Control,
 * centring, precision and breath in one held shape, its whole weight on a point at
 * the ring's vertical axis. The trunk's curve is slight: lifted, not slumped.
 */
const TEASER: Pose = { pelvis: 96, L5: 1.5, L4: 1.5, L3: 1.5, L2: 1, L1: 1, T12: 0.5, T10: 0.5, C7: 1, C4: 1, head: 6, shoulder: -3, elbow: 8 };
const TEASER_VIEW: View = { pitch: 138, facing: 1, scale: 0.86, x: 0 };

export function composePrinciples(dots: Dots): Composition {
  const m = pose(resolve(TEASER));
  // Her seat on the mat; the axis through the point she balances on.
  const { person } = layOut(dots, m, TEASER_VIEW, (y) => y > 76 && y < 98);
  return { person, keep: keepOf(dots, 0.56), parts: [matPart()] };
}

// ---------- Contrology: the Control Balance ----------

/**
 * Inverted on the shoulders, the trunk and one leg in one vertical line above
 * them, the other leg lowered over her head, the hands holding it: strength and
 * control held against each other, deliberate and exact. A classical mat exercise
 * (the Control Balance), so it is Contrology's own vocabulary, not a fitness pose.
 * The lowered leg reaches towards the item's side of the ring.
 */
const LOWERED = 124;
/** The arms: found by search, the shoulder and elbow that bring the hands to the lowered leg's ankle (within 0.4 units). */
const INVERTED: Pose = { pelvis: 4, L3: 0.5, L1: 0.5, T12: 0.5, T10: 1, T8: 1.5, T6: 2, T4: 4, T2: 8, C7: 24, C4: 26, head: 22, shoulder: -56, elbow: -44 };
const INVERTED_VIEW: View = { pitch: 184, facing: 1, scale: 0.72, x: 12 };

export function composeContrology(dots: Dots): Composition {
  const m = splitRightLeg(pose(resolve(INVERTED)), LOWERED);
  // Her shoulders and the back of her head on the mat.
  const { person } = layOut(dots, m, INVERTED_VIEW, (y) => y > 126);
  return { person, keep: keepOf(dots, 0.52), parts: [matPart(-8)] };
}

// ---------- Bedenin Dili: the kneeling arc ----------

/**
 * Kneeling, the hips pressed forward and the whole front of the body opening
 * into one long arc from the knees through the spine to the raised hand, which
 * carries the line on towards the item at half past 1; the other arm reaches the
 * opposite way, low and forward, to balance it. A gesture more than an exercise:
 * the spine's accent draws the arc, so what the body says is the line itself.
 */
const KNEEL_THIGH = -76;
const KNEEL_PITCH = KNEEL_THIGH - 14;
/** An arm's direction as seen in her sagittal plane (0 forward, 90 up, 180 back) as a `shoulder` angle. */
const arm = (direction: number) => -(direction + 90 - KNEEL_PITCH);
const NEAR_ARM = arm(122);
const FAR_ARM = arm(-6);
const ARC: Pose = {
  thigh: KNEEL_THIGH,
  pelvis: -3,
  L5: -3,
  L4: -3,
  L3: -3.5,
  L2: -3.5,
  L1: -3.5,
  T12: -3.5,
  T10: -4,
  T8: -4,
  T6: -3.5,
  T4: -3,
  T2: -2,
  C7: -2,
  C4: -2,
  head: -3,
  shoulder: NEAR_ARM,
  elbow: 8,
  shoulderR: FAR_ARM - NEAR_ARM,
};
const ARC_VIEW: View = { pitch: KNEEL_PITCH, facing: -1, scale: 0.76, x: 4 };

export function composeBodyLanguage(dots: Dots): Composition {
  const m = pose(resolve(ARC));
  // Her shins and feet on the mat.
  const { person } = layOut(dots, m, ARC_VIEW, (y) => y < 44);
  return { person, keep: keepOf(dots, 0.6), parts: [matPart(12)] };
}

// ---------- The frames ----------

const sceneOf = (compose: (dots: Dots) => Composition, hour: number) => (root: HTMLElement): Scene => {
  const item = root.querySelector<HTMLElement>(`.ring-menu__item[data-hour='${hour}']`);
  return createParticleScene(root, compose, (t) => item?.toggleAttribute('data-active', t >= BEGIN));
};

export const createPrinciplesScene = sceneOf(composePrinciples, 7.5);
export const createContrologyScene = sceneOf(composeContrology, 9);
export const createBodyLanguageScene = sceneOf(composeBodyLanguage, 1.5);
