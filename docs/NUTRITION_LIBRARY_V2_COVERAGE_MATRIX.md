# مصفوفة تغطية مكتبة التغذية V2

## التغطية حسب هدف التغذية ونوع الوجبة

| الهدف | الإجمالي | فطور | غداء | عشاء | سناك | Pre رسمي | Post رسمي | مشروبات | Pre محافظ | Post محافظ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| fat_loss | 297 | 55 | 70 | 60 | 40 | 23 | 30 | 19 | 13 | 18 |
| maintenance | 300 | 55 | 70 | 60 | 40 | 25 | 30 | 20 | 13 | 18 |
| muscle_gain | 247 | 43 | 64 | 51 | 29 | 18 | 29 | 13 | 8 | 18 |

## نطاقات الماكروز حسب الفئة

القيم minimum / median / maximum.

| الفئة | السعرات | البروتين | الكربوهيدرات | الدهون |
|---|---:|---:|---:|---:|
| BREAKFAST | 268 / 423 / 632 | 11.5 / 25.2 / 43.5 | 17.4 / 47.1 / 88.9 | 1.1 / 14.2 / 37.1 |
| MAIN_MEAL | 351 / 570.5 / 929 | 14.4 / 34.1 / 63.5 | 12.9 / 57.2 / 133.7 | 6.2 / 21.6 / 49.6 |
| SNACK | 134 / 273 / 450 | 5.9 / 14.8 / 27.6 | 13.4 / 25.5 / 87.8 | 0.5 / 6.9 / 34.9 |
| PRE_WORKOUT | 167 / 322 / 502 | 9.9 / 19.7 / 31.9 | 11.8 / 46.3 / 79.8 | 0.6 / 6.4 / 24.4 |
| POST_WORKOUT | 249 / 452.5 / 680 | 11.7 / 31.1 / 39.3 | 20 / 55.1 / 93.6 | 2.5 / 15.1 / 38.7 |
| UNCLASSIFIED | 144 / 262.5 / 512 | 6.6 / 14.9 / 29 | 12.2 / 38 / 77.8 | 1.5 / 7.1 / 25.7 |

## حزم السعرات

| الفئة | <250 | 250–399 | 400–549 | 550–699 | 700+ |
|---|---:|---:|---:|---:|---:|
| BREAKFAST | 0 | 19 | 32 | 4 | 0 |
| MAIN_MEAL | 0 | 16 | 40 | 39 | 35 |
| SNACK | 15 | 15 | 10 | 0 | 0 |
| PRE_WORKOUT | 7 | 11 | 7 | 0 | 0 |
| POST_WORKOUT | 1 | 6 | 13 | 10 | 0 |
| UNCLASSIFIED | 8 | 6 | 6 | 0 | 0 |

## حزم البروتين

| الفئة | <15g | 15–24g | 25–34g | 35–44g | 45g+ |
|---|---:|---:|---:|---:|---:|
| BREAKFAST | 8 | 9 | 26 | 12 | 0 |
| MAIN_MEAL | 2 | 17 | 50 | 49 | 12 |
| SNACK | 21 | 14 | 5 | 0 | 0 |
| PRE_WORKOUT | 10 | 10 | 5 | 0 | 0 |
| POST_WORKOUT | 2 | 5 | 13 | 10 | 0 |
| UNCLASSIFIED | 10 | 7 | 3 | 0 | 0 |

## الجاهزية حسب أهداف العميل الرسمية

| أهداف العميل | سلة التغذية | الحكم | السبب |
|---|---|---|---|
| FAT_LOSS, WAIST_DEFINITION | fat_loss/maintenance | SUFFICIENT | 297 إجماليًا؛ 55 فطورًا؛ 13 pre محافظة؛ 18 post محافظة |
| MUSCLE_GAIN, GLUTE_GROWTH | muscle_gain | LIMITED | 247 إجماليًا؛ 43 فطورًا؛ لكن 8 pre محافظة فقط |
| BODY_RECOMPOSITION | maintenance fallback | LIMITED | 300 maintenance لكن لا يوجد وسم body_recomposition في V2 |
| UPPER_BODY_DEFINITION, FEMININE_BALANCED_BODY | maintenance/muscle_gain حسب الملف | LIMITED | وفرة عامة، لكن التخصيص يعتمد على الملف وليس وسمًا مستقلاً |
| STRENGTH_PERFORMANCE | maintenance/muscle_gain | SUFFICIENT | 300 maintenance و247 muscle_gain |
| FITNESS_ENDURANCE, GENERAL_HEALTH_FITNESS | maintenance/fat_loss | SUFFICIENT | 300 maintenance و297 fat_loss |
| MOBILITY_RECOVERY, POSTURE_BACK_HEALTH | maintenance | SUFFICIENT | كل السجلات الـ300 تحمل maintenance |

## تنويع 7 و14 يومًا

بدل عرض نواتج ضرب نظرية بالمليارات، يقيس التدقيق الحد الأدنى من المرشحين في الخانة التي تقيد التنويع.

| السلة | أقل مخزون core | Pre محافظ | Post محافظ | 7 أيام بلا تكرار | 14 يومًا بلا تكرار |
|---|---:|---:|---:|---|---|
| fat_loss | 40 (snack) | 13 | 18 | YES | PARTIAL: تكرار pre مرة واحدة |
| maintenance | 40 (snack) | 13 | 18 | YES | PARTIAL: تكرار pre مرة واحدة |
| muscle_gain | 29 (snack) | 8 | 18 | YES | NO في pre: ستة مواضع مكررة |

فطور FREE: 55 رسميًا؛ fat_loss=55، maintenance=55، muscle_gain=43. السعرات 268–632 والبروتين 11.5–43.5g. **FREE_BREAKFAST_COVERAGE: READY**.
