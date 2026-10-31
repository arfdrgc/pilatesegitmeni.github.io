// A staggered, part-by-part 2D turn from the female's side view to her front
// view, using only the existing artwork and joints (plan step 4a, a dev-only
// test until the owner approves it). People turn head first: the head and
// neck lead, then the shoulders, chest and arms, then the waist and hips, then
// the legs, and the feet last, each part overlapping the next. Each part is a
// joint's own drawing (its nested joints excluded); while it turns, both its
// views take the same horizontal place and width, moving from the side
// view's to the front view's, so they coincide as the front view fades in on
// top and the side view fades out below it. The arms move as whole limbs: the
// front view's two arms come out from where the side view's one arm hangs.
// Nothing is redrawn: only transforms and opacities of the existing groups.
import { ease } from '../ritual/intro/pose';

/** The turn's length (ms), approved as about 3 s (owner, 2026-10-24). */
export const TURN_MS = 3000;

/** The turn's parts, in order: when each starts and how long it takes (ms). */
const PHASES: readonly { joints: readonly string[]; at: number; ms: number }[] = [
  { joints: ['head', 'c2-c1', 'c4-c3', 'c7-c5'], at: 0, ms: 1300 },
  { joints: ['t3-t1', 't6-t4', 'arm'], at: 450, ms: 1400 },
  { joints: ['t9-t7', 't12-t10', 'l1', 'l3-l2', 'l5-l4', 'pelvis'], at: 900, ms: 1400 },
  { joints: ['hip', 'knee'], at: 1350, ms: 1350 },
  { joints: ['ankle'], at: 1650, ms: 1350 },
];

/**
 * Within a part's turn (its eased progress): the front view fades in over
 * this stretch, and the side view fades out just after it, early, before it
 * is stretched much towards the front view's width (stretched, its suit edges
 * show as spikes and its outline thickens).
 */
const FRONT_IN = [0.15, 0.4] as const;
const SIDE_OUT = [0.35, 0.55] as const;

const SVG = 'http://www.w3.org/2000/svg';
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type View = 'side' | 'front';

/** One instance of a part in one view: what is moved, and its horizontal extent on the stage at rest. */
interface Piece {
  el: SVGGElement;
  /** Stage ← the moved element's parent. */
  toStage: DOMMatrix;
  left: number;
  right: number;
}

/** A part's side piece and front piece, which turn together. */
interface Pair {
  phase: number;
  side: Piece;
  front: Piece;
}

const isArm = (el: Element) => el.matches('.limb.arm') || !!el.querySelector(':scope > .limb.arm');

/**
 * The part of each joint that turns with it: its own drawing, gathered into
 * a new group (its nested joints, and the arms, stay where they are). The
 * arms are their own parts: `.limb.arm`, which holds shoulder, elbow and wrist.
 */
function partsOf(view: SVGGElement): Map<string, SVGGElement[]> {
  const parts = new Map<string, SVGGElement[]>();
  const add = (key: string, el: SVGGElement) => parts.set(key, [...(parts.get(key) ?? []), el]);
  for (const joint of view.querySelectorAll<SVGGElement>('g.j')) {
    if (joint.closest('.limb.arm')) continue;
    const id = [...joint.classList].find((c) => c.startsWith('j-'))!.slice(2);
    const own = [...joint.children].filter((child) => !child.matches('.j, clipPath') && !isArm(child));
    if (!own.length) continue;
    const part = document.createElementNS(SVG, 'g');
    part.dataset.turnPart = id;
    joint.insertBefore(part, own[0]);
    part.append(...own);
    add(id, part);
  }
  for (const arm of view.querySelectorAll<SVGGElement>('.limb.arm')) add('arm', arm);
  return parts;
}

/** Stage coordinates ← an element's coordinates. */
const stageFrom = (svg: SVGSVGElement, el: SVGGraphicsElement) =>
  DOMMatrix.fromMatrix(svg.getScreenCTM()!).inverse().multiply(DOMMatrix.fromMatrix(el.getScreenCTM()!));

/** A piece's horizontal extent on the stage: its visible skin and hair, not the suit's clipped areas. */
function piece(svg: SVGSVGElement, el: SVGGElement): Piece {
  let left = Infinity;
  let right = -Infinity;
  for (const shape of el.querySelectorAll<SVGGraphicsElement>('path.skin, path.hair')) {
    const box = shape.getBBox();
    const m = stageFrom(svg, shape);
    for (const [x, y] of [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x, box.y + box.height],
      [box.x + box.width, box.y + box.height],
    ]) {
      const p = m.transformPoint(new DOMPoint(x, y));
      left = Math.min(left, p.x);
      right = Math.max(right, p.x);
    }
  }
  return { el, toStage: stageFrom(svg, el.parentNode as SVGGraphicsElement), left, right };
}

/**
 * Prepares a stage's two views for the turn and returns the function that
 * shows it at a time (ms, 0 to TURN_MS; before 0 the side view, after it the
 * front view). The stage needs `[data-turn-view="side"]` and
 * `[data-turn-view="front"]`, both at rest (no joint transforms) and rendered
 * when this runs, since it measures them.
 */
export function createTurn(svg: SVGSVGElement): (ms: number) => void {
  const views = { side: svg.querySelector<SVGGElement>('[data-turn-view="side"]')!, front: svg.querySelector<SVGGElement>('[data-turn-view="front"]')! };
  const parts: Record<View, Map<string, SVGGElement[]>> = { side: partsOf(views.side), front: partsOf(views.front) };

  // Pair each front piece with a side piece: in order where both views have
  // one (the legs: far ↔ left, near ↔ right), otherwise with the side view's
  // first (the second arm comes out from where the one arm hangs).
  const pairs: Pair[] = [];
  PHASES.forEach(({ joints }, phase) => {
    for (const joint of joints) {
      const sides = parts.side.get(joint) ?? [];
      const fronts = parts.front.get(joint) ?? [];
      fronts.forEach((front, i) => {
        const side = sides[i] ?? sides[0];
        if (side) pairs.push({ phase, side: piece(svg, side), front: piece(svg, front) });
      });
    }
  });

  /** A piece placed with its extent at [left, right] on the stage, as a transform of its own coordinates. */
  const place = (p: Piece, left: number, right: number) => {
    const scale = (right - left) / (p.right - p.left);
    const onStage = new DOMMatrix().translate(left, 0).scale(scale, 1).translate(-p.left, 0);
    const m = p.toStage.inverse().multiply(onStage).multiply(p.toStage);
    p.el.setAttribute('transform', `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((n) => n.toFixed(4)).join(' ')})`);
  };

  return (ms: number) => {
    views.side.style.visibility = ms >= TURN_MS ? 'hidden' : '';
    views.front.style.visibility = ms > 0 ? '' : 'hidden';
    for (const { phase, side, front } of pairs) {
      const { at, ms: length } = PHASES[phase];
      const p = ease(Math.min(1, Math.max(0, (ms - at) / length)));
      const left = side.left + (front.left - side.left) * p;
      const right = side.right + (front.right - side.right) * p;
      place(side, left, right);
      place(front, left, right);
      front.el.style.opacity = String(smoothstep(FRONT_IN[0], FRONT_IN[1], p));
      side.el.style.opacity = String(1 - smoothstep(SIDE_OUT[0], SIDE_OUT[1], p));
    }
  };
}
