// Copy for the welcome ritual (src/components/ritual/), shown on the
// coming-soon pages (/ and /en/) and in the development harness.
// - Turkish title and cues: the owner's (2026-10-20).
// - English: Claude's draft, UNREVIEWED. It is used temporarily and needs the
//   owner's approval before final content sign-off.
// - Also awaiting the owner's review in both languages: the figure
//   descriptions (the figures' accessible names), the skip label (development
//   harness only), and the menu, Replay and stop-control labels.
import type { Lang } from '../i18n/ui';

const tr = {
  title: 'Hatırla ve tekrarla.',
  cues: [
    'Sırtını yavaşça düzelt.',
    'Başının tepesinden yukarı uzan.',
    'Çeneni hafifçe içeri al.',
    'Burnundan nefes al, ağzından ver.',
  ],
  skip: 'Geç',
  figureLabel: {
    slouch:
      'İki karakter yan yana: önden bir erkek ve yandan, sağa dönük bir kadın; ikisi de öne çökmüş bir duruşta. Erkeğin omuzları ve başı biraz aşağıda, başı öne eğik; kadının sırtı yuvarlak, başı önde ve aşağıda; kollar serbestçe sarkıyor.',
    neutral: 'İki karakter yan yana: önden bir erkek ve yandan, sağa dönük bir kadın; ikisi de dik, dengeli ve rahat bir duruşta, kollar yanlarda.',
    live: 'İki karakter yan yana: önden bir erkek ve yandan, sağa dönük bir kadın. Hareket açıkken aynı anda öne çökmüş bir duruştan yavaşça dik ve dengeli bir duruşa geçiyor, sonra sakin bir nefes alıp veriyorlar; hareket kapalıyken dik duruyorlar.',
  },
  menuLabel: 'Keşfet',
  replay: 'Yeniden izle',
  replayLabel: 'Giriş animasyonunu yeniden oynat',
  stop: 'Hareketi durdur',
};

const en: typeof tr = {
  title: 'Remember and repeat.',
  cues: [
    'Slowly straighten your back.',
    'Reach up through the crown of your head.',
    'Gently tuck your chin.',
    'Breathe in through your nose, out through your mouth.',
  ],
  skip: 'Skip',
  figureLabel: {
    slouch:
      'Two characters side by side: a man seen from the front and a woman seen from the side, facing right; both slouched. His shoulders and head sit a little lower, the head tipped forward; her back is rounded, the head forward and down; the arms hang loose.',
    neutral: 'Two characters side by side: a man seen from the front and a woman seen from the side, facing right; both standing upright, balanced and relaxed, arms by their sides.',
    live: 'Two characters side by side: a man seen from the front and a woman seen from the side, facing right. With motion on, they move together from a slouch to an upright, balanced stance, then take a calm breath; with motion off, they stand upright.',
  },
  menuLabel: 'Explore',
  replay: 'Watch again',
  replayLabel: 'Replay the intro animation',
  stop: 'Stop motion',
};

export const ritual: Record<Lang, typeof tr> = { tr, en };
