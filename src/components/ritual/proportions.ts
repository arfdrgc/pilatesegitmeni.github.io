// Shared proportions for the characters' front and side views.
// Both views of both characters draw in the same 300 × 460 viewBox, so every
// landmark below sits at the same height in each. One head is U units and the
// grid is eight heads tall, from TOP to the soles on FLOOR. The joint heights
// are measured from the two reference sheets in reference_assets/, which agree
// to within a unit or two; what differs between the characters (widths, chin,
// fingertips) lives in ./characters/.

export const U = 50;
export const TOP = 40;
export const FLOOR = TOP + 8 * U;
/** Centre line in the front view, plumb line in the side view. */
export const CX = 150;

/** Height of a point given in heads below the crown. */
export const heads = (h: number) => TOP + h * U;

export type CharacterId = 'male' | 'female';
export const characters: readonly CharacterId[] = ['male', 'female'];

// Joint heights, shared by both views and both characters: elbows at about
// three heads, wrists at about four, the figure's midpoint.
export const y = {
  shoulder: heads(1.48), // shoulder joint: pivot of the arms
  elbow: heads(2.96),
  hip: heads(3.76), // hip joint
  wrist: heads(4.02),
  knee: heads(5.96),
  ankle: heads(7.46),
} as const;

export type Region = 'pelvis' | 'lumbar' | 'thoracic' | 'cervical';

// The pelvis spans from the base of the spine down to the glute fold and
// pivots on the hip joints, so it can tilt over the legs.
export const pelvis = { top: heads(3.36), bottom: heads(4.44) };

// Spinal segments from the bottom up, simplified from 5 lumbar, 12 thoracic
// and 7 cervical vertebrae. Each spans from its own height up to the next
// one's and pivots at its lower edge; the last carries the head.
export const spine: readonly { id: string; region: Exclude<Region, 'pelvis'>; y: number }[] = [
  { id: 'l5-l4', region: 'lumbar', y: pelvis.top },
  { id: 'l3-l2', region: 'lumbar', y: heads(3.12) },
  { id: 'l1', region: 'lumbar', y: heads(2.88) },
  { id: 't12-t10', region: 'thoracic', y: heads(2.64) },
  { id: 't9-t7', region: 'thoracic', y: heads(2.32) },
  { id: 't6-t4', region: 'thoracic', y: heads(2) },
  { id: 't3-t1', region: 'thoracic', y: heads(1.68) }, // carries the shoulders
  { id: 'c7-c5', region: 'cervical', y: heads(1.32) },
  { id: 'c4-c3', region: 'cervical', y: heads(1.14) },
  { id: 'c2-c1', region: 'cervical', y: heads(0.96) },
];

/** Top of the cervical spine: the head's pivot. */
export const headPivot = heads(0.8);

// Labelled on the character sheet, top to bottom.
export const landmarks = ['chin', 'shoulder', 'elbow', 'wrist', 'fingertips', 'knee', 'ankle'] as const;
export type Landmark = (typeof landmarks)[number];
