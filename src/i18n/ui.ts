export const languages = ['tr', 'en'] as const;
export type Lang = (typeof languages)[number];

export const defaultLang: Lang = 'tr';

// Interface text only. Brand and editorial copy lives in src/config/home.json.
const tr = {
  languageName: 'Türkçe',
  skipToContent: 'İçeriğe geç',
  homeLabel: 'Ana sayfa',
  mainNav: 'Ana menü',
  featured: 'Öne çıkan',
  latestArticles: 'Son yazılar',
  allArticles: 'Tüm yazılar',
  followOnInstagram: "Instagram'da takip et",
  // Shown uppercase via CSS (.label), so screen readers read a word, not letters.
  instagramLabel: 'Instagram',
  photoCredit: 'Fotoğraf:',
};

// Every Turkish key must exist in English too (type error otherwise).
const en: Record<keyof typeof tr, string> = {
  languageName: 'English',
  skipToContent: 'Skip to content',
  homeLabel: 'Home',
  mainNav: 'Main menu',
  featured: 'Featured',
  latestArticles: 'Latest articles',
  allArticles: 'All articles',
  followOnInstagram: 'Follow on Instagram',
  instagramLabel: 'Instagram',
  photoCredit: 'Photo:',
};

export const ui: Record<Lang, Record<keyof typeof tr, string>> = { tr, en };

// Open Graph locale values.
export const ogLocales: Record<Lang, string> = {
  tr: 'tr_TR',
  en: 'en_US',
};
