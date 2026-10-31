// The İlham / Inspiration scene (04:30): the Pilates Chair and the Swan
// (owner, 2026-10-30). Development preview only, at /dev/home-menu/#swan and
// /en/dev/home-menu/#swan (./HomeIntroPreview.astro), on the menu's idle
// frame, played by ./particleScene.ts (the gathering into the disc, the
// morph, the hold), and in the loop (./loopScene.ts).
// - The Chair in side view, inside the ring (clear of the items on it): a
//   box on a base board, its padded seat on top; at its front (the right)
//   the pedal, hinged at the foot of the box and reaching out to her hands,
//   low enough for her straight arms, held up by its spring from the box's
//   front.
// - The Swan as in the owner's reference: her hips over the seat's front
//   edge, the legs straight up above them, leaning a little towards the
//   item at 10:30, the feet pointed; the spine extending evenly from the
//   hips down through the upper back, so the body draws one long, controlled
//   arc; the head reaching on along it towards the item at 04:30 (down and
//   to the right, never up); the arms straight down to the pedal, the hands
//   on it (owner's review, 2026-10-30: the head kept exactly where it was,
//   the knees and elbows straight, the legs towards 10:30, the pedal lower).
// - The İlham item is active (its icon as on hover) from the gathering on,
//   through the hold.
import { LAGS, pose, resolve, skin, type Dots } from '../../components/dot-figure/model';
import type { Scene } from '../../components/home-intro/scene';
import { BEGIN, boxOf, capsule, CENTRE, createParticleScene, FOOT_TOP, GRIP, jointAt, pointed, roundBox, type Composition, type Part } from './particleScene';

/** Her size in the scene (model units per unit of her own): 9% over the Hanging Pull-Up's (owner, 2026-10-30); the Chair is fitted to her at this size. */
const SCALE = 0.545;
/** Then she alone grows 9% more (owner, 2026-10-30), the Chair staying as it is: from a point SHARE of the way from her grip to her hips on the seat's corner, so her hands press a little onto the pedal and her hips stay on the seat. */
const GROW = 1.09;
const SHARE = 0.4;
/**
 * Her head, where the owner approved it (2026-10-30): its pivot from the
 * ring's centre (model units), and the line from it through the head's
 * middle (degrees). She is placed by it, so the head and neck stay exactly
 * as approved whatever the pose below the chest does. (Moved out with her
 9% growth, from the middle of the whole composition, so it keeps its place
 in the ring; it was at 22.9283, −17.7557.)
 */
const HEAD_AT = { x: 25.2776, y: -18.6301 };
const HEAD_TURN = -55.2405;
const HEAD_MIDDLE: readonly [number, number, number] = [0, 8.5, 2];

/** The Chair (model units): its box's width (13% narrower beside her larger figure, owner 2026-10-30), the seat's pad, the frame's thickness, the base board's; the pedal's rise from its hinge (degrees) and the hinge's height in the box (the pedal pressed flatter and hinged lower, so the box, whose top her hips and foot her hands set, is shorter and squarer: owner 2026-10-30). */
const BOX = { width: 33, pad: 4.5, frame: 1.4, base: 2.2 };
const PEDAL = { rise: 4, hinge: 2 };

/**
 * The Swan (owner's review, 2026-10-30: the legs on the trunk's diagonal):
 * the legs straight (shin and thigh in one line as seen), up and back on
 * the trunk's 45° line, towards 10:30; the hips a little closed (9°) and
 * the lower back extending gently (9°), the upper back a little more (13°),
 * so feet, hips and head draw one long diagonal with a slight arch (about
 * 178°); the neck long, the head tipping forward (10°) so it reaches on
 * along it, down towards 04:30 (her neck-to-head line at about −45°); the
 * arms overhead (in her own space), straight (the elbow's rest bend taken
 * out), reaching down to the pedal 3° ahead of upright. (The shoulder angle
 * is taken from hanging in her own space, so it carries the trunk's bend:
 * −139° keeps the arms where −175° put them before the hips and lower back
 * changed.)
 */
const SWAN = resolve({ thigh: 1.3, pelvis: 9, L5: -1.8, L4: -1.8, L3: -1.8, L2: -1.8, L1: -1.8, T12: -2.5, T10: -2.5, T8: -2.5, T6: -2, T4: -2, T2: -1.5, head: 10, shoulder: -139, elbow: 8 });

export function compose(dots: Dots): Composition {
  const m = pose(SWAN);
  const posed = new Float64Array(dots.count * 3);
  skin(dots, Array.from({ length: LAGS }, () => m), posed);

  // Her own space onto the scene: upside down, her head's pivot at HEAD_AT and its line at HEAD_TURN, her front to the left (seen from her other side, so the depth turns too).
  const pivot = jointAt(m, 'head');
  const middle = jointAt(m, 'head', HEAD_MIDDLE);
  const a = ((HEAD_TURN + 90) * Math.PI) / 180 + Math.atan2(middle[2] - pivot[2], middle[1] - pivot[1]);
  const up = [Math.sin(a), -Math.cos(a)];
  const front = [-Math.cos(a), -Math.sin(a)];
  const place = ([x, y, z]: ArrayLike<number> & Iterable<number>) => {
    const [u, f] = [y - pivot[1], z - pivot[2]];
    return [CENTRE.x + HEAD_AT.x + SCALE * (u * up[0] + f * front[0]), CENTRE.y + HEAD_AT.y + SCALE * (u * up[1] + f * front[1]), -SCALE * x];
  };
  const person: number[][] = [];
  for (let i = 0; i < dots.count; i++) {
    const [x, y, z] = dots.rest.subarray(i * 3, i * 3 + 3);
    person.push(place(y < FOOT_TOP ? pointed(x, y, z) : posed.subarray(i * 3, i * 3 + 3)));
  }

  // The seat under the front of her hips: its front edge just past where her front turns from the legs to the trunk (her farthest dot down and back, near the hip joint, within 28 of her own units), its top where her lowest dots over it rest on it.
  const hip = place(jointAt(m, 'pelvis'));
  let [corner, most] = [[0, 0], -Infinity];
  for (const [x, y] of person) {
    const [u, v] = [x - hip[0], y - hip[1]];
    if (Math.hypot(u, v) < 28 * SCALE && -0.6 * u - 0.8 * v > most) [corner, most] = [[x, y], -0.6 * u - 0.8 * v];
  }
  const seatX1 = corner[0] + 1.5;
  let seatTop = Infinity;
  for (const [x, y] of person) if (x < seatX1 && x > seatX1 - BOX.width) seatTop = Math.min(seatTop, y);
  seatTop -= 0.6;
  // The pedal's bar under her hands; its hinge at the foot of the box's front, PEDAL.rise below; the floor under that.
  const hand = place(jointAt(m, 'handL', GRIP));
  const pedalAt = { x: hand[0] + 0.5, y: hand[1] - 2.2 };
  const face = seatX1 - 1;
  const hinge = { x: face - 1, y: pedalAt.y - Math.tan((PEDAL.rise * Math.PI) / 180) * (pedalAt.x - face + 1) };
  const floor = hinge.y - PEDAL.hinge - 0.6 - BOX.base;
  const box = { x0: seatX1 - BOX.width, x1: face, y0: floor + BOX.base + 0.6, y1: seatTop - BOX.pad - 0.6 };

  const t = BOX.frame;
  const coil = { x0: box.x1 + 0.6, y0: hinge.y + 13, x1: hinge.x + 0.6 * (pedalAt.x - hinge.x), y1: hinge.y + 0.6 * (pedalAt.y - hinge.y) + 1.4 };
  const parts: Part[] = [
    // The seat's pad (warmer, as the Reformer's carriage), a little over the box at the front.
    { sdf: roundBox(box.x0 - 1, seatTop - BOX.pad, seatX1 + 0.5, seatTop, 2), box: [box.x0 - 1, seatTop - BOX.pad, seatX1 + 0.5, seatTop], half: 2.2, depth: [-14, 14], tone: 4, level: 2, density: 1.1 },
    // The box, its side seen as a frame: its edges, a little rounded.
    { sdf: (x, y) => Math.abs(roundBox(box.x0, box.y0, box.x1, box.y1, 2.5)(x, y) + t / 2) - t / 2, box: [box.x0, box.y0, box.x1, box.y1], half: t / 2, depth: [-14, 14], tone: 0, level: 1, density: 1.5 },
    // The base board under the box.
    { sdf: roundBox(box.x0 - 1.5, floor, box.x1 + 1.5, floor + BOX.base, 1), box: [box.x0 - 1.5, floor, box.x1 + 1.5, floor + BOX.base], half: 1.1, depth: [-14, 14], tone: 0, level: 1, density: 1.4 },
    // The pedal: its arm from the hinge out to her hands, and its bar (seen end on) under them.
    { sdf: capsule(hinge.x, hinge.y, pedalAt.x, pedalAt.y, 1.1), box: boxOf(hinge.x, hinge.y, pedalAt.x, pedalAt.y, 1.1), half: 1.1, depth: [-12, 12], tone: 0, level: 1, density: 1.6 },
    { sdf: (x, y) => Math.hypot(x - pedalAt.x, y - pedalAt.y) - 2, box: [pedalAt.x - 2, pedalAt.y - 2, pedalAt.x + 2, pedalAt.y + 2], half: 2, depth: [-12, 12], tone: 1, level: 2, density: 2.6 },
    // Its spring, from the box's front down to the pedal's arm: a fine coil.
    {
      sdf: (x, y) => {
        const [ax, ay] = [coil.x1 - coil.x0, coil.y1 - coil.y0];
        const length = Math.hypot(ax, ay);
        const s = ((x - coil.x0) * ax + (y - coil.y0) * ay) / length;
        const across = ((x - coil.x0) * -ay + (y - coil.y0) * ax) / length;
        const wave = 1.1 * Math.sin((s / length) * Math.PI * 2 * 5);
        return Math.max(Math.abs(across - wave) - 0.55, -s, s - length);
      },
      box: boxOf(coil.x0, coil.y0, coil.x1, coil.y1, 1.8),
      half: 0.6,
      depth: [6, 12],
      tone: 2,
      level: 1,
      density: 2.4,
    },
  ];
  // She grows after the Chair is fitted to her, from between her grip and her hips.
  const from = [hand[0] + SHARE * (corner[0] - hand[0]), hand[1] + SHARE * (corner[1] - hand[1])];
  for (const p of person) [p[0], p[1], p[2]] = [from[0] + GROW * (p[0] - from[0]), from[1] + GROW * (p[1] - from[1]), GROW * p[2]];
  return { person: Float64Array.from(person.flat()), parts };
}

export function createSwanScene(root: HTMLElement): Scene {
  const item = root.querySelector<HTMLElement>(".ring-menu__item[data-hour='4.5']");
  return createParticleScene(root, compose, (t) => item?.toggleAttribute('data-active', t >= BEGIN));
}
