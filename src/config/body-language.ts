// The copy of the Bedenin Dili / The Language of the Body page, shown by
// src/components/body-language/BodyLanguageArticle.astro. Approved by the owner
// on 2026-11-01, word for word from the content review document ("Bedenin Dili:
// content review"). Change it only with the owner's approval: every factual
// sentence is tied to the sources below, and that document holds the map.
import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/ui';

export interface BodyLanguageVoice {
  kind: 'body' | 'pilates' | 'notice';
  label: string;
  paragraphs: string[];
}

export interface BodyLanguageChapter {
  id: string;
  title: string;
  kicker: string;
  lead: string;
  /** Ordinary moments, in "Gün içinde" / "Through the day" only. */
  moments?: { label: string; text: string }[];
  voices: BodyLanguageVoice[];
}

export interface BodyLanguageCopy {
  statement: string;
  intro: string[];
  chapters: BodyLanguageChapter[];
  closing: { title: string; line: string; disclaimer: string };
  sourcesTitle: string;
}

export const bodyLanguage: Record<Lang, BodyLanguageCopy> = {
  tr: {
    statement: 'Beden, hareket ederken sürekli bilgi üretir. Bu bilginin bir bölümü, biz fark etmeden işlenir.',
    intro: [
      'Ağırlığını hangi ayağına verdiğini, nefes alırken kaburgalarının nasıl genişlediğini ya da bir hareketin nereden başladığını sürekli düşünerek takip etmezsin. Bedenin bu süreçleri sen düşünmeden de sürdürür.',
      "Bedenin Dili'nin konusu jestler ya da mimikler değil, işte bu bilgi: onu fark etmek ve anlamak. Burada hareket listesi yok. Önce bedenin nasıl çalıştığını, sonra Pilates'in bu bilgiye nasıl yaklaştığını okuyacaksın; gerisini kendi bedeninde keşfedeceksin.",
    ],
    chapters: [
      {
        id: 'noticing',
        title: 'Fark etmek',
        kicker: 'BEDEN FARKINDALIĞI',
        lead: 'Gözlerin kapalıyken de elinin nerede olduğunu bilirsin. Bunun için onu görmen gerekmez.',
        voices: [
          {
            kind: 'body',
            label: 'Bedende.',
            paragraphs: [
              'Bu duyunun adı propriyosepsiyon: bedeninin konumunu ve hareketini algılamanı sağlar. Bu duyuda görev alan algılayıcılar deride, kaslarda ve eklemlerde bulunur. Harcadığın çaba hissi ise hareketi başlatan motor komutlarla ilişkili merkezi sinyallerden kaynaklanır. İçeriden gelen sinyalleri algılayan bir duyu daha var: iç duyum (interosepsiyon). Kalp atışını ya da nefesini hissetmen buna örnektir. Bu bilgilerin hepsi bilince ulaşmaz.',
              'Beden farkındalığı ise herkesin aynı biçimde tanımladığı bir kavram değil. Bir tanıma göre bu bilgilerin fark edebildiğin kısmını anlatır; dikkatin, yorumların ve inançların da onu şekillendirir.',
            ],
          },
          {
            kind: 'pilates',
            label: "Pilates'te.",
            paragraphs: [
              'Pilates araştırmalarında yöntem bir zihin-beden egzersizi olarak anlatılır; kas kontrolüne, duruşa ve nefese dikkat vermek de bu anlatımın parçasıdır. Bu bir anatomi bilgisi değil, yöntemin yaklaşımıdır.',
            ],
          },
          {
            kind: 'notice',
            label: 'Fark et.',
            paragraphs: [
              'Şu an bedeninin hangi kısmını daha net hissediyorsun?',
            ],
          },
        ],
      },
      {
        id: 'standing',
        title: 'Durmak',
        kicker: 'DURUŞ VE OMURGA',
        lead: 'Duruş, bir kez bulunup korunacak sabit bir kalıptan çok, bedenin sürekli yaptığı küçük ayarlamalarla sürer.',
        voices: [
          {
            kind: 'body',
            label: 'Bedende.',
            paragraphs: [
              'Yandan bakıldığında yetişkin omurgasında dört eğrilik görülür: boyun, sırt ve bel eğrilikleri ile sakrum ve kuyruk sokumunun oluşturduğu eğrilik. Sırt eğriliği ile bu son eğrilik doğumdan önce oluşur; boyun eğriliği bebek başını dik tutmaya, bel eğriliği çocuk ayakta durup yürümeye başladıkça gelişir. Bu eğrilikler omurganın hem güçlü hem esnek olmasına, yükü ve sarsıntıyı karşılamasına yardım eder.',
              'Hareketsiz görünen bir duruşta bile kaslar az da olsa çalışır. Bel eğriliğinin biçimi ise omurga şikâyeti olmayan insanlarda bile kişiden kişiye değişir.',
              'Bu sayfada duruşa tek bir ideal biçim üzerinden değil, bedenin farklı pozisyonlara uyum sağlayabilmesi ve gerektiğinde konum değiştirebilmesi üzerinden bakıyoruz.',
            ],
          },
          {
            kind: 'pilates',
            label: "Pilates'te.",
            paragraphs: [
              'Pilates anlatımlarında duruş sık geçen konulardan biridir, ama öğretim dili değişebilir. Pilates üzerine bir derlemede aktarılan açıklamaya göre, "imprint" karın ve kalça kaslarını birlikte çalıştırıp pelvisi geriye eğerek omurgayı düzleştirmeyi; "neutral spine" ise omurganın doğal eğriliklerini korumayı anlatır. Bu terimler belirli öğretim bağlamlarında kullanılan kavramlardır; evrensel Pilates ya da anatomi kuralları değildir.',
            ],
          },
          {
            kind: 'notice',
            label: 'Fark et.',
            paragraphs: [
              'Şu anki duruşuna ne zaman geçtin?',
            ],
          },
        ],
      },
      {
        id: 'breathing',
        title: 'Nefes almak',
        kicker: 'NEFES VE HAREKET',
        lead: 'Nefes sen düşünmeden de sürer, istediğinde ise onu yönlendirebilirsin.',
        voices: [
          {
            kind: 'body',
            label: 'Bedende.',
            paragraphs: [
              'Sakin nefes alırken diyafram kasılıp aşağı iner; kaburgaların arasındaki dış interkostal kaslar da kaburgaları yukarı ve dışa doğru kaldırır. Göğüs boşluğu genişler, hava akciğerlere dolar. Sakin nefes verirken bu kaslar gevşer ve akciğerlerin elastik geri çekilmesi havayı dışarı gönderir. Güçlü nefes verirken karın kasları da devreye girer.',
            ],
          },
          {
            kind: 'pilates',
            label: "Pilates'te.",
            paragraphs: [
              '"Lateral nefes", nefes alırken kaburgaların yanlara doğru genişlemesine odaklanan bir nefes biçimidir.',
            ],
          },
          {
            kind: 'notice',
            label: 'Fark et.',
            paragraphs: [
              'Bu nefeste bedeninde ilk neresi hareket etti?',
            ],
          },
        ],
      },
      {
        id: 'balance',
        title: 'Dengede kalmak',
        kicker: 'MERKEZ, DENGE VE KOORDİNASYON',
        lead: 'Ayakta kıpırdamadan durduğunu sandığında bile beden küçük düzeltmeler yapar.',
        voices: [
          {
            kind: 'body',
            label: 'Bedende.',
            paragraphs: [
              'Bu salınımı algılayan başlıca üç sistem vardır: görme, iç kulaktaki vestibüler sistem ve propriyosepsiyon. Beden bu bilgileri birleştirir ve seni ayakta tutan küçük kas tepkileriyle karşılık verir.',
            ],
          },
          {
            kind: 'pilates',
            label: "Pilates'te.",
            paragraphs: [
              `"Merkez" ve "powerhouse", sınırları belli anatomik yapıların adı değil, Pilates'in öğretim kavramlarıdır. Sınırları da anlatımdan anlatıma değişir: kimine göre göbeğin altında bir kuşak, kimine göre pelvik tabandan kaburgalara uzanan bir alan.`,
            ],
          },
          {
            kind: 'notice',
            label: 'Fark et.',
            paragraphs: [
              'Ayakta beklerken ağırlığın ne sıklıkla yer değiştiriyor?',
            ],
          },
        ],
      },
      {
        id: 'day',
        title: 'Gün içinde',
        kicker: 'GÜNDELİK HAREKET',
        lead: 'Bu bilgi yalnızca egzersiz sırasında üretilmez. Sıradan anlarda da aynı dil konuşulur.',
        moments: [
          { label: 'Otururken.', text: 'Oturmak da tam anlamıyla hareketsiz değildir. Ağırlığın bir yana kayar, sırtın arkalığa yaslanır ve ondan ayrılır, ayağın yer değiştirir.' },
          { label: 'Yürürken.', text: 'Adımının ritmi, kollarının salınımı, nefesin. Bunların bir bölümü kendiliğinden sürer, dikkatini verdiğin anda ise fark edilir hâle gelir.' },
          { label: 'Yerden bir şey alırken.', text: 'Gözün nesneyi bulur, ağırlığın yer değiştirir, gövden ve kolların harekete geçer. Bedeninin farklı bölümlerinin nasıl uyum içinde çalıştığını burada da fark edebilirsin.' },
        ],
        voices: [
          {
            kind: 'notice',
            label: 'Fark et.',
            paragraphs: [
              'Bugün yaptığın en sıradan hareket nereden başladı?',
            ],
          },
        ],
      },
    ],
    closing: {
      title: 'Okumayı sürdürmek',
      line: 'Bedenin Dili bir program değil, bir okuma biçimi.',
      disclaimer: 'Bu sayfa genel bilgi sunar, tıbbi değerlendirmenin yerini tutmaz. Ağrın ya da bir sağlık sorunun varsa bir sağlık uzmanına danış.',
    },
    sourcesTitle: 'Kaynaklar',
  },
  en: {
    statement: 'The body generates information as it moves. Some of this information is processed without our noticing.',
    intro: [
      "You don't have to consciously track which foot carries your weight, how your ribs expand as you breathe, or where a movement begins. Your body keeps coordinating these processes.",
      "The Language of the Body isn't about gestures or facial expressions. It's about this information, and learning to notice and understand it. You won't find exercise lists here: first how the body works, then how Pilates approaches it. The rest is something you'll discover in your own body.",
    ],
    chapters: [
      {
        id: 'noticing',
        title: 'Noticing',
        kicker: 'BODY AWARENESS',
        lead: "With your eyes closed, you still know where your hand is. You don't need to see it.",
        voices: [
          {
            kind: 'body',
            label: 'In the body.',
            paragraphs: [
              "This sense is called proprioception: it lets you perceive your body's position and movement. The receptors involved are found in the skin, muscles and joints. The sensation of effort, however, comes from central signals associated with the motor commands that initiate movement. Another sense picks up signals from inside the body: interoception, such as feeling your heartbeat or breath. Not all of this reaches awareness.",
              "Body awareness isn't defined the same way by everyone. In one account, it's the part you're able to notice, shaped by your attention, interpretations and beliefs.",
            ],
          },
          {
            kind: 'pilates',
            label: 'In Pilates.',
            paragraphs: [
              "Pilates research describes the method as a mind–body exercise involving attention to muscle control, posture and breathing. That's the method's approach, not a fact of anatomy.",
            ],
          },
          {
            kind: 'notice',
            label: 'Notice.',
            paragraphs: [
              'Which part of your body can you feel most clearly right now?',
            ],
          },
        ],
      },
      {
        id: 'standing',
        title: 'Standing',
        kicker: 'POSTURE AND THE SPINE',
        lead: 'Posture is less a fixed shape to find and hold than something the body continually adjusts.',
        voices: [
          {
            kind: 'body',
            label: 'In the body.',
            paragraphs: [
              'Seen from the side, the adult spine has four curves: neck (cervical), upper back (thoracic), lower back (lumbar), and the curve formed by the sacrum and coccyx (sacrococcygeal). The thoracic and sacrococcygeal curves form before birth. The cervical develops as a baby starts to hold up their head, the lumbar as a child begins to stand and walk. Together they help the spine stay strong and flexible and absorb shock under load.',
              'Even in a posture that looks still, your muscles keep working a little. The shape of the lumbar curve also varies from person to person, even among people with no spinal symptoms.',
              "Here, we approach posture not as one ideal shape, but through the body's ability to adapt to different positions and change them when needed.",
            ],
          },
          {
            kind: 'pilates',
            label: 'In Pilates.',
            paragraphs: [
              `Posture comes up often in Pilates, though teaching language can vary. As described in a review of Pilates literature, "imprint" involves engaging the abdominal and buttock muscles together and tilting the pelvis back to flatten the spine, while "neutral spine" refers to maintaining the spine's natural curves. These are concepts used in particular teaching contexts, not universal Pilates or anatomical rules.`,
            ],
          },
          {
            kind: 'notice',
            label: 'Notice.',
            paragraphs: [
              "When did you settle into the posture you're in now?",
            ],
          },
        ],
      },
      {
        id: 'breathing',
        title: 'Breathing',
        kicker: 'BREATH AND MOVEMENT',
        lead: 'Breathing carries on without thought, yet you can direct it whenever you choose.',
        voices: [
          {
            kind: 'body',
            label: 'In the body.',
            paragraphs: [
              "As you breathe in quietly, the diaphragm contracts and moves down, while the external intercostals, muscles between the ribs, lift the ribs up and out. The chest expands and air flows in. As you breathe out quietly, these muscles relax and the lungs' recoil sends the air out. A forceful breath out also uses the abdominal muscles.",
            ],
          },
          {
            kind: 'pilates',
            label: 'In Pilates.',
            paragraphs: [
              '"Lateral breathing" is a breathing pattern that focuses on the ribs widening sideways as you inhale.',
            ],
          },
          {
            kind: 'notice',
            label: 'Notice.',
            paragraphs: [
              'Which part of your body moved first with this breath?',
            ],
          },
        ],
      },
      {
        id: 'balance',
        title: 'Staying balanced',
        kicker: 'CENTRE, BALANCE AND COORDINATION',
        lead: "Even when you think you're standing perfectly still, your body keeps making small corrections.",
        voices: [
          {
            kind: 'body',
            label: 'In the body.',
            paragraphs: [
              'Three main systems detect this sway: vision, the vestibular system in the inner ear, and proprioception. The body combines their signals into the small muscle responses that keep you upright.',
            ],
          },
          {
            kind: 'pilates',
            label: 'In Pilates.',
            paragraphs: [
              '"Centre" and "powerhouse" are Pilates teaching concepts, not anatomical structures with fixed limits. Their boundaries vary between accounts: a band below the navel in one, the area from the pelvic floor to the ribcage in another.',
            ],
          },
          {
            kind: 'notice',
            label: 'Notice.',
            paragraphs: [
              'How often does your weight shift while you stand waiting?',
            ],
          },
        ],
      },
      {
        id: 'day',
        title: 'Through the day',
        kicker: 'EVERYDAY MOVEMENT',
        lead: "This information isn't produced only during exercise. Ordinary moments speak the same language.",
        moments: [
          { label: 'Sitting.', text: "Sitting isn't entirely still either. Your weight drifts to one side, your back meets the chair and leaves it, a foot changes place." },
          { label: 'Walking.', text: 'The rhythm of your steps, the swing of your arms, your breath. Some of it carries on by itself, and you notice it once you pay attention.' },
          { label: 'Picking something up.', text: 'Your eyes find the object, your weight shifts, your trunk and arms come into play. Here too, you can notice how the parts of your body work together.' },
        ],
        voices: [
          {
            kind: 'notice',
            label: 'Notice.',
            paragraphs: [
              'Where did the most ordinary movement of your day begin?',
            ],
          },
        ],
      },
    ],
    closing: {
      title: 'Reading on',
      line: "The Language of the Body isn't a programme. It's a way of reading.",
      disclaimer: "This page offers general information and doesn't replace a medical assessment. If you have pain or a health concern, talk to a health professional.",
    },
    sourcesTitle: 'Sources',
  },
};

export interface BodyLanguageReference {
  before: string;
  /** The linked part of the citation, in the language of `lang`. */
  title: string;
  after: string;
  href: string;
  lang: Lang;
}

// The 15 sources the text uses, as in the content review document. The group
// names are the page's own labels; the citations aren't translated.
export const bodyLanguageSources: { label: Record<Lang, string>; references: BodyLanguageReference[] }[] = [
  {
    label: { tr: 'Anatomi ve fizyoloji', en: 'Anatomy and physiology' },
    references: [
      { before: 'OpenStax. Anatomy and Physiology 2e. ', title: '7.3 The Vertebral Column', after: '.', href: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column', lang: 'en' },
      { before: 'OpenStax. Anatomy and Physiology 2e. ', title: '14.1 Sensory Perception', after: '.', href: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception', lang: 'en' },
      { before: 'OpenStax. Anatomy and Physiology 2e. ', title: '22.3 The Process of Breathing', after: '.', href: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing', lang: 'en' },
    ],
  },
  {
    label: { tr: 'Duyular ve farkındalık', en: 'Sensing and awareness' },
    references: [
      { before: 'Proske U, Gandevia SC. ', title: 'The proprioceptive senses: their roles in signaling body shape, body position and movement, and muscle force', after: '. Physiol Rev. 2012;92(4):1651–97.', href: 'https://doi.org/10.1152/physrev.00048.2011', lang: 'en' },
      { before: 'Kaya D, Akseki D, Doral MN. ', title: 'Patellofemoral sorunlarda propriyosepsiyonun rolü', after: '. TOTBİD Dergisi. 2012;11(4):269–73.', href: 'https://doi.org/10.5606/totbid.dergisi.2012.36', lang: 'tr' },
      { before: 'Khalsa SS, et al. ', title: 'Interoception and Mental Health: A Roadmap', after: '. Biol Psychiatry Cogn Neurosci Neuroimaging. 2018;3(6):501–13.', href: 'https://doi.org/10.1016/j.bpsc.2017.12.004', lang: 'en' },
      { before: 'Mehling WE, et al. ', title: 'Body Awareness: Construct and Self-Report Measures', after: '. PLoS ONE. 2009;4(5):e5614.', href: 'https://doi.org/10.1371/journal.pone.0005614', lang: 'en' },
      { before: 'Onat M, et al. ', title: 'Gençlerde Çok Boyutlu İnteroseptif Farkındalık Değerlendirmesinin Türkçe Geçerlik ve Güvenilirliği', after: '. Arch Neuropsychiatry. 2025;62:164–71.', href: 'https://doi.org/10.29399/npa.28855', lang: 'tr' },
    ],
  },
  {
    label: { tr: 'Duruş ve denge', en: 'Posture and balance' },
    references: [
      { before: 'Ivanenko Y, Gurfinkel VS. ', title: 'Human Postural Control', after: '. Front Neurosci. 2018;12:171.', href: 'https://doi.org/10.3389/fnins.2018.00171', lang: 'en' },
      { before: 'Roussouly P, et al. ', title: 'Classification of the normal variation in the sagittal alignment of the human lumbar spine and pelvis in the standing position', after: '. Spine. 2005;30(3):346–53.', href: 'https://doi.org/10.1097/01.brs.0000152379.54463.65', lang: 'en' },
      { before: 'Peterka RJ. ', title: 'Sensorimotor integration in human postural control', after: '. J Neurophysiol. 2002;88(3):1097–118.', href: 'https://doi.org/10.1152/jn.2002.88.3.1097', lang: 'en' },
    ],
  },
  {
    label: { tr: 'Pilates', en: 'Pilates' },
    references: [
      { before: 'Wells C, Kolt GS, Bialocerkowski A. ', title: 'Defining Pilates exercise: A systematic review', after: '. Complement Ther Med. 2012;20:253–62.', href: 'https://doi.org/10.1016/j.ctim.2012.02.005', lang: 'en' },
      { before: 'Muscolino JE, Cipriani S. ', title: 'Pilates and the "powerhouse"—I', after: '. J Bodyw Mov Ther. 2004;8:15–24.', href: 'https://doi.org/10.1016/S1360-8592(03)00057-3', lang: 'en' },
      { before: 'Jesus LT, et al. ', title: 'Effects of the Pilates method on lung function, thoracoabdominal mobility and respiratory muscle strength', after: '. Fisioterapia e Pesquisa. 2015;22(3).', href: 'https://www.scielo.br/j/fp/a/yhPYWBNZdBZ8CsTRKJT8SLv/?lang=en', lang: 'en' },
      { before: 'IDEA Editorial Staff. ', title: 'Cuing Lateral Breathing', after: '. IDEA Health & Fitness Association; first published 2012, updated 2020.', href: 'https://www.ideafit.com/cuing-lateral-breathing', lang: 'en' },
    ],
  },
];

export interface BodyLanguageImage {
  src: ImageMetadata;
  alt: Record<Lang, string>;
}

// The lead image, 4:5 (master 1600 x 2000 px): a sculptural standing silhouette
// in natural light on warm off-white. It must be original or licensed. While
// this is null the page shows the plain frame, as the content review document
// says. To add it, put the file in src/assets/, import it here and set:
//
//   import photo from '../assets/body-language-lead.jpg';
//   export const bodyLanguageLeadImage: BodyLanguageImage | null = {
//     src: photo,
//     alt: {
//       tr: 'Doğal ışıkta ayakta duran heykelsi bir bedenin silueti.',
//       en: 'The sculptural silhouette of a standing body in natural light.',
//     },
//   };
//
// The spine illustration isn't on the page: it needs a drawing checked by someone
// with anatomical training first. Don't use the homepage dot figure for it.
export const bodyLanguageLeadImage: BodyLanguageImage | null = null;
