// The intro ritual at any moment: pure functions of time, from the
// slouched pose in ./poses.ts and the tracks in ./timeline.ts, so the movement
// can be played, paused, scrubbed and tested frame by frame.
import type { View } from '../body';
import type { CharacterId } from '../proportions';
import { frontPose, type Pivots } from './frontPose';
import { CROWN_LIFT, expansionAt, hangingShoulder, slouch, views, type JointAngles } from './poses';
import { ARM_LAG, DURATION, SENTENCE_FADE, breathTrack, crownTrack, motionTrack, sentenceTrack, type Move } from './timeline';

/** CSS's cubic-bezier() as a function of progress (0–1). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  const slope = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s ** 2;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, s);
      if (Math.abs(d) < 1e-6) break;
      s -= (bez(x1, x2, s) - x) / d;
    }
    return bez(y1, y2, Math.min(1, Math.max(0, s)));
  };
}

/** Slow in, slow out: each segment eases away from its pose and settles into the next. */
export const ease = cubicBezier(0.45, 0, 0.25, 1);

/** The breath's ease: symmetric, as even going in as coming out. */
const breathEase = cubicBezier(0.37, 0, 0.63, 1);

/** A track's value at time t: its start, then each of its moves in turn. */
function valueAt(start: number, moves: readonly Move[], t: number) {
  let value = start;
  for (const move of moves) {
    if (t <= move.at) break;
    value += (move.to - value) * (move.ease === 'breath' ? breathEase : ease)((t - move.at) / move.ms);
  }
  return value;
}

/** A joint's angle at time t; without the breath's moves (the chest's lift) if `breath` is false. */
const angleAt = (start: number, joint: string, t: number, breath = true) =>
  valueAt(start, (motionTrack[joint] ?? []).filter((move) => breath || move.ease !== 'breath'), t);

/** The spine, pelvis and head at time t, without the arm; without the chest's lift with the breath if `breath` is false. */
function spineAt(character: CharacterId, t: number, breath = true): JointAngles {
  const start = slouch[character];
  return Object.fromEntries(Object.keys(start).map((joint) => [joint, angleAt(start[joint], joint, t, breath)]));
}

/** Every animated joint's side-view angle at time t (ms), the shoulder included; all 0 from DURATION on. */
export function poseAt(character: CharacterId, t: number): JointAngles {
  if (t >= DURATION) return Object.fromEntries([...Object.keys(slouch[character]), 'shoulder'].map((joint) => [joint, 0]));
  return { ...spineAt(character, t), shoulder: hangingShoulder(spineAt(character, Math.max(0, t - ARM_LAG))) };
}

/** How a joint group is moved, turned and scaled about its pivot. */
export interface JointTransform {
  rotate?: number;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
}

export type Pose = Readonly<Record<string, JointTransform>>;

/**
 * Every animated joint's transform at time t, in the character's own view:
 * from the side, the rotations of poseAt(); from the front, ./frontPose.ts
 * applied to the same angles, on the pivots of the character's side view,
 * and the crown's reach, which the side view shows as the head's lift. The
 * breath's widening isn't a joint transform: see breathWidening(). Empty from
 * DURATION on.
 */
export function transformsAt(character: CharacterId, t: number, sidePivots?: Pivots): Pose {
  if (t >= DURATION) return {};
  const view = views[character];
  const pose: Record<string, JointTransform> = {};
  const add = (joint: string, transform: JointTransform) => (pose[joint] = { ...pose[joint], ...transform });
  if (view === 'side') for (const [joint, rotate] of Object.entries(poseAt(character, t))) add(joint, { rotate });
  else if (sidePivots) {
    // The chest's lift with the breath is a movement seen from the side; from
    // the front it would only raise the rib cage and shoulders a fraction of a
    // unit (and shift the suit's clipped edges off the pixel grid), so the
    // front view leaves it out.
    for (const [joint, move] of Object.entries(frontPose(spineAt(character, t, false), sidePivots))) add(joint, move);
    const crown = valueAt(0, crownTrack, t);
    if (crown > 0) add('c2-c1', { y: -crown * CROWN_LIFT });
  }
  return pose;
}

/**
 * How much wider the torso is at a height (viewBox units) at time t, in a
 * view, as a fraction of its size at rest: the breath there (./timeline.ts,
 * breathTrack) times the widening at its fullest (./poses.ts, breathProfile).
 * The player bends the torso's outlines by it, point by point, about the
 * centre line from the front and about the spine from the side. Exactly 0
 * outside the breath and outside the profile's heights, where the outlines
 * keep their approved path data.
 */
export function breathWidening(view: View, y: number, t: number) {
  const fullest = expansionAt(view, y);
  return fullest && t < DURATION ? valueAt(0, breathTrack(y), t) * fullest : 0;
}

const round = (n: number) => Math.round(n * 1e4) / 1e4;

/** A joint transform as the CSS rotate, translate and scale properties ('' for none). */
export function cssOf({ rotate, x = 0, y = 0, scaleX = 1, scaleY = 1 }: JointTransform = {}) {
  return {
    rotate: rotate === undefined ? '' : `${round(rotate)}deg`,
    translate: x || y ? `${round(x)}px ${round(y)}px` : '',
    scale: scaleX !== 1 || scaleY !== 1 ? `${round(scaleX)} ${round(scaleY)}` : '',
  };
}

/** A sentence's opacity at time t (0 is the title): fading in at its start and out at its end. */
export function sentenceOpacity(sentence: number, t: number) {
  const timing = sentenceTrack[sentence];
  if (!timing) return 0;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return ease(clamp((t - timing.in) / SENTENCE_FADE)) * (1 - ease(clamp((t - timing.out) / SENTENCE_FADE)));
}
