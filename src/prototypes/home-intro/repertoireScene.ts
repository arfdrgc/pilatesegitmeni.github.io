// The Repertuar / Repertoire scene (03:00): the Cadillac and the Hanging
// Pull-Up (owner, 2026-10-29). Development preview only, at
// /dev/home-menu/#repertoire and /en/dev/home-menu/#repertoire
// (./HomeIntroPreview.astro), on the menu's idle frame, played by
// ./particleScene.ts (the gathering into the disc, the morph, the hold).
// - The Cadillac in side view, inside the ring (clear of the items on it):
//   a straight, level top bar (owner's review, 2026-10-29: not bent to the
//   ring) on two posts over the padded table on short legs; the trapeze
//   hanging from the top bar on two straps.
// - The Hanging Pull-Up as taught classically: hands on the top bar near its
//   end, ankles pressing into the trapeze, the body long and upside down
//   below it (an upside-down plank), face up; held mid-pull, the elbows
//   bent, the forearms upright under the bar, the chest rising towards it.
//   Her body draws a gentle back-extension arc, its height at the chest:
//   the legs long and level, the feet at the hips' height, the back
//   lengthening up from the hips, the neck and head reaching on towards the
//   item at 03:00, the head a little above the ring's horizontal diameter
//   (owner's reviews, 2026-10-29). The top bar is at her grip's height, so
//   the posts stand as tall as her reach.
// - The Repertuar item is active (its icon as on hover) from the gathering
//   on, through the hold.
import { LAGS, pose, resolve, skin, type Dots } from '../../components/dot-figure/model';
import type { Scene } from '../../components/home-intro/scene';
import { BEGIN, boxOf, capsule, CENTRE, createParticleScene, FOOT_TOP, GRIP, jointAt, pointed, roundBox, type Composition, type Part } from './particleScene';

/** Her size in the scene (model units per unit of her own). */
const SCALE = 0.5;

/** The frame's tubes this thick; its posts this far either side of the centre. */
const TUBE = 1.4;
const POST_X = 54;
/** The table, below the ring's centre: its padded top, its frame and legs. */
const TABLE = { x: 58, top: -23, pad: 7, frame: 4, legs: 15 };
/** The middle of her head: this far right of the ring's centre and this far above it (towards 03:00 on the ring). */
const HEAD_X = 42;
const HEAD_RISE = 4;
/** The middle of her head on her own skeleton (rest space, from the head's pivot). */
const HEAD_MIDDLE: readonly [number, number, number] = [0, 8.5, 2];
/** The whole body's turn about the head (degrees, towards the head rising): none, her own pose sets the line (the legs level, the chest lifted). */
const INCLINE = 0;

/**
 * Mid-pull, with a gentle back extension: the legs level from the hips (the
 * trunk 8° up from them), the spine extending evenly from the lower back to
 * the base of the neck (about 21° in all, the most through the middle of
 * the back), the head tipping forward again (12°) so it reaches on towards
 * 03:00 instead of dropping back; the upper arms raised 48° forwards from
 * hanging (the body upside down), the elbows bent 28° more, so the forearms
 * stand upright under the bar.
 */
const PULL = resolve({ pelvis: 8, L3: -1, L1: -1.5, T12: -2, T10: -2.5, T8: -3, T6: -3, T4: -3, T2: -2.5, C7: -2, head: 12, shoulder: -48, elbow: -28 });

export function compose(dots: Dots): Composition {
  const m = pose(PULL);
  const posed = new Float64Array(dots.count * 3);
  skin(dots, Array.from({ length: LAGS }, () => m), posed);

  // Her own space onto the scene: upside down, face up, the head to the right with its middle at (HEAD_X, HEAD_RISE) from the ring's centre, the body rising INCLINE towards it.
  const head = jointAt(m, 'head', HEAD_MIDDLE);
  const b = (INCLINE * Math.PI) / 180;
  const place = ([x, y, z]: ArrayLike<number> & Iterable<number>) => {
    const along = y - head[1];
    const front = z - head[2];
    return [CENTRE.x + HEAD_X + SCALE * (along * Math.cos(b) - front * Math.sin(b)), CENTRE.y + HEAD_RISE + SCALE * (along * Math.sin(b) + front * Math.cos(b)), SCALE * x];
  };
  // The top bar where her hands hold it.
  const grip = place(jointAt(m, 'handL', GRIP));
  const rail = grip[1];
  const person = new Float64Array(dots.count * 3);
  for (let i = 0; i < dots.count; i++) {
    const [x, y, z] = dots.rest.subarray(i * 3, i * 3 + 3);
    person.set(place(y < FOOT_TOP ? pointed(x, y, z) : posed.subarray(i * 3, i * 3 + 3)), i * 3);
  }

  // The trapeze bar under the backs of her ankles (seen end on), hanging from the top bar on two straps.
  const heel = place(jointAt(m, 'shinL', [0, 0, -2.6]));
  const BAR = 2.6;
  const bar = { x: heel[0] + Math.sin(b) * (BAR + 0.3), y: heel[1] - Math.cos(b) * (BAR + 0.3) };

  const top = CENTRE.y + TABLE.top;
  const parts: Part[] = [
    // The top bar, straight and level, from post to post.
    { sdf: capsule(-POST_X, rail, POST_X, rail, TUBE), box: boxOf(-POST_X, rail, POST_X, rail, TUBE), half: TUBE, depth: [-22, 22], tone: 0, level: 1, density: 1.5 },
    // The posts, from the table up to the top bar.
    ...[-POST_X, POST_X].map((x): Part => ({ sdf: capsule(x, top, x, rail, TUBE), box: boxOf(x, top, x, rail, TUBE), half: TUBE, depth: [-22, 22], tone: 0, level: 1, density: 1.5 })),
    // The table: its padded top (warmer, as the Reformer's carriage), its frame and its legs.
    { sdf: roundBox(-TABLE.x, top - TABLE.pad, TABLE.x, top, 2.2), box: [-TABLE.x, top - TABLE.pad, TABLE.x, top], half: 3.5, depth: [-18, 18], tone: 4, level: 2, density: 1.1 },
    { sdf: roundBox(-TABLE.x, top - TABLE.pad - 1 - TABLE.frame, TABLE.x, top - TABLE.pad - 1, 1.2), box: [-TABLE.x, top - TABLE.pad - 1 - TABLE.frame, TABLE.x, top - TABLE.pad - 1], half: 2, depth: [-22, 22], tone: 0, level: 1, density: 0.9 },
    ...[-TABLE.x + 5, TABLE.x - 5].map((x): Part => {
      const y0 = top - TABLE.pad - 1 - TABLE.frame;
      return { sdf: capsule(x, y0, x, y0 - TABLE.legs, 1.5), box: boxOf(x, y0, x, y0 - TABLE.legs, 1.5), half: 1.5, depth: [-22, 22], tone: 0, level: 1, density: 1.4 };
    }),
    // The trapeze: its bar, seen end on, and its two straps up to the top bar.
    { sdf: (x, y) => Math.hypot(x - bar.x, y - bar.y) - BAR, box: [bar.x - BAR, bar.y - BAR, bar.x + BAR, bar.y + BAR], half: BAR, depth: [-14, 14], tone: 1, level: 2, density: 2.6 },
    ...[-1, 1].map((side): Part => {
      const [x0, y0, x1] = [bar.x + side * 2, bar.y + 1.5, bar.x + side * 6.5];
      const y1 = rail - TUBE;
      return { sdf: capsule(x0, y0, x1, y1, 0.8), box: boxOf(x0, y0, x1, y1, 0.8), half: 0.8, depth: [8, 14], tone: 2, level: 1, density: 2.6 };
    }),
  ];
  return { person, parts };
}

export function createRepertoireScene(root: HTMLElement): Scene {
  const item = root.querySelector<HTMLElement>(".ring-menu__item[data-hour='3']");
  return createParticleScene(root, compose, (t) => item?.toggleAttribute('data-active', t >= BEGIN));
}
