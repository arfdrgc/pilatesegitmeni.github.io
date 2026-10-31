// Dev-only rig adapter (2026-10-24): the new female character's side view
// (../new-character/female-views.ts, unchanged) placed in the approved
// intro rig's joint structure, so the approved player
// (../../components/ritual/intro/controller.ts, unchanged) can move it.
//
// The player turns `.j-<joint>` groups about their transform-origin and, for
// the breath, rewrites the path data of the torso segments' own paths (their
// direct `path` children, the paths of their direct `clipPath`s and of their
// direct `g[clip-path]`s). This builds the same tree as ../../components/
// ritual/body.ts does for the old character:
//
//   legs (static)
//   pelvis → l5-l4 → l3-l2 → l1 → t12-t10 → t9-t7 → t6-t4 → t3-t1 → c7-c5 → c4-c3 → c2-c1 → head
//                                                                ↳ shoulder (the arm, drawn last)
//
// Each piece is the whole, unchanged figure, masked to that piece's region
// (./rig-side.ts, measured on the artwork by character-tracing/tools/rig.py):
// a horizontal band per spinal segment, reaching 4 units under the one below
// as in the rig, the head above its cut, the arm and hand on their own, and
// a hole where the arm lies in the torso, pelvis and legs. Nothing hidden is
// drawn: what lay under a piece on the sheet isn't there when it moves.
//
// Masks, not clip paths: a clip path cuts each layer of a group on its own,
// so at a band's edge the skin under the suit bled through as a light
// hairline even at rest; a mask cuts the group once it is drawn, and where
// two bands overlap the same picture lies under the edge, so it doesn't show.
//
// The legs, pelvis, neck, head and arm pieces reuse one copy of the figure
// (<use>). The seven torso bands below the neck carry their own copies, laid
// out flat, so the breath bends every layer of them together: the fills and
// lines as direct paths of a group the player recognises (`g[clip-path]`, an
// all-covering clip), and the silhouette, suit, hair and arm-hole shapes the
// clips, outlines and masks use in direct clipPaths. So the hole the arm
// leaves moves with the torso in the breath.
import { DETAIL_WIDTH, EDGE_WIDTH, HAIR_EDGE_WIDTH, OUTLINE_WIDTH, bodies, details, drawn, palette } from '../new-character/female-views';
import { headCut, hole, pivots, regions } from './rig-side';

const art = bodies.side;
const marks = drawn.side;

/** The spine's segments from the bottom up (../../components/ritual/proportions.ts), and which bend with the breath. */
const SPINE = ['l5-l4', 'l3-l2', 'l1', 't12-t10', 't9-t7', 't6-t4', 't3-t1', 'c7-c5', 'c4-c3', 'c2-c1'] as const;
const TORSO = new Set<string>(SPINE.slice(0, 7));

type Joint = keyof typeof pivots;
type Region = (typeof regions)[keyof typeof regions];

/** A mask's extent (viewBox units, in its joint's own coordinates): the whole figure, or heights y0 to y1. */
const extent = ([y0, y1] = [-100, 600]) => `maskUnits="userSpaceOnUse" x="90" y="${y0}" width="130" height="${y1 - y0}"`;

/**
 * A piece's mask: its own region, and the strip where it reaches over the
 * piece beneath it, inside the silhouette only (`silhouette`, a clipPath id),
 * so at rest the outline's outer edge is drawn once; less `hole`, if given
 * (markup drawn in black). `span`: the heights it needs, so the browser
 * redraws no more than that when the breath changes it.
 */
const regionMask = (id: string, { own, under }: Region, silhouette: string, hole = '', span?: [number, number]) =>
  `<mask id="${id}" ${extent(span)}>` +
  `<path d="${own}" fill="white" fill-rule="evenodd"/>` +
  (under ? `<g clip-path="url(#${silhouette})"><path d="${under}" fill="white" fill-rule="evenodd"/></g>` : '') +
  hole +
  '</mask>';

const path = (d: string, attrs: string) => (d ? `<path d="${d}" ${attrs}/>` : '');
const LINE = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';

/** The figure as ../new-character/NewCharacter.astro draws it (same layers, same order). */
function figure(id: string) {
  const fill = (layer: 'skin' | 'skinShade' | 'skinShade2' | 'suit' | 'hair') => path(art[layer], `fill="${palette[layer]}"`);
  const mask = (part: 'suit' | 'hair') =>
    `<mask id="${id}-${part}" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="460">` +
    `<path d="${art[part]}" fill="white" stroke="white" stroke-width="${2 * OUTLINE_WIDTH}"/></mask>`;
  const outline = (layer: 'skinLine' | 'suitLine' | 'hairLine', part?: 'suit' | 'hair') =>
    path(art.outline, `stroke="${palette[layer]}" stroke-width="${OUTLINE_WIDTH}"${part ? ` mask="url(#${id}-${part})"` : ''}`);
  const inside = (markup: string) => `<g clip-path="url(#${id}-silhouette)">${markup}</g>`;
  return (
    `<defs>${mask('suit')}${mask('hair')}<clipPath id="${id}-silhouette"><path d="${art.outline}"/></clipPath></defs>` +
    fill('skin') +
    inside(
      fill('skinShade') +
        fill('skinShade2') +
        marks.skin.replaceAll('{id}', id) +
        fill('suit') +
        fill('hair') +
        `<g ${LINE}>` +
        `<g stroke-width="${DETAIL_WIDTH}">${details.map((layer) => path(art[layer], `stroke="${palette[layer]}"`)).join('')}</g>` +
        path(art.suitEdge, `stroke="${palette.suitLine}" stroke-width="${EDGE_WIDTH}"`) +
        path(art.skinEdge, `stroke="${palette.skinLine}" stroke-width="${EDGE_WIDTH}"`) +
        path(art.hairEdge, `stroke="${palette.hairLine}" stroke-width="${HAIR_EDGE_WIDTH}"`) +
        '</g>',
    ) +
    `<g ${LINE}>` +
    outline('skinLine') +
    outline('suitLine', 'suit') +
    outline('hairLine', 'hair') +
    '</g>' +
    inside(marks.over.replaceAll('{id}', id)) +
    marks.free
  );
}

/**
 * A torso band's own copy of the figure, laid out so the breath bends it all:
 * the silhouette, suit and arm-hole shapes in the joint's direct clipPaths (the
 * silhouette's is also the clip; the outlines and the masks <use> them), the
 * fills and lines as direct paths of the band's group. Only what reaches the
 * torso's heights: not the hair or the drawn marks (head, hand, feet), so the
 * breath has less to bend and redraw. `span`: the band's heights, with room.
 */
function bendable(id: string, region: Region, all: string, span: [number, number]) {
  const sil = `clip-path="url(#${id}-sil)"`;
  const source = (name: string, d: string) => `<clipPath id="${id}-${name}"><path id="${id}-${name}-d" d="${d}"/></clipPath>`;
  const mask = (part: 'suit') =>
    `<mask id="${id}-${part}-mask" ${extent(span)}>` +
    `<use href="#${id}-${part}-src-d" fill="white" stroke="white" stroke-width="${2 * OUTLINE_WIDTH}"/></mask>`;
  const outline = (layer: 'skinLine' | 'suitLine', part?: 'suit') =>
    `<use href="#${id}-sil-d" ${LINE} stroke="${palette[layer]}" stroke-width="${OUTLINE_WIDTH}"${part ? ` mask="url(#${id}-${part}-mask)"` : ''}/>`;
  const line = (d: string, colour: string, width: number) => path(d, `${LINE} stroke="${colour}" stroke-width="${width}" ${sil}`);
  return (
    source('sil', art.outline) +
    source('suit-src', art.suit) +
    source('hole', hole) +
    mask('suit') +
    // The band, less the arm's hole (both bent with the band).
    regionMask(`${id}-region`, region, `${id}-sil`, `<use href="#${id}-hole-d" fill="black"/>`, span) +
    `<g clip-path="url(#${all})" mask="url(#${id}-region)">` +
    path(art.skin, `fill="${palette.skin}"`) +
    path(art.skinShade, `fill="${palette.skinShade}" ${sil}`) +
    path(art.skinShade2, `fill="${palette.skinShade2}" ${sil}`) +
    path(art.suit, `fill="${palette.suit}" ${sil}`) +
    details
      .filter((layer) => layer !== 'hairLine')
      .map((layer) => line(art[layer], palette[layer], DETAIL_WIDTH))
      .join('') +
    line(art.suitEdge, palette.suitLine, EDGE_WIDTH) +
    line(art.skinEdge, palette.skinLine, EDGE_WIDTH) +
    outline('skinLine') +
    outline('suitLine', 'suit') +
    '</g>'
  );
}

/** The review overlay inside a joint (moves with it): its pivot, and its band's lower edge. */
function debug(joint: Joint, edge?: number) {
  const [x, y] = pivots[joint];
  return (
    '<g class="nr-debug">' +
    (edge === undefined ? '' : `<line x1="100" x2="200" y1="${edge}" y2="${edge}"/>`) +
    `<circle cx="${x}" cy="${y}" r="1.4"/></g>`
  );
}

const joint = (name: Joint, body: string) => {
  const [x, y] = pivots[name];
  return `<g class="j j-${name}" style="transform-origin:${x}px ${y}px">${body}</g>`;
};

/**
 * The adapted side view, for a `<g data-character="female">`. `id` keeps its
 * ids unique on the page (it can be drawn more than once).
 */
export function adaptedSide(id: string) {
  const region = (name: keyof typeof regions) => `${id}-r-${name}`;
  const piece = (name: keyof typeof regions) => `<g mask="url(#${region(name)})"><use href="#${id}-fig"/></g>`;

  const chain = (i: number): string => {
    const seg = SPINE[i];
    const body =
      (TORSO.has(seg) ? bendable(`${id}-${seg}`, regions[seg], `${id}-all`, [i + 1 < SPINE.length ? pivots[SPINE[i + 1]][1] - 6 : 0, pivots[seg][1] + 10]) : piece(seg)) +
      (i + 1 < SPINE.length ? chain(i + 1) : joint('head', piece('head') + debug('head'))) +
      (seg === 't3-t1' ? joint('shoulder', piece('arm') + `<g class="nr-debug"><path d="${regions.arm.own}"/></g>` + debug('shoulder')) : '') +
      debug(seg, pivots[seg][1]);
    return joint(seg, body);
  };

  return (
    '<defs>' +
    `<g id="${id}-fig">${figure(`${id}-f`)}</g>` +
    `<clipPath id="${id}-all"><rect x="-100" y="-100" width="500" height="700"/></clipPath>` +
    Object.entries(regions)
      .filter(([name]) => !TORSO.has(name))
      .map(([name, r]) => regionMask(region(name as keyof typeof regions), r, `${id}-f-silhouette`))
      .join('') +
    '</defs>' +
    piece('legs') +
    joint('pelvis', piece('pelvis') + chain(0) + debug('pelvis')) +
    // Where the arm lay, and the head's cut, at rest (they don't move).
    `<g class="nr-debug nr-debug--rest"><path d="${hole}"/><path d="${headCut}"/></g>`
  );
}
