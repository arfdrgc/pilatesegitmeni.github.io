// The homepage intro from start to menu, on one clock (plan step 4). The
// first 16 s are the approved intro, applied by the approved player
// (../ritual/intro/controller.ts, used unchanged through its seek()); the
// scene then takes over in the same live frame of ./HomeIntro.astro: the
// slogan, the camera pulling back, the waist line going, the side view
// turning into the front view, hands to hips, and the menu's reveal.
// Everything is a pure function of the scene's time, so it can be played,
// paused and scrubbed both ways. Times are the approved starting
// specification (handoff note, 2026-10-23), in ms, to be tuned after review.
import { createPlayer } from '../ritual/intro/controller';
import { ease } from '../ritual/intro/pose';
import { DURATION, SENTENCE_FADE } from '../ritual/intro/timeline';
import { ANCHOR_X, LINE_HALF, LINE_Y, RING, RING_BOTTOM, STAGE, chordHalf, handsOnHips, pullBack, type Camera } from './geometry';

/** A span of the scene: from `at`, over `ms`. */
interface Span {
  at: number;
  ms: number;
}

/** The breath cue, on screen to the end of the approved intro, fades out as it ends. */
const CUE_OUT: Span = { at: DURATION, ms: SENTENCE_FADE };
/** The slogan: in after the cue (100 ms apart, as between the intro's sentences), held 2.5 s, out. */
const SLOGAN_IN: Span = { at: CUE_OUT.at + CUE_OUT.ms + 100, ms: SENTENCE_FADE };
const SLOGAN_OUT: Span = { at: SLOGAN_IN.at + SLOGAN_IN.ms + 2500, ms: SENTENCE_FADE };
/** The camera pulls back as the slogan fades. */
const PULL_BACK: Span = { at: SLOGAN_OUT.at, ms: 2200 };
/** The line's ends draw back to the ring. */
const LINE_IN: Span = { at: PULL_BACK.at + 200, ms: 500 };
/** The side view becomes the front view. */
const TURN: Span = { at: PULL_BACK.at + 800, ms: 600 };
/** Hands to hips, once the front view is in. */
const HANDS: Span = { at: PULL_BACK.at + 1500, ms: 1300 };
/** The line slides down and closes at the ring's lowest point as her feet arrive. */
const LINE_DOWN: Span = { at: PULL_BACK.at + 1800, ms: 400 };
/** She is still in the idle pose from here; the menu is revealed 2.5 s later. */
export const IDLE_AT = HANDS.at + HANDS.ms;
const REVEAL_AT = IDLE_AT + 2500;
/** Each item's dot grows in 150 ms after the one before, clockwise; its label fades in just after it. */
const STAGGER = 150;
const DOT_MS = 300;
const LABEL_DELAY = 150;
const LABEL_MS = 300;
/** How far the side view narrows as it turns away, and the front view widens from. */
const TURN_WIDTH = 0.96;
/** Her widest extent across both views (her units), and the soft edge of the turn's wipe. */
const FIGURE_X = [95, 210] as const;
const WIPE_EDGE = 30;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Progress through a span, 0 to 1, eased (slow in, long settle: the intro's own curve). */
const eased = (t: number, { at, ms }: Span) => ease(clamp01((t - at) / ms));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export interface Scene {
  play(): void;
  pause(): void;
  seek(ms: number): void;
  replay(): void;
  rate: number;
  readonly time: number;
  readonly playing: boolean;
  readonly duration: number;
  onUpdate?: (time: number) => void;
}

const MAX_STEP = 50;

export function createScene(root: HTMLElement): Scene {
  const player = createPlayer(root);
  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const qa = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];

  const breathCue = qa<HTMLElement>('[data-sentence]').at(-1)!;
  const slogan = q<HTMLElement>('[data-intro-slogan]');
  // Gone since Replay took its place (2026-10-26); the character version keeps its timing.
  const soon = root.querySelector<HTMLElement>('[data-intro-soon]');
  const clip = q<SVGRectElement>('[data-intro-clip]');
  const line = q<SVGLineElement>('[data-intro-line]');
  const side = q<SVGGElement>('[data-intro-view="side"]');
  const front = q<SVGGElement>('[data-intro-view="front"]');
  const sideMask = q<SVGGElement>('[data-intro-mask="side"]');
  const frontMask = q<SVGGElement>('[data-intro-mask="front"]');
  const wipes = qa<SVGLinearGradientElement>('[data-intro-wipe]');
  const arms = (['shoulder', 'elbow', 'wrist'] as const).map((joint) => [joint, qa<SVGGElement>(`[data-intro-view="front"] .j-${joint}`)] as const);
  const items = qa<HTMLElement>('[data-intro-item]');
  const stop = q<HTMLElement>('[data-intro-stop]');
  const replayButton = q<HTMLElement>('[data-intro-replay]');

  // The reveal's end: the last label in. The slogan comes back then, the
  // coming-soon line after it, and Replay takes the stop control's place.
  const revealEnd = REVEAL_AT + Math.max(0, items.length - 1) * STAGGER + LABEL_DELAY + LABEL_MS;
  const SLOGAN_BACK: Span = { at: revealEnd, ms: SENTENCE_FADE };
  const SOON_IN: Span = { at: revealEnd + 300, ms: SENTENCE_FADE };
  const CONTROLS_SWAP: Span = { at: revealEnd, ms: 300 };
  const duration = SOON_IN.at + SOON_IN.ms;

  const opacity = (el: HTMLElement | SVGElement, value: number) => (el.style.opacity = String(Math.round(value * 1000) / 1000));
  /** A control or link: also out of the tab order and the accessibility tree while fully faded. */
  const fade = (el: HTMLElement | SVGElement, value: number) => {
    opacity(el, value);
    el.style.visibility = value > 0 ? 'visible' : 'hidden';
  };

  const place = ({ scale, x, y }: Camera, widthScale = 1) =>
    `translate(${RING.cx} 0) scale(${widthScale.toFixed(4)} 1) translate(${-RING.cx} 0) translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})`;

  let playerAt = -1;

  function apply(t: number) {
    // The approved intro, up to its last frame, which is applied once.
    if (t < DURATION || playerAt < DURATION) {
      playerAt = Math.min(t, DURATION);
      player.seek(playerAt);
    }

    // Text: the breath cue out, the slogan in and out, then back with the
    // menu. Opacity only: the slogan is the page's heading and stays
    // available to screen readers throughout.
    if (t >= DURATION) opacity(breathCue, 1 - eased(t, CUE_OUT));
    opacity(slogan, t < SLOGAN_BACK.at ? eased(t, SLOGAN_IN) * (1 - eased(t, SLOGAN_OUT)) : eased(t, SLOGAN_BACK));
    if (soon) opacity(soon, eased(t, SOON_IN));

    // The camera pulls back; both views share it, each on its own anchor.
    const pull = eased(t, PULL_BACK);
    const turn = eased(t, TURN);
    side.setAttribute('transform', place(pullBack(pull, ANCHOR_X.side), lerp(1, TURN_WIDTH, turn)));
    front.setAttribute('transform', place(pullBack(pull, ANCHOR_X.front), lerp(TURN_WIDTH, 1, turn)));

    // The turn: a soft-edged wipe from her face (right) to her back (left),
    // the front view appearing behind it as the side view goes.
    const turning = t > TURN.at && t < TURN.at + TURN.ms;
    const scale = pullBack(pull, 0).scale;
    const [left, right] = FIGURE_X.map((x) => RING.cx + (x - ANCHOR_X.front) * scale);
    const edge = lerp(right + WIPE_EDGE * scale, left - WIPE_EDGE * scale, turn);
    for (const wipe of wipes) {
      wipe.setAttribute('x1', (edge - (WIPE_EDGE * scale) / 2).toFixed(2));
      wipe.setAttribute('x2', (edge + (WIPE_EDGE * scale) / 2).toFixed(2));
    }
    sideMask.toggleAttribute('mask', false);
    frontMask.toggleAttribute('mask', false);
    if (turning) {
      sideMask.setAttribute('mask', `url(#${sideMask.dataset.maskId})`);
      frontMask.setAttribute('mask', `url(#${frontMask.dataset.maskId})`);
    }
    side.style.visibility = t < TURN.at + TURN.ms ? '' : 'hidden';
    front.style.visibility = t > TURN.at ? 'visible' : '';

    // Hands to hips (the existing hand standing in for the H1 hand).
    const hands = eased(t, HANDS);
    for (const [joint, els] of arms) for (const el of els) el.style.rotate = hands ? `${(handsOnHips[joint] * hands).toFixed(3)}deg` : '';

    // The line: its ends draw back to the ring, then it slides down and
    // closes at the ring's lowest point; everything below it stays hidden.
    const down = eased(t, LINE_DOWN);
    const y = lerp(LINE_Y, RING_BOTTOM, down);
    const half = down ? chordHalf(y) : lerp(LINE_HALF, chordHalf(LINE_Y), eased(t, LINE_IN));
    line.setAttribute('x1', (RING.cx - half).toFixed(2));
    line.setAttribute('x2', (RING.cx + half).toFixed(2));
    line.setAttribute('y1', y.toFixed(2));
    line.setAttribute('y2', y.toFixed(2));
    line.style.visibility = down < 1 ? '' : 'hidden';
    clip.setAttribute('height', String(down < 1 ? STAGE + y : 3 * STAGE));

    // The menu: each dot grows in on the ring, then its label fades in.
    items.forEach((item, i) => {
      const at = REVEAL_AT + i * STAGGER;
      const dot = eased(t, { at, ms: DOT_MS });
      item.style.setProperty('--dot', dot.toFixed(3));
      fade(item.querySelector<HTMLElement>('a')!, eased(t, { at: at + LABEL_DELAY, ms: LABEL_MS }));
    });

    // The stop control while anything moves, then Replay in its place.
    const swap = eased(t, CONTROLS_SWAP);
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
  return scene;
}
