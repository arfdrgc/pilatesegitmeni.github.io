// The dot figure's palettes. Clay and sage (`clay-sage`) was approved with
// the figure on 2026-10-25 and is the one the development homepage intro
// draws with (../home-intro/dotScene.ts); the others stay for comparison on the dev-only review page
// (src/prototypes/dot-figure/DotFigure.astro). They are canvas fills, not
// design tokens: nothing in src/styles/tokens.css changes, and
// scripts/check-contrast.mjs doesn't see them (it reads CSS, not
// TypeScript). They sit between the site's approved tones (sage #4d5b4a,
// terracotta #9f4a2b, skin #d8b49e / #c49a82) and the paper ground
// (--color-bg), lightened to pastels that still separate from the ground:
// about 2.2–2.8:1 for the body's tones and about 3:1 or more for the spine's
// accent (the review page measures and lists them). Warm ivory is the
// ground itself, so it is where far dots fade to rather than a dot colour.

export interface Palette {
  id: string;
  /** The body's tones from the feet to the crown; a dot takes the tone at its height. */
  stops: readonly string[];
  /** The dots along the spine, when they are emphasised. */
  accent: string;
  /** The settled pose's lines. */
  line: string;
}

export const PALETTES: readonly Palette[] = [
  { id: 'clay-sage', stops: ['#93a48d', '#bda283', '#c98f77'], accent: '#a8705c', line: '#a39079' },
  { id: 'sand', stops: ['#ab9884', '#bba186', '#b8977f'], accent: '#a06f5c', line: '#ad9a86' },
  { id: 'sage', stops: ['#8a9c86', '#9cab95', '#a5b19b'], accent: '#b67e69', line: '#93a28e' },
];
