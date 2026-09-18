# MAAKFIT — Nutrition Template Catalog V1

## العقد التشغيلي

قالب التغذية هو إطار الاستراتيجية والخانات وقواعد الاختيار، وليس سعرات ثابتة أو خطة عميل مشتركة. المسار الرسمي:

`MASTER TEMPLATE → AUTO/MANUAL ASSIGN → CLIENT COPY/SNAPSHOT → CLIENT OVERRIDE`

- القالب المنشور غير قابل للتعديل. يبدأ التغيير من مسودة إصدار جديد.
- التعيين ينشئ Target وAssignment وDecision Trace ولقطة كاملة للقالب وإصداره.
- حفظ تعيين العميل يعني Draft فقط. النشر وحده يجعله Active ومرئيًا.
- تعديل العميل لا يعدّل القالب أو أي عميل آخر.
- نشر المحتوى من الأدمن عملية بيانات ولا يحتاج Code Deploy.

## الاستراتيجيات الثلاث والأهداف الرسمية

لا يوجد مستوى يختاره العميل ضمن قرار التغذية، ولا يوجد محرك منفصل لكل هدف.

| الهدف | الاستراتيجية المسموحة |
|---|---|
| FAT_LOSS | FAT_LOSS |
| WAIST_DEFINITION | FAT_LOSS أو MAINTENANCE حسب resolver |
| MUSCLE_GAIN | MUSCLE_GAIN |
| GLUTE_GROWTH | MUSCLE_GAIN |
| BODY_RECOMPOSITION | MAINTENANCE-based recomp |
| UPPER_BODY_DEFINITION | MAINTENANCE أو MUSCLE_GAIN |
| FEMININE_BALANCED_BODY | MAINTENANCE أو MUSCLE_GAIN |
| STRENGTH_PERFORMANCE | MAINTENANCE أو MUSCLE_GAIN |
| FITNESS_ENDURANCE | MAINTENANCE أو FAT_LOSS |
| MOBILITY_RECOVERY | MAINTENANCE |
| POSTURE_BACK_HEALTH | MAINTENANCE |
| GENERAL_HEALTH_FITNESS | MAINTENANCE أو FAT_LOSS |

يُفرض هذا التوافق في الواجهة وفي قاعدة البيانات. `goal-profile-resolver` يبقى مصدر قرار الاستراتيجية الديناميكي.

## الأهداف والخطة اليومية

`Nutrition Strategy V1` يحسب السعرات والبروتين والكربوهيدرات والدهون من بيانات العميل. لا توجد قيمة 1800 أو فائض/عجز موحّد لكل العملاء.

الدورة V1 سبعة أيام. كل يوم يحوي ست خانات:

1. Breakfast
2. Main Meal 1
3. Main / Snack
4. Main Meal 2
5. Pre-Workout
6. Post-Workout

يُحفظ ناتج السبعة أيام داخل لقطة التعيين، ويكون التوليد حتميًا لنفس حالة العميل وإصدار القالب. يختار Runtime يوم الدورة المحفوظ وفق `starts_on` وتاريخ الجلسة مع الاحتفاظ بمعرّف الخانة لتسجيل الإنجاز؛ ولا يعيد Refresh/Login توليد الوجبات.

## حراس الخانات

- Breakfast: `meal_type = breakfast` فقط.
- Main 1: `lunch` فقط، وMain 2: `dinner` فقط، والخانة الوسطى `snack`.
- Pre: `pre_workout`، كربوهيدرات ≥20g، دهون ≤15g، ألياف مشتقة ≤10g، سعرات ≤500، وحجم حصة ≤600.
- Post: `post_workout`، بروتين ≥20g، كربوهيدرات ≥20g، دهون ≤20g، سعرات ≤700، وحجم حصة ≤700.
- الوجبة يجب أن تكون `published + active + image ready` ومتوافقة مع الهدف والحساسية.

لا يوجد fallback يعبر نوع الخانة. إذا نفدت التغطية الآمنة يرجع المحرك `INSUFFICIENT_SAFE_MEAL_COVERAGE` ولا يخترع وجبة.

## توقيت التدريب

الحقل `training_meal_window` إلزامي. إذا كان مفقودًا يتوقف التعيين بـ `TRAINING_TIME_REQUIRED` ولا يُفترض وقت وهمي.

| النافذة | الترتيب الحتمي |
|---|---|
| before_breakfast | Pre, Post, Breakfast, Lunch, Snack, Dinner |
| after_breakfast | Breakfast, Pre, Post, Lunch, Snack, Dinner |
| before_lunch | Breakfast, Pre, Post, Lunch, Snack, Dinner |
| after_lunch | Breakfast, Lunch, Pre, Post, Snack, Dinner |
| before_evening_meal | Breakfast, Lunch, Pre, Post, Snack, Dinner |
| after_evening_meal | Breakfast, Lunch, Snack, Pre, Post, Dinner |
| before_dinner | Breakfast, Lunch, Snack, Pre, Post, Dinner |
| after_dinner | Breakfast, Lunch, Snack, Dinner, Pre, Post |

## المحسوب والمنتقى

- Calculated: يحفظ القالب القواعد والخانات، ويختار المحرك أفضل ملاءمة لTarget العميل مع أولوية السلامة ثم التنوع.
- Curated: يختار الأدمن 42 وجبة (7×6). النشر يُرفض خادميًا إذا نقص يوم/خانة أو خالفت الوجبة نوع الخانة أو مرشح Pre/Post المحافظ. عند التعيين تُنسخ الأيام السبعة نفسها إلى Snapshot العميل، ويُحظر تعارض الحساسية، وتبقى الحالة `REVIEW_REQUIRED` حتى يراجع الأدمن ملاءمة الإجماليات لهدف العميل قبل النشر.

## النسخ والنشر

- Published V1 يبقى ثابتًا.
- Create version ينشئ Draft V2 مستقلًا.
- نشر V2 لا يغيّر تعيينات V1 الموجودة.
- تغيير Default يوجّه التعيينات الجديدة فقط.
- Archive لا يحذف snapshots الموجودة لدى العملاء.

## FREE وPaid

التعيين الخلفي موحّد. العضوية تتحكم في العرض:

- FREE: فطور حقيقي ومتوافق مع الهدف مفتوح، وبقية الخانات مقفلة ولا تُسرّب تفاصيلها.
- PLUS/PRO/VIP: تعرض الخطة المنشورة وفق Entitlements الحالية.

## التدقيق والأمان

عمليات save/publish/version/duplicate/archive/default/assign/client publish تسجل في Audit Log. كل RPC إداري ينفذ `_require_admin()`، وصلاحيات anon مسحوبة، وRLS مفعّل. التحقق من الخانات ومن التوافق مع الاستراتيجية يتم خادميًا ولا يعتمد على إخفاء الواجهة.

## حدود V1 المعلنة

- كتالوج Muscle Gain Pre المحافظ محدود لكنه يكفي دورة 7 أيام مع أولوية السلامة.
- يوصى لاحقًا بست وجبات Pre جديدة لدورة 14 يومًا؛ لم تُنشأ في هذه المهمة.
- Bulk assignment مؤجل لأنه تغيير واسع عالي التأثير.
- إنشاء التعيين الغذائي تلقائيًا داخل حدث اكتمال Onboarding ما زال يحتاج مشغّلًا خادميًا يستطيع تشغيل محرك TypeScript الآمن؛ القالب الافتراضي والـresolver جاهزان، لكن V1 لا يدّعي Auto-Assign كاملًا قبل إضافة هذا المشغّل واختباره.
