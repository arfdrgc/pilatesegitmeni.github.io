// The homepage's first editorial section, shown after the intro by
// src/components/home/EditorialSection.astro. Copy approved by the owner on
// 2026-11-01. There is no link for now, also by the owner's decision.
import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/ui';

export interface EditorialCopy {
  heading: string;
  paragraph: string;
}

export interface EditorialImage {
  src: ImageMetadata;
  alt: Record<Lang, string>;
}

export const homeEditorial: Record<Lang, EditorialCopy> = {
  tr: {
    heading: 'Bedenini tanı, hareketini keşfet.',
    paragraph:
      'Pilates, bedenin nasıl hareket ettiğini anlamakla başlar. Nefes, denge, kontrol ve farkındalık bir araya gelerek hareketle kurduğumuz ilişkiyi dönüştürür. Her hareket, bedenini daha yakından tanımak için bir fırsattır.',
  },
  en: {
    heading: 'Know your body, discover your movement.',
    paragraph:
      'Pilates begins with understanding how the body moves. Breath, balance, control and awareness come together to transform our relationship with movement. Every movement is an opportunity to get to know your body better.',
  },
};

// The section's image. While this is null the section shows its plain 4:3
// placeholder. To add the final image, put it in src/assets/, import it here and
// set src and both alt texts:
//
//   import photo from '../assets/home-editorial.jpg';
//   export const homeEditorialImage: EditorialImage | null = {
//     src: photo,
//     alt: { tr: '…', en: '…' },
//   };
//
// The frame stays 4:3 whatever the file's shape, so the layout doesn't change.
export const homeEditorialImage: EditorialImage | null = null;
