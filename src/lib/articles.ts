import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { articlePath, isLang, type Translations } from '../i18n/utils';

export type Article = CollectionEntry<'articles'>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** src/content/articles/ holds publishable articles; src/content/samples/ holds dev-only fixtures. */
type Source = 'articles' | 'samples';

function pathParts(article: Article): { source: Source; lang: Lang; slug: string } {
  const parts = (article.filePath ?? '').split('/');
  const file = parts.at(-1) ?? '';
  const folder = parts.at(-2);
  const source = parts.at(-3);
  const slug = file.replace(/\.md$/, '');
  if (source !== 'articles' && source !== 'samples') {
    throw new Error(`Article "${article.filePath}" must be inside src/content/articles/ or src/content/samples/.`);
  }
  if (!isLang(folder)) {
    throw new Error(`Article "${article.filePath}" must be inside a tr/ or en/ folder.`);
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Article file name "${file}" must be lowercase ASCII words separated by hyphens (e.g. yazi-basligi.md).`,
    );
  }
  return { source, lang: folder, slug };
}

/** Sample fixtures must say so, and publishable articles must not. */
function checkSampleFlag(article: Article): void {
  const { source } = pathParts(article);
  if (source === 'samples' && !article.data.sample) {
    throw new Error(`Sample fixture "${article.filePath}" must set "sample: true".`);
  }
  if (source === 'articles' && article.data.sample) {
    throw new Error(
      `"${article.filePath}" is marked "sample: true". Sample fixtures belong in src/content/samples/, not src/content/articles/.`,
    );
  }
}

export function articleLang(article: Article): Lang {
  return pathParts(article).lang;
}

export function articleSlug(article: Article): string {
  return pathParts(article).slug;
}

export function articleUrl(article: Article): string {
  const { lang, slug } = pathParts(article);
  return articlePath(lang, slug);
}

/**
 * The only way pages should read articles. In production, draft and sample
 * entries are always dropped (sample fixtures aren't even loaded); in local
 * development everything is shown.
 */
export async function getPublishedArticles(lang?: Lang): Promise<Article[]> {
  const all = await getCollection('articles');
  all.forEach(checkSampleFlag);
  const entries = all.filter(({ data }) => import.meta.env.DEV || (!data.draft && !data.sample));
  return lang ? entries.filter((entry) => articleLang(entry) === lang) : entries;
}

export function newestFirst(a: Article, b: Article): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf() || a.data.title.localeCompare(b.data.title);
}

const isProductionArticle = (article: Article) => !article.data.draft && !article.data.sample;

/**
 * Homepage articles in one language: the newest is featured, the next ones
 * are listed. Other languages are never mixed in.
 */
export async function getHomeArticles(lang: Lang, listLimit = 6) {
  const articles = (await getPublishedArticles(lang)).sort(newestFirst);
  const featured: Article | undefined = articles[0];
  const rest = articles.slice(1);
  return {
    featured,
    latest: rest.slice(0, listLimit),
    hasMore: rest.length > listLimit,
    // How many of these a production build would show (drafts and samples only appear in development).
    productionCount: articles.filter(isProductionArticle).length,
  };
}

/** Paths of the published translations of an article (including itself). */
export async function getArticleTranslations(article: Article): Promise<Translations> {
  const translations: Translations = { [articleLang(article)]: articleUrl(article) };
  const key = article.data.translationKey;
  if (!key) return translations;
  for (const entry of await getPublishedArticles()) {
    if (entry.id !== article.id && entry.data.translationKey === key) {
      translations[articleLang(entry)] = articleUrl(entry);
    }
  }
  return translations;
}
