# MAAKFIT — توثيق الجيل الحالي

**التاريخ:** 2026-08-20  
**الجمهور:** موظفون، مطورون، أي أداة ذكاء اصطناعي  
**الأرشيف السابق:** [`docs/v1/`](./v1/README.md) — توثيق ما قبل فصل التطبيق عن صفحة الهبوط

> اقرأ هذه الملفات أولاً. لا تبدأ من `docs/v1` إلا إذا احتجت تاريخ قرار أو تقرير ميزة قديم.

---

## ابدأ هنا

| الترتيب | الملف | الغرض |
|---------|--------|--------|
| 1 | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) | أين وصلنا الآن — الحالة الحية |
| 1b | [`ENVIRONMENTS.md`](./ENVIRONMENTS.md) | PRODUCTION vs STAGING vs LOCAL — عزل قواعد البيانات |
| 2 | [`APP_ARCHITECTURE.md`](./APP_ARCHITECTURE.md) | معمارية المنتج: تسويق منفصل عن التطبيق |
| 3 | [`PROJECT_REPORT.md`](./PROJECT_REPORT.md) | تقرير مراجعة كامل + فرص تحسين تجربة المستخدم |
| 4 | [`../AGENTS.md`](../AGENTS.md) | قواعد العمل للـ AI: Git، Build، المناطق المحمية |
| 5 | [`../README.md`](../README.md) | مدخل سريع للمستودع |

## وثائق الشركة (أرشيف v1 — ما زالت سارية إدارياً)

| الملف | الغرض |
|-------|--------|
| [`v1/PROJECT_HANDBOOK.md`](./v1/PROJECT_HANDBOOK.md) | دستور الشركة — قرارات استراتيجية |
| [`v1/EMPLOYEE_MANUAL.md`](./v1/EMPLOYEE_MANUAL.md) | قواعد العمل الداخلية |
| [`v1/PERFORMANCE.md`](./v1/PERFORMANCE.md) | معايير الأداء الإلزامية |
| [`v1/MASTER_PROJECT_DOCUMENTATION.md`](./v1/MASTER_PROJECT_DOCUMENTATION.md) | مرجع تقني تاريخي — قد يختلف عن الكود الحالي |

عند التعارض: **الكود + `PROJECT_STATUS` + `APP_ARCHITECTURE` تحكم الحقيقة التقنية الحالية.** الدستور في `v1/PROJECT_HANDBOOK` يحكم القرارات الإدارية.

---

## milestone حديث — Legal/Billing V1 (2026-08-20)

| الموضوع | المرجع |
|---------|--------|
| حالة المشروع | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) §3–4 |
| مسارات قانونية + `/app/billing` | [`APP_ARCHITECTURE.md`](./APP_ARCHITECTURE.md) §3 |
| مراجعة UX | [`PROJECT_REPORT.md`](./PROJECT_REPORT.md) §3.6 |
| كود | `src/lib/legal/` · `src/lib/pricing-presentation.ts` |
| قاعدة البيانات | `supabase/migrations/20260820120000_legal_billing_privacy_v1.sql` |
| اختبار | `src/lib/legal/legal-pricing-v1.test.ts` (ضمن `npm test`) |

---

## Training Engine V2 — Phase 3 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_3_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_3_REPORT.md) |
| تقرير جودة المكتبة | [`EXERCISE_LIBRARY_V2_QA_REPORT.md`](./EXERCISE_LIBRARY_V2_QA_REPORT.md) |
| جرد المكتبة الكامل (2026-08-25) | [`TRAINING_LIBRARY_INVENTORY_AUDIT.md`](./TRAINING_LIBRARY_INVENTORY_AUDIT.md) |
| مجلد صور Pilot — عقود فقط | [`../TRAINING_LIBRARY_INVENTORY_AUDIT/00-README.md`](../TRAINING_LIBRARY_INVENTORY_AUDIT/00-README.md) |
| العقود | `src/lib/platform/exercise-library-v2.ts` |
| الهجرة | `supabase/migrations/20260821140000_exercise_library_v2_compatibility.sql` |

---

## Training Engine V2 — Phase 4 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_4_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_4_REPORT.md) |
| المحرك | `src/lib/platform/prescription/` |
| الاختبار | `src/lib/platform/prescription/prescription-engine.test.ts` |

---

## Training Engine V2 — Phase 5 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_5_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_5_REPORT.md) |
| التشغيل | `src/lib/platform/workout-runtime/` · `src/hooks/useWorkoutPlayer.ts` |
| الصوت | `public/audio/workout/` |

---

## Training Engine V2 — Phase 6 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_6_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_6_REPORT.md) |
| المحرك | `src/lib/platform/progression/` |
| الاختبار | `src/lib/platform/progression/progression-engine.test.ts` |
| الهجرة | `supabase/migrations/20260821160000_progression_history_duration.sql` |

---

## Training Engine V2 — Phase 7 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_7_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_7_REPORT.md) |
| المحرك | `src/lib/platform/volume/` |
| الاختبار | `src/lib/platform/volume/volume-engine.test.ts` |

---

## Training Engine V2 — Phase 8 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_8_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_8_REPORT.md) |
| المحرك | `src/lib/platform/continuity/` |
| الاختبار | `src/lib/platform/continuity/continuity-engine.test.ts` |
| الحالة | `PHASE_8_IMPLEMENTED_READY_FOR_QA` |

---

## Training Engine V2 — Phase 9 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_9_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_9_REPORT.md) |
| المحرك | `src/lib/platform/goal-intelligence/` |
| الاختبار | `src/lib/platform/goal-intelligence/goal-intelligence.test.ts` |
| الحالة | `PHASE_9_IMPLEMENTED_READY_FOR_QA` |

---

## Training Engine V2 — Phase 10 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_10_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_10_REPORT.md) |
| المحرك | `src/lib/platform/program-generation/` |
| الاختبار | `src/lib/platform/program-generation/program-generation.test.ts` |
| الحالة | `PHASE_10_IMPLEMENTED_READY_FOR_QA` |

---

## Training Engine V2 — Phase 11 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير المرحلة | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_11_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_11_REPORT.md) |
| الطبقة | `src/lib/platform/training-progress/` |
| شاشة التقدّم | `src/routes/_platform/app/progress.tsx` |
| الاختبار | `src/lib/platform/training-progress/training-progress.test.ts` |
| الحالة | `PHASE_11_IMPLEMENTED_READY_FOR_QA` |

---

## Training Engine V2 — Phase 12 (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير بوابة الإطلاق | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_12_REPORT.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_12_REPORT.md) |
| محاكاة النظام | `src/lib/platform/training-v2-release/` |
| الاختبار | `src/lib/platform/training-v2-release/training-v2-release.test.ts` (ضمن `npm test`) |
| تقرير المراجعة الشاملة 1–12 | [`GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_FULL_STRATEGY_REVIEW.md`](./GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_FULL_STRATEGY_REVIEW.md) |
| الحالة | `READY_FOR_CONTROLLED_RELEASE_WITH_KNOWN_RISKS` |
| النشر | **غير منفَّذ** — بانتظار بوابة Staging |
| مراجعة الإغلاق | حلقة العميل موصولة تطبيقياً — انظر تقرير الإغلاق |

---

## Training Engine V2 — Client Loop Integration Closure (2026-08-21)

| الموضوع | المرجع |
|---------|--------|
| تقرير إغلاق الحلقة | [`TRAINING_ENGINE_V2_CLIENT_LOOP_INTEGRATION_CLOSURE_REPORT.md`](./TRAINING_ENGINE_V2_CLIENT_LOOP_INTEGRATION_CLOSURE_REPORT.md) |
| التوصيل | `src/lib/platform/client-loop/` |
| الهجرة | `supabase/migrations/20260821180000_client_loop_integration.sql` |
| الاختبار | `src/lib/platform/client-loop/client-loop.test.ts` (ضمن `npm test`) |
| الحالة | `CLIENT_LOOP_CLOSED_WITH_EXTERNAL_RELEASE_GATES` |
| النشر | **غير منفَّذ** |

---

## Training Engine V2 — Staging cohort (CEO 2026-08-22)

| الموضوع | المرجع |
|---------|--------|
| قرار CEO + مسار الدمج (PF-1) + رابط Staging (PF-4) | [`TRAINING_ENGINE_V2_STAGING_COHORT.md`](./TRAINING_ENGINE_V2_STAGING_COHORT.md) |
| Dry-run / rollback (PF-2, PF-3) — بلا تطبيق إنتاج | [`TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md`](./TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md) |
| البيئات | [`ENVIRONMENTS.md`](./ENVIRONMENTS.md) |
| SHA المعتمد | `4d80f8d366909a2a6cf9217803c9c62277b66954` |
| الحالة | `STAGING_COHORT_APPROVED` — **لا** دمج `main`، **لا** Production |

---

## Nutrition Library V2 — كتالوج التشغيل (2026-08-22)

| الموضوع | المرجع |
|---------|--------|
| قواعد الموظف | [`NUTRITION_LIBRARY_V2_EMPLOYEE_RULES.md`](./NUTRITION_LIBRARY_V2_EMPLOYEE_RULES.md) |
| المصدر | `nutrition-library/SOURCE.json` — حزم `nutrition_v2_MEAL-*` |
| التشغيل | `src/lib/platform/data/nutrition-library-v2.json` |
| الهوية | `external_id` = `MEAL-NNN` (ثابت؛ المحتوى V2 على نفس المفاتيح) |
| V1 | موقوفة. لا تستورد `nutrition-pilot-20` ولا دفعات 021–300 القديمة |

---

## قاعدة التحديث

عند كل milestone:

1. حدّث **`PROJECT_STATUS.md`** أولاً
2. حدّث **`APP_ARCHITECTURE.md`** إن تغيّر فصل الطبقات أو المسارات
3. أضف ملاحظات إلى **`PROJECT_REPORT.md`** عند مراجعة UX
4. لا تعدّل ملفات `docs/v1/` إلا لتصحيح تاريخي صريح
