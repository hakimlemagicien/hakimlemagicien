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
  completeProfileTitle: "أكمل بياناتك لعرض برنامجك",
  completeProfileBody:
    "نستخدم إجابات الاستبيان أولًا. نسألك فقط عن أي معلومة ناقصة لتفعيل Strategy Matrix.",
  completeProfileCta: "تفعيل برنامجي",
  strategySetupTitle: "معلومة ناقصة لتفعيل برنامجك",
  strategySetupBody:
    "نستخدم إجابات الاستبيان ومكان التدريب تلقائياً، مع 5 أيام تدريب افتراضياً. نسألك فقط إن نقص الهدف.",
  strategySetupCta: "احفظ وفعّل برنامجي",
  strategySetupSaving: "جاري التفعيل…",
  previewErrorTitle: "تعذّر تجهيز برنامجك",
  previewErrorBody: "حدّث بيانات التدريب أدناه ثم أعد المحاولة — لا نعرض برنامج عام بديل.",
  previewRetry: "إعادة المحاولة",
  paidAutoAssignLoading: "جاري تفعيل برنامجك الشخصي…",
  paidReviewPendingTitle: "تعذّر التفعيل التلقائي",
  paidReviewPendingBody:
    "نستخدم إجابات الاستبيان أولاً مع 5 أيام افتراضياً. إن بقي الهدف ناقصاً نسألك عنه فقط.",
  paidNoProgramTitle: "جاري تفعيل برنامجك من بيانات الاستبيان",
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
