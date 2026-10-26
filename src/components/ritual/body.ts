// Builds a character's SVG markup, front or side view, in the
// shared viewBox of ./proportions.ts, from one of the designs in ./characters/.
// Character.astro renders it.
//
// Structure, as nested <g class="j j-*"> joints that can later be rotated
// (each has its pivot as transform-origin, in viewBox units):
//
//   legs: hip → knee → ankle (drawn first, behind the pelvis)
//   pelvis (pivots on the hip joints)
//     → l5-l4 → l3-l2 → l1 → t12-t10 → t9-t7 → t6-t4 → t3-t1 → c7-c5 → c4-c3 → c2-c1 → head
//                                                       ↳ arms: shoulder → elbow → wrist
//
// Every outline is a smooth curve through the design's [y, x] keys, sampled by
// height. Each spinal segment is the slice of the torso between two heights
// from ./proportions.ts, pivoting at its lower edge on the spine's curve. In
// the figure, each segment reaches a few units below its edge, under the
// segment beneath, so no gap opens at the back when it bends; in the neutral
// pose the slices read as one body. Limbs are sliced the same way at their
// joints, and every part is drawn in its own joint's coordinates (no transform
// in the neutral pose), so rotating a joint moves everything it carries.
//
// The suit is a second layer on the same segments: the pelvis, every spinal
// segment and each thigh draws its own piece right after its skin, so the suit
// bends with the body and overlaps exactly as the skin does. It is sleeveless:
// the arms, drawn over the torso, come out of its armholes.
//
// Outlines, as in the reference sheets, are open strokes along each slice's
// sides only (never across its cut edges), so the segments still read as one
// body; the suit's are clipped to the suit, so the skin's show elsewhere.
import { designs, type Design, type Keys, type Pt } from './characters';
import { CX, headPivot, pelvis, spine, type CharacterId, type Region } from './proportions';

export type View = 'front' | 'side';
/** `figure` is the character; the diagrams outline or colour the segments. */
export type Mode = 'figure' | 'construction' | 'regions';

/** Height → x. */
type Contour = (y: number) => number;

const r = (n: number) => Math.round(n * 10) / 10;

/** Smooth curve through [y, x] keys (cubic Hermite, flat at local extremes). */
function contour(keys: Keys): Contour {
  const n = keys.length;
  const slope = keys.slice(1).map(([y1, x1], k) => (x1 - keys[k][1]) / (y1 - keys[k][0]));
  const tangent = keys.map((_, k) => {
    if (k === 0) return slope[0];
    if (k === n - 1) return slope[n - 2];
    return slope[k - 1] * slope[k] <= 0 ? 0 : (slope[k - 1] + slope[k]) / 2;
  });
  return (v) => {
    if (v <= keys[0][0]) return keys[0][1];
    if (v >= keys[n - 1][0]) return keys[n - 1][1];
    let k = 0;
    while (v > keys[k + 1][0]) k++;
    const [y0, x0] = keys[k];
    const [y1, x1] = keys[k + 1];
    const h = y1 - y0;
    const t = (v - y0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * x0 + (t3 - 2 * t2 + t) * h * tangent[k] + (-2 * t3 + 3 * t2) * x1 + (t3 - t2) * h * tangent[k + 1]
    );
  };
}

/** Points [x, y] along a contour from one height to another, inclusive. */
function along(f: Contour, from: number, to: number, step = 2): Pt[] {
  const points: Pt[] = [];
  const dir = Math.sign(to - from) || 1;
  for (let v = from; dir * (to - v) > 0; v += dir * step) points.push([f(v), v]);
  points.push([f(to), to]);
  return points;
}

const poly = (points: readonly Pt[]) => `M${points.map(([x, v]) => `${r(x)} ${r(v)}`).join('L')}Z`;
const line = (points: readonly Pt[]) => `M${points.map(([x, v]) => `${r(x)} ${r(v)}`).join('L')}`;

/** The region between two contours, from one height down to another. */
const slice = (left: Contour, right: Contour, top: number, bottom: number) =>
  poly([...along(left, top, bottom), ...along(right, bottom, top)]);

/** A slice's two sides as open strokes: its outline without the cut edges. */
const sides = (cls: string, left: Contour, right: Contour, top: number, bottom: number) =>
  `<path class="${cls}" d="${line(along(left, top, bottom))}${line(along(right, top, bottom))}"/>`;

const shape = (cls: string, d: string) => `<path class="${cls}" d="${d}"/>`;

function joint(id: string, [px, py]: Pt, body: string, cls?: string) {
  const classes = ['j', `j-${id}`, cls].filter(Boolean).join(' ');
  return (
    `<g class="${classes}" style="transform-origin:${r(px)}px ${r(py)}px">` +
    body +
    `<circle class="pivot" cx="${r(px)}" cy="${r(py)}" r="1.6"/></g>`
  );
}

/** Mirror image of the front view's left half, across the centre line. */
const mirrored = (body: string) => `<g transform="translate(${2 * CX} 0) scale(-1 1)">${body}</g>`;

// ---------- Per-character geometry ----------

interface Geometry {
  design: Design;
  /** Torso and neck: left and right edge by height. */
  left: Record<View, Contour>;
  right: Record<View, Contour>;
  /** The spine's pivots by height (side view; the centre line from the front). */
  spineX: Record<View, Contour>;
  /** The suit's area per view (its top edge, and open far down and sideways) and the height below which it covers a whole segment. */
  suit: Record<View, { d: string; fullBelow: number }>;
}

const FAR = 600;

// How deep the spine sits between the back (0) and the front (1) of the side
// view: further forward in the neck, close to the back in the rib cage.
const spineDepth = contour([[80, 0.4], [100, 0.36], [115, 0.25], [140, 0.18], [180, 0.2], [205, 0.26], [230, 0.3]]);

const geometries = new Map<CharacterId, Geometry>();

function geometry(id: CharacterId): Geometry {
  const cached = geometries.get(id);
  if (cached) return cached;
  const design = designs[id];
  const half = contour(design.front.halfWidth);
  const back = contour(design.side.back);
  const front = contour(design.side.front);
  const edge = design.front.suitEdge;
  const armpit = Math.max(...edge.map(([, v]) => v));
  const mirror = ([x, v]: Pt): Pt => [2 * CX - x, v];
  const neck = design.side.neckline;
  const g: Geometry = {
    design,
    left: { front: (v) => CX - half(v), side: back },
    right: { front: (v) => CX + half(v), side: front },
    spineX: { front: () => CX, side: (v) => back(v) + spineDepth(v) * (front(v) - back(v)) },
    suit: {
      front: {
        d: poly([[20, FAR], [20, armpit], ...edge, ...[...edge].reverse().map(mirror), [280, armpit], [280, FAR]]),
        fullBelow: armpit,
      },
      side: {
        d: poly([[20, FAR], [20, neck[0][1]], ...neck, [280, neck[neck.length - 1][1]], [280, FAR]]),
        fullBelow: Math.max(...neck.map(([, v]) => v)),
      },
    },
  };
  geometries.set(id, g);
  return g;
}

/** How far each segment reaches under the one below it, in the figure. */
const OVERLAP = 4;
/** The segment that carries the shoulders and arms. */
const shoulderSegment = spine.findIndex((seg) => seg.id === 't3-t1');
const topOf = (i: number) => spine[i + 1]?.y ?? headPivot;

/** Where each region and segment sits in the side view, for diagram labels. */
export function sideLayout(id: CharacterId) {
  const g = geometry(id);
  return {
    front: g.right.side,
    back: g.left.side,
    regions: [
      { region: 'cervical', top: headPivot, bottom: spine.find((s) => s.region === 'cervical')!.y },
      { region: 'thoracic', top: spine.find((s) => s.region === 'cervical')!.y, bottom: spine.find((s) => s.region === 'thoracic')!.y },
      { region: 'lumbar', top: spine.find((s) => s.region === 'thoracic')!.y, bottom: pelvis.top },
      { region: 'pelvis', top: pelvis.top, bottom: pelvis.bottom },
    ] as { region: Region; top: number; bottom: number }[],
    segments: spine.map((seg, i) => ({ id: seg.id, top: topOf(i), bottom: seg.y })),
  };
}

/** Measured proportions of a character in heads, for the sheet. */
export function proportionsOf(id: CharacterId, unit: number) {
  const { front } = designs[id];
  const armOuter = contour(front.arm.a);
  const half = contour(front.halfWidth);
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => from + k);
  const shoulders = 2 * (CX - Math.min(...range(front.arm.top + 4, 170).map(armOuter)));
  const hips = 2 * Math.max(...range(225, front.crotch).map(half));
  const waist = 2 * Math.min(...range(170, 215).map(half));
  return { shoulders: shoulders / unit, waist: waist / unit, hips: hips / unit };
}

// ---------- Rendering ----------

interface Ctx {
  g: Geometry;
  view: View;
  mode: Mode;
  /** Prefix for this render's ids: a page can show the character many times. */
  ids: string;
}

/** Clip paths (and the brows, used twice) shared by one render. */
function defs({ g, view, ids }: Ctx) {
  const head = g.design.paths.head[view];
  const face = view === 'side' ? `<clipPath id="${ids}-faceline"><rect x="${g.design.side.faceLineFrom}" y="0" width="200" height="200"/></clipPath>` : '';
  return (
    `<defs><clipPath id="${ids}-suit"><path d="${g.suit[view].d}"/></clipPath>${face}` +
    `<path id="${ids}-brows" d="${head.brows}"/></defs>`
  );
}

/** A layered fill: the same shape drawn once per class. */
const layers = (ids: string, part: string, classes: string[]) =>
  classes.map((cls) => `<use href="#${ids}-${part}" class="${cls}"/>`).join('');

function head(ctx: Ctx) {
  const { g, view, ids } = ctx;
  const h = g.design.paths.head;
  const hair = shape('hair', h[view].hair);
  const brows = layers(ids, 'brows', ['brow brow-1', 'brow brow-2']);
  const features = (f: { nose: string; mouth: string; lowerLip: string }) =>
    brows + shape('eyes', h[view].eyes) + shape('detail', f.nose) + shape('lip', f.mouth) + shape('detail', f.lowerLip);
  const parts =
    view === 'side'
      ? shape('shade', h.side.chinShadow) +
        shape('skin', h.side.face) +
        `<path class="line" d="${h.side.face}" clip-path="url(#${ids}-faceline)"/>` +
        hair +
        shape('skin line-closed', h.side.ear) +
        shape('detail', h.side.earDetail) +
        features(h.side)
      : // The ears sit behind the face, which hides where they are cut, and in
        // a notch of the hair, which leaves them visible.
        shape('shade', h.front.chinShadow) +
        shape('skin line-closed', h.front.ears) +
        shape('detail', h.front.earDetail) +
        shape('skin line-closed', h.front.face) +
        hair +
        shape('detail', h.front.noseBridge) +
        features(h.front);
  return joint('head', [g.spineX[view](headPivot), headPivot], parts, 'headpart');
}

function suitPiece({ g, view }: Ctx, segment: string, cls: string, top: number, clipId: string) {
  const area = g.suit[view];
  if (top >= area.fullBelow) return shape(`suit ${cls}`, segment);
  return (
    `<clipPath id="${clipId}"><path d="${segment}"/></clipPath>` +
    `<path class="suit ${cls}" d="${area.d}" clip-path="url(#${clipId})"/>` +
    // The suit's own edges (neckline, armholes) where they cross this segment.
    `<path class="suit-line" d="${area.d}" clip-path="url(#${clipId})"/>`
  );
}

/** Outlines of a slice: in skin, then in the suit's colour where the suit covers it. */
const outlines = ({ ids }: Ctx, left: Contour, right: Contour, top: number, bottom: number) =>
  sides('line', left, right, top, bottom) + `<g clip-path="url(#${ids}-suit)">${sides('suit-line', left, right, top, bottom)}</g>`;

/** A segment's outline, shown only in the construction diagram. */
const edge = (segment: string) => shape('edge', segment);

function spineMark({ g, view }: Ctx, top: number, bottom: number) {
  if (view !== 'side') return '';
  return shape('mark', line(along(g.spineX.side, bottom - 2.2, top + 2.2, 1)));
}

/** The spinal segments, nested from the lowest up, ending with the head. */
function spineChain(ctx: Ctx, i = 0): string {
  const { g, view, mode, ids } = ctx;
  const seg = spine[i];
  const top = topOf(i);
  const bottom = seg.y + (mode === 'figure' ? OVERLAP : 0);
  const cls = `band band--${seg.region}${i % 2 ? ' band--alt' : ''}`;
  const [left, right] = [g.left[view], g.right[view]];
  const segment = slice(left, right, top, bottom);
  const body =
    shape(`skin ${cls}`, segment) +
    (view === 'front' && seg.id === 't3-t1' ? shape('detail', g.design.paths.collarbones) : '') +
    suitPiece(ctx, segment, cls, top, `${ids}-${seg.id}`) +
    outlines(ctx, left, right, top, bottom) +
    edge(segment) +
    spineMark(ctx, top, seg.y) +
    (i + 1 < spine.length ? spineChain(ctx, i + 1) : head(ctx)) +
    (i === shoulderSegment ? arm(ctx) : '');
  return joint(seg.id, [g.spineX[view](seg.y), seg.y], body);
}

/**
 * The arm (from the front, the figure's right one; the left is its mirror
 * image): upper arm, forearm and hand, each overlapping the next at the joint
 * and drawn after it, so the cut edges don't show; a disc fills the elbow when
 * it bends.
 */
function arm(ctx: Ctx) {
  const { g, view } = ctx;
  const d = g.design[view].arm;
  const [a, b] = [contour(d.a), contour(d.b)];
  const [shoulder, elbow, wrist] = d.pivots;
  const hand = view === 'side' ? shape('skin line-closed', g.design.paths.hand.side) : shape('skin line-closed', g.design.paths.hand.front) + shape('detail', g.design.paths.hand.frontDetail);
  const forearm =
    joint('wrist', wrist, hand) +
    shape('skin', slice(a, b, elbow[1] - 4, wrist[1] + 7)) +
    // The outline stops at the wrist, where the hand's own takes over.
    sides('line', a, b, elbow[1] - 4, wrist[1] + 1);
  const elbowR = (b(elbow[1]) - a(elbow[1])) / 2 - 0.4;
  const upper =
    joint('elbow', elbow, `<circle class="skin" cx="${r(elbow[0])}" cy="${r(elbow[1])}" r="${r(elbowR)}"/>` + forearm) +
    shape('skin', slice(a, b, d.top, elbow[1] + 4)) +
    sides('line', a, b, d.top, elbow[1] + 4);
  const one = `<g class="limb arm">${joint('shoulder', shoulder, upper)}</g>`;
  return view === 'side' ? one : one + mirrored(one);
}

/** A leg: thigh with the suit to the hem, then shin and foot, each over the next. */
function leg(ctx: Ctx) {
  const { g, view } = ctx;
  const d = g.design[view];
  const [a, b] = [contour(d.leg.a), contour(d.leg.b)];
  const [hip, knee, ankle] = d.leg.pivots;
  const top = 226;
  const foot = joint('ankle', ankle, shape('skin line-closed', g.design.paths.foot[view]));
  const shin =
    joint(
      'knee',
      knee,
      foot + shape('skin', slice(a, b, knee[1] - 5, 422)) + sides('line', a, b, knee[1] - 5, 418) + shape('detail', d.ankleBone),
    );
  const hem = d.hem;
  const thigh =
    shape('skin', slice(a, b, top, knee[1] + 5)) +
    sides('line', a, b, hem, knee[1] + 5) +
    shape('suit', slice(a, b, top, hem)) +
    sides('suit-line', a, b, top, hem) +
    shape('suit-line', line([[a(hem), hem], [b(hem), hem]])) +
    shape('detail', d.kneecap);
  return joint('hip', hip, shin + thigh);
}

function pelvisShape({ g, view }: Ctx) {
  const [left, right] = [g.left[view], g.right[view]];
  if (view === 'side') return slice(left, right, pelvis.top, pelvis.bottom);
  // Front: down the hips, then across the crotch, where the legs cover it.
  const c = g.design.front.crotch;
  const bottom = c - 10;
  return poly([
    ...along(left, pelvis.top, bottom),
    [CX - 22, c - 4],
    [CX, c + 1],
    [CX + 22, c - 4],
    ...along(right, bottom, pelvis.top),
  ]);
}

let instances = 0;

export function characterMarkup(id: CharacterId, view: View, mode: Mode = 'figure'): string {
  const ctx: Ctx = { g: geometry(id), view, mode, ids: `ch${++instances}` };
  const { g } = ctx;
  const legs =
    view === 'side'
      ? `<g class="limb far">${leg(ctx)}</g><g class="limb">${leg(ctx)}</g>`
      : `<g class="limb">${leg(ctx)}</g><g class="limb">${mirrored(leg(ctx))}</g>`;
  const pelvisCls = 'band band--pelvis';
  const pelvisD = pelvisShape(ctx);
  const [left, right] = [g.left[view], g.right[view]];
  const hips = view === 'side' ? [pelvis.top, pelvis.bottom] : [pelvis.top, g.design.front.crotch - 10];
  const sacrum = view === 'side' ? shape('mark', line(along(g.spineX.side, pelvis.top + 3, 236, 1))) : '';
  const pelvisJoint = joint(
    'pelvis',
    [view === 'side' ? g.design.side.leg.pivots[0][0] : CX, g.design[view].leg.pivots[0][1]],
    shape(`skin ${pelvisCls}`, pelvisD) +
      shape(`suit ${pelvisCls}`, pelvisD) +
      sides('suit-line', left, right, hips[0], hips[1]) +
      (view === 'front' ? shape('suit-line', g.design.front.crotchLine) : '') +
      edge(pelvisD) +
      sacrum +
      spineChain(ctx),
  );
  return defs(ctx) + legs + pelvisJoint;
}
