// Copy for the homepage intro (src/components/home-intro/), approved by the
// owner on 2026-10-23. The cues (2026-10-26): the first two are the approved
// cues of ./ritual.ts (Turkish: the owner's, 2026-10-20; English: approved
// exactly as written, 2026-10-23); the chin cue is gone, and the breath is two
// cues, in and out (Turkish: the owner's, 2026-10-26; English: Claude's
// draft, UNREVIEWED). ./ritual.ts keeps its four cues for the old ritual.
import type { Lang } from '../i18n/ui';

const tr = {
  /** Shown below the waist line at the start of the intro. */
  title: 'Hatırla ve Tekrarla',
  /** One at a time after the title: the back straightens, the crown reaches up, a breath in, a breath out. */
  cues: ['Sırtını yavaşça düzelt.', 'Başının tepesinden yukarı uzan.', 'Derin bir nefes al.', 'Yavaşça nefes ver.'],
  /** The brand slogan: after the breath cue, and below the ring as the page's main heading. */
  slogan: 'Daha iyi duruş, daha sağlıklı yaşam.',
  /** The motto's quotation marks (the dot intro), drawn around the slogan and hidden from screen readers. */
  quotes: ['“', '”'],
  /** The stop control, shown only while the intro plays (owner, 2026-10-31): its accessible name and tooltip. */
  stop: 'Animasyonu durdur',
  /** The toggle for the automatic pose cycling (owner, 2026-10-31): its accessible name, and its tooltip when on and off. It stops the cycling, not the dots. */
  loop: 'Otomatik poz döngüsü',
  loopOn: 'Otomatik poz döngüsü açık. Kapatmak için tıkla.',
  loopOff: 'Otomatik poz döngüsü kapalı. Açmak için tıkla.',
  /** Under the slogan once the menu is shown (owner, 2026-10-26: in place of the coming-soon line). */
  replay: 'Yeniden izle',
  replayLabel: 'Giriş animasyonunu yeniden oynat',
};

const en: typeof tr = {
  title: 'Remember and Repeat',
  cues: ['Slowly straighten your back.', 'Reach up through the crown of your head.', 'Take a deep breath in.', 'Breathe out slowly.'],
  slogan: 'Better Posture, Better Health.',
  quotes: ['“', '”'],
  stop: 'Stop animation',
  loop: 'Automatic pose cycling',
  loopOn: 'Automatic pose cycling is on. Click to turn it off.',
  loopOff: 'Automatic pose cycling is off. Click to turn it on.',
  replay: 'Replay',
  replayLabel: 'Replay the intro animation',
};

export const homeIntro: Record<Lang, typeof tr> = { tr, en };
