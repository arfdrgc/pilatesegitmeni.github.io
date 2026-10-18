import { defaultLang, languages, ui, type Lang } from './ui';

/**
 * Paths of every existing language version of a page (including the current
 * one), keyed by language. Only pages that are actually built may appear here:
 * these paths drive the language link and the hreflang alternates.
 */
export type Translations = Partial<Record<Lang, string>>;

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (languages as readonly string[]).includes(value);
}

export function getLang(currentLocale: string | undefined): Lang {
  return isLang(currentLocale) ? currentLocale : defaultLang;
}

export function t(lang: Lang) {
  return ui[lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'tr' ? 'en' : 'tr';
}

export function homePath(lang: Lang): string {
  return lang === defaultLang ? '/' : `/${lang}/`;
}

const articleBase: Record<Lang, string> = {
  tr: '/yazilar/',
  en: '/en/articles/',
};

export function articlePath(lang: Lang, slug: string): string {
  return `${articleBase[lang]}${slug}/`;
}

/** Where the language link points: the translation if it exists, otherwise the other language's homepage. */
export function languageSwitchPath(lang: Lang, translations: Translations): string {
  const target = otherLang(lang);
  return translations[target] ?? homePath(target);
}
