/**
 * FREE Membership V1 — training product copy.
 * Structure preview + promo only. No one-exercise-per-day language.
 */
export const TRAINING_PRODUCT_COPY = {
  freePreviewBadge: "اكتشف برنامجك الشخصي",
  paidActiveBadge: "برنامجك مفعّل بالكامل",
  upgradeCta: "افتح برنامجك الكامل",
  upgradeCtaBody: "فعّل عضويتك للوصول إلى جميع الحصص والتمارين والتفاصيل.",
  freePreviewFooter: (_totalExercises: number) =>
    "تم تجهيز هيكل برنامجك حسب هدفك ومستواك. فعّل عضويتك لفتح تفاصيل الحصص والتمارين.",
  freePreviewOtherDay: "محتوى هذا اليوم للمعاينة فقط — فعّل عضويتك لفتح تفاصيل الحصص.",
  freePreviewLoadingTitle: "جاري تجهيز برنامجك الشخصي…",
  freePreviewLoadingBody: "نجهّز هيكل برنامجك حسب هدفك ومستواك.",
  freeSessionLockedTitle: "محتوى الحصة متاح بعد تفعيل العضوية",
  freeSessionLockedBody: (exerciseCount: number, durationMin: number) =>
    `${exerciseCount} تمارين · ${durationMin} دقيقة`,
  freePromoTitle: "كيف يعمل برنامج MAAKFIT",
  freePromoBody:
    "برنامجك يتبع هدفك ومستواك. بعد التفعيل تحصل على الحصص الكاملة وفيديوهات التمارين والتدرج وتتبع النتائج.",
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
  lockedOverlayLight: "معاينة الهيكل — فعّل عضويتك لفتح التفاصيل",
  lockedOverlayStrong: "محتوى مقفل — فعّل عضويتك لفتح برنامجك",
  homeFreeWorkoutSubtitle: "اكتشف هيكل برنامجك الشخصي",
  homePaidWorkoutSubtitle: "برنامجك مفعّل بالكامل",
  exerciseLockedTodayOnly: "تفاصيل التمارين متاحة بعد تفعيل العضوية.",
  exerciseLockedOnePerDay: (_total: number) => "تفاصيل التمارين متاحة بعد تفعيل العضوية.",
  upgradeSheetTraining: "فعّل عضويتك للوصول إلى جميع الحصص والتمارين والتفاصيل.",
  comparisonFreeProgram: "معاينة هيكل البرنامج",
  comparisonPaidProgram: "برنامج مفعّل",
  holdBadge: "جاري إعداد برنامجك",
  holdTitle: "نحن نجهّز لك برنامجك الشخصي",
  holdBody:
    "نقوم حالياً بتحليل بياناتك واختيار التمارين المناسبة وفق هدفك ومستواك ومعداتك المتاحة.",
  holdUpgradeTitle: "حوّل انتظارك إلى تقدم أسرع",
  holdUpgradeLead: "مع الباقة المميزة ستحصل على:",
  holdUpgradeCta: "ترقية الآن",
  holdNotify: "سنقوم بإشعارك فور جاهزية برنامجك.",
  holdExplore: "يمكنك إكمال استكشاف التطبيق أو الاطلاع على محتوى تعليمي أثناء الانتظار.",
} as const;

export const NUTRITION_PRODUCT_COPY = {
  freeIntro: "ابدأ يومك بوجبة مناسبة لهدفك.",
  freeUpgradeCta: "افتح خطتك الغذائية الكاملة",
  freeUpgradeBody: "فعّل عضويتك للوصول إلى جميع وجبات اليوم والكميات والبدائل.",
  lockedMealLabel: "مقفلة — فعّل العضوية للفتح",
} as const;
