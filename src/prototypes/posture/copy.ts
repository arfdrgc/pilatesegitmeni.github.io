// Draft copy for the posture prototype (dev only). Descriptive and general on
// purpose: no credentials, testimonials, sources or health claims. Needs
// editorial review before any of it is used on a production page.
import { ritual } from '../../config/ritual';
import type { Lang } from '../../i18n/ui';
import type { CharacterId, Landmark, Region } from '../../components/ritual/proportions';

export type Pose = 'reach' | 'align' | 'overhead' | 'wave';
export type AlignmentPoint = 'ear' | 'shoulder' | 'hip' | 'knee' | 'ankle';

export const prototypePaths: Record<Lang, string> = {
  tr: '/dev/posture/',
  en: '/en/dev/posture/',
};

/** Temporary character sheets for reviewing the two characters. */
export const sheetPaths: Record<CharacterId, Record<Lang, string>> = {
  male: { tr: '/dev/posture-sheet/', en: '/en/dev/posture-sheet/' },
  female: { tr: '/dev/posture-sheet-female/', en: '/en/dev/posture-sheet-female/' },
};

/** Development harness for the intro ritual. */
export const introPaths: Record<Lang, string> = {
  tr: '/dev/posture-intro/',
  en: '/en/dev/posture-intro/',
};

const tr = {
  metaTitle: 'Duruş prototipi · pilatesegitmeni',
  languageLink: 'English',
  mottoA: 'Daha iyi duruş,',
  mottoB: 'daha sağlıklı yaşam.',
  figureLabel: 'Çizim: öne çökmüş bir duruştan dik ve dengeli bir duruşa geçen bir figür.',
  intro:
    'pilatesegitmeni, Pilates ve duruş farkındalığı üzerine bağımsız bir bilgi ve topluluk sitesi. Bedeninizin nasıl durduğunu fark etmek, biraz daha fazla hareket etmek ve birlikte öğrenmek için.',
  navLabel: 'Bölümler',
  nav: [
    { id: 'pilates', label: 'Pilates', hint: 'Yöntem ve temel ilkeler', pose: 'reach' },
    { id: 'durus', label: 'Duruş', hint: 'Hizalanmayı fark etmek', pose: 'align' },
    { id: 'hareket', label: 'Hareket', hint: 'Bir dakikalık duruş molası', pose: 'overhead' },
    { id: 'topluluk', label: 'Topluluk', hint: "Instagram'da birlikte", pose: 'wave' },
  ] as { id: string; label: string; hint: string; pose: Pose }[],
  pilates: {
    title: 'Pilates nedir?',
    body: [
      "Pilates, Joseph Pilates'in 20. yüzyılın başlarında geliştirdiği bir egzersiz yöntemidir. Kontrollü hareketi, nefesi ve gövdenin merkezinden çalışmayı bir araya getirir.",
      'Mat üzerinde ya da reformer gibi aletlerle uygulanabilir. Hareketler genellikle az tekrarla, dikkatle ve akış içinde yapılır.',
    ],
    principlesTitle: 'Eğitmenlerin sık başvurduğu ilkeler',
    principles: [
      { term: 'Konsantrasyon', text: 'Hareketin nasıl yapıldığına dikkat etmek.' },
      { term: 'Kontrol', text: 'Hızdan ve güçten önce kontrollü hareket.' },
      { term: 'Merkez', text: 'Hareketi gövdenin merkezinden başlatmak.' },
      { term: 'Nefes', text: 'Nefesi hareketle birlikte kullanmak.' },
      { term: 'Hassasiyet', text: 'Az ama özenli tekrar.' },
      { term: 'Akış', text: 'Bir hareketten diğerine kesintisiz geçmek.' },
    ],
  },
  posture: {
    title: 'Duruşu fark etmek',
    body: [
      'Duruş sabit bir poz değil. Gün içinde nasıl oturduğumuz, ayakta durduğumuz ve hareket ettiğimizle sürekli değişir.',
      'Amaç “doğru” bir duruşa kilitlenmek değil; bedeninizin nasıl durduğunu fark etmeye başlamak.',
    ],
    diagramLabel:
      'Yandan görünen dik bir figür. Kulak, omuz, kalça, diz ve ayak bileği aynı dikey çizgi üzerinde işaretlenmiş.',
    points: { ear: 'Kulak', shoulder: 'Omuz', hip: 'Kalça', knee: 'Diz', ankle: 'Ayak bileği' } as Record<AlignmentPoint, string>,
    caption:
      'Yandan bakıldığında sık kullanılan bir referans: kulak, omuz, kalça, diz ve ayak bileği yaklaşık olarak aynı dikey çizgi üzerinde. Her beden farklıdır; bu çizgi bir kural değil, fark etmek için bir başlangıç noktası.',
    articlesTodo: 'Duruş yazıları yayınlandığında buraya bağlantı',
  },
  movement: {
    title: 'Bir dakikalık duruş molası',
    deck: 'Masadan kalkıp ayakta deneyebileceğiniz basit bir farkındalık alıştırması.',
    steps: [
      'Ayaklarınızı kalça genişliğinde açın; ağırlığı iki ayağa yaymaya çalışın.',
      'Ağırlığın nerede durduğunu fark edin: topuklarda mı, parmak uçlarında mı, bir tarafta mı?',
      'Başınızın tepesinden yukarı doğru uzadığınızı düşünün; çenenizi yumuşatın.',
      'Omuzlarınızı zorla geri çekmeden genişlemelerine ve yerleşmelerine izin verin.',
      'Birkaç yavaş nefes alın ve kaburgalarınızın hareketini fark edin.',
    ],
    note: 'Bu bir farkındalık alıştırmasıdır; tıbbi tavsiye ya da tedavi yerine geçmez. Ağrınız varsa bir sağlık profesyoneline danışın.',
    guidesTodo: 'Hareket rehberleri yayınlandığında buraya bağlantı',
  },
  community: {
    title: 'Topluluğa katılın',
    body: "Duruş hatırlatmaları ve Pilates notları için Instagram'da bizi takip edin.",
    cta: "Instagram'da takip et",
  },
  devNote: 'Geliştirme prototipi. Üretim derlemesine girmez.',
  // The intro ritual: title and cues from the owner (initial copy, 2026-10-20).
  ritual: {
    ...ritual.tr,
    /** Shown on the harness when the copy is an unreviewed draft. */
    draftNote: null as string | null,
    harness: {
      metaTitle: 'Giriş ritüeli · pilatesegitmeni',
      title: 'Giriş ritüeli',
      intro:
        '2. adım: hareket ve ipuçları. Canlı önizleme sayfa açılınca bir kez oynar ve cümleleri birer birer gösterir; altındaki durağan kareler karşılaştırma için. Oturum hafızası, otomatik kapanma ve çıkış geçişi henüz yok.',
      backLink: 'Prototipe dön',
      framesNav: 'Kareler',
      frames: {
        play: {
          title: 'Canlı önizleme',
          note: '16 saniye: çökük duruştan nötr duruşa, ardından bir derin nefes; ekranda her an tek cümle; hareket azaltma tercihi açıkken (ya da ?motion=reduce ile) hareket yok, başlık ve dört ipucu birlikte.',
        },
        start: { title: 'Başlangıç: çökük duruş', note: 'Hareketin ilk karesi. İpucu satırında, ilk görünen cümle olan başlık.' },
        end: { title: 'Bitiş: dik, nötr duruş', note: '16.000 ms’deki son kare: onaylı nötr duruş, hiçbir eklem döndürülmemiş. İpucu satırında son ipucu.' },
        static: { title: 'Hareket azaltma sürümü', note: 'Hareket azaltma tercihi açıkken: hareket yok; başlık ve dört ipucunun tümü birlikte.' },
        cues: { title: 'İpucu satırları', note: 'Başlık ve her ipucu, giriş ritüelindeki sırayla, iki satır yüksekliğindeki ipucu satırında.' },
      },
      skipNote: '“Geç” düğmesi henüz bir şey yapmıyor.',
      controls: {
        label: 'Geliştirme denetimleri',
        replay: 'Baştan oynat',
        pause: 'Duraklat',
        resume: 'Sürdür',
        speed: 'Hız',
        time: 'Zaman',
        reduced: 'Hareket azaltma açık: animasyon oynatılmıyor.',
      },
    },
  },
  sheet: {
    metaTitle: 'Karakter sayfası · pilatesegitmeni',
    title: 'Karakter sayfası',
    intro:
      'Geçici inceleme sayfası: iki karakter, erkek ve kadın, referans çizimlerine göre yeniden çizildi. Önden ve yandan, aynı oranlarla, bölümlü gövdesi ve omurgasıyla. Animasyona geçmeden önce değerlendirmek için.',
    backLink: 'Prototipe dön',
    characterNav: 'Karakter',
    characters: { male: 'Erkek', female: 'Kadın' } as Record<CharacterId, string>,
    viewsTitle: 'Önden ve yandan',
    front: 'Önden',
    side: 'Yandan',
    figureLabel: {
      male: 'Erkek karakter önden ve yandan, sekiz baş yüksekliğinde bir ızgara üzerinde: geniş omuzlar, düz bir gövde, dar kalçalar, yana taranmış kısa koyu kahverengi saç. Kolsuz, uyluk ortasına kadar inen tek parça koyu gri-kahve bir bisiklet tulumu giyiyor; kollar gövdenin yanında rahatça sarkıyor.',
      female:
        'Kadın karakter önden ve yandan, sekiz baş yüksekliğinde bir ızgara üzerinde: daha dar omuzlar, belirgin bir bel, daha geniş kalçalar, yana taranmış kısa koyu kahverengi saç. Kolsuz, uyluk ortasına kadar inen tek parça koyu gri-kahve bir bisiklet tulumu giyiyor; kollar gövdenin yanında rahatça sarkıyor.',
    } as Record<CharacterId, string>,
    landmarks: {
      chin: 'Çene',
      shoulder: 'Omuz eklemi',
      elbow: 'Dirsek',
      wrist: 'El bileği',
      fingertips: 'Parmak uçları',
      knee: 'Diz',
      ankle: 'Ayak bileği',
    } as Record<Landmark, string>,
    torsoTitle: 'Gövde ve omurga',
    torsoIntro:
      'Gövde tek parça değil: ayrı bir pelvisin üzerinde on omurga bölümü. Her bölüm alt kenarında, omurganın kavsi üzerindeki bir noktada döner; böylece hareket pelvisten başa doğru bölüm bölüm ilerleyebilir. Tulum her bölümde ayrı çiziliyor ve bölümle birlikte hareket ediyor.',
    constructionFront: 'Önden (bölümler)',
    constructionSide: 'Yandan (bölümler)',
    constructionLabel:
      'Gövdenin bölümleri ayrı ayrı çizilmiş, dönme noktaları işaretli: pelvis, üç bel, dört sırt ve üç boyun bölümü, en üstte baş.',
    regionsTitle: 'Bölgeler',
    regionsLabel: 'Yandan gövde, omurga bölgelerine göre renklendirilmiş: pelvis, bel, sırt ve boyun.',
    regions: { pelvis: 'Pelvis', lumbar: 'Bel (lomber)', thoracic: 'Sırt (torakal)', cervical: 'Boyun (servikal)' } as Record<Region, string>,
    neutralTitle: 'Nötr duruş',
    neutralIntro: 'Bölümlü yapı, kılavuz çizgileri olmadan: tek parça, doğal bir beden gibi okunmalı.',
    neutralLabel: 'Karakter önden, nötr ayakta duruşta.',
    faceTitle: 'Yüz',
    faceLabel: {
      male: 'Erkek karakterin başı yakından, önden ve yandan: kapalı, sakin gözler, kalın kaşlar, yumuşak bir burun, küçük bir ağız; alnına düşen, yana taranmış kısa saç.',
      female:
        'Kadın karakterin başı yakından, önden ve yandan: kapalı, sakin gözler, ince kavisli kaşlar, yumuşak bir burun, küçük bir ağız; yana taranmış kâküllü, kulak hizasında kısa saç.',
    } as Record<CharacterId, string>,
    proportionsTitle: 'Oranlar',
    proportionsLabel: 'Karakter önden, oranları ölçülen hali.',
    measures: { height: 'Toplam boy', shoulders: 'Omuz genişliği', waist: 'Bel genişliği', hips: 'Kalça genişliği' },
    heads: (n: string) => `${n} baş`,
    notesTitle: 'Karar notları',
    notes: [
      'Referans çizimlerinden yeniden çizildi: baş ve yüz, saç, oranlar ve tulum iki referanstan ölçülerek aktarıldı. Saç, yandan eller ve ayaklar referanslardan çizgi olarak kopyalanıp sadeleştirildi; önden eller ölçülere göre çizildi.',
      'Ten: #d8b49e; derin ton (dış çizgiler, gölgeler, ince ayrıntılar): #c49a82. İkisi de onaylı tokenler.',
      'Saç ve kaşlar: koyu kahverengi, referanstaki renk (#583c2c), kendi onaylı tokeniyle. Erkeğin kaşları, referansındaki gibi biraz daha koyu.',
      'Kıyafet: mat, sade, kolsuz tek parça bisiklet tulumu, uyluk ortasına kadar; soluk mürekkep tonunda (#62594f), daha koyu dış çizgilerle.',
      'Tulum her bölümde ayrı çizilir ve gövdeyle birlikte hareket eder: pelvis, her omurga bölümü ve her uyluk kendi parçasını kendi derisinin hemen üstüne çiziyor. Kollar tulumun kol oyuntusundan çıkıyor.',
      'Omurga: ayrı bir pelvisin üzerinde on bölüm. Bel 3 (L5–L1), sırt 4 (T12–T1, göğüs kafesi; omuzlar ve kollar burada), boyun 3 (C7–C1), en üstte baş. Bacaklar kalça, diz ve ayak bileğinde; kollar omuz, dirsek ve el bileğinde döner.',
    ],
    reviewTitle: 'İncelenecekler',
    review: [
      'Kıyafet uygun mu? Pilates eğitimi için doğru bir görünüm mü?',
      'Görselde başka bir düzeltme ister misin?',
      'Tasarımı onaylıyor musun?',
    ],
  },
};

const en: typeof tr = {
  metaTitle: 'Posture prototype · pilatesegitmeni',
  languageLink: 'Türkçe',
  mottoA: 'Better posture.',
  mottoB: 'Better health.',
  figureLabel: 'Illustration: a figure moving from a slouched stance to an upright, balanced one.',
  intro:
    'pilatesegitmeni is an independent information and community site about Pilates and posture awareness. A place to notice how you stand, move a little more, and learn together.',
  navLabel: 'Sections',
  nav: [
    { id: 'pilates', label: 'Pilates', hint: 'The method and its principles', pose: 'reach' },
    { id: 'posture', label: 'Posture', hint: 'Noticing your alignment', pose: 'align' },
    { id: 'movement', label: 'Movement', hint: 'A one-minute posture break', pose: 'overhead' },
    { id: 'community', label: 'Community', hint: 'Join us on Instagram', pose: 'wave' },
  ],
  pilates: {
    title: 'What is Pilates?',
    body: [
      'Pilates is an exercise method developed by Joseph Pilates in the early twentieth century. It brings together controlled movement, breathing and working from the centre of the body.',
      'It can be practised on a mat or with equipment such as the reformer. Movements are usually done with few repetitions, with attention, and in a flowing sequence.',
    ],
    principlesTitle: 'Principles teachers often refer to',
    principles: [
      { term: 'Concentration', text: 'Paying attention to how a movement is done.' },
      { term: 'Control', text: 'Controlled movement before speed or force.' },
      { term: 'Centring', text: 'Starting movement from the centre of the body.' },
      { term: 'Breath', text: 'Using the breath together with movement.' },
      { term: 'Precision', text: 'Fewer repetitions, done with care.' },
      { term: 'Flow', text: 'Moving from one exercise to the next without breaks.' },
    ],
  },
  posture: {
    title: 'Noticing posture',
    body: [
      "Posture isn't a fixed pose. It changes all day with how we sit, stand and move.",
      "The aim isn't to lock into a “correct” posture, but to start noticing how your body is standing.",
    ],
    diagramLabel: 'An upright figure seen from the side, with ear, shoulder, hip, knee and ankle marked on one vertical line.',
    points: { ear: 'Ear', shoulder: 'Shoulder', hip: 'Hip', knee: 'Knee', ankle: 'Ankle' },
    caption:
      "A common reference in side view: ear, shoulder, hip, knee and ankle roughly on one vertical line. Every body is different; the line isn't a rule, just a starting point for noticing.",
    articlesTodo: 'Link to posture articles once they are published',
  },
  movement: {
    title: 'A one-minute posture break',
    deck: 'A simple awareness exercise you can try standing up from your desk.',
    steps: [
      'Stand with your feet hip-width apart and let your weight spread across both feet.',
      'Notice where the weight sits: in your heels, your toes, or more on one side?',
      'Imagine lengthening up through the top of your head, and soften your jaw.',
      'Let your shoulders widen and settle without pulling them back hard.',
      'Take a few slow breaths and notice your ribs move.',
    ],
    note: "This is an awareness exercise; it isn't medical advice or treatment. If you have pain, talk to a health professional.",
    guidesTodo: 'Link to movement guides once they are published',
  },
  community: {
    title: 'Join the community',
    body: 'Follow us on Instagram for posture reminders and notes on Pilates.',
    cta: 'Follow on Instagram',
  },
  devNote: 'Development prototype. Not part of the production build.',
  // Unreviewed draft: an English rendering of the owner's Turkish title and cues.
  ritual: {
    ...ritual.en,
    draftNote: 'Draft English copy, unreviewed: a rendering of the Turkish title and cues, for review only.',
    harness: {
      metaTitle: 'Intro ritual · pilatesegitmeni',
      title: 'Intro ritual',
      intro:
        'Step 2: movement and cues. The live preview plays once when the page opens and shows the sentences one at a time; the still frames below it are for comparison. No session memory, automatic dismissal or exit transition yet.',
      backLink: 'Back to the prototype',
      framesNav: 'Frames',
      frames: {
        play: {
          title: 'Live preview',
          note: 'Sixteen seconds: from the slouch to the neutral pose, then one deep breath; one sentence on screen at a time; with reduced motion preferred (or ?motion=reduce), no movement, and the title with all four cues.',
        },
        start: { title: 'Start: slouched', note: 'The movement’s first frame. The cue line shows the title, the first sentence to appear.' },
        end: { title: 'End: upright, neutral', note: 'The last frame, at 16,000 ms: the approved neutral pose, with no joint rotated. The cue line shows the last cue.' },
        static: { title: 'Reduced-motion version', note: 'With reduced motion preferred: no movement; the title and all four cues together.' },
        cues: { title: 'Cue lines', note: 'The title and each cue, in the intro’s order, in its two-line cue line.' },
      },
      skipNote: 'The “Skip” button does nothing yet.',
      controls: {
        label: 'Development controls',
        replay: 'Replay',
        pause: 'Pause',
        resume: 'Resume',
        speed: 'Speed',
        time: 'Time',
        reduced: 'Reduced motion is on: the animation does not play.',
      },
    },
  },
  sheet: {
    metaTitle: 'Character sheet · pilatesegitmeni',
    title: 'Character sheet',
    intro:
      'Temporary review page: the two characters, male and female, redrawn from their reference sheets. From the front and the side, on the same proportions, with their segmented torso and spine. For review before any animation work.',
    backLink: 'Back to the prototype',
    characterNav: 'Character',
    characters: { male: 'Male', female: 'Female' },
    viewsTitle: 'Front and side',
    front: 'Front',
    side: 'Side',
    figureLabel: {
      male: 'The male character from the front and the side, on an eight-head grid: broad shoulders, a straight torso, narrow hips and short, side-swept dark brown hair. He wears a sleeveless, one-piece, charcoal-taupe cycling suit that ends at mid-thigh; the arms hang relaxed beside the torso.',
      female:
        'The female character from the front and the side, on an eight-head grid: narrower shoulders, a defined waist, wider hips and short, side-swept dark brown hair. She wears a sleeveless, one-piece, charcoal-taupe cycling suit that ends at mid-thigh; the arms hang relaxed beside the torso.',
    },
    landmarks: {
      chin: 'Chin',
      shoulder: 'Shoulder joint',
      elbow: 'Elbow',
      wrist: 'Wrist',
      fingertips: 'Fingertips',
      knee: 'Knee',
      ankle: 'Ankle',
    },
    torsoTitle: 'Torso and spine',
    torsoIntro:
      "The torso isn't one piece: it is ten spinal segments above a separate pelvis. Each segment pivots at its lower edge, on the curve of the spine, so movement can travel segment by segment from the pelvis to the head. The suit is drawn per segment and moves with it.",
    constructionFront: 'Front (segments)',
    constructionSide: 'Side (segments)',
    constructionLabel:
      'The torso segments drawn separately with their pivots marked: pelvis, three lumbar, four thoracic and three cervical segments, with the head on top.',
    regionsTitle: 'Regions',
    regionsLabel: 'The torso from the side, coloured by spinal region: pelvis, lumbar, thoracic and cervical.',
    regions: { pelvis: 'Pelvis', lumbar: 'Lumbar', thoracic: 'Thoracic', cervical: 'Cervical' },
    neutralTitle: 'Neutral standing pose',
    neutralIntro: 'The segmented construction without guides: it should read as one continuous, natural body.',
    neutralLabel: 'The character from the front, in a neutral standing pose.',
    faceTitle: 'Face',
    faceLabel: {
      male: "Close-up of the male character's head from the front and the side: closed, calm eyes, thick brows, a soft nose and a small mouth, with short, side-swept hair falling over the forehead.",
      female:
        "Close-up of the female character's head from the front and the side: closed, calm eyes, thin arched brows, a soft nose and a small mouth, with short, ear-length hair and a side-swept fringe.",
    },
    proportionsTitle: 'Proportions',
    proportionsLabel: 'The character from the front, as measured for its proportions.',
    measures: { height: 'Total height', shoulders: 'Shoulder width', waist: 'Waist width', hips: 'Hip width' },
    heads: (n: string) => `${n} heads`,
    notesTitle: 'Notes',
    notes: [
      'Redrawn from the reference sheets: head and face, hair, proportions and suit were measured from the two references. The hair, the side-view hands and the feet were traced from the references and simplified; the front-view hands were drawn to measure.',
      'Skin: #d8b49e; deep tone (outlines, shading, fine details): #c49a82. Both are approved tokens.',
      'Hair and brows: dark brown, the references’ colour (#583c2c), with its own approved token. The male’s brows are a little darker, as in his reference.',
      'Suit: a matte, plain, sleeveless one-piece cycling suit to mid-thigh, in the muted ink tone (#62594f), with darker outlines.',
      'The suit is drawn per segment and moves with the body: the pelvis, every spinal segment and each thigh draws its own piece right over its skin. The arms come out of the suit’s armholes.',
      'Spine: ten segments above a separate pelvis. Lumbar 3 (L5–L1), thoracic 4 (T12–T1, the rib cage, which carries the shoulders and arms), cervical 3 (C7–C1), with the head on top. The legs pivot at the hip, knee and ankle; the arms at the shoulder, elbow and wrist.',
    ],
    reviewTitle: 'To review',
    review: [
      'Is the outfit suitable? Is it a good look for a Pilates instructor?',
      'Do you want any other visual adjustments?',
      'Do you approve the design?',
    ],
  },
};

export const copy: Record<Lang, typeof tr> = { tr, en };
