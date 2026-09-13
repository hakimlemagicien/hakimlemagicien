# TRAINING TEMPLATE — Exercise Sequence Master V1 (Final Canonical)

**Phase:** 9/10  
**Task:** FINAL_CANONICAL_MASTER_RECONCILIATION  
**Generated:** 2026-09-13T00:52:54.831Z  
**Validator:** PASS  
**Import authorization:** NOT_AUTHORIZED  
**DB writes:** 0  

## ملخص

حزمة التسلسلات تطابق **Locked Product Master** حرفيًا:

| البند | القيمة |
|-------|--------|
| HISTORICAL_MASTER_LABEL | 36/36 |
| ACTUAL_CANONICAL_ENTRY_COUNT | **37** |
| PILOT | 4 |
| REMAINING SEQUENCES | 33 |
| CONTENT_APPROVED_FOR_IMPORT | 33 |
| PENDING_LIBRARY_ADDITION | 0 |
| BLOCKED | 0 |
| BROKEN_REFERENCES | 0 |
| TOTAL_STATUS_SUM | 37 |

**سبب تصحيح التسمية:** التقسيم التاريخي رقم 06 انقسم إلى 06A و06B كقالبين مستقلين، بينما استمرت الترقيم حتى 36 — فالتسمية «36/36» عيب ترقيم وليست عددًا فيزيائيًا.

**ماستر 33 السابق:** REJECTED / CORRECTED

**06A / 06B:** قالبان مستقلان — `MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D` و `MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D`

---

## Pilot (ALREADY_IMPORTED)

- `FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D`
- `STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D`
- `MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D`
- `ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D`

---

## FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D

- الاستراتيجية: `FAT_LOSS` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: مبتدئ صالة لخسارة الدهون بتردد 4 أيام.
- الغرض: تأسيس مقاومة Upper/Lower + مشي سريع على الجهاز قبل وبعد الجلسة.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- ملاحظة: قالب مستقل عن Pilot GYM 3D — لا يستبدل Intermediate HOME.
- ملاحظة: كارديو عبر ADD_TREADMILL_BRISK_WALK — ممنوع استخدام CR-001 كبديل.

### اليوم 1 — علوي أ (Upper A)

دفع/سحب تأسيسي

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×8 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×12 min · rest 0s · smart=false

### اليوم 2 — سفلي أ (Lower A)

أرجل/ألوية

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×8 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×12 min · rest 0s · smart=false

### اليوم 4 — علوي ب (Upper B)

تنويع علوي

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×8 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-013` · Shoulder Rolls · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×12 min · rest 0s · smart=false

### اليوم 5 — سفلي ب (Lower B)

تنويع سفلي

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×8 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `LE-010` · Leg Curl · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-001` · Crunch · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×12 min · rest 0s · smart=false

---

## FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `FAT_LOSS` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Full Body A/B/C
- الجمهور: مبتدئ منزلي هدفه خسارة الدهون مع مقاومة آمنة وكارديو منخفض الأثر.
- الغرض: تأسيس مقاومة كاملة الجسم + مشي سريع منزلي دون جهاز مشي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين
- ملاحظة: كارديو منزلي عبر ADD_HOME_BRISK_WALK — لا إجبار على جهاز مشي.
- ملاحظة: تمارين Core 100 / مكتبة منزلية متوافقة.

### اليوم 1 — جسم كامل أ (Full Body A)

مقاومة شاملة + مشي

- **GENERAL_WARM_UP** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · GENERAL_WARM_UP · 1×8 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 3 — جسم كامل ب (Full Body B)

تنويع أنماط الحركة

- **GENERAL_WARM_UP** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · GENERAL_WARM_UP · 1×8 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 5 — جسم كامل ج (Full Body C)

تغطية عضلية متوازنة

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

---

## FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `FAT_LOSS` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: متوسط صالة يهدف لخسارة الدهون مع حجم مقاومة أعلى.
- الغرض: تقدّم مقاومة Upper/Lower مع مشي سريع 10+15 كل جلسة.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — علوي أ (Upper A)

دفع/سحب علوي

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×10 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 2 — سفلي أ (Lower A)

رباعية/خلفية/ألوية

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×10 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 4 — علوي ب (Upper B)

تنويع زوايا

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×10 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-013` · Shoulder Rolls · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-002` · Incline Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 5 — سفلي ب (Lower B)

تنويع أنماط

- **GENERAL_WARM_UP** · `CR-026` · Treadmill Brisk Walk · GENERAL_WARM_UP · 1×10 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×45 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `LE-010` · Leg Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-001` · Crunch · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-026` · Treadmill Brisk Walk · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

---

## MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `MUSCLE_GAIN` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Full Body A/B/C
- الجمهور: مبتدئ صالة لبناء العضلات.
- الغرض: تأسيس تضخيم بجسم كامل دون كارديو إلزامي ودون فشل إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — جسم كامل أ (Full Body A)

مركّبات أساسية

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 3 — جسم كامل ب (Full Body B)

تنويع أنماط

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 5 — جسم كامل ج (Full Body C)

توازن عضلي

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

---

## MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `MUSCLE_GAIN` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: متوسط منزلي لبناء العضلات.
- الغرض: حجم تضخيم منزلي أعلى بدون كارديو إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — علوي أ (Upper A)

دفع/سحب

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-019` · Seated Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-003` · Hammer Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 2 — سفلي أ (Lower A)

أرجل/ألوية

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-013` · Step Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 4 — علوي ب (Upper B)

تنويع علوي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-006` · Dumbbell Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 5 — سفلي ب (Lower B)

تنويع سفلي

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-017` · Kettlebell Swing · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

---

## MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D

- الاستراتيجية: `MUSCLE_GAIN` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: متوسط صالة لتضخيم بنمط Upper/Lower (06A).
- الغرض: قالب مستقل عن 06B — حجم تضخيم 4 أيام بلا كارديو إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- ملاحظة: هوية تاريخية 06A — لا تُدمج مع Advanced Split 06B.

### اليوم 1 — علوي أ (Upper A)

دفع/سحب

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true

### اليوم 2 — سفلي أ (Lower A)

أرجل/ألوية

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_2** · `BA-022` · Conventional Deadlift · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_4** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_6** · `AB-001` · Crunch · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true

### اليوم 4 — علوي ب (Upper B)

تنويع علوي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-002` · Incline Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 5 — سفلي ب (Lower B)

تنويع سفلي

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `LE-010` · Leg Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

---

## MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D

- الاستراتيجية: `MUSCLE_GAIN` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **5**
- التقسيم: Push / Pull / Legs / Upper / Lower
- الجمهور: متوسط صالة لتقسيم متقدم 5 أيام (06B).
- الغرض: قالب مستقل عن 06A — تغطية عضلية أوسع بلا كارديو إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- ملاحظة: هوية تاريخية 06B — Advanced Split — لا تُختزل إلى مفتاح Progress عام.

### اليوم 1 — دفع (Push)

صدر/كتف/تراي

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-013` · Shoulder Rolls · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-002` · Incline Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-005` · Close Grip Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true

### اليوم 2 — سحب (Pull)

ظهر/باي

- **GENERAL_WARM_UP** · `WU-010` · Band Pull Apart · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-006` · Cable Curl · MAIN_RESISTANCE · 3×8-10 · rest 90s · smart=true

### اليوم 3 — أرجل (Legs)

سفلي مركّب

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_2** · `BA-022` · Conventional Deadlift · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_4** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true
- **MAIN_EXERCISE_6** · `LE-010` · Leg Curl · MAIN_RESISTANCE · 3×8-10 · rest 120s · smart=true

### اليوم 4 — علوي (Upper)

علوي مكمّل

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-010` · Machine Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-018` · Machine Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 5 — سفلي (Lower)

سفلي مكمّل

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-028` · Seated Leg Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-001` · Crunch · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

---

## BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `BODY_RECOMPOSITION` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Full Body A/B/C
- الجمهور: مبتدئ صالة لإعادة التركيب (مقاومة + كارديو معتمد).
- الغرض: مقاومة كاملة + 10 دقائق كارديو بعد كل جلسة (30 د/أسبوع).
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- ملاحظة: كارديو بعدي عبر دراجة ثابتة CR-002 — موجود ومعتمد.

### اليوم 1 — جسم كامل أ (Full Body A)

مقاومة + كارديو معتدل

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 3 — جسم كامل ب (Full Body B)

تنويع

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — جسم كامل ج (Full Body C)

توازن

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-001` · Treadmill Run · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `BODY_RECOMPOSITION` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Full Body A/B/C
- الجمهور: مبتدئ منزلي لإعادة التركيب.
- الغرض: مقاومة منزلية + مشي سريع 10 د بعد كل جلسة.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — جسم كامل أ (Full Body A)

مقاومة + مشي

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 3 — جسم كامل ب (Full Body B)

تنويع

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — جسم كامل ج (Full Body C)

توازن

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-003` · Hammer Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `BODY_RECOMPOSITION` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: متوسط صالة لإعادة التركيب.
- الغرض: Upper/Lower + 10 د كارديو/جلسة (40 د/أسبوع).
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — علوي أ (Upper A)

علوي + كارديو

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 2 — سفلي أ (Lower A)

سفلي + كارديو

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 4 — علوي ب (Upper B)

تنويع علوي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-002` · Incline Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-001` · Treadmill Run · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — سفلي ب (Lower B)

تنويع سفلي

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `LE-010` · Leg Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-001` · Crunch · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `BODY_RECOMPOSITION` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: متوسط منزلي لإعادة التركيب.
- الغرض: Upper/Lower منزلي + مشي 10 د بعد كل جلسة.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — علوي أ (Upper A)

علوي

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-003` · Hammer Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 2 — سفلي أ (Lower A)

سفلي

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-013` · Step Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 4 — علوي ب (Upper B)

تنويع

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-006` · Dumbbell Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — سفلي ب (Lower B)

تنويع

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-017` · Kettlebell Swing · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `GENERAL_FITNESS` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Full Body A/B/C
- الجمهور: مبتدئ صالة للياقة العامة.
- الغرض: إحماء 5–10 + مقاومة + كارديو معتدل 10 — بلا HIIT إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — جسم كامل أ (Full Body A)

لياقة متوازنة

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 3 — جسم كامل ب (Full Body B)

تنويع

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — جسم كامل ج (Full Body C)

توازن

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-001` · Treadmill Run · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `GENERAL_FITNESS` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Full Body A/B/C
- الجمهور: مبتدئ منزلي للياقة العامة.
- الغرض: مقاومة منزلية + مشي/منخفض الأثر 10 د.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — جسم كامل أ (Full Body A)

لياقة

- **GENERAL_WARM_UP** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · GENERAL_WARM_UP · 1×5 min · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 3 — جسم كامل ب (Full Body B)

تنويع

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — جسم كامل ج (Full Body C)

توازن + مشي في المكان كمكمّل منخفض الأثر

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `WU-023` · March in Place · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `GLUTE_FOCUS` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Glute Priority Full Body A/B/C
- الجمهور: مبتدئة/مبتدئ صالة لتركيز الألوية مع توازن سفلي.
- الغرض: مقاومة تركز الألوية مع دعم سفلي وجذع — بلا ادعاءات حرق موضعي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- تفضيل الميديا: FEMALE / FEMALE
- ملاحظة: تسلسل من المكتبة الحالية — جاهز للاستيراد؛ الإطلاق يتطلب ميديا أنثوية.

### اليوم 1 — ألوية أ (Glute A)

دفع ورك + رباعية

- **GENERAL_WARM_UP** · `WU-003` · Hip Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true

### اليوم 3 — ألوية ب (Glute B)

مفصلة خلفية + تباعد

- **GENERAL_WARM_UP** · `WU-020` · Hip Openers · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-015` · Banded Lateral Walk · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true

### اليوم 5 — ألوية ج (Glute C)

توازن سفلي وعلوي خفيف

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `GL-006` · Single Leg Hip Thrust · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×10-12 · rest 75s · smart=true

---

## GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `GLUTE_FOCUS` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Glute Lower / Upper Support ×2
- الجمهور: متوسط صالة لتركيز الألوية بحجم أعلى.
- الغرض: تقدم حجم ألوية مع دعم علوي متوازن.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- تفضيل الميديا: FEMALE / FEMALE

### اليوم 1 — سفلي ألوية أ (Glute Lower A)

دفع ورك ثقيل

- **GENERAL_WARM_UP** · `WU-003` · Hip Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 2 — علوي داعم أ (Upper Support A)

توازن علوي

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 4 — سفلي ألوية ب (Glute Lower B)

تنويع ألوية

- **GENERAL_WARM_UP** · `WU-020` · Hip Openers · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-006` · Single Leg Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-015` · Banded Lateral Walk · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

### اليوم 5 — علوي داعم ب (Upper Support B)

تنويع علوي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true

---

## ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `ATHLETIC_PERFORMANCE` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Full Body + Power Skill
- الجمهور: مبتدئ صالة لأداء رياضي تأسيسي.
- الغرض: مهارة قوة منخفضة التعقيد + 6 مقاومة — بلا قفز/أولمبي إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — رياضي أ (Athletic A)

جودة حركة + قوة

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `FO-003` · Farmer's Walk · POWER_SKILL_BLOCK · 1×20 m × 3 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

### اليوم 3 — رياضي ب (Athletic B)

تنويع

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `GL-017` · Kettlebell Swing · POWER_SKILL_BLOCK · 3×6-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

### اليوم 5 — رياضي ج (Athletic C)

توازن

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `CH-004` · Push Up · POWER_SKILL_BLOCK · 3×5-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

---

## ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `ATHLETIC_PERFORMANCE` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Upper/Lower + Power
- الجمهور: متوسط صالة لأداء رياضي.
- الغرض: قوة مهارة + مقاومة أعلى — بلا أولمبي إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — علوي أ (Upper A)

علوي + قوة

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `FO-003` · Farmer's Walk · POWER_SKILL_BLOCK · 1×30 m × 3 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×5-8 · rest 120s · smart=true
- **MAIN_EXERCISE_2** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×5-8 · rest 120s · smart=true
- **MAIN_EXERCISE_3** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×5-8 · rest 120s · smart=true
- **MAIN_EXERCISE_4** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×5-8 · rest 120s · smart=true
- **MAIN_EXERCISE_5** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×5-8 · rest 120s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×5-8 · rest 120s · smart=true

### اليوم 2 — سفلي أ (Lower A)

سفلي + قوة

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `GL-017` · Kettlebell Swing · POWER_SKILL_BLOCK · 3×5-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `LE-009` · Leg Extension · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

### اليوم 4 — علوي ب (Upper B)

تنويع

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `CH-004` · Push Up · POWER_SKILL_BLOCK · 3×5-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-002` · Incline Bench Press · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_2** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_4** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_6** · `TR-002` · Rope Pushdown · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true

### اليوم 5 — سفلي ب (Lower B)

تنويع

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `LE-007` · Walking Lunge · POWER_SKILL_BLOCK · 3×6-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_2** · `BA-022` · Conventional Deadlift · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_3** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_4** · `LE-010` · Leg Curl · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×6-10 · rest 120s · smart=true

---

## ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `ATHLETIC_PERFORMANCE` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Upper/Lower + Power
- الجمهور: متوسط منزلي لأداء رياضي.
- الغرض: مهارة قوة منزلية بلا قفز إلزامي + مقاومة.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — علوي أ (Upper A)

علوي

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `FO-003` · Farmer's Walk · POWER_SKILL_BLOCK · 1×20 m × 3 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-003` · Hammer Curl · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

### اليوم 2 — سفلي أ (Lower A)

سفلي

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `GL-017` · Kettlebell Swing · POWER_SKILL_BLOCK · 3×6-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `LE-013` · Step Up · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

### اليوم 4 — علوي ب (Upper B)

تنويع

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `CH-004` · Push Up · POWER_SKILL_BLOCK · 3×5-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-006` · Dumbbell Kickback · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

### اليوم 5 — سفلي ب (Lower B)

تنويع

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **POWER_SKILL_BLOCK** · `LE-007` · Walking Lunge · POWER_SKILL_BLOCK · 3×6-8 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `GL-017` · Kettlebell Swing · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×6-10 · rest 90s · smart=true

---

## STRENGTH_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `STRENGTH` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Full Body Strength A/B/C
- الجمهور: مبتدئ صالة للقوة.
- الغرض: 3 إحماءات عامة + ramp-up عند الحاجة + 6 رئيسية — بلا كارديو إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — قوة أ (Strength A)

قرفصاء/ضغط/سحب

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `LE-003` · Goblet Squat · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

### اليوم 3 — قوة ب (Strength B)

تنويع أساسي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `CH-003` · Dumbbell Bench Press · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

### اليوم 5 — قوة ج (Strength C)

توازن

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `BA-010` · Barbell Row · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

---

## STRENGTH_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `STRENGTH` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Full Body Strength A/B/C
- الجمهور: مبتدئ منزلي للقوة.
- الغرض: 3 إحماءات + ramp-up عند الحاجة + 6 رئيسية منزلية — بلا كارديو إلزامي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — قوة أ (Strength A)

قرفصاء/ضغط/سحب

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `LE-003` · Goblet Squat · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

### اليوم 3 — قوة ب (Strength B)

تنويع

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `CH-004` · Push Up · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-019` · Seated Dumbbell Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

### اليوم 5 — قوة ج (Strength C)

توازن

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `BA-021` · Inverted Row · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

---

## STRENGTH_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `STRENGTH` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Upper / Lower ×2
- الجمهور: متوسط منزلي للقوة.
- الغرض: Upper/Lower منزلي مع ramp-up — Progress GYM 4D هو Pilot المستورد.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — علوي أ (Upper A)

دفع/سحب

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `CH-007` · Incline Dumbbell Press · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_2** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_3** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_4** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_5** · `BI-003` · Hammer Curl · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true

### اليوم 2 — سفلي أ (Lower A)

أرجل

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `LE-003` · Goblet Squat · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_2** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_4** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_5** · `LE-013` · Step Up · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 4×4-6 · rest 180s · smart=true

### اليوم 4 — علوي ب (Upper B)

تنويع

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-019` · Arm Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `SH-019` · Seated Dumbbell Press · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `SH-019` · Seated Dumbbell Press · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `TR-006` · Dumbbell Kickback · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

### اليوم 5 — سفلي ب (Lower B)

تنويع

- **GENERAL_WARM_UP** · `WU-002` · Leg Swings · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-022` · Glute Bridge March · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **EXERCISE_SPECIFIC_RAMP_UP** · `LE-007` · Walking Lunge · EXERCISE_SPECIFIC_RAMP_UP · 2×5-5 · rest 90s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_2** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_3** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_4** · `GL-017` · Kettlebell Swing · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_5** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×5-8 · rest 150s · smart=true

---

## ENDURANCE_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `ENDURANCE` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Resistance + Aerobic
- الجمهور: مبتدئ صالة للتحمّل.
- الغرض: مقاومة خفيفة-متوسطة + 15 د هوائي بعدي/جلسة — ليس HIIT.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — تحمّل أ (Endurance A)

مقاومة + هوائي

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-002` · Stationary Bike · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

### اليوم 3 — تحمّل ب (Endurance B)

تنويع

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-001` · Treadmill Run · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

### اليوم 5 — تحمّل ج (Endurance C)

توازن

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-002` · Stationary Bike · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

---

## ENDURANCE_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `ENDURANCE` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Resistance + Aerobic Walk
- الجمهور: مبتدئ منزلي للتحمّل بلا آلات.
- الغرض: مقاومة منزلية + مشي سريع 15 د ككتلة هوائية.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — تحمّل أ (Endurance A)

مقاومة + مشي

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

### اليوم 3 — تحمّل ب (Endurance B)

تنويع

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

### اليوم 5 — تحمّل ج (Endurance C)

توازن

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

---

## ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `ENDURANCE` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Resistance + Aerobic / Controlled Intervals
- الجمهور: متوسط صالة للتحمّل.
- الغرض: مقاومة + هوائي بإجمالي ~75 د/أسبوع بعدي/كتل — فواصل مضبوطة ≠ HIIT.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- ملاحظة: توزيع الكارديو الأسبوعي: 20+20+20+15 = 75 دقيقة.

### اليوم 1 — تحمّل أ (Endurance A)

مقاومة + هوائي

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-002` · Stationary Bike · AEROBIC_ENDURANCE_BLOCK · 1×20 min · rest 0s · smart=false

### اليوم 2 — تحمّل ب (Endurance B)

مقاومة + فواصل مضبوطة

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `TR-001` · Tricep Pushdown · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **CONTROLLED_AEROBIC_INTERVAL_BLOCK** · `CR-001` · Treadmill Run · CONTROLLED_AEROBIC_INTERVAL_BLOCK · 1×20 min (1:1 easy/moderate) · rest 0s · smart=false

### اليوم 4 — تحمّل ج (Endurance C)

مقاومة + هوائي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-002` · Stationary Bike · AEROBIC_ENDURANCE_BLOCK · 1×20 min · rest 0s · smart=false

### اليوم 5 — تحمّل د (Endurance D)

مقاومة + هوائي

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-10 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×8-10 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-10 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×8-10 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `BA-023` · Romanian Deadlift · MAIN_RESISTANCE · 3×8-10 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `BI-001` · Barbell Curl · MAIN_RESISTANCE · 3×8-10 · rest 75s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-001` · Treadmill Run · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

---

## ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `ENDURANCE` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Resistance + Aerobic Walk Progress
- الجمهور: متوسط منزلي للتحمّل.
- الغرض: مقاومة منزلية + مشي سريع بإجمالي ~75 د/أسبوع (20+20+20+15).
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين
- ملاحظة: كارديو منزلي عبر ADD_HOME_BRISK_WALK — 75 د/أسبوع حسب سياسة التحمّل المتوسط.

### اليوم 1 — تحمّل أ (Endurance A)

مقاومة + مشي

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×20 min · rest 0s · smart=false

### اليوم 2 — تحمّل ب (Endurance B)

تنويع + مشي

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BI-002` · Dumbbell Curl · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `TR-003` · Overhead Tricep Extension · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×20 min · rest 0s · smart=false

### اليوم 4 — تحمّل ج (Endurance C)

توازن + مشي

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×10-12 · rest 60s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×20 min · rest 0s · smart=false

### اليوم 5 — تحمّل د (Endurance D)

مكمّل + مشي

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-019` · Seated Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **AEROBIC_ENDURANCE_BLOCK** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · AEROBIC_ENDURANCE_BLOCK · 1×15 min · rest 0s · smart=false

---

## MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `MOBILITY_FUNCTIONAL` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Mobility + Functional Strength
- الجمهور: مبتدئ منزلي لحركة وظيفية ومدى حركة قابل للاستخدام.
- الغرض: جودة حركة + أنماط وظيفية — بلا إنهاك وبلا تمدد ثابت إلزامي كختام.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — حركة أ (Mobility A)

ورك/عمود/ثبات

- **GENERAL_WARM_UP** · `WU-008` · Cat Cow · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-009` · 90/90 Hip Switch · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 3 — حركة ب (Mobility B)

كتف/صدر/ورك

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `SH-014` · Y Raise · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `GL-010` · Clamshell · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-002` · Thoracic Extension · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 5 — حركة ج (Mobility C)

توازن وظيفي

- **GENERAL_WARM_UP** · `WU-009` · World's Greatest Stretch · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `AB-012` · Pallof Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-007` · Ankle Mobility Drill · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

---

## MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `MOBILITY_FUNCTIONAL` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Mobility + Functional Strength
- الجمهور: مبتدئ صالة لحركة وظيفية.
- الغرض: مدى حركة قابل للاستخدام + أنماط وظيفية في الصالة.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — حركة أ (Mobility A)

ورك/ثبات

- **GENERAL_WARM_UP** · `WU-008` · Cat Cow · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-009` · 90/90 Hip Switch · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 3 — حركة ب (Mobility B)

كتف/ظهر

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `SH-014` · Y Raise · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `GL-010` · Clamshell · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-011` · Wall Slides · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 5 — حركة ج (Mobility C)

وظيفي

- **GENERAL_WARM_UP** · `WU-009` · World's Greatest Stretch · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `GL-015` · Banded Lateral Walk · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `AB-012` · Pallof Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-015` · Cossack Squat · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

---

## MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `MOBILITY_FUNCTIONAL` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Mobility + Functional Strength Progress A–D
- الجمهور: متوسط صالة لجودة حركة أعلى.
- الغرض: تقدم أنماط وظيفية ومدى حركة مضبوط في الصالة — 4 أيام.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — حركة أ (Mobility A)

ورك متقدم

- **GENERAL_WARM_UP** · `WU-008` · Cat Cow · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-009` · World's Greatest Stretch · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-023` · Copenhagen Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-010` · Deep Squat Hold · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 2 — حركة ب (Mobility B)

كتف/صدر

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `SH-014` · Y Raise · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `GL-010` · Clamshell · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-012` · Pallof Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-018` · Thread the Needle · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 4 — حركة ج (Mobility C)

وظيفي

- **GENERAL_WARM_UP** · `WU-009` · World's Greatest Stretch · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `GL-015` · Banded Lateral Walk · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-015` · Cossack Squat · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 5 — حركة د (Mobility D)

ثبات وتوازن

- **GENERAL_WARM_UP** · `WU-008` · Cat Cow · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-005` · Hack Squat · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-011` · Wall Slides · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

---

## MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `MOBILITY_FUNCTIONAL` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Mobility + Functional Strength Progress A–D
- الجمهور: متوسط منزلي لجودة حركة أعلى.
- الغرض: تقدم أنماط وظيفية ومدى حركة مضبوط — 4 أيام حسب الماستر.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — حركة أ (Mobility A)

ورك متقدم مضبوط

- **GENERAL_WARM_UP** · `WU-008` · Cat Cow · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-009` · World's Greatest Stretch · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-023` · Copenhagen Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-010` · Deep Squat Hold · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 2 — حركة ب (Mobility B)

كتف/صدر

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-021` · Scapular Push Up · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `SH-014` · Y Raise · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `GL-010` · Clamshell · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-012` · Pallof Press · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-018` · Thread the Needle · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 4 — حركة ج (Mobility C)

وظيفي

- **GENERAL_WARM_UP** · `WU-009` · World's Greatest Stretch · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-016` · Lateral Lunge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `GL-017` · Kettlebell Swing · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-015` · Cossack Squat · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

### اليوم 5 — حركة د (Mobility D)

ثبات وتوازن

- **GENERAL_WARM_UP** · `WU-008` · Cat Cow · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_2** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_3** · `LE-013` · Step Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_4** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_5** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 60s · smart=true
- **MOBILITY_ACTIVITY** · `MO-007` · Ankle Mobility Drill · MOBILITY_ACTIVITY · 1×2 min controlled · rest 0s · smart=false

---

## HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D

- الاستراتيجية: `HEALTHY_AGING_ACTIVE_LIFE` · المستوى: `BEGINNER` · البيئة: `HOME` · الأيام: **3**
- التقسيم: Full Body Function + Aerobic
- الجمهور: مبتدئ منزلي لحياة نشطة صحية — مقاومة ذات معنى.
- الغرض: قوة وظيفية + ثبات + 10 د هوائي بعدي — الدعم ≠ فشل.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين

### اليوم 1 — حياة نشطة أ (Active Life A)

قوة ووظيفة

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 3 — حياة نشطة ب (Active Life B)

توازن وثبات

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — حياة نشطة ج (Active Life C)

وظيفة يومية

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-013` · Step Up · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D

- الاستراتيجية: `HEALTHY_AGING_ACTIVE_LIFE` · المستوى: `BEGINNER` · البيئة: `GYM` · الأيام: **3**
- التقسيم: Full Body Function + Aerobic
- الجمهور: مبتدئ صالة لحياة نشطة صحية.
- الغرض: مقاومة ذات معنى + 10 د هوائي بعدي.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**

### اليوم 1 — حياة نشطة أ (Active Life A)

قوة

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 3 — حياة نشطة ب (Active Life B)

ثبات

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

### اليوم 5 — حياة نشطة ج (Active Life C)

وظيفة

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-001` · Treadmill Run · POST_WORKOUT_CARDIO · 1×10 min · rest 0s · smart=false

---

## HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D

- الاستراتيجية: `HEALTHY_AGING_ACTIVE_LIFE` · المستوى: `INTERMEDIATE` · البيئة: `GYM` · الأيام: **4**
- التقسيم: Full Body Progress + Aerobic A–D
- الجمهور: متوسط صالة لحياة نشطة — 4 أيام.
- الغرض: مقاومة ذات معنى + 15 د هوائي بعدي/جلسة = 60 د/أسبوع.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- ملاحظة: كارديو 15×4=60 عبر دراجة/جري موجود — ليس مشي سريع مطلوبًا.

### اليوم 1 — حياة نشطة أ (Active Life A)

قوة متقدمة

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-012` · Machine Chest Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-006` · Lat Pulldown · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-002` · Dumbbell Shoulder Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-001` · Hip Thrust · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 2 — حياة نشطة ب (Active Life B)

ثبات

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-004` · Leg Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-003` · Dumbbell Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-016` · Seated Cable Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 4 — حياة نشطة ج (Active Life C)

وظيفة

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-010` · Barbell Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-007` · Hip Abduction Machine · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-001` · Treadmill Run · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 5 — حياة نشطة د (Active Life D)

توازن أسبوعي

- **GENERAL_WARM_UP** · `WU-015` · Light Jog · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-001` · Back Squat · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_2** · `CH-001` · Bench Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_3** · `BA-017` · Chest Supported Row · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_4** · `SH-001` · Overhead Press · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_5** · `GL-003` · Cable Kickback · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 90s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-002` · Stationary Bike · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

---

## HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D

- الاستراتيجية: `HEALTHY_AGING_ACTIVE_LIFE` · المستوى: `INTERMEDIATE` · البيئة: `HOME` · الأيام: **4**
- التقسيم: Full Body Progress + Aerobic A–D
- الجمهور: متوسط منزلي لحياة نشطة — 4 أيام حسب الماستر.
- الغرض: مقاومة ذات معنى + 15 د هوائي بعدي/جلسة = 60 د/أسبوع.
- حالة المحتوى: **CONTENT_APPROVED_FOR_IMPORT**
- مراجعة توافق العميل (HOME): مطلوبة عند التعيين
- ملاحظة: أيام القالب 4 حسب الماستر؛ كارديو 15×4=60.

### اليوم 1 — حياة نشطة أ (Active Life A)

قوة متقدمة

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-001` · Arm Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-003` · Goblet Squat · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-019` · Seated Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-008` · Banded Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 2 — حياة نشطة ب (Active Life B)

ثبات

- **GENERAL_WARM_UP** · `WU-001` · Arm Circles · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-017` · Bodyweight Squat · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-008` · Reverse Lunge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-004` · Push Up · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-014` · Single Arm Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-005` · Lateral Raise · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-002` · Glute Bridge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-011` · Dead Bug · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 4 — حياة نشطة ج (Active Life C)

وظيفة

- **GENERAL_WARM_UP** · `WU-013` · Shoulder Rolls · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-010` · Band Pull Apart · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-020` · Hip Openers · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-013` · Step Up · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-013` · Diamond Push Up · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-021` · Inverted Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `FO-003` · Farmer's Walk · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-004` · Frog Pump · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-007` · Side Plank · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

### اليوم 5 — حياة نشطة د (Active Life D)

توازن أسبوعي

- **GENERAL_WARM_UP** · `WU-023` · March in Place · GENERAL_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_1** · `WU-002` · Leg Swings · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **TARGETED_WARM_UP_2** · `WU-003` · Hip Circles · TARGETED_DYNAMIC_WARM_UP · 1×40 sec · rest 0s · smart=false
- **MAIN_EXERCISE_1** · `LE-007` · Walking Lunge · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_2** · `CH-007` · Incline Dumbbell Press · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_3** · `BA-013` · Bent Over Dumbbell Row · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_4** · `SH-007` · Rear Delt Fly · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_5** · `GL-009` · Fire Hydrant · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **MAIN_EXERCISE_6** · `AB-006` · Plank · MAIN_RESISTANCE · 3×8-12 · rest 75s · smart=true
- **POST_WORKOUT_CARDIO** · `CR-027` · Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) · POST_WORKOUT_CARDIO · 1×15 min · rest 0s · smart=false

---

