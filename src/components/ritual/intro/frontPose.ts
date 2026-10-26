// The movement seen from the front: the male character in front
// view, in the same movement as the side view at every moment. From the front,
// the side view's forward rotations can't be shown as rotations (the front
// view's joints pivot on the centre line, so they would bend him sideways).
// What they change in the outline seen from the front is height: how far the
// shoulders and the head's pivot sink, and how far the head tips forward. So
// the side view's angles are turned into those three numbers, by placing the
// pivots of the character's own side view, and the front view's joint groups
// move down by them (the shoulders also a little inwards, rounding forward),
// with the head foreshortened by the cosine of its tilt. In the slouch
// (approved as a proposal on 2026-10-20) that is 3.7 units at the shoulders,
// 9.2 at the head's pivot and a 28° tilt (88% of the head's height). Nothing is
// redrawn: these are transforms of the approved joint groups.
import { spine } from '../proportions';
import type { JointAngles } from './poses';

export type Pt = readonly [number, number];
export type Pivots = Readonly<Record<string, Pt>>;

/** A front-view joint's offset in viewBox units (x towards the centre line for the arms, y down) and vertical scale. */
export interface FrontJoint {
  x?: number;
  y?: number;
  scaleY?: number;
}

/** The joints' pivots (their transform-origins) in a character's markup from ../body.ts, by joint, the first of each. */
export function pivotsOf(markup: string): Pivots {
  const pivots: Record<string, Pt> = {};
  for (const [, id, x, y] of markup.matchAll(/class="j j-([\w-]+)[^"]*" style="transform-origin:([\d.-]+)px ([\d.-]+)px"/g)) {
    pivots[id] ??= [Number(x), Number(y)];
  }
  return pivots;
}

/** The chain from the pelvis up, each joint carrying the next; the head hangs from the last, the arm from t3-t1. */
const chain = ['pelvis', ...spine.map((seg) => seg.id)];
const carriers = (joint: string) => (joint === 'shoulder' ? chain.slice(0, chain.indexOf('t3-t1') + 1) : chain);

/** A point turned about a pivot by a CSS rotation (clockwise on screen, so forward for a figure facing right). */
function turned([x, y]: Pt, [cx, cy]: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
}

/** How far a joint's pivot sinks in the side view, in viewBox units, when the joints carrying it turn by `angles`. */
function sink(joint: 'shoulder' | 'head', angles: JointAngles, pivots: Pivots) {
  let point = pivots[joint];
  for (const carrier of [...carriers(joint)].reverse()) point = turned(point, pivots[carrier], angles[carrier] ?? 0);
  return point[1] - pivots[joint][1];
}

// How the rib cage shares the shoulders' drop, a little more towards the top;
// the neck moves with the shoulders, so the suit's strap and the shoulder line
// stay continuous, and the head drops the rest.
const torsoShare: Readonly<Record<string, number>> = { 't12-t10': 0.5 / 3.7, 't9-t7': 0.8 / 3.7, 't6-t4': 1 / 3.7, 't3-t1': 1.4 / 3.7 };
/** How far the shoulders move in per unit of their drop, rounding forward. */
const SHOULDER_IN = 0.8 / 3.7;

/** The front view's pose for side-view angles, measured on the side view's pivots. */
export function frontPose(angles: JointAngles, pivots: Pivots): Record<string, FrontJoint> {
  const shoulders = sink('shoulder', angles, pivots);
  const tilt = Object.values(angles).reduce((sum, deg) => sum + deg, 0);
  return {
    ...Object.fromEntries(Object.entries(torsoShare).map(([joint, share]) => [joint, { y: shoulders * share }])),
    shoulder: { x: shoulders * SHOULDER_IN },
    head: { y: sink('head', angles, pivots) - shoulders, scaleY: Math.cos((tilt * Math.PI) / 180) },
  };
}
