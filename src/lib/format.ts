import type { Lang } from '../i18n/ui';

// "18 Ekim 2026" / "18 October 2026"
const dateFormats: Record<Lang, Intl.DateTimeFormat> = {
  tr: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
};

export function formatDate(date: Date, lang: Lang): string {
  return dateFormats[lang].format(date);
}

/** Value for <time datetime>. Frontmatter dates are parsed as UTC midnight. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
