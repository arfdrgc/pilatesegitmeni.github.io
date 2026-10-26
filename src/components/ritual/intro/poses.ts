// Poses for the intro ritual. The female is seen from the side and
// the male from the front, in the same movement. The slouch is given as
// rotations in degrees for the joint groups that ../body.ts draws in the side
// view, where a positive angle bends forward; ./frontPose.ts turns those same
// angles into the front view's pose. The ritual ends in the neutral upright
// pose, which is the approved design itself with nothing transformed, so only
// the slouched start is listed; the movement between them is in ./timeline.ts.
import type { View } from '../body';
import { spine, type CharacterId } from '../proportions';

/** The view each character is seen in. */
export const views: Record<CharacterId, View> = { male: 'front', female: 'side' };

export type JointAngles = Readonly<Record<string, number>>;

// Pelvis tilted back, the lumbar spine and rib cage rounded forward, the neck
// leaning forward with its top in slight extension (the chin pushed forward)
// and the head looking down: a subtle slouch, not a deep bend. Each angle is
// about 78% of the first proposal (2026-10-20), at most 5.5° per joint.
const slouched: JointAngles = {
  pelvis: -4.7,
  'l5-l4': 2.3,
  'l3-l2': 2.3,
  l1: 2.3,
  't12-t10': 3.1,
  't9-t7': 4.7,
  't6-t4': 5.5,
  't3-t1': 4.7,
  'c7-c5': 3.9,
  'c4-c3': 1.6,
  'c2-c1': -2.3,
  head: 4.7,
};

/** The slouched start, per character (the same for both for now). */
export const slouch: Record<CharacterId, JointAngles> = { male: slouched, female: slouched };

/** The joints that carry the arm: the pelvis and the segments up to the rib cage's top. */
export const armCarriers: readonly string[] = [
  'pelvis',
  ...spine.slice(0, spine.findIndex((seg) => seg.id === 't3-t1') + 1).map((seg) => seg.id),
];

/** The shoulder angle that keeps the arm hanging straight down: it undoes the rotation the arm inherits. */
export const hangingShoulder = (pose: JointAngles) =>
  Math.round(-armCarriers.reduce((sum, id) => sum + (pose[id] ?? 0), 0) * 1000) / 1000;

/**
 * How far the crown reaches up from the front at its highest (./timeline.ts,
 * crownTrack), in viewBox units: the top of the neck and the head rise
 * together, so the neck lengthens where it is the same width all the way
 * (its two upper segments overlap by 4 units, so they stay joined).
 */
export const CROWN_LIFT = 3;

/**
 * How much the torso widens at the top of an in-breath, by height: from the
 * front its width about the centre line, from the side its depth about the
 * spine (so the chest moves forward and the back a little back). The outline
 * itself bends (./pose.ts, breathWidening), point by point at its height, so
 * the segments' outlines move together where they meet and the torso stays
 * one smooth shape. Most at the lower ribs, which open out the most; nothing
 * above `rise[0]` (the shoulders, the neck) or below `fall[1]` (the pelvis),
 * with smooth transitions between. From the front, the arms hide the rib
 * cage's sides, so what shows is the lower ribs and the waist closing the gap
 * between the arms and the body.
 */
export interface BreathProfile {
  /** The widening at its fullest, as a fraction of the width or depth at rest. */
  peak: number;
  /** Heights (viewBox units) over which it grows from nothing to its peak. */
  rise: readonly [number, number];
  /** Heights over which it falls from its peak back to nothing. */
  fall: readonly [number, number];
}

export const breathProfile: Record<View, BreathProfile> = {
  front: { peak: 0.12, rise: [118, 160], fall: [178, 206] },
  side: { peak: 0.1, rise: [112, 145], fall: [175, 206] },
};

/** 0 below `from`, 1 above `to`, and a smooth S-curve between. */
export function smoothstep(from: number, to: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** The torso's widening at a height at the top of the breath. */
export function expansionAt(view: View, y: number) {
  const { peak, rise, fall } = breathProfile[view];
  return peak * smoothstep(rise[0], rise[1], y) * (1 - smoothstep(fall[0], fall[1], y));
}
