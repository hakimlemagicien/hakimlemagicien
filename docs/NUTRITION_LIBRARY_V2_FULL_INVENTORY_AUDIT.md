# تدقيق الجرد الكامل لمكتبة التغذية V2

**تاريخ التدقيق:** 2026-09-17  
**نوع المهمة:** تدقيق وجرد فقط؛ لم يتغير الكتالوج أو منطق التغذية أو واجهة العميل.

## مصدر الحقيقة

- التعريف الرسمي: `nutrition-library/SOURCE.json`.
- ملف التشغيل: `src/lib/platform/data/nutrition-library-v2.json`.
- النسخة المرجعية: `nutrition-library/v2/nutrition-library-v2.json`.
- Schema: `2.0.0`، catalog: `nutrition_v2`، generated_on: `2026-08-22`.
- Runtime SHA-256: `14b1b6f72a595fcd4336e1d147e3557f8244e85213a898f2e955b4f94b939675`; mirror SHA-256: `14b1b6f72a595fcd4336e1d147e3557f8244e85213a898f2e955b4f94b939675`; identical: **YES**.
- لم تُستخدم دفعات V1 القديمة في الحساب.

## النتيجة التنفيذية

| المؤشر | النتيجة |
|---|---:|
| TOTAL_MEALS | 300 |
| ACTIVE_MEALS | 300 |
| INACTIVE_MEALS | 0 |
| DUPLICATE_IDS | 0 |
| MISSING_IDS | 0 |
| FIRST_ID | MEAL-001 |
| LAST_ID | MEAL-300 |

كل السجلات الـ300 منشورة، review_status=ready، وملفات cover وthumbnail موجودة. لا توجد فجوات أو تكرارات في الهوية.

## تصنيف الخانات

اعتمد التصنيف على `meal_type` الرسمي فقط (CLASSIFICATION_SOURCE=OFFICIAL). تم جمع lunch+dinner تحت MAIN_MEAL. بقيت drinks ضمن UNCLASSIFIED لأن قائمة المهمة لا تحتوي فئة DRINKS، ولأن العقد الرسمي يمنع تحويل المشروب إلى snack أو pre/post. لا يوجد تصنيف MULTI_SLOT في المصدر.

| الفئة | العدد |
|---|---:|
| BREAKFAST | 55 |
| MAIN_MEAL | 130 |
| SNACK | 40 |
| PRE_WORKOUT | 25 |
| POST_WORKOUT | 30 |
| MULTI_SLOT | 0 |
| UNCLASSIFIED | 20 |

## نطاق القيم الغذائية

القيم: minimum / median / maximum.

| الفئة | العدد | السعرات | البروتين g | الكربوهيدرات g | الدهون g |
|---|---:|---:|---:|---:|---:|
| BREAKFAST | 55 | 268 / 423 / 632 | 11.5 / 25.2 / 43.5 | 17.4 / 47.1 / 88.9 | 1.1 / 14.2 / 37.1 |
| MAIN_MEAL | 130 | 351 / 570.5 / 929 | 14.4 / 34.1 / 63.5 | 12.9 / 57.2 / 133.7 | 6.2 / 21.6 / 49.6 |
| SNACK | 40 | 134 / 273 / 450 | 5.9 / 14.8 / 27.6 | 13.4 / 25.5 / 87.8 | 0.5 / 6.9 / 34.9 |
| PRE_WORKOUT | 25 | 167 / 322 / 502 | 9.9 / 19.7 / 31.9 | 11.8 / 46.3 / 79.8 | 0.6 / 6.4 / 24.4 |
| POST_WORKOUT | 30 | 249 / 452.5 / 680 | 11.7 / 31.1 / 39.3 | 20 / 55.1 / 93.6 | 2.5 / 15.1 / 38.7 |
| UNCLASSIFIED | 20 | 144 / 262.5 / 512 | 6.6 / 14.9 / 29 | 12.2 / 38 / 77.8 | 1.5 / 7.1 / 25.7 |

النطاق الكلي: السعرات 134–929 kcal (median 447.5)، البروتين 5.9–63.5g (median 29.9g).

## أهداف التغذية والأهداف الرسمية للتطبيق

المكتبة لا تستخدم أهداف الكويز مباشرة. عقد V2 يسمح فقط بـ`fat_loss` و`maintenance` و`muscle_gain`. التطبيق يعرّف 12 هدف عميل، ويحوّلها عبر `goal-profile-resolver.ts` إلى هذه السلال/الأهداف الغذائية.

- FAT_LOSS وWAIST_DEFINITION → fat_loss (أو maintenance حسب الملف).
- MUSCLE_GAIN وGLUTE_GROWTH → muscle_gain.
- BODY_RECOMPOSITION وUPPER_BODY_DEFINITION وFEMININE_BALANCED_BODY → maintenance مع سياق إعادة تركيب؛ لا يوجد وسم `body_recomposition` في عقد V2 نفسه.
- STRENGTH_PERFORMANCE وFITNESS_ENDURANCE وMOBILITY_RECOVERY وPOSTURE_BACK_HEALTH وGENERAL_HEALTH_FITNESS → maintenance مع fat_loss أو muscle_gain حيث يحدد resolver ذلك.

التغطية الرقمية التفصيلية موجودة في تقرير المصفوفة. التقييم:

- FAT_LOSS: **SUFFICIENT** على مستوى الكتالوج، مع 297 وجبة و55 فطورًا و23 pre رسميًا و30 post رسميًا.
- MUSCLE_GAIN: **LIMITED في PRE_WORKOUT المحافظ**؛ 247 وجبة إجمالًا و18 pre رسميًا، لكن 8 فقط تمر شاشة الملاءمة المحافظة.
- MAINTENANCE/GENERAL: **SUFFICIENT**؛ كل الوجبات الـ300 تحمل maintenance.
- BODY_RECOMPOSITION: **LIMITED**؛ متاح تشغيليًا عبر maintenance، لكنه غير موسوم صراحة في V2 ولذلك لا يمكن قياس خصوصيته من الكتالوج وحده.
- بقية الأهداف الرسمية: **SUFFICIENT أو LIMITED وفق السلة أعلاه**؛ لا توجد سلة غذائية مستقلة لكل هدف تدريبي.

## جاهزية ست وجبات في اليوم

الشكل المقصود هو breakfast + lunch + evening snack + dinner + pre + post. الأعداد الرسمية (55/70/40/60/25/30) تكفي لخطة سبعة أيام دون تكرار.

شاشة تدقيق غير سريرية استُخدمت للتحقق الواقعي فقط:

- Pre: النوع الرسمي pre_workout، كربوهيدرات ≥20g، دهون ≤15g، ألياف مشتقة ≤10g، سعرات ≤500، وحصة ≤600g/ml.
- Post: النوع الرسمي post_workout، بروتين ≥20g، كربوهيدرات ≥20g، دهون ≤20g، سعرات ≤700، وحصة ≤700g/ml.

النتيجة: 13 pre محافظة و18 post محافظة. هدف muscle_gain يملك 8 pre محافظة فقط. لذا:

**SIX_MEAL_DAY_READY: PARTIAL** — جاهز لسبعة أيام، لكن تنويع PRE_WORKOUT لهدف muscle_gain عبر 14 يومًا ضعيف.

## قرار الوجبات الجديدة

لإنشاء قوالب 7 أيام: لا يلزم إنشاء وجبات قبل البدء. لإنشاء دورة 14 يومًا بلا تكرار مفرط وفق الشاشة المحافظة: يلزم **6 وجبات PRE_WORKOUT جديدة** تحمل maintenance + muscle_gain؛ ويجب أن تكون واحدة منها على الأقل مناسبة أيضًا لـfat_loss كي يرتفع مخزونه المحافظ من 13 إلى 14.

هذا احتياج تغطية مستنتج من الأرقام، وليس إنشاءً للوجبات أو تغييرًا لعقد القيم الغذائية.

## إجابات القرار A–G

A. العدد الحقيقي: **300**.  
B. كل السجلات قابلة للتشغيل تقنيًا؛ ليست كلها مثالية ضمن الشاشة المحافظة لـpre/post.  
C. المكتبة تكفي لبدء قوالب 7 أيام لكل سلال التغذية الرسمية، مع محدودية تخصيص BODY_RECOMPOSITION وPRE muscle_gain.  
D. تكفي لـ4 core + Pre + Post على 7 أيام؛ جاهزية 14 يومًا **PARTIAL**.  
E. الأضعف: muscle_gain × PRE_WORKOUT؛ وBODY_RECOMPOSITION من حيث الوسم الصريح.  
F. لقوالب 7 أيام: لا. لدورة 14 يومًا قوية: نعم.  
G. العدد: **6 PRE_WORKOUT** لـmuscle_gain + maintenance، واحدة على الأقل أيضًا fat_loss.

## الحدود

- لا يحتوي V2 حقل halal؛ لذلك قيمته في الجرد `NOT_AVAILABLE` ولا يجوز استنتاجه.
- fiber ليس حقلًا أعلى السجل؛ استُخدم `qa.derived_fiber_g` مع توضيح المصدر.
- active ليس حقلًا في JSON؛ تم تمثيله في CSV كـ`YES_DERIVED_FROM_PUBLISHED_READY` لأن status=published وreview_status=ready لكل السجلات.
- لا توجد نتيجة طبية أو سريرية في هذا التدقيق.
