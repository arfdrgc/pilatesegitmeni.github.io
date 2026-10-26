// The homepage intro's stage: one square SVG, 1000 × 1000 units, holding the
// ring, the waist line and the female character, and the "camera" that places
// her in it. The character draws in her own 300 × 460 viewBox
// (../ritual/proportions.ts); each camera is a translate and a scale from her
// units into stage units. Values are the approved starting specification
// (handoff note, 2026-10-23), to be tuned after browser review.
import { designs } from '../ritual/characters';
import { CX, FLOOR, pelvis } from '../ritual/proportions';

export const STAGE = 1000;

/** The ring, in stage units; the padding outside it leaves room for a highlighted dot. */
export const RING = { cx: 500, cy: 500, r: 460 } as const;

/** The top of her hair in her own units (measured on the approved artwork). */
export const HAIR_TOP = 28;

/** The x in her units that sits on the ring's centre line: her body from the side, the centre line from the front. */
export const ANCHOR_X = { side: 158, front: CX } as const;

export interface Camera {
  /** Her units → stage units. */
  scale: number;
  x: number;
  y: number;
}

const camera = (scale: number, [fx, fy]: readonly [number, number], [sx, sy]: readonly [number, number]): Camera => ({
  scale,
  x: sx - fx * scale,
  y: sy - fy * scale,
});

/**
 * The menu: front view, full body, the hair 4% of the ring's diameter below
 * its top and the soles as far above its bottom.
 */
const fullBody = (2 * RING.r * 0.92) / (FLOOR - HAIR_TOP);
export const idleCamera = camera(fullBody, [CX, HAIR_TOP], [RING.cx, RING.cy - RING.r * 0.92]);

/**
 * The waist line in the opening, in stage units: near the bottom of the ring,
 * so the circle reads as a dome resting on it.
 */
export const LINE_Y = RING.cy + RING.r * 0.8;

/** Where the line is drawn in her units: the top of the pelvis, so the whole rib cage and the breath stay in view. */
export const LINE_AT = pelvis.top;

/**
 * The opening: side view, from the top of the pelvis up, filling 72% of the
 * ring's diameter, with her body (x 158 in her units) on the ring's centre.
 * That makes the pull-back to the menu a scale of about 0.56.
 */
const waistUp = (2 * RING.r * 0.72) / (LINE_AT - HAIR_TOP);
export const openingCamera = camera(waistUp, [ANCHOR_X.side, LINE_AT], [RING.cx, LINE_Y]);

/**
 * The camera pulling back, from the opening (`progress` 0) to the menu (1):
 * the scale shrinks evenly (geometrically, so the zoom reads at a steady
 * rate) while the top of her hair moves up to its place in the menu, and the
 * view's anchor stays on the ring's centre line. The ring itself doesn't move.
 */
export function pullBack(progress: number, anchorX: number): Camera {
  const scale = openingCamera.scale * (idleCamera.scale / openingCamera.scale) ** progress;
  const hairY = (y: Camera) => y.y + HAIR_TOP * y.scale;
  const top = hairY(openingCamera) + (hairY(idleCamera) - hairY(openingCamera)) * progress;
  return camera(scale, [anchorX, HAIR_TOP], [RING.cx, top]);
}

/** The line reaches a little beyond the ring on both sides, as in the sketch. */
export const LINE_HALF = RING.r * 1.1;

/** Half the width of the ring at a height (stage units): where a horizontal line meets it. */
export const chordHalf = (y: number) => Math.sqrt(Math.max(0, RING.r ** 2 - (y - RING.cy) ** 2));

/** The ring's lowest point, where the line closes to nothing. */
export const RING_BOTTOM = RING.cy + RING.r;

/** A menu position (clock hour) as a point on the ring, in stage units. */
export function ringPoint(hour: number) {
  const a = (hour / 12) * 2 * Math.PI;
  return { x: RING.cx + RING.r * Math.sin(a), y: RING.cy - RING.r * Math.cos(a) };
}

type Pt = readonly [number, number];

const angleOf = ([x, y]: Pt) => (Math.atan2(y, x) * 180) / Math.PI;
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A two-bone arm reaching a point (her units, front view, the figure's right
 * arm, which is the viewer's left; the other is its mirror image): the
 * shoulder, elbow and wrist rotations (degrees, clockwise on screen) that put
 * the wrist on the target with the elbow bent outwards, plus a wrist turn that
 * points the hand along `handAngle` (degrees from the +x axis, clockwise).
 */
export function reach(target: Pt, handAngle: number) {
  const [s, e, w] = designs.female.front.arm.pivots;
  const upper = Math.hypot(e[0] - s[0], e[1] - s[1]);
  const fore = Math.hypot(w[0] - e[0], w[1] - e[1]);
  const toTarget: Pt = [target[0] - s[0], target[1] - s[1]];
  const d = Math.min(Math.hypot(...toTarget), upper + fore - 0.01);
  const opening = (Math.acos((upper ** 2 + d ** 2 - fore ** 2) / (2 * upper * d)) * 180) / Math.PI;
  // Elbow outwards: towards -x for this arm, which is clockwise from a target below.
  const upperAngle = angleOf(toTarget) + opening;
  const shoulder = upperAngle - angleOf([e[0] - s[0], e[1] - s[1]]);
  const rad = (upperAngle * Math.PI) / 180;
  const elbowAt: Pt = [s[0] + upper * Math.cos(rad), s[1] + upper * Math.sin(rad)];
  const foreAngle = angleOf([target[0] - elbowAt[0], target[1] - elbowAt[1]]);
  const elbow = foreAngle - angleOf([w[0] - e[0], w[1] - e[1]]) - shoulder;
  const wrist = handAngle - foreAngle;
  return { shoulder: round(shoulder), elbow: round(elbow), wrist: round(wrist) };
}

/**
 * Hands on hips (the menu's idle), with the existing hanging hand standing in
 * for the approved H1 hand until it is drawn (plan step 5): the wrist at the
 * side of the waist (her outline is at x 126 there), the hand pointing down
 * along the hip.
 * Marked pure so that a bundle which doesn't use it (the homepage's, through
 * ./dotScene.ts) leaves out the characters' artwork reach() reads; where it
 * is used, it is computed as before.
 */
export const handsOnHips = /* @__PURE__ */ reach([125, 192], 97);
