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

## قاعدة التحديث

عند كل milestone:

1. حدّث **`PROJECT_STATUS.md`** أولاً
2. حدّث **`APP_ARCHITECTURE.md`** إن تغيّر فصل الطبقات أو المسارات
3. أضف ملاحظات إلى **`PROJECT_REPORT.md`** عند مراجعة UX
4. لا تعدّل ملفات `docs/v1/` إلا لتصحيح تاريخي صريح
