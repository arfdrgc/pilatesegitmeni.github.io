// The copy and images of the İlham / Inspiration page, shown by
// src/components/inspiration/InspirationArticle.astro. The handle comes from
// src/config/brand.json.
import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/ui';

export type InspirationSlotId = 'perspective' | 'movement' | 'awareness';

export interface InspirationCopy {
  /** The page's meta description. */
  description: string;
  statement: string;
  intro: string;
  slots: Record<InspirationSlotId, string>;
  closing: string;
  /** What Instagram is to the platform. It must not imply the account already covers every topic in the intro. */
  instagramRole: string;
  /** The Instagram link below the intro. */
  exploreLink: string;
  /** The Instagram link in the closing. */
  followLink: string;
  /** Its accessible name: the short label alone doesn't say what is followed. It must contain the label. */
  followLinkName: string;
}

export interface InspirationImage {
  src: ImageMetadata;
  alt: Record<Lang, string>;
}

export const inspiration: Record<Lang, InspirationCopy> = {
  tr: {
    description: 'Hareket, beden farkındalığı ve sağlıklı yaşam alışkanlıkları hakkında güvenilir, öğretici ve ilham veren bilgiler.',
    statement: 'Hareketli bir yaşam, küçük farkındalıklarla başlar.',
    intro:
      "Pilates'ten günlük yürüyüşe, bedeni tanımaktan sağlıklı yaşam alışkanlıklarına uzanan bir keşif alanı. Güvenilir bilgiler, ilham veren içerikler ve daha hareketli bir yaşam için yeni bakış açıları.",
    slots: {
      perspective: "Pilates'e bakış",
      movement: 'Hareketin dili',
      awareness: 'Bedenin farkındalığı',
    },
    closing: 'Sağlıklı bir yaşam için keşfetmeye devam et.',
    instagramRole: "Pilates, hareket ve sağlıklı yaşam üzerine içeriklerimizi Instagram'da keşfet.",
    exploreLink: "Instagram'da bize katıl",
    followLink: 'Takip et',
    followLinkName: "Instagram'da @pilatesegitmeni hesabını takip et",
  },
  en: {
    description: 'Reliable, educational and inspiring information about movement, body awareness and healthy lifestyle habits.',
    statement: 'An active life begins with small moments of awareness.',
    intro:
      'A place to explore, from Pilates to the daily walk, from understanding the body to healthy everyday habits. Reliable information, inspiring content and fresh ways of looking at a more active life.',
    slots: {
      perspective: 'A perspective on Pilates',
      movement: 'The language of movement',
      awareness: 'Body awareness',
    },
    closing: 'Keep exploring the path to a healthy life.',
    instagramRole: 'Explore our content on Pilates, movement and healthy living on Instagram.',
    exploreLink: 'Join us on Instagram',
    followLink: 'Follow',
    followLinkName: 'Follow @pilatesegitmeni on Instagram',
  },
};

// The three images. While a slot is null its frame shows the drawn placeholder.
// To add an image, put it in src/assets/, import it here and set src and both
// alt texts. It must be original or licensed:
//
//   import photo from '../assets/inspiration-perspective.jpg';
//   perspective: { src: photo, alt: { tr: '…', en: '…' } },
//
// Each frame keeps its proportions whatever the file's shape, so the layout
// doesn't change.
export const inspirationImages: Record<InspirationSlotId, InspirationImage | null> = {
  perspective: null,
  movement: null,
  awareness: null,
};
