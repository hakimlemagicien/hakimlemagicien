/**
 * V1 product copy — single source for Free personalized preview vs Paid full program.
 */
export const TRAINING_PRODUCT_COPY = {
  freePreviewBadge: "معاينة مجانية — برنامجك الشخصي",
  paidActiveBadge: "برنامجك مفعّل بالكامل",
  upgradeCta: "اشترك لفتح برنامجك بالكامل",
  freePreviewFooter: (totalExercises: number) =>
    `تمرين واحد متاح اليوم من أصل ${totalExercises} في برنامجك الشخصي — اشترك لفتح الحصة كاملة.`,
  freePreviewOtherDay:
    "محتوى هذا اليوم للمعاينة فقط — انتقل ليوم اليوم لتمرينك المجاني أو اشترك لفتح الأسبوع.",
  freePreviewLoadingTitle: "جاري تجهيز برنامجك الشخصي…",
  freePreviewLoadingBody: "ستظهر حصتك كاملة — تمرين واحد فقط متاح يومياً في المعاينة المجانية.",
  completeProfileTitle: "أكمل ملفك لعرض برنامجك",
  completeProfileBody:
    "برنامجك الشخصي يُبنى من بياناتك (الهدف، الأيام، البيئة). أكمل الاستبيان أو ملف التدريب ثم عد هنا.",
  completeProfileCta: "إكمال الملف",
  previewErrorTitle: "تعذّر تجهيز برنامجك",
  previewErrorBody: "حدث خطأ تقني. أعد المحاولة — لا نعرض برنامج عام بديل.",
  previewRetry: "إعادة المحاولة",
  paidAutoAssignLoading: "جاري تفعيل برنامجك الشخصي…",
  paidReviewPendingTitle: "برنامجك قيد مراجعة المدرب",
  paidReviewPendingBody:
    "بياناتك تحتاج مراجعة قبل التفعيل الكامل. ستظهر حصتك هنا فور الموافقة — لا برنامج عام بديل.",
  paidNoProgramTitle: "جاري تجهيز برنامجك",
  lockedOverlayLight: "معاينة مجانية — اشترك للوصول الكامل",
  lockedOverlayStrong: "محتوى مقفل — اشترك لفتح برنامجك",
  homeFreeWorkoutSubtitle: "معاينة مجانية — برنامجك الشخصي",
  homePaidWorkoutSubtitle: "برنامجك مفعّل بالكامل",
  exerciseLockedTodayOnly: "التمرين المجاني متاح في يوم اليوم فقط — اشترك لفتح كل الأيام.",
  exerciseLockedOnePerDay: (total: number) =>
    `تمرين واحد فقط متاح اليوم من أصل ${total} في برنامجك الشخصي — اشترك لفتح الباقي.`,
  upgradeSheetTraining:
    "برنامجك الشخصي جاهز — اشترك لفتح الحصة كاملة والتقدم والمتابعة.",
  comparisonFreeProgram: "معاينة شخصية",
  comparisonPaidProgram: "برنامج مفعّل",
} as const;
