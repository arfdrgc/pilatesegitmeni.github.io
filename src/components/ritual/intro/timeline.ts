// The intro ritual's two tracks, kept apart so either can be
// retimed without touching the other: the movement, joint by joint, and the
// sentences (the title, then the cues). Times are in ms from the start. The
// movement starts in the slouched pose of ./poses.ts, holds it while the title
// is read, unrolls slowly from the pelvis up to the head, and is still before
// DURATION, in the approved neutral pose (every joint at 0); the last cue stays.
import { spine } from '../proportions';
import { smoothstep } from './poses';

export const DURATION = 16000;

/** An eased move of a joint to an angle (degrees), from wherever it is at `at`. */
export interface Move {
  at: number;
  ms: number;
  to: number;
  /** 'breath': eased evenly in and out, so the breath fills and empties gradually (default: slow in, long settle). */
  ease?: 'breath';
}

// One deep breath, 8700–15600 ms, while its cue is on screen: a slow
// in-breath through the nose, a short pause at the top, then a longer,
// controlled out-breath, back to rest 400 ms before the end.
const INHALE = { at: 8700, ms: 2800 };
const HOLD = 700;
const EXHALE = { at: INHALE.at + INHALE.ms + HOLD, ms: 3400 };

const heightOf = (joint: string) => spine.find((seg) => seg.id === joint)!.y;
const LOWER_RIBS = heightOf('t12-t10');
const TOP_RIBS = heightOf('t3-t1');
const MAX_LAG = 450;

/**
 * How long after the lower ribs the in-breath starts at a height (viewBox
 * units), in ms: none at the lower ribs and below, rising smoothly to MAX_LAG
 * at the top of the rib cage and above, so the breath fills the rib cage from
 * the bottom up. A smooth function of height, so the outline, which bends point
 * by point, stays smooth while it fills. Everything reaches the top of the
 * breath together and releases together.
 */
const breathLag = (y: number) => MAX_LAG * smoothstep(LOWER_RIBS, TOP_RIBS, y);

/** The moves for the breath at a lag: to `to` on the in-breath, back to 0 on the out-breath. */
function breath(lag: number, to: number): Move[] {
  return [
    { at: INHALE.at + lag, ms: INHALE.ms - lag, to, ease: 'breath' },
    { at: EXHALE.at, ms: EXHALE.ms, to: 0, ease: 'breath' },
  ];
}

// Each joint's moves, in order and without overlap. A joint holds its slouched
// angle until its first move.
export const motionTrack: Readonly<Record<string, readonly Move[]>> = {
  // 1900–4290 ms, "straighten your back": the pelvis, then the lumbar spine
  // and the rib cage, each segment 130–150 ms after the one below it, so the
  // straightening travels slowly up the back.
  pelvis: [{ at: 1900, ms: 1400, to: 0 }],
  'l5-l4': [{ at: 2030, ms: 1350, to: 0 }],
  'l3-l2': [{ at: 2160, ms: 1350, to: 0 }],
  l1: [{ at: 2290, ms: 1350, to: 0 }],
  't12-t10': [{ at: 2440, ms: 1400, to: 0 }],
  // The upper rib cage also lifts very slightly with the breath.
  't9-t7': [{ at: 2590, ms: 1400, to: 0 }, ...breath(breathLag(heightOf('t9-t7')), -0.5)],
  't6-t4': [{ at: 2740, ms: 1400, to: 0 }, ...breath(breathLag(heightOf('t6-t4')), -0.5)],
  't3-t1': [{ at: 2890, ms: 1400, to: 0 }, ...breath(breathLag(TOP_RIBS), -0.5)],
  // 3950–6100 ms, "reach up through the crown": as the upper back finishes,
  // the neck straightens and the head lifts from looking down to just above
  // level. With the breath, the base of the neck undoes the rib cage's lift,
  // so the head stays level (the chin doesn't rise).
  'c7-c5': [{ at: 3950, ms: 1300, to: 0 }, ...breath(MAX_LAG, 1.5)],
  'c4-c3': [{ at: 4100, ms: 1300, to: 0 }],
  // The top of the neck keeps a little of its extension until the chin tucks,
  // 6450–8050 ms, with a slight nod that settles.
  'c2-c1': [
    { at: 4250, ms: 1250, to: -1.5 },
    { at: 6450, ms: 1300, to: 0 },
  ],
  head: [
    { at: 4000, ms: 2100, to: -2 },
    { at: 6450, ms: 900, to: 0.6 },
    { at: 7350, ms: 700, to: 0 },
  ],
};

/**
 * The crown's reach from the front, 0 at rest and 1 at its highest: the head
 * rises as the neck lengthens (./poses.ts, CROWN_LIFT), on the same rhythm as
 * the side view's neck and head above: up from 3950 ms, as the neck starts to
 * straighten, to its highest at 6100 ms, when the head has lifted; then, with
 * the chin tuck, 6450–8050 ms, back down to the neutral pose.
 */
export const crownTrack: readonly Move[] = [
  { at: 3950, ms: 2150, to: 1 },
  { at: 6450, ms: 1600, to: 0 },
];

/**
 * The breath at a height of the torso, 0 at rest and 1 at the top of the
 * in-breath: the torso widens there (./poses.ts, breathProfile) on the same
 * rhythm as the chest's lift above, filling from the bottom up, pausing, then
 * releasing slowly, back to its resting shape before the end.
 */
export const breathTrack = (y: number): readonly Move[] => breath(breathLag(y), 1);

/**
 * How far the arm lags behind the rib cage that carries it, in ms: it hangs
 * straight down, but follows the spine's movement a moment late, so it swings
 * very slightly while the spine moves and comes to rest with it.
 */
export const ARM_LAG = 45;

/** When a sentence is shown: it fades in from `in` and out from `out`, over SENTENCE_FADE ms. */
export interface SentenceTiming {
  in: number;
  out: number;
}

export const SENTENCE_FADE = 450;

/**
 * One timing per sentence, in order: the title, then each cue in copy.ts; the
 * last one stays. Only one sentence is ever on screen: each has faded out
 * 100 ms before the next fades in.
 */
export const sentenceTrack: readonly SentenceTiming[] = [
  { in: 0, out: 1250 }, // the title
  { in: 1800, out: 3450 }, // straighten your back
  { in: 4000, out: 5850 }, // reach up through the crown
  { in: 6400, out: 7850 }, // tuck the chin
  { in: 8400, out: Infinity }, // breathe: on screen for the whole breath, to the end
];
