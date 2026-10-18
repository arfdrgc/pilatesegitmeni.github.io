import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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

export const collections = { articles };
