// The homepage intro's dot-figure part (the development intro at
// /dev/home-intro/, ../home-intro/dotScene.ts, which continues from END), as
// pure functions of time, so it can be played, paused and scrubbed both ways.
// The figure is the approved prototype's (src/prototypes/dot-figure/
// DotFigure.astro, 2026-10-25), cascading through the spine (the pelvis first
// coming up), with the follow-through at the prototype's default fluidity.
// The sequence (owner's revision, 2026-10-26): she holds the hunch with her
// lines in under the title; they clear and she straightens slowly; she turns
// to 45° and reaches up through the crown with her nearer arm; she turns back
// to 70°, arms down, and breathes in and out (her upper body, and the ring in
// ../home-intro/dotScene.ts). The sentences (the title, then the cues of
// src/config/home-intro.ts) come one at a time, each movement's cue staying
// until it has settled.
import { cascade, CHANNELS, distance, LAGS, POSES, resolve, smootherstep, type Channel, type Pose, type Resolved } from './model';
import type { Look } from './render';

// ---------- The approved look ----------

/**
 * The viewing angle (degrees, 0 is the front, 90 the side facing right): from
 * the side, turned 20° towards the viewer. The roll-down reads as clearly as
 * in profile, while the shoulders, the neck and both arms keep the body's
 * volume (a pure profile, checked in Chrome on the homepage, read as a flat
 * strip, the arm lost in the torso). The spine's accent is still at its full
 * step here (./render.ts).
 */
export const YAW = 70;

/** The approved settings: radius 1–4 px, spine and depth on (the dense figure and clay and sage are chosen in ../home-intro/dotScene.ts). */
export const LOOK: Readonly<Omit<Look, 'lineAlpha'>> = { rMin: 1, rMax: 4, spine: true, depth: true };

// ---------- The prototype's timing (ms) ----------

/** A pose counts as settled this long after its last dot arrives; then the lines fade in. */
export const SETTLE = 450;
export const LINES_IN = 900;
export const LINES_OUT = 320;
/** A sentence's fade in or out. */
export const SENTENCE_FADE = 450;
/** Follow-through: each lag level trails the one before by this much (90 ms × the default fluidity, 0.5). */
export const LAG = 45;

const FULL = distance(resolve(POSES.standing), resolve(POSES.down));
const durationOf = (from: Resolved, to: Resolved) => 1400 + 3800 * Math.min(1, distance(from, to) / FULL);

// ---------- The sequence ----------

/** The 2026-10-25 opening pose: 60% of the halfway pose. No longer shown; the hunch is measured from it. */
const OPENING_POSE: Resolved = resolve(POSES.halfway).map((angle) => angle * 0.6);
/**
 * The hunch she forms in and holds (owner, 2026-10-26): exactly the pose of
 * the 2026-10-25 roll-down at 7140 ms of that scene, 52.3% of the way from the
 * opening pose to rolled down (2720 of its 5200 ms). The head, the neck and
 * the upper back are fully rounded; the lower back and the pelvis have barely
 * moved.
 */
export const HUNCH: Resolved = cascade(OPENING_POSE, resolve(POSES.down), 2720 / 5200, resolve({}));
/**
 * The dots' spread out of the centre, and the title's start (owner,
 * 2026-10-31): intro time 0 is the end of the opening (the spread, then her
 * lines, LINES_IN), so the title starts this long before it, as she appears.
 */
export const EMERGE_MS = 1300;
const TITLE_IN = -(EMERGE_MS + LINES_IN);
/** How long after it starts fading in the title starts fading out: its time on screen is as before (owner, 2026-10-26). */
const TITLE_MS = 3000;
/** The straightening keeps the approved return to standing's duration (the longest move, 5200 ms): it is meant to be slow. */
const STRAIGHTEN_MS = durationOf(resolve(POSES.down), resolve(POSES.standing));

/**
 * The reach (owner, 2026-10-26, corrected after review the same day): seen at
 * 45°, the arm nearest the viewer (her right) comes up out to the side, a
 * little forward, the elbow well clear of the head and the forearm curving
 * over it, the hand onto the middle of the crown (not towards the far ear);
 * then the elbow opens and the hand rises straight up over the crown, the arm
 * soft, the elbow still out from the head. The upper back gives a little
 * away from the arm (2° over T8–T2), the head kept level. The angles were
 * solved for joint places (model units: the crown at 171, the head's side at
 * x −7.6) and checked in Chrome.
 */
const LEAN: Pose = { T8: [0, -0.5, 0], T6: [0, -0.5, 0], T4: [0, -0.5, 0], T2: [0, -0.5, 0], head: [0, 1.5, 0] };
/**
 * The reach's former top (the fingertips at 203). No longer reached; her
 * size is still measured on it (SIZE_SHAPE), so it is unchanged.
 */
const REACH_ROOM: Resolved = resolve({ ...LEAN, elbow: 5, shoulderR: [-6, 168, 0], elbowR: [3, 38, 0] });
/**
 * Corrected by the owner (2026-10-26): the hand first touches the top of the
 * head, then lengthens upward. REACH_TOUCH: the elbow out at x −33, the hand
 * resting across the crown, the wrist bent down onto it (the hand's dots
 * 2.1 units from the head's, as close as the head's own dots are to each
 * other: touching, not inside it). REACH_TOP: the pose the arm passed through
 * at 14 610 ms of the scene before the correction (the fingertips at 197, the
 * elbow at x −29, softly bent), now where it ends.
 */
const REACH_TOUCH: Resolved = resolve({ ...LEAN, elbow: 5, shoulderR: [-12, 138, 0], elbowR: [6, 93, 0], wristR: [-13, 44, 0] });
const REACH_TOP: Resolved = resolve({ ...LEAN, elbow: 5, shoulderR: [-10, 150, 0], elbowR: [2, 63, 0] });
/** The view for the reach: turned from the approved 70° to 45°, so the raised arm is seen clearly. */
export const REACH_YAW = 45;
/**
 * The arm starts up to the crown ARM_LEAD before the first cue starts fading
 * (all its dots there ARM_UP after it starts, as the fade ends), lengthens up
 * with the second cue, and starts down ARM_LEAD before that cue starts fading,
 * ARM_CUE_HOLD after the hand has reached its top; all its dots are down as
 * the fade ends (owner, 2026-10-31).
 */
const ARM_LEAD = 300;
const ARM_UP = 1500;
const ARM_RISE = 2390;
const ARM_CUE_HOLD = 405;
const ARM_DOWN = 1500;
/** A breath in and a breath out (owner, 2026-10-26: the breath out takes 3 s, the breath in as long). */
const BREATH_MS = 3000;
/**
 * A full breath in, on the skeleton (owner's review, 2026-10-26: the whole
 * torso answers the breath): the upper back extends a little (1.5° over
 * T12–T2), the neck and the head take it back so the gaze stays level, and
 * the arms open a touch with the ribs. The rise and the rib cage's opening
 * are ./model.ts's `breathe`.
 */
const BREATH_POSE: Resolved = resolve({ T12: -0.25, T10: -0.25, T8: -0.25, T6: -0.25, T4: -0.25, T2: -0.25, C7: 0.5, C4: 0.5, head: 0.5, shoulder: [0, 0.8, 0] });

/**
 * The arm's own transition (owner's review, 2026-10-26: not robotic), with an
 * elbow that bends a little further on the way (`bend`, degrees at the middle
 * of the elbow's window), so the hand swings in an arc.
 * - Without `via`: the joints each start a little apart (shares of the move,
 *   `delay`), each over the same eased window.
 * - Through `via` at `viaAt` of the move: each channel follows a smooth
 *   monotone curve through it, exactly there at `viaAt`, still at both ends;
 *   a joint that keeps its direction flows on through it, one that turns
 *   back (the elbow, the wrist) comes to rest there for that instant. `delay`
 *   is then how far a joint trails in the middle of each half (it arrives on
 *   time), and negative values lead.
 */
interface ArmMotion {
  delay: Partial<Record<Channel, number>>;
  bend?: number;
  via?: Resolved;
  viaAt?: number;
}

interface Move {
  from: Resolved;
  to: Resolved;
  start: number;
  duration: number;
  /** When its last (most lagging) dot arrives. */
  settled: number;
  /** The spine's region-by-region cascade (its spread, ./model.ts), or an arm's motion (armMove). */
  spread: number | ArmMotion;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ELBOW_R = CHANNELS.indexOf('elbowR');

/** A trailing joint's time within a half (0 … 1): behind in the middle by `d`, on time at both ends, moving at full pace there. */
const trail = (w: number, d: number) => w - d * Math.sin(Math.PI * w) ** 2;

/** A value at x through (0, y0), (k, y1), (1, y2): cubic pieces, still at both ends, monotone (Fritsch–Butland), so it never overshoots. */
function through(y0: number, y1: number, y2: number, k: number, x: number) {
  const s0 = (y1 - y0) / k;
  const s1 = (y2 - y1) / (1 - k);
  const m = s0 * s1 > 0 ? (3 * (k + (1 - k))) / ((2 * (1 - k) + k) / s0 + ((1 - k) + 2 * k) / s1) : 0;
  const [a, b, h, ma, mb, t] = x <= k ? [y0, y1, k, 0, m, x / k] : [y1, y2, 1 - k, m, 0, (x - k) / (1 - k)];
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * h * ma + (-2 * t3 + 3 * t2) * b + (t3 - t2) * h * mb;
}

function armMove(from: Resolved, to: Resolved, { delay, bend = 0, via, viaAt = 0 }: ArmMotion, u: number, out: Resolved) {
  const window = 1 - Math.max(0, ...Object.values(delay));
  /** A channel's progress through the move, 0 … 1. */
  const at = (c: Channel) => {
    const d = delay[c] ?? 0;
    if (!via) return clamp01((u - d) / window);
    return u <= viaAt ? viaAt * trail(clamp01(u / viaAt), d) : viaAt + (1 - viaAt) * trail(clamp01((u - viaAt) / (1 - viaAt)), d);
  };
  CHANNELS.forEach((c, i) => {
    const v = at(c);
    for (let k = i * 3; k < i * 3 + 3; k++) out[k] = via ? through(from[k], via[k], to[k], viaAt, v) : from[k] + (to[k] - from[k]) * smootherstep(v);
  });
  // The elbow's bend, about its hinge across the arm (its side angle, as the reach's).
  if (bend) out[ELBOW_R * 3 + 1] += bend * Math.sin(Math.PI * at('elbowR'));
  return out;
}

/**
 * Up: the arm lifts out to the side, the elbow folding a little ahead of the
 * shoulder and the hand trailing, so the hand sweeps out and over and comes
 * down onto the crown; then, without a stop, the elbow opens and the hand
 * lengthens up from it. Down: the shoulder leads, the elbow drops out to the
 * side first, folding a little more, and the forearm and the hand unfold
 * after it.
 */
const ARM_UP_MOTION: Omit<ArmMotion, 'via' | 'viaAt'> = { delay: { shoulder: 0.04, shoulderR: 0.04, wrist: 0.08, wristR: 0.08 } };
const ARM_DOWN_MOTION: ArmMotion = { delay: { elbow: 0.12, elbowR: 0.12, wrist: 0.2, wristR: 0.2 }, bend: 30 };

/** A linear fade of the lines, as in the prototype. */
interface Fade {
  at: number;
  ms: number;
  to: 0 | 1;
}

const moves: Move[] = [];
/** The lines: in over the held hunch, out before the first movement; they come back with the menu's front view (../home-intro/dotScene.ts). */
const fades: Fade[] = [];
/** A move from the previous pose (the hunch first), starting at `start`. */
function move(to: Resolved, start: number, duration: number, spread: Move['spread'] = 0.6) {
  const from = moves.at(-1)?.to ?? HUNCH;
  const settled = start + duration + (LAGS - 1) * LAG;
  moves.push({ from, to, start, duration, settled, spread });
  return moves.at(-1)!;
}

// ---------- The sequence (intro time, ms) ----------

/** Between one sentence fully out and the next fading in. */
const GAP = 100;

/** "Sırtını yavaşça düzelt": from the held hunch to standing, the lower back first, starting as the cue starts (owner, 2026-10-31). */
const STRAIGHTEN = move(resolve(POSES.standing), TITLE_IN + TITLE_MS + SENTENCE_FADE + GAP, STRAIGHTEN_MS);
fades.push({ at: STRAIGHTEN.start - LINES_OUT, ms: LINES_OUT, to: 0 });

/** The next sentence after one that starts fading out at `out`. */
const after = (out: number) => out + SENTENCE_FADE + GAP;

/**
 * "Başının tepesinden yukarı uzan" (owner, 2026-10-31): ARM_LEAD before the
 * first cue starts fading (CUE_OUT, as the back has settled), the turn to 45°
 * and the arm up, over the straightening's last moments; the hand is on the
 * crown with all its dots there (its last trail the skeleton by LAGS − 1
 * levels) as that fade ends and this cue starts. It lengthens up from there
 * (no stop) to REACH_TOP and comes down ARM_LEAD before this cue starts fading.
 */
const CUE_OUT = STRAIGHTEN.settled;
const CROWN = CUE_OUT - ARM_LEAD;
const CROWN_CUE = CROWN + ARM_UP;
const TOUCH = CROWN_CUE - (LAGS - 1) * LAG;
const TOP = TOUCH + ARM_RISE;
const HAND = 1.5 * LAG;
const CROWN_CUE_OUT = TOP + HAND + ARM_CUE_HOLD;
move(REACH_TOP, CROWN, TOP - CROWN, { ...ARM_UP_MOTION, via: REACH_TOUCH, viaAt: (TOUCH - CROWN) / (TOP - CROWN) });
const ARM_LOWER = move(resolve(POSES.standing), CROWN_CUE_OUT - ARM_LEAD, ARM_DOWN, ARM_DOWN_MOTION);

/** "Derin bir nefes al" once she is back at 70°, arms down and still, as the crown cue's fade-out ends; "Yavaşça nefes ver" after it. Each breath starts as its cue is fully shown. */
const BREATH_IN = ARM_LOWER.settled;
const INHALE = { at: BREATH_IN + SENTENCE_FADE, ms: BREATH_MS };
const BREATH_OUT = after(INHALE.at + INHALE.ms);
const EXHALE = { at: BREATH_OUT + SENTENCE_FADE, ms: BREATH_MS };

/** The view's turns in the intro: to 45° for the reach, back to 70° as the arm comes down. */
const TURNS = [
  { at: CROWN, to: REACH_YAW },
  { at: ARM_LOWER.start, to: YAW },
];

/** A shape she takes: a pose seen at a view. */
export interface Shape {
  pose: Resolved;
  yaw: number;
}

/**
 * The room she needs (owner's review, 2026-10-26: the ring is sized to her,
 * ../home-intro/dotScene.ts): the hunch first; then from each `at`, over
 * `ms`, the room of another shape (the ring growing a little ahead of the
 * straightening). Over REACH_SPAN the ring follows the arm itself (owner,
 * 2026-10-26): from the arm leaving her side to its last dots back down.
 */
export const ROOM_START: Shape = { pose: HUNCH, yaw: YAW };
export const ROOMS: readonly (Shape & { at: number; ms: number })[] = [{ at: STRAIGHTEN.start, ms: STRAIGHTEN.duration, pose: resolve(POSES.standing), yaw: YAW }];
export const REACH_SPAN = { at: CROWN, ms: ARM_LOWER.settled - CROWN };
/** Her size is set by this shape's room: the reach's former top, so her size stays as it was. */
export const SIZE_SHAPE: Shape = { pose: REACH_ROOM, yaw: REACH_YAW };

/** A move's pose at time `local`, written into `out`. */
function moveAt(move: Move, local: number, out: Resolved) {
  if (local <= move.start) out.set(move.from);
  else if (typeof move.spread === 'number') cascade(move.from, move.to, (local - move.start) / move.duration, out, move.spread);
  else armMove(move.from, move.to, move.spread, (local - move.start) / move.duration, out);
}
const overlap: Resolved = resolve({});

/**
 * The figure's pose at time t for a lag level (0 leads, LAGS − 1 trails the
 * most), written into `out`.
 */
export function poseAt(t: number, level: number, out: Resolved) {
  const local = t - level * LAG;
  const n = moves.findIndex((m) => local < m.start + m.duration);
  if (n < 0) out.set(moves[moves.length - 1].to);
  else {
    moveAt(moves[n], local, out);
    // A move that starts before the last has ended adds to it (the arm, over the straightening's last moments).
    const next = moves[n + 1];
    if (next && local > next.start) {
      moveAt(next, local, overlap);
      for (let k = 0; k < out.length; k++) out[k] += overlap[k] - next.from[k];
    }
  }
  // The breath's part on the skeleton, with the follow-through.
  const breath = breathAt(local);
  if (breath > 0) for (let k = 0; k < out.length; k++) out[k] += BREATH_POSE[k] * breath;
  return out;
}

/** True while any dot is moving at time t. */
export const movingAt = (t: number) => moves.some((m) => t > m.start && t < m.settled);

/** The lines' opacity at time t, 0 … 1: in at the start, which is a settled pose. */
export function lineAlphaAt(t: number) {
  let alpha = 1;
  for (const fade of fades) {
    if (t <= fade.at) break;
    const u = Math.min(1, (t - fade.at) / fade.ms);
    alpha += (fade.to - alpha) * u;
  }
  return alpha;
}

/** The viewing angle at time t (degrees): the approved 70°, turned to 45° for the reach and back. */
export function yawAt(t: number) {
  let yaw = YAW;
  for (const turn of TURNS) yaw += (turn.to - yaw) * smooth((t - turn.at) / turnMs(turn.to - yaw));
  return yaw;
}

/** The breath at time t: 0 at rest, 1 a full breath in (the body and the ring together). */
export const breathAt = (t: number): number => ease((t - INHALE.at) / INHALE.ms) * (1 - ease((t - EXHALE.at) / EXHALE.ms));

// ---------- The sentences ----------

/** When a sentence is shown: it fades in from `in` and out from `out`, over SENTENCE_FADE ms, or over `outMs` where a movement fills its fade-out. */
interface SentenceTiming {
  in: number;
  out: number;
  outMs?: number;
}

/**
 * One timing per sentence, in order: the title, then each cue; the last one
 * stays. Only one is ever on screen: each has faded out before the next fades
 * in. A movement starts with its cue; the arm's moves up to the crown and back
 * down start just before the fade-outs and end with them, right before the
 * next cue (owner, 2026-10-31).
 */
export const sentenceTrack: readonly SentenceTiming[] = [
  { in: TITLE_IN, out: TITLE_IN + TITLE_MS }, // the title, as she appears; gone just before she starts to straighten
  { in: STRAIGHTEN.start, out: CUE_OUT, outMs: CROWN_CUE - CUE_OUT }, // straighten your back: with the movement; fades as the arm goes up, gone as it arrives
  { in: CROWN_CUE, out: CROWN_CUE_OUT, outMs: ARM_LOWER.settled - CROWN_CUE_OUT }, // reach up through the crown: as the hand is on it; fades as the arm comes down, gone as it arrives
  { in: BREATH_IN, out: INHALE.at + INHALE.ms }, // breathe in: until the breath is full
  { in: BREATH_OUT, out: Infinity }, // breathe out: to the end
];

/** The intro's end: the breath out has finished, the rib cage and the ring back to rest. */
export const END = EXHALE.at + EXHALE.ms;

/** A view change of `degrees` takes this long, eased with `smooth` (the prototype's turn). */
export const turnMs = (degrees: number) => 420 + 5 * Math.abs(degrees);
export const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

/**
 * CSS's cubic-bezier(0.45, 0, 0.25, 1), the two-character intro's sentence ease
 * (../ritual/intro/pose.ts), computed the same way, so bit for bit the same.
 * Also the homepage intro's (../home-intro/dotScene.ts): importing it from
 * pose.ts would bring the two-character intro's timeline into that bundle.
 */
export function ease(x: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  const slope = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s ** 2;
  let s = x;
  for (let i = 0; i < 8; i++) {
    const d = slope(0.45, 0.25, s);
    if (Math.abs(d) < 1e-6) break;
    s -= (bez(0.45, 0.25, s) - x) / d;
  }
  return bez(0, 1, Math.min(1, Math.max(0, s)));
}

/** A sentence's opacity at time t, 0 … 1. */
export function sentenceOpacity(sentence: number, t: number) {
  const timing = sentenceTrack[sentence];
  if (!timing) return 0;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return ease(clamp((t - timing.in) / SENTENCE_FADE)) * (1 - ease(clamp((t - timing.out) / (timing.outMs ?? SENTENCE_FADE))));
}
