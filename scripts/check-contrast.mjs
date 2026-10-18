// Verifies the approved colour palette and its WCAG 2.2 contrast in both themes.
// Anything it can't account for (a missing, extra, non-hex, untested or
// changed token, or a colour defined outside tokens.css) is a failure, so a
// token can never be skipped silently.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const TOKENS_FILE = 'src/styles/tokens.css';
const SEO_HEAD_FILE = 'src/components/SeoHead.astro';

// The approved palette. Changing a colour requires approval: update it here too.
const APPROVED = {
  light: {
    bg: '#f8f4ee',
    surface: '#f0e9df',
    panel: '#e2e6da',
    tile: '#f1e1d6',
    text: '#26211d',
    muted: '#62594f',
    accent: '#9f4a2b',
    sage: '#4d5b4a',
    focus: '#9f4a2b',
    rule: '#ddd3c5',
    band: '#4d5b4a',
    'band-text': '#f6f1e8',
    'band-muted': '#d3d9cc',
  },
  dark: {
    bg: '#1f1c19',
    surface: '#282420',
    panel: '#252b24',
    tile: '#2e2521',
    text: '#f0eae1',
    muted: '#bdb2a4',
    accent: '#e3a283',
    sage: '#aebda5',
    focus: '#e3a283',
    rule: '#3d3731',
    band: '#2f3a2d',
    'band-text': '#eef0e8',
    'band-muted': '#c3ccbb',
  },
};

// [foreground, background, minimum ratio, where the pair is used]
const PAIRS = [
  ['text', 'bg', 4.5, 'Body text'],
  ['text', 'surface', 4.5, 'Text in the footer'],
  ['text', 'panel', 4.5, 'Text in the featured article panel'],
  ['muted', 'bg', 4.5, 'Secondary text, dates, labels'],
  ['muted', 'surface', 4.5, 'Secondary text in the footer'],
  ['muted', 'panel', 4.5, 'Secondary text in the featured article panel'],
  ['accent', 'bg', 4.5, 'Links, labels'],
  ['accent', 'surface', 4.5, 'Links in the footer'],
  ['accent', 'panel', 4.5, 'Labels in the featured article panel'],
  ['sage', 'bg', 4.5, 'Label on the coming-soon page'],
  // Tile numerals are decorative large text (aria-hidden); 3:1 keeps them legible.
  // The linen tile's muted numeral is covered by "muted on surface" above.
  ['accent', 'tile', 3, 'Numeral on a clay card tile'],
  ['sage', 'panel', 3, 'Numeral on a sage card tile'],
  ['focus', 'bg', 3, 'Focus ring (non-text, WCAG 1.4.11)'],
  ['focus', 'surface', 3, 'Focus ring in the footer'],
  ['focus', 'panel', 3, 'Focus ring in the featured article panel'],
  ['band-text', 'band', 4.5, 'Text and focus ring in the Instagram band'],
  ['band-muted', 'band', 4.5, 'Secondary text in the Instagram band'],
];
// Hairline rules: decorative only, never the sole carrier of meaning.
const DECORATIVE = new Set(['rule']);

const failures = [];
const fail = (message) => failures.push(message);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Top-level `prelude { body }` blocks, matched by brace depth. */
function topLevelBlocks(css) {
  const blocks = [];
  let depth = 0;
  let start = 0;
  let preludeStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth < 0) throw new Error('Unbalanced braces in tokens.css');
      if (depth === 0) {
        blocks.push({ prelude: css.slice(preludeStart, start).trim().replace(/\s+/g, ' '), body: css.slice(start + 1, i) });
        preludeStart = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      preludeStart = i + 1;
    }
  }
  if (depth !== 0) throw new Error('Unbalanced braces in tokens.css');
  return blocks;
}

function colourTokens(body, where) {
  const tokens = {};
  for (const declaration of body.split(';')) {
    const match = declaration.match(/^\s*--color-([a-z0-9-]+)\s*:\s*(.*?)\s*$/is);
    if (!match) continue;
    const [, name, value] = match;
    if (name in tokens) fail(`${where}: --color-${name} is declared twice.`);
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      fail(`${where}: --color-${name} must be a 6-digit hex colour, got "${value}".`);
      continue;
    }
    tokens[name] = value.toLowerCase();
  }
  return tokens;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// 1. Read both theme blocks from tokens.css.
const tokensCss = stripComments(readFileSync(join(root, TOKENS_FILE), 'utf8'));
const blocks = topLevelBlocks(tokensCss);

const lightBlocks = blocks.filter((block) => block.prelude === ':root');
const darkMedia = blocks.filter((block) => /^@media \(prefers-color-scheme: ?dark\)$/.test(block.prelude));
if (lightBlocks.length !== 1) fail(`${TOKENS_FILE}: expected exactly one top-level :root block, found ${lightBlocks.length}.`);
if (darkMedia.length !== 1) fail(`${TOKENS_FILE}: expected exactly one @media (prefers-color-scheme: dark) block, found ${darkMedia.length}.`);
const darkRoots = darkMedia.length === 1 ? topLevelBlocks(darkMedia[0].body).filter((b) => b.prelude === ':root') : [];
if (darkMedia.length === 1 && darkRoots.length !== 1) fail(`${TOKENS_FILE}: the dark @media block must contain exactly one :root block.`);

const themes = {
  light: lightBlocks.length === 1 ? colourTokens(lightBlocks[0].body, 'light theme') : {},
  dark: darkRoots.length === 1 ? colourTokens(darkRoots[0].body, 'dark theme') : {},
};

// 2. Every --color-* declaration in the file must have been read above.
const declaredInFile = (tokensCss.match(/--color-[a-z0-9-]+\s*:/gi) ?? []).length;
const parsed = Object.keys(themes.light).length + Object.keys(themes.dark).length;
if (declaredInFile !== parsed) {
  fail(`${TOKENS_FILE}: ${declaredInFile} colour declarations found but only ${parsed} are inside the two theme blocks (or some are invalid).`);
}

// 3. Both themes define exactly the approved tokens, with the approved values,
//    and every token is either tested in a pair or explicitly decorative.
const tested = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]));
for (const [theme, approved] of Object.entries(APPROVED)) {
  const actual = themes[theme];
  for (const name of Object.keys(approved)) {
    if (!(name in actual)) fail(`${theme} theme: --color-${name} is missing.`);
    else if (actual[name] !== approved[name]) fail(`${theme} theme: --color-${name} is ${actual[name]}, approved value is ${approved[name]}.`);
  }
  for (const name of Object.keys(actual)) {
    if (!(name in approved)) fail(`${theme} theme: --color-${name} is not an approved token.`);
    if (!tested.has(name) && !DECORATIVE.has(name)) fail(`${theme} theme: --color-${name} is not covered by any contrast pair.`);
  }
}

// 4. Contrast for every approved pair in both themes.
const rows = [];
for (const theme of Object.keys(APPROVED)) {
  for (const [fg, bg, min, use] of PAIRS) {
    const a = themes[theme][fg];
    const b = themes[theme][bg];
    if (!a || !b) continue; // already reported as missing
    const ratio = contrast(a, b);
    const ok = ratio >= min;
    rows.push({ theme, pair: `${fg} on ${bg}`, colours: `${a} / ${b}`, ratio: ratio.toFixed(2), min: `${min}:1`, result: ok ? 'pass' : 'FAIL', use });
    if (!ok) fail(`${theme} theme: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1 (${use}).`);
  }
}

// 5. Colours elsewhere: only var(--color-*) references to defined tokens.
const colourLiteral = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi;
const known = new Set(Object.keys(APPROVED.light));
function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (/\.(css|astro)$/.test(entry.name)) yield path;
  }
}
for (const file of sourceFiles(join(root, 'src'))) {
  const rel = relative(root, file);
  const source = stripComments(readFileSync(file, 'utf8'));
  for (const [, name] of source.matchAll(/var\(\s*--color-([a-z0-9-]+)/gi)) {
    if (!known.has(name)) fail(`${rel}: var(--color-${name}) is not a defined token.`);
  }
  if (rel === TOKENS_FILE) continue;
  if (/--color-[a-z0-9-]+\s*:/i.test(source)) fail(`${rel}: colour tokens may only be declared in ${TOKENS_FILE}.`);
  // In .astro files only CSS contexts are checked: <style> blocks and style="" attributes.
  const cssParts = rel.endsWith('.css')
    ? [source]
    : [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g), ...source.matchAll(/\bstyle="([^"]*)"/g)].map((m) => m[1]);
  for (const part of cssParts) {
    for (const [literal] of part.matchAll(colourLiteral)) fail(`${rel}: hard-coded colour "${literal}"; use a --color-* token.`);
  }
}

// 6. The browser theme-color metas must match the page background of each theme.
const seoHead = readFileSync(join(root, SEO_HEAD_FILE), 'utf8');
const themeColors = [...seoHead.matchAll(/<meta name="theme-color" content="(#[0-9a-f]{6})" media="\(prefers-color-scheme: (light|dark)\)"/gi)];
if (themeColors.length !== 2 || (seoHead.match(/name="theme-color"/g) ?? []).length !== 2) {
  fail(`${SEO_HEAD_FILE}: expected exactly two theme-color metas (light and dark).`);
}
for (const [, value, theme] of themeColors) {
  if (value.toLowerCase() !== APPROVED[theme].bg) fail(`${SEO_HEAD_FILE}: ${theme} theme-color ${value} must equal --color-bg ${APPROVED[theme].bg}.`);
}

console.table(rows);
console.log(`Decorative only (no contrast requirement): ${[...DECORATIVE].map((n) => `--color-${n}`).join(', ')}`);
if (failures.length) {
  console.error(`\ncheck-contrast: ${failures.length} problem(s)`);
  for (const message of failures) console.error(`  ✗ ${message}`);
  process.exit(1);
}
console.log(`\ncheck-contrast: all ${rows.length} pairs pass in both themes; palette matches the approved values.`);
