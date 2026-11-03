// The Miras / Legacy page: its outline, copy, sources, figures and photographs,
// shown by src/components/legacy/LegacyArticle.astro on /miras/ and
// /en/legacy/ (connected on the owner's instruction, 2026-11-03).
//
// The copy is the "Draft copy" tab of the "Miras: content review" document
// (revision 4), moved here word for word on the owner's instruction
// (2026-11-03). Its paragraph-to-source map stays in that document.
//
// The page's design ("Following a life", approved by the owner on 2026-11-03):
// Joseph Pilates' life as one line of five chapters, 1883–1967, not to scale;
// what came after 1967 as its own text part of the last chapter; the patent
// sheets inside their chapters, as supporting documents.
import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/ui';
// Unaltered copies of the original drawing sheets, as served by Google Patents
// (2320 x 3408 px, 1-bit greyscale PNG; checked byte for byte on 2026-11-03).
import gymnasticApparatusSheet from '../assets/legacy/us-1621477-gymnastic-apparatus-sheet-1.png';
import chairSheet from '../assets/legacy/us-1969901-chair-sheet-3.png';
import doubleFrameBedSheet from '../assets/legacy/us-2570855-double-frame-bed-sheet-2.png';
// Photographs selected and approved for the page by the owner (2026-11-03):
// byte copies of ../reference_assets/JHP/JHP_02.jpg, JHP_03.jpg and JHP_04.jpg
// (the first two are PNG files despite their .jpg names, so the copies are .png).
import photo02 from '../assets/legacy/photos/jhp-02.png';
import photo03 from '../assets/legacy/photos/jhp-03.png';
import photo04 from '../assets/legacy/photos/jhp-04.jpg';

/** The review labels of the Draft copy tab. [5.5] was removed and isn't reused. */
export type LegacyParagraphId =
  | '0.1' | '0.2'
  | '1.1' | '1.2'
  | '2.1' | '2.2' | '2.3' | '2.4'
  | '3.1' | '3.2' | '3.3'
  | '4.1' | '4.2' | '4.3'
  | '5.1' | '5.2' | '5.3' | '5.4' | '5.6' | '5.7'
  | '6.1';

export type LegacyChapterId = 'beginnings' | 'war-years' | 'contrology' | 'new-york' | 'books';

export interface LegacyChapter {
  id: LegacyChapterId;
  /**
   * The approved chapter heading. The page shows the part before " · " as the
   * title and the part after it (place and years) as a label line; the heading's
   * text stays whole for screen readers.
   */
  title: Record<Lang, string>;
  paragraphs: LegacyParagraphId[];
  /** A large figure taken from the heading, shown beside it as decoration only. */
  numeral?: string;
  /** The text about what came after 1967, set apart at the end of the chapter. */
  after1967?: LegacyParagraphId[];
}

/** The opening, before the chapters: [0.1] and [0.2]. */
export const legacyOpening: LegacyParagraphId[] = ['0.1', '0.2'];

// The approved five chapters, in their order: the stops on the page's life line.
export const legacyChapters: LegacyChapter[] = [
  {
    id: 'beginnings',
    title: { tr: 'Başlangıç · Mönchengladbach, 1883', en: 'Beginnings · Mönchengladbach, 1883' },
    paragraphs: ['1.1', '1.2'],
    numeral: '1883',
  },
  {
    id: 'war-years',
    title: { tr: 'Savaş yılları · Lancaster ve Knockaloe, 1914–1919', en: 'The war years · Lancaster and Knockaloe, 1914–1919' },
    paragraphs: ['2.1', '2.2', '2.3', '2.4'],
  },
  {
    id: 'contrology',
    title: { tr: 'Contrology · Bir yöntemin adı, 1919–1945', en: 'Contrology · Naming a method, 1919–1945' },
    paragraphs: ['3.1', '3.2', '3.3'],
  },
  {
    id: 'new-york',
    title: { tr: 'New York ve Clara · 939 Eighth Avenue', en: 'New York and Clara · 939 Eighth Avenue' },
    paragraphs: ['4.1', '4.2', '4.3'],
    numeral: '939',
  },
  {
    id: 'books',
    title: { tr: 'Kitaplar, aletler, öğrenciler', en: 'Books, apparatus, students' },
    paragraphs: ['5.1', '5.2', '5.3'],
    after1967: ['5.4', '5.6', '5.7'],
  },
];

/** After the chapters, before the sources. */
export const legacyClosing: LegacyParagraphId[] = ['6.1'];

/**
 * The page copy: the "Draft copy" tab of the "Miras: content review" document,
 * revision 4 (2026-11-03), word for word; the owner moved it into the preview
 * on 2026-11-03. Each paragraph's sources: that document's paragraph-to-source
 * map. The run-in labels of [2.2] and [2.3] are in `legacyVoiceLabels`. A
 * missing paragraph isn't rendered.
 */
export const legacyCopy: Record<Lang, Partial<Record<LegacyParagraphId, string>>> = {
  tr: {
    '0.1': "Pilates adı, bugün bir egzersiz yöntemiyle anılıyor. Bu adın ardında ise Joseph Pilates'in hayatı ve geliştirdiği bir çalışma yaklaşımının tarihi var.",
    '0.2': "Joseph Pilates'in hayatına dair bilinenlerin bir bölümü, onun yıllar sonra kendi anlattıklarına dayanır. Bu sayfa, dönemin kayıtlarıyla desteklenen bilgileri sonraki anlatımlardan ayrı tutar. Burada yöntemin nasıl çalıştığını değil, bir adın ve bir çalışma yaklaşımının tarihini okuyacaksın.",
    '1.1': "Joseph Pilates 1883'te Almanya'nın Mönchengladbach kentinde doğdu. Tarihçi Eva Rincke'nin aktardığına göre babası Friedrich Pilates bir jimnastikçiydi; Rincke'nin yazısında, kent arşivine ait olduğu belirtilen ve babasının jimnastik grubunu gösteren bir fotoğraf yer alıyor.",
    '1.2': "Çocukluğu ve gençliği hakkında anlatılanların bir bölümü, onun sonradan kendi verdiği bilgilere ya da çok sonra yazılmış biyografilere dayanıyor ve belgelerle doğrulanamıyor. Bu sayfa onları aktarmıyor.",
    '2.1': "Birinci Dünya Savaşı başladığında Pilates İngiltere'de yaşıyordu.",
    '2.2': "Knockaloe Charitable Trust'ın dönemin kayıtlarına dayanan araştırmasına göre Pilates, Alman vatandaşı olduğu için savaş başlayınca \"düşman yabancı\" (enemy alien) sayıldı ve enterne edildi. Önce Lancaster'da tutuldu; 12 Eylül 1915'te Man Adası'ndaki Knockaloe kampına nakledildi. Aynı araştırmanın aktardığına göre kampın gazetesi Lager Zeitung, Ocak 1917'de onu bir boks maçının hakemi olarak anıyor. 1919'da serbest bırakıldı ve Almanya'ya döndü.",
    '2.3': "Knockaloe Charitable Trust, Pilates'in öğrencisi Lolita San Miguel ile 2015'te yapılmış bir söyleşiye dayanarak, Pilates'in Man Adası'nda geçirdiği yılların kendisi için belirleyici olduğunu söylediğini aktarıyor; söyleşinin kendisi bu sayfa için incelenmedi. Yöntemin bu yıllarda biçimlendiği bilgisi de böyle sonraki anlatımlara dayanır: Bu sayfanın kaynaklarında, savaş yıllarından kalan ve yöntemi belgeleyen bir kayıt yer almıyor.",
    '2.4': "Bundan ayrı olarak, 2000 yılındaki bir ABD mahkeme kararı olgular bölümünde yöntemin 1914 civarında gelişmeye başladığını kabul eder. Bu, savaş yıllarından kalma bir kayıt değil, mahkemenin 2000'de vardığı bir tespittir.",
    '3.1': "Savaştan sonra Pilates bir süre Hamburg'da yaşadı. Bu döneme ait en sağlam belge bir patenttir: 1925'te, Hamburg'da yaşarken, ABD'de \"Gymnastic apparatus\" (jimnastik aleti) adlı bir buluş için patent başvurusu yaptı. Patent 1927'de verildi. Belgede, üzerine uzanılan ve bacaklarla bir ağırlığa karşı itilen kayar bir taşıyıcı tarif ediliyor.",
    '3.2': "Pilates'in yöntemine Contrology adını ilk kez ne zaman verdiği, bu sayfanın dayandığı kaynaklarda belirtilmiyor. Bu kaynaklardaki en erken tarihli izler New York'tan. 2000 yılındaki mahkeme kararına yansıyan bir tanıklığa göre, 1941'de stüdyonun cam kapısında alt alta \"Contrology — Art of Control — Pilates Studio — Joseph Pilates\" yazıyordu. Aletlerine taktığı metal plakalardan biri, Universal Reformer'ı \"Pilates Studios of Contrology\" yapımı olarak tanıtıyordu. Aynı karar, Pilates'in yöntemini zaman zaman bu adla andığını da not eder.",
    '3.3': "1945'te yayımlanan kitabı bu adı başlığında taşıyordu: Return to Life Through Contrology. Yöntemin ne olduğu ve nasıl çalıştığı ise bu sayfanın değil, Contrology bölümünün konusu.",
    '4.1': "Pilates 1920'lerin ortasında Amerika Birleşik Devletleri'ne göç etti. New York'ta Clara ile birlikte 939 Eighth Avenue'daki bir daireye yerleştiler ve hemen bitişiğinde bir stüdyo açtılar. Stüdyonun açılış yılı kaynaklarda kesin olarak belirtilmiyor. Pilates Method Alliance'ın tarihçesine göre Pilates, \"Pilates Universal Gymnasium\" adıyla New York telefon rehberinde ilk kez 1929 sonbaharında yer aldı; bu, stüdyonun açılış tarihi değil, rehberdeki ilk kaydın tarihidir.",
    '4.2': "Clara yöntemi Pilates'le birlikte öğretti ve stüdyonun işlerini yönetti. 1941'de George Balanchine'in dans topluluğunda dansçı olan Romana Kryzanowska, ayak bileğindeki bir sakatlık nedeniyle onlara yönlendirildi ve 1944'e kadar ikisinden ders aldı.",
    '4.3': "Mahkeme kararına göre yöntem, Pilates hayattayken New York'un dans çevresinde olumlu bir ün kazandı. Hangi koreografların stüdyoya öğrenci gönderdiğine dair ayrıntılar ise daha çok sonraki anlatımlara dayanıyor.",
    '5.1': "Katalog kayıtlarına göre Your Health, Joseph H. Pilates imzasıyla 1934'te; Return to Life Through Contrology ise Joseph H. Pilates ve William John Miller imzasıyla 1945'te yayımlandı.",
    '5.2': "Pilates yöntemi için çok sayıda alet tasarladı; en bilinenleri Reformer, Cadillac, Wunda Chair ve barrel adı verilen aletlerdir. 1927 ile 1951 arasında bunların birkaçı için ABD patenti aldı: 1927 tarihli \"Gymnastic apparatus\", 1934 tarihli \"Chair\" ve 1951 tarihli \"Double frame bed\" patentleri bunlar arasında. 2000 tarihli mahkeme kararı, bu patentlerin süresinin çoktan dolduğunu belirtir.",
    '5.3': "Joseph Pilates 1967'de hayatını kaybetti. Clara stüdyoda ders vermeyi ve stüdyoyu yönetmeyi 1970'e kadar sürdürdü. Clara da 1976'da hayatını kaybetti.",
    '5.4': "Pilates'in hayattayken yetiştirdiği öğrencilerin bir kısmı kendisi de eğitmen oldu; aralarında Carola Trier, Kathy Grant, Ron Fletcher ve Eve Gentry vardı. Romana Kryzanowska 1970'lerde yeni eğitmenler yetiştirdi. Pilates Method Alliance'ın tarihçesine göre, Pilates'in doğrudan yetiştirdiği bu öğrencilerden bazıları yöntemi New York'un dışına, Kaliforniya'dan Paris'e kadar taşıdı.",
    '5.6': "Pilates adı 2000 yılında bir ABD mahkemesine taşındı. Pilates, Inc. adlı şirket, \"Pilates\" kelimesi için sahip olduğu iki tescilli markaya (biri egzersiz dersleri, diğeri aletler için) dayanarak Kaliforniyalı Current Concepts şirketine ve şirketin başkanı Kenneth Endelman'a dava açmıştı. ABD New York Güney Bölgesi Federal Bölge Mahkemesi 19 Ekim 2000'de iki markanın da jenerik, yani bir yöntemin genel adı olduğuna karar verdi: Mahkemeye göre \"Pilates\" kelimesi kamuoyu için bir ürünün ya da hizmetin kaynağını değil, bir egzersiz yöntemini ifade ediyordu. Mahkeme, iki tescilin ABD Patent ve Marka Ofisi tarafından iptal edilmesini istedi.",
    '5.7': "Mahkeme, Pilates, Inc.'in bu yöntemi tanımlayan genel kelime üzerinde marka hakkı ileri sürerek yöntemi tekeline alamayacağına hükmetti. Kararın kapsamı, bu davaya konu olan iki ABD marka tesciliyle sınırlıydı: egzersiz dersleri için yapılan PILATES tescili (No. 1,405,304) ve aletler için yapılan PILATES tescili (No. 1,907,447). Mahkeme bu iki tescilde başka hukuki kusurlar da tespit etti.",
    '6.1': "Bu sayfa, yeni kaynaklar incelendikçe güncellenebilir.",
  },
  en: {
    '0.1': "Today, the name Pilates is associated with a method of exercise. Behind the name lie the life of Joseph Pilates and the history of an approach to exercise he developed.",
    '0.2': "Part of what is known about Joseph Pilates' life rests on what he himself told, years later. This page keeps what records of the time support apart from later accounts. It tells the history of a name and an approach to exercise, not how the method works.",
    '1.1': "Joseph Pilates was born in 1883 in Mönchengladbach, Germany. According to the historian Eva Rincke, his father, Friedrich Pilates, was a gymnast; her article includes a photograph of his gymnastics group, credited to the city archive.",
    '1.2': "Some of what is told about his childhood and youth rests on what he said about himself later, or on biographies written long afterwards, and can't be checked against documents. This page leaves it out.",
    '2.1': "When the First World War broke out, Pilates was living in England.",
    '2.2': "According to the Knockaloe Charitable Trust's research, which draws on records of the time, Pilates was classed as an enemy alien when war began, as a German national, and interned. He was held first at Lancaster, and on 12 September 1915 he was moved to Knockaloe camp on the Isle of Man. The same research cites the camp newspaper, Lager Zeitung, naming him in January 1917 as the referee of a boxing match. In 1919 he was released and returned to Germany.",
    '2.3': "The Knockaloe Charitable Trust, citing a 2015 interview with his student Lolita San Miguel, reports that Pilates said his years on the Isle of Man had been decisive for him; the interview itself was not consulted for this page. That his method took shape in these years likewise rests on later accounts: the sources behind this page contain no record from the war years that documents the method.",
    '2.4': "Separately, a US court ruling in 2000 accepted, in its findings of fact, that the method began to develop around 1914. That is a finding the court reached in 2000, not a record from the war years.",
    '3.1': "After the war, Pilates lived for a time in Hamburg. The firmest document from these years is a patent: in 1925, while living in Hamburg, he applied in the United States for a patent on a \"Gymnastic apparatus\". It was granted in 1927. The patent describes a sliding carriage that a person lies on and moves by pushing with the legs against a weight.",
    '3.2': "When Pilates first gave his method the name Contrology is not stated in the sources behind this page. The earliest dated traces in those sources are from New York. According to testimony recorded in the 2000 court ruling, in 1941 the studio's glass door read, line by line, \"Contrology — Art of Control — Pilates Studio — Joseph Pilates\". One of the metal plaques he fixed to his equipment identified the Universal Reformer as made by \"Pilates Studios of Contrology\". The same ruling notes that Pilates sometimes called his method by this name.",
    '3.3': "His 1945 book carried the name in its title: Return to Life Through Contrology. What the method is and how it works belongs to the Contrology section, not to this page.",
    '4.1': "Pilates emigrated to the United States in the mid-1920s. In New York, he and Clara moved into an apartment at 939 Eighth Avenue and opened a studio next to it. The sources don't give a firm year for the studio's opening. According to the Pilates Method Alliance's history, Pilates was first listed in the New York telephone directory, as the \"Pilates Universal Gymnasium\", in the autumn of 1929; that is the date of the first directory listing, not of the studio's opening.",
    '4.2': "Clara taught the method with Pilates and ran the studio's business. In 1941 Romana Kryzanowska, then a dancer in George Balanchine's company, was referred to them because of an ankle injury, and studied with them both until 1944.",
    '4.3': "According to the court ruling, the method gained a good reputation in New York's dance community during Pilates' lifetime. Details of which choreographers sent students to the studio rest mostly on later accounts.",
    '5.1': "According to catalogue records, Your Health was published in 1934 under the name of Joseph H. Pilates, and Return to Life Through Contrology in 1945 under the names of Joseph H. Pilates and William John Miller.",
    '5.2': "Pilates designed many pieces of equipment for his method; the best known are the Reformer, the Cadillac, the Wunda Chair and the barrels. Between 1927 and 1951 he obtained US patents for several of them, among them the \"Gymnastic apparatus\" (1927), a \"Chair\" (1934) and a \"Double frame bed\" (1951). The 2000 court ruling notes that these patents had long since expired.",
    '5.3': "Joseph Pilates died in 1967. Clara went on teaching at the studio and running it until 1970. She died in 1976.",
    '5.4': "Some of the students Pilates trained in his lifetime became teachers themselves, among them Carola Trier, Kathy Grant, Ron Fletcher and Eve Gentry. Romana Kryzanowska trained new teachers in the 1970s. According to the Pilates Method Alliance's history, some of the students Pilates trained directly took the method beyond New York, from California to Paris.",
    '5.6': "In 2000 the name Pilates came before a US court. A company called Pilates, Inc. had sued the California company Current Concepts and its president, Kenneth Endelman, on the strength of two registered trademarks it held in the word \"Pilates\": one for exercise instruction, one for equipment. On 19 October 2000 the US District Court for the Southern District of New York ruled that both marks were generic, the general name of a method: to the public, the court found, \"Pilates\" meant a method of exercise, not the source of a product or service. The court directed that both registrations be cancelled by the US Patent and Trademark Office.",
    '5.7': "The court held that Pilates, Inc. could not monopolise the method by claiming trademark rights in the generic word that describes it. The ruling's scope was limited to the two US registrations at issue in the case: the PILATES registration for exercise instruction services (No. 1,405,304) and the PILATES registration for equipment (No. 1,907,447). The court also found other legal defects in these two registrations.",
    '6.1': "This page may be updated as further sources are examined.",
  },
};

/**
 * The two voices of the war-years chapter: records of the time as reported by a
 * later source, and later accounts. Each paragraph opens with its run-in label
 * from the Draft copy (`legacyVoiceLabels`).
 */
export const legacyVoices: Partial<Record<LegacyParagraphId, 'records' | 'accounts'>> = {
  '2.2': 'records',
  '2.3': 'accounts',
};

export const legacyVoiceLabels: Record<Lang, Partial<Record<LegacyParagraphId, string>>> = {
  tr: {
    '2.2': "Kayıtlardan aktarılanlar.",
    '2.3': "Sonraki anlatımlarda.",
  },
  en: {
    '2.2': "As reported from the records.",
    '2.3': "In later accounts.",
  },
};

/**
 * Copy that was held for legal review, on the 2000 ruling in Pilates, Inc. v.
 * Current Concepts, Inc.: [5.6] and [5.7], and the final sentence of [5.2].
 * The owner approved including them on 2026-11-03, so `cleared` is true and
 * they render as written. Setting it back to false withholds [5.6] and [5.7]
 * again (the final sentence of [5.2] would then have to be taken out of its
 * paragraph by hand). [2.4], the court's finding on when the method began to
 * develop, was never part of this review.
 */
export const legacyLegalReview = {
  cleared: true,
  paragraphs: ['5.6', '5.7'] as LegacyParagraphId[],
  finalSentenceOf: ['5.2'] as LegacyParagraphId[],
};

/** Page wording the owner approved on 2026-11-03 (N1, N3, N4, N6 of the design proposal). */
export const legacyLabels: Record<Lang, { name: string; chapters: string; after1967: string; fullSize: string }> = {
  tr: {
    name: 'Joseph Pilates · 1883–1967',
    chapters: "Joseph Pilates'in hayatı, bölüm bölüm",
    after1967: '1967 sonrası',
    fullSize: 'Tam boyut',
  },
  en: {
    name: 'Joseph Pilates · 1883–1967',
    chapters: "Joseph Pilates's life, chapter by chapter",
    after1967: 'After 1967',
    fullSize: 'Full size',
  },
};

/** The sources list's heading, as on Bedenin Dili. */
export const legacySourcesTitle: Record<Lang, string> = { tr: 'Kaynaklar', en: 'Sources' };

export interface LegacyReference {
  before: string;
  /** The linked title. */
  title: string;
  after: string;
  href: string;
  /** The citation's own language: citations are not translated. */
  lang: Lang;
}

/**
 * The page's sources: section 4 of the Draft copy tab (10 works, all opened and
 * read, in three groups). Group names are translated, citations are not.
 */
export const legacySources: { label: Record<Lang, string>; references: LegacyReference[] }[] = [
  {
    label: { tr: "Belgeler", en: "Records" },
    references: [
      { before: "Pilates J. ", title: "Gymnastic apparatus", after: ". US Patent 1,621,477; filed 24 August 1925, granted 15 March 1927.", href: "https://patents.google.com/patent/US1621477A/en", lang: 'en' },
      { before: "Pilates JH. ", title: "Chair", after: ". US Patent 1,969,901; filed 29 August 1931, granted 14 August 1934.", href: "https://patents.google.com/patent/US1969901A/en", lang: 'en' },
      { before: "Pilates JH. ", title: "Double frame bed", after: ". US Patent 2,570,855; filed 19 April 1948, granted 9 October 1951.", href: "https://patents.google.com/patent/US2570855A/en", lang: 'en' },
      { before: "", title: "Pilates, Inc. v. Current Concepts, Inc.", after: ", 120 F. Supp. 2d 286 (S.D.N.Y. 2000). Decided 19 October 2000.", href: "https://static.case.law/f-supp-2d/120/html/0286-01.html", lang: 'en' },
    ],
  },
  {
    label: { tr: "Tarih ve biyografi", en: "History and biography" },
    references: [
      { before: "Knockaloe Charitable Trust. ", title: "Joseph Pilates", after: ". Internee profile.", href: "https://knockaloe.im/profile_428812.html", lang: 'en' },
      { before: "Pilates Method Alliance. ", title: "The History of Pilates", after: ". 2019.", href: "https://pma.imiscloud.com/common/Uploaded%20files/PMA/About/History/The%20History%20of%20Pilates.pdf", lang: 'en' },
      { before: "The New York Review of Books. ", title: "Bodies by Joe", after: ". 21 August 2025.", href: "https://www.nybooks.com/articles/2025/08/21/bodies-by-joe-joseph-pilates-romana-kryzanowska/", lang: 'en' },
      { before: "Rincke E. ", title: "Joe Pilates’ Childhood In Poverty – by historian Eva Rincke (Part 2)", after: ". PilatesIntel, 17 January 2017.", href: "https://www.pilatesintel.com/?p=4153", lang: 'en' },
    ],
  },
  {
    label: { tr: "Katalog kayıtları", en: "Catalogue records" },
    references: [
      { before: "Internet Archive. ", title: "A Pilates' Primer: The Millennium Edition", after: ". Presentation Dynamics, 2000. Catalogue record.", href: "https://archive.org/details/pilatesprimermil0000pila", lang: 'en' },
      { before: "Internet Archive. ", title: "Pilates' Return to Life Through Contrology", after: ". Presentation Dynamics, 2010. Catalogue record.", href: "https://archive.org/details/pilatesreturntol00jose", lang: 'en' },
    ],
  },
];

export type LegacyFigureId = 'gymnastic-apparatus' | 'chair' | 'double-frame-bed';

export interface LegacyFigure {
  src: ImageMetadata;
  /** The inventor's name, the title and the number as printed on the sheet. */
  inventor: string;
  title: string;
  number: string;
  filed: number;
  granted: number;
  sheet: number;
  sheets: number;
  /** The patent's page, where the sheet was taken from. */
  href: string;
  alt: Record<Lang, string>;
}

export const legacyFigures: Record<LegacyFigureId, LegacyFigure> = {
  'gymnastic-apparatus': {
    src: gymnasticApparatusSheet,
    inventor: 'J. Pilates',
    title: 'Gymnastic apparatus',
    number: '1,621,477',
    filed: 1925,
    granted: 1927,
    sheet: 1,
    sheets: 1,
    href: 'https://patents.google.com/patent/US1621477A/en',
    alt: {
      tr: "1927 tarihli 'Gymnastic apparatus' patentinin tek çizim sayfası: aletin üç görünüşü (Şekil 1–3), sayfa başlığı ve imzalarla.",
      en: "The only drawing sheet of the 1927 'Gymnastic apparatus' patent: three views of the apparatus (Figs. 1–3), with the sheet's heading and signatures.",
    },
  },
  chair: {
    src: chairSheet,
    inventor: 'J. H. Pilates',
    title: 'Chair',
    number: '1,969,901',
    filed: 1931,
    granted: 1934,
    sheet: 3,
    sheets: 3,
    href: 'https://patents.google.com/patent/US1969901A/en',
    alt: {
      tr: "1934 tarihli 'Chair' patentinin üçüncü çizim sayfası: kalp biçimli sırtlığı olan bir sandalyenin görünüşleri ve ayrıntıları (Şekil 13–16).",
      en: "Sheet 3 of the 1934 'Chair' patent: views and details of a chair with a heart-shaped back (Figs. 13–16).",
    },
  },
  'double-frame-bed': {
    src: doubleFrameBedSheet,
    inventor: 'J. H. Pilates',
    title: 'Double frame bed',
    number: '2,570,855',
    filed: 1948,
    granted: 1951,
    sheet: 2,
    sheets: 2,
    href: 'https://patents.google.com/patent/US2570855A/en',
    alt: {
      tr: "1951 tarihli 'Double frame bed' patentinin ikinci çizim sayfası: ayaklar üzerindeki metal yatak çerçevesi (Şekil 3) ve parça ayrıntıları (Şekil 4–6).",
      en: "Sheet 2 of the 1951 'Double frame bed' patent: the metal bed frame on its legs (Fig. 3) and details of its parts (Figs. 4–6).",
    },
  },
};

/** Where the figures go: beside paragraph [3.1] alone, beside [5.2] as a pair. */
export const legacyFigurePlacement: { after: LegacyParagraphId; figures: LegacyFigureId[] }[] = [
  { after: '3.1', figures: ['gymnastic-apparatus'] },
  { after: '5.2', figures: ['chair', 'double-frame-bed'] },
];

export type LegacyPhotoId = 'jhp-02' | 'jhp-03' | 'jhp-04';

export interface LegacyPhoto {
  src: ImageMetadata;
  /** The owner's original file in ../reference_assets/JHP/. */
  file: string;
  /** Widths for the srcset, never above the original's. */
  widths: number[];
  /**
   * What the photograph shows: what is visible, plus only what the owner has
   * stated about it (2026-11-03). The files themselves carry no source, date,
   * photographer, place or names.
   */
  alt: Record<Lang, string>;
  /**
   * A visible caption and credit, if the owner ever supplies them. Null: the
   * photograph is shown without a caption (owner, 2026-11-03), never with an
   * invented date, place, photographer or source.
   */
  caption: Record<Lang, string> | null;
  credit: string | null;
}

export const legacyPhotos: Record<LegacyPhotoId, LegacyPhoto> = {
  'jhp-02': {
    src: photo02,
    file: 'JHP_02.jpg',
    widths: [350],
    alt: {
      tr: 'Siyah-beyaz fotoğraf: Joseph Pilates, gözlüklü ve beyaz balıkçı yaka kazaklı, pencereli bir iç mekânda.',
      en: 'Black-and-white photograph: Joseph Pilates, in glasses and a white turtleneck, in a room with windows.',
    },
    caption: null,
    credit: null,
  },
  'jhp-03': {
    src: photo03,
    file: 'JHP_03.jpg',
    widths: [400, 644],
    alt: {
      tr: "Siyah-beyaz fotoğraf: New York'taki stüdyonun içi. Duvarları çerçeveli resim ve fotoğraflarla kaplı salonda iki egzersiz aleti; birinin üzerinde bir adam ayakta duruyor, ötekinde bir kadın uzanıyor, yakınlarında üç kadın var.",
      en: 'Black-and-white photograph: the interior of the New York studio. Two exercise apparatus in a hall whose walls are hung with framed pictures; a man stands on one, a woman lies on the other, and three women stand nearby.',
    },
    caption: null,
    credit: null,
  },
  'jhp-04': {
    src: photo04,
    file: 'JHP_04.jpg',
    widths: [400, 600, 900, 1200],
    alt: {
      tr: 'Tonlu fotoğraf: Joseph Pilates bir barrel üzerinde ders veriyor; bacağını dikine kaldırmış birini eliyle destekliyor. Duvarda anatomi çizimleri, sağda perdeli pencereler.',
      en: 'Toned photograph: Joseph Pilates teaching on a barrel, supporting with his hand a person whose leg is raised straight up. Anatomical charts on the wall, curtained windows on the right.',
    },
    caption: null,
    credit: null,
  },
};

/** The opening's photograph, beside the name line and the first paragraphs. */
export const legacyOpeningPhoto: LegacyPhotoId = 'jhp-02';

/** Photographs in the chapters: each beside the paragraph it follows. */
export const legacyPhotoPlacement: { after: LegacyParagraphId; photo: LegacyPhotoId }[] = [
  { after: '4.1', photo: 'jhp-03' },
  { after: '4.3', photo: 'jhp-04' },
];

export interface LegacyFigureText {
  patent: string;
  filed: string;
  granted: string;
  sheet: (sheet: number, sheets: number) => string;
  /** Shown under each group of figures. */
  credit: string;
}

export const legacyFigureText: Record<Lang, LegacyFigureText> = {
  tr: {
    patent: 'ABD patenti',
    filed: 'başvuru',
    granted: 'patent',
    sheet: (sheet, sheets) => `çizim sayfası ${sheet}/${sheets}`,
    credit: 'Kaynak: ABD Patent ve Marka Ofisi (United States Patent and Trademark Office), Google Patents aracılığıyla.',
  },
  en: {
    patent: 'US Patent',
    filed: 'filed',
    granted: 'granted',
    sheet: (sheet, sheets) => `drawing sheet ${sheet} of ${sheets}`,
    credit: 'Source: United States Patent and Trademark Office, via Google Patents.',
  },
};
