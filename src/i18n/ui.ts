export const languages = ['tr', 'en'] as const;
export type Lang = (typeof languages)[number];

export const defaultLang: Lang = 'tr';

// Interface text only. Brand and editorial copy lives in src/config/home.json.
const tr = {
  languageName: 'Türkçe',
  skipToContent: 'İçeriğe geç',
  logoAlt: 'Pilates Eğitmeni logosu',
  homeLabel: 'Ana sayfa',
  mainNav: 'Ana menü',
  featured: 'Öne çıkan',
  latestArticles: 'Son yazılar',
  allArticles: 'Tüm yazılar',
  followOnInstagram: "Instagram'da takip et",
  // Shown uppercase via CSS (.label), so screen readers read a word, not letters.
  instagramLabel: 'Instagram',
  photoCredit: 'Fotoğraf:',
  notFoundTitle: 'Sayfa bulunamadı',
  notFoundText: 'Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.',
  backToHome: 'Ana sayfaya dön',
};

// Every Turkish key must exist in English too (type error otherwise).
const en: Record<keyof typeof tr, string> = {
  languageName: 'English',
  skipToContent: 'Skip to content',
  logoAlt: 'Pilates Eğitmeni logo',
  homeLabel: 'Home',
  mainNav: 'Main menu',
  featured: 'Featured',
  latestArticles: 'Latest articles',
  allArticles: 'All articles',
  followOnInstagram: 'Follow on Instagram',
  instagramLabel: 'Instagram',
  photoCredit: 'Photo:',
  notFoundTitle: 'Page not found',
  notFoundText: "The page you're looking for may have moved or no longer exists.",
  backToHome: 'Go to the homepage',
};

export const ui: Record<Lang, Record<keyof typeof tr, string>> = { tr, en };

// Open Graph locale values.
export const ogLocales: Record<Lang, string> = {
  tr: 'tr_TR',
  en: 'en_US',
};
