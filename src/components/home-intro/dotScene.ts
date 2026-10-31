// The homepage intro with the approved dot figure (2026-10-25) in place of the
// female character: ./HomeIntro.astro with `figure="dots"`, previewed at
// /dev/home-intro/. The same Scene as ./scene.ts (play, pause, scrub both
// ways, one clock). The sequence (owner's revision, 2026-10-26):
// - It opens from a single dot (below, "The opening"): the ring opens, the
//   line draws out at her knees, and the dots spread into the hunch, in the
//   intro's framing (below, "Her place and the ring's size": one size and
//   place for her, the ring sized to her pose).
// - The intro (../dot-figure/timeline.ts, to END), in that framing: the title
//   as she appears, over the held hunch, the back straightening, the reach up at 45°, a
//   breath in (her upper body and the ring together) and a breath out.
// - The ending: the motto comes in and stays as she turns to the front (her
//   own 3D turn) and the view widens to her full body, the ring to the
//   menu's; she rises onto the line, her ground, which stays. Once she stands in the front
//   view, the menu's dots and labels come in together, then Replay under the
//   motto (in the coming-soon line's place and time, owner 2026-10-26) as
//   the stop control goes.
// - The idle is the standing pose, arms hanging (no hands-on-hips pose).
import { breathe, HEIGHT, LAGS, newMatrices, pose, resolve, sampleFigure, skin, type Dots } from '../dot-figure/model';
import { PALETTES } from '../dot-figure/palettes';
import { colours, Stage, type Colours, type Look, type Placement } from '../dot-figure/render';
import { EMERGE_MS, END, LINES_IN, LOOK, REACH_SPAN, ROOM_START, ROOMS, SENTENCE_FADE, SIZE_SHAPE, SETTLE, YAW, breathAt, ease, lineAlphaAt, poseAt, sentenceOpacity, smooth, turnMs, yawAt as introYawAt, type Shape } from '../dot-figure/timeline';
import { LINE_HALF, RING, STAGE } from './geometry';
import type { Scene } from './scene';

/** The menu's framing: the hair 4% of the ring's diameter below its top, the soles as far above its bottom. */
const TOP = RING.cy - RING.r * 0.92;
/** Her floor in the menu's framing, in stage units: the line ends here, as her ground, and stays. */
export const DOT_FLOOR = RING.cy + RING.r * 0.92;
const PLACEMENT: Placement = { scale: (DOT_FLOOR - TOP) / HEIGHT / STAGE, x: RING.cx / STAGE, floor: DOT_FLOOR / STAGE };
/** The menu's view: the front. */
const FRONT = 0;

/** A span of the scene: from `at`, over `ms`. */
interface Span {
  at: number;
  ms: number;
}

/** The breath-out cue, on screen to the end of the intro, fades out as it ends. */
const CUE_OUT: Span = { at: END, ms: SENTENCE_FADE };
/** The motto: in after the cue (100 ms apart, as between the intro's sentences), and it stays. */
const MOTTO_IN: Span = { at: CUE_OUT.at + CUE_OUT.ms + 100, ms: SENTENCE_FADE };
/** With the motto: the turn to the front (the lines are already out), and the view widening to her full body as the line moves down to her feet. */
const TURN: Span = { at: MOTTO_IN.at, ms: turnMs(YAW - FRONT) };
const PULL_BACK: Span = { at: MOTTO_IN.at, ms: 1600 };
/** She stands in the front view, full body, from here: the lines come back once she has settled. */
export const IDLE_AT = Math.max(TURN.at + TURN.ms, PULL_BACK.at + PULL_BACK.ms);
const LINES_ON: Span = { at: IDLE_AT + SETTLE, ms: LINES_IN };
/** The menu is revealed once she has reached the front view's full-body pose. */
const REVEAL_AT = IDLE_AT;
/** Each item's dot and label fade in together, 150 ms after the one before, clockwise. */
const STAGGER = 150;
const ITEM_MS = 300;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Progress through a span, 0 to 1, eased (slow in, long settle: the intro's own curve). */
const eased = (t: number, { at, ms }: Span) => ease(clamp01((t - at) / ms));
/** The lines fade linearly, as in the prototype. */
const linear = (t: number, { at, ms }: Span) => clamp01((t - at) / ms);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** The view at intro time i: the intro's (70°, 45° for the reach) until the turn, then the front. */
const yawAt = (i: number) => (i < TURN.at ? introYawAt(i) : lerp(YAW, FRONT, smooth((i - TURN.at) / TURN.ms)));
/** A full breath in widens the ring this much about its centre, with her (owner, 2026-10-26: clearly visible, still restrained; was 0.05). */
const RING_BREATH = 0.12;

/** The lines' opacity at intro time i: the intro's (in over the hunch only), then back in the front view. */
const linesAt = (i: number) => (i <= END ? lineAlphaAt(i) : linear(i, LINES_ON));

// ---------- The opening (owner, 2026-10-25) ----------
// Before the intro's own time starts: a single dot at the centre of the
// hunch's ring. The ring opens from it to its size (the menu's dot waits for
// the reveal), and the line draws out at her knees; the dots spread from the
// centre into the hunched figure, the ring above the line framing her like a
// window. Once she has formed, her lines come in. The intro then runs,
// OPENING ms later.

/** The single dot alone, then the ring opening from it to its size (scene time, as the next three). */
const RING_OPEN: Span = { at: 300, ms: 1100 };
/** The line draws out from its middle to its full length as the ring arrives. */
const LINE_DRAW: Span = { at: 800, ms: 900 };
/** The dots spread from the centre into the figure, the nearest first. */
const EMERGE: Span = { at: 300, ms: EMERGE_MS };
/** Each dot's own way out, as a share of EMERGE; the starts spread over the rest. */
const TRAVEL = 0.55;
/** How far from the centre (model units) the last dots to leave are bound. */
const REACH = 50;
/** How far below their places (model units) the dots under the line start. */
const RISE = 12;
/** Once she has formed, her lines fade in, as after any settled pose. */
const LINES_FORM: Span = { at: EMERGE.at + EMERGE.ms, ms: LINES_IN };
/** The intro's own time starts here: 2500 ms. The title starts before it, with EMERGE (../dot-figure/timeline.ts). */
export const OPENING = LINES_FORM.at + LINES_FORM.ms;
/** Below the line nothing shows; this far below it (stage units, at the full body) the soles' dots are kept whole. */
const CLIP_MARGIN = 10;

// ---------- Her place and the ring's size (owner's review, 2026-10-26) ----------
// She keeps one size and one place through the intro, her knees on the line
// (the line is where her feet stand with the menu, and never moves), with no
// zoom. The ring is sized to her instead: it rests on the line under her and
// grows up from it, like a dome on the ground, to the room each shape needs,
// easing with her movements (ROOMS in ../dot-figure/timeline.ts); through
// the reach it follows the arm itself (frameReach). Her size is set by the
// reach's former top (SIZE_SHAPE), as before the reach was corrected.
// With the pull-back she shrinks to the menu's size and rises onto the line,
// and the ring comes to the menu's.

/** Her knees (model units): on the line through the intro. */
const KNEE = 47.5;
/**
 * The ring's size k (1 the menu's) grows from the line, about the point under
 * her: radius RING.r × k, centre DOT_FLOOR − FIT × k. The menu's clearance,
 * the figure inside 92% of the radius (4% of the diameter at her head), is
 * then a circle of radius FIT × k resting on the line at that point.
 */
const FIT = DOT_FLOOR - RING.cy;
/** The ring at its largest, for the raised hand: a little more than the menu's, its top still inside the stage. */
const RING_MAX = 1.03;
/** Dots this close above the line (model units, her thighs) are left out of the fit: the ring is wider there than the fit's circle. */
const FIT_ABOVE = 10;

interface Framing {
  /** Her size through the intro, stage units per model unit. */
  scale: number;
  /** The ring's size for the hunch (ROOM_START), then for each of ROOMS. */
  start: number;
  rooms: number[];
  /** The ring's size through the reach, every REACH_STEP ms of REACH_SPAN (frameReach). */
  reach: Float64Array;
}

/**
 * The room a shape needs, in model units: the radius of the smallest circle
 * resting on the line at her axis that holds her above the line.
 */
function roomOf(dots: Dots, { pose: p, yaw }: Shape) {
  const pos = new Float64Array(dots.count * 3);
  skin(dots, Array.from({ length: LAGS }, () => pose(p)), pos);
  return roomIn(dots, pos, yaw);
}

/** The room the dots at `pos` (posed, model units) need, seen at `yaw`. */
function roomIn(dots: Dots, pos: Float64Array, yaw: number) {
  const c = Math.cos((yaw * Math.PI) / 180);
  const s = Math.sin((yaw * Math.PI) / 180);
  let room = 0;
  for (let i = 0; i < dots.count; i++) {
    const h = pos[i * 3 + 1] - KNEE;
    if (h < FIT_ABOVE) continue;
    const x = pos[i * 3] * c + pos[i * 3 + 2] * s;
    room = Math.max(room, (x * x + h * h) / (2 * h));
  }
  return room;
}

/** Her size, from SIZE_SHAPE's room, and the ring's size for each shape and through the reach. */
function frameIntro(dots: Dots): Framing {
  const scale = (RING_MAX * FIT) / roomOf(dots, SIZE_SHAPE);
  const size = (shape: Shape) => (scale * roomOf(dots, shape)) / FIT;
  return { scale, start: size(ROOM_START), rooms: ROOMS.map(size), reach: frameReach(dots, scale) };
}

/** The reach's sampling step (ms), and how far ahead and behind (ms) the ring takes the arm's room into account. */
const REACH_STEP = 100;
const REACH_LEAD = 250;

/**
 * The ring through the reach (owner, 2026-10-26: it grows as the hand rises
 * from the crown, frames the raised hand with room to spare, and shrinks
 * as the arm comes down, smoothly, never late): the room the arm needs,
 * measured on the dots as drawn (every lag level) every REACH_STEP ms, made
 * to rise once to its largest and fall once (no growing and shrinking as
 * the hand sweeps over the head and onto it), then widened by REACH_LEAD
 * ahead and behind and averaged over the same span, which keeps it at least
 * as large as the arm needs at every moment, and a little early. Measured
 * once per page with the figure (about 80 poses).
 */
function frameReach(dots: Dots, scale: number) {
  const n = Math.ceil(REACH_SPAN.ms / REACH_STEP) + 1;
  const pos = new Float64Array(dots.count * 3);
  const matrices = Array.from({ length: LAGS }, () => newMatrices());
  const scratch = resolve({});
  const need = Array.from({ length: n }, (_, j) => {
    const t = REACH_SPAN.at + j * REACH_STEP;
    for (let level = 0; level < LAGS; level++) pose(poseAt(t, level, scratch), matrices[level]);
    skin(dots, matrices, pos);
    return (scale * roomIn(dots, pos, introYawAt(t))) / FIT;
  });
  // Rising to the largest, then falling: the lower of the most so far from either end.
  const rise = need.map((_, j) => Math.max(...need.slice(0, j + 1)));
  const fall = need.map((_, j) => Math.max(...need.slice(j)));
  const shape = need.map((_, j) => Math.min(rise[j], fall[j]));
  const w = Math.round(REACH_LEAD / REACH_STEP);
  const span = (j: number) => shape.slice(Math.max(0, j - w), j + w + 1);
  const wide = shape.map((_, j) => Math.max(...span(j)));
  return Float64Array.from(wide, (_, j) => {
    const near = wide.slice(Math.max(0, j - w), j + w + 1);
    return near.reduce((a, b) => a + b, 0) / near.length;
  });
}

/** The ring's size at intro time i (before the pull-back): the hunch's, easing to each room's with her movements; through the reach, the arm's. */
function ringAt({ start, rooms, reach }: Framing, i: number) {
  const k = ROOMS.reduce((size, room, n) => lerp(size, rooms[n], ease((i - room.at) / room.ms)), start);
  const at = (i - REACH_SPAN.at) / REACH_STEP;
  if (at <= 0 || at >= reach.length - 1) return k;
  const j = Math.floor(at);
  return Math.max(k, lerp(reach[j], reach[j + 1], at - j));
}
/** The ring's centre height (stage units) at size k. */
const ringY = (k: number) => DOT_FLOOR - FIT * k;

/** Where the dots start, in model units: the ring's centre in the hunch. */
function seedOf({ scale, start }: Framing): readonly [number, number, number] {
  return [0, KNEE + (FIT * start) / scale, 0];
}

/** Where she stands at a framing (0 the intro's, 1 the menu's): the scale shrinks evenly, and she rises from her knees on the line to her feet on it. */
function placementAt({ scale }: Framing, pull: number): Placement {
  if (pull >= 1) return PLACEMENT;
  const size = scale * ((PLACEMENT.scale * STAGE) / scale) ** pull;
  return { scale: size / STAGE, x: PLACEMENT.x, floor: lerp(DOT_FLOOR + KNEE * scale, DOT_FLOOR, pull) / STAGE };
}

/**
 * The dots on their way out of the centre at `u` (0 … 1 through EMERGE): the
 * nearest leave first, with a little scatter. Dots below the line (`under`,
 * its height in model units) rise into place from under it instead, so none
 * crosses the figure on its way down and none half-shows at the line before
 * its time.
 */
function emerge(dots: Dots, pos: Float64Array, seed: ReturnType<typeof seedOf>, under: number, u: number) {
  for (let i = 0; i < dots.count; i++) {
    const k = i * 3;
    const dx = pos[k] - seed[0];
    const dy = pos[k + 1] - seed[1];
    const dz = pos[k + 2] - seed[2];
    const near = Math.min(1, Math.hypot(dx, dy, dz) / REACH);
    const scatter = ((i * 2654435761) >>> 0) / 2 ** 32;
    const p = ease((u - (1 - TRAVEL) * (0.7 * near + 0.3 * scatter)) / TRAVEL);
    if (pos[k + 1] < under) {
      pos[k + 1] -= (1 - p) * RISE;
      continue;
    }
    pos[k] = seed[0] + dx * p;
    pos[k + 1] = seed[1] + dy * p;
    pos[k + 2] = seed[2] + dz * p;
  }
}

// ---------- The figure on a frame's canvas ----------

/** The dense figure, sampled once per page (about 70 ms) and shared by every frame, and the intro's framing. */
let figure: Dots | undefined;
let intro: Framing | undefined;

/** A frame of the figure: intro time `t` (its pose), the view, the lines' opacity, the framing (0 the intro's … 1 the menu's), the dots' way out of the centre (0 … 1, 1 formed) and the breath (0 … 1). */
interface Shot {
  t: number;
  yaw: number;
  lines: number;
  pull: number;
  emerge: number;
  breath: number;
}

interface DotView {
  framing: Framing;
  show(shot: Shot): void;
}

function createDotView(canvas: HTMLCanvasElement): DotView {
  const stage = new Stage(canvas);
  const dots = (figure ??= sampleFigure('dense'));
  const framing = (intro ??= frameIntro(dots));
  const seed = seedOf(framing);
  const pos = new Float64Array(dots.count * 3);
  // One skeleton per follow-through level, each a little behind the last.
  const matrices = Array.from({ length: LAGS }, () => newMatrices());
  const scratch = resolve({});
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
  const fill: Colours = colours(PALETTES.find((p) => p.id === 'clay-sage')!, ground);
  const look: Look = { ...LOOK, lineAlpha: 1 };
  let shown: Shot = { t: 0, yaw: YAW, lines: 1, pull: 0, emerge: 1, breath: 0 };

  function draw() {
    for (let level = 0; level < LAGS; level++) pose(poseAt(shown.t, level, scratch), matrices[level]);
    skin(dots, matrices, pos);
    breathe(dots, pos, shown.breath);
    if (shown.emerge < 1) emerge(dots, pos, seed, KNEE, shown.emerge);
    look.lineAlpha = shown.lines;
    stage.draw(dots, pos, shown.yaw, look, fill, placementAt(framing, shown.pull));
    // Nothing below the line until she is full-body (the SVG's clip doesn't reach the canvas).
    const below = 1 - (DOT_FLOOR + CLIP_MARGIN * shown.pull) / STAGE;
    canvas.style.clipPath = shown.pull < 1 ? `inset(0 0 ${(below * 100).toFixed(3)}% 0)` : '';
    canvas.dataset.drawn = '';
  }

  // The canvas follows the stage's size (and the frame being shown, as a
  // hidden frame has none): the current frame is drawn again at once.
  new ResizeObserver(() => {
    if (stage.resize()) draw();
  }).observe(canvas);
  stage.resize();

  return {
    framing,
    show(shot) {
      shown = shot;
      draw();
    },
  };
}

/** A still frame's figure: the opening once formed (the hunch, in the intro's framing, at the approved 70°, the ring sized to it) or the menu (standing, from the front, full body); lines in. */
export function drawStill(root: HTMLElement, frame: 'opening' | 'idle') {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-dot-figure]');
  if (!canvas) return;
  const view = createDotView(canvas);
  view.show(frame === 'opening' ? { t: 0, yaw: YAW, lines: 1, pull: 0, emerge: 1, breath: 0 } : { t: END, yaw: FRONT, lines: 1, pull: 1, emerge: 1, breath: 0 });
  const ring = root.querySelector<SVGCircleElement>('.intro__ring');
  if (ring && frame === 'opening') {
    ring.setAttribute('r', (RING.r * view.framing.start).toFixed(2));
    ring.setAttribute('cy', ringY(view.framing.start).toFixed(2));
  }
}

// ---------- The live scene ----------

const MAX_STEP = 50;

export function createDotScene(root: HTMLElement): Scene {
  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const qa = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];

  const view = createDotView(q<HTMLCanvasElement>('canvas[data-dot-figure]'));
  const sentences = qa<HTMLElement>('[data-sentence]');
  const slogan = q<HTMLElement>('[data-intro-slogan]');
  const ring = q<SVGCircleElement>('.intro__ring');
  const line = q<SVGLineElement>('[data-intro-line]');
  const items = qa<HTMLElement>('[data-intro-item]');
  const stop = q<HTMLElement>('[data-intro-stop]');
  const replayButton = q<HTMLElement>('[data-intro-replay]');

  // The reveal's end: the last item in. Replay comes after it, when the
  // coming-soon line it replaced did, as the stop control goes.
  const revealEnd = REVEAL_AT + Math.max(0, items.length - 1) * STAGGER + ITEM_MS;
  const REPLAY_IN: Span = { at: revealEnd + 300, ms: SENTENCE_FADE };
  const duration = OPENING + REPLAY_IN.at + REPLAY_IN.ms;

  const opacity = (el: HTMLElement | SVGElement, value: number) => (el.style.opacity = String(Math.round(value * 1000) / 1000));
  /** A control or link: also out of the tab order and the accessibility tree while fully faded. */
  const fade = (el: HTMLElement | SVGElement, value: number) => {
    opacity(el, value);
    el.style.visibility = value > 0 ? 'visible' : 'hidden';
  };

  function apply(t: number) {
    // The opening runs on the scene's time `t`; everything after it on the
    // intro's own time `i`, as before the opening was added.
    const i = t - OPENING;
    const pull = eased(i, PULL_BACK);
    const opened = eased(t, RING_OPEN);

    // The ring, sized to her and resting on the line, opens from its centre
    // and breathes with her about it; with the pull-back it comes to the menu's.
    const breath = breathAt(i);
    const size = lerp(ringAt(view.framing, i), 1, pull);
    const cy = ringY(size);
    ring.setAttribute('r', (RING.r * size).toFixed(2));
    ring.setAttribute('cy', cy.toFixed(2));
    ring.style.transformOrigin = `50% ${((cy / STAGE) * 100).toFixed(3)}%`;
    ring.style.scale = (opened * (1 + RING_BREATH * breath)).toFixed(4);

    // The figure: the intro's pose (standing from END on), the view, the
    // lines (in once she has formed), the pull-back, the way out of the centre.
    view.show({ t: Math.min(i, END), yaw: yawAt(i), lines: i < 0 ? linear(t, LINES_FORM) : linesAt(i), pull, emerge: linear(t, EMERGE), breath });

    // Text: one sentence at a time, the breath-out cue out at the intro's
    // end, then the motto, which stays. Opacity only: the motto is the
    // page's heading and stays available to screen readers.
    sentences.forEach((el, n) => opacity(el, sentenceOpacity(n, i) * (n === sentences.length - 1 ? 1 - eased(i, CUE_OUT) : 1)));
    opacity(slogan, eased(i, MOTTO_IN));

    // The line, her ground: drawn out in the opening at her knees, where
    // her feet stand with the menu; it stays there. Nothing of the ring
    // shows below it.
    const drawn = eased(t, LINE_DRAW);
    const half = LINE_HALF * drawn;
    line.setAttribute('x1', (RING.cx - half).toFixed(2));
    line.setAttribute('x2', (RING.cx + half).toFixed(2));
    line.style.visibility = drawn > 0 ? 'visible' : 'hidden';

    // The menu: hidden through the intro; at the reveal each item's dot and
    // label fade in together, in their places on the ring.
    items.forEach((item, n) => {
      const shown = eased(i, { at: REVEAL_AT + n * STAGGER, ms: ITEM_MS });
      item.style.setProperty('--dot', shown.toFixed(3));
      fade(item.querySelector<HTMLElement>('a')!, shown);
    });

    // The stop control while anything moves, then Replay under the motto.
    const swap = eased(i, REPLAY_IN);
    fade(stop, 1 - swap);
    fade(replayButton, swap);

    scene.onUpdate?.(t);
  }

  let time = 0;
  let playing = false;
  let frame = 0;
  let last = 0;

  function tick(now: number) {
    time = Math.min(duration, time + Math.min(now - last, MAX_STEP) * scene.rate);
    last = now;
    apply(time);
    if (time >= duration) {
      playing = false;
      frame = 0;
      scene.onUpdate?.(time);
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  const scene: Scene = {
    rate: 1,
    duration,
    get time() {
      return time;
    },
    get playing() {
      return playing;
    },
    play() {
      if (playing) return;
      if (time >= duration) time = 0;
      playing = true;
      last = performance.now();
      apply(time);
      frame = requestAnimationFrame(tick);
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      scene.onUpdate?.(time);
    },
    seek(ms) {
      time = Math.min(duration, Math.max(0, ms));
      apply(time);
    },
    replay() {
      scene.pause();
      scene.seek(0);
      scene.play();
    },
  };
  // The first frame at once: the single dot at the centre, no ring, line or text yet.
  apply(0);
  return scene;
}
