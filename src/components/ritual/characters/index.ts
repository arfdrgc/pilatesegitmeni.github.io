// The two characters' designs, recreated from the reference sheets
// in reference_assets/. Each design holds the contours, joint pivots and suit
// edges for both views; ../body.ts turns them into the articulated figure.
//
// Contours are [y, x] keys (front: [y, half-width] for the torso) through which
// body.ts draws smooth curves; they were measured row by row from the
// full-figure views of each reference sheet. Parts hidden in the reference (the
// torso's side under the arms, the top of the thighs under the pelvis, the back
// behind the arm in side view) are drawn plausibly, so nothing is missing when
// a joint turns. Points are [x, y].
import type { CharacterId } from '../proportions';
import { female } from './female';
import { male } from './male';

export type Keys = readonly (readonly [number, number])[];
export type Pt = readonly [number, number];

interface Limb {
  /** Outer or back edge, and inner or front edge, as [y, x] keys. */
  a: Keys;
  b: Keys;
  /** Joint pivots, top down. */
  pivots: readonly [Pt, Pt, Pt];
}

export interface Design {
  id: CharacterId;
  /** Heights labelled on the sheet that differ per character. */
  chin: number;
  fingertips: number;
  front: {
    /** Torso and neck: half-width from the centre line. */
    halfWidth: Keys;
    /** The figure's right arm (viewer's left): outer and inner edge; shoulder, elbow, wrist. */
    arm: Limb & { top: number };
    /** The figure's right leg (viewer's left): outer and inner edge; hip, knee, ankle. */
    leg: Limb;
    crotch: number;
    /** Height of the suit's hem on the thighs. */
    hem: number;
    /**
     * Left half of the suit's top edge: up the armhole from the armpit, over the
     * strap and down the neckline to the centre. Mirrored for the right half.
     */
    suitEdge: readonly Pt[];
    crotchLine: string;
    kneecap: string;
    ankleBone: string;
  };
  side: {
    /** Torso and neck, facing right. */
    back: Keys;
    front: Keys;
    arm: Limb & { top: number };
    leg: Limb;
    hem: number;
    /** The suit's top edge from behind the back to beyond the front: the neckline. */
    neckline: readonly Pt[];
    /** The face's outline is drawn only right of this x (the rest is under hair or the neck). */
    faceLineFrom: number;
    kneecap: string;
    ankleBone: string;
  };
  paths: {
    head: {
      front: Record<'face' | 'ears' | 'earDetail' | 'hair' | 'brows' | 'eyes' | 'nose' | 'noseBridge' | 'mouth' | 'lowerLip' | 'chinShadow', string>;
      side: Record<'face' | 'ear' | 'earDetail' | 'hair' | 'brows' | 'eyes' | 'nose' | 'mouth' | 'lowerLip' | 'chinShadow', string>;
    };
    collarbones: string;
    hand: { front: string; frontDetail: string; side: string };
    foot: { front: string; side: string };
  };
}

export const designs: Record<CharacterId, Design> = { male, female };
