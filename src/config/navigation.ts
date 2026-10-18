import type { Lang } from '../i18n/ui';

export interface NavItem {
  label: Record<Lang, string>;
  path: Record<Lang, string>;
}

// Add an item only once its page is built in both languages:
// scripts/check-dist.mjs fails the build on links to pages that don't exist.
export const headerNav: NavItem[] = [];
export const footerNav: NavItem[] = [];

// Articles index ("Tüm yazılar"), linked from the homepage list once it exists.
export const articlesIndexPath: Record<Lang, string> | null = null;
