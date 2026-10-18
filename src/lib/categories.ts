import categories from '../config/categories.json';
import type { Lang } from '../i18n/ui';

// Approved categories, keyed by the value used in article frontmatter,
// e.g. { "key": { "tr": "…", "en": "…" } }. Empty until categories are approved.
const approved: Record<string, Partial<Record<Lang, string>>> = categories;

/**
 * The approved label for a category, or null in local development (the caller
 * shows a placeholder). A production build stops instead of guessing a label.
 */
export function categoryLabel(key: string, lang: Lang): string | null {
  const label = approved[key]?.[lang];
  if (label) return label;
  if (import.meta.env.DEV) return null;
  throw new Error(`Category "${key}" has no approved ${lang} label in src/config/categories.json.`);
}
