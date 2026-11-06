// Repertuar T1 tests: exclusion of drafts and dev fixtures, the cross-file
// rules and publication gates of src/lib/repertoire.ts, check-dist rule 11,
// and the bilingual dev preview.
//
//   node scripts/test-repertoire-exclusion.mjs [--keep]
//
// Nothing is written to this project. Every scenario runs in a temporary copy
// (node_modules cloned, never linked: Astro keeps its cache in
// node_modules/.astro) with synthetic YAML that exists only there. The
// synthetic text never contains the dev fixtures' marker. --keep leaves the
// temporary copy in place for inspection.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const keep = process.argv.includes('--keep');
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${!ok && detail ? `\n      ${detail.slice(0, 600).replace(/\n/g, '\n      ')}` : ''}`);
};
const section = (title) => console.log(`\n${title}`);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

// ---------------------------------------------------------------- 1. Source scan
section('1. Source scan: only src/dev/ and the dev route folders import the fixtures');
{
  const allowed = [join(root, 'src/dev') + sep, join(root, 'src/pages/dev') + sep, join(root, 'src/pages/en/dev') + sep];
  const importer = /(?:from\s*|import\s*\(\s*|import\s+)['"][^'"]*repertoire-fixtures(?:\.ts)?['"]/;
  const offenders = [...walk(join(root, 'src'))]
    .filter((file) => /\.(?:astro|ts|tsx|js|mjs|cjs)$/.test(file))
    .filter((file) => !allowed.some((dir) => file.startsWith(dir)))
    .filter((file) => importer.test(readFileSync(file, 'utf8')))
    .map((file) => relative(root, file));
  check('no other file imports src/dev/repertoire-fixtures.ts', offenders.length === 0, offenders.join(', '));
  const preview = [...walk(join(root, 'src/pages'))].filter((file) => importer.test(readFileSync(file, 'utf8')));
  check('the dev routes do not import the fixtures directly', preview.length === 0, preview.join(', '));
}

// ---------------------------------------------------------------- Temporary copy
const temp = mkdtempSync(join(tmpdir(), 'repertoire-t1-'));
const site = join(temp, 'site');
const skip = new Set(['node_modules', 'dist', '.astro', '.git']);
cpSync(root, site, { recursive: true, filter: (src) => !skip.has(relative(root, src).split(sep)[0]) || src === root });
const clone = spawnSync('cp', [process.platform === 'darwin' ? '-cR' : '-R', join(root, 'node_modules'), join(site, 'node_modules')]);
if (clone.status !== 0) cpSync(join(root, 'node_modules'), join(site, 'node_modules'), { recursive: true });
const astroBin = join(site, 'node_modules/astro/bin/astro.mjs');
const configFile = join(site, 'src/config/repertoire.ts');
const originalConfig = readFileSync(join(root, 'src/config/repertoire.ts'), 'utf8');
const contentDir = join(site, 'src/content/repertoire');
const placeholderPng = readFileSync(join(root, 'src/content/samples/images/sample-placeholder-4x5.png'));
const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ASTRO_TELEMETRY_DISABLED: '1' };
const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, '');

function stopProcessesIn(dir) {
  for (let i = 0; i < 10; i++) {
    const found = spawnSync('pgrep', ['-f', dir], { encoding: 'utf8' }).stdout.trim();
    if (!found) return;
    spawnSync('pkill', [i < 5 ? '-TERM' : '-KILL', '-f', dir]);
    spawnSync('sleep', ['0.5']);
  }
}

function reset() {
  for (const path of [contentDir, join(site, 'dist'), join(site, '.astro'), join(site, 'node_modules/.astro')]) rmSync(path, { recursive: true, force: true });
  cpSync(join(root, 'src/content/repertoire'), contentDir, { recursive: true });
  writeFileSync(configFile, originalConfig);
}

function plant(files, configEdits = []) {
  for (const [path, value] of Object.entries(files)) {
    const file = join(contentDir, path);
    mkdirSync(dirname(file), { recursive: true });
    // JSON is valid YAML, so every entry is written as JSON.
    writeFileSync(file, Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2));
  }
  let config = originalConfig;
  for (const [from, to] of configEdits) {
    if (!(typeof from === 'string' ? config.includes(from) : from.test(config))) throw new Error(`config edit not applicable: ${from}`);
    config = config.replace(from, to);
  }
  writeFileSync(configFile, config);
}

function run(args, cwd = site) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  return { status: result.status, out: strip(`${result.stdout}\n${result.stderr}`) };
}
const build = () => run([astroBin, 'build']);
const checkDist = (dist) => run([join(site, 'scripts/check-dist.mjs'), ...(dist ? [dist] : [])]);
const distFile = (path) => join(site, 'dist', path, path.endsWith('.xml') ? '' : 'index.html');
const read = (path) => (existsSync(distFile(path)) ? readFileSync(distFile(path), 'utf8') : '');

// ---------------------------------------------------------------- Synthetic content
const DATE = '2026-11-06';
const st = (text, voice = 'editorial', sources = [], links = []) => ({
  text,
  voice,
  sources: sources.map(([source, pages]) => (pages ? { source, pages } : { source })),
  links,
});
const source = (kind, cite, extra = {}) => ({ kind, access: 'content', cite, title: `${cite}, synthetic test source`, year: '2000', ...extra });
const baseSources = {
  'published/sources/test-record.yaml': source('record', 'Test record 2000'),
  'published/sources/test-tradition-a.yaml': source('tradition', 'Test tradition A 2000', { tradition: 'Test tradition A' }),
  'published/sources/test-tradition-b.yaml': source('tradition', 'Test tradition B 2000', { tradition: 'Test tradition B' }),
  'published/sources/test-research.yaml': source('research', 'Test research 2000'),
  'published/sources/test-catalogue.yaml': source('tradition', 'Test catalogue 2000', { access: 'catalogue', tradition: 'Test tradition C' }),
  'published/images/test-visual.png': placeholderPng,
};
const mediaItem = (src = '../images/test-visual.png', kind = 'illustration') => ({ id: 'main', kind, src, credit: 'Test credit', license: 'Test license' });
const movement = (name, group, extra = {}) => ({
  name,
  group,
  level: 'fundamental',
  focus: ['balance'],
  startingPosition: 'supine',
  attestations: [{ source: 'test-record', pages: '1' }],
  media: [mediaItem()],
  ...extra,
});
const movementText = (name, extra = {}, alt = true) => ({
  approval: { status: 'approved', date: DATE },
  summary: [st(`${name} summary, synthetic test text.`)],
  setup: [st(`${name} setup.`, 'tradition', [['test-tradition-a', '11']])],
  execution: [st(`${name} execution.`)],
  breathing: [st(`${name} breathing.`, 'research', [['test-research']])],
  media: alt ? [{ id: 'main', alt: `${name} synthetic illustration` }] : [],
  ...extra,
});
/** A movement with both language files, published. */
const both = (id, shared, text = {}, options = {}) => ({
  [`${options.status ?? 'published'}/movements/${id}.yaml`]: shared,
  ...Object.fromEntries(
    (options.langs ?? ['tr', 'en']).map((lang) => [
      `${options.status ?? 'published'}/movement-text/${lang}/${id}.yaml`,
      movementText(`${shared.name} ${lang}`, text, shared.media.length > 0),
    ]),
  ),
});
const guideText = (title, extra = {}) => ({
  approval: { status: 'approved', date: DATE },
  title,
  intro: [st(`${title} intro, synthetic test text.`)],
  limits: [st(`${title} limits.`)],
  ...extra,
});
const guide = (id, shared, textTr = {}, textEn = textTr) => ({
  [`published/guides/${id}.yaml`]: shared,
  [`published/guide-text/tr/${id}.yaml`]: guideText(`Test guide ${id} tr`, textTr),
  [`published/guide-text/en/${id}.yaml`]: guideText(`Test guide ${id} en`, textEn),
});

const SUB_EMPTY = 'export const subApparatus: SubApparatus[] = [];';
const subConfig = (subs) => [SUB_EMPTY, `export const subApparatus: SubApparatus[] = ${JSON.stringify(subs)};`];
const heldSub = { id: 'test-held', group: 'mat', name: 'Test Held Sub Name', slug: { tr: 'test-held-tr', en: 'test-held-en' }, status: 'held' };
const verifiedSub = {
  id: 'test-sub-verified',
  group: 'reformer',
  name: 'Test Verified Sub Name',
  slug: { tr: 'test-dogrulanmis', en: 'test-verified' },
  status: 'verified',
  source: 'test-record',
};
const uiKeys = ['summary', 'setup', 'execution', 'breathing', 'variations', 'differences', 'level', 'focus', 'startingPosition', 'movements', 'sources', 'limits', 'breadcrumb'];
const loc = (what) => ({ tr: `Test ${what} tr`, en: `Test ${what} en` });
const openCopy = [
  /\/\/ BEGIN REPERTOIRE COPY[\s\S]*?\/\/ END REPERTOIRE COPY/,
  `// BEGIN REPERTOIRE COPY
export const repertoireCopy: RepertoireCopy = ${JSON.stringify({
    landing: { l1: null, l2: null, l3: null, l4: null },
    d1: loc('D1 disclosure'),
    v1: loc('V1 voice key'),
    lv1: loc('LV1 level note'),
    p1: loc('P1 precaution'),
    voiceLabels: Object.fromEntries(['tr', 'en'].map((l) => [l, { record: `Test record label ${l}`, tradition: `Test tradition label ${l}`, research: `Test research label ${l}` }])),
    editorialExample: loc('editorial example marker'),
    uiLabels: Object.fromEntries(['tr', 'en'].map((l) => [l, Object.fromEntries(uiKeys.map((k) => [k, `Test ${k} ${l}`]))])),
  })};
export const precautionCleared = true;
// END REPERTOIRE COPY`,
];

// The main published scenario, also used (with closed gates) in scenario 3.
const draftFiles = {
  '_drafts/movements/test-draft-secret.yaml': movement('Test Draft Secret Name', 'mat', { media: [mediaItem('../images/test-draft-visual.png')] }),
  '_drafts/movement-text/tr/test-draft-secret.yaml': movementText('Test Draft Secret tr'),
  '_drafts/movement-text/en/test-draft-secret.yaml': movementText('Test Draft Secret en'),
  '_drafts/images/test-draft-visual.png': placeholderPng,
};
const mainContent = {
  ...baseSources,
  ...both('test-one', movement('Test Movement One', 'mat'), {
    summary: [
      st('Test Movement One summary, synthetic test text.', 'editorial', [], [
        { to: 'movement', id: 'test-three', label: 'Link to three' },
        { to: 'movement', id: 'test-two', label: 'Link to two' },
      ]),
    ],
    variations: [{ name: 'Test variation', statements: [st('Variation text.', 'tradition', [['test-tradition-b', '4']])] }],
    differences: [st('Tradition B places it differently.', 'tradition', [['test-tradition-b', '5']])],
  }),
  ...both('test-two', movement('Test Movement Two', 'mat', { media: [] })),
  ...both('test-three', movement('Test Movement Three', 'mat', { subApparatus: 'test-held' })),
  ...both(
    'test-four',
    movement('Test Movement Four', 'reformer', {
      subApparatus: 'test-sub-verified',
      disputed: true,
      attestations: [{ source: 'test-tradition-a', pages: '2' }, { source: 'test-tradition-b', pages: '3' }],
    }),
  ),
  'published/group-text/tr/mat.yaml': { approval: { status: 'approved', date: DATE }, intro: [st('Mat group intro tr.')] },
  'published/group-text/en/mat.yaml': { approval: { status: 'approved', date: DATE }, intro: [st('Mat group intro en.')] },
  ...guide(
    'athletes',
    { entries: [{ movement: 'test-one', basis: 'evidence' }, { movement: 'test-three', basis: 'editorial-example' }] },
    { notes: [{ movement: 'test-one', note: st('Evidence note.', 'research', [['test-research', '9']]) }, { movement: 'test-three', note: st('Example note.') }] },
  ),
  ...guide('pregnancy', { entries: [] }),
  ...guide(
    'children-and-adolescents',
    { entries: [{ movement: 'test-one' }], review: { status: 'approved', date: DATE }, media: [{ ...mediaItem(), id: 'guide-art' }] },
    { media: [{ id: 'guide-art', alt: 'Synthetic guide illustration' }] },
  ),
  ...draftFiles,
};

const pages = {
  oneTr: 'repertuar/minder/test-one/',
  oneEn: 'en/repertoire/mat/test-one/',
  threeTr: 'repertuar/minder/test-three/',
  threeEn: 'en/repertoire/mat/test-three/',
  athletesTr: 'repertuar/rehberler/sporcular/',
  athletesEn: 'en/repertoire/guides/athletes/',
  pregnancyTr: 'repertuar/rehberler/gebelik/',
  childrenTr: 'repertuar/rehberler/cocuklar-ve-ergenler/',
};
const SITE = 'https://pilatesegitmeni.com';

try {
  // -------------------------------------------------------------- 2. Published build, drafts present
  section('2. Published scenario (gates open in the copy) with a planted draft: build and check-dist');
  reset();
  plant(mainContent, [openCopy, subConfig([heldSub, verifiedSub])]);
  // Equivalent to `npm run build` in the copy: astro build, then check-dist.
  const built = build();
  const dist2 = checkDist();
  check('build passes', built.status === 0, built.out.slice(-1500));
  check('check-dist passes, rule 11 included', dist2.status === 0, dist2.out.slice(-1500));
  const repertoireHtml = [...walk(join(site, 'dist'))]
    .map((file) => relative(join(site, 'dist'), file).split(sep).join('/'))
    .filter((path) => /^(?:repertuar|en\/repertoire)\/.+\/index\.html$/.test(path))
    .sort();
  const expected = [
    'en/repertoire/guides/athletes/index.html',
    'en/repertoire/guides/children-and-adolescents/index.html',
    'en/repertoire/guides/pregnancy/index.html',
    'en/repertoire/mat/test-one/index.html',
    'en/repertoire/mat/test-three/index.html',
    'en/repertoire/reformer/test-four/index.html',
    'repertuar/minder/test-one/index.html',
    'repertuar/minder/test-three/index.html',
    'repertuar/reformer/test-four/index.html',
    'repertuar/rehberler/cocuklar-ve-ergenler/index.html',
    'repertuar/rehberler/gebelik/index.html',
    'repertuar/rehberler/sporcular/index.html',
  ];
  check('exactly the expected 12 Repertuar pages are built', JSON.stringify(repertoireHtml) === JSON.stringify(expected), repertoireHtml.join(', '));
  const oneTr = read(pages.oneTr);
  const oneEn = read(pages.oneEn);
  const alternates = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map((m) => `${m[1]} ${m[2]}`).sort().join(', ');
  const pair = `en ${SITE}/${pages.oneEn}, tr ${SITE}/${pages.oneTr}, x-default ${SITE}/${pages.oneTr}`;
  check('a movement in both languages builds two pages with reciprocal hreflang', alternates(oneTr) === pair && alternates(oneEn) === pair, `${alternates(oneTr)} | ${alternates(oneEn)}`);
  check('each has a self canonical', oneTr.includes(`<link rel="canonical" href="${SITE}/${pages.oneTr}"`) && oneEn.includes(`<link rel="canonical" href="${SITE}/${pages.oneEn}"`));
  const sitemap = readFileSync(join(site, 'dist/sitemap-0.xml'), 'utf8');
  check('both are in the sitemap', sitemap.includes(`<loc>${SITE}/${pages.oneTr}</loc>`) && sitemap.includes(`<loc>${SITE}/${pages.oneEn}</loc>`));
  check('lang attributes match', oneTr.includes('<html lang="tr"') && oneEn.includes('<html lang="en"'));
  check('breadcrumb links to the landing page while the group page is not built', oneTr.includes('href="/repertuar/"') && !oneTr.includes('href="/repertuar/minder/"') && oneEn.includes('href="/en/repertoire/"'));
  check('all four text fields, variations and differences render', ['summary', 'setup', 'execution', 'breathing', 'variations', 'differences'].every((f) => oneTr.includes(`data-field="${f}"`)));
  check('voice labels and citations render; editorial text is unlabelled', oneTr.includes('Test tradition label tr') && oneTr.includes('(Test tradition A 2000, 11)') && oneTr.includes('Test V1 voice key tr'));
  check('a link to a published movement renders; a link to a held one is left out', oneTr.includes('href="/repertuar/minder/test-three/"') && !oneTr.includes('test-two'));
  check('P1 and LV1 sit on the movement page', oneTr.includes('Test P1 precaution tr') && oneTr.includes('Test LV1 level note tr'));
  const threeTr = read(pages.threeTr);
  check('a movement under a held sub-apparatus builds at group level, without its name', threeTr.length > 0 && !threeTr.includes('Test Held Sub Name') && !threeTr.includes('test-held-tr'));
  const athletesTr = read(pages.athletesTr);
  check('athletes guide: editorial example marker shown, evidence note shown, no review needed', athletesTr.includes('Test editorial example marker tr') && athletesTr.includes('Evidence note.') && read(pages.athletesEn).length > 0);
  const pregnancy = read(pages.pregnancyTr);
  check('protected guide without review shows D1, separate from its limits', pregnancy.includes('data-disclosure') && pregnancy.includes('Test D1 disclosure tr') && pregnancy.includes('Test limits tr'));
  const children = read(pages.childrenTr);
  check('children guide: reviewed, no D1, illustrations only', !children.includes('data-disclosure') && !/data-kind="(?:photo|stage-photo)"/.test(children) && children.includes('Synthetic guide illustration'));
  check('no guide index page', !existsSync(distFile('repertuar/rehberler/')) && !existsSync(distFile('en/repertoire/guides/')));
  const log = built.out;
  for (const [what, reason] of [
    ['movement test-two', 'no visual of the movement (R7)'],
    ['sub-apparatus test-held', 'held (unverified)'],
    ['sub-apparatus test-sub-verified', 'R1: 1 of 3 published movements'],
    ['group mat', 'R10: no diagram'],
    ['link on movement test-one (tr) to movement test-two', 'target page not built'],
  ]) {
    check(`build log names the gate: ${what}: ${reason}`, log.includes(`held: ${what}`) && log.includes(reason), log.split('\n').filter((l) => l.includes('[repertoire]')).join('\n'));
  }
  const everything = [...walk(join(site, 'dist'))];
  const leaked = everything.filter((file) => {
    if (/test-draft-(?:secret|visual)/.test(relative(join(site, 'dist'), file))) return true;
    if (!/\.(?:html|xml|txt|json|css|js|mjs|svg)$/.test(file)) return false;
    return /test-draft-secret|test-draft-visual|Test Draft Secret/.test(readFileSync(file, 'utf8'));
  });
  check('the planted draft (id, name, image) is absent from dist/', leaked.length === 0, leaked.join(', '));
  check('rule 11 saw the draft files', dist2.out.includes('4 draft file(s) checked for exclusion'), dist2.out.split('\n').find((l) => l.includes('Repertuar:')) ?? '');

  // -------------------------------------------------------------- 3. Planted leaks
  section('3. Planted leaks in a copy of that dist/ each fail check-dist');
  const leakBase = join(temp, 'dist-leak');
  const leaks = [
    ['the fixtures marker', 'dev fixtures\' marker', (d) => writeFileSync(join(d, 'index.html'), readFileSync(join(d, 'index.html'), 'utf8').replace('</body>', '<p>KURGUSAL ÖNİZLEME</p></body>'))],
    ['a draft id as a path', 'built from Repertuar draft', (d) => { mkdirSync(join(d, 'repertuar/minder/test-draft-secret'), { recursive: true }); writeFileSync(join(d, 'repertuar/minder/test-draft-secret/index.html'), readFileSync(join(d, 'index.html'))); }],
    ['a draft image', 'built from Repertuar draft image', (d) => writeFileSync(join(d, '_astro/test-draft-visual.Ab12Cd34.webp'), placeholderPng)],
    ['a draft name in page text', 'from Repertuar draft', (d) => writeFileSync(join(d, '404.html'), readFileSync(join(d, '404.html'), 'utf8').replace('</body>', '<p>Test Draft Secret Name</p></body>'))],
    ['a dev/ page', 'development-only route', (d) => { mkdirSync(join(d, 'dev/repertoire-preview'), { recursive: true }); writeFileSync(join(d, 'dev/repertoire-preview/index.html'), readFileSync(join(d, '404.html'))); }],
    ['a sitemap entry for a draft', 'links to Repertuar draft', (d) => writeFileSync(join(d, 'sitemap-0.xml'), readFileSync(join(d, 'sitemap-0.xml'), 'utf8').replace('</urlset>', `<url><loc>${SITE}/repertuar/minder/test-draft-secret/</loc></url></urlset>`))],
    ['a Repertuar page in one language (translation removed)', 'not a built page', (d) => rmSync(join(d, pages.oneEn), { recursive: true })],
    [
      'a Repertuar page in one language (no alternates)',
      'Repertuar page without its other language',
      (d) => {
        rmSync(join(d, pages.oneEn), { recursive: true });
        const file = join(d, pages.oneTr, 'index.html');
        writeFileSync(file, readFileSync(file, 'utf8').replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>/g, ''));
      },
    ],
  ];
  rmSync(leakBase, { recursive: true, force: true });
  cpSync(join(site, 'dist'), leakBase, { recursive: true });
  const control = checkDist(leakBase);
  check('control: the unmodified copy passes', control.status === 0, control.out.slice(-800));
  for (const [name, message, plantLeak] of leaks) {
    rmSync(leakBase, { recursive: true, force: true });
    cpSync(join(site, 'dist'), leakBase, { recursive: true });
    plantLeak(leakBase);
    const result = checkDist(leakBase);
    check(`${name} fails ("${message}")`, result.status !== 0 && result.out.includes(message), result.out.slice(-800));
  }
  rmSync(leakBase, { recursive: true, force: true });

  // -------------------------------------------------------------- 4. Gates closed
  section('4. Same content with the real copy and gates (all null, P1 closed): nothing is built');
  reset();
  plant(mainContent, [subConfig([heldSub, verifiedSub])]);
  const closed = build();
  check('build passes', closed.status === 0, closed.out.slice(-1500));
  const closedDist = checkDist();
  check('check-dist passes', closedDist.status === 0, closedDist.out.slice(-800));
  check('no Repertuar page is built', !existsSync(join(site, 'dist/repertuar/minder')) && !existsSync(join(site, 'dist/repertuar/rehberler')) && !existsSync(join(site, 'dist/en/repertoire/mat')));
  for (const reason of ['precaution P1 not cleared', 'copy LV1 not approved', 'copy V1 not approved', 'voice labels not approved', 'interface labels not approved', 'copy D1 not approved', 'editorial-example marker not approved']) {
    check(`build log names: ${reason}`, closed.out.includes(reason));
  }
  check('build log names the held movement test-one', closed.out.includes('held: movement test-one: '));

  // -------------------------------------------------------------- 5. Sub-apparatus verified, group page built
  section('5. The held sub-apparatus becomes verified with 3 movements; the group page is complete');
  reset();
  const diagram = (lang) => ({ src: '../../images/test-visual.png', alt: `Synthetic diagram ${lang}`, credit: 'Test credit', license: 'Test license' });
  plant(
    {
      ...mainContent,
      'published/group-text/tr/mat.yaml': { approval: { status: 'approved', date: DATE }, intro: [st('Mat group intro tr.')], diagram: diagram('tr') },
      'published/group-text/en/mat.yaml': { approval: { status: 'approved', date: DATE }, intro: [st('Mat group intro en.')], diagram: diagram('en') },
      ...both('test-five', movement('Test Movement Five', 'mat', { subApparatus: 'test-held' })),
      ...both('test-six', movement('Test Movement Six', 'mat', { subApparatus: 'test-held' })),
      'published/group-text/tr/mat/test-held.yaml': { approval: { status: 'approved', date: DATE }, intro: [st('Sub intro tr.', 'record', [['test-record', '7']])] },
      'published/group-text/en/mat/test-held.yaml': { approval: { status: 'approved', date: DATE }, intro: [st('Sub intro en.', 'record', [['test-record', '7']])] },
    },
    [openCopy, subConfig([{ ...heldSub, status: 'verified', source: 'test-record' }, verifiedSub])],
  );
  const verified = build();
  check('build passes', verified.status === 0, verified.out.slice(-1500));
  const verifiedDist = checkDist();
  check('check-dist passes', verifiedDist.status === 0, verifiedDist.out.slice(-800));
  check('the movement keeps its URL', read(pages.threeTr).length > 0 && read(pages.threeEn).length > 0);
  check('the sub-apparatus page is built in both languages', read('repertuar/minder/test-held-tr/').includes('Test Held Sub Name') && read('en/repertoire/mat/test-held-en/').includes('Test Held Sub Name'));
  check('the group page is built and lists the sub-apparatus as a linked section', read('repertuar/minder/').includes('href="/repertuar/minder/test-held-tr/"'));
  check('the breadcrumb now links to the group page', read(pages.oneTr).includes('href="/repertuar/minder/"'));

  // -------------------------------------------------------------- 6. Errors across files
  section('6. Errors across files and in the configuration stop the build, all of them listed');
  reset();
  const ok = (id, group = 'mat', extra = {}) => both(id, movement(`Test ${id}`, group, extra));
  const withText = (id, text, shared = {}) => both(id, movement(`Test ${id}`, 'mat', shared), text);
  plant(
    {
      ...baseSources,
      ...ok('test-e-ok'),
      ...both('test-e-onelang', movement('Test one language', 'mat'), {}, { langs: ['tr'] }),
      ...withText('test-e-voice', { setup: [st('Wrong voice.', 'research', [['test-tradition-a']])] }),
      ...withText('test-e-catalogue', { execution: [st('Catalogue only.', 'tradition', [['test-catalogue']])] }),
      ...withText('test-e-nosource', { summary: [st('No source.', 'record')] }),
      ...withText('test-e-editorialsrc', { summary: [st('Editorial with source.', 'editorial', [['test-record']])] }),
      ...withText('test-e-disputed', {}, { disputed: true, attestations: [{ source: 'test-tradition-a' }] }),
      ...withText('test-e-difference', { differences: [st('Not a tradition.', 'record', [['test-record']])] }),
      ...ok('test-e-othergroup', 'reformer', { subApparatus: 'test-held' }),
      ...ok('test-held-tr'),
      ...guide('children-and-adolescents', { media: [{ ...mediaItem('../images/test-visual.png', 'photo'), id: 'guide-photo' }] }, { media: [{ id: 'guide-photo', alt: 'Synthetic photo' }] }),
      ...guide('pregnancy', { entries: [{ movement: 'test-e-ok' }] }),
      ...guide('athletes', { entries: [{ movement: 'test-e-ok', basis: 'evidence' }] }, { notes: [{ movement: 'test-e-ok', note: st('Not research.') }] }),
    },
    [
      subConfig([heldSub]),
      ["balance: { tr: 'Denge', en: 'Balance' },", "balance: { tr: 'Denge', en: '' },"],
      ["slug: { tr: 'sandalyeler', en: 'chairs' }", "slug: { tr: 'rehberler', en: 'chairs' }"],
    ],
  );
  const errors = build();
  check('build fails', errors.status !== 0);
  for (const [name, message] of [
    ['a movement missing one language file', 'published movement has no EN text'],
    ["a voice that doesn't match its source's kind", 'a research statement cites "test-tradition-a", a tradition source'],
    ['a catalogue-only source', 'cites "test-catalogue", which was not read at content level'],
    ['a record statement without sources', 'a record statement has no sources'],
    ['an editorial statement with sources (Q6)', 'an editorial statement carries sources'],
    ['a disputed movement with one tradition', 'a disputed movement needs attestations from two different named traditions'],
    ['a difference that is not a tradition statement', 'a difference between sources must be a tradition statement'],
    ['a facet key without both labels', 'focus "balance" has no EN label'],
    ['a sub-apparatus from a different group', 'sub-apparatus "test-held" belongs to group "mat", not "reformer"'],
    ['a slug that collides with a reserved sub-apparatus slug', 'the id "test-held-tr" is the reserved tr slug of sub-apparatus "test-held"'],
    ['a group slug equal to the guides segment', 'group "chairs" tr slug "rehberler" is the guides path segment'],
    ['a photo in the children and adolescents guide', 'is a photo; this guide uses original illustrations only'],
    ['a protected guide with movements but no review record', 'a protected guide lists movements without an approved review record'],
    ['an athletes evidence entry without a research note', 'has basis "evidence" but its note is not a research statement'],
  ]) {
    check(name, errors.out.includes(message), errors.out.split('\n').filter((l) => l.includes(' - ')).slice(0, 30).join('\n'));
  }

  // -------------------------------------------------------------- 7. Schema errors
  section('7. Schema errors stop the build');
  const schemaCases = [
    ['a missing required text field (breathing)', 'breathing', (text) => { delete text.breathing; return text; }],
    ['a level outside the taxonomy', 'level', null, { level: 'expert' }],
    ['an approval record with an approver field', 'approver', (text) => ({ ...text, approval: { ...text.approval, approver: 'Somebody' } })],
    ['an approval date that is not ISO', 'date', (text) => ({ ...text, approval: { status: 'approved', date: '06.11.2026' } })],
    ['a guide review record with a reviewer field', 'reviewer', null, null, { entries: [], review: { status: 'approved', date: DATE, reviewer: 'Somebody' } }],
    ['a slug field', 'slug', null, { slug: 'other' }],
  ];
  for (const [name, needle, editText, sharedExtra, guideShared] of schemaCases) {
    reset();
    const shared = movement('Test schema', 'mat', sharedExtra ?? {});
    const text = movementText('Test schema');
    plant({
      ...baseSources,
      'published/movements/test-schema.yaml': shared,
      'published/movement-text/tr/test-schema.yaml': editText ? editText(structuredClone(text)) : text,
      'published/movement-text/en/test-schema.yaml': movementText('Test schema en'),
      ...(guideShared ? guide('pregnancy', guideShared) : {}),
    });
    const result = build();
    check(`${name} fails`, result.status !== 0 && result.out.includes(needle) && /does not match collection schema|InvalidContentEntryData/i.test(result.out), result.out.slice(-1200));
  }

  // -------------------------------------------------------------- 8. Dev preview
  section('8. Dev preview: every template in Turkish and English, with the copy fields as placeholders');
  reset();
  const port = 4300 + Math.floor(Math.random() * 500);
  // Its own process group: `astro dev` runs the server in a child process, and both must stop.
  const server = spawn(process.execPath, [astroBin, 'dev', '--port', String(port)], { cwd: site, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let serverOut = '';
  server.stdout.on('data', (chunk) => (serverOut += chunk));
  server.stderr.on('data', (chunk) => (serverOut += chunk));
  const base = `http://localhost:${port}`;
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try {
      up = (await fetch(`${base}/dev/repertoire-preview/`)).ok;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  check('dev server serves the preview', up, strip(serverOut).slice(-800));
  const views = {
    '': ['TODO: L1 (landing, not approved)', 'TODO: L4 (landing, not approved)'],
    'movement/': ['data-field="summary"', 'data-field="breathing"', 'data-field="variations"', 'data-field="differences"', 'TODO: P1 (precaution, gated)', 'TODO: LV1 (level note)', 'TODO: V1 (voice key)', 'TODO: voice label: tradition', 'data-kind="stage-photo"'],
    'group/': ['data-variant="group"', 'id="fixture-sub"', 'Fixture sub-apparatus', 'TODO: uiLabels.movements'],
    'sub-apparatus/': ['data-variant="sub-apparatus"', 'Fixture Movement Epsilon'],
    'guide-athletes/': ['TODO: editorial-example marker', 'evidence note, research', 'data-level="fundamental"'],
    'guide-protected/': ['data-disclosure', 'TODO: D1 (not reviewed)', 'TODO: uiLabels.limits'],
    'guide-children/': ['data-kind="illustration"', 'Fixture Movement Delta'],
  };
  for (const lang of ['tr', 'en']) {
    for (const [view, needles] of Object.entries(views)) {
      const path = `${lang === 'tr' ? '' : '/en'}/dev/repertoire-preview/${view}`;
      let html = '';
      let status = 0;
      try {
        const response = await fetch(`${base}${path}`);
        status = response.status;
        html = await response.text();
      } catch {}
      const marker = lang === 'tr' ? 'KURGUSAL ÖNİZLEME' : 'FICTIONAL PREVIEW';
      const missing = needles.filter((n) => !html.includes(n));
      const good = status === 200 && html.includes(`<html lang="${lang}"`) && html.includes(marker) && html.includes('data-dev-only') && missing.length === 0;
      check(`${path} renders`, good, `status ${status}; missing: ${missing.join(', ')}`);
      if (view === 'guide-children/') check(`${path} has no photographs`, !/data-kind="(?:photo|stage-photo)"/.test(html));
    }
  }
  const exited = server.exitCode !== null ? Promise.resolve() : new Promise((r) => server.once('exit', r));
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {}
  await Promise.race([exited, new Promise((r) => setTimeout(r, 10000))]);
} finally {
  // `astro dev` may leave its server running in a detached child: stop every
  // process started from the temporary copy (its path is unique).
  stopProcessesIn(site);
  if (keep) console.log(`\nTemporary copy kept at ${temp}`);
  else rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}

const failed = results.filter((r) => !r.ok);
console.log(`\ntest-repertoire-exclusion: ${results.length - failed.length} of ${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
