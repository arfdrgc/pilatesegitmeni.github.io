// DEVELOPMENT ONLY. Fictional resolved props for the Repertuar templates
// (T-10, R9): no real movement, apparatus, history, source or health claim.
// Every text carries the marker KURGUSAL ÖNİZLEME / FICTIONAL PREVIEW and a
// pangram; every id starts with "fixture-". It is outside the content
// collections and the source model, and only src/dev/RepertoirePreview.astro
// imports it (behind `import.meta.env.DEV`). scripts/check-dist.mjs fails a
// build whose output contains the marker; scripts/test-repertoire-exclusion.mjs
// checks that nothing else imports this file.
import placeholder from '../content/samples/images/sample-placeholder-4x5.png';
import type { Lang } from '../i18n/ui';
import type { Translations } from '../i18n/utils';
import type {
  Breadcrumb,
  GroupPageProps,
  GuidePageProps,
  MovementCardProps,
  MovementPageProps,
  PageCopy,
  ResolvedFacets,
  ResolvedMedia,
  ResolvedSource,
  ResolvedStatement,
} from '../lib/repertoire';

export const fixtureViews = ['movement', 'group', 'sub-apparatus', 'guide-athletes', 'guide-protected', 'guide-children'] as const;
export type FixtureView = (typeof fixtureViews)[number];

const marker: Record<Lang, string> = { tr: 'KURGUSAL ÖNİZLEME', en: 'FICTIONAL PREVIEW' };
const pangram: Record<Lang, string> = {
  tr: 'Pijamalı hasta yağız şoföre çabucak güvendi.',
  en: 'The quick brown fox jumps over the lazy dog.',
};

const text = (lang: Lang, what: string) => `${marker[lang]}: ${what}. ${pangram[lang]}`;

const say = (lang: Lang, what: string, voice: ResolvedStatement['voice'] = 'editorial', pages?: string): ResolvedStatement => ({
  text: text(lang, what),
  voice,
  citations: voice === 'editorial' ? [] : [{ cite: `Fixture ${voice} 0000`, pages }],
  links: [],
});

const sources: ResolvedSource[] = [
  { id: 'fixture-record', kind: 'record', cite: 'Fixture record 0000', title: 'Fixture record (fictional)', authors: ['Fixture A.'], year: '0000' },
  {
    id: 'fixture-tradition',
    kind: 'tradition',
    cite: 'Fixture tradition 0000',
    title: 'Fixture tradition (fictional)',
    authors: ['Fixture B.'],
    year: '0000',
    tradition: 'Fixture tradition',
  },
  { id: 'fixture-research', kind: 'research', cite: 'Fixture research 0000', title: 'Fixture research (fictional)', authors: ['Fixture C.'], year: '0000' },
];

const facets = (lang: Lang): ResolvedFacets => ({
  level: { key: 'fundamental', label: lang === 'tr' ? 'Temel' : 'Fundamental' },
  focus: [{ key: 'balance', label: lang === 'tr' ? 'Denge' : 'Balance' }],
  startingPosition: { key: 'supine', label: lang === 'tr' ? 'Sırtüstü' : 'Supine' },
});

const media = (lang: Lang, kind: ResolvedMedia['kind']): ResolvedMedia => ({
  src: placeholder,
  alt: text(lang, `${kind} alt text`),
  kind,
  credit: 'Fixture credit',
  license: 'Fixture license',
});

const card = (lang: Lang, name: string, withMedia = true): MovementCardProps => ({
  name,
  href: '#fixture',
  summary: text(lang, `${name} summary`),
  facets: facets(lang),
  media: withMedia ? media(lang, 'illustration') : undefined,
});

const breadcrumb = (lang: Lang, group?: boolean): Breadcrumb => ({
  landing: { href: lang === 'tr' ? '/repertuar/' : '/en/repertoire/', label: lang === 'tr' ? 'Repertuar' : 'Repertoire' },
  trail: group ? [{ label: 'Fixture group' }] : [],
});

/** Props for one template view; copy is the real configuration (nulls show as placeholders). */
export function fixtureProps(
  view: FixtureView,
  lang: Lang,
  copy: PageCopy,
  translations: Translations,
): { kind: 'movement'; props: MovementPageProps } | { kind: 'group'; props: GroupPageProps } | { kind: 'guide'; props: GuidePageProps } {
  const base = { lang, translations, sources, copy };
  switch (view) {
    case 'movement':
      return {
        kind: 'movement',
        props: {
          ...base,
          breadcrumb: breadcrumb(lang, true),
          name: 'Fixture Movement Alpha',
          facets: facets(lang),
          summary: [say(lang, 'summary, editorial'), say(lang, 'summary, record', 'record', '1')],
          setup: [say(lang, 'setup, tradition', 'tradition', '2')],
          execution: [say(lang, 'execution, tradition', 'tradition', '3'), say(lang, 'execution, editorial')],
          breathing: [say(lang, 'breathing, research', 'research')],
          variations: [{ name: 'Fixture variation', statements: [say(lang, 'variation, tradition', 'tradition', '4')] }],
          differences: [say(lang, 'difference between traditions', 'tradition', '5')],
          media: [media(lang, 'stage-photo')],
        },
      };
    case 'group':
    case 'sub-apparatus':
      return {
        kind: 'group',
        props: {
          ...base,
          variant: view,
          breadcrumb: breadcrumb(lang, view === 'sub-apparatus'),
          title: view === 'group' ? 'Fixture group' : 'Fixture sub-apparatus',
          intro: [say(lang, `${view} intro, record`, 'record', '6'), say(lang, `${view} intro, editorial`)],
          diagram: { src: placeholder, alt: text(lang, 'diagram alt text'), credit: 'Fixture credit', license: 'Fixture license' },
          sections:
            view === 'group'
              ? [
                  { movements: [card(lang, 'Fixture Movement Alpha'), card(lang, 'Fixture Movement Beta')] },
                  { heading: { label: 'Fixture sub-apparatus', anchor: 'fixture-sub' }, movements: [card(lang, 'Fixture Movement Gamma')] },
                ]
              : [{ movements: [card(lang, 'Fixture Movement Gamma'), card(lang, 'Fixture Movement Delta'), card(lang, 'Fixture Movement Epsilon')] }],
        },
      };
    case 'guide-athletes':
    case 'guide-protected':
    case 'guide-children': {
      const athletes = view === 'guide-athletes';
      const children = view === 'guide-children';
      return {
        kind: 'guide',
        props: {
          ...base,
          breadcrumb: breadcrumb(lang),
          title: `Fixture guide (${view})`,
          intro: [say(lang, `${view} intro`)],
          limits: [say(lang, `${view} limits`)],
          // Protected without movements: not reviewed, so D1 shows. The children fixture lists
          // movements, which a protected guide may do only with an approved review.
          disclosure: view === 'guide-protected',
          entries: athletes
            ? [
                { ...card(lang, 'Fixture Movement Alpha'), note: say(lang, 'evidence note, research', 'research', '7') },
                { ...card(lang, 'Fixture Movement Beta'), note: say(lang, 'editorial example note'), editorialExample: true },
              ]
            : children
              ? [card(lang, 'Fixture Movement Gamma'), card(lang, 'Fixture Movement Delta', false)]
              : [],
          media: children ? [media(lang, 'illustration')] : [],
        },
      };
    }
  }
}
