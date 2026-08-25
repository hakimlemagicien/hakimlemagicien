/**
 * Local still-image copy for media batches 02 (11–20) and 04 (41–60).
 * Draft UI copy only — TRAINING_REVIEW_REQUIRED. Not baked into images.
 */

type Cue = { kind: "breath" | "aim" | "joint"; textAr: string };
type StageDraft = {
  key: "a" | "b" | "c";
  titleAr: string;
  shortTitleAr: string;
  instructionAr: string;
  breathAr: string;
  cues: readonly [Cue, Cue, Cue];
};
type MistakeDraft = { key: "01" | "02"; descriptionAr: string };

export type ExerciseStageBatchGuideDraft = {
  externalId: string;
  nameAr: string;
  stages: readonly [StageDraft, StageDraft, StageDraft];
  mistakes: readonly [MistakeDraft, MistakeDraft];
  compare: { correctLabelAr: string; incorrectLabelAr: string };
};

export const EXERCISE_STAGE_BATCH_GUIDE_DRAFTS: readonly ExerciseStageBatchGuideDraft[] = [
  {
    externalId: "CH-007",
    nameAr: "ضغط دمبل علوي",
    stages: [
      {
        key: "a",
        titleAr: "الدمبلان فوق الصدر العلوي",
        shortTitleAr: "الاستعداد",
        instructionAr: "على مقعد مائل نحو 30°، الدمبلان فوق الصدر العلوي، الرسغان محايدان، لوحا الكتف متراجعان.",
        breathAr: "شهيق وتثبيت الجذع قبل الإنزال.",
        cues: [
          { kind: "aim", textAr: "الدمبلان فوق خط الصدر العلوي" },
          { kind: "joint", textAr: "أبقِ لوحَي الكتف متراجعين" },
          { kind: "breath", textAr: "شهيق وتثبيت قبل الإنزال" },
        ],
      },
      {
        key: "b",
        titleAr: "إنزال الدمبلين",
        shortTitleAr: "النزول",
        instructionAr: "أنزل الدمبلين بتحكم حتى جانب الصدر العلوي مع بقاء الساعدين قريبين من الوضع العمودي.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "أنزل حتى جانب الصدر العلوي" },
          { kind: "joint", textAr: "أبقِ الساعدين عموديين تقريباً" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الصعود",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع الدمبلين حتى منتصف المسار فقط؛ المرفقان ما زالا مثنيين بوضوح.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ المرفقين مثنيين بوضوح" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "تقوس مفرط في أسفل الظهر." },
      { key: "02", descriptionAr: "فتح المرفقين للخارج حتى زاوية قائمة." },
    ],
    compare: {
      correctLabelAr: "صحيح — الظهر ثابت على المقعد",
      incorrectLabelAr: "خطأ — تقوس أسفل الظهر",
    },
  },
  {
    externalId: "CH-010",
    nameAr: "كيبل فلاي علوي",
    stages: [
      {
        key: "a",
        titleAr: "البكرات العالية",
        shortTitleAr: "الاستعداد",
        instructionAr: "قف بخطوة خفيفة، البكرات عالية، المقبضان مفتوحان والجذع ثابت.",
        breathAr: "شهيق قبل الضم.",
        cues: [
          { kind: "aim", textAr: "البكرات عالية والمقبضان مفتوحان" },
          { kind: "joint", textAr: "أبقِ الجذع ثابتاً" },
          { kind: "breath", textAr: "شهيق قبل الضم" },
        ],
      },
      {
        key: "b",
        titleAr: "ضم المقبضين",
        shortTitleAr: "الضم",
        instructionAr: "ضم المقبضين أمام أسفل الصدر مع بقاء انحناء خفيف ثابت في المرفقين.",
        breathAr: "زفير أثناء الضم.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الضم" },
          { kind: "aim", textAr: "التقِ المقبضين أمام أسفل الصدر" },
          { kind: "joint", textAr: "أبقِ انحناء المرفق ثابتاً" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الفتح",
        shortTitleAr: "العودة",
        instructionAr: "افتح الذراعين حتى منتصف المسار فقط؛ المقبضان لم يعودا إلى أقصى الفتح.",
        breathAr: "شهيق أثناء الفتح.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الفتح" },
          { kind: "aim", textAr: "افتح حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا تحوّل الحركة إلى ضغط" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "أرجحة الجذع للأمام لإنهاء التكرار." },
      { key: "02", descriptionAr: "ثني المرفقين حتى تتحول الحركة إلى ضغط." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع ثابت",
      incorrectLabelAr: "خطأ — أرجحة الجذع",
    },
  },
  {
    externalId: "BI-003",
    nameAr: "هامر كيرل",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "قف ثابتاً، الدمبلان بجانب الفخذين بقبضة محايدة، الكوعان ملاصقان للجذع.",
        breathAr: "شهيق هادئ قبل الرفع.",
        cues: [
          { kind: "joint", textAr: "الكوعان ملاصقان للجذع" },
          { kind: "aim", textAr: "قبضة محايدة بجانب الفخذين" },
          { kind: "breath", textAr: "شهيق هادئ قبل الرفع" },
        ],
      },
      {
        key: "b",
        titleAr: "رفع الدمبل",
        shortTitleAr: "الرفع",
        instructionAr: "اثنِ المرفقين لرفع الدمبلين بقبضة محايدة دون أرجحة الجذع ودون تحريك الكوع للأمام.",
        breathAr: "زفير أثناء الرفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الرفع" },
          { kind: "aim", textAr: "ارفع بثني المرفقين فقط" },
          { kind: "joint", textAr: "أبقِ الكوع ثابتاً بجانب الجذع" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الإنزال",
        shortTitleAr: "الإنزال",
        instructionAr: "أنزل الدمبلين حتى منتصف المسار فقط (مرفقان نحو 90°).",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الإنزال" },
          { kind: "aim", textAr: "أنزل حتى زاوية 90° تقريباً" },
          { kind: "joint", textAr: "أبقِ الجذع ثابتاً" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "أرجحة الجذع لإنهاء التكرار." },
      { key: "02", descriptionAr: "تحرك الكوع للأمام بعيداً عن الجذع." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع ثابت",
      incorrectLabelAr: "خطأ — أرجحة الجذع",
    },
  },
  {
    externalId: "BA-006",
    nameAr: "سحب لات",
    stages: [
      {
        key: "a",
        titleAr: "التعليق على البار",
        shortTitleAr: "الاستعداد",
        instructionAr: "ثبّت الفخذين تحت الوسادة، قبضة علوية متوسطة، الذراعان ممتدتان والصدر مرفوع.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "ثبّت الفخذين والصدر مرفوعاً" },
          { kind: "aim", textAr: "ذراعان ممتدتان على البار" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب البار",
        shortTitleAr: "السحب",
        instructionAr: "اسحب البار نحو أعلى الصدر مع الكوعين للأسفل، دون سحبه خلف الرقبة.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "أوصل البار إلى أعلى الصدر" },
          { kind: "joint", textAr: "أبقِ الكوعين للأسفل لا خلف الرأس" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "مد الذراعين حتى منتصف المسار فقط؛ البار لم يعد إلى التعليق الكامل.",
        breathAr: "شهيق أثناء المد.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء المد" },
          { kind: "aim", textAr: "مد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الجذع دون تمايل خلفي" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "سحب البار خلف الرقبة." },
      { key: "02", descriptionAr: "التمايل الخلفي الزائد بالجذع." },
    ],
    compare: {
      correctLabelAr: "صحيح — البار إلى أعلى الصدر",
      incorrectLabelAr: "خطأ — سحب خلف الرقبة",
    },
  },
  {
    externalId: "LE-004",
    nameAr: "ضغط رجلين",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "القدمان على اللوح بعرض مناسب، أسفل الظهر مدعوم على المقعد، الركبتان غير مقفلتين بقسوة.",
        breathAr: "شهيق وتثبيت قبل النزول.",
        cues: [
          { kind: "joint", textAr: "أسفل الظهر مدعوم على المقعد" },
          { kind: "aim", textAr: "القدمان بعرض مناسب على اللوح" },
          { kind: "breath", textAr: "شهيق قبل النزول" },
        ],
      },
      {
        key: "b",
        titleAr: "ثني الركبتين",
        shortTitleAr: "النزول",
        instructionAr: "اثنِ الركبتين بتحكم حتى يقترب اللوح ضمن المدى الآمن مع بقاء الركبتين فوق القدمين.",
        breathAr: "الحفاظ على التثبيت أثناء النزول.",
        cues: [
          { kind: "aim", textAr: "انزل ضمن المدى الآمن" },
          { kind: "joint", textAr: "أبقِ الركبتين فوق القدمين" },
          { kind: "breath", textAr: "حافظ على تثبيت الجذع" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الدفع",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع حتى منتصف المسار فقط؛ الركبتان ما زالتا مثنيتين بوضوح.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "ادفع حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا تقفل الركبتين بقسوة" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "انهيار الركبتين للداخل." },
      { key: "02", descriptionAr: "رفع أسفل الظهر عن المقعد." },
    ],
    compare: {
      correctLabelAr: "صحيح — الركبتان فوق القدمين",
      incorrectLabelAr: "خطأ — انهيار الركبتين",
    },
  },
  {
    externalId: "LE-006",
    nameAr: "سكوات بلغاري",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "القدم الأمامية ثابتة، الخلفية على المقعد، الجذع معتدل والحوض مواجه للأمام.",
        breathAr: "شهيق وتثبيت قبل النزول.",
        cues: [
          { kind: "joint", textAr: "القدم الأمامية ثابتة والجذع معتدل" },
          { kind: "aim", textAr: "الحوض مواجه للأمام" },
          { kind: "breath", textAr: "شهيق قبل النزول" },
        ],
      },
      {
        key: "b",
        titleAr: "النزول على الساق الأمامية",
        shortTitleAr: "النزول",
        instructionAr: "انزل حتى تقترب الركبة الأمامية من زاوية 90° ضمن المدى الآمن، مع بقاء منتصف القدم مركز الضغط.",
        breathAr: "الحفاظ على التثبيت أثناء النزول.",
        cues: [
          { kind: "aim", textAr: "انزل حتى يقترب الفخذ من الأفقية" },
          { kind: "joint", textAr: "أبقِ الركبة فوق منتصف القدم" },
          { kind: "breath", textAr: "حافظ على تثبيت الجذع" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الصعود",
        shortTitleAr: "الصعود",
        instructionAr: "اصعد حتى منتصف المسار فقط؛ الركبة الأمامية ما زالت مثنية.",
        breathAr: "زفير أثناء الصعود.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الصعود" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "اضغط عبر القدم الأمامية كاملة" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "انهيار الركبة الأمامية للداخل." },
      { key: "02", descriptionAr: "ارتفاع كعب القدم الأمامية عن الأرض." },
    ],
    compare: {
      correctLabelAr: "صحيح — الركبة فوق القدم",
      incorrectLabelAr: "خطأ — انهيار الركبة",
    },
  },
  {
    externalId: "SH-002",
    nameAr: "ضغط كتف دمبل",
    stages: [
      {
        key: "a",
        titleAr: "الدمبلان عند الكتفين",
        shortTitleAr: "الكتفين",
        instructionAr: "الدمبلان عند الكتفين، الأضلاع منخفضة، المعصمان فوق المرفقين، القدمان ثابتتان.",
        breathAr: "شهيق وتثبيت قبل الدفع.",
        cues: [
          { kind: "aim", textAr: "الدمبلان عند الكتفين" },
          { kind: "joint", textAr: "المعصمان فوق المرفقين والأضلاع منخفضة" },
          { kind: "breath", textAr: "شهيق وتثبيت قبل الدفع" },
        ],
      },
      {
        key: "b",
        titleAr: "الدفع فوق الرأس",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع الدمبلين عمودياً حتى فوق الرأس مع إبقاء الرأس والقفص محايدين.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "ادفع عمودياً فوق الرأس" },
          { kind: "joint", textAr: "أبقِ الرأس والقفص محايدين" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الإنزال",
        shortTitleAr: "الإنزال",
        instructionAr: "أنزل الدمبلين حتى منتصف المسار فقط (حوالي مستوى الجبهة).",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الإنزال" },
          { kind: "aim", textAr: "أنزل حتى مستوى الجبهة تقريباً" },
          { kind: "joint", textAr: "أبقِ المسار عمودياً" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "تقوس أسفل الظهر لإكمال الرفعة." },
      { key: "02", descriptionAr: "دفع الدمبلين أمام الوجه بدل الخط العمودي." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع محايد",
      incorrectLabelAr: "خطأ — تقوس أسفل الظهر",
    },
  },
  {
    externalId: "TR-002",
    nameAr: "ترايسيبس حبل",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "قف أمام محطة الكيبل، الكوعان ثابتان بجانب الجذع، الحبل عند مستوى يسمح بثني المرفق دون رفع الكتف.",
        breathAr: "شهيق قبل المد.",
        cues: [
          { kind: "joint", textAr: "الكوعان ثابتان بجانب الجذع" },
          { kind: "aim", textAr: "لا ترفع الكتف مع الحبل" },
          { kind: "breath", textAr: "شهيق قبل المد" },
        ],
      },
      {
        key: "b",
        titleAr: "مد الحبل للأسفل",
        shortTitleAr: "المد",
        instructionAr: "مد المرفقين حتى ينزل الحبل مع فتح طرفيه قليلاً في الأسفل وبقاء العضد ثابتاً.",
        breathAr: "زفير أثناء مد المرفق.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء مد المرفق" },
          { kind: "aim", textAr: "مد حتى ينزل الحبل بالكامل" },
          { kind: "joint", textAr: "أبقِ العضد ثابتاً بجانب الجذع" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "اثنِ المرفقين حتى منتصف العودة فقط.",
        breathAr: "شهيق أثناء العودة.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء العودة" },
          { kind: "aim", textAr: "عد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الكوعين بجانب الجذع" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "فتح المرفقين للخارج بعيداً عن الجذع." },
      { key: "02", descriptionAr: "الميل بالجذع للأمام لإنهاء التكرار." },
    ],
    compare: {
      correctLabelAr: "صحيح — الكوعان بجانب الجذع",
      incorrectLabelAr: "خطأ — فتح المرفقين",
    },
  },
  {
    externalId: "GL-002",
    nameAr: "جسر الأرداف",
    stages: [
      {
        key: "a",
        titleAr: "الاستلقاء والاستعداد",
        shortTitleAr: "البداية",
        instructionAr: "استلقِ على الظهر، القدمان ثابتتان، الرقبة محايدة، الورك منخفض بتحكم.",
        breathAr: "شهيق قبل الدفع.",
        cues: [
          { kind: "joint", textAr: "القدمان ثابتتان والرقبة محايدة" },
          { kind: "aim", textAr: "الورك منخفض بتحكم" },
          { kind: "breath", textAr: "شهيق قبل الدفع" },
        ],
      },
      {
        key: "b",
        titleAr: "دفع الورك للأعلى",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع الورك حتى يصبح الكتف والورك والركبة خطاً تقريباً، مع الضغط عبر القدم كاملة.",
        breathAr: "زفير مع قفل الورك.",
        cues: [
          { kind: "breath", textAr: "ازفر مع قفل الورك" },
          { kind: "aim", textAr: "اجعل الكتف والورك والركبة خطاً واحداً" },
          { kind: "joint", textAr: "اضغط عبر القدم كاملة" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف النزول",
        shortTitleAr: "النزول",
        instructionAr: "أنزل الورك حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء النزول" },
          { kind: "aim", textAr: "انزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الرقبة محايدة" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "تقوس أسفل الظهر بدل قفل الورك." },
      { key: "02", descriptionAr: "عدم إكمال امتداد الورك." },
    ],
    compare: {
      correctLabelAr: "صحيح — قفل ورك نظيف",
      incorrectLabelAr: "خطأ — تقوس أسفل الظهر",
    },
  },
  {
    externalId: "AB-001",
    nameAr: "كرنش",
    stages: [
      {
        key: "a",
        titleAr: "الاستلقاء والاستعداد",
        shortTitleAr: "البداية",
        instructionAr: "استلقِ والركبتان مثنيتان، أسفل الظهر على الأرض، الرقبة محايدة دون سحب الرأس.",
        breathAr: "شهيق هادئ قبل الرفع.",
        cues: [
          { kind: "joint", textAr: "أسفل الظهر على الأرض" },
          { kind: "aim", textAr: "الرقبة محايدة دون سحب الرأس" },
          { kind: "breath", textAr: "شهيق قبل الرفع" },
        ],
      },
      {
        key: "b",
        titleAr: "رفع الكتفين",
        shortTitleAr: "الرفع",
        instructionAr: "ارفع الكتفين عن الأرض بتقريب الضلوع نحو الحوض، مع بقاء أسفل الظهر على الأرض.",
        breathAr: "زفير أثناء الرفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الرفع" },
          { kind: "aim", textAr: "قرّب الضلوع نحو الحوض" },
          { kind: "joint", textAr: "أبقِ أسفل الظهر على الأرض" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف النزول",
        shortTitleAr: "النزول",
        instructionAr: "أنزل الكتفين حتى منتصف المسار فقط؛ الكتفان ما زالا مرتفعين قليلاً.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء النزول" },
          { kind: "aim", textAr: "انزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا تسحب الرقبة باليدين" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "سحب الرقبة باليدين." },
      { key: "02", descriptionAr: "رفع أسفل الظهر عن الأرض." },
    ],
    compare: {
      correctLabelAr: "صحيح — أسفل الظهر ثابت",
      incorrectLabelAr: "خطأ — سحب الرقبة",
    },
  },
  {
    externalId: "CH-006",
    nameAr: "بنش سفلي",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "البار فوق الصدر السفلي، الذراعان ممتدتان، لوحا الكتف متراجعان، القدمان والحوض ثابتان.",
        breathAr: "شهيق وتثبيت الجذع قبل الإنزال.",
        cues: [
          { kind: "aim", textAr: "البار فوق خط الصدر السفلي" },
          { kind: "joint", textAr: "الحوض والقدمان ثابتان" },
          { kind: "breath", textAr: "شهيق وتثبيت قبل الإنزال" },
        ],
      },
      {
        key: "b",
        titleAr: "إنزال البار",
        shortTitleAr: "النزول",
        instructionAr: "أنزل البار بتحكم حتى الصدر السفلي مع بقاء الساعدين قريبين من الوضع العمودي.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "وجّه البار نحو الصدر السفلي" },
          { kind: "joint", textAr: "أبقِ الرسغ فوق المرفق" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الصعود",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع البار حتى منتصف المسافة بين الصدر ووضعية النهاية.",
        breathAr: "زفير أثناء الصعود.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع للأعلى" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الحوض ثابتاً على المقعد" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "رفع الحوض عن المقعد." },
      { key: "02", descriptionAr: "إنزال البار نحو الرقبة." },
    ],
    compare: {
      correctLabelAr: "صحيح — الحوض ثابت",
      incorrectLabelAr: "خطأ — رفع الحوض",
    },
  },
  {
    externalId: "CH-008",
    nameAr: "ضغط دمبل سفلي",
    stages: [
      {
        key: "a",
        titleAr: "الدمبلان فوق الصدر السفلي",
        shortTitleAr: "الاستعداد",
        instructionAr: "الدمبلان فوق الصدر السفلي، الرسغان محايدان، الحوض ثابت على المقعد.",
        breathAr: "شهيق وتثبيت قبل الإنزال.",
        cues: [
          { kind: "aim", textAr: "الدمبلان فوق الصدر السفلي" },
          { kind: "joint", textAr: "الرسغان محايدان والحوض ثابت" },
          { kind: "breath", textAr: "شهيق قبل الإنزال" },
        ],
      },
      {
        key: "b",
        titleAr: "إنزال الدمبلين",
        shortTitleAr: "النزول",
        instructionAr: "أنزل الدمبلين بتحكم حتى جانب الصدر السفلي.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "أنزل حتى جانب الصدر السفلي" },
          { kind: "joint", textAr: "أبقِ الحوض على المقعد" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الصعود",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع الدمبلين حتى منتصف المسار فقط؛ المرفقان ما زالا مثنيين.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الرسغين محايدين" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "رفع الحوض عن المقعد." },
      { key: "02", descriptionAr: "انثناء الرسغين للخلف." },
    ],
    compare: {
      correctLabelAr: "صحيح — الحوض ثابت",
      incorrectLabelAr: "خطأ — رفع الحوض",
    },
  },
  {
    externalId: "CH-009",
    nameAr: "فلاي دمبل",
    stages: [
      {
        key: "a",
        titleAr: "الدمبلان فوق الصدر",
        shortTitleAr: "الاستعداد",
        instructionAr: "الدمبلان فوق الصدر، المرفقان مثنيان قليلاً بزاوية ثابتة.",
        breathAr: "شهيق قبل الفتح.",
        cues: [
          { kind: "aim", textAr: "الدمبلان فوق منتصف الصدر" },
          { kind: "joint", textAr: "أبقِ انحناء المرفق ثابتاً" },
          { kind: "breath", textAr: "شهيق قبل الفتح" },
        ],
      },
      {
        key: "b",
        titleAr: "فتح الذراعين",
        shortTitleAr: "الفتح",
        instructionAr: "افتح الذراعين حتى مستوى الجذع تقريباً مع بقاء زاوية المرفق ثابتة.",
        breathAr: "شهيق أثناء الفتح.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الفتح" },
          { kind: "aim", textAr: "افتح حتى مستوى الجذع تقريباً" },
          { kind: "joint", textAr: "لا تمد المرفقين بالكامل" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الضم",
        shortTitleAr: "الضم",
        instructionAr: "ضم الدمبلين حتى منتصف قوس العودة فقط.",
        breathAr: "زفير أثناء الضم.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الضم" },
          { kind: "aim", textAr: "ضم حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ زاوية المرفق ثابتة" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "فرد المرفقين بالكامل أثناء الفتح." },
      { key: "02", descriptionAr: "إنزال الذراعين أعمق من المدى الآمن." },
    ],
    compare: {
      correctLabelAr: "صحيح — انحناء مرفق ثابت",
      incorrectLabelAr: "خطأ — فرد المرفقين",
    },
  },
  {
    externalId: "CH-011",
    nameAr: "كيبل فلاي سفلي",
    stages: [
      {
        key: "a",
        titleAr: "البكرات المنخفضة",
        shortTitleAr: "الاستعداد",
        instructionAr: "البكرات منخفضة، المقبضان بجانب الوركين، الجذع ثابت.",
        breathAr: "شهيق قبل الرفع.",
        cues: [
          { kind: "aim", textAr: "المقبضان بجانب الوركين" },
          { kind: "joint", textAr: "أبقِ الجذع ثابتاً" },
          { kind: "breath", textAr: "شهيق قبل الرفع" },
        ],
      },
      {
        key: "b",
        titleAr: "رفع المقبضين",
        shortTitleAr: "الضم",
        instructionAr: "ارفع المقبضين حتى يلتقيا أمام الصدر العلوي مع بقاء انحناء خفيف في المرفقين.",
        breathAr: "زفير أثناء الضم.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الضم" },
          { kind: "aim", textAr: "التقِ المقبضين أمام الصدر العلوي" },
          { kind: "joint", textAr: "أبقِ الكتفين منخفضين" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف النزول",
        shortTitleAr: "العودة",
        instructionAr: "أنزل المقبضين للخارج حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء النزول" },
          { kind: "aim", textAr: "انزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا ترفع الكتفين نحو الأذنين" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "رفع الكتفين نحو الأذنين." },
      { key: "02", descriptionAr: "تقاطع اليدين بإفراط أمام الصدر." },
    ],
    compare: {
      correctLabelAr: "صحيح — الكتفان منخفضان",
      incorrectLabelAr: "خطأ — رفع الكتفين",
    },
  },
  {
    externalId: "CH-012",
    nameAr: "جهاز ضغط صدر",
    stages: [
      {
        key: "a",
        titleAr: "المقابض عند منتصف الصدر",
        shortTitleAr: "الاستعداد",
        instructionAr: "الظهر مدعوم على المقعد، المقابض عند منتصف الصدر، الكتفان مستقران.",
        breathAr: "شهيق قبل الدفع.",
        cues: [
          { kind: "aim", textAr: "المقابض عند منتصف الصدر" },
          { kind: "joint", textAr: "الظهر مدعوم والكتفان مستقران" },
          { kind: "breath", textAr: "شهيق قبل الدفع" },
        ],
      },
      {
        key: "b",
        titleAr: "دفع المقابض",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع المقابض للأمام حتى تقترب الذراعان من الامتداد دون قفل قاسٍ.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "ادفع للأمام بتحكم" },
          { kind: "joint", textAr: "أبقِ الكتفين على المقعد" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "أعد المقابض حتى منتصف المسار فقط؛ المرفقان ما زالا أمام الجذع.",
        breathAr: "شهيق أثناء العودة.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء العودة" },
          { kind: "aim", textAr: "عد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا تدور الكتفين للأمام" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "تدوير الكتفين للأمام عن المقعد." },
      { key: "02", descriptionAr: "انخفاض المقعد حتى تصبح المقابض عند الرقبة." },
    ],
    compare: {
      correctLabelAr: "صحيح — الكتفان على المقعد",
      incorrectLabelAr: "خطأ — تدوير الكتفين",
    },
  },
  {
    externalId: "CH-013",
    nameAr: "ضغط ماسة",
    stages: [
      {
        key: "a",
        titleAr: "وضعية اللوح الضيقة",
        shortTitleAr: "اللوح",
        instructionAr: "لوح عالٍ، اليدان متقاربتان بشكل ماسة تحت الصدر، الجسم خطاً واحداً.",
        breathAr: "شهيق هادئ قبل النزول.",
        cues: [
          { kind: "aim", textAr: "اليدان متقاربتان تحت الصدر" },
          { kind: "joint", textAr: "الجسم خطاً واحداً من الرأس إلى الكعبين" },
          { kind: "breath", textAr: "شهيق قبل النزول" },
        ],
      },
      {
        key: "b",
        titleAr: "النزول نحو اليدين",
        shortTitleAr: "النزول",
        instructionAr: "اثنِ المرفقين بجانب الجذع حتى يقترب الصدر من اليدين.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "قرّب الصدر من اليدين بتحكم" },
          { kind: "joint", textAr: "أبقِ المرفقين قريبين من الجذع" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الدفع",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع للأعلى حتى منتصف المسار فقط: المرفقان ما زالا مثنيين بوضوح.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الحوض على خط الجسم" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "ترهل الحوض تحت خط الجسم." },
      { key: "02", descriptionAr: "فتح المرفقين للخارج بعيداً عن الجذع." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجسم خطاً واحداً",
      incorrectLabelAr: "خطأ — ترهل الحوض",
    },
  },
  {
    externalId: "CH-014",
    nameAr: "دِبّ صدر",
    stages: [
      {
        key: "a",
        titleAr: "الدعم على المتوازي",
        shortTitleAr: "الاستعداد",
        instructionAr: "ادعم الجسم على المتوازي مع ميل خفيف للأمام، الكتفان بعيدان عن الأذنين.",
        breathAr: "شهيق قبل النزول.",
        cues: [
          { kind: "aim", textAr: "ميل خفيف للأمام على المتوازي" },
          { kind: "joint", textAr: "أبقِ الكتفين بعيدين عن الأذنين" },
          { kind: "breath", textAr: "شهيق قبل النزول" },
        ],
      },
      {
        key: "b",
        titleAr: "النزول العميق",
        shortTitleAr: "النزول",
        instructionAr: "انزل بتحكم حتى مدى آمن مع بقاء الميل للأمام.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "انزل بتحكم ضمن المدى الآمن" },
          { kind: "joint", textAr: "لا تدع الكتفين ينهاران للأعلى" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الدفع",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع حتى منتصف المسار فقط؛ المرفقان ما زالا مثنيين.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "حافظ على الميل الخفيف للأمام" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "انهيار الكتفين للأعلى نحو الأذنين." },
      { key: "02", descriptionAr: "إبقاء الجذع عمودياً بإفراط." },
    ],
    compare: {
      correctLabelAr: "صحيح — ميل خفيف للأمام",
      incorrectLabelAr: "خطأ — انهيار الكتفين",
    },
  },
  {
    externalId: "BA-003",
    nameAr: "سحب عريض",
    stages: [
      {
        key: "a",
        titleAr: "التعليق العريض",
        shortTitleAr: "التعليق",
        instructionAr: "تعليق عريض فوق اليد، الكتفان نشطان، الرقبة محايدة، الجسم هادئ.",
        breathAr: "شهيق في التعليق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "تعليق عريض والكتفان نشطان" },
          { kind: "aim", textAr: "الرقبة محايدة والجسم هادئ" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "السحب للأعلى",
        shortTitleAr: "السحب",
        instructionAr: "اسحب حتى يقترب أعلى الصدر من العارضة دون أرجحة ودون مد الرقبة.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "قرّب أعلى الصدر من العارضة" },
          { kind: "joint", textAr: "أبقِ الرقبة محايدة دون أرجحة" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف النزول",
        shortTitleAr: "النزول",
        instructionAr: "انزل بتحكم حتى منتصف المسار فقط؛ المرفقان ما زالا مثنيين.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء النزول" },
          { kind: "aim", textAr: "انزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ المرفقين مثنيين بوضوح" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "أرجحة الجسم للوصول إلى العارضة." },
      { key: "02", descriptionAr: "نطاق حركة ناقص في الأعلى." },
    ],
    compare: {
      correctLabelAr: "صحيح — جسم هادئ",
      incorrectLabelAr: "خطأ — أرجحة الجسم",
    },
  },
  {
    externalId: "BA-004",
    nameAr: "سحب قبضة محايدة",
    stages: [
      {
        key: "a",
        titleAr: "التعليق المحايد",
        shortTitleAr: "التعليق",
        instructionAr: "تعليق بقبضة محايدة، الكتفان نشطان، الرقبة محايدة.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "قبضة محايدة والكتفان نشطان" },
          { kind: "aim", textAr: "الرقبة محايدة" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "السحب للأعلى",
        shortTitleAr: "السحب",
        instructionAr: "اسحب حتى تصل الذقن إلى مستوى المقبض دون مد الرأس للأمام.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "أوصل الذقن إلى مستوى المقبض" },
          { kind: "joint", textAr: "لا تمد الرأس للأمام" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف النزول",
        shortTitleAr: "النزول",
        instructionAr: "انزل حتى منتصف المسار فقط؛ المرفقان ما زالا مثنيين.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء النزول" },
          { kind: "aim", textAr: "انزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الكتفين نشطين لا هابطين" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "هبوط الكتفين السلبي في التعليق." },
      { key: "02", descriptionAr: "مد الرأس للأمام لإنهاء التكرار." },
    ],
    compare: {
      correctLabelAr: "صحيح — رقبة محايدة",
      incorrectLabelAr: "خطأ — مد الرأس للأمام",
    },
  },
  {
    externalId: "BA-005",
    nameAr: "سحب عالي بمساعدة",
    stages: [
      {
        key: "a",
        titleAr: "التعليق المستقر",
        shortTitleAr: "التعليق",
        instructionAr: "تعليق مستقر على جهاز المساعدة، الكتفان نشطان، الجسم هادئ.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "تعليق مستقر والكتفان نشطان" },
          { kind: "aim", textAr: "الجسم هادئ دون ارتداد" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "السحب للأعلى",
        shortTitleAr: "السحب",
        instructionAr: "اسحب حتى تصل الذقن إلى مستوى العارضة دون ارتداد على وسادة المساعدة.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "أوصل الذقن إلى العارضة" },
          { kind: "joint", textAr: "لا ترتد على وسادة المساعدة" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف النزول",
        shortTitleAr: "النزول",
        instructionAr: "انزل بتحكم حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء النزول" },
          { kind: "aim", textAr: "انزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الكتفين مفتوحين في الأعلى لا مدوّرين" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "الارتداد على وسادة المساعدة." },
      { key: "02", descriptionAr: "تدوير الكتفين في أعلى السحبة." },
    ],
    compare: {
      correctLabelAr: "صحيح — سحب مستقر",
      incorrectLabelAr: "خطأ — ارتداد على الوسادة",
    },
  },
  {
    externalId: "BA-008",
    nameAr: "سحب لات ضيق",
    stages: [
      {
        key: "a",
        titleAr: "المقبض الضيق",
        shortTitleAr: "الاستعداد",
        instructionAr: "مقبض ضيق محايد، الصدر مرفوع، الذراعان ممتدتان.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "aim", textAr: "مقبض ضيق والصدر مرفوع" },
          { kind: "joint", textAr: "ذراعان ممتدتان دون رفع الكتف" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب المقبض",
        shortTitleAr: "السحب",
        instructionAr: "اسحب المقبض نحو أعلى الصدر مع الكوعين للأسفل.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "أوصل المقبض إلى أعلى الصدر" },
          { kind: "joint", textAr: "أبقِ الرسغين محايدين" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "مد الذراعين حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء المد.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء المد" },
          { kind: "aim", textAr: "مد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا ترفع الكتفين نحو الأذنين" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "ثني الرسغين نحو الصدر أثناء السحب." },
      { key: "02", descriptionAr: "رفع الكتفين بدل سحب الكوع." },
    ],
    compare: {
      correctLabelAr: "صحيح — رسغ محايد",
      incorrectLabelAr: "خطأ — ثني الرسغين",
    },
  },
  {
    externalId: "BA-011",
    nameAr: "بيندلاي روو",
    stages: [
      {
        key: "a",
        titleAr: "البار على الأرض",
        shortTitleAr: "الاستعداد",
        instructionAr: "الجذع قريب من الأفقية، البار على الأرض، الظهر محايد.",
        breathAr: "شهيق وتثبيت قبل السحب.",
        cues: [
          { kind: "joint", textAr: "الجذع قريب من الأفقية والظهر محايد" },
          { kind: "aim", textAr: "البار ساكن على الأرض" },
          { kind: "breath", textAr: "شهيق وتثبيت قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب البار",
        shortTitleAr: "السحب",
        instructionAr: "اسحب البار نحو أسفل الصدر مع بقاء زاوية الجذع ثابتة.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب البار نحو أسفل الصدر" },
          { kind: "joint", textAr: "أبقِ الجذع ثابتاً دون رفعه" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "أنزل البار حتى منتصف المسار فقط قبل أن يلمس الأرض.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الإنزال" },
          { kind: "aim", textAr: "أنزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ أسفل الظهر محايداً" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "رفع الجذع فجأة لإكمال السحبة." },
      { key: "02", descriptionAr: "تدوير أسفل الظهر أثناء السحب." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع ثابت",
      incorrectLabelAr: "خطأ — رفع الجذع",
    },
  },
  {
    externalId: "BA-012",
    nameAr: "تي بار روو",
    stages: [
      {
        key: "a",
        titleAr: "الانحناء المستعد",
        shortTitleAr: "الاستعداد",
        instructionAr: "انحنِ من الورك، الظهر محايد، الذراعان ممتدتان على المقبض.",
        breathAr: "شهيق وتثبيت قبل السحب.",
        cues: [
          { kind: "joint", textAr: "انحنِ من الورك والظهر محايد" },
          { kind: "aim", textAr: "ذراعان ممتدتان على المقبض" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب المقبض",
        shortTitleAr: "السحب",
        instructionAr: "اسحب المقبض نحو أسفل الصدر دون رفع الجذع.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب المقبض نحو أسفل الصدر" },
          { kind: "joint", textAr: "أبقِ الجذع دون نفض للأعلى" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "مد الذراعين حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء المد.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء المد" },
          { kind: "aim", textAr: "مد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ أسفل الظهر محايداً" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "تدوير أسفل الظهر أثناء السحب." },
      { key: "02", descriptionAr: "نفض الجذع للأعلى لإكمال السحبة." },
    ],
    compare: {
      correctLabelAr: "صحيح — الظهر محايد",
      incorrectLabelAr: "خطأ — تدوير أسفل الظهر",
    },
  },
  {
    externalId: "BA-013",
    nameAr: "روو دمبل منحني",
    stages: [
      {
        key: "a",
        titleAr: "وضعية الانحناء",
        shortTitleAr: "الاستعداد",
        instructionAr: "انحنِ من الورك، الدمبلان معلّقان، الظهر مستوٍ.",
        breathAr: "شهيق وتثبيت قبل السحب.",
        cues: [
          { kind: "joint", textAr: "انحنِ من الورك والظهر مستوٍ" },
          { kind: "aim", textAr: "الدمبلان معلّقان تحت الكتفين" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب الدمبلين",
        shortTitleAr: "السحب",
        instructionAr: "اسحب الدمبلين نحو أسفل القفص دون أرجحة الجذع.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب نحو أسفل القفص" },
          { kind: "joint", textAr: "أبقِ الجذع دون ارتداد" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "أنزل الدمبلين حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الإنزال" },
          { kind: "aim", textAr: "أنزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا ترفع الكتفين بدل الكوع" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "ارتداد الجذع للأعلى لإنهاء التكرار." },
      { key: "02", descriptionAr: "رفع الكتفين بدل سحب الكوع." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع ثابت",
      incorrectLabelAr: "خطأ — ارتداد الجذع",
    },
  },
  {
    externalId: "BA-014",
    nameAr: "روو دمبل بيد واحدة",
    stages: [
      {
        key: "a",
        titleAr: "الدعم على المقعد",
        shortTitleAr: "الاستعداد",
        instructionAr: "اليد والركبة على المقعد، العمود الفقري مستوٍ، الدمبل معلّق.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "العمود الفقري مستوٍ على المقعد" },
          { kind: "aim", textAr: "الدمبل معلّق تحت الكتف" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب الدمبل",
        shortTitleAr: "السحب",
        instructionAr: "اسحب الدمبل نحو الورك مع بقاء الجذع دون دوران.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب الدمبل نحو الورك" },
          { kind: "joint", textAr: "أبقِ الجذع دون فتح للخارج" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "أنزل الدمبل حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الإنزال" },
          { kind: "aim", textAr: "أنزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا تدع الكتف العامل يهبط" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "دوران الجذع للخارج أثناء السحب." },
      { key: "02", descriptionAr: "هبوط الكتف العامل مع الدمبل." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع مربع",
      incorrectLabelAr: "خطأ — دوران الجذع",
    },
  },
  {
    externalId: "BA-015",
    nameAr: "روو كيبل بيد واحدة",
    stages: [
      {
        key: "a",
        titleAr: "الذراع الممتدة",
        shortTitleAr: "الاستعداد",
        instructionAr: "الجذع مربع، ذراع واحدة ممتدة نحو البكرة، الكتف مستقر.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "aim", textAr: "الجذع مربع والذراع ممتدة" },
          { kind: "joint", textAr: "أبقِ الكتف مستقراً لا مرفوعاً" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب المقبض",
        shortTitleAr: "السحب",
        instructionAr: "اسحب المقبض نحو أضلاع نفس الجانب دون دوران الجذع للخلف.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب نحو أضلاع نفس الجانب" },
          { kind: "joint", textAr: "لا تلف الجذع للخلف" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "مد الذراع حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء المد.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء المد" },
          { kind: "aim", textAr: "مد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "لا ترفع الكتف نحو الأذن" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "دوران الجذع للخلف أثناء السحب." },
      { key: "02", descriptionAr: "رفع الكتف نحو الأذن." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع مربع",
      incorrectLabelAr: "خطأ — دوران الجذع",
    },
  },
  {
    externalId: "BA-017",
    nameAr: "روو بصدر مدعوم",
    stages: [
      {
        key: "a",
        titleAr: "الصدر على الوسادة",
        shortTitleAr: "الاستعداد",
        instructionAr: "الصدر مدعوم على الوسادة، الدمبلان معلّقان، الرقبة محايدة.",
        breathAr: "شهيق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "الصدر ثابت على الوسادة" },
          { kind: "aim", textAr: "الدمبلان معلّقان والرقبة محايدة" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب الدمبلين",
        shortTitleAr: "السحب",
        instructionAr: "اسحب الدمبلين نحو الأضلاع مع بقاء الصدر على الوسادة والكوعين قريبين.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب نحو الأضلاع" },
          { kind: "joint", textAr: "أبقِ الصدر على الوسادة" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "أنزل الدمبلين حتى منتصف المسار فقط.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء الإنزال" },
          { kind: "aim", textAr: "أنزل حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الكوعين دون فتح مفرط" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "رفع الصدر عن الوسادة أثناء السحب." },
      { key: "02", descriptionAr: "فتح المرفقين للخارج بإفراط." },
    ],
    compare: {
      correctLabelAr: "صحيح — الصدر على الوسادة",
      incorrectLabelAr: "خطأ — رفع الصدر",
    },
  },
];
