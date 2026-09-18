# تقرير جودة بيانات مكتبة التغذية V2

## ملخص الفحوص

| نوع المشكلة | العدد |
|---|---:|
| missing calories | 0 |
| missing macros | 0 |
| impossible macros (>10% 4/4/9 delta أو قيمة سالبة) | 0 |
| missing ingredients | 0 |
| missing/broken media | 0 |
| placeholder media | 0 |
| missing serving sizes | 0 |
| duplicate IDs | 0 |
| duplicate Arabic names | 0 |
| duplicate English names | 0 |
| duplicate nutrition profiles | 0 |
| inconsistent bilingual names | 0 |
| invalid external_id | 0 |
| missing meal_type | 0 |
| conflicting dietary/allergen tags | 0 |
| QA check failures | 0 |
| inactive/not-ready | 0 |

## سلامة الهوية

- النطاق الفعلي: `MEAL-001` → `MEAL-300`.
- IDs مفقودة: لا يوجد.
- IDs مكررة: 0.
- أسماء عربية أو إنجليزية مكررة: 0.
- ملفات غذائية متطابقة تمامًا (calories+P+C+F): 0.

## الوسائط

- image_status=ready: 300/300.
- cover.webp الفعلي: 300/300.
- cover-thumb.webp الفعلي: 300/300.
- لا تعتمد النتيجة على image.reference القديم وحده؛ تم فحص مسار التسليم التشغيلي لكل external_id.

## ملاحظات عقدية وليست تلف بيانات

1. لا يوجد top-level fiber_g، لكن `qa.derived_fiber_g` موجود لكل السجلات ويُستخدم في CSV مع `fiber_source` واضح.
2. لا يوجد halal tag في القائمة الرسمية؛ لا يمكن اعتباره مفقودًا أو استنتاجه من الوصفة.
3. المشروبات العشرون صحيحة كـ`drinks`، لكنها UNCLASSIFIED فقط بالنسبة لفئات المهمة المختصرة.
4. لا يوجد `body_recomposition` ضمن suitable_goals الرسمي، بينما resolver يستطيع طلبه ثم يقبل maintenance. هذه فجوة دلالية يجب توثيقها عند بناء القوالب، وليست سببًا لتعديل الكتالوج في مهمة التدقيق.
5. كل QA checks المخزنة تمر، لكن الشاشة المحافظة لـpre/post أضيق عمدًا من مجرد meal_type.

## الوجبات التي لا تمر شاشة Pre/Post المحافظة

- Pre رسمي: 25; يمر: 13; يحتاج مراجعة توقيت/ثقل: 12.
- Post رسمي: 30; يمر: 18; يحتاج مراجعة بروتين/دهون: 12.
- هذه Flags تحليلية فقط، وليست أخطاء كتالوج ولا تعدل status.
