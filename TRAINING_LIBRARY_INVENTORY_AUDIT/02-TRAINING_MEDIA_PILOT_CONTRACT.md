# TRAINING MEDIA PILOT CONTRACT

**Version:** 1.0  
**Status:** `PREPARATION_ONLY` — قرارات المسار والبيانات والأداء **PROPOSED** حتى مراجعة Architect / Database / Developer / Performance  
**المحتوى التدريبي:** `DRAFT — TRAINING APPROVAL REQUIRED`  
**لا ينشئ هذا الملف جدولاً ولا Migration ولا يغيّر Storage.**

---

## 6.1 هدف النظام

شرح كل تمرين داخل التطبيق (`/app`) بصور منفصلة ومكونات واجهة أصلية.

الصورة تعرض الجسم، المعدات، والوضعية فقط.

**النصوص التالية لا تُدمج داخل الصور:**

- A / B / C
- أسماء المراحل
- صحيح / خطأ
- التعليمات
- التنفس
- الأخطاء
- الإطارات الخضراء والحمراء
- أي شعار أو Watermark أو نص عربي/إنجليزي

التطبيق هو الذي يعرض هذه العناصر حتى تبقى قابلة للترجمة والتعديل والوصول.

الواقع التقني الحالي (لا يُغيَّر في هذه المرحلة):

- التشغيل يعتمد فيديو من bucket `exercise-media`
- المسارات الحية: `exercises/placeholders/default-exercise.mp4` و`exercises/{external_id}/exercise.mp4` عند الجاهزية
- لا توجد صور مراحل في الكتالوج اليوم (`media_status = placeholder` لكل 320)
- هذا العقد يضيف طبقة صور شرح **مقترحة** بجانب الفيديو، ولا يستبدل مسارات الفيديو الحالية

---

## 6.2 تصنيف المراحل

### العقد الأساسي (إلزامي)

ممنوع فرض التسميات التالية على جميع التمارين:

```text
A = الاستعداد
B = النزول
C = الدفع
```

العقد الثابت في النظام:

```text
A = START_POSITION
B = PRIMARY_ACTION
C = END_OR_RETURN
```

كل تمرين يجب أن يمتلك **أسماء مراحل مناسبة لحركته** (عربي + إنجليزي) تُعرض في الواجهة. الرموز A/B/C تبقى مفاتيح تقنية فقط.

أمثلة معتمدة كاتجاه (ما زالت مسودة تدريبية):

| التمرين                  | A START_POSITION   | B PRIMARY_ACTION | C END_OR_RETURN |
| ------------------------ | ------------------ | ---------------- | --------------- |
| Bench Press (`CH-001`)   | وضعية البداية      | إنزال البار      | دفع البار       |
| Pull Up (`BA-001`)       | التعليق والاستعداد | السحب للأعلى     | العودة بتحكم    |
| Dumbbell Curl (`BI-002`) | وضعية البداية      | رفع الدمبل       | العودة بتحكم    |

`PRIMARY_ACTION` ليست دائماً نزولاً وليست دائماً دفعاً. تُشتق من الحركة الحقيقية.

### طبقتان من النص (إلزامي)

| الطبقة                     | أين تظهر                        | الغرض                            |
| -------------------------- | ------------------------------- | -------------------------------- |
| تعليمات الأداء الصحيح      | واجهة التطبيق (`instruction_*`) | ماذا يفعل العميل                 |
| وصف الصورة المطلوب توليدها | Manifest / إنتاج الوسائط فقط    | ماذا يجب أن تُظهر اللقطة الثابتة |

لا تُستخدم جملة الإنتاج كتعليمات عميل، ولا تُخبز تعليمات العميل داخل الصورة.

---

## 6.3 أنواع التمارين

نظام ثلاث مراحل لا يناسب كل 320 تمريناً بالطريقة نفسها.

كل سياسة أدناه:

```text
DRAFT — TRAINING APPROVAL REQUIRED
```

| النوع                    | سياسة مبدئية                                                 | ملاحظة                                        |
| ------------------------ | ------------------------------------------------------------ | --------------------------------------------- |
| Dynamic Strength         | ثلاث مراحل A/B/C                                             | الافتراضي لـ Pilot القوة الديناميكية          |
| Unilateral / Alternating | قد يحتاج جانباً (`side-left` / `side-right`) أو مرحلة إضافية | خارج نطاق صور Pilot الخمس ما لم يُعتمد لاحقاً |
| Isometric                | صورة وضعية صحيحة + صور أخطاء — ليست ثلاث مراحل إجبارية       | مثال مستقبلي: Wall Sit                        |
| Mobility / Stretch       | بداية المدى + نهاية المدى + مدة الثبات                       | قد لا يناسب A/B/C الحركي                      |
| Cardio / Cyclical        | فيديو أو تسلسل متعدد الإطارات                                | الصور الثابتة أضعف تمثيلاً                    |
| Warm-up                  | حسب طبيعة الحركة                                             | دائرة ذراع ≠ بنش                              |
| Machine Exercise         | يجب مطابقة الجهاز والضبط الصحيح (مقعد، دبوس، مسار)           | المعدات من metadata                           |

**Pilot الحالي (10):** كلها Dynamic Strength معتمدة V2. السياسات الأخرى تُحفظ للتوسع بعد الـ 320، وليست رخصة لتوليد صور الآن.

---

## 6.4 مواصفات الصور

### المواصفات المقترحة (PROPOSED — ليست قرار إنتاج نهائي)

```text
Master aspect ratio: 4:3
Master dimensions: 1600 × 1200
Master source: PNG
Application delivery: WebP
Color profile: sRGB
Orientation: Landscape
Text baked into image: ممنوع
Watermark: ممنوع
Logos: ممنوع ما لم يعتمدها CEO
Background: ثابت وغير مزدحم
Camera angle: ثابت داخل حزمة التمرين الواحدة (الصور الخمس)
Trainer identity: ثابت داخل الصور الخمس
Clothing: ثابت
Equipment: ثابت ومتطابق مع metadata.equipment
```

### مشتقات أداء مقترحة — بلا تنفيذ

```text
480w WebP
960w WebP
1600w WebP
```

حدود الحجم التالية **اقتراح يحتاج Performance / Developer review**، ليست ميزانية معتمدة:

| المشتق               | حد مقترح للمراجعة                | الحالة  |
| -------------------- | -------------------------------- | ------- |
| 480w WebP            | أقل من 40 KB                     | `DRAFT` |
| 960w WebP            | أقل من 90 KB                     | `DRAFT` |
| 1600w WebP           | أقل من 180 KB                    | `DRAFT` |
| PNG master 1600×1200 | مرجع إنتاج فقط — لا يُخدم للعميل | `DRAFT` |

المرجع الإلزامي للأداء عند التنفيذ لاحقاً: [`../docs/v1/PERFORMANCE.md`](../docs/v1/PERFORMANCE.md) (`OptimizedImage`، أبعاد ثابتة، لا CLS، Lighthouse ≥ 90). لا تُرفع PNG الرئيسية للتطبيق على غرار قاعدة مكتبة التغذية.

---

## 6.5 عقد تسمية الملفات

### مسارات Storage المقترحة — `PROPOSED`

حتى يراجعها Architect وDatabase وDeveloper. **لا تُستخدم ولا تُنشأ في هذه المهمة.**

```text
exercises/{external_id}/stages/stage-a.webp
exercises/{external_id}/stages/stage-b.webp
exercises/{external_id}/stages/stage-c.webp
exercises/{external_id}/mistakes/mistake-01.webp
exercises/{external_id}/mistakes/mistake-02.webp
```

أمثلة:

```text
exercises/CH-001/stages/stage-a.webp
exercises/CH-001/stages/stage-b.webp
exercises/CH-001/stages/stage-c.webp
exercises/CH-001/mistakes/mistake-01.webp
exercises/CH-001/mistakes/mistake-02.webp
```

الهوية في المسار = `external_id` فقط. ممنوع `id` (UUID) وممنوع الاسم المعروض وممنوع `slug` كجذر مجلد.

### مسار المصدر المحلي المخطط (بعد الاعتماد)

```text
TRAINING_LIBRARY_INVENTORY_AUDIT/assets/{external_id}/stage-a.png
… /stage-b.png
… /stage-c.png
… /mistake-01.png
… /mistake-02.png
```

هذا المجلد فارغ عمداً الآن. ممنوع نسخ `exercises/placeholders/default-exercise.mp4` إلى هذه المسارات.

مسارات الفيديو الحالية تبقى كما هي في `src/lib/platform/exercise-media.ts`.

---

## 6.6 البيانات المطلوبة لكل وسيط

عقد صف مقترح لكل صورة. **لا جدول ولا Migration في هذه المهمة.**

```text
exercise_external_id
asset_type          # stage | mistake
stage_code          # stage-a | stage-b | stage-c | mistake-01 | mistake-02
title_ar
title_en
instruction_ar
instruction_en
breathing_cue_ar
breathing_cue_en
mistake_description_ar    # يُملأ لصفوف mistake فقط
mistake_description_en
storage_path
width
height
format
file_size_bytes
content_review_status
media_qa_status
integration_qa_status
version
created_at
updated_at
```

حقول واجهة إضافية تُشتق ولا تُخبز في الملف:

- `alt_ar` / `alt_en`
- `stage_key` = `A` | `B` | `C` للربط بالواجهة فقط

`content_review_status` يستخدم الحالات الرسمية في [`00-README.md`](./00-README.md).

ربط مقترح لاحق (غير منفَّذ): `exercise_external_id` → `public.exercises.external_id`. لا يُستخدم UUID `exercises.id` في اسم الملف.

---

## 6.7 الأداء

متطلبات واجهة لاحقة — **لا تنفيذ الآن**. متوافقة مع [`../docs/v1/PERFORMANCE.md`](../docs/v1/PERFORMANCE.md):

- Lazy loading للصور غير الظاهرة.
- تحميل الصورة المختارة فقط بالحجم الكبير.
- صور مصغرة محسنة لمحدد A/B/C (المشتق 480w مرشح).
- Poster أو placeholder محلي ثابت الأبعاد أثناء التحميل.
- عدم ترك واجهة فارغة عند فشل الصورة.
- استخدام `srcset` أو آلية Responsive Images المناسبة للتطبيق (`OptimizedImage`).
- Cache طويل للملفات ذات الأسماء Versioned (query `v=` أو اسم يتضمن `version` — قرار Developer).
- عدم تحميل الصور الخمس الأصلية كاملة في بداية الشاشة.
- اختبار الهواتف والشبكات الضعيفة.
- فشل صورة ثانوية (مرحلة غير مختارة أو خطأ) **لا يمنع** بدء التمرين.

---

## 6.8 إمكانية الوصول

- Alt text عربي وإنجليزي لكل صورة (من العنوان + المرحلة، ليس من النص المخبوز — لا نص مخبوز).
- التعليمات لا تعتمد على اللون وحده.
- صحيح / خطأ يستخدم رمزاً ونصاً بجانب اللون (مثلاً علامة و«خطأ شائع»).
- الأزرار (A/B/C وقسم الأخطاء) قابلة للاستخدام بلوحة المفاتيح وقارئ الشاشة.
- لا تكون التعليمات المهمة مكتوبة داخل الصورة فقط.
- الواجهة RTL للعربية؛ أسماء المراحل من الحقول `title_ar` / `title_en` حسب لغة التطبيق.

---

## 6.9 الأخطاء كصورة ثابتة

صورة الخطأ يجب أن تُفهم **من لقطة واحدة** دون حركة.

- لا تعتمد على حدث لحظي يصعب تجميده (مثل ارتداد البار عن الصدر).
- لا تصوّر وضعية خطرة كأنها صحيحة.
- يجب أن يبقى الخطأ واضحاً أنه خطأ عبر تسمية الواجهة، لا عبر إطار أحمر داخل الملف.

---

## 6.10 قرارات مفتوحة

| القرار                                   | الحالة                               | المالك التالي                    |
| ---------------------------------------- | ------------------------------------ | -------------------------------- |
| اعتماد أسماء المراحل والخطأين لكل Pilot  | `TRAINING_REVIEW_REQUIRED`           | Training & Exercise Manager      |
| مسار Storage النهائي                     | `PROPOSED`                           | Architect + Database + Developer |
| جدول/أعمدة الوسائط                       | `PROPOSED` — بلا Migration           | Database                         |
| حدود KB للمشتقات                         | `DRAFT`                              | Performance + Developer          |
| دمج الصور مع مشغّل الفيديو الحالي        | غير مصمَّم                           | Architect + Developer            |
| Unilateral / isometric / cardio policies | `DRAFT — TRAINING APPROVAL REQUIRED` | Training Manager ثم Architect    |
