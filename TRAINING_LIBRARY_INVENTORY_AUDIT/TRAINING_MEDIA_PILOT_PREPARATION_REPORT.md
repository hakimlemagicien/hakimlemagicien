# TRAINING_MEDIA_PILOT_PREPARATION_REPORT

**Date:** 2026-08-25  
**Task:** تجهيز المجلد التنفيذي لنظام صور مكتبة التمارين  
**Status:** `PREPARATION_ONLY` + `CONTENT_CORRECTIONS_V1` (Manifest only)  
**Owner:** Hakim Coaching Platform / Training (Cursor)

---

## 1. المسار الكامل للمجلد

```text
/Users/hakimlemagicien/Documents/GitHub/hakimlemagicien/TRAINING_LIBRARY_INVENTORY_AUDIT/
```

المجلد لم يكن موجوداً عند بدء الفحص (لا مجلد مشابه تحت الاسم نفسه). أُنشئ في جذر المستودع بجانب `nutrition-library/` و`docs/` حتى لا يتعارض اسمه مع الملف التاريخي `docs/TRAINING_LIBRARY_INVENTORY_AUDIT.md`.

---

## 2. الملفات التي تم إنشاؤها

| المسار                                       | ملاحظات                             |
| -------------------------------------------- | ----------------------------------- |
| `00-README.md`                               | هوية، مصدر حقيقة، حالات رسمية       |
| `01-TRAINING_LIBRARY_INVENTORY_AUDIT.md`     | نسخة مطابقة بايت-لبايت للجرد الأصلي |
| `02-TRAINING_MEDIA_PILOT_CONTRACT.md`        | عقد الإنتاج والربط                  |
| `03-PILOT_EXERCISES_MANIFEST.md`             | 10 تمارين + 50 مساراً مخططاً        |
| `assets/README.md`                           | الأصول فارغة عمداً                  |
| `qa/TRAINING_MEDIA_QA_CHECKLIST.md`          | بوابات الجودة                       |
| `qa/PILOT_QA_RESULTS.md`                     | قالب 50 صفاً `NOT_STARTED`          |
| `TRAINING_MEDIA_PILOT_PREPARATION_REPORT.md` | هذا التقرير (مطلوب للتسليم/الإحالة) |

لم يُحذف ولم يُستبدل أي ملف سابق داخل المجلد.

---

## 3. Hash ملف Audit

خوارزمية: SHA-256

| النسخة                    | المسار                                                                    | SHA-256                                                            |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| قبل المهمة وبعدها (الأصل) | `docs/TRAINING_LIBRARY_INVENTORY_AUDIT.md`                                | `bbafa0e1a01a30c9918cf78d9701af72ac8faf14521ac5a8d43e1cfb088a97cf` |
| النسخة داخل المجلد        | `TRAINING_LIBRARY_INVENTORY_AUDIT/01-TRAINING_LIBRARY_INVENTORY_AUDIT.md` | `bbafa0e1a01a30c9918cf78d9701af72ac8faf14521ac5a8d43e1cfb088a97cf` |

`cmp`: الملفات متطابقة. محتوى الجرد التاريخي **لم يُعدَّل**.

---

## 4. عدد تمارين Pilot

**10** — نفس قائمة Audit §5 دون حذف:

`CH-004` · `CH-001` · `LE-001` · `BA-023` · `GL-001` · `BA-010` · `SH-001` · `BA-001` · `BI-002` · `TR-001`

كلها موجودة في `scripts/exercise-library.json` وكلها `v2_metadata_status = APPROVED`.

---

## 5. عدد مسارات الصور المخططة

**50** مساراً فريداً `PROPOSED` (10 × 5). لا تكرار في مجموعة المسارات. لا ملفات صورة/فيديو داخل المجلد.

صيغة المسار المقترح:

```text
exercises/{external_id}/stages/stage-a.webp
exercises/{external_id}/stages/stage-b.webp
exercises/{external_id}/stages/stage-c.webp
exercises/{external_id}/mistakes/mistake-01.webp
exercises/{external_id}/mistakes/mistake-02.webp
```

---

## 6. التصحيحات التي أُدخلت في Manifest فقط

| البند                           | التصحيح                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| CH-001 خطأ «رفع المقعد»         | استُبدل بـ **رفع الحوض عن المقعد**                                         |
| CH-001 «ارتداد البار عن الصدر»  | **غير مستخدم** كصورة ثابتة (غير قابل للفهم من لقطة واحدة)                  |
| CH-001 الخطأان المعتمدان كمسودة | 1) رفع الحوض عن المقعد 2) إنزال البار قرب الرقبة أو فتح المرفقين بشكل مفرط |
| BA-001 ترتيب المراحل            | A تعليق واستعداد · B سحب للأعلى · C عودة بتحكم                             |
| BI-002 ترتيب المراحل            | A وضعية البداية · B رفع الدمبل · C عودة بتحكم                              |
| TR-001 ترتيب المراحل            | A وضعية البداية · B مد الذراع للأسفل · C عودة بتحكم                        |
| طبقتا النص                      | تعليمات أداء الواجهة منفصلة عن وصف توليد الصورة                            |

كل محتوى تدريبي جديد أو مصحح: `DRAFT — TRAINING_REVIEW_REQUIRED`.  
`generation_status = PLANNED` على العشرة. لا `APPROVED_FOR_GENERATION`.

---

## 7. القرارات المفتوحة

| القرار                                            | الحالة                               | المالك                           |
| ------------------------------------------------- | ------------------------------------ | -------------------------------- |
| اعتماد 10×3 مراحل + 20 خطأ                        | `TRAINING_REVIEW_REQUIRED`           | Training & Exercise Manager      |
| مسار Storage النهائي                              | `PROPOSED`                           | Architect + Database + Developer |
| عقد جدول الوسائط / Migration                      | موثَّق فقط — **غير منفَّذ**          | Database                         |
| حدود KB لمشتقات WebP                              | `DRAFT` يحتاج Performance review     | Performance + Developer          |
| سياسات isometric / cardio / mobility / unilateral | `DRAFT — TRAINING APPROVAL REQUIRED` | Training ثم Architect            |
| دمج الصور مع مشغّل الفيديو الحالي                 | غير مصمَّم                           | Architect + Developer            |
| `HAKIM_TASK_ROUTING_AND_HANDOFF_PROTOCOL.md`      | غير موجود في المستودع                | توثيق العمليات                   |

المواصفات الرياضية **غير معتمدة** قبل مراجعة الموظف التدريبي.

---

## 8. نتائج فحوص التحقق

| الفحص                                                 | النتيجة                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| 1. الملفات المطلوبة موجودة ومنظمة                     | PASS                                                 |
| 2. Audit الأصلي غير معدَّل (hash قبل = بعد)           | PASS                                                 |
| 3. معرفات Pilot العشرة في الكتالوج                    | PASS                                                 |
| 4. العشرة `APPROVED` في V2                            | PASS                                                 |
| 5. 50 مساراً مخططاً دون تكرار في المجموعة الفريدة     | PASS                                                 |
| 6. لا صور ولا Placeholder منسوخ                       | PASS                                                 |
| 7. لا تعديل كود/Schema/Migration ضمن هذه المهمة       | PASS — لم تُلمس `src/` ولا `supabase/` من هذه المهمة |
| 8. لا تعديل Production / Staging / Supabase           | PASS                                                 |
| 9. روابط Markdown النسبية                             | PASS بعد إضافة هذا التقرير                           |
| 10. Prettier على ملفات المجلد ما عدا نسخة Audit `01-` | PASS (`npx prettier --write` على العقود والـ QA)     |

ملاحظة: المستودع يحتوي تعديلات أخرى سابقة غير متعلقة بهذه المهمة (تغذية، كويز، إلخ). هذه المهمة لم تلمسها.

---

## 9. تأكيد صريح بعدم التعديل

لم تُعدَّل في هذه المهمة:

- كود التطبيق (`src/` غير ملموس هنا)
- قاعدة البيانات
- Storage / bucket `exercise-media`
- Production
- Staging
- فرع `main`
- `docs/TRAINING_LIBRARY_INVENTORY_AUDIT.md`
- مسارات الفيديو الحالية في `exercise-media.ts`
- لا Migration
- لا توليد صور

---

## 10. NEXT HANDOFF

- **الموظف التالي:** Training & Exercise Manager (ChatGPT Project)
- **المطلوب:** اعتماد محتوى `CH-001` أولاً.
- **معيار الإتمام:** اعتماد أوصاف الصور الخمس للبنش برس بالحالة `APPROVED_FOR_GENERATION`.
- **المسار اللاحق:** توليد صور CH-001 ثم Media QA قبل بقية التمارين.
- **أرسل له:** `02-TRAINING_MEDIA_PILOT_CONTRACT.md` · `03-PILOT_EXERCISES_MANIFEST.md` · `qa/TRAINING_MEDIA_QA_CHECKLIST.md` · هذا التقرير.

---

## 11. CONTENT_CORRECTIONS_V1

**التاريخ:** 2026-08-25  
**النطاق:** تعديل `03-PILOT_EXERCISES_MANIFEST.md` فقط + هذا القسم. لم تُمس الملفات الستة الأخرى ولا ملف Audit.

### ماذا تغيّر

| الموضوع           | قبل                       | بعد                                                                    |
| ----------------- | ------------------------- | ---------------------------------------------------------------------- |
| قاعدة C           | غالباً عودة كاملة تطابق A | A بداية كاملة · B نهاية الفعل الأساسي · C منتصف العودة المختلفة بصرياً |
| اتجاه الحركة      | قد يُفهم من وصف الصورة    | الواجهة تعرض الاتجاه؛ الصورة بلا أسهم/نص                               |
| خطأ واحد / صورة   | أوصاف بـ«أو» تدمج خطأين   | خطأ واحد لكل `mistake-*`                                               |
| CH-001 A/B/C      | قفل → صدر → قفل (C≈A)     | قفل فوق خط الكتف → بار عند منتصف/أسفل الصدر → منتصف الصعود             |
| CH-001 mistake-02 | رقبة أو فتح مرفقين        | إنزال البار نحو الرقبة فقط                                             |
| LE-001 الصعود     | الدفع بالكعبين            | الضغط عبر القدم كاملة مع ثبات منتصف القدم                              |
| LE-001 mistake-02 | كعبان أو ميل جذع          | انتقال مركز الضغط بعيداً عن منتصف القدم                                |
| GL-001 mistake-02 | رقبة أو امتداد ناقص       | عدم إكمال امتداد الورك فقط                                             |
| BA-001            | ذقن مبالغ + C تعليق كامل  | رقبة محايدة · B ذقن عند العارضة · C منتصف النزول                       |
| BA-001 mistake-02 | ROM أعلى أو انهيار أسفل   | نطاق حركة ناقص في الأعلى فقط                                           |

### ما لم يتغير

- 10 تمارين، 50 مساراً فريداً `PROPOSED`
- `training_review_status = TRAINING_REVIEW_REQUIRED` للعشرة
- `generation_status = PLANNED` — لا `APPROVED_FOR_GENERATION`
- Hash ملف Audit: `bbafa0e1a01a30c9918cf78d9701af72ac8faf14521ac5a8d43e1cfb088a97cf`
