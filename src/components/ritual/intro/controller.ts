// Plays the intro ritual in a live frame of ../IntroRitual.astro.
// One requestAnimationFrame loop drives a clock, and every frame applies the
// pose and sentence opacities of ./pose.ts at that time: each animated
// joint's rotation, offset and scale as inline styles, each sentence's
// opacity, and, during the breath, the torso's outlines bent by the breath's
// widening (their path data). Before the first frame the frame's own styles
// show the slouched start; from DURATION on, the inline styles are removed and
// every outline has its original path data again, so the characters are the
// approved neutral markup again. The player only touches elements inside its
// root.
import type { View } from '../body';
import { spine, type CharacterId } from '../proportions';
import type { Pivots } from './frontPose';
import { breathWidening, cssOf, sentenceOpacity, transformsAt } from './pose';
import { views } from './poses';
import { DURATION } from './timeline';

/** Every joint the ritual moves; from the front, the arm's shoulder joint twice (mirrored). */
const JOINTS = ['pelvis', ...spine.map((seg) => seg.id), 'head', 'shoulder'];

/** The torso's segments, below the neck: their outlines bend with the breath. */
const TORSO = spine.filter((seg) => seg.region !== 'cervical').map((seg) => seg.id);

/**
 * Every path that draws the torso's segments, as ../body.ts builds them: each
 * segment's skin, suit and suit edges, the clip that fits the suit to it, its
 * outlines in skin and in the suit's colour, and the suit's area, which clips
 * those outlines. Not the arms, the diagrams' hidden marks or anything else.
 */
const OUTLINES = [
  ...TORSO.flatMap((id) => [`.j-${id} > path:not(.edge):not(.mark)`, `.j-${id} > clipPath > path`, `.j-${id} > g[clip-path] > path`]),
  'defs > clipPath[id$="-suit"] > path',
].join(',');

/** An x y pair in path data, as ../body.ts writes it. */
const PAIR = /(-?\d*\.?\d+) (-?\d*\.?\d+)/g;

/** A path that bends with the breath: its original data, cut into the points and the text around them. */
interface Outline {
  el: SVGPathElement;
  rest: string;
  /** The text before each point, and after the last. */
  between: string[];
  /** Each point, with the spine's x at its height, which the breath widens it about. */
  points: { x: number; y: number; xText: string; yText: string; spine: number }[];
  bent: boolean;
}

/**
 * The spine at a height, through the torso's and the neck's pivots: the
 * centre line from the front, the spine's curve from the side.
 */
function spineLine(g: SVGGElement) {
  const pivots = [...TORSO, 'c7-c5']
    .map((id) => g.querySelector<SVGGElement>(`.j-${id}`)!.style.transformOrigin.split(' ').map(parseFloat))
    .sort((a, b) => a[1] - b[1]);
  return (y: number) => {
    const next = pivots.findIndex(([, py]) => py >= y);
    if (next <= 0) return pivots[next === 0 ? 0 : pivots.length - 1][0];
    const [[x0, y0], [x1, y1]] = [pivots[next - 1], pivots[next]];
    return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  };
}

function outlinesOf(g: SVGGElement): Outline[] {
  const spineAt = spineLine(g);
  return [...g.querySelectorAll<SVGPathElement>(OUTLINES)].map((el) => {
    const rest = el.getAttribute('d') ?? '';
    const between: string[] = [];
    const points: Outline['points'] = [];
    let from = 0;
    for (const m of rest.matchAll(PAIR)) {
      between.push(rest.slice(from, m.index));
      const [x, y] = [Number(m[1]), Number(m[2])];
      points.push({ x, y, xText: m[1], yText: m[2], spine: spineAt(y) });
      from = m.index + m[0].length;
    }
    between.push(rest.slice(from));
    return { el, rest, between, points, bent: false };
  });
}

/**
 * Bends a character's torso outlines for time t: each point moves away from
 * the spine at its height by the breath's widening there, so where two
 * segments overlap their outlines move together. Where the widening is 0 a
 * point keeps its original text, and a path with no widening at all gets its
 * original data back.
 */
function bend(outlines: readonly Outline[], view: View, t: number) {
  const widenings = new Map<number, number>();
  const wideningAt = (y: number) => {
    let w = widenings.get(y);
    if (w === undefined) widenings.set(y, (w = breathWidening(view, y, t)));
    return w;
  };
  for (const outline of outlines) {
    if (!outline.points.some((p) => wideningAt(p.y))) {
      if (outline.bent) outline.el.setAttribute('d', outline.rest);
      outline.bent = false;
      continue;
    }
    let d = outline.between[0];
    outline.points.forEach((p, i) => {
      const w = wideningAt(p.y);
      const x = w ? (p.spine + (p.x - p.spine) * (1 + w)).toFixed(2) : p.xText;
      d += `${x} ${p.yText}${outline.between[i + 1]}`;
    });
    outline.el.setAttribute('d', d);
    outline.bent = true;
  }
}

export interface Player {
  /** Plays from the current time, or from the start once finished. */
  play(): void;
  pause(): void;
  /** Shows the frame at a time (ms) without playing. */
  seek(ms: number): void;
  replay(): void;
  /** Playback speed: 1 is real time. */
  rate: number;
  readonly time: number;
  readonly playing: boolean;
  /** Called after every applied frame. */
  onUpdate?: (time: number) => void;
}

/** Longest step the clock takes per frame, so a hidden tab or a stall resumes where it stopped. */
const MAX_STEP = 50;

export function createPlayer(root: HTMLElement): Player {
  const characters = [...root.querySelectorAll<SVGGElement>('[data-character]')].map((g) => ({
    g,
    id: g.dataset.character as CharacterId,
    // The pivots of the character's side view, which the front view's pose is measured on.
    pivots: g.dataset.sidePivots ? (JSON.parse(g.dataset.sidePivots) as Pivots) : undefined,
    joints: JOINTS.map((joint) => [joint, [...g.querySelectorAll<SVGGElement>(`.j-${joint}`)]] as const),
    outlines: outlinesOf(g),
  }));
  const sentences = [...root.querySelectorAll<HTMLElement>('[data-sentence]')];

  let time = 0;
  let playing = false;
  let frame = 0;
  let last = 0;

  function apply(t: number) {
    for (const { g, id, pivots, joints, outlines } of characters) {
      // From now on the inline styles, not the frame's slouched start, set the pose.
      g.dataset.driven = '';
      const pose = transformsAt(id, t, pivots);
      for (const [joint, els] of joints) {
        const css = cssOf(pose[joint]);
        for (const el of els) Object.assign(el.style, css);
      }
      bend(outlines, views[id], t);
    }
    sentences.forEach((el, i) => (el.style.opacity = String(sentenceOpacity(i, t))));
    player.onUpdate?.(t);
  }

  function tick(now: number) {
    time = Math.min(DURATION, time + Math.min(now - last, MAX_STEP) * player.rate);
    last = now;
    apply(time);
    if (time >= DURATION) {
      playing = false;
      frame = 0;
      player.onUpdate?.(time);
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  const player: Player = {
    rate: 1,
    get time() {
      return time;
    },
    get playing() {
      return playing;
    },
    play() {
      if (playing) return;
      if (time >= DURATION) time = 0;
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
      player.onUpdate?.(time);
    },
    seek(ms) {
      time = Math.min(DURATION, Math.max(0, ms));
      apply(time);
    },
    replay() {
      player.pause();
      player.seek(0);
      player.play();
    },
  };
  return player;
}
