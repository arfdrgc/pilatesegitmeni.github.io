// Production output guard, run after `astro build` (see "build" in package.json).
// Fails the build if dist/ contains development-only placeholders, sample or
// draft articles, sample fixtures or their images, placeholder or localhost
// links, unapproved Instagram links, or canonical/hreflang/sitemap URLs that
// don't point to a built page.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const { default: astroConfig } = await import('../astro.config.mjs');
const SITE = new URL(astroConfig.site).origin;
const brand = JSON.parse(readFileSync(join(root, 'src/config/brand.json'), 'utf8'));
const instagramHandle = brand.instagramHandle;
const approvedInstagramUrl = instagramHandle ? `https://www.instagram.com/${instagramHandle}/` : null;

// Alt text that names the file or the kind of thing instead of describing it.
const GENERIC_ALT = /^(?:image|img|photo|picture|graphic|görsel|resim|fotoğraf|foto|todo|placeholder|untitled)$|\.(?:png|jpe?g|webp|avif|gif|svg)$/i;
// File name prefix reserved for locally generated sample images.
const SAMPLE_IMAGE_PREFIX = 'sample-placeholder';

const failures = [];
const warnings = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

if (!existsSync(dist)) {
  console.error('check-dist: dist/ does not exist. Run `astro build` first.');
  process.exit(1);
}

const files = [...walk(dist)];
const rel = (file) => relative(dist, file).split(sep).join('/');
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const textExtensions = new Set(['.html', '.xml', '.txt', '.json', '.css', '.js', '.mjs', '.svg', '.webmanifest']);
const textFiles = files.filter((file) => textExtensions.has(extname(file)));
if (htmlFiles.length === 0) {
  console.error('check-dist: no HTML pages found in dist/.');
  process.exit(1);
}

/** URL path of a built page: dist/en/index.html -> /en/ */
const pagePath = (file) => `/${rel(file).replace(/(^|\/)index\.html$/, '$1')}`;
const isNotFoundPage = (file) => rel(file) === '404.html';

/** Built file for an internal URL, or null for external URLs. */
function resolveInternal(url, from) {
  let parsed;
  try {
    parsed = new URL(url, `${SITE}${from}`);
  } catch {
    return { error: `unparseable URL "${url}"` };
  }
  if (parsed.origin !== SITE) return null;
  const path = decodeURIComponent(parsed.pathname);
  if (path.endsWith('/')) return { path, file: join(dist, path, 'index.html') };
  if (!extname(path)) return { path, error: `page link "${url}" must end with "/"` };
  return { path, file: join(dist, path) };
}

const decodeEntities = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

// 1. No file built from, and no reference to, a sample placeholder image.
for (const file of files) {
  if (rel(file).includes(SAMPLE_IMAGE_PREFIX)) fail(rel(file), 'is a sample placeholder image');
}

// 2. Text files: no development server URLs.
for (const file of textFiles) {
  const text = readFileSync(file, 'utf8');
  if (text.includes(SAMPLE_IMAGE_PREFIX)) fail(rel(file), 'references a sample placeholder image');
  for (const [match] of text.matchAll(/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\b/g)) {
    fail(rel(file), `development URL "${match}"`);
  }
  // Instagram: none at all until a handle is approved, then only that profile.
  for (const [match] of text.matchAll(/(?:https?:)?\/\/(?:[a-z0-9-]+\.)*instagram\.com[^\s"'<>)]*/gi)) {
    if (!approvedInstagramUrl) fail(rel(file), `Instagram link "${match}" but no handle is configured in src/config/brand.json`);
    else if (match !== approvedInstagramUrl) fail(rel(file), `Instagram link "${match}" is not the approved profile ${approvedInstagramUrl}`);
  }
}

// 3. HTML pages.
const alternatesByPage = new Map();
for (const file of htmlFiles) {
  const name = rel(file);
  const html = readFileSync(file, 'utf8');
  const path = pagePath(file);

  // Development-only placeholders all carry data-dev-only (see InstagramLink.astro).
  if (/\sdata-dev-only\b/.test(html)) fail(name, 'contains a development-only placeholder (data-dev-only)');
  if (/\sdata-sample\b/.test(html)) fail(name, 'contains sample content (data-sample)');
  // Other "TODO" text is reported for review but is not, by itself, a placeholder.
  const visibleText = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
  if (/\bTODO\b/.test(visibleText)) warnings.push(`${name}: contains the word "TODO" in page text; check it is intended.`);

  // Language attribute matches the URL.
  const expectedLang = path.startsWith('/en/') ? 'en' : 'tr';
  const lang = html.match(/<html[^>]*\slang="([^"]*)"/)?.[1];
  if (lang !== expectedLang) fail(name, `<html lang="${lang}"> should be "${expectedLang}"`);

  // Images: alt must be present. Empty alt is allowed for decorative images;
  // non-empty alt must describe the image, not be a file name or a generic word.
  // Width and height are required so the layout doesn't shift while loading.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    const alt = tag.match(/\salt="([^"]*)"/)?.[1];
    if (alt === undefined) fail(name, `image without an alt attribute: ${tag.slice(0, 120)}`);
    else if (alt.trim() && GENERIC_ALT.test(decodeEntities(alt).trim())) fail(name, `image alt text "${alt}" doesn't describe the image`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) fail(name, `image without width and height: ${tag.slice(0, 120)}`);
  }

  // Links and resources.
  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const url = decodeEntities(value).trim();
    if (url === '' || url === '#' || /^(?:javascript|about):/i.test(url) || /\bTODO\b/.test(url) || /\bexample\.(?:com|org|net)\b/i.test(url)) {
      fail(name, `placeholder ${attr}="${value}"`);
      continue;
    }
    if (url.startsWith('#') || /^(?:mailto|tel):/i.test(url)) continue;
    const target = resolveInternal(url, path);
    if (!target) continue;
    if (target.error) fail(name, target.error);
    else if (!existsSync(target.file)) fail(name, `${attr}="${value}" points to a file that was not built (${target.path})`);
  }

  // Canonical: exactly one, pointing at this page (none on the 404 page).
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => decodeEntities(m[1]));
  if (isNotFoundPage(file)) {
    if (canonicals.length) fail(name, 'the 404 page must not have a canonical URL');
  } else if (canonicals.length !== 1) {
    fail(name, `expected one canonical link, found ${canonicals.length}`);
  } else if (canonicals[0] !== `${SITE}${path}`) {
    fail(name, `canonical ${canonicals[0]} should be ${SITE}${path}`);
  }

  // hreflang: only built pages; if present, includes this page and x-default.
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map((m) => ({
    lang: m[1],
    href: decodeEntities(m[2]),
  }));
  if (alternates.length) {
    const own = alternates.filter((a) => a.lang !== 'x-default');
    for (const alternate of alternates) {
      const target = resolveInternal(alternate.href, path);
      if (!target || target.error || !existsSync(target.file)) {
        fail(name, `hreflang="${alternate.lang}" points to ${alternate.href}, which is not a built page`);
      }
    }
    if (own.length < 2) fail(name, 'hreflang alternates are only valid when a real translation exists');
    if (!own.some((a) => a.href === `${SITE}${path}`)) fail(name, 'hreflang alternates must include the page itself');
    if (!alternates.some((a) => a.lang === 'x-default')) fail(name, 'hreflang alternates are missing x-default');
    alternatesByPage.set(path, new Set(own.map((a) => `${a.lang} ${a.href}`)));
  }
}

// 4. hreflang must be reciprocal: every page in a group lists the same group.
for (const [path, group] of alternatesByPage) {
  for (const entry of group) {
    const href = entry.split(' ')[1];
    const otherPath = new URL(href).pathname;
    const otherGroup = alternatesByPage.get(otherPath);
    if (!otherGroup) {
      fail(`${path}`, `lists ${href} as a translation, but that page has no hreflang links back`);
    } else if ([...group].sort().join() !== [...otherGroup].sort().join()) {
      fail(`${path}`, `hreflang group differs from the one on ${otherPath}`);
    }
  }
}

// 5. Sitemap: lists exactly the built pages, without alternates.
const sitemapIndex = join(dist, 'sitemap-index.xml');
if (!existsSync(sitemapIndex)) {
  fail('sitemap-index.xml', 'missing');
} else {
  const sitemapLocs = new Set();
  for (const [, loc] of readFileSync(sitemapIndex, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)) {
    const target = resolveInternal(decodeEntities(loc), '/');
    if (!target || target.error || !existsSync(target.file)) {
      fail('sitemap-index.xml', `${loc} is not a built file`);
      continue;
    }
    const xml = readFileSync(target.file, 'utf8');
    if (/xhtml:link/.test(xml)) fail(rel(target.file), 'contains xhtml:link alternates; hreflang belongs in page heads only');
    for (const [, pageLoc] of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
      const page = resolveInternal(decodeEntities(pageLoc), '/');
      if (!page || page.error || !existsSync(page.file)) fail(rel(target.file), `${pageLoc} is not a built page`);
      else sitemapLocs.add(page.path);
    }
  }
  for (const file of htmlFiles) {
    if (!isNotFoundPage(file) && !sitemapLocs.has(pagePath(file))) fail(rel(file), 'is missing from the sitemap');
  }
}

// 6. robots.txt points at the sitemap index.
const robots = join(dist, 'robots.txt');
if (!existsSync(robots)) fail('robots.txt', 'missing');
else if (!readFileSync(robots, 'utf8').includes(`Sitemap: ${SITE}/sitemap-index.xml`)) fail('robots.txt', 'does not reference the sitemap index');

// 7. Draft and sample articles, and every sample fixture, must not appear
// anywhere in the output.
const samplesDir = join(root, 'src/content/samples');
const sourceFiles = (dir) => (existsSync(dir) ? [...walk(dir)] : []);
const excluded = [];
for (const file of [...sourceFiles(join(root, 'src/content/articles')), ...sourceFiles(samplesDir)]) {
  if (!file.endsWith('.md')) continue;
  const isFixture = file.startsWith(samplesDir + sep);
  const name = relative(root, file);
  const source = readFileSync(file, 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (frontmatter === undefined) {
    fail(name, 'has no frontmatter; cannot tell whether it is a draft or sample');
    continue;
  }
  const flag = (key) => {
    const lines = [...frontmatter.matchAll(new RegExp(`^${key}\\s*:\\s*(.*?)\\s*$`, 'gm'))];
    if (lines.length === 0) return false;
    const value = lines.length === 1 ? lines[0][1].replace(/\s+#.*$/, '').toLowerCase() : null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    fail(name, `cannot read "${key}" in frontmatter; use exactly "${key}: true" or "${key}: false"`);
    return true; // treat as excluded so it is still checked
  };
  const isDraft = flag('draft');
  const isSample = flag('sample') || isFixture;
  if (!isDraft && !isSample) continue;
  const slug = file.split(sep).at(-1).replace(/\.md$/, '');
  const rawTitle = frontmatter.match(/^title\s*:\s*(.*?)\s*$/m)?.[1] ?? '';
  const title = rawTitle.replace(/^(['"])(.*)\1$/, '$2');
  excluded.push({ name, slug, title: /^[>|]/.test(title) ? '' : title, kind: isSample ? 'sample' : 'draft' });
}
for (const article of excluded) {
  for (const file of files) {
    if (rel(file).split('/').includes(article.slug)) fail(rel(file), `built from ${article.kind} article ${article.name}`);
  }
  for (const file of textFiles) {
    const text = readFileSync(file, 'utf8');
    if (text.includes(`/${article.slug}/`)) fail(rel(file), `links to ${article.kind} article ${article.name}`);
    if (article.title && decodeEntities(text).includes(article.title)) fail(rel(file), `contains the title of ${article.kind} article ${article.name}`);
  }
}

// 8. No file built from, and no reference to, any image in src/content/samples/,
// whatever its name. Astro emits images as <name>.<hash>.<ext>.
const sampleImages = sourceFiles(samplesDir)
  .filter((file) => /\.(?:png|jpe?g|webp|avif|gif|svg|tiff?)$/i.test(file))
  .map((file) => ({ name: relative(root, file), stem: basename(file).replace(/\.[^.]+$/, '') }));
for (const image of sampleImages) {
  for (const file of files) {
    if (basename(file).startsWith(`${image.stem}.`)) fail(rel(file), `built from sample image ${image.name}`);
  }
  for (const file of textFiles) {
    if (readFileSync(file, 'utf8').includes(`/${image.stem}.`)) fail(rel(file), `references sample image ${image.name}`);
  }
}

// 9. Development-only routes (the original homepage preview at /dev/home/ and
// /en/dev/home/, injected by astro.config.mjs under `astro dev`) must never be built.
for (const file of files) {
  if (/^(?:en\/)?dev(?:\/|$)/.test(rel(file))) fail(rel(file), 'is a development-only route (see dev-home-preview in astro.config.mjs)');
}

// Report.
console.log(`check-dist: scanned ${files.length} files (${htmlFiles.length} HTML pages) in dist/`);
console.log(`  pages: ${htmlFiles.map(pagePath).join(', ')}`);
console.log(`  Instagram: ${approvedInstagramUrl ? `only ${approvedInstagramUrl} allowed` : 'no handle configured, no Instagram links allowed'}`);
console.log(`  draft/sample articles checked for exclusion: ${excluded.length}`);
console.log(`  sample images checked for exclusion: ${sampleImages.length}`);
for (const warning of warnings) console.warn(`  ! ${warning}`);
if (failures.length) {
  console.error(`\ncheck-dist: ${failures.length} problem(s)`);
  for (const message of failures) console.error(`  ✗ ${message}`);
  process.exit(1);
}
console.log('\ncheck-dist: production output is clean.');
