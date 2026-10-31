// The ring menu's six items (owner, 2026-10-29): fixed places on the ring,
// read as a clock face, labels in both languages, an icon each, and their
// destinations. Shown by src/prototypes/home-intro/SixItemMenu.astro on the
// dev preview (/dev/home-menu/, /en/dev/home-menu/) and on the homepage
// (owner, 2026-10-30), where an item is a link only once its section's pages
// exist in both languages (scripts/check-dist.mjs fails a build that links to
// a missing page). The section paths are the approved future routes; none is
// built yet.
import type { Lang } from '../i18n/ui';

export type MenuIcon = 'sun' | 'orbit' | 'seven' | 'instagram' | 'movement' | 'body';

export interface MenuItem {
  id: 'legacy' | 'contrology' | 'principles' | 'inspiration' | 'repertoire' | 'body';
  /** Its place on the ring, as on a clock face (1.5 is half past one). Fixed: never moved to fit a label. */
  hour: 1.5 | 3 | 4.5 | 7.5 | 9 | 10.5;
  icon: MenuIcon;
  label: Record<Lang, string>;
  /** A section's page in each language, or the brand's Instagram account (src/config/brand.json). */
  to: Record<Lang, string> | 'instagram';
}

// Clockwise from the upper right (owner, 2026-10-29, second round: half past
// the hour on the diagonals, 3 and 9 on the sides).
export const homeMenu: MenuItem[] = [
  { id: 'body', hour: 1.5, icon: 'body', label: { tr: 'Bedenin Dili', en: 'The Language of the Body' }, to: { tr: '/bedenin-dili/', en: '/en/the-language-of-the-body/' } },
  { id: 'repertoire', hour: 3, icon: 'movement', label: { tr: 'Repertuar', en: 'Repertoire' }, to: { tr: '/repertuar/', en: '/en/repertoire/' } },
  { id: 'inspiration', hour: 4.5, icon: 'instagram', label: { tr: 'İlham', en: 'Inspiration' }, to: 'instagram' },
  { id: 'principles', hour: 7.5, icon: 'seven', label: { tr: '7 Prensip', en: 'The 7 Principles' }, to: { tr: '/7-prensip/', en: '/en/7-principles/' } },
  { id: 'contrology', hour: 9, icon: 'orbit', label: { tr: 'Contrology', en: 'Contrology' }, to: { tr: '/contrology/', en: '/en/contrology/' } },
  { id: 'legacy', hour: 10.5, icon: 'sun', label: { tr: 'Miras', en: 'Legacy' }, to: { tr: '/miras/', en: '/en/legacy/' } },
];

/**
 * The order the items fade in once she stands in the front view (owner,
 * 2026-10-29), by item, so it doesn't follow their places when they move.
 * The scene fades the ring's items in document order, so the menu lists them
 * in this order, which is also the keyboard's.
 */
export const revealOrder: MenuItem['id'][] = ['principles', 'contrology', 'legacy', 'body', 'repertoire', 'inspiration'];
