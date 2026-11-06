import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { focusKeys, groupIds, levelKeys, positionKeys, voices } from './config/repertoire';

// Articles live in src/content/articles/tr/ and src/content/articles/en/.
// The folder sets the language and the file name sets the URL slug
// (see src/lib/articles.ts), so frontmatter can't contradict either.
const articles = defineCollection({
  // Sample fixtures (src/content/samples/) are loaded only by the dev server, so
  // a production build never sees them or their images.
  loader: glob({
    base: './src/content',
    pattern: import.meta.env.DEV
      ? ['articles/{tr,en}/**/*.md', 'samples/{tr,en}/**/*.md']
      : 'articles/{tr,en}/**/*.md',
  }),
  schema: ({ image }) =>
    z.strictObject({
      title: z.string().min(1),
      description: z.string().min(1),
      // Shared by the TR and EN versions of the same article.
      translationKey: z.string().min(1).optional(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.string().min(1),
      draft: z.boolean().default(false),
      // Required on every file in src/content/samples/ and rejected in
      // src/content/articles/ (see src/lib/articles.ts).
      sample: z.boolean().default(false),
      cover: z
        .strictObject({
          src: image(),
          alt: z.string().min(1),
          credit: z.string().min(1),
          license: z.string().min(1),
        })
        .optional(),
      sources: z
        .array(
          z.strictObject({
            title: z.string().min(1),
            publisher: z.string().min(1),
            url: z.url(),
            accessed: z.coerce.date(),
          }),
        )
        .default([]),
      // Only real people provided by the site owner. No defaults.
      author: z.string().min(1).optional(),
      reviewer: z.string().min(1).optional(),
    }),
});

// ---------------------------------------------------------------- Repertuar
// Movement and apparatus library (src/config/repertoire.ts for the fixed
// structure, src/lib/repertoire.ts for the rules across files). Everything
// lives under src/content/repertoire/<status>/ where <status> is `published`
// (meant for publication; whether a page is actually built is computed) or
// `_drafts` (work in progress). Drafts are loaded only by `astro dev`, so a
// production build never sees them or their images. The glob loader does
// not skip `_`-prefixed folders on its own, hence the explicit patterns.
//
//   sources/<id>.yaml                      language-neutral source records
//   movements/<id>.yaml                    shared movement data
//   movement-text/{tr,en}/<id>.yaml        movement text per language
//   group-text/{tr,en}/<group>.yaml        group page text per language
//   group-text/{tr,en}/<group>/<sub>.yaml  sub-apparatus page text
//   guides/<guide>.yaml                    shared guide data (entries, review)
//   guide-text/{tr,en}/<guide>.yaml        guide text per language
//
// File names give ids, languages and statuses; no entry has a `slug` field.
const repertoireBase = './src/content/repertoire';
const repertoirePattern = (path: string) =>
  import.meta.env.DEV ? [`published/${path}`, `_drafts/${path}`] : `published/${path}`;

// YAML turns an unquoted 2026-11-06 into a Date; both forms become 'YYYY-MM-DD'.
const isoDate = z.preprocess((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value), z.iso.date());
const nonEmpty = z.string().trim().min(1);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase ASCII words separated by hyphens');

/** Q8: a status and an ISO date; no approver. */
const approval = z.strictObject({ status: z.enum(['draft', 'approved']), date: isoDate });

const citation = z.strictObject({ source: id, pages: nonEmpty.optional() });

/** Every prose field is a list of statements, each with its voice and sources (revision 3, R3, R5, Q6). */
const statement = z.strictObject({
  text: nonEmpty,
  voice: z.enum(voices),
  sources: z.array(citation).default([]),
  // Internal links as structured data, never inline markup (R3).
  links: z
    .array(z.strictObject({ to: z.enum(['movement', 'group', 'guide']), id, label: nonEmpty }))
    .default([]),
});
const statements = z.array(statement).min(1);

const repertoireSources = defineCollection({
  loader: glob({ base: repertoireBase, pattern: repertoirePattern('sources/*.yaml') }),
  schema: z.strictObject({
    kind: z.enum(['record', 'tradition', 'research']),
    // Only `content` (read at content level) may support a statement (R4).
    access: z.enum(['content', 'catalogue', 'search']),
    /** Short form shown beside a statement, e.g. "Pilates 1960". */
    cite: nonEmpty,
    title: nonEmpty,
    authors: z.array(nonEmpty).default([]),
    year: nonEmpty,
    publisher: nonEmpty.optional(),
    edition: nonEmpty.optional(),
    /** The teaching tradition, named (D14, R4). Required for `tradition` sources. */
    tradition: nonEmpty.optional(),
    identifiers: z
      .strictObject({
        isbn: z.array(nonEmpty).optional(),
        lccn: nonEmpty.optional(),
        oclc: nonEmpty.optional(),
        doi: nonEmpty.optional(),
        patent: nonEmpty.optional(),
      })
      .optional(),
    url: z.url().optional(),
  }),
});

const repertoireMovements = defineCollection({
  loader: glob({ base: repertoireBase, pattern: repertoirePattern('movements/*.yaml') }),
  schema: ({ image }) =>
    z.strictObject({
      /** The classical English name, the page title in both languages (D2). */
      name: nonEmpty,
      group: z.enum(groupIds),
      subApparatus: id.optional(),
      level: z.enum(levelKeys),
      focus: z.array(z.enum(focusKeys)).min(1),
      startingPosition: z.enum(positionKeys),
      /** Inspected sources naming the movement on this apparatus (R4). */
      attestations: z.array(citation).min(1),
      /** Sources dispute it: two attestations from different named traditions (R4). */
      disputed: z.boolean().default(false),
      /** A visual of this movement (R7); alt text is in each language's file. */
      media: z
        .array(
          z.strictObject({
            id,
            kind: z.enum(['photo', 'stage-photo', 'illustration']),
            src: image(),
            credit: nonEmpty,
            license: nonEmpty,
          }),
        )
        .default([]),
    }),
});

const mediaAlt = z.array(z.strictObject({ id, alt: nonEmpty })).default([]);

const repertoireMovementText = defineCollection({
  loader: glob({ base: repertoireBase, pattern: repertoirePattern('movement-text/{tr,en}/*.yaml') }),
  schema: z.strictObject({
    approval,
    // Q3.
    summary: statements,
    setup: statements,
    execution: statements,
    breathing: statements,
    /** Actual movement variations only. */
    variations: z.array(z.strictObject({ name: nonEmpty, statements })).default([]),
    /** Where sources or traditions disagree: tradition statements naming theirs (R4). */
    differences: z.array(statement).default([]),
    media: mediaAlt,
  }),
});

const repertoireGroupText = defineCollection({
  loader: glob({ base: repertoireBase, pattern: repertoirePattern('group-text/{tr,en}/{*.yaml,*/*.yaml}') }),
  schema: ({ image }) =>
    z.strictObject({
      approval,
      intro: statements,
      /** R10: a group page needs its diagram. Diagrams are not approved yet (R12). */
      diagram: z.strictObject({ src: image(), alt: nonEmpty, credit: nonEmpty, license: nonEmpty }).optional(),
    }),
});

const repertoireGuides = defineCollection({
  loader: glob({ base: repertoireBase, pattern: repertoirePattern('guides/*.yaml') }),
  schema: ({ image }) =>
    z.strictObject({
      /** Curated movements; being listed never implies suitability (D5). */
      entries: z
        .array(
          z.strictObject({
            movement: id,
            /** Athletes guide only, and required there. */
            basis: z.enum(['evidence', 'editorial-example']).optional(),
          }),
        )
        .default([]),
      /** Protected guides: a review record, status plus ISO date (Q8); no reviewer fields yet. */
      review: z.strictObject({ status: z.enum(['pending', 'approved']), date: isoDate }).optional(),
      media: z
        .array(
          z.strictObject({
            id,
            kind: z.enum(['photo', 'stage-photo', 'illustration']),
            src: image(),
            credit: nonEmpty,
            license: nonEmpty,
          }),
        )
        .default([]),
    }),
});

const repertoireGuideText = defineCollection({
  loader: glob({ base: repertoireBase, pattern: repertoirePattern('guide-text/{tr,en}/*.yaml') }),
  schema: z.strictObject({
    approval,
    title: nonEmpty,
    intro: statements,
    /** What the guide is not (D5, D6); separate from the D1 disclosure (R6). */
    limits: statements,
    /** One note per entry: research for `evidence`, editorial for `editorial-example`. */
    notes: z.array(z.strictObject({ movement: id, note: statement })).default([]),
    media: mediaAlt,
  }),
});

export const collections = {
  articles,
  repertoireSources,
  repertoireMovements,
  repertoireMovementText,
  repertoireGroupText,
  repertoireGuides,
  repertoireGuideText,
};
