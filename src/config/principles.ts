// The 7 Prensip / The 7 Principles page's copy and sources, word for word from
// "Final copy (TR + EN), revision 3" (2026-11-05) of the Claude Doc
// "7 Prensip: research and editorial draft"
// (https://claude.ai/artifact/55ZHPZKPHCu2m44jWT8WPw), except [0.3] and [5.2],
// which are the owner's final wording (2026-11-05, given in chat; the doc's
// tables still show revision 3 for them), and the page references the owner
// added after the two quotations. The paragraph labels ([0.1]–[8.1]) and the
// paragraph-to-source map stay in that doc; the page shows neither.
//
// Decisions D1–D6 (doc, "Open points and decisions"): alignment is the seventh
// principle, as this page's own choice; the order is a reading and learning
// sequence; each principle carries one of three source labels; no Kryzanowska
// quotation; Friedman and Eisen are not named; Turkish terms Merkez, Kesinlik,
// Akış, Konsantrasyon, Hizalanma.
//
// The two 1945 quotations ([1.2], [3.2]) sit inside sentences and use the
// translations approved on Contrology (Q7, C11), attributed to Pilates and
// Miller, each followed by its page reference (pp. 9 and 6 of the 1945 book,
// same pagination in the 1960 reissue). Sources: in the Contrology format.
//
// Used by src/components/principles/PrinciplesArticle.astro, on /7-prensip/,
// /en/7-principles/ and the development preview.
import type { Lang } from '../i18n/ui';

/**
 * A stretch of text: plain text, a book title (<cite>, in English on both
 * pages) or a link to another page of the site.
 */
export type Run = string | { title: string } | { text: string; href: string };

/** The three source labels (D3). */
export type PrincipleSource = 'book' | 'idea' | 'later';

export interface Principle {
  /** The section's anchor: #<id>. */
  id: string;
  title: Record<Lang, string>;
  source: PrincipleSource;
  /** The section's paragraphs, in order ([n.1]–[n.3]). */
  paragraphs: Record<Lang, Run[][]>;
}

const TITLE = 'Return to Life Through Contrology';
const book: Run = { title: TITLE };

export const principlesSourceLabels: Record<PrincipleSource, Record<Lang, string>> = {
  book: { tr: '1945 kitabında', en: 'In the 1945 book' },
  idea: { tr: 'Kitapta fikir olarak', en: 'In the book as an idea' },
  later: { tr: 'Sonraki öğretim terimi', en: 'A later teaching term' },
};

/** The opening, [0.1]–[0.3]. */
export const principlesOpening: Record<Lang, Run[][]> = {
  tr: [
    ['Pilates anlatılırken çoğu zaman bir dizi prensipten söz edilir: nefes, konsantrasyon, kontrol, merkez, kesinlik ve akış. Bu prensipler, bir harekette neye dikkat edildiğini anlamayı kolaylaştırır.'],
    [
      "Joseph Pilates'in William John Miller'la birlikte yazdığı 1945 tarihli ",
      book,
      ' kitabında numaralı bir prensip listesi yoktur. Bu fikirlerin bazıları kitapta açıkça yer alır; bazılarına ise sonradan ad verildi. Altı prensipli liste, sonraki eğitim kitaplarında ve öğretmen eğitimlerinde yaygınlaştı. Okullar prensipleri bugün de farklı sayılarla ve farklı adlarla anlatır.',
    ],
    ['Bu sayfa yedi prensibi bir arada anlatıyor: yaygın altı prensip ve bu sayfanın yedinci başlık olarak ele aldığı hizalanma. Bu seçim editoryaldir; herkesin kabul ettiği bir yedinci prensip yoktur. Sıralama bir önem sırası değil, okuma ve öğrenme sırasıdır. Her prensipteki kaynak etiketi, ilgili fikrin 1945 tarihli kitapta nasıl yer aldığını veya sonraki öğretim geleneğine ait olduğunu gösterir.'],
  ],
  en: [
    ['Pilates is often explained through a set of principles: breathing, concentration, control, centre, precision and flow. They help explain what to pay attention to during a movement.'],
    [
      book,
      ', the 1945 book Joseph Pilates wrote with William John Miller, contains no numbered list of principles. Some of these ideas appear in it plainly; others were named later. The six-principle list became common in later teaching books and teacher training. Schools still count and name the principles differently.',
    ],
    ['This page brings together seven principles: the commonly presented six, plus alignment as a seventh topic chosen for this page. This is an editorial choice; there is no universally accepted seventh principle. The order is a reading and learning sequence, not a ranking. The source label for each principle indicates whether the idea appears in the 1945 book or belongs to later teaching traditions.'],
  ],
};

/** The seven principles, in the approved order (D2), [1.1]–[7.3]. */
export const principles: Principle[] = [
  {
    id: 'nefes',
    title: { tr: 'Nefes', en: 'Breathing' },
    source: 'book',
    paragraphs: {
      tr: [
        ["Pilates'te nefes, hareketin bir parçasıdır. Hareketin bölümleri çoğu zaman nefesle eşleştirilir: bir bölüm nefes alırken, bir sonraki nefes verirken yapılır."],
        ['1945 tarihli kitapta Pilates ve Miller nefese büyük önem verir: “Nefes almak, yaşamın ilk eylemidir; sonuncusu da.” (Pilates ve Miller, 1945, s. 9) Kitaptaki egzersiz talimatlarında, ne zaman nefes alınıp verileceği büyük harflerle yazılmıştır.'],
        ['Nefes, hareketin ritmini belirler ve dikkati harekette tutar. Okullar nefesi farklı yollarla öğretir; bu sayfa bir nefes tekniği önermiyor.'],
      ],
      en: [
        ['In Pilates, breathing is part of the movement. Its phases are often paired with the breath: one part is done breathing in, the next breathing out.'],
        ["In the 1945 book, Pilates and Miller give breathing great weight: “Breathing is the first act of life, and the last.” (Pilates and Miller, 1945, p. 9) The book's exercise instructions print when to breathe in and out in capitals."],
        ['Breathing sets the rhythm of a movement and keeps attention on it. Schools teach breathing in different ways; this page does not recommend a technique.'],
      ],
    },
  },
  {
    id: 'konsantrasyon',
    title: { tr: 'Konsantrasyon', en: 'Concentration' },
    source: 'book',
    paragraphs: {
      tr: [
        ['Konsantrasyon, dikkatin yapılan harekete verilmesidir. Örneğin bir kolu kaldırırken, hareketin nerede başlayıp nerede bittiğine dikkat edilir.'],
        ['Bu fikir 1945 tarihli kitapta açıkça yer alır. Pilates ve Miller, egzersiz sırasında zihnin tümüyle egzersizin amacına verilmesini ister.'],
        ['Kontrol ve kesinlik konsantrasyonla başlar. Dikkat hareketten uzaklaştığında, hareketi doğru yapmak da zorlaşır.'],
      ],
      en: [
        ['Concentration means giving full attention to the movement in hand. When raising an arm, for example, you pay attention to where the movement begins and ends.'],
        ['The idea is stated plainly in the 1945 book. Pilates and Miller ask that the mind stay wholly on the purpose of each exercise.'],
        ['Control and precision start with concentration. When attention leaves the movement, doing it well becomes harder.'],
      ],
    },
  },
  {
    id: 'kontrol',
    title: { tr: 'Kontrol', en: 'Control' },
    source: 'book',
    paragraphs: {
      tr: [
        ['Kontrol, hareketin baştan sona yönetilmesidir. Hareket savrulmaz; istenen hızda ve istenen yönde yapılır. Örneğin yere uzanırken beden kendini bırakmaz; yavaşça ve adım adım iner.'],
        ["Bu fikir, Pilates'in yöntemine verdiği adda da görülür: Contrology. Pilates ve Miller'ın sözleriyle: “Contrology, zihnin kasları denetlemesiyle başlar.” (Pilates ve Miller, 1945, s. 6) Kitapta öğrenme, bilinçli denetimle başlar ve doğru tekrarlarla gelişir."],
        ['Kontrol konsantrasyonla başlar, merkezle desteklenir: gövde sabit kaldığında kollar ve bacaklar daha rahat yönetilir.'],
      ],
      en: [
        ['Control means guiding a movement from start to finish. Nothing is swung; the movement keeps its intended speed and direction. Lying down, for example, the body does not drop; it lowers slowly, step by step.'],
        ["The idea shows in the name Pilates gave his method: Contrology. In Pilates and Miller's words: “Contrology begins with mind control over muscles.” (Pilates and Miller, 1945, p. 6) The book presents learning as a process that begins with conscious control and develops through correct repetition."],
        ['Control starts with concentration and is supported by the centre: when the trunk stays steady, the arms and legs are easier to guide.'],
      ],
    },
  },
  {
    id: 'merkez',
    title: { tr: 'Merkez', en: 'Centre' },
    source: 'later',
    paragraphs: {
      tr: [
        ['Merkez, sonraki Pilates öğretiminin temel kavramlarından biridir. Tek bir noktayı değil, çoğu zaman gövdenin orta bölümünü anlatır: kaburgaların altından leğene kadar uzanan bölgeyi. Bazı okullar buna İngilizce “powerhouse” der.'],
        ['Bir harekette kollar ve bacaklar çalışırken gövde yerinde kalır. Örneğin sırtüstü yatarken iki bacak birden kaldırıldığında, gövde bu hareketle sallanmaz; sabit ve düzenli kalır.'],
        ['İngilizce “centering” (merkezleme) ve “powerhouse” sözcükleri 1945 tarihli kitapta geçmez. Okullar merkezin nasıl çalıştırılacağını da farklı anlatır. Bu sayfa bir kas tekniğini değil, fikrin kendisini anlatıyor.'],
      ],
      en: [
        ['The centre is one of the key ideas of later Pilates teaching. It usually means not a single point but the middle part of the trunk, from below the ribs down to the pelvis. Some schools call it the “powerhouse”.'],
        ['In an exercise, the arms and legs work while the trunk stays in place. Lying on the back and lifting both legs, for example, the trunk does not rock with them; it stays steady and organised.'],
        ['The words “centering” and “powerhouse” do not occur in the 1945 book. Schools also differ on how the centre is engaged. This page describes the idea, not a muscle technique.'],
      ],
    },
  },
  {
    id: 'hizalanma',
    title: { tr: 'Hizalanma', en: 'Alignment' },
    source: 'idea',
    paragraphs: {
      tr: [
        ['Hizalanma, bedenin bölümlerinin birbirine göre nasıl durduğudur: baş, kaburgalar, leğen, kollar ve bacaklar. Hareketten önce beden düzenlenir; hareket boyunca bu düzen korunur. Örneğin ayakta dururken başın, kaburgaların ve leğenin birbirine göre nerede durduğu fark edilir.'],
        ['Hizalanma yaygın altı prensipli listede ayrı bir madde olarak yer almaz. Bununla birlikte Pilates ve Miller, 1945 tarihli kitaplarında kendi dönemlerinin diliyle yanlış duruşların düzeltilmesinden söz eder. Bu ifade kitabın tarihsel yaklaşımını yansıtır; güncel bir sağlık önerisi değildir.'],
        ['Hizalanma ile kesinlik birbirini tamamlar: hizalanma bedenin nasıl durduğuna, kesinlik hareketin hangi yolu izlediğine bakar.'],
      ],
      en: [
        ['Alignment is how the parts of the body sit in relation to each other: head, rib cage, pelvis, arms and legs. The body is arranged before the movement, and the arrangement is kept as it moves. Standing, for example, you notice where the head, ribs and pelvis are in relation to one another.'],
        ["Alignment does not appear as a separate item in the commonly presented six-principle list. However, in their 1945 book, Pilates and Miller refer to correcting “wrong postures” in the language of their time. This reflects the book's historical approach; it is not current health advice."],
        ['Alignment and precision complement each other: alignment looks at how the body is placed, precision at the path the movement follows.'],
      ],
    },
  },
  {
    id: 'kesinlik',
    title: { tr: 'Kesinlik', en: 'Precision' },
    source: 'later',
    paragraphs: {
      tr: [
        ['Kesinlik, bir hareketin tam olarak nasıl yapıldığıdır: nereden başladığı, hangi yolu izlediği ve nerede bittiği. Kaç tekrar yapıldığından çok, her tekrarın nasıl yapıldığı önemlidir. Örneğin kolla çizilen bir çember, her seferinde aynı büyüklükte ve aynı yolda çizilir.'],
        ['Bu sözcüğün İngilizcesi olan “precision”, 1945 tarihli kitapta geçmez. Ama ona yakın bir kural vardır: talimatlara tam olarak uymak ve bir egzersizde ustalaşmadan bir sonrakine geçmemek.'],
        ['Kesinlik konsantrasyon ister. Başı ve sonu belli hareketler birbirine daha kolay bağlanır; bu da akışı hazırlar.'],
      ],
      en: [
        ['Precision is exactly how a movement is done: where it starts, which path it follows and where it ends. How each repetition is done matters more than how many are done. An arm circle, for example, traces the same size and path each time.'],
        ['The word “precision” does not occur in the 1945 book, but it contains a related rule: follow the instructions exactly and do not move on to the next exercise until the current one has been mastered.'],
        ['Precision needs concentration. Movements with a clear start and end also link more easily, which prepares the way for flow.'],
      ],
    },
  },
  {
    id: 'akis',
    title: { tr: 'Akış', en: 'Flow' },
    source: 'idea',
    paragraphs: {
      tr: [
        ['Akış, hareketin kesintisiz sürmesidir. Bir hareket durup yeniden başlamadan bir sonrakine geçer; egzersizler arasındaki geçişler de çalışmanın parçasıdır. Örneğin bir egzersiz bittiğinde beden durup yeniden toparlanmaz; sakin ve sürekli bir hareketle bir sonrakinin başlangıcına geçer.'],
        ['1945 tarihli kitapta bu fikre yakın bir anlatım vardır: doğru tekrarla hareketin ritmi ve koordinasyonu zamanla “bilinçaltı” hâle gelir. Akışın bir prensip olarak adlandırılması ise sonraki öğretime aittir.'],
        ['Akış, diğer altı prensip bir araya geldiğinde ortaya çıkar. Nefes harekete ritim verir; konsantrasyon dikkati toplar, kontrol hareketi yönlendirir. Merkez dayanak sağlar; hizalanma bedenin düzenini, kesinlik ise hareketin biçimini destekler.'],
      ],
      en: [
        ['Flow is movement without interruption. One movement passes into the next without stopping and starting again, and the transitions between exercises are part of the work. When one exercise ends, for example, the body does not stop to reset; it moves into the next starting position in one calm, continuous motion.'],
        ['The 1945 book describes something close to this: with correct repetition, the rhythm and coordination of a movement gradually become “subconscious”. Naming flow as a principle belongs to later teaching.'],
        ['Flow appears when the other six principles come together. Breathing sets the rhythm, concentration focuses attention, and control guides the movement. The centre provides support; alignment organises the body, and precision shapes the movement.'],
      ],
    },
  },
];

/** The closing, [8.1], with links to Contrology and Miras / Legacy. */
export const principlesClosing: Record<Lang, Run[]> = {
  tr: [
    "Yedi prensip ayrı ayrı anlatılır, ama bir harekette birlikte çalışır. Bu sayfa egzersiz öğretmiyor; Pilates'te bir harekette neye dikkat edildiğini anlatıyor. 1945 tarihli kitap ",
    { text: 'Contrology', href: '/contrology/' },
    " sayfasında, Joseph Pilates'in hayatı ",
    { text: 'Miras', href: '/miras/' },
    ' sayfasında anlatılıyor.',
  ],
  en: [
    'The seven principles are described one by one, but in a movement they work together. This page does not teach exercises; it explains what to pay attention to during a Pilates movement. The 1945 book is covered on the ',
    { text: 'Contrology', href: '/en/contrology/' },
    " page, and Joseph Pilates's life on the ",
    { text: 'Legacy', href: '/en/legacy/' },
    ' page.',
  ],
};

/**
 * Interface text: the contents list, the sources heading and, on the Turkish
 * page only, the translation note under the sources (owner's wording, 2026-11-05).
 */
export const principlesLabels: Record<Lang, { contents: string; source: string; sources: string; translations?: string }> = {
  tr: { contents: 'Bu sayfada', source: 'Kaynağı', sources: 'Kaynaklar', translations: '1945 tarihli kitaptan yapılan alıntıların Türkçe çevirileri bu sayfa için yapılmıştır.' },
  en: { contents: 'On this page', source: 'Source', sources: 'Sources' },
};

/** The meta description (doc, "Meta description (proposal)"). */
export const principlesDescription: Record<Lang, string> = {
  tr: "Pilates'i anlatan yedi prensip: nefes, konsantrasyon, kontrol, merkez, hizalanma, kesinlik ve akış.",
  en: 'Seven principles used to explain Pilates: breathing, concentration, control, centre, alignment, precision and flow.',
};

export interface PrinciplesReference {
  before: string;
  /** The work's title, in italics; omitted for web pages. */
  title?: string;
  after: string;
  /** Where the work can be read; omitted for a catalogue-only record. */
  link?: { label: string; href: string };
  /** A note in the page's language. */
  note?: Record<Lang, string>;
}

/**
 * The compact bibliography: B1 (both editions, worded as on Contrology),
 * S1 (Wells et al. 2012) and S3 (Pilates Anatomy). Citations stay in English
 * on both pages. Not listed (owner, 2026-11-05): Your Health (1934) and its
 * National Union Catalog record, which the page doesn't discuss, and
 * Eliks et al. 2019, which was not consulted. Their records stay in the
 * research doc only.
 *
 * The paragraph-to-source map is the research doc's; its [0.3] and [5.2]
 * entries were updated for the owner's corrections (2026-11-05).
 *
 * Owner's rule (2026-11-05): the public site never links to other Pilates
 * studios, schools, training providers or brands. S5 (Body Control Pilates),
 * S6 (Merrithew / STOTT PILATES) and S7 (Polestar Pilates) stay in the research
 * doc's source register only; don't add them, or any replacement provider link,
 * here or elsewhere on the page.
 */
export const principlesSources: PrinciplesReference[] = [
  { before: 'Pilates, Joseph H., and William John Miller. ', title: TITLE, after: '. New York: J. J. Augustin, 1945.', link: { label: 'HathiTrust', href: 'https://hdl.handle.net/2027/uiug.30112004198963' } },
  { before: 'Pilates, Joseph H., and William John Miller. ', title: TITLE, after: '. Boston: Christopher Publishing House, 1960. Reissue with the same pagination.', link: { label: 'HathiTrust', href: 'https://hdl.handle.net/2027/mdp.39015038069475' } },
  {
    before: 'Wells, Cherie, Gregory S. Kolt, and Andrea Bialocerkowski. “Defining Pilates exercise: A systematic review.” ',
    title: 'Complementary Therapies in Medicine',
    after: ' 20 (2012): 253–262.',
    link: { label: 'DOI', href: 'https://doi.org/10.1016/j.ctim.2012.02.005' },
  },
  {
    before: 'Isacowitz, Rael, and Karen Clippinger. ',
    title: 'Pilates Anatomy',
    after: '. Human Kinetics, 2011. Excerpt “Foundation Principles of Pilates”, archived 9 February 2022.',
    link: { label: 'Internet Archive', href: 'https://web.archive.org/web/20220209172226/https://us.humankinetics.com/blogs/excerpt/understand-the-principles-of-pilates' },
  },
];
