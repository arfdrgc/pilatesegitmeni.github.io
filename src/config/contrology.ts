// The Contrology page's copy, quotations, illustration labels and sources, from
// the "Revision 4" tab (2026-11-03) of the Claude Doc "Contrology: research"
// (https://claude.ai/artifact/WLugcF5rCsYbMKNkPmUY8Z), which replaces Revision 3
// for implementation. The paragraph-to-source map stays in that doc; the page
// shows no paragraph numbers and no page references in its running text.
//
// One sentence was smoothed at implementation, meaning unchanged: the second
// sentence of the Turkish opening ("…tanıtıyor ve … gösteriyor").
//
// Quotations: the English originals are exactly as printed (wording,
// punctuation, capitals) and are attributed to the book's two authors, never to
// Pilates alone. Q2, Q5 and Q7 are pull quotations; Q1 and Q4 are quoted inside
// sentences; Q6 and Q10 are paraphrased (Revision 4).
//
// Used by src/components/contrology/ContrologyArticle.astro, on /contrology/,
// /en/contrology/ and the development preview.
import type { Lang } from '../i18n/ui';

export type ContrologyQuoteId = 'Q2' | 'Q5' | 'Q7';

/** The illustrations: original line diagrams, drawn in src/components/contrology/. */
export type ContrologyFigureId = 'learning' | 'development' | 'breath' | 'spine' | 'habits' | 'timeline';

/**
 * A stretch of text: plain text, a book or case title (<cite>, in English on
 * both pages) or a link to another page of the site.
 */
export type Run = string | { title: string } | { text: string; href: string };

/** One block of a section, in reading order. Quotations and figures are the same in both languages. */
export type ContrologyBlock =
  | { kind: 'paragraph'; text: Record<Lang, Run[]> }
  | { kind: 'quote'; id: ContrologyQuoteId }
  | { kind: 'figure'; id: ContrologyFigureId };

export interface ContrologySection {
  /** The section's anchor: /contrology/#<id>. */
  id: string;
  title: Record<Lang, string>;
  blocks: ContrologyBlock[];
}

const TITLE = 'Return to Life Through Contrology';
const book: Run = { title: TITLE };
const p = (tr: Run[] | string, en: Run[] | string): ContrologyBlock => ({
  kind: 'paragraph',
  text: { tr: typeof tr === 'string' ? [tr] : tr, en: typeof en === 'string' ? [en] : en },
});

export const contrologyBookTitle = TITLE;

/** The Miras / Legacy page, linked from the closing. */
export const contrologyMiras: Record<Lang, { label: string; href: string }> = {
  tr: { label: 'Miras', href: '/miras/' },
  en: { label: 'Legacy', href: '/en/legacy/' },
};

export interface ContrologyQuote {
  /** The page in the 1945 J. J. Augustin edition (the same in the 1960 reissue). */
  page: number;
  /** The Turkish translation, shown first on the Turkish page. */
  tr: string;
  /** The English original, exactly as printed. */
  original: string;
  /** Q2 names the book in full; the others give only authors, year and page. */
  full?: boolean;
}

/** The three pull quotations. */
export const contrologyQuotes: Record<ContrologyQuoteId, ContrologyQuote> = {
  Q2: {
    page: 5,
    tr: 'Contrology, beden, zihin ve ruhun tam koordinasyonudur.',
    original: 'Contrology is complete coordination of body, mind, and spirit.',
    full: true,
  },
  Q5: {
    page: 6,
    tr: 'İDEAL OLAN, KASLARIMIZIN İRADEMİZE UYMASIDIR.',
    original: 'IDEALLY, OUR MUSCLES SHOULD OBEY OUR WILL.',
  },
  Q7: {
    page: 9,
    tr: 'Nefes almak, yaşamın ilk eylemidir; sonuncusu da.',
    original: 'Breathing is the first act of life, and the last.',
  },
};

/** The opening: two short paragraphs under the page title. */
export const contrologyOpening: Record<Lang, Run[][]> = {
  tr: [
    ["Joseph Pilates, yöntemine zaman zaman Contrology adını verdi. Bu ad, 1945'te William John Miller'la birlikte yazdığı kitabın başlığında yer alır: ", book, '.'],
    ["Bu sayfa, Contrology'yi o kitabın anlattığı biçimiyle tanıtıyor ve kitabın bedeni, zihni, nefesi ve günlük yaşamı nasıl birbirine bağladığını gösteriyor. Kitabın iki yazarı olduğu için alıntılar Pilates ve Miller'a birlikte atfediliyor. Kitaptaki sağlıkla ilgili ifadeler 1945'e ait görüşlerdir; bugün için bilimsel bilgi ya da tıbbi öneri değildir."],
  ],
  en: [
    ['Joseph Pilates sometimes called his method Contrology. The name appears in the title of the book he wrote with William John Miller in 1945: ', book, '.'],
    ['This page introduces Contrology as that book describes it: how it connects the body, the mind, breathing and everyday life. Because the book has two authors, its words are attributed here to Pilates and Miller together. Its statements about health are views from 1945, not current scientific knowledge or medical advice.'],
  ],
};

/** The six sections, in Revision 4's order. */
export const contrologySections: ContrologySection[] = [
  {
    id: 'nedir',
    title: { tr: 'Contrology nedir?', en: 'What is Contrology?' },
    blocks: [
      p("Kitap Contrology'yi tek bir cümleyle tanımlar:", 'The book defines Contrology in a single sentence:'),
      { kind: 'quote', id: 'Q2' },
      p(
        'Yani amaç yalnızca kasları çalıştırmak değildir. Kitaba göre beden, zihin ve ruh birlikte çalışmalıdır.',
        "So the aim is not simply to work the muscles. In the book's view, body, mind and spirit should work together.",
      ),
      p(
        'Yazarlar kitabın sonuna doğru bu fikre geri döner. Onlara göre bu üçünün dengeli birliğine ancak Contrology ile ulaşılabilir. Bunu kendi görüşleri olarak söylerler.',
        'Near the end of the essay the authors return to this idea. In their opinion, only Contrology can bring the three into a balanced unity. They present it as their own view.',
      ),
      p(
        "Kitap kısadır. On altı sayfalık bir yazının ardından, The Hundred'dan The Push Up'a uzanan 34 egzersiz gelir. Her egzersiz fotoğraflarla gösterilir ve adım adım anlatılır.",
        'The book is short. A sixteen-page essay is followed by 34 exercises, from The Hundred to The Push Up. Each one is shown in photographs and explained step by step.',
      ),
    ],
  },
  {
    id: 'beden-ve-zihin',
    title: { tr: 'Beden ve zihin birlikte çalışır', en: 'Body and mind work together' },
    blocks: [
      p(
        "Contrology'de hareket zihinde başlar. Kitap bunu açıkça söyler: “Contrology, zihnin kasları denetlemesiyle başlar.” Aynı sayfada, büyük harflerle şu cümle yer alır:",
        'In Contrology, movement starts in the mind. The book says so plainly: “Contrology begins with mind control over muscles.” On the same page, in capitals:',
      ),
      { kind: 'quote', id: 'Q5' },
      p(
        'Kitap öğrenmeyi iki aşamada anlatır. Önce her hareket bilinçli olarak, dikkatle denetlenir. Doğru tekrarla hareket zamanla kendiliğinden akmaya başlar. Kitap bu aşamayı “bilinçaltı” hareketlerin doğal ritmiyle ilişkilendirir.',
        'The book describes learning in two stages. First, each movement is controlled consciously and with care. Then, through correct repetition, the movement gradually begins to flow on its own. The book links this stage to the natural rhythm of “subconscious” activity.',
      ),
      { kind: 'figure', id: 'learning' },
      p(
        'Bu yüzden dikkat önemlidir. Kitap, egzersiz sırasında zihnin tümüyle egzersizin amacına verilmesini ister. Talimatlara tam olarak uyulmalıdır. Bir egzersiz, kitaba bakmadan en ince ayrıntısına kadar yapılabilir hâle gelmeden bir sonrakine geçilmemelidir.',
        'That is why attention matters. While exercising, the reader is to keep the mind fully on the purpose of each exercise. The instructions are to be followed exactly, and no exercise should be attempted until the one before it can be done in every detail without looking at the book.',
      ),
    ],
  },
  {
    id: 'gelisim',
    title: { tr: 'Dengeli gelişim ve esneklik', en: 'Balanced development and flexibility' },
    blocks: [
      p(
        'Kitap, birkaç kası büyütmeye değil, bütün bedeni dengeli geliştirmeye önem verir. Ona göre aşırı gelişmiş, “şişkin” kaslar esnekliği engeller.',
        'The book cares less about building up a few muscles than about developing the whole body evenly. In its view, overdeveloped, “bulging” muscles get in the way of flexibility.',
      ),
      { kind: 'figure', id: 'development' },
      p(
        'Kitabın örneği bir kedidir. Kedi uykudan uyanınca gerinir, sonra gevşer. Kitap, bedenin de bir kedi kadar esnek olmasını ister; bira fabrikasının yük arabasını çeken bir beygir gibi iri kaslı olmasını değil.',
        "Its model is the cat. A cat wakes from a nap, stretches, then relaxes. The book wants the body to be as supple as a cat's, not muscle-bound like a brewery-truck horse.",
      ),
      p(
        'Yazarlara göre Contrology egzersizleri de bu sürekli gerinme ve gevşemeyi öne çıkarır.',
        "Contrology's exercises, the authors say, emphasise this constant stretching and relaxing.",
      ),
    ],
  },
  {
    id: 'nefes-ve-omurga',
    title: { tr: 'Nefes ve omurga', en: 'Breathing and the spine' },
    blocks: [
      p('Kitapta nefes önemli bir yer tutar:', 'Breathing has a central place in the book:'),
      { kind: 'quote', id: 'Q7' },
      p(
        'Kitap doğru nefesi iki adımda tarif eder: önce tam bir nefes verme, ardından tam bir nefes alma. Nefes vermeyi, ıslak bir bezi son damlasına kadar sıkmaya benzetir.',
        'The book describes correct breathing in two steps: a complete exhalation, followed by a full inhalation. It compares breathing out to wringing every drop of water from a wet cloth.',
      ),
      { kind: 'figure', id: 'breath' },
      p(
        'Kitap nefesi omurgayla birlikte düşünür. Yere uzanırken ya da yerden kalkarken omurganın bir tekerlek gibi, omur omur yuvarlanıp açılmasını ister. Kitaba göre bu hareketler aynı zamanda akciğerleri boşaltıp yeniden doldurur.',
        'The book also links breathing to the spine. Lying down or getting up from the floor, the reader is to “roll” and “unroll” the spine vertebra by vertebra, like a wheel. According to the book, these movements also empty and refill the lungs.',
      ),
      { kind: 'figure', id: 'spine' },
      p(
        "Bunlar kitabın 1945'teki tarifleridir; bugün için bir nefes ya da sağlık önerisi değildir.",
        "These are the book's instructions from 1945, not breathing or health advice for today.",
      ),
    ],
  },
  {
    id: 'gunluk-yasam',
    title: { tr: 'Günlük yaşamın parçası', en: 'Part of everyday life' },
    blocks: [
      p(
        'Kitap fiziksel zindeliği yaşamın merkezine koyar. Yazının ilk cümlesi şöyledir: “Fiziksel zindelik, mutluluğun ilk koşuludur.” Zindelikten kastettiği, sağlam bir zihinle birlikte dengeli gelişmiş bir bedendir: gündelik yaşamın pek çok işini doğal biçimde, kolayca ve keyifle yapabilen bir beden.',
        'The book puts physical fitness at the centre of life. Its essay opens: “Physical fitness is the first requisite of happiness.” By fitness it means a uniformly developed body with a sound mind, able to meet the many demands of daily life naturally, easily and with pleasure.',
      ),
      p(
        "Yazarların gözünde modern şehir yaşamı bunu zorlaştırıyordu. İnsanlar Taş Devri'nden beri çoğunlukla açık havada yaşamış, kapalı mekâna henüz uyum sağlayamamıştı. Dönemin kalabalık şehirleri ise isli havası, trafik gürültüsü, telefonları ve ekonomik baskısıyla birçok insanı yorgun ve gergin bırakıyordu.",
        "In the authors' view, modern city life made this hard. People had lived mostly outdoors since the Stone Age and had not yet adapted to living indoors. The crowded cities of the day, with their soot-laden air, traffic noise, telephones and economic pressure, left many people tired and tense.",
      ),
      p(
        'Kitabın önerdiği çözüm, evde ve az masrafla yapılabilecek günlük egzersizlerdir. Kitap işe on dakikayla başlamayı önerir. Haftada dört kez, üç ay boyunca çalışan birinin bedeninin ideale yaklaşacağını da ileri sürer.',
        "The book's answer was daily exercise at home, at only nominal cost. It suggests starting with ten minutes, and claims that four sessions a week for three months will bring the body closer to the ideal.",
      ),
      p(
        'Kitap egzersizi tek başına yeterli saymaz. Doğru beslenmenin ve yeterli uykunun egzersizi desteklemesi gerektiğini söyler. Dönemin başka öğütlerini de ekler: iş günü içinde belirli aralıklarla dinlenmek, güneş ve temiz hava, yumuşak olmayan bir yatak, banyoda sapsız sert bir fırça. Okurlarına düzenli sağlık kontrolünden geçmelerini ve aile hekimlerinin önerilerine uymalarını da söyler.',
        "Exercise alone was not enough. The book says that proper diet and sufficient sleep must support it, and adds other advice of its day: rest at fixed intervals during the working day, sunshine and fresh air, a firm bed, and a stiff brush without a handle in the bath. It also tells readers to have regular medical examinations and to follow their family physician's advice.",
      ),
      { kind: 'figure', id: 'habits' },
      p(
        'Bu öğütler ve vaatler 1945 yılına aittir; güncel bilimsel ya da tıbbi öneriler değildir. Burada, kitabın zindeliği ne kadar geniş anladığını göstermek için aktarılıyorlar: bir egzersiz dizisinden çok, bir yaşam biçimi olarak.',
        'This advice and these promises belong to 1945; they are not current scientific or medical advice. They are recorded here to show how broadly the book understood fitness: as a way of living rather than a set of exercises.',
      ),
    ],
  },
  {
    id: 'pilatese',
    title: { tr: "Contrology'den Pilates'e", en: 'From Contrology to Pilates' },
    blocks: [
      p(
        'Kitaptaki program evde, minderde ya da yerde yapılır. Kitap, Contrology için ne spor salonuna ne de pahalı aletlere gerek olduğunu söyler. Bu söz yalnızca kitaptaki egzersizler için geçerlidir. Pilates yöntemi için Reformer, Cadillac ve barrel türü aletler de tasarladı; 1945 tarihli kitap bu aletlerin hiçbirini anlatmaz.',
        'The programme in the book is done at home, on a mat or the floor. The book says Contrology needs neither a gymnasium nor expensive apparatus. That statement concerns the exercises in this book. For his method, Pilates also designed apparatus such as the Reformer, the Cadillac and the barrels; the 1945 book describes none of them.',
      ),
      p(
        "İki ad kaynaklarda yan yana geçer. 2000 tarihli bir ABD mahkeme kararı, Pilates'in yöntemini hayattayken zaman zaman Contrology diye andığını kaydeder. Karara yansıyan bir tanıklığa göre, 1941'de stüdyonun cam kapısında alt alta “Contrology — Art of Control — Pilates Studio — Joseph Pilates” yazıyordu. Aynı karara göre Pilates 1965'te New York'taki Henri Bendel mağazasında da bir stüdyo açtı; mağaza rehberindeki tabelada “Pilates Studios” yazıyordu. Mahkeme 2000'de, “Pilates” kelimesinin kamuoyu için bir egzersiz yönteminin adı olduğuna karar verdi.",
        "The two names appear side by side in the sources. A 2000 US court ruling records that, during his lifetime, Pilates sometimes called his method Contrology. According to testimony recorded in the ruling, in 1941 the studio's glass door read, line by line, “Contrology — Art of Control — Pilates Studio — Joseph Pilates”. The same ruling notes that in 1965 Pilates opened a studio at Henri Bendel, a New York department store, where a sign in the store directory read “Pilates Studios”. In 2000 the court ruled that, to the public, “Pilates” was the name of a method of exercise.",
      ),
      { kind: 'figure', id: 'timeline' },
      p(
        'Karar, yöntemin ne zaman ve neden yaygın olarak Pilates adıyla bilinir hâle geldiğini belirlemiyor. Bu sayfa da bunun için bir tarih ya da neden ileri sürmüyor.',
        'The ruling does not establish when or why the method became widely known as Pilates, and this page does not suggest a date or a cause.',
      ),
    ],
  },
];

/** The closing: the page's scope, with the link to Miras / Legacy. */
export const contrologyClosing: Record<Lang, Run[]> = {
  tr: ["Bu sayfa Contrology'yi 1945 tarihli kitabın anlattığı biçimiyle tanıtıyor; kitabın egzersizlerini öğretmiyor. Pilates'in hayatı ve yöntemin sonraki tarihi ", { text: 'Miras', href: contrologyMiras.tr.href }, ' sayfasında anlatılıyor.'],
  en: ["This page introduces Contrology as the 1945 book describes it; it does not teach the book's exercises. Pilates's life and the later history of his method are covered on the ", { text: 'Legacy', href: contrologyMiras.en.href }, ' page.'],
};

/** Interface text: the contents list, attributions, the closing link and the sources. */
export const contrologyLabels: Record<Lang, { contents: string; authors: string; page: string; next: string; sources: string; translations?: string }> = {
  tr: {
    contents: 'Bu sayfada',
    authors: 'Pilates ve Miller',
    page: 's.',
    next: 'Miras sayfasına git',
    sources: 'Kaynaklar',
    translations: 'Alıntıların Türkçe çevirileri bu sayfa için yapıldı.',
  },
  en: {
    contents: 'On this page',
    authors: 'Pilates and Miller',
    page: 'p.',
    next: 'Go to the Legacy page',
    sources: 'Sources',
  },
};

/**
 * The illustrations' words: a short caption, stated as the book's idea, and
 * the labels set beside the drawing.
 */
export const contrologyFigures: Record<Exclude<ContrologyFigureId, 'timeline'>, Record<Lang, { caption: string; labels: string[] }>> = {
  learning: {
    tr: { caption: 'Kitaba göre öğrenme: önce bilinçli denetim, sonra tekrarla gelen doğal ritim.', labels: ['Bilinçli denetim', 'Doğru tekrar', 'Doğal ritim'] },
    en: { caption: 'Learning, as the book describes it: conscious control first, then the natural rhythm that comes with repetition.', labels: ['Conscious control', 'Correct repetition', 'Natural rhythm'] },
  },
  development: {
    tr: { caption: 'Kitabın karşılaştırması: birkaç kası büyütmek değil, bütün bedeni dengeli ve esnek geliştirmek.', labels: ['Birkaç kas öne çıkar', 'Bütün beden dengeli gelişir'] },
    en: { caption: "The book's comparison: not building up a few muscles, but developing the whole body evenly and flexibly.", labels: ['A few muscles stand out', 'The whole body develops evenly'] },
  },
  breath: {
    tr: { caption: 'Kitabın tarif ettiği nefes: tam bir nefes verme, ardından tam bir nefes alma.', labels: ['Tam nefes ver', 'Tam nefes al'] },
    en: { caption: 'Breathing as the book describes it: a complete exhalation, then a full inhalation.', labels: ['Breathe out fully', 'Breathe in fully'] },
  },
  spine: {
    tr: { caption: 'Omurga, bir tekerlek gibi omur omur yuvarlanıp açılır.', labels: [] },
    en: { caption: 'The spine rolls and unrolls vertebra by vertebra, like a wheel.', labels: [] },
  },
  habits: {
    tr: { caption: '1945 tarihli kitabın öğütleri: egzersizin çevresindeki günlük alışkanlıklar.', labels: ['Evde günlük egzersiz', 'Doğru beslenme', 'Yeterli uyku', 'Gün içinde dinlenme', 'Güneş ve temiz hava'] },
    en: { caption: "The 1945 book's advice: the daily habits around exercise.", labels: ['Daily exercise at home', 'Proper diet', 'Sufficient sleep', 'Rest during the day', 'Sunshine and fresh air'] },
  },
};

/** Section 6's dates, each stated in that section's text (Revision 4). */
export const contrologyTimeline: { year: string; text: Record<Lang, Run[]> }[] = [
  { year: '1941', text: { tr: ['Stüdyonun cam kapısında “Contrology” ve “Pilates Studio”'], en: ["The studio's glass door: “Contrology” and “Pilates Studio”"] } },
  { year: '1945', text: { tr: ['Kitap: ', book], en: ['The book: ', book] } },
  { year: '1965', text: { tr: ["Henri Bendel'deki stüdyo: “Pilates Studios”"], en: ['The studio at Henri Bendel: “Pilates Studios”'] } },
  { year: '2000', text: { tr: ['Mahkeme kararı: “Pilates” bir egzersiz yönteminin adı'], en: ['Court ruling: “Pilates” is the name of a method of exercise'] } },
];

/** The meta description (Revision 4, E9): the approved proposal. */
export const contrologyDescription: Record<Lang, string> = {
  tr: "Contrology, Joseph Pilates'in yöntemi için zaman zaman kullandığı addır.",
  en: 'Contrology is a name Joseph Pilates sometimes used for his method.',
};

export interface ContrologyReference {
  before: string;
  /** The work's title, in italics. */
  title: string;
  after: string;
  /** Where the work can be read; omitted for a catalogue-only record. */
  link?: { label: string; href: string };
  /** A note in the page's language. */
  note?: Record<Lang, string>;
}

/**
 * The compact bibliography (Revision 4, part 3): one list, no group headings.
 * Citations stay in English on both pages (lang="en" on the Turkish page).
 */
export const contrologySources: ContrologyReference[] = [
  { before: 'Pilates, Joseph H., and William John Miller. ', title: TITLE, after: '. New York: J. J. Augustin, 1945.', link: { label: 'HathiTrust', href: 'https://hdl.handle.net/2027/uiug.30112004198963' } },
  { before: 'Pilates, Joseph H., and William John Miller. ', title: TITLE, after: '. Boston: Christopher Publishing House, 1960. Reissue with the same pagination.', link: { label: 'HathiTrust', href: 'https://hdl.handle.net/2027/mdp.39015038069475' } },
  { before: '', title: 'Pilates, Inc. v. Current Concepts, Inc.', after: ', 120 F. Supp. 2d 286 (S.D.N.Y. 2000).', link: { label: 'Caselaw Access Project', href: 'https://static.case.law/f-supp-2d/120/html/0286-01.html' } },
  { before: '', title: 'The National Union Catalog, Pre-1956 Imprints', after: ', v. 458, p. 344. London: Mansell.', link: { label: 'HathiTrust', href: 'https://hdl.handle.net/2027/mdp.39015082988927?urlappend=%3Bseq=354' } },
  {
    before: 'Pilates, Joseph Hubertus. ',
    title: 'Your Health: A Corrective System of Exercising That Revolutionizes the Entire Field of Physical Education',
    after: ". New York: printed by C. J. O'Brien, 1934. 48 p.",
    note: { tr: 'Yalnızca katalog kaydı; kitabın kendisi incelenmedi.', en: 'Catalogue record only; the book itself was not consulted.' },
  },
];
