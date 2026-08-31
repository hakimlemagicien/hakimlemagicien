# MAAKFIT Training Strategy — Phase 3 Core 100 Closure / Retest

**Date:** 2026-08-30  
**Scope:** Phase 3 only — Core 100 activation, validation, coverage, regression, and local build  
**Final functional status:** `PASSED — PHASE 3 CORE 100 CLOSED`  
**Release status:** No deployment, no Production change, no `main` change, no migration, and Phase 4 was not started.

## 1. Closure decision

The official `MAAKFIT_V1_CORE_100` pool now contains exactly 100 existing catalog exercises. No catalog exercise was deleted, no `external_id` was changed, and no exercise was invented. The selected pool passed catalog validation, the complete 144-scenario Strategy Matrix, coverage checks, safety regression, the full repository test suite, and the local production build.

The previous Phase 3 report is preserved as the historical blocked-state record. This document is the closure/retest record that supersedes that blocked outcome.

## 2. Validation result

| Check | Result |
|---|---:|
| Configured IDs | 100 |
| Unique IDs | 100 |
| Duplicate IDs | 0 |
| Missing from current catalog | 0 |
| V2 eligible / `APPROVED` | 100 |
| `REVIEW_REQUIRED` | 0 |
| Invalid `external_id` format | 0 |
| Active pool version | `MAAKFIT_V1_CORE_100` |

Core 100 activation is configuration-valid first, then catalog-valid against the loaded V2 exercise contracts. If the active catalog later becomes incomplete or ineligible, program context construction fails closed with `CORE_100_POOL_UNAVAILABLE`; it does not silently generate from an invalid pool.

## 3. QA matrix result

Matrix definition:

`6 canonical goals × 4 day frequencies (2–5) × 3 environments (HOME/GYM/BOTH) × 2 levels (Beginner/Intermediate) = 144 scenarios`

| Dimension | Passed | Failed |
|---|---:|---:|
| Total scenarios | 144 | 0 |
| HOME | 48 | 0 |
| GYM | 48 | 0 |
| BOTH | 48 | 0 |
| Beginner | 72 | 0 |
| Intermediate | 72 | 0 |

Every scenario returned a `READY` program, the requested number of sessions, and only IDs from the official Core 100 pool. No scenario returned `INVALID`.

| Canonical goal | 2 days | 3 days | 4 days | 5 days |
|---|---:|---:|---:|---:|
| `GLUTE_GROWTH` | 6/6 | 6/6 | 6/6 | 6/6 |
| `SLIM_TONED_WAIST` | 6/6 | 6/6 | 6/6 | 6/6 |
| `TONED_ARMS_UPPER_BODY` | 6/6 | 6/6 | 6/6 | 6/6 |
| `FEMININE_BALANCED_BODY` | 6/6 | 6/6 | 6/6 | 6/6 |
| `FAT_LOSS` | 6/6 | 6/6 | 6/6 | 6/6 |
| `POSTURE_TONED_BACK` | 6/6 | 6/6 | 6/6 | 6/6 |

The 144 validations were `VALID_WITH_WARNINGS`, not invalid. The warning totals were:

| Warning | Count | Interpretation |
|---|---:|---|
| `NEW_EXERCISE_CALIBRATION_REQUIRED` | 144 | Expected for newly generated exercises without client history; not a Core 100 coverage failure. |
| `HIGH_REGIONAL_OVERLAP` | 30 | Non-blocking program-shape warning retained for later tuning. |
| `PRIMARY_VOLUME_NEAR_MAX` | 8 | Non-blocking upper-bound proximity warning retained for later tuning. |

## 4. Coverage result

### Movement roles

`HORIZONTAL_PUSH 9`, `ELBOW_EXTENSION 10`, `VERTICAL_PULL 7`, `HORIZONTAL_PULL 7`, `HINGE 4`, `SHOULDER_EXTERNAL_ROTATION 1`, `VERTICAL_PUSH 5`, `SHOULDER_ABDUCTION 3`, `SHOULDER_FLEXION 1`, `ELBOW_FLEXION 8`, `LOADED_CARRY 1`, `SQUAT 9`, `KNEE_EXTENSION 2`, `KNEE_FLEXION 3`, `HIP_ADDUCTION 1`, `HIP_EXTENSION 9`, `HIP_ABDUCTION 4`, `CALF_RAISE 5`, `TRUNK_FLEXION 2`, `ANTI_EXTENSION 4`, `LATERAL_STABILITY 2`, `ANTI_ROTATION 3`.

All 18 required Strategy Matrix roles have at least two Core alternatives, including at least one HOME-compatible and one GYM-compatible choice. Optional/support roles remain represented where the current catalog provides them.

### Primary muscle families

`CHEST 9`, `TRICEPS 10`, `BACK 13`, `HAMSTRINGS 6`, `SHOULDERS 11`, `BICEPS 8`, `FOREARMS 1`, `QUADRICEPS 11`, `ADDUCTORS 1`, `GLUTES 14`, `CALVES 5`, `CORE 11`.

Every required primary family has at least three Core exercises.

### Equipment and locations

| Coverage | Count |
|---|---:|
| Barbell | 13 |
| Bench | 7 |
| Dumbbells | 31 |
| No equipment | 22 |
| Cable station | 10 |
| Machine | 13 |
| Parallel bars | 2 |
| Pull-up bar | 3 |
| Assisted pull-up machine | 1 |
| Resistance band | 3 |
| Kettlebell | 1 |
| Ab wheel | 1 |
| HOME-compatible | 63 |
| GYM-compatible | 100 |

**Required substitution gaps:** 0.

## 5. Official Core 100 and filming order

`P1 = ranks 1–40 (launch critical)`, `P2 = ranks 41–80 (coverage/substitutions)`, `P3 = ranks 81–100 (variety/advanced coverage)`.

Location is expressed as the production label requested for filming: `BOTH` means the current catalog marks the exercise usable at HOME and GYM.

| # | external_id | English name | الاسم العربي | Primary muscle | Movement | Location | Equipment | Film |
|---:|---|---|---|---|---|---|---|---|
| 1 | `AB-006` | Plank | بلانك | RECTUS_ABDOMINIS | ANTI_EXTENSION | BOTH | NO_EQUIPMENT | P1 |
| 2 | `BA-001` | Pull Up | سحب عالي | LATS | VERTICAL_PULL | BOTH | PULL_UP_BAR | P1 |
| 3 | `BA-010` | Barbell Row | روو بالبار | UPPER_BACK | HORIZONTAL_PULL | GYM | BARBELL | P1 |
| 4 | `CH-013` | Diamond Push Up | ضغط ماسة | TRICEPS | ELBOW_EXTENSION | BOTH | NO_EQUIPMENT | P1 |
| 5 | `GL-001` | Hip Thrust | هيب ثراست | GLUTES | HIP_EXTENSION | GYM | BARBELL + BENCH | P1 |
| 6 | `SH-001` | Overhead Press | ضغط فوق الرأس | SHOULDERS | VERTICAL_PUSH | GYM | BARBELL | P1 |
| 7 | `LE-001` | Back Squat | سكوات خلفي | QUADRICEPS | SQUAT | GYM | BARBELL | P1 |
| 8 | `BA-013` | Bent Over Dumbbell Row | روو دمبل منحني | UPPER_BACK | HORIZONTAL_PULL | BOTH | DUMBBELLS | P1 |
| 9 | `GL-002` | Glute Bridge | جسر الأرداف | GLUTES | HIP_EXTENSION | BOTH | NO_EQUIPMENT | P1 |
| 10 | `SH-002` | Dumbbell Shoulder Press | ضغط كتف دمبل | SHOULDERS | VERTICAL_PUSH | BOTH | DUMBBELLS | P1 |
| 11 | `BI-001` | Barbell Curl | بايسيبس بار | BICEPS | ELBOW_FLEXION | GYM | BARBELL | P1 |
| 12 | `GL-017` | Kettlebell Swing | سوينغ كيتل بيل | GLUTES | HINGE | BOTH | KETTLEBELL | P1 |
| 13 | `BA-023` | Romanian Deadlift | ديدليفت روماني | HAMSTRINGS | HINGE | GYM | BARBELL | P1 |
| 14 | `BA-022` | Conventional Deadlift | ديدليفت تقليدي | HAMSTRINGS | HINGE | GYM | BARBELL | P1 |
| 15 | `AB-008` | Russian Twist | لف روسي | OBLIQUES | ANTI_ROTATION | BOTH | NO_EQUIPMENT | P1 |
| 16 | `LE-003` | Goblet Squat | جوبلت سكوات | QUADRICEPS | SQUAT | BOTH | DUMBBELLS | P1 |
| 17 | `CH-001` | Bench Press | بنش برس | CHEST | HORIZONTAL_PUSH | GYM | BARBELL + BENCH | P1 |
| 18 | `BI-002` | Dumbbell Curl | بايسيبس دمبل | BICEPS | ELBOW_FLEXION | BOTH | DUMBBELLS | P1 |
| 19 | `LE-010` | Leg Curl | ثني الرجل | HAMSTRINGS | KNEE_FLEXION | BOTH | DUMBBELLS | P1 |
| 20 | `CH-003` | Dumbbell Bench Press | بنش دمبل | CHEST | HORIZONTAL_PUSH | BOTH | DUMBBELLS + BENCH | P1 |
| 21 | `GL-007` | Hip Abduction Machine | تبعيد الورك | GLUTEUS_MEDIUS | HIP_ABDUCTION | GYM | MACHINE | P1 |
| 22 | `GL-009` | Fire Hydrant | مرآة الحريق | GLUTEUS_MEDIUS | HIP_ABDUCTION | BOTH | NO_EQUIPMENT | P1 |
| 23 | `CH-004` | Push Up | ضغط | CHEST | HORIZONTAL_PUSH | BOTH | NO_EQUIPMENT | P1 |
| 24 | `BA-006` | Lat Pulldown | سحب لات | LATS | VERTICAL_PULL | GYM | MACHINE | P1 |
| 25 | `BA-014` | Single Arm Dumbbell Row | روو دمبل بيد واحدة | UPPER_BACK | HORIZONTAL_PULL | BOTH | DUMBBELLS | P1 |
| 26 | `SH-005` | Lateral Raise | رفرفة جانبية | LATERAL_DELTOID | SHOULDER_ABDUCTION | BOTH | DUMBBELLS | P1 |
| 27 | `TR-001` | Tricep Pushdown | ترايسيبس بول داون | TRICEPS | ELBOW_EXTENSION | GYM | CABLE_STATION | P1 |
| 28 | `TR-003` | Overhead Tricep Extension | امتداد ترايسيبس فوق الرأس | TRICEPS | ELBOW_EXTENSION | BOTH | DUMBBELLS | P1 |
| 29 | `LE-004` | Leg Press | ضغط رجلين | QUADRICEPS | SQUAT | GYM | MACHINE | P1 |
| 30 | `LE-007` | Walking Lunge | اندفاع مشي | QUADRICEPS | SQUAT | BOTH | DUMBBELLS | P1 |
| 31 | `LE-008` | Reverse Lunge | اندفاع خلفي | QUADRICEPS | SQUAT | BOTH | DUMBBELLS | P1 |
| 32 | `LE-009` | Leg Extension | امتداد الرجل | QUADRICEPS | KNEE_EXTENSION | GYM | MACHINE | P1 |
| 33 | `GL-003` | Cable Kickback | كيك باك كيبل | GLUTES | HIP_EXTENSION | GYM | CABLE_STATION | P1 |
| 34 | `CA-001` | Standing Calf Raise | ربلة واقف | CALVES | CALF_RAISE | BOTH | DUMBBELLS | P1 |
| 35 | `AB-011` | Dead Bug | ديد باغ | RECTUS_ABDOMINIS | ANTI_EXTENSION | BOTH | NO_EQUIPMENT | P1 |
| 36 | `AB-012` | Pallof Press | بالوف برس | OBLIQUES | ANTI_ROTATION | BOTH | NO_EQUIPMENT | P1 |
| 37 | `AB-007` | Side Plank | بلانك جانبي | OBLIQUES | LATERAL_STABILITY | BOTH | NO_EQUIPMENT | P1 |
| 38 | `AB-001` | Crunch | كرنش | RECTUS_ABDOMINIS | TRUNK_FLEXION | BOTH | NO_EQUIPMENT | P1 |
| 39 | `AB-002` | Reverse Crunch | كرنش عكسي | RECTUS_ABDOMINIS | TRUNK_FLEXION | BOTH | NO_EQUIPMENT | P1 |
| 40 | `BI-003` | Hammer Curl | هامر كيرل | BICEPS | ELBOW_FLEXION | BOTH | DUMBBELLS | P1 |
| 41 | `CH-002` | Incline Bench Press | بنش علوي | CHEST | HORIZONTAL_PUSH | GYM | BARBELL + BENCH | P2 |
| 42 | `CH-007` | Incline Dumbbell Press | ضغط دمبل علوي | CHEST | HORIZONTAL_PUSH | BOTH | DUMBBELLS | P2 |
| 43 | `CH-012` | Machine Chest Press | جهاز ضغط صدر | CHEST | HORIZONTAL_PUSH | GYM | MACHINE | P2 |
| 44 | `BA-002` | Chin Up | سحب قبضة معكوسة | LATS | VERTICAL_PULL | BOTH | PULL_UP_BAR | P2 |
| 45 | `BA-005` | Assisted Pull Up | سحب عالي بمساعدة | LATS | VERTICAL_PULL | GYM | ASSISTED_PULL_UP_MACHINE | P2 |
| 46 | `BA-016` | Seated Cable Row | روو كيبل جالس | UPPER_BACK | HORIZONTAL_PULL | GYM | CABLE_STATION | P2 |
| 47 | `BA-017` | Chest Supported Row | روو بصدر مدعوم | UPPER_BACK | HORIZONTAL_PULL | GYM | MACHINE | P2 |
| 48 | `BA-021` | Inverted Row | روو معكوس | UPPER_BACK | HORIZONTAL_PULL | BOTH | PULL_UP_BAR | P2 |
| 49 | `BA-024` | Sumo Deadlift | ديدليفت سومو | HAMSTRINGS | HINGE | GYM | BARBELL | P2 |
| 50 | `BA-027` | Face Pull | فيس بول | POSTERIOR_DELTOID | SHOULDER_EXTERNAL_ROTATION | GYM | CABLE_STATION | P2 |
| 51 | `BA-029` | Dumbbell Shrug | شراغ دمبل | TRAPEZIUS | VERTICAL_PULL | BOTH | DUMBBELLS | P2 |
| 52 | `SH-006` | Front Raise | رفرفة أمامية | ANTERIOR_DELTOID | SHOULDER_FLEXION | BOTH | DUMBBELLS | P2 |
| 53 | `SH-009` | Cable Lateral Raise | رفرفة جانبية كيبل | LATERAL_DELTOID | SHOULDER_ABDUCTION | GYM | CABLE_STATION | P2 |
| 54 | `SH-010` | Machine Shoulder Press | ضغط كتف بالجهاز | SHOULDERS | VERTICAL_PUSH | GYM | MACHINE | P2 |
| 55 | `SH-014` | Y Raise | رفعة Y | LATERAL_DELTOID | SHOULDER_ABDUCTION | BOTH | DUMBBELLS | P2 |
| 56 | `SH-007` | Rear Delt Fly | فلاي خلفي للكتف | POSTERIOR_DELTOID | HORIZONTAL_PULL | BOTH | DUMBBELLS | P2 |
| 57 | `BI-006` | Cable Curl | بايسيبس كيبل | BICEPS | ELBOW_FLEXION | GYM | CABLE_STATION | P2 |
| 58 | `BI-012` | Machine Curl | بايسيبس بالجهاز | BICEPS | ELBOW_FLEXION | GYM | MACHINE | P2 |
| 59 | `BI-015` | Cross Body Hammer Curl | هامر كيرل عبر الجسم | BICEPS | ELBOW_FLEXION | BOTH | DUMBBELLS | P2 |
| 60 | `TR-002` | Rope Pushdown | ترايسيبس حبل | TRICEPS | ELBOW_EXTENSION | GYM | CABLE_STATION | P2 |
| 61 | `TR-004` | Skull Crusher | سكول كرشر | TRICEPS | ELBOW_EXTENSION | GYM | BARBELL + BENCH | P2 |
| 62 | `TR-006` | Dumbbell Kickback | كيك باك دمبل | TRICEPS | ELBOW_EXTENSION | BOTH | DUMBBELLS | P2 |
| 63 | `TR-007` | Tricep Dip | دِب ترايسيبس | TRICEPS | ELBOW_EXTENSION | BOTH | PARALLEL_BARS | P2 |
| 64 | `TR-008` | Bench Dip | دِب على المقعد | TRICEPS | ELBOW_EXTENSION | BOTH | NO_EQUIPMENT | P2 |
| 65 | `FO-003` | Farmer’s Walk | مشي المزارع | FOREARMS | LOADED_CARRY | BOTH | DUMBBELLS | P2 |
| 66 | `LE-005` | Hack Squat | هاك سكوات | QUADRICEPS | SQUAT | GYM | MACHINE | P2 |
| 67 | `LE-013` | Step Up | صعود درجة | QUADRICEPS | SQUAT | BOTH | DUMBBELLS | P2 |
| 68 | `LE-028` | Seated Leg Curl | ثني رجل جالس | HAMSTRINGS | KNEE_FLEXION | BOTH | DUMBBELLS | P2 |
| 69 | `LE-031` | Adductor Machine | جهاز المقربات | ADDUCTORS | HIP_ADDUCTION | GYM | MACHINE | P2 |
| 70 | `LE-042` | Wall Sit | جلوس على الحائط | QUADRICEPS | SQUAT | BOTH | NO_EQUIPMENT | P2 |
| 71 | `LE-043` | Terminal Knee Extension | امتداد ركبة طرفي | QUADRICEPS | KNEE_EXTENSION | BOTH | RESISTANCE_BAND | P2 |
| 72 | `GL-004` | Frog Pump | ضخ ضفدع | GLUTES | HIP_EXTENSION | BOTH | NO_EQUIPMENT | P2 |
| 73 | `GL-008` | Banded Glute Bridge | جسر بمقاومة | GLUTES | HIP_EXTENSION | BOTH | RESISTANCE_BAND | P2 |
| 74 | `GL-010` | Clamshell | صدفة | GLUTEUS_MEDIUS | HIP_ABDUCTION | BOTH | NO_EQUIPMENT | P2 |
| 75 | `GL-014` | Donkey Kick | ركلة حمار | GLUTES | HIP_EXTENSION | BOTH | NO_EQUIPMENT | P2 |
| 76 | `GL-015` | Banded Lateral Walk | مشي جانبي بمقاومة | GLUTEUS_MEDIUS | HIP_ABDUCTION | BOTH | RESISTANCE_BAND | P2 |
| 77 | `GL-020` | Hip Thrust Machine | هيب ثراست بالجهاز | GLUTES | HIP_EXTENSION | GYM | MACHINE | P2 |
| 78 | `CA-002` | Seated Calf Raise | ربلة جالس | CALVES | CALF_RAISE | BOTH | DUMBBELLS | P2 |
| 79 | `CA-012` | Isometric Calf Hold | ثبات ربلة | CALVES | CALF_RAISE | BOTH | NO_EQUIPMENT | P2 |
| 80 | `AB-009` | Ab Wheel Rollout | عجلة البطن | RECTUS_ABDOMINIS | ANTI_EXTENSION | BOTH | AB_WHEEL | P2 |
| 81 | `CH-005` | Chest Fly | فلاي صدر | CHEST | HORIZONTAL_PUSH | BOTH | DUMBBELLS | P3 |
| 82 | `CH-010` | Cable Fly High | كيبل فلاي علوي | CHEST | HORIZONTAL_PUSH | GYM | CABLE_STATION | P3 |
| 83 | `CH-014` | Chest Dip | دِبّ صدر | CHEST | HORIZONTAL_PUSH | BOTH | PARALLEL_BARS | P3 |
| 84 | `BA-009` | Straight Arm Pulldown | سحب ذراع مستقيم | LATS | VERTICAL_PULL | GYM | CABLE_STATION | P3 |
| 85 | `BA-018` | Machine Row | روو بالجهاز | LATS | VERTICAL_PULL | GYM | MACHINE | P3 |
| 86 | `SH-003` | Arnold Press | أرنولد برس | SHOULDERS | VERTICAL_PUSH | BOTH | DUMBBELLS | P3 |
| 87 | `SH-019` | Seated Dumbbell Press | ضغط دمبل جالس | SHOULDERS | VERTICAL_PUSH | BOTH | DUMBBELLS | P3 |
| 88 | `BI-004` | Preacher Curl | بريشر كيرل | BICEPS | ELBOW_FLEXION | BOTH | DUMBBELLS | P3 |
| 89 | `BI-007` | Incline Dumbbell Curl | بايسيبس دمبل مائل | BICEPS | ELBOW_FLEXION | BOTH | DUMBBELLS | P3 |
| 90 | `TR-005` | Close Grip Bench Press | بنش قبضة ضيقة | TRICEPS | ELBOW_EXTENSION | GYM | BARBELL + BENCH | P3 |
| 91 | `TR-018` | Bodyweight Skull Crusher | سكول كرشر وزن الجسم | TRICEPS | ELBOW_EXTENSION | BOTH | NO_EQUIPMENT | P3 |
| 92 | `LE-011` | Nordic Curl | نورديك كيرل | HAMSTRINGS | KNEE_FLEXION | BOTH | NO_EQUIPMENT | P3 |
| 93 | `LE-016` | Lateral Lunge | اندفاع جانبي | QUADRICEPS | SQUAT | BOTH | DUMBBELLS | P3 |
| 94 | `GL-006` | Single Leg Hip Thrust | هيب ثراست رجل واحدة | GLUTES | HIP_EXTENSION | GYM | BARBELL + BENCH | P3 |
| 95 | `GL-019` | Kas Glute Bridge | كاس جسر أرداف | GLUTES | HIP_EXTENSION | BOTH | NO_EQUIPMENT | P3 |
| 96 | `CA-004` | Leg Press Calf Raise | ربلة برس | CALVES | CALF_RAISE | GYM | MACHINE | P3 |
| 97 | `CA-005` | Single Leg Calf Raise | ربلة رجل واحدة | CALVES | CALF_RAISE | BOTH | DUMBBELLS | P3 |
| 98 | `AB-016` | Hollow Hold | ثبات مجوف | RECTUS_ABDOMINIS | ANTI_EXTENSION | BOTH | NO_EQUIPMENT | P3 |
| 99 | `AB-023` | Copenhagen Plank | بلانك كوبنهاغن | OBLIQUES | LATERAL_STABILITY | BOTH | NO_EQUIPMENT | P3 |
| 100 | `AB-024` | Cable Wood Chop | تقطيع خشب كيبل | OBLIQUES | ANTI_ROTATION | GYM | CABLE_STATION | P3 |

## 6. Quality gates

| Gate | Result |
|---|---|
| `validateCore100Config()` | PASS |
| Core 100 safety/regression test | PASS |
| Core 100 144-scenario QA test | PASS |
| Full `npm test` | PASS |
| `npm run build` | PASS |
| `verify-vercel-build` | PASS |

## 7. Repository and release boundaries

- The full exercise catalog remains intact.
- No `external_id` was edited.
- No migration was created or changed for this closure.
- No Production data or service was touched.
- No `main` branch operation, commit, push, merge, or deployment was performed.
- Phase 4 was not started.
- The checkout already contained unrelated uncommitted work, so this closure intentionally leaves commit isolation and independent QA as the next repository-governance steps rather than mixing ownership in a commit.

## 8. Final Phase 3 state

`PHASE_3_FUNCTIONAL_CLOSURE = PASSED`

`CORE_100_POOL = ACTIVE_AND_VALIDATED`

`QA_MATRIX = 144/144 PASSED`

`REPOSITORY_INTEGRATION = PENDING_CLEAN_ISOLATED_COMMIT_AND_INDEPENDENT_QA`

This is a functional Phase 3 closure only. It is not authorization to start Phase 4 or deploy.
