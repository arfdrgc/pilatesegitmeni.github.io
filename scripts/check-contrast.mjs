// Verifies the approved light-only colour palette and its WCAG 2.2 contrast.
// Anything it can't account for (a missing, extra, non-hex, untested or
// changed token, a colour defined outside tokens.css, or a dark-mode block)
// is a failure, so a token can never be skipped silently.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const TOKENS_FILE = 'src/styles/tokens.css';
const SEO_HEAD_FILE = 'src/components/SeoHead.astro';

// The approved palette. Changing a colour requires approval: update it here too.
const APPROVED = {
  bg: '#f8f4ee',
  surface: '#f0e9df',
  panel: '#e2e6da',
  tile: '#f1e1d6',
  text: '#26211d',
  muted: '#62594f',
  accent: '#9f4a2b',
  sage: '#4d5b4a',
  brand: '#1d5b43',
  'on-brand': '#ffffff',
  focus: '#9f4a2b',
  rule: '#ddd3c5',
  band: '#4d5b4a',
  'band-text': '#f6f1e8',
  'band-muted': '#d3d9cc',
  skin: '#d8b49e',
  'skin-shade': '#c49a82',
  hair: '#583c2c',
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
  ['brand', 'bg', 3, 'Loop toggle button on the homepage, on (non-text)'],
  ['on-brand', 'brand', 3, 'Loop toggle icon on its green button (non-text)'],
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
// Hairline rules and the character illustration's skin and hair tones: decorative only,
// never the sole carrier of meaning.
const DECORATIVE = new Set(['rule', 'skin', 'skin-shade', 'hair']);

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

// 1. Read the single :root block from tokens.css. The site is light-only, so
//    any prefers-color-scheme block or other color-scheme value is a failure.
const tokensCss = stripComments(readFileSync(join(root, TOKENS_FILE), 'utf8'));
const blocks = topLevelBlocks(tokensCss);

const rootBlocks = blocks.filter((block) => block.prelude === ':root');
if (rootBlocks.length !== 1) fail(`${TOKENS_FILE}: expected exactly one top-level :root block, found ${rootBlocks.length}.`);
if (blocks.some((block) => /prefers-color-scheme/i.test(block.prelude))) {
  fail(`${TOKENS_FILE}: prefers-color-scheme blocks are not allowed; the site is light-only.`);
}
if (rootBlocks.length === 1 && !/(?:^|;)\s*color-scheme\s*:\s*only light\s*(?:;|$)/i.test(rootBlocks[0].body)) {
  fail(`${TOKENS_FILE}: the :root block must declare color-scheme: only light.`);
}

const tokens = rootBlocks.length === 1 ? colourTokens(rootBlocks[0].body, ':root') : {};

// 2. Every --color-* declaration in the file must have been read above.
const declaredInFile = (tokensCss.match(/--color-[a-z0-9-]+\s*:/gi) ?? []).length;
const parsed = Object.keys(tokens).length;
if (declaredInFile !== parsed) {
  fail(`${TOKENS_FILE}: ${declaredInFile} colour declarations found but only ${parsed} are inside the :root block (or some are invalid).`);
}

// 3. The palette defines exactly the approved tokens, with the approved values,
//    and every token is either tested in a pair or explicitly decorative.
const tested = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]));
for (const name of Object.keys(APPROVED)) {
  if (!(name in tokens)) fail(`--color-${name} is missing.`);
  else if (tokens[name] !== APPROVED[name]) fail(`--color-${name} is ${tokens[name]}, approved value is ${APPROVED[name]}.`);
}
for (const name of Object.keys(tokens)) {
  if (!(name in APPROVED)) fail(`--color-${name} is not an approved token.`);
  if (!tested.has(name) && !DECORATIVE.has(name)) fail(`--color-${name} is not covered by any contrast pair.`);
}

// 4. Contrast for every approved pair.
const rows = [];
for (const [fg, bg, min, use] of PAIRS) {
  const a = tokens[fg];
  const b = tokens[bg];
  if (!a || !b) continue; // already reported as missing
  const ratio = contrast(a, b);
  const ok = ratio >= min;
  rows.push({ pair: `${fg} on ${bg}`, colours: `${a} / ${b}`, ratio: ratio.toFixed(2), min: `${min}:1`, result: ok ? 'pass' : 'FAIL', use });
  if (!ok) fail(`${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1 (${use}).`);
}

// 5. Colours elsewhere: only var(--color-*) references to defined tokens.
const colourLiteral = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi;
const known = new Set(Object.keys(APPROVED));
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

// 6. The single browser theme-color meta (no media query) must match the page background.
const seoHead = readFileSync(join(root, SEO_HEAD_FILE), 'utf8');
const themeColors = [...seoHead.matchAll(/<meta name="theme-color" content="(#[0-9a-f]{6})" \/>/gi)];
if (themeColors.length !== 1 || (seoHead.match(/name="theme-color"/g) ?? []).length !== 1) {
  fail(`${SEO_HEAD_FILE}: expected exactly one theme-color meta, without a media attribute.`);
}
for (const [, value] of themeColors) {
  if (value.toLowerCase() !== APPROVED.bg) fail(`${SEO_HEAD_FILE}: theme-color ${value} must equal --color-bg ${APPROVED.bg}.`);
}

console.table(rows);
console.log(`Decorative only (no contrast requirement): ${[...DECORATIVE].map((n) => `--color-${n}`).join(', ')}`);
if (failures.length) {
  console.error(`\ncheck-contrast: ${failures.length} problem(s)`);
  for (const message of failures) console.error(`  ✗ ${message}`);
  process.exit(1);
}
console.log(`\ncheck-contrast: all ${rows.length} pairs pass; light-only palette matches the approved values.`);
