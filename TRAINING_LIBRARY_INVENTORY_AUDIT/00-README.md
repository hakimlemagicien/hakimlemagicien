# TRAINING LIBRARY MEDIA PILOT

المجلد التنفيذي الثابت لمشروع إنتاج ودمج صور شرح التمارين داخل تطبيق Hakim Coaching (`/app`).

هذه المرحلة: **تجربة واجهة محلية لـ 37 تمريناً** (Pilot 10 + دفعة 02 + دفعة 04). لا Storage، لا Migration.

---

## الهوية

```text
Name: TRAINING LIBRARY MEDIA PILOT
Version: 1.0
Status: 37 PILOT_APP_TEST (local)
Owner: Hakim Coaching Platform
Pilot Scope: 37 exercises / 185 local stills
Folder: TRAINING_LIBRARY_INVENTORY_AUDIT/
Date: 2026-08-25
```

| الحقل                     | القيمة                                |
| ------------------------- | ------------------------------------- |
| الحالة الرسمية            | `PILOT_APP_TEST` محلياً لـ 37 تمريناً |
| نطاق التسليم المحلي       | 37 تمريناً × 5 صور = 185 صورة WebP |
| توليد الصور               | PNG في `assets/{external_id}/` · WebP في `public/exercises/{external_id}/` |
| اعتماد التدريب            | `TRAINING_REVIEW_REQUIRED` — بما فيها الدفعتان 02 و04 |
| `APPROVED_FOR_GENERATION` | ممنوع — التسليم المحلي ليس اعتماد Storage / Migration        |

---

## دور الملفات

| الملف                                                                                        | الدور                                                          |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`01-TRAINING_LIBRARY_INVENTORY_AUDIT.md`](./01-TRAINING_LIBRARY_INVENTORY_AUDIT.md)         | المرجع الثابت لجرد 320 تمريناً. نسخة مطابقة للأصل. لا يُعدَّل. |
| [`02-TRAINING_MEDIA_PILOT_CONTRACT.md`](./02-TRAINING_MEDIA_PILOT_CONTRACT.md)               | عقد إنتاج وربط الوسائط (مراحل، تسمية، أداء، وصول).             |
| [`03-PILOT_EXERCISES_MANIFEST.md`](./03-PILOT_EXERCISES_MANIFEST.md)                         | حالة كل تمرين Pilot وكل صورة مخططة.                            |
| [`assets/README.md`](./assets/README.md)                                                     | أصول PNG لتمارين الـ Pilot العشرة.                              |
| [`qa/TRAINING_MEDIA_QA_CHECKLIST.md`](./qa/TRAINING_MEDIA_QA_CHECKLIST.md)                   | بوابات الجودة (رياضي، بصري، ملف، تطبيق).                       |
| [`qa/PILOT_QA_RESULTS.md`](./qa/PILOT_QA_RESULTS.md)                                         | نتائج الاختبار الفعلية — قالب `NOT_STARTED`.                   |
| [`CH-001-PILOT-APP-TEST.md`](./CH-001-PILOT-APP-TEST.md)                                     | اعتماد تجربة واجهة `CH-001` على `/app/exercises`.              |
| [`TRAINING_MEDIA_PILOT_PREPARATION_REPORT.md`](./TRAINING_MEDIA_PILOT_PREPARATION_REPORT.md) | تقرير تجهيز هذه المهمة.                                        |

نسخة الجرد الأصلية في المستودع (لا تُعدَّل): [`../docs/TRAINING_LIBRARY_INVENTORY_AUDIT.md`](../docs/TRAINING_LIBRARY_INVENTORY_AUDIT.md)

---

## ترتيب مصدر الحقيقة

```text
1. PROJECT_STATUS + APP_ARCHITECTURE
2. Current repository code
3. TRAINING_LIBRARY_INVENTORY_AUDIT
4. TRAINING_MEDIA_PILOT_CONTRACT
5. PILOT_EXERCISES_MANIFEST
6. QA Results
```

عند التعارض: **الكود الحالي** + [`../docs/PROJECT_STATUS.md`](../docs/PROJECT_STATUS.md) + [`../docs/APP_ARCHITECTURE.md`](../docs/APP_ARCHITECTURE.md) تحكم الحقيقة التقنية.

مصادر داعمة:

- [`../docs/PROJECT_REPORT.md`](../docs/PROJECT_REPORT.md)
- [`../docs/v1/PERFORMANCE.md`](../docs/v1/PERFORMANCE.md) — أداء الصور إلزامي
- كتالوج: `scripts/exercise-library.json` + `scripts/exercise-library-v2-metadata.json`
- وسائط التشغيل الحالية: `src/lib/platform/exercise-media.ts` (فيديو placeholder — لم تُغيَّر مساراته)

`HAKIM_TASK_ROUTING_AND_HANDOFF_PROTOCOL.md` **غير موجود في هذا المستودع** وقت التجهيز. الإحالة أدناه تتبع تعليمات هذه المهمة.

المواصفات الرياضية داخل Manifest وContract **غير معتمدة** حتى مراجعة Training & Exercise Manager.

---

## الحالات الرسمية

تستخدم هذه الحالات فقط. لا تُختصر ولا تُستبدل بمرادفات حرة.

```text
PLANNED
CONTENT_DRAFT
TRAINING_REVIEW_REQUIRED
PILOT_APP_TEST
APPROVED_FOR_GENERATION
GENERATED
MEDIA_QA_REQUIRED
MEDIA_QA_PASSED
READY_FOR_UPLOAD
UPLOADED
INTEGRATION_QA_REQUIRED
INTEGRATION_QA_PASSED
REJECTED
```

حالات قالب النتائج (`NOT_STARTED`) خاصة بملف QA Results وليست بديلاً عن الحالات أعلاه.

قاعدة: **ممنوع** وضع `APPROVED_FOR_GENERATION` قبل اعتماد الموظف التدريبي المختص.

---

## ما هو داخل النطاق / خارجه

| داخل                                  | خارج                                    |
| ------------------------------------- | --------------------------------------- |
| عقود، Manifest، QA، نسخة Audit        | رفع Storage أو Migration                |
| تجربة واجهة للـ 10 على المكتبة وشاشة الحصة | تعديل ملف Audit الأصلي أو نسخته `01-` |
| مسارات `PROPOSED` + تسليم محلي WebP للـ 10 | تغيير مسارات الفيديو الحالية في Storage |
| توثيق أداء ووصول                      | `APPROVED_FOR_GENERATION` / Media QA passed |

---

## NEXT HANDOFF

- **الآن:** تجربة العميل على المكتبة وشاشة الحصة للتمارين العشرة (المصغّرة = المرحلة B).
- **بالتوازي:** Training & Exercise Manager لمراجعة اللقطات (C مقابل A/B، وضوح الخطأين).
- **ممنوع:** Storage / Migration / تغيير مسارات الفيديو.
