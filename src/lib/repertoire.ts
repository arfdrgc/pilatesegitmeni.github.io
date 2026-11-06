// Repertuar: the rules across files, the publication gates, and the resolved
// props the templates receive. The only way pages read Repertuar content.
//
// Every inconsistency is collected and the build stops with all of them
// listed. "Published" is never stored: a page is built only when its content
// is approved in both languages and every gate is open (D12, R1, R7, R10, P1,
// the copy fields in src/config/repertoire.ts). Whatever is held back is
// named, with its reasons, in the build log.
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { homeMenu } from '../config/home-menu';
import {
  focusKeys,
  focusLabels,
  groups,
  guides,
  guidesSegment,
  levelKeys,
  levelLabels,
  positionKeys,
  positionLabels,
  precautionCleared,
  repertoireCopy,
  subApparatus,
  type FocusKey,
  type GroupId,
  type GuideId,
  type LevelKey,
  type PositionKey,
  type SourceVoice,
  type SubApparatus,
  type UiLabels,
  type Voice,
} from '../config/repertoire';
import { languages, type Lang } from '../i18n/ui';
import type { Translations } from '../i18n/utils';

// ---------------------------------------------------------------- Resolved props

export interface ResolvedLink {
  href: string;
  label: string;
}

export interface ResolvedCitation {
  cite: string;
  pages?: string;
}

export interface ResolvedStatement {
  text: string;
  voice: Voice;
  citations: ResolvedCitation[];
  links: ResolvedLink[];
}

export interface ResolvedSource {
  id: string;
  kind: SourceVoice;
  cite: string;
  title: string;
  authors: string[];
  year: string;
  publisher?: string;
  edition?: string;
  tradition?: string;
  url?: string;
}

export interface ResolvedMedia {
  src: ImageMetadata;
  alt: string;
  kind: 'photo' | 'stage-photo' | 'illustration';
  credit: string;
  license: string;
}

export interface ResolvedFacet<K extends string> {
  key: K;
  label: string;
}

export interface ResolvedFacets {
  level: ResolvedFacet<LevelKey>;
  focus: ResolvedFacet<FocusKey>[];
  startingPosition: ResolvedFacet<PositionKey>;
}

/** The copy of one language. `null` only in `astro dev`: production pages that need a field are not built without it. */
export interface PageCopy {
  v1: string | null;
  voiceLabels: Record<SourceVoice, string> | null;
  lv1: string | null;
  p1: string | null;
  d1: string | null;
  editorialExample: string | null;
  ui: UiLabels | null;
}

export interface Breadcrumb {
  landing: ResolvedLink;
  /** No `href` while the page it would link to isn't built (Q5). */
  trail: { label: string; href?: string }[];
}

export interface MovementCardProps {
  name: string;
  href: string;
  summary: string;
  facets: ResolvedFacets;
  media?: ResolvedMedia;
  /** A guide's note on this entry. */
  note?: ResolvedStatement;
  /** Athletes guide: the entry is an editorial example (shows the marker). */
  editorialExample?: boolean;
}

interface PageBase {
  lang: Lang;
  translations: Translations;
  breadcrumb: Breadcrumb;
  sources: ResolvedSource[];
  copy: PageCopy;
}

export interface MovementPageProps extends PageBase {
  name: string;
  facets: ResolvedFacets;
  summary: ResolvedStatement[];
  setup: ResolvedStatement[];
  execution: ResolvedStatement[];
  breathing: ResolvedStatement[];
  variations: { name: string; statements: ResolvedStatement[] }[];
  differences: ResolvedStatement[];
  media: ResolvedMedia[];
}

export interface GroupSection {
  /** A verified sub-apparatus: its anchor on the group page, and its page once built (R1). */
  heading?: { label: string; anchor: string; href?: string };
  movements: MovementCardProps[];
}

export interface GroupPageProps extends PageBase {
  variant: 'group' | 'sub-apparatus';
  title: string;
  intro: ResolvedStatement[];
  diagram?: { src: ImageMetadata; alt: string; credit: string; license: string };
  sections: GroupSection[];
}

export interface GuidePageProps extends PageBase {
  title: string;
  intro: ResolvedStatement[];
  limits: ResolvedStatement[];
  /** Protected guide without an approved review: the D1 disclosure is shown. */
  disclosure: boolean;
  entries: MovementCardProps[];
  media: ResolvedMedia[];
}

// ---------------------------------------------------------------- Paths

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function repertoireLandingPath(lang: Lang): string {
  return homeMenu.find((item) => item.id === 'repertoire')!.to[lang];
}

const groupById = new Map(groups.map((group) => [group.id, group]));
const guideById = new Map(guides.map((guide) => [guide.id, guide]));

export function groupPath(lang: Lang, group: GroupId): string {
  return `${repertoireLandingPath(lang)}${groupById.get(group)!.slug[lang]}/`;
}

/** Always at group level, whatever its sub-apparatus (C5): a sub-apparatus page never changes it. */
export function movementPath(lang: Lang, group: GroupId, movement: string): string {
  return `${groupPath(lang, group)}${movement}/`;
}

export function subApparatusPath(lang: Lang, sub: SubApparatus): string {
  return `${groupPath(lang, sub.group)}${sub.slug[lang]}/`;
}

export function guidePath(lang: Lang, guide: GuideId): string {
  return `${repertoireLandingPath(lang)}${guidesSegment[lang]}/${guideById.get(guide)!.slug[lang]}/`;
}

const both = (path: (lang: Lang) => string): Translations =>
  Object.fromEntries(languages.map((lang) => [lang, path(lang)])) as Translations;

// ---------------------------------------------------------------- Loading

type Status = 'published' | 'draft';

interface Located<E> {
  entry: E;
  status: Status;
  lang?: Lang;
  id: string;
  /** group-text only: the sub-apparatus file group-text/<lang>/<group>/<sub>.yaml */
  sub?: string;
  file: string;
}

function locate<E extends { filePath?: string }>(entry: E, folder: string, withLang: boolean, errors: string[]): Located<E> | null {
  const file = entry.filePath ?? '';
  const parts = file.replace(/^.*?src\/content\/repertoire\//, '').replace(/\.ya?ml$/, '').split('/');
  const [statusFolder, kind, ...rest] = parts;
  const status: Status | null = statusFolder === 'published' ? 'published' : statusFolder === '_drafts' ? 'draft' : null;
  if (!status || kind !== folder) {
    errors.push(`${file}: must be inside src/content/repertoire/{published,_drafts}/${folder}/.`);
    return null;
  }
  let lang: Lang | undefined;
  if (withLang) {
    const first = rest.shift();
    if (first !== 'tr' && first !== 'en') {
      errors.push(`${file}: must be inside a tr/ or en/ folder.`);
      return null;
    }
    lang = first;
  }
  const [id, sub, ...extra] = rest;
  if (!id || extra.length || (sub !== undefined && folder !== 'group-text')) {
    errors.push(`${file}: unexpected location.`);
    return null;
  }
  for (const part of [id, sub]) {
    if (part !== undefined && !SLUG.test(part)) errors.push(`${file}: file name must be lowercase ASCII words separated by hyphens.`);
  }
  return { entry, status, lang, id, sub, file };
}

type SourceEntry = CollectionEntry<'repertoireSources'>;
type MovementEntry = CollectionEntry<'repertoireMovements'>;
type MovementTextEntry = CollectionEntry<'repertoireMovementText'>;
type GroupTextEntry = CollectionEntry<'repertoireGroupText'>;
type GuideEntry = CollectionEntry<'repertoireGuides'>;
type GuideTextEntry = CollectionEntry<'repertoireGuideText'>;
type Statement = MovementTextEntry['data']['summary'][number];
type Citation = Statement['sources'][number];

// ---------------------------------------------------------------- The model

export interface RepertoirePage<P> {
  params: Record<string, string>;
  props: P;
}

export interface Repertoire {
  movementPages: Record<Lang, RepertoirePage<MovementPageProps>[]>;
  groupPages: Record<Lang, RepertoirePage<GroupPageProps>[]>;
  subApparatusPages: Record<Lang, RepertoirePage<GroupPageProps>[]>;
  guidePages: Record<Lang, RepertoirePage<GuidePageProps>[]>;
  /** Entries meant for publication but not built, with the gates that hold them. */
  held: { what: string; reasons: string[] }[];
}

let cached: Promise<Repertoire> | undefined;

/** Loaded once per build (the routes share it); rebuilt on every request in `astro dev`. */
export function getRepertoire(): Promise<Repertoire> {
  if (import.meta.env.DEV) return buildRepertoire();
  cached ??= buildRepertoire().then((repertoire) => {
    report(repertoire);
    return repertoire;
  });
  return cached;
}

function report(repertoire: Repertoire): void {
  const count = (pages: Record<Lang, unknown[]>) => languages.reduce((sum, lang) => sum + pages[lang].length, 0);
  const built =
    count(repertoire.movementPages) + count(repertoire.groupPages) + count(repertoire.subApparatusPages) + count(repertoire.guidePages);
  console.log(`[repertoire] ${built} page(s) built; ${repertoire.held.length} entr${repertoire.held.length === 1 ? 'y' : 'ies'} held back.`);
  for (const { what, reasons } of repertoire.held) console.log(`[repertoire]   held: ${what}: ${reasons.join('; ')}`);
}

function copyFor(lang: Lang): PageCopy {
  return {
    v1: repertoireCopy.v1?.[lang] ?? null,
    voiceLabels: repertoireCopy.voiceLabels?.[lang] ?? null,
    lv1: repertoireCopy.lv1?.[lang] ?? null,
    p1: repertoireCopy.p1?.[lang] ?? null,
    d1: repertoireCopy.d1?.[lang] ?? null,
    editorialExample: repertoireCopy.editorialExample?.[lang] ?? null,
    ui: repertoireCopy.uiLabels?.[lang] ?? null,
  };
}

/** Copy every Repertuar page with statements needs. */
function pageCopyGates(): string[] {
  const missing: string[] = [];
  if (!repertoireCopy.v1) missing.push('copy V1 not approved');
  if (!repertoireCopy.voiceLabels) missing.push('voice labels not approved');
  if (!repertoireCopy.uiLabels) missing.push('interface labels not approved');
  return missing;
}

function checkConfig(errors: string[]): void {
  const labelled: [string, Record<string, Record<Lang, string>>, readonly string[]][] = [
    ['level', levelLabels, levelKeys],
    ['focus', focusLabels, focusKeys],
    ['starting position', positionLabels, positionKeys],
  ];
  for (const [facet, labels, keys] of labelled) {
    for (const key of keys) {
      for (const lang of languages) {
        if (!labels[key]?.[lang]?.trim()) errors.push(`config: ${facet} "${key}" has no ${lang.toUpperCase()} label.`);
      }
    }
  }
  for (const lang of languages) {
    const groupSlugs = new Set<string>();
    for (const group of groups) {
      const slug = group.slug[lang];
      if (!SLUG.test(slug)) errors.push(`config: group "${group.id}" ${lang} slug "${slug}" is not a valid slug.`);
      if (slug === guidesSegment[lang]) errors.push(`config: group "${group.id}" ${lang} slug "${slug}" is the guides path segment.`);
      if (groupSlugs.has(slug)) errors.push(`config: ${lang} group slug "${slug}" is used twice.`);
      groupSlugs.add(slug);
      if (!group.label[lang]?.trim()) errors.push(`config: group "${group.id}" has no ${lang.toUpperCase()} label.`);
    }
    const guideSlugs = new Set<string>();
    for (const guide of guides) {
      const slug = guide.slug[lang];
      if (!SLUG.test(slug)) errors.push(`config: guide "${guide.id}" ${lang} slug "${slug}" is not a valid slug.`);
      if (guideSlugs.has(slug)) errors.push(`config: ${lang} guide slug "${slug}" is used twice.`);
      guideSlugs.add(slug);
    }
  }
  const subIds = new Set<string>();
  for (const sub of subApparatus) {
    if (subIds.has(sub.id)) errors.push(`config: sub-apparatus "${sub.id}" is listed twice.`);
    subIds.add(sub.id);
    if (!groupById.has(sub.group)) errors.push(`config: sub-apparatus "${sub.id}" has unknown group "${sub.group}".`);
    for (const lang of languages) {
      if (!SLUG.test(sub.slug[lang])) errors.push(`config: sub-apparatus "${sub.id}" ${lang} slug is not a valid slug.`);
      const clash = subApparatus.find((other) => other !== sub && other.group === sub.group && other.slug[lang] === sub.slug[lang]);
      if (clash) errors.push(`config: sub-apparatus "${sub.id}" and "${clash.id}" share the ${lang} slug "${sub.slug[lang]}".`);
    }
  }
}

async function buildRepertoire(): Promise<Repertoire> {
  const errors: string[] = [];
  checkConfig(errors);

  const sourcesLoaded = (await getCollection('repertoireSources')).map((e) => locate<SourceEntry>(e, 'sources', false, errors));
  const movementsLoaded = (await getCollection('repertoireMovements')).map((e) => locate<MovementEntry>(e, 'movements', false, errors));
  const movementTexts = (await getCollection('repertoireMovementText')).map((e) =>
    locate<MovementTextEntry>(e, 'movement-text', true, errors),
  );
  const groupTexts = (await getCollection('repertoireGroupText')).map((e) => locate<GroupTextEntry>(e, 'group-text', true, errors));
  const guidesLoaded = (await getCollection('repertoireGuides')).map((e) => locate<GuideEntry>(e, 'guides', false, errors));
  const guideTexts = (await getCollection('repertoireGuideText')).map((e) => locate<GuideTextEntry>(e, 'guide-text', true, errors));
  const present = <T>(items: (T | null)[]) => items.filter((item): item is T => item !== null);

  /** One id per kind, in one status only. */
  function index<E>(items: Located<E>[], kind: string): Map<string, Located<E>> {
    const map = new Map<string, Located<E>>();
    for (const item of items) {
      const key = [item.lang, item.id, item.sub].filter(Boolean).join('/');
      const other = map.get(key);
      if (other) errors.push(`${item.file}: ${kind} "${key}" also exists as ${other.file}.`);
      else map.set(key, item);
    }
    return map;
  }

  const sources = index(present(sourcesLoaded), 'source');
  const movements = index(present(movementsLoaded), 'movement');
  const movementText = index(present(movementTexts), 'movement text');
  const groupText = index(present(groupTexts), 'group text');
  const guideData = index(present(guidesLoaded), 'guide');
  const guideText = index(present(guideTexts), 'guide text');

  // Sources.
  for (const source of sources.values()) {
    if (source.entry.data.kind === 'tradition' && !source.entry.data.tradition) {
      errors.push(`${source.file}: a tradition source must name its tradition ("tradition").`);
    }
  }

  function checkCitation(citation: Citation, where: string, kind?: SourceVoice): void {
    const source = sources.get(citation.source);
    if (!source) {
      errors.push(`${where}: cites unknown source "${citation.source}".`);
      return;
    }
    if (source.entry.data.access !== 'content') {
      errors.push(`${where}: cites "${citation.source}", which was not read at content level (access: ${source.entry.data.access}).`);
    }
    if (kind && source.entry.data.kind !== kind) {
      errors.push(`${where}: a ${kind} statement cites "${citation.source}", a ${source.entry.data.kind} source.`);
    }
  }

  const linkTargets: Record<'movement' | 'group' | 'guide', Set<string>> = {
    movement: new Set(movements.keys()),
    group: new Set(groups.map((group) => group.id)),
    guide: new Set(guides.map((guide) => guide.id)),
  };

  function checkStatement(statement: Statement, where: string): void {
    if (statement.voice === 'editorial') {
      if (statement.sources.length) errors.push(`${where}: an editorial statement carries sources; a sourced claim takes the source's voice (Q6).`);
    } else {
      if (!statement.sources.length) errors.push(`${where}: a ${statement.voice} statement has no sources.`);
      for (const citation of statement.sources) checkCitation(citation, where, statement.voice);
    }
    for (const link of statement.links) {
      if (!linkTargets[link.to].has(link.id)) errors.push(`${where}: links to unknown ${link.to} "${link.id}".`);
    }
  }

  const checkStatements = (list: Statement[], where: string) => list.forEach((s, i) => checkStatement(s, `${where}[${i}]`));

  // Config sub-apparatus against sources.
  for (const sub of subApparatus) {
    if (sub.status === 'verified') {
      const source = sub.source ? sources.get(sub.source) : undefined;
      if (!source) errors.push(`config: verified sub-apparatus "${sub.id}" needs a known source.`);
      else if (source.entry.data.access !== 'content') errors.push(`config: sub-apparatus "${sub.id}" is verified by "${sub.source}", which was not read at content level.`);
    }
  }
  const subById = new Map(subApparatus.map((sub) => [sub.id, sub]));

  // Movements and their texts.
  for (const movement of movements.values()) {
    const { data } = movement.entry;
    const where = movement.file;
    if (data.subApparatus) {
      const sub = subById.get(data.subApparatus);
      if (!sub) errors.push(`${where}: unknown sub-apparatus "${data.subApparatus}".`);
      else if (sub.group !== data.group) errors.push(`${where}: sub-apparatus "${sub.id}" belongs to group "${sub.group}", not "${data.group}".`);
    }
    for (const sub of subApparatus) {
      for (const lang of languages) {
        if (sub.group === data.group && sub.slug[lang] === movement.id) {
          errors.push(`${where}: the id "${movement.id}" is the reserved ${lang} slug of sub-apparatus "${sub.id}" in group "${data.group}".`);
        }
      }
    }
    data.attestations.forEach((citation, i) => checkCitation(citation, `${where} attestations[${i}]`));
    if (data.disputed) {
      const traditions = new Set(
        data.attestations
          .map((citation) => sources.get(citation.source)?.entry.data)
          .filter((source) => source?.kind === 'tradition' && source.tradition)
          .map((source) => source!.tradition),
      );
      if (traditions.size < 2) errors.push(`${where}: a disputed movement needs attestations from two different named traditions (R4).`);
    }
    for (const lang of languages) {
      const text = movementText.get(`${lang}/${movement.id}`);
      if (!text) {
        if (movement.status === 'published') errors.push(`${where}: published movement has no ${lang.toUpperCase()} text (movement-text/${lang}/${movement.id}.yaml).`);
        continue;
      }
      if (text.status !== movement.status) errors.push(`${text.file}: is ${text.status} but its movement is ${movement.status}.`);
      const mediaIds = new Set(data.media.map((m) => m.id));
      for (const m of data.media) {
        if (!text.entry.data.media.some((alt) => alt.id === m.id)) errors.push(`${text.file}: no alt text for media "${m.id}".`);
      }
      for (const alt of text.entry.data.media) {
        if (!mediaIds.has(alt.id)) errors.push(`${text.file}: alt text for unknown media "${alt.id}".`);
      }
    }
  }
  for (const text of movementText.values()) {
    const where = text.file;
    if (!movements.has(text.id)) errors.push(`${where}: no shared movement file movements/${text.id}.yaml.`);
    const { data } = text.entry;
    checkStatements(data.summary, `${where} summary`);
    checkStatements(data.setup, `${where} setup`);
    checkStatements(data.execution, `${where} execution`);
    checkStatements(data.breathing, `${where} breathing`);
    data.variations.forEach((variation, i) => checkStatements(variation.statements, `${where} variations[${i}]`));
    data.differences.forEach((statement, i) => {
      checkStatement(statement, `${where} differences[${i}]`);
      if (statement.voice !== 'tradition') errors.push(`${where} differences[${i}]: a difference between sources must be a tradition statement naming its tradition (R4).`);
    });
  }

  // Group and sub-apparatus texts.
  for (const text of groupText.values()) {
    const where = text.file;
    const group = groupById.get(text.id as GroupId);
    if (!group) errors.push(`${where}: unknown group "${text.id}".`);
    if (text.sub) {
      const sub = subById.get(text.sub);
      if (!sub || sub.group !== text.id) errors.push(`${where}: "${text.sub}" is not a sub-apparatus of group "${text.id}" in src/config/repertoire.ts.`);
    }
    checkStatements(text.entry.data.intro, `${where} intro`);
    const otherLang = text.lang === 'tr' ? 'en' : 'tr';
    const other = groupText.get([otherLang, text.id, text.sub].filter(Boolean).join('/'));
    if (text.status === 'published' && !other) errors.push(`${where}: published text has no ${otherLang.toUpperCase()} version.`);
  }

  // Guides.
  for (const guide of guideData.values()) {
    const where = guide.file;
    const config = guideById.get(guide.id as GuideId);
    if (!config) {
      errors.push(`${where}: unknown guide "${guide.id}".`);
      continue;
    }
    const { data } = guide.entry;
    const seen = new Set<string>();
    for (const entry of data.entries) {
      if (!movements.has(entry.movement)) errors.push(`${where}: lists unknown movement "${entry.movement}".`);
      if (seen.has(entry.movement)) errors.push(`${where}: lists "${entry.movement}" twice.`);
      seen.add(entry.movement);
      if (config.id === 'athletes' && !entry.basis) errors.push(`${where}: athletes entry "${entry.movement}" needs a basis (evidence or editorial-example).`);
      if (config.id !== 'athletes' && entry.basis) errors.push(`${where}: "basis" is for the athletes guide only.`);
    }
    if (config.protected && data.entries.length && data.review?.status !== 'approved') {
      errors.push(`${where}: a protected guide lists movements without an approved review record.`);
    }
    if (config.illustrationsOnly) {
      for (const m of data.media) {
        if (m.kind !== 'illustration') errors.push(`${where}: media "${m.id}" is a ${m.kind}; this guide uses original illustrations only.`);
      }
    }
    for (const lang of languages) {
      const text = guideText.get(`${lang}/${guide.id}`);
      if (!text) {
        if (guide.status === 'published') errors.push(`${where}: published guide has no ${lang.toUpperCase()} text (guide-text/${lang}/${guide.id}.yaml).`);
        continue;
      }
      for (const entry of data.entries) {
        const note = text.entry.data.notes.find((n) => n.movement === entry.movement);
        if (config.id === 'athletes') {
          if (!note) errors.push(`${text.file}: athletes entry "${entry.movement}" has no note.`);
          else if (entry.basis === 'evidence' && note.note.voice !== 'research') {
            errors.push(`${text.file}: athletes entry "${entry.movement}" has basis "evidence" but its note is not a research statement.`);
          } else if (entry.basis === 'editorial-example' && note.note.voice !== 'editorial') {
            errors.push(`${text.file}: athletes entry "${entry.movement}" is an editorial example but its note is not editorial.`);
          }
        }
      }
      for (const note of text.entry.data.notes) {
        if (!seen.has(note.movement)) errors.push(`${text.file}: note for "${note.movement}", which the guide doesn't list.`);
      }
      const mediaIds = new Set(data.media.map((m) => m.id));
      for (const m of data.media) {
        if (!text.entry.data.media.some((alt) => alt.id === m.id)) errors.push(`${text.file}: no alt text for media "${m.id}".`);
      }
      for (const alt of text.entry.data.media) {
        if (!mediaIds.has(alt.id)) errors.push(`${text.file}: alt text for unknown media "${alt.id}".`);
      }
    }
  }
  for (const text of guideText.values()) {
    const where = text.file;
    if (!guideData.has(text.id)) errors.push(`${where}: no shared guide file guides/${text.id}.yaml.`);
    checkStatements(text.entry.data.intro, `${where} intro`);
    checkStatements(text.entry.data.limits, `${where} limits`);
    text.entry.data.notes.forEach((note, i) => checkStatement(note.note, `${where} notes[${i}]`));
  }

  if (errors.length) {
    throw new Error(`Repertuar content has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
  }

  // ---------------------------------------------------------- Gates
  const held: Repertoire['held'] = [];
  const approvedIn = (texts: Map<string, Located<{ data: { approval: { status: string } } }>>, key: (lang: Lang) => string) =>
    languages.every((lang) => texts.get(key(lang))?.entry.data.approval.status === 'approved');

  const copyGates = pageCopyGates();
  const publishedMovements = new Set<string>();
  for (const movement of movements.values()) {
    if (movement.status !== 'published') continue;
    const reasons: string[] = [];
    if (!approvedIn(movementText, (lang) => `${lang}/${movement.id}`)) reasons.push('not approved in both languages');
    if (!movement.entry.data.media.length) reasons.push('no visual of the movement (R7)');
    if (!precautionCleared || !repertoireCopy.p1) reasons.push('precaution P1 not cleared');
    if (!repertoireCopy.lv1) reasons.push('copy LV1 not approved');
    reasons.push(...copyGates);
    if (reasons.length) held.push({ what: `movement ${movement.id}`, reasons });
    else publishedMovements.add(movement.id);
  }

  // Sub-apparatus pages (R1): verified, 3+ published movements, own approved text.
  const subPages = new Set<string>();
  for (const sub of subApparatus) {
    const reasons: string[] = [];
    if (sub.status === 'held') reasons.push('held (unverified): no page, name not shown');
    else {
      const count = [...movements.values()].filter((m) => m.entry.data.subApparatus === sub.id && publishedMovements.has(m.id)).length;
      if (count < 3) reasons.push(`R1: ${count} of 3 published movements`);
      if (!approvedIn(groupText, (lang) => `${lang}/${sub.group}/${sub.id}`)) reasons.push('no approved text in both languages');
      reasons.push(...copyGates);
    }
    if (reasons.length) held.push({ what: `sub-apparatus ${sub.id}`, reasons });
    else subPages.add(sub.id);
  }

  // Group pages (R10): approved text and diagram in both languages.
  const groupPages = new Set<GroupId>();
  for (const group of groups) {
    const texts = languages.map((lang) => groupText.get(`${lang}/${group.id}`));
    if (texts.every((text) => !text || text.status !== 'published')) continue;
    const reasons: string[] = [];
    if (!approvedIn(groupText, (lang) => `${lang}/${group.id}`)) reasons.push('not approved in both languages');
    if (texts.some((text) => !text?.entry.data.diagram)) reasons.push('R10: no diagram');
    reasons.push(...copyGates);
    if (reasons.length) held.push({ what: `group ${group.id}`, reasons });
    else groupPages.add(group.id);
  }

  // Guide pages.
  const guidePages = new Set<GuideId>();
  for (const guide of guideData.values()) {
    if (guide.status !== 'published') continue;
    const config = guideById.get(guide.id as GuideId)!;
    const reasons: string[] = [];
    if (!approvedIn(guideText, (lang) => `${lang}/${guide.id}`)) reasons.push('not approved in both languages');
    if (config.protected && guide.entry.data.review?.status !== 'approved' && !repertoireCopy.d1) reasons.push('copy D1 not approved');
    if (guide.entry.data.entries.some((e) => e.basis === 'editorial-example') && !repertoireCopy.editorialExample) {
      reasons.push('editorial-example marker not approved');
    }
    reasons.push(...copyGates);
    if (reasons.length) held.push({ what: `guide ${guide.id}`, reasons });
    else guidePages.add(config.id);
    for (const entry of guide.entry.data.entries) {
      if (!publishedMovements.has(entry.movement)) held.push({ what: `guide ${guide.id} entry ${entry.movement}`, reasons: ['movement not published; not listed'] });
    }
  }

  // ---------------------------------------------------------- Resolution
  const hrefOf = (lang: Lang, to: 'movement' | 'group' | 'guide', id: string): string | undefined => {
    if (to === 'movement') {
      const movement = movements.get(id);
      return movement && publishedMovements.has(id) ? movementPath(lang, movement.entry.data.group, id) : undefined;
    }
    if (to === 'group') return groupPages.has(id as GroupId) ? groupPath(lang, id as GroupId) : undefined;
    return guidePages.has(id as GuideId) ? guidePath(lang, id as GuideId) : undefined;
  };

  function resolve(lang: Lang, statement: Statement, where: string, cited: Set<string>): ResolvedStatement {
    statement.sources.forEach((citation) => cited.add(citation.source));
    const links: ResolvedLink[] = [];
    for (const link of statement.links) {
      const href = hrefOf(lang, link.to, link.id);
      if (href) links.push({ href, label: link.label });
      else held.push({ what: `link on ${where} to ${link.to} ${link.id}`, reasons: ['target page not built; link left out'] });
    }
    return {
      text: statement.text,
      voice: statement.voice,
      citations: statement.sources.map((c) => ({ cite: sources.get(c.source)!.entry.data.cite, pages: c.pages })),
      links,
    };
  }
  const resolveAll = (lang: Lang, list: Statement[], where: string, cited: Set<string>) =>
    list.map((statement) => resolve(lang, statement, where, cited));

  function sourceList(cited: Set<string>): ResolvedSource[] {
    return [...cited]
      .map((id) => {
        const data = sources.get(id)!.entry.data;
        return {
          id,
          kind: data.kind,
          cite: data.cite,
          title: data.title,
          authors: data.authors,
          year: data.year,
          publisher: data.publisher,
          edition: data.edition,
          tradition: data.tradition,
          url: data.url,
        };
      })
      .sort((a, b) => a.cite.localeCompare(b.cite));
  }

  const facetsOf = (lang: Lang, data: MovementEntry['data']): ResolvedFacets => ({
    level: { key: data.level, label: levelLabels[data.level][lang] },
    focus: data.focus.map((key) => ({ key, label: focusLabels[key][lang] })),
    startingPosition: { key: data.startingPosition, label: positionLabels[data.startingPosition][lang] },
  });

  function mediaOf(
    media: MovementEntry['data']['media'],
    alts: { id: string; alt: string }[],
    allowPhotos = true,
  ): ResolvedMedia[] {
    return media
      .filter((m) => allowPhotos || m.kind === 'illustration')
      .map((m) => ({ src: m.src, alt: alts.find((a) => a.id === m.id)!.alt, kind: m.kind, credit: m.credit, license: m.license }));
  }

  const landingLink = (lang: Lang): ResolvedLink => ({
    href: repertoireLandingPath(lang),
    label: homeMenu.find((item) => item.id === 'repertoire')!.label[lang],
  });

  function card(lang: Lang, id: string, allowPhotos = true): MovementCardProps {
    const movement = movements.get(id)!;
    const text = movementText.get(`${lang}/${id}`)!.entry.data;
    return {
      name: movement.entry.data.name,
      href: movementPath(lang, movement.entry.data.group, id),
      summary: text.summary[0].text,
      facets: facetsOf(lang, movement.entry.data),
      media: mediaOf(movement.entry.data.media, text.media, allowPhotos)[0],
    };
  }

  const byName = (a: MovementCardProps, b: MovementCardProps) => a.name.localeCompare(b.name);
  const empty = <T>(): Record<Lang, T[]> => ({ tr: [], en: [] });
  const result: Repertoire = {
    movementPages: empty(),
    groupPages: empty(),
    subApparatusPages: empty(),
    guidePages: empty(),
    held,
  };

  for (const id of publishedMovements) {
    const { data } = movements.get(id)!.entry;
    const group = groupById.get(data.group)!;
    for (const lang of languages) {
      const text = movementText.get(`${lang}/${id}`)!.entry.data;
      const where = `movement ${id} (${lang})`;
      const cited = new Set(data.attestations.map((c) => c.source));
      result.movementPages[lang].push({
        params: { group: group.slug[lang], entry: id },
        props: {
          lang,
          translations: both((l) => movementPath(l, data.group, id)),
          // The sub-apparatus is left out: its name shows only once verified, and the URL never contains it.
          breadcrumb: {
            landing: landingLink(lang),
            trail: [{ label: group.label[lang], href: groupPages.has(group.id) ? groupPath(lang, group.id) : undefined }],
          },
          name: data.name,
          facets: facetsOf(lang, data),
          summary: resolveAll(lang, text.summary, where, cited),
          setup: resolveAll(lang, text.setup, where, cited),
          execution: resolveAll(lang, text.execution, where, cited),
          breathing: resolveAll(lang, text.breathing, where, cited),
          variations: text.variations.map((v) => ({ name: v.name, statements: resolveAll(lang, v.statements, where, cited) })),
          differences: resolveAll(lang, text.differences, where, cited),
          media: mediaOf(data.media, text.media),
          sources: sourceList(cited),
          copy: copyFor(lang),
        },
      });
    }
  }

  function sectionsFor(lang: Lang, group: GroupId, only?: string): GroupSection[] {
    const inGroup = [...publishedMovements].filter((id) => movements.get(id)!.entry.data.group === group);
    if (only) return [{ movements: inGroup.filter((id) => movements.get(id)!.entry.data.subApparatus === only).map((id) => card(lang, id)).sort(byName) }];
    const sections: GroupSection[] = [];
    const verified = subApparatus.filter((sub) => sub.group === group && sub.status === 'verified');
    for (const sub of verified) {
      const list = inGroup.filter((id) => movements.get(id)!.entry.data.subApparatus === sub.id).map((id) => card(lang, id)).sort(byName);
      if (list.length) {
        sections.push({ heading: { label: sub.name, anchor: sub.slug[lang], href: subPages.has(sub.id) ? subApparatusPath(lang, sub) : undefined }, movements: list });
      }
    }
    const verifiedIds = new Set(verified.map((sub) => sub.id));
    const rest = inGroup.filter((id) => !verifiedIds.has(movements.get(id)!.entry.data.subApparatus ?? '')).map((id) => card(lang, id)).sort(byName);
    if (rest.length) sections.unshift({ movements: rest });
    return sections;
  }

  for (const groupId of groupPages) {
    const group = groupById.get(groupId)!;
    for (const lang of languages) {
      const text = groupText.get(`${lang}/${groupId}`)!.entry.data;
      const cited = new Set<string>();
      result.groupPages[lang].push({
        params: { group: group.slug[lang] },
        props: {
          lang,
          translations: both((l) => groupPath(l, groupId)),
          breadcrumb: { landing: landingLink(lang), trail: [] },
          variant: 'group',
          title: group.label[lang],
          intro: resolveAll(lang, text.intro, `group ${groupId} (${lang})`, cited),
          diagram: text.diagram,
          sections: sectionsFor(lang, groupId),
          sources: sourceList(cited),
          copy: copyFor(lang),
        },
      });
    }
  }

  for (const subId of subPages) {
    const sub = subById.get(subId)!;
    const group = groupById.get(sub.group)!;
    for (const lang of languages) {
      const text = groupText.get(`${lang}/${sub.group}/${subId}`)!.entry.data;
      const cited = new Set<string>([sub.source!]);
      result.subApparatusPages[lang].push({
        params: { group: group.slug[lang], entry: sub.slug[lang] },
        props: {
          lang,
          translations: both((l) => subApparatusPath(l, sub)),
          breadcrumb: {
            landing: landingLink(lang),
            trail: [{ label: group.label[lang], href: groupPages.has(group.id) ? groupPath(lang, group.id) : undefined }],
          },
          variant: 'sub-apparatus',
          title: sub.name,
          intro: resolveAll(lang, text.intro, `sub-apparatus ${subId} (${lang})`, cited),
          diagram: text.diagram,
          sections: sectionsFor(lang, sub.group, subId),
          sources: sourceList(cited),
          copy: copyFor(lang),
        },
      });
    }
  }

  for (const guideId of guidePages) {
    const config = guideById.get(guideId)!;
    const data = guideData.get(guideId)!.entry.data;
    for (const lang of languages) {
      const text = guideText.get(`${lang}/${guideId}`)!.entry.data;
      const where = `guide ${guideId} (${lang})`;
      const cited = new Set<string>();
      const entries = data.entries
        .filter((entry) => publishedMovements.has(entry.movement))
        .map((entry) => {
          const note = text.notes.find((n) => n.movement === entry.movement);
          return {
            ...card(lang, entry.movement, !config.illustrationsOnly),
            note: note ? resolve(lang, note.note, where, cited) : undefined,
            editorialExample: entry.basis === 'editorial-example',
          };
        });
      result.guidePages[lang].push({
        params: { guide: config.slug[lang] },
        props: {
          lang,
          translations: both((l) => guidePath(l, guideId)),
          breadcrumb: { landing: landingLink(lang), trail: [] },
          title: text.title,
          intro: resolveAll(lang, text.intro, where, cited),
          limits: resolveAll(lang, text.limits, where, cited),
          disclosure: config.protected && data.review?.status !== 'approved',
          entries,
          media: mediaOf(data.media, text.media, !config.illustrationsOnly),
          sources: sourceList(cited),
          copy: copyFor(lang),
        },
      });
    }
  }

  // Movements and sub-apparatus pages share /<group>/<entry>/: never the same path.
  for (const lang of languages) {
    const paths = new Set<string>();
    for (const page of [...result.movementPages[lang], ...result.subApparatusPages[lang]]) {
      const path = `${page.params.group}/${page.params.entry}`;
      if (paths.has(path)) throw new Error(`Repertuar: two pages at ${lang} path ${path}.`);
      paths.add(path);
    }
  }

  return result;
}

/** For the dev preview (src/dev/RepertoirePreview.astro): the copy as it stands, nulls included. */
export function previewCopy(lang: Lang): PageCopy {
  return copyFor(lang);
}
