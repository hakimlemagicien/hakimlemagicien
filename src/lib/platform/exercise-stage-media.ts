/**
 * Local still-image explainer for the Training Media Pilot.
 * Public URLs — no Storage, no video-path change.
 */

import { EXERCISE_STAGE_BATCH_GUIDE_DRAFTS } from "./exercise-stage-batch-guides";

export const EXERCISE_STAGE_PILOT_EXTERNAL_IDS = [
  "CH-004",
  "CH-001",
  "LE-001",
  "BA-023",
  "GL-001",
  "BA-010",
  "SH-001",
  "BA-001",
  "BI-002",
  "TR-001",
  "CH-007",
  "CH-010",
  "BI-003",
  "BA-006",
  "LE-004",
  "LE-006",
  "SH-002",
  "TR-002",
  "GL-002",
  "AB-001",
  "CH-006",
  "CH-008",
  "CH-009",
  "CH-011",
  "CH-012",
  "CH-013",
  "CH-014",
  "BA-003",
  "BA-004",
  "BA-005",
  "BA-008",
  "BA-011",
  "BA-012",
  "BA-013",
  "BA-014",
  "BA-015",
  "BA-017",
] as const;

export type ExerciseStagePilotExternalId = (typeof EXERCISE_STAGE_PILOT_EXTERNAL_IDS)[number];
export type ExerciseStageKey = "a" | "b" | "c";
export type ExerciseMistakeKey = "01" | "02";
export type ExerciseStagePilotStatus = "PILOT_APP_TEST";

export type ExerciseStageCueKind = "breath" | "aim" | "joint";

export type ExerciseStageCue = {
  kind: ExerciseStageCueKind;
  textAr: string;
};

export type ExerciseStageAsset = {
  key: ExerciseStageKey;
  titleAr: string;
  shortTitleAr: string;
  instructionAr: string;
  breathAr: string;
  cues: readonly ExerciseStageCue[];
  src: string;
  thumbSrc: string;
  alt: string;
};

export type ExerciseMistakeAsset = {
  key: ExerciseMistakeKey;
  titleAr: string;
  descriptionAr: string;
  src: string;
  thumbSrc: string;
  alt: string;
};

export type ExerciseStageGuide = {
  externalId: ExerciseStagePilotExternalId;
  nameAr: string;
  status: ExerciseStagePilotStatus;
  stages: readonly [ExerciseStageAsset, ExerciseStageAsset, ExerciseStageAsset];
  mistakes: readonly [ExerciseMistakeAsset, ExerciseMistakeAsset];
  compare: {
    correctLabelAr: string;
    incorrectLabelAr: string;
  };
};

const STAGE_DETAIL_WIDTH = 960;
const STAGE_DETAIL_HEIGHT = 720;
const STAGE_THUMB_WIDTH = 256;
const STAGE_THUMB_HEIGHT = 192;

function stagePaths(externalId: string, name: `stage-${ExerciseStageKey}`) {
  return {
    src: `/exercises/${externalId}/stages/${name}.webp`,
    thumbSrc: `/exercises/${externalId}/stages/${name}-thumb.webp`,
  };
}

function mistakePaths(externalId: string, name: `mistake-${ExerciseMistakeKey}`) {
  return {
    src: `/exercises/${externalId}/mistakes/${name}.webp`,
    thumbSrc: `/exercises/${externalId}/mistakes/${name}-thumb.webp`,
  };
}

type StageDraft = Omit<ExerciseStageAsset, "src" | "thumbSrc" | "alt">;
type MistakeDraft = Pick<ExerciseMistakeAsset, "key" | "descriptionAr">;

function buildGuide(input: {
  externalId: ExerciseStagePilotExternalId;
  nameAr: string;
  stages: readonly [StageDraft, StageDraft, StageDraft];
  mistakes: readonly [MistakeDraft, MistakeDraft];
  compare: ExerciseStageGuide["compare"];
}): ExerciseStageGuide {
  return {
    externalId: input.externalId,
    nameAr: input.nameAr,
    status: "PILOT_APP_TEST",
    stages: input.stages.map((stage) => ({
      ...stage,
      alt: `${input.nameAr} — ${stage.titleAr}`,
      ...stagePaths(input.externalId, `stage-${stage.key}`),
    })) as ExerciseStageGuide["stages"],
    mistakes: input.mistakes.map((mistake) => ({
      key: mistake.key,
      titleAr: "خطأ شائع",
      descriptionAr: mistake.descriptionAr,
      alt: `${input.nameAr} — خطأ: ${mistake.descriptionAr.replace(/[.]/g, "")}`,
      ...mistakePaths(input.externalId, `mistake-${mistake.key}`),
    })) as ExerciseStageGuide["mistakes"],
    compare: input.compare,
  };
}

const CORE_GUIDES = {
  "CH-004": buildGuide({
    externalId: "CH-004",
    nameAr: "ضغط",
    stages: [
      {
        key: "a",
        titleAr: "وضعية اللوح",
        shortTitleAr: "اللوح",
        instructionAr: "يدان بعرض الكتفين تقريباً، الجسم خطاً واحداً من الرأس إلى الكعبين، نظر للأسفل قليلاً.",
        breathAr: "شهيق هادئ قبل البدء.",
        cues: [
          { kind: "joint", textAr: "الجسم خطاً واحداً من الرأس إلى الكعبين" },
          { kind: "aim", textAr: "اليدان بعرض الكتفين تقريباً" },
          { kind: "breath", textAr: "شهيق هادئ قبل النزول" },
        ],
      },
      {
        key: "b",
        titleAr: "النزول نحو الأرض",
        shortTitleAr: "النزول",
        instructionAr: "اثنِ المرفقين بتحكم حتى يقترب الصدر من الأرض مع بقاء الجسم مستقيماً.",
        breathAr: "شهيق أثناء النزول.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "قرّب الصدر من الأرض بتحكم" },
          { kind: "joint", textAr: "أبقِ الجسم مستقيماً دون ترهل" },
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
          { kind: "joint", textAr: "أبقِ المرفقين مثنيين بوضوح" },
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
  }),
  "CH-001": buildGuide({
    externalId: "CH-001",
    nameAr: "بنش برس",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr:
          "البار فوق خط مفصل الكتفين تقريباً، الذراعان ممتدتان، الرسغان محايدان، لوحا الكتف متراجعان، القدمان والحوض ثابتان.",
        breathAr: "شهيق وتثبيت الجذع قبل الإنزال.",
        cues: [
          { kind: "joint", textAr: "ثبّت لوحَي الكتف والقدمين على المقعد" },
          { kind: "aim", textAr: "البار فوق خط مفصل الكتفين" },
          { kind: "breath", textAr: "شهيق وتثبيت الجذع قبل الإنزال" },
        ],
      },
      {
        key: "b",
        titleAr: "إنزال البار",
        shortTitleAr: "النزول",
        instructionAr:
          "أنزل البار بتحكم حتى منتصف/أسفل الصدر. الساعدان قريبان من الوضع العمودي، الرسغان فوق المرفقين، الحوض ثابت على المقعد.",
        breathAr: "شهيق أثناء الإنزال.",
        cues: [
          { kind: "breath", textAr: "خذ شهيقاً أثناء النزول" },
          { kind: "aim", textAr: "وجّه البار نحو منتصف الصدر" },
          { kind: "joint", textAr: "أبقِ الرسغ فوق المرفق" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الصعود",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع البار حتى منتصف المسافة بين الصدر ووضعية النهاية. اتجاه العودة نحو خط الكتفين.",
        breathAr: "زفير أثناء الصعود.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع للأعلى" },
          { kind: "aim", textAr: "ادفع باتجاه خط الكتفين" },
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
  }),
  "LE-001": buildGuide({
    externalId: "LE-001",
    nameAr: "سكوات خلفي",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "البار على أعلى الظهر، القدمان ثابتتان بعرض مناسب، الصدر مرفوع، الركبتان غير مقفلتين بقسوة.",
        breathAr: "شهيق وتثبيت الجذع قبل النزول.",
        cues: [
          { kind: "joint", textAr: "ثبّت القدمين بعرض مناسب" },
          { kind: "aim", textAr: "أبقِ الصدر مرفوعاً" },
          { kind: "breath", textAr: "شهيق وتثبيت الجذع قبل النزول" },
        ],
      },
      {
        key: "b",
        titleAr: "النزول إلى القرفصاء",
        shortTitleAr: "النزول",
        instructionAr: "انزل حتى يصل الورك تقريباً إلى مستوى الركبة ضمن المدى الآمن، مع بقاء منتصف القدم مركز الضغط.",
        breathAr: "الحفاظ على التثبيت أثناء النزول.",
        cues: [
          { kind: "aim", textAr: "انزل حتى يقترب الورك من مستوى الركبة" },
          { kind: "joint", textAr: "أبقِ منتصف القدم مركز الضغط" },
          { kind: "breath", textAr: "حافظ على تثبيت الجذع أثناء النزول" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الصعود",
        shortTitleAr: "الصعود",
        instructionAr: "اصعد بالضغط عبر القدم كاملة مع ثبات منتصف القدم حتى منتصف المسار فقط (الركبتان ما زالتا مثنيتين).",
        breathAr: "زفير أثناء الصعود.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الصعود" },
          { kind: "aim", textAr: "اصعد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "اضغط عبر القدم كاملة" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "انهيار الركبتين للداخل." },
      { key: "02", descriptionAr: "انتقال مركز الضغط بعيداً عن منتصف القدم." },
    ],
    compare: {
      correctLabelAr: "صحيح — الركبتان فوق القدمين",
      incorrectLabelAr: "خطأ — انهيار الركبتين",
    },
  }),
  "BA-023": buildGuide({
    externalId: "BA-023",
    nameAr: "ديدليفت روماني",
    stages: [
      {
        key: "a",
        titleAr: "الوقوف مع البار",
        shortTitleAr: "الوقوف",
        instructionAr: "قف والبار قريب من الفخذين، الظهر محايد، الركبتان لينتان قليلاً.",
        breathAr: "شهيق وتثبيت الجذع.",
        cues: [
          { kind: "aim", textAr: "أبقِ البار قريباً من الفخذين" },
          { kind: "joint", textAr: "الظهر محايد والركبتان لينتان قليلاً" },
          { kind: "breath", textAr: "شهيق وتثبيت الجذع" },
        ],
      },
      {
        key: "b",
        titleAr: "الانحناء من الورك",
        shortTitleAr: "الانحناء",
        instructionAr: "ادفع الورك للخلف مع بقاء البار ملاصقاً للساقين حتى تمدد خلفي واضح دون تدوير الظهر.",
        breathAr: "الحفاظ على التثبيت أثناء الانحناء.",
        cues: [
          { kind: "aim", textAr: "ادفع الورك للخلف لا للأسفل فقط" },
          { kind: "joint", textAr: "أبقِ الظهر مستقيماً والبار ملاصقاً" },
          { kind: "breath", textAr: "حافظ على تثبيت الجذع أثناء الانحناء" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "مد الورك حتى منتصف العودة فقط؛ الجذع ما زال مائلاً بوضوح.",
        breathAr: "زفير أثناء مد الورك.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء مد الورك" },
          { kind: "aim", textAr: "عد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ الجذع مائلاً بوضوح" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "تدوير أسفل الظهر أثناء الانحناء." },
      { key: "02", descriptionAr: "ابتعاد البار عن الساقين." },
    ],
    compare: {
      correctLabelAr: "صحيح — الظهر محايد",
      incorrectLabelAr: "خطأ — تدوير أسفل الظهر",
    },
  }),
  "GL-001": buildGuide({
    externalId: "GL-001",
    nameAr: "هيب ثراست",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية على المقعد",
        shortTitleAr: "البداية",
        instructionAr: "لوح الكتف على حافة المقعد، الرقبة محايدة، القدمان ثابتتان، البار فوق الورك، الورك منخفض بتحكم.",
        breathAr: "شهيق قبل الدفع.",
        cues: [
          { kind: "joint", textAr: "لوح الكتف على حافة المقعد" },
          { kind: "aim", textAr: "البار فوق الورك والرقبة محايدة" },
          { kind: "breath", textAr: "شهيق قبل الدفع" },
        ],
      },
      {
        key: "b",
        titleAr: "دفع الورك للأعلى",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع الورك حتى يصبح الكتف والورك والركبة خطاً تقريباً، مع الضغط عبر القدم كاملة لا عبر الرقبة.",
        breathAr: "زفير مع قفل الورك.",
        cues: [
          { kind: "breath", textAr: "ازفر مع قفل الورك" },
          { kind: "aim", textAr: "اجعل الكتف والورك والركبة خطاً واحداً" },
          { kind: "joint", textAr: "اضغط عبر القدم كاملة لا عبر الرقبة" },
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
  }),
  "BA-010": buildGuide({
    externalId: "BA-010",
    nameAr: "روو بالبار",
    stages: [
      {
        key: "a",
        titleAr: "وضعية الانحناء المستعدة",
        shortTitleAr: "الاستعداد",
        instructionAr: "انحنِ من الورك، الظهر مستوٍ، البار معلّق تحت الكتفين وذراعان ممتدتان.",
        breathAr: "شهيق وتثبيت قبل السحب.",
        cues: [
          { kind: "joint", textAr: "انحنِ من الورك والظهر مستوٍ" },
          { kind: "aim", textAr: "البار معلّق تحت الكتفين" },
          { kind: "breath", textAr: "شهيق وتثبيت قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "سحب البار",
        shortTitleAr: "السحب",
        instructionAr: "اسحب البار نحو أسفل القفص مع الكوعين قريبين، دون رفع الجذع.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "اسحب البار نحو أسفل القفص" },
          { kind: "joint", textAr: "أبقِ الكوعين قريبين دون رفع الجذع" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف العودة",
        shortTitleAr: "العودة",
        instructionAr: "مد الذراعين حتى منتصف المسار فقط مع ثبات زاوية الجذع.",
        breathAr: "شهيق أثناء المد.",
        cues: [
          { kind: "breath", textAr: "شهيق أثناء المد" },
          { kind: "aim", textAr: "مد حتى منتصف المسار فقط" },
          { kind: "joint", textAr: "أبقِ زاوية الجذع ثابتة" },
        ],
      },
    ],
    mistakes: [
      { key: "01", descriptionAr: "رفع الجذع بالزخم لإكمال السحبة." },
      { key: "02", descriptionAr: "رفع الكتفين بدل سحب الكوع." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع ثابت",
      incorrectLabelAr: "خطأ — رفع الجذع بالزخم",
    },
  }),
  "SH-001": buildGuide({
    externalId: "SH-001",
    nameAr: "ضغط فوق الرأس",
    stages: [
      {
        key: "a",
        titleAr: "البار على الكتفين",
        shortTitleAr: "الكتفين",
        instructionAr: "البار على الكتفين الأماميين، الأضلاع منخفضة، المعصمان فوق المرفقين، القدمان ثابتتان.",
        breathAr: "شهيق وتثبيت قبل الدفع.",
        cues: [
          { kind: "aim", textAr: "البار على الكتفين الأماميين" },
          { kind: "joint", textAr: "المعصمان فوق المرفقين والأضلاع منخفضة" },
          { kind: "breath", textAr: "شهيق وتثبيت قبل الدفع" },
        ],
      },
      {
        key: "b",
        titleAr: "الدفع فوق الرأس",
        shortTitleAr: "الدفع",
        instructionAr: "ادفع البار عمودياً حتى فوق الرأس مع إبقاء الرأس والقفص محايدين.",
        breathAr: "زفير أثناء الدفع.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء الدفع" },
          { kind: "aim", textAr: "ادفع البار عمودياً فوق الرأس" },
          { kind: "joint", textAr: "أبقِ الرأس والقفص محايدين" },
        ],
      },
      {
        key: "c",
        titleAr: "منتصف الإنزال",
        shortTitleAr: "الإنزال",
        instructionAr: "أنزل البار حتى منتصف المسار فقط (حوالي مستوى الجبهة).",
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
      { key: "02", descriptionAr: "دفع البار أمام الوجه بدل الخط العمودي." },
    ],
    compare: {
      correctLabelAr: "صحيح — الجذع محايد",
      incorrectLabelAr: "خطأ — تقوس أسفل الظهر",
    },
  }),
  "BA-001": buildGuide({
    externalId: "BA-001",
    nameAr: "سحب عالي",
    stages: [
      {
        key: "a",
        titleAr: "التعليق والاستعداد",
        shortTitleAr: "التعليق",
        instructionAr: "تعليق كامل، الكتفان نشطان، الرقبة محايدة، الجسم هادئ، القبضة ثابتة.",
        breathAr: "شهيق في التعليق قبل السحب.",
        cues: [
          { kind: "joint", textAr: "تعليق كامل والكتفان نشطان" },
          { kind: "aim", textAr: "الرقبة محايدة والجسم هادئ" },
          { kind: "breath", textAr: "شهيق قبل السحب" },
        ],
      },
      {
        key: "b",
        titleAr: "السحب للأعلى",
        shortTitleAr: "السحب",
        instructionAr: "اسحب حتى تصل الذقن إلى مستوى العارضة، مع تجاوز طفيف مسموح دون مد الرقبة ودون أرجحة.",
        breathAr: "زفير أثناء السحب.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء السحب" },
          { kind: "aim", textAr: "أوصل الذقن إلى مستوى العارضة" },
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
  }),
  "BI-002": buildGuide({
    externalId: "BI-002",
    nameAr: "بايسيبس دمبل",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "قف ثابتاً، الدمبلان بجانب الفخذين، الكوعان ملاصقان للجذع.",
        breathAr: "شهيق هادئ قبل الرفع.",
        cues: [
          { kind: "joint", textAr: "الكوعان ملاصقان للجذع" },
          { kind: "aim", textAr: "الدمبلان بجانب الفخذين" },
          { kind: "breath", textAr: "شهيق هادئ قبل الرفع" },
        ],
      },
      {
        key: "b",
        titleAr: "رفع الدمبل",
        shortTitleAr: "الرفع",
        instructionAr: "اثنِ المرفقين لرفع الدمبلين دون أرجحة الجذع ودون تحريك الكوع للأمام.",
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
  }),
  "TR-001": buildGuide({
    externalId: "TR-001",
    nameAr: "ترايسيبس بول داون",
    stages: [
      {
        key: "a",
        titleAr: "وضعية البداية",
        shortTitleAr: "الاستعداد",
        instructionAr: "قف أمام محطة الكيبل، الكوعان ثابتان بجانب الجذع، المقبض عند مستوى يسمح بثني المرفق دون رفع الكتف.",
        breathAr: "شهيق قبل المد.",
        cues: [
          { kind: "joint", textAr: "الكوعان ثابتان بجانب الجذع" },
          { kind: "aim", textAr: "لا ترفع الكتف مع المقبض" },
          { kind: "breath", textAr: "شهيق قبل المد" },
        ],
      },
      {
        key: "b",
        titleAr: "مد الذراع للأسفل",
        shortTitleAr: "المد",
        instructionAr: "مد المرفقين حتى ينزل المقبض مع بقاء العضد ثابتاً.",
        breathAr: "زفير أثناء مد المرفق.",
        cues: [
          { kind: "breath", textAr: "ازفر أثناء مد المرفق" },
          { kind: "aim", textAr: "مد حتى ينزل المقبض بالكامل" },
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
  }),
};

const PILOT_GUIDES = {
  ...CORE_GUIDES,
  ...Object.fromEntries(
    EXERCISE_STAGE_BATCH_GUIDE_DRAFTS.map((draft) => [
      draft.externalId,
      buildGuide({
        ...draft,
        externalId: draft.externalId as ExerciseStagePilotExternalId,
      }),
    ]),
  ),
} as Record<ExerciseStagePilotExternalId, ExerciseStageGuide>;

export const EXERCISE_STAGE_IMAGE_SIZE = {
  detail: { width: STAGE_DETAIL_WIDTH, height: STAGE_DETAIL_HEIGHT },
  thumb: { width: STAGE_THUMB_WIDTH, height: STAGE_THUMB_HEIGHT },
} as const;

export function isExerciseStagePilotId(externalId: string): externalId is ExerciseStagePilotExternalId {
  return (EXERCISE_STAGE_PILOT_EXTERNAL_IDS as readonly string[]).includes(externalId);
}

export function getExerciseStageGuide(externalId: string): ExerciseStageGuide | null {
  if (!isExerciseStagePilotId(externalId)) return null;
  return PILOT_GUIDES[externalId];
}

/** Cover / list thumbnail uses PRIMARY_ACTION (B), not the start lockout. */
export const EXERCISE_STAGE_COVER_KEY: ExerciseStageKey = "b";

export function getExerciseStageCover(externalId: string) {
  const guide = getExerciseStageGuide(externalId);
  return guide?.stages.find((stage) => stage.key === EXERCISE_STAGE_COVER_KEY) ?? null;
}

export function getExerciseStageListThumb(externalId: string): string | null {
  return getExerciseStageCover(externalId)?.thumbSrc ?? null;
}

export function listExerciseStagePublicFiles(guide: ExerciseStageGuide): string[] {
  return [
    ...guide.stages.flatMap((stage) => [stage.src, stage.thumbSrc]),
    ...guide.mistakes.flatMap((mistake) => [mistake.src, mistake.thumbSrc]),
  ];
}
