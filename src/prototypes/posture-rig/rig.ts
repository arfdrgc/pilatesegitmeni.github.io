// Dev-only: the female's side view with a continuous torso and neck, for the
// posture-rig test page (./RigTest.astro). A fork of the side view of
// ../../components/ritual/body.ts, which stays as it is until the owner
// approves this test (2026-10-24, changes A–C):
//
// A. The torso and neck are no longer rigid slices, one per spinal segment,
//    each reaching under the one below it. They are one outline, from the
//    head's pivot down to the glute fold, whose points follow the spine: each
//    point turns with every joint below it, and near a joint by only part of
//    that joint's angle, blending smoothly over a few units, so the outline
//    bends instead of breaking into ledges. The suit, its neckline and the
//    outlines are bent the same way, so they stay on the body. The joints are
//    still the skeleton: nested groups that carry the head and the arm, as in
//    body.ts, turned by the same angles.
// B. A shoulder-blade joint between the top of the rib cage (t3-t1) and the
//    arm: in the slouch it carries the arm forward and a little down (the
//    shoulders rounding forward), and it draws back as the rib cage
//    straightens, just after it.
// C. The pelvis's turn fades out towards the glute fold, where the body meets
//    the thighs, so the buttock never uncovers the thighs; and the thighs'
//    outline starts just above the glute fold, under the pelvis, instead of
//    at the top of the thigh.
//
// The movement is the approved intro's (../../components/ritual/intro/), read
// through its pose functions, unchanged; only the shoulder blade's move is new.
// At rest every transform is nothing and every point is where body.ts puts it.
import { designs, type Keys, type Pt } from '../../components/ritual/characters';
import { breathWidening, ease, poseAt } from '../../components/ritual/intro/pose';
import { smoothstep } from '../../components/ritual/intro/poses';
import { headPivot, pelvis, spine } from '../../components/ritual/proportions';

type Contour = (y: number) => number;

const r = (n: number) => Math.round(n * 10) / 10;
/** Moving points get two decimals, so slow movement doesn't step. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Smooth curve through [y, x] keys (cubic Hermite, flat at local extremes), as in body.ts. */
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

function along(f: Contour, from: number, to: number, step = 2): Pt[] {
  const points: Pt[] = [];
  const dir = Math.sign(to - from) || 1;
  for (let v = from; dir * (to - v) > 0; v += dir * step) points.push([f(v), v]);
  points.push([f(to), to]);
  return points;
}

const poly = (points: readonly Pt[]) => `M${points.map(([x, v]) => `${x} ${v}`).join('L')}Z`;
const line = (points: readonly Pt[]) => `M${points.map(([x, v]) => `${x} ${v}`).join('L')}`;
const rounded = (points: readonly Pt[]) => points.map(([x, v]): Pt => [r(x), r(v)]);
const slice = (left: Contour, right: Contour, top: number, bottom: number) =>
  poly(rounded([...along(left, top, bottom), ...along(right, bottom, top)]));
const sides = (cls: string, left: Contour, right: Contour, top: number, bottom: number) =>
  `<path class="${cls}" d="${line(rounded(along(left, top, bottom)))}${line(rounded(along(right, top, bottom)))}"/>`;
const shape = (cls: string, d: string) => `<path class="${cls}" d="${d}"/>`;

/** How a joint group is moved and turned about its pivot. */
export interface JointMove {
  rotate?: number;
  x?: number;
  y?: number;
}

const css = ({ rotate, x, y }: JointMove = {}) =>
  (rotate ? `;rotate:${Math.round(rotate * 1000) / 1000}deg` : '') + (x || y ? `;translate:${r2(x ?? 0)}px ${r2(y ?? 0)}px` : '');

function joint(id: string, [px, py]: Pt, body: string, move?: JointMove, cls?: string) {
  const classes = ['j', `j-${id}`, cls].filter(Boolean).join(' ');
  return (
    `<g class="${classes}" style="transform-origin:${r(px)}px ${r(py)}px${css(move)}">` +
    body +
    `<circle class="pivot" cx="${r(px)}" cy="${r(py)}" r="1.6"/></g>`
  );
}

// ---------- Geometry ----------

const design = designs.female;
const back = contour(design.side.back);
const front = contour(design.side.front);
// As in body.ts: the spine sits further forward in the neck, close to the back in the rib cage.
const spineDepth = contour([[80, 0.4], [100, 0.36], [115, 0.25], [140, 0.18], [180, 0.2], [205, 0.26], [230, 0.3]]);
const spineX = (v: number) => back(v) + spineDepth(v) * (front(v) - back(v));
const topOf = (i: number) => spine[i + 1]?.y ?? headPivot;

/** A joint of the chain, the pelvis up: its pivot, as body.ts rounds it, and how much of its turn the outline takes at a height. */
interface ChainJoint {
  id: string;
  pivot: Pt;
  share: (y: number) => number;
}

/** C: the pelvis's turn fades out over these heights, down to the glute fold, where the thighs take over. */
export const GLUTE_FADE = [236, pelvis.bottom] as const;
/** A: a joint's turn blends in over at most this far either side of it (viewBox units), and over at most half of either segment it joins. */
export const MAX_BLEND = 6;

const hip = design.side.leg.pivots[0];
const CHAIN: readonly ChainJoint[] = [
  { id: 'pelvis', pivot: [r(hip[0]), r(hip[1])], share: (y) => 1 - smoothstep(GLUTE_FADE[0], GLUTE_FADE[1], y) },
  ...spine.map((seg, i) => {
    const below = i === 0 ? pelvis.bottom - pelvis.top : spine[i - 1].y - seg.y;
    const blend = Math.min(MAX_BLEND, (seg.y - topOf(i)) / 2, below / 2);
    return { id: seg.id, pivot: [r(spineX(seg.y)), seg.y] as Pt, share: (y: number) => 1 - smoothstep(seg.y - blend, seg.y + blend, y) };
  }),
];

/** The spine's line through the torso's and the neck's base pivots, which the breath widens the torso about (as the intro's player does). */
const breathAxis = (() => {
  const pivots = CHAIN.filter(({ id }) => id !== 'pelvis')
    .filter(({ id }) => !['c4-c3', 'c2-c1'].includes(id))
    .map(({ pivot }) => pivot)
    .sort((a, b) => a[1] - b[1]);
  return (y: number) => {
    const next = pivots.findIndex(([, py]) => py >= y);
    if (next <= 0) return pivots[next === 0 ? 0 : pivots.length - 1][0];
    const [[x0, y0], [x1, y1]] = [pivots[next - 1], pivots[next]];
    return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  };
})();

/** A point turned about a pivot, as a CSS rotation turns it (clockwise on screen: forward for a figure facing right). */
function turned([x, y]: Pt, [cx, cy]: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
}

type Angles = Readonly<Record<string, number>>;

/**
 * A point of the outline at rest, where it is in a pose: widened by the
 * breath at its height, then turned by each joint below it, the highest
 * first, as the nested groups turn what they carry, each by the share of its
 * angle the point's height takes.
 */
function posed(point: Pt, angles: Angles, t: number): Pt {
  let [x, y] = point;
  const w = breathWidening('side', y, t);
  if (w) x = breathAxis(y) + (x - breathAxis(y)) * (1 + w);
  let p: Pt = [x, y];
  for (let k = CHAIN.length - 1; k >= 0; k--) {
    const { id, pivot, share } = CHAIN[k];
    const angle = (angles[id] ?? 0) * share(point[1]);
    if (angle) p = turned(p, pivot, angle);
  }
  return p;
}

// The outline's points at rest, one per unit of height, from the head's
// pivot (under the head) down to the glute fold.
const heights = Array.from({ length: pelvis.bottom - headPivot + 1 }, (_, k) => headPivot + k);
const backAtRest = rounded(heights.map((y) => [back(y), y]));
const frontAtRest = rounded(heights.map((y) => [front(y), y]));
/** body.ts draws the skin's outline down to the lowest lumbar segment, 4 units into the pelvis; the pelvis has the suit's outline only. */
const SKIN_LINE_BOTTOM = pelvis.top + 4;
const neckline = design.side.neckline;
/** How far the suit's area reaches beyond the neckline's ends, and down. */
const FAR = 600;

/** The torso's paths in a pose: its shape, its outline in skin and in the suit's colour, and the suit's area. */
export function meshAt(t: number) {
  const angles: Angles = poseAt('female', t);
  const pose = (points: readonly Pt[]) => points.map((p) => posed(p, angles, t)).map(([x, y]): Pt => [r2(x), r2(y)]);
  const backs = pose(backAtRest);
  const fronts = pose(frontAtRest);
  const neck = pose(neckline);
  const [first, last] = [neck[0], neck[neck.length - 1]];
  const skinLine = (points: readonly Pt[]) => line(points.filter((_, k) => heights[k] <= SKIN_LINE_BOTTOM));
  return {
    torso: poly([...backs, ...[...fronts].reverse()]),
    line: skinLine(backs) + skinLine(fronts),
    suitLine: line(backs) + line(fronts),
    suitArea: poly([[r2(first[0] - 100), FAR], [r2(first[0] - 100), first[1]], ...neck, [r2(last[0] + 100), last[1]], [r2(last[0] + 100), FAR]]),
  };
}

export type Mesh = ReturnType<typeof meshAt>;

/** B: the shoulder blade in the slouch, carrying the arm forward and a little down (viewBox units). */
export const SCAPULA_SLOUCH = { x: 2, y: 0.5 } as const;
/** B: it draws back just after the top of the rib cage starts to straighten (t3-t1, 2890 ms), over about as long. */
export const SCAPULA_MOVE = { at: 3050, ms: 1400 } as const;
/** B: its pivot, on the spine at the shoulder joint's height (the joint only moves for now, so the pivot is for later turns). */
const scapulaPivot: Pt = [spineX(design.side.arm.pivots[0][1]), design.side.arm.pivots[0][1]];

/** Every joint's move at time t: the intro's angles, and the shoulder blade. */
export function jointsAt(t: number): Record<string, JointMove> {
  const moves: Record<string, JointMove> = {};
  for (const [id, rotate] of Object.entries(poseAt('female', t))) moves[id] = { rotate };
  const k = 1 - ease(Math.min(1, Math.max(0, (t - SCAPULA_MOVE.at) / SCAPULA_MOVE.ms)));
  moves.scapula = { x: SCAPULA_SLOUCH.x * k, y: SCAPULA_SLOUCH.y * k };
  return moves;
}

// ---------- Rendering ----------

function head(ids: string, moves: Record<string, JointMove>) {
  const h = design.paths.head.side;
  // The female's brows are her hair's colour: one layer (body.ts hides the second).
  const parts =
    shape('shade', h.chinShadow) +
    shape('skin', h.face) +
    `<path class="line" d="${h.face}" clip-path="url(#${ids}-faceline)"/>` +
    shape('hair', h.hair) +
    shape('skin line-closed', h.ear) +
    shape('detail', h.earDetail) +
    `<use href="#${ids}-brows" class="brow brow-1"/>` +
    shape('eyes', h.eyes) +
    shape('detail', h.nose) +
    shape('lip', h.mouth) +
    shape('detail', h.lowerLip);
  return joint('head', [spineX(headPivot), headPivot], parts, moves.head, 'headpart');
}

/** The arm, as in body.ts, carried by the shoulder blade. */
function arm(moves: Record<string, JointMove>) {
  const d = design.side.arm;
  const [a, b] = [contour(d.a), contour(d.b)];
  const [shoulder, elbow, wrist] = d.pivots;
  const forearm =
    joint('wrist', wrist, shape('skin line-closed', design.paths.hand.side), moves.wrist) +
    shape('skin', slice(a, b, elbow[1] - 4, wrist[1] + 7)) +
    sides('line', a, b, elbow[1] - 4, wrist[1] + 1);
  const elbowR = (b(elbow[1]) - a(elbow[1])) / 2 - 0.4;
  const upper =
    joint('elbow', elbow, `<circle class="skin" cx="${r(elbow[0])}" cy="${r(elbow[1])}" r="${r(elbowR)}"/>` + forearm, moves.elbow) +
    shape('skin', slice(a, b, d.top, elbow[1] + 4)) +
    sides('line', a, b, d.top, elbow[1] + 4);
  return joint('scapula', scapulaPivot, `<g class="limb arm">${joint('shoulder', shoulder, upper, moves.shoulder)}</g>`, moves.scapula);
}

/** C: the thigh's outline starts this far above the glute fold, under the pelvis, as the spine's segments overlapped. */
const THIGH_LINE_FROM = pelvis.bottom - 4;

/** A leg, as in body.ts, except where the thigh's outline starts (C). */
function leg() {
  const d = design.side;
  const [a, b] = [contour(d.leg.a), contour(d.leg.b)];
  const [hipPivot, knee, ankle] = d.leg.pivots;
  const top = 226;
  const foot = joint('ankle', ankle, shape('skin line-closed', design.paths.foot.side));
  const shin = joint(
    'knee',
    knee,
    foot + shape('skin', slice(a, b, knee[1] - 5, 422)) + sides('line', a, b, knee[1] - 5, 418) + shape('detail', d.ankleBone),
  );
  const thigh =
    shape('skin', slice(a, b, top, knee[1] + 5)) +
    sides('line', a, b, d.hem, knee[1] + 5) +
    shape('suit', slice(a, b, top, d.hem)) +
    sides('suit-line', a, b, THIGH_LINE_FROM, d.hem) +
    shape('suit-line', line([[r(a(d.hem)), d.hem], [r(b(d.hem)), d.hem]])) +
    shape('detail', d.kneecap);
  return joint('hip', hipPivot, shin + thigh);
}

/** The spine's joints, nested from the pelvis up; c2-c1 carries the head, t3-t1 the shoulder blade and the arm. */
function chain(moves: Record<string, JointMove>, k = 0, ids = ''): string {
  const { id, pivot } = CHAIN[k];
  const inner = k + 1 < CHAIN.length ? chain(moves, k + 1, ids) : head(ids, moves);
  return joint(id, pivot, inner + (id === 't3-t1' ? arm(moves) : ''), moves[id]);
}

let instances = 0;

/**
 * The female's side view in the pose at time t (ms), in the shared 300 × 460
 * viewBox: legs, then the torso's outline (`data-mesh` paths, which the page
 * re-poses), then the joints. Styled by the page as Character.astro styles
 * the approved figure.
 */
export function rigMarkup(t: number): string {
  const ids = `rig${++instances}`;
  const mesh = meshAt(t);
  const moves = jointsAt(t);
  const p = (cls: string, part: keyof Mesh, extra = '') => `<path class="${cls}" data-mesh="${part}" d="${mesh[part]}"${extra}/>`;
  return (
    `<defs><clipPath id="${ids}-suit">${p('', 'suitArea')}</clipPath><clipPath id="${ids}-torso">${p('', 'torso')}</clipPath>` +
    `<clipPath id="${ids}-faceline"><rect x="${design.side.faceLineFrom}" y="0" width="200" height="200"/></clipPath>` +
    `<path id="${ids}-brows" d="${design.paths.head.side.brows}"/></defs>` +
    `<g class="limb far">${leg()}</g><g class="limb">${leg()}</g>` +
    `<g class="rig-torso">` +
    p('skin', 'torso') +
    p('suit', 'torso', ` clip-path="url(#${ids}-suit)"`) +
    // The suit's own edge, the neckline, where it crosses the body.
    p('suit-line', 'suitArea', ` clip-path="url(#${ids}-torso)"`) +
    p('line', 'line') +
    `<g clip-path="url(#${ids}-suit)">${p('suit-line', 'suitLine')}</g>` +
    `</g>` +
    chain(moves, 0, ids)
  );
}

/** Re-poses a figure from rigMarkup() for time t: its outline's paths and its joints' inline transforms. */
export function createRig(figure: SVGGElement) {
  const paths = [...figure.querySelectorAll<SVGPathElement>('[data-mesh]')].map((el) => [el, el.dataset.mesh as keyof Mesh] as const);
  const joints = [...figure.querySelectorAll<SVGGElement>('g.j')].map((el) => [el, [...el.classList].find((c) => c.startsWith('j-'))!.slice(2)] as const);
  return (t: number) => {
    const mesh = meshAt(t);
    for (const [el, part] of paths) el.setAttribute('d', mesh[part]);
    const moves = jointsAt(t);
    for (const [el, id] of joints) {
      const { rotate, x, y } = moves[id] ?? {};
      el.style.rotate = rotate ? `${rotate}deg` : '';
      el.style.translate = x || y ? `${x ?? 0}px ${y ?? 0}px` : '';
    }
  };
}

/** Poses the approved figure (body.ts, rigid slices) by the intro's angles only, for comparison (no breath, no shoulder blade). */
export function createRigidRig(figure: SVGGElement) {
  const joints = [...figure.querySelectorAll<SVGGElement>('g.j')].map((el) => [el, [...el.classList].find((c) => c.startsWith('j-'))!.slice(2)] as const);
  return (t: number) => {
    const angles = poseAt('female', t);
    for (const [el, id] of joints) el.style.rotate = angles[id] ? `${angles[id]}deg` : '';
  };
}
