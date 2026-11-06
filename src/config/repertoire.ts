// Repertuar / Repertoire: the fixed structure of the movement and apparatus
// library (decisions D1–D16, R1–R12, T-1–T-11 and the T1 scope, 2026-11-06).
// Content (sources, movements, group, sub-apparatus and guide texts) lives in
// src/content/repertoire/ and is checked against this file by
// src/lib/repertoire.ts, which stops the build on any inconsistency.
//
// Nothing here is editorial copy. Every text that needs Arif's approval is
// `null` below and keeps the pages that need it from being built.
import type { Lang } from '../i18n/ui';

type Localized = Record<Lang, string>;

// ---------------------------------------------------------------- Groups
// D3, T-1 (Minder), T-2 (Cadillac alone), R2 (Barrel ekipmanları). Slugs are
// translated (D1). Movement URLs are /<landing>/<group>/<movement>/ for good.

export const groupIds = ['mat', 'reformer', 'cadillac', 'chairs', 'barrels', 'small-props'] as const;
export type GroupId = (typeof groupIds)[number];

export interface Group {
  id: GroupId;
  label: Localized;
  slug: Localized;
}

export const groups: Group[] = [
  { id: 'mat', label: { tr: 'Minder', en: 'Mat' }, slug: { tr: 'minder', en: 'mat' } },
  { id: 'reformer', label: { tr: 'Reformer', en: 'Reformer' }, slug: { tr: 'reformer', en: 'reformer' } },
  { id: 'cadillac', label: { tr: 'Cadillac', en: 'Cadillac' }, slug: { tr: 'cadillac', en: 'cadillac' } },
  { id: 'chairs', label: { tr: 'Sandalyeler', en: 'Chairs' }, slug: { tr: 'sandalyeler', en: 'chairs' } },
  { id: 'barrels', label: { tr: 'Barrel ekipmanları', en: 'Barrels' }, slug: { tr: 'barrel-ekipmanlari', en: 'barrels' } },
  { id: 'small-props', label: { tr: 'Küçük ekipmanlar', en: 'Small props' }, slug: { tr: 'kucuk-ekipmanlar', en: 'small-props' } },
];

// ---------------------------------------------------------------- Sub-apparatus
// Sub-apparatus sit under their group (D3). `verified` needs a source read at
// content level (`source`, an id in src/content/repertoire/*/sources/). A
// `held` sub-apparatus never gets a page and its name is never shown; its
// movements are still published at group level. Every slug listed here, held
// ones included, is reserved in its group, so a sub-apparatus page added later
// can never take a movement's URL. A page needs R1 as well: at least 3
// published movements and its own approved text.
//
// Empty: no sub-apparatus has been verified or approved for listing yet.

export interface SubApparatus {
  id: string;
  group: GroupId;
  /** The English classical name (D2). Shown only when `verified`. */
  name: string;
  slug: Localized;
  status: 'verified' | 'held';
  /** Required when `verified`. */
  source?: string;
}

export const subApparatus: SubApparatus[] = [];

// ---------------------------------------------------------------- Guides
// D5, D6, R6, Q3, Q4 and the confirmed slugs (2026-11-06). Path segment only:
// there is no guide index page (/repertuar/rehberler/, /en/repertoire/guides/).

export const guidesSegment: Localized = { tr: 'rehberler', en: 'guides' };

export const guideIds = ['pregnancy', 'postnatal', 'older-adults', 'children-and-adolescents', 'athletes'] as const;
export type GuideId = (typeof guideIds)[number];

export interface Guide {
  id: GuideId;
  slug: Localized;
  /**
   * Protected guides list movements only with an approved review record
   * (status plus ISO date). Without one they show the D1 disclosure. The
   * athletes guide is evidence-led: no review; every entry has a basis.
   */
  protected: boolean;
  /** Children and adolescents: original illustrations only, never photographs. */
  illustrationsOnly: boolean;
}

export const guides: Guide[] = [
  { id: 'pregnancy', slug: { tr: 'gebelik', en: 'pregnancy' }, protected: true, illustrationsOnly: false },
  { id: 'postnatal', slug: { tr: 'dogum-sonrasi', en: 'postnatal' }, protected: true, illustrationsOnly: false },
  { id: 'older-adults', slug: { tr: 'ileri-yas', en: 'older-adults' }, protected: true, illustrationsOnly: false },
  {
    id: 'children-and-adolescents',
    slug: { tr: 'cocuklar-ve-ergenler', en: 'children-and-adolescents' },
    protected: true,
    illustrationsOnly: true,
  },
  { id: 'athletes', slug: { tr: 'sporcular', en: 'athletes' }, protected: false, illustrationsOnly: false },
];

// ---------------------------------------------------------------- Taxonomy
// Fixed (D4, R2, T1 scope). Keys are internal and never shown. English level
// labels are word for word from the LV1 draft; focus and starting-position
// English labels are the approved interface labels (Q11).

export const levelKeys = ['fundamental', 'intermediate', 'advanced'] as const;
export const focusKeys = ['spinal-mobility', 'strength-control', 'balance', 'coordination', 'flexibility-lengthening'] as const;
export const positionKeys = ['supine', 'prone', 'side-lying', 'seated', 'kneeling', 'standing', 'inverted', 'hanging'] as const;

export type LevelKey = (typeof levelKeys)[number];
export type FocusKey = (typeof focusKeys)[number];
export type PositionKey = (typeof positionKeys)[number];

export const levelLabels: Record<LevelKey, Localized> = {
  fundamental: { tr: 'Temel', en: 'Fundamental' },
  intermediate: { tr: 'Orta', en: 'Intermediate' },
  advanced: { tr: 'İleri', en: 'Advanced' },
};

export const focusLabels: Record<FocusKey, Localized> = {
  'spinal-mobility': { tr: 'Omurga hareketliliği', en: 'Spinal mobility' },
  'strength-control': { tr: 'Kuvvet ve kontrol', en: 'Strength and control' },
  balance: { tr: 'Denge', en: 'Balance' },
  coordination: { tr: 'Koordinasyon', en: 'Coordination' },
  'flexibility-lengthening': { tr: 'Esneklik ve uzama', en: 'Flexibility and lengthening' },
};

export const positionLabels: Record<PositionKey, Localized> = {
  supine: { tr: 'Sırtüstü', en: 'Supine' },
  prone: { tr: 'Yüzüstü', en: 'Prone' },
  'side-lying': { tr: 'Yan yatarak', en: 'Side-lying' },
  seated: { tr: 'Oturarak', en: 'Seated' },
  kneeling: { tr: 'Diz çökerek', en: 'Kneeling' },
  standing: { tr: 'Ayakta', en: 'Standing' },
  inverted: { tr: 'Ters', en: 'Inverted' },
  hanging: { tr: 'Asılı', en: 'Hanging' },
};

// ---------------------------------------------------------------- Voices
// R5: record, tradition and research text is labelled; editorial text is
// unlabelled. A statement's voice must match its sources' kind, and editorial
// statements carry no sources (Q6).

export const voices = ['record', 'tradition', 'research', 'editorial'] as const;
export type Voice = (typeof voices)[number];
export type SourceVoice = Exclude<Voice, 'editorial'>;

// ---------------------------------------------------------------- Copy and gates
// Accepted in principle only (T-8); not final, not published in T1. Each null
// field keeps every page that needs it from being built (see
// src/lib/repertoire.ts); in `astro dev` its place shows a DevPlaceholder.
//   L1–L4  landing page text (the landing pages are not changed in T1)
//   D1     disclosure on a protected guide without an approved review
//   V1     voice key, on every page with statements
//   LV1    note beside the level label, on every movement page
//   P1     precaution block, on every movement page; also needs a supporting
//          health source and `precautionCleared` (T-8)
//   voiceLabels      the three voice labels (TR accepted in principle)
//   editorialExample marker on an athletes-guide entry chosen as an editorial example
//   uiLabels         headings and interface words of the templates
// scripts/test-repertoire-exclusion.mjs replaces this block in a temporary
// copy of the project only, to test published pages with fictional copy.

export interface LandingStatement {
  text: Localized;
  voice: Voice;
  /** Source ids; empty for editorial text. */
  sources: string[];
}

export interface UiLabels {
  summary: string;
  setup: string;
  execution: string;
  breathing: string;
  variations: string;
  differences: string;
  level: string;
  focus: string;
  startingPosition: string;
  movements: string;
  sources: string;
  limits: string;
  breadcrumb: string;
}

export interface RepertoireCopy {
  landing: Record<'l1' | 'l2' | 'l3' | 'l4', LandingStatement | null>;
  d1: Localized | null;
  v1: Localized | null;
  lv1: Localized | null;
  p1: Localized | null;
  voiceLabels: Record<Lang, Record<SourceVoice, string>> | null;
  editorialExample: Localized | null;
  uiLabels: Record<Lang, UiLabels> | null;
}

// BEGIN REPERTOIRE COPY
export const repertoireCopy: RepertoireCopy = {
  landing: { l1: null, l2: null, l3: null, l4: null },
  d1: null,
  v1: null,
  lv1: null,
  p1: null,
  voiceLabels: null,
  editorialExample: null,
  uiLabels: null,
};

/** P1 gate: false until P1's wording and its health source are approved. */
export const precautionCleared = false;
// END REPERTOIRE COPY
