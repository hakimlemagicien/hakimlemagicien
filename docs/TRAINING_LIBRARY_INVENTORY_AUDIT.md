# TRAINING_LIBRARY_INVENTORY_AUDIT

**الحالة:** READ-ONLY — جرد من المستودع فقط. لم يُعدَّل كود ولا قاعدة بيانات.
**التاريخ:** 2026-08-25
**المصادر:**
- كتالوج التأليف: `scripts/exercise-library.json`
- بيانات V2: `scripts/exercise-library-v2-metadata.json`
- مخطط التشغيل: `public.exercises` عبر `supabase/migrations/20260710170000_exercise_library_foundation.sql`
- المعاينة المجانية: `src/lib/platform/today-workout.ts` + `src/lib/platform/weekly-workout-schedule.ts`
- الوسائط: `src/lib/platform/exercise-media.ts`

هذا الملف هو تسليم الجرد. لا ينشئ تمارين جديدة ولا يغيّر بيانات.

---

## 1. العدد الإجمالي الموجود فعلياً

| المقياس | العدد |
|---------|------:|
| تمارين فريدة (`external_id`) | 320 |
| تطابق 1:1 مع metadata V2 | 320 |
| مكررات `external_id` | 0 |
| V2 معتمدة (`APPROVED`) | 313 |
| V2 تحتاج مراجعة (`REVIEW_REQUIRED`) | 7 |
| في المعاينة المجانية (مؤكد في المستودع) | 6 |
| وسائط `placeholder` | 320 |

### التوزيع حسب المجموعة

| المجموعة | العدد |
|----------|------:|
| Chest | 14 |
| Back | 31 |
| Warm Up | 25 |
| Mobility | 25 |
| Shoulders | 30 |
| Biceps | 20 |
| Triceps | 20 |
| Forearms | 15 |
| Legs | 45 |
| Glutes | 25 |
| Calves | 15 |
| Abs | 30 |
| Cardio | 25 |
| **المجموع** | **320** |

### النوع / المستوى

| النوع | العدد |
|-------|------:|
| strength | 245 |
| warmup | 25 |
| mobility | 25 |
| cardio | 25 |

| المستوى | العدد |
|---------|------:|
| beginner | 50 |
| intermediate | 261 |
| advanced | 9 |

REVIEW_REQUIRED (ما زالت في الكتالوج، مستبعدة من مرشحي V2): `SH-021`, `SH-024`, `SH-025`, `TR-010`, `TR-020`, `CR-014`, `CR-020`.

---

## 2. نظام المعرفات

| الحقل | أين يعيش | ما هو | مثال |
|-------|----------|--------|------|
| `id` | قاعدة البيانات فقط (`public.exercises.id`) | UUID داخلي للمفاتيح الأجنبية. غير موجود في كتالوج JSON. | `550e8400-…` |
| `external_id` | حقل `id` في JSON + عمود DB UNIQUE | الهوية العامة الثابتة `{AA}-{NNN}`. حقل `id` في الكتالوج **يعني** `external_id`. ليس اسم العرض ولا اسم ملف الفيديو. | `CH-001` |
| `slug` | يُشتق عند المزامنة (`scripts/sync-exercises.sh`) | من الاسم الإنجليزي: أحرف صغيرة، غير الأبجدية → `-`. UNIQUE في DB. | Bench Press → `bench-press` |

شكل `external_id`: حرفان لاتينيان + شرطة + ثلاثة أرقام (`^[A-Z]{2}-\d{3}$`). البادئات: `CH` صدر، `BA` ظهر، `WU` إحماء، `MO` حركية، `SH` أكتاف، `BI` بايسيبس، `TR` ترايسيبس، `FO` ساعد، `LE` أرجل، `GL` أرداف، `CA` سمانة، `AB` بطن، `CR` كارديو.

مسار الفيديو الحقيقي المتوقع: `exercises/{external_id}/exercise.mp4`. حالياً التشغيل يستخدم المسار المشترك `exercises/placeholders/default-exercise.mp4`.

---

## 3. حالة الوسائط

كل الصفوف الـ 320 متطابقة:

| الوسيط | الحالة |
|--------|--------|
| صورة ثابتة خاصة | غير موجودة في الكتالوج |
| فيديو التمرين | `placeholder` — ملف مشترك |
| فيديو التعليمات | `placeholder` — ملف مشترك |
| صورة مصغرة خاصة | عمود `thumbnail_path` موجود في المخطط وغير مُعبأ من JSON |

`media_status` في الجدول أدناه = `placeholder` لكل التمارين.

---

## 4. التمارين المستخدمة داخل البرامج الحالية

ما هو **مؤكد في المستودع** (معاينة مجانية حية في `today-workout.ts` و`weekly-workout-schedule.ts`):

| exercise_id | name_ar | name_en | أين يظهر |
|-------------|---------|---------|----------|
| CH-001 | بنش برس | Bench Press | تمارين اليوم + جدول الأسبوع + فتح العضو المجاني |
| CH-007 | ضغط دمبل علوي | Incline Dumbbell Press | تمارين اليوم + أيام الأسبوع |
| CH-010 | كيبل فلاي علوي | Cable Fly High | تمارين اليوم + أيام الأسبوع |
| BI-002 | بايسيبس دمبل | Dumbbell Curl | تمارين اليوم + أيام الأسبوع |
| BI-003 | هامر كيرل | Hammer Curl | تمارين اليوم + أيام الأسبوع |
| TR-001 | ترايسيبس بول داون | Tricep Pushdown | تمارين اليوم + أيام الأسبوع |

`FREE_MEMBER_UNLOCKED_EXTERNAL_ID` = `CH-001`.

قوالب المدرب (`program_template_exercises`) وsnapshots العملاء (`client_program_exercises`) تعيش في Supabase **ولم تُستعلم في هذا الجرد**. أي استخدام خارج الستة أعلاه = `LIVE_ASSIGNMENT_USAGE_PENDING_EXTERNAL_ENVIRONMENT`.

مولّد V2 يمكنه اختيار أي صف `V2_ELIGIBLE`؛ ذلك احتمال توليد وليس استخداماً حالياً.

---

## 5. أول 10 تمارين لتجربة نظام الإشارات

المعيار: نمط استعداد / نزول / دفع واضح، معتمَد V2، ومزيج دفع·سحب·قرفصاء·hinge·امتداد ورك·عزل، مع تغطية المعاينة المجانية. لم يُنشأ أي تمرين جديد.

### 5.1 إشارات A / B / C والأخطاء

| exercise_id | name_ar / name_en | A الاستعداد | B النزول | C الدفع | الخطأ الأول | الخطأ الثاني | سبب الاختيار |
|-------------|-------------------|-------------|----------|---------|-------------|--------------|--------------|
| CH-004 | ضغط / Push Up | لوح مستقيم، يدان بعرض الكتفين، نظر للأسفل قليلاً | نزول بطيء حتى يقترب الصدر من الأرض | دفع الجسم للأعلى مع قفل المرفقين دون رفع الحوض | ترهل الحوض أو تقوس أسفل الظهر | فتح المرفقين للخارج بدل القرب من الجذع | وزن جسم، بدون معدات، النمط A/B/C واضح للتصوير والاختبار السريع |
| CH-001 | بنش برس / Bench Press | استلقاء على المقعد، تلامس الكتفين والظهر، قبضة مستقرة | إنزال البار إلى منتصف الصدر بتحكم | دفع البار للأعلى حتى امتداد الذراعين | ارتداد البار عن الصدر | فتح المرفقين أكثر من اللازم أو رفع المقعد | موجود في المعاينة المجانية، دفع أفقي مركّب، أخطاء شائعة سهلة التعليم |
| LE-001 | سكوات خلفي / Back Squat | البار على الظهر، قدمان ثابتتان، صدر مرفوع | نزول حتى عمق الورك تقريباً مع ثبات الكعب | الوقوف بدفع الأرض بالكعبين | انهيار الركبتين للداخل | رفع الكعبين أو انحناء الجذع للأمام | نموذج القرفصاء: نزول/صعود واضح، أساس برامج الأرجل |
| BA-023 | ديدليفت روماني / Romanian Deadlift | بار قريب من الساقين، ظهر محايد، ركبتان لينتان | انحناء من الورك مع بقاء البار ملاصقاً | الوقوف بمد الورك حتى الوقوف المستقيم | تقوس الظهر أو تدويره | ابتعاد البار عن الجسم | حركة hinge واضحة؛ النزول هنا هو المفصل وليس ثني الركبة |
| GL-001 | هيب ثراست / Hip Thrust | لوح الكتف على المقعد، ذقن داخلة، قدمان ثابتتان | الهبوط المتحكم حتى يقترب الورك من الأرض | دفع الورك للأعلى حتى الخط المستقيم | تقوس أسفل الظهر بدل مد الورك | عدم إكمال القفل أو دفع بالرقبة | تمرين هدف نمو الأرداف في المحرك V2، إعداد/قفل واضحان |
| BA-010 | روو بالبار / Barbell Row | انحناء من الورك، ظهر مستوٍ، بار معلّق تحت الكتفين | تمديد الذراعين مع ثبات الجذع | سحب البار إلى أسفل القفص | استخدام الزخم ورفع الجذع | رفع الكتفين بدل سحب الكوع | سحب أفقي مركّب؛ الإعداد الخاطئ يظهر فوراً في الفيديو |
| SH-001 | ضغط فوق الرأس / Overhead Press | البار على الكتفين الأماميين، ضلوع منخفضة، قبضة ثابتة | إنزال البار إلى مستوى الذقن/الكتف بتحكم | الدفع العمودي حتى فوق الرأس | فتح القفص الصدري والتقوس القطني | دفع البار للأمام بدل الخط العمودي | دفع عمودي مقابل بنش؛ نفس هيكل A/B/C باتجاه مختلف |
| BA-001 | سحب عالي / Pull Up | تعليق كامل، كتفان نشطان، قبضة ثابتة | النزول المتحكم حتى امتداد الذراعين | السحب حتى يتجاوز الذقن العارضة | الأرجحة أو الركل للوصول | نطاق حركة ناقص أعلى أو أسفل | وزن جسم + سحب عمودي؛ الاختلاف عن الضغط يوضح تنوع الإشارات |
| BI-002 | بايسيبس دمبل / Dumbbell Curl | وقوف ثابت، كوعان ملاصقان للجذع | إنزال الدمبل حتى امتداد شبه كامل | ثني الكوع دون تحريك الكتف | الأرجحة بالجذع | تحرك الكوع للأمام أو للخارج | موجود في المعاينة المجانية؛ عزل بسيط لاختبار إشارات الخطأ على مفصل واحد |
| TR-001 | ترايسيبس بول داون / Tricep Pushdown | وقوف أمام الكيبل، كوعان ثابتان بجانب الجذع | ثني الكوع لعودة المقبض دون تحريك الكتف | مد الذراع للأسفل حتى القفل | فتح المرفقين للخارج | الميل بالجذع لإنهاء التكرار | موجود في المعاينة المجانية؛ مد كوع واضح مقابل البايسيبس |

### 5.2 نفس العشرة بالأعمدة المطلوبة

| exercise_id | name_ar | name_en | primary_muscle | secondary_muscles | equipment | difficulty | media_status | used_in_programs |
|-------------|---------|---------|----------------|-------------------|-----------|------------|--------------|------------------|
| CH-004 | ضغط | Push Up | CHEST | TRICEPS, ANTERIOR_DELTOID | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع |
| CH-001 | بنش برس | Bench Press | CHEST | TRICEPS, ANTERIOR_DELTOID | BARBELL | intermediate | placeholder | معاينة مجانية |
| LE-001 | سكوات خلفي | Back Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع |
| BA-023 | ديدليفت روماني | Romanian Deadlift | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | intermediate | placeholder | غير معيّن في المستودع |
| GL-001 | هيب ثراست | Hip Thrust | GLUTES | HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع |
| BA-010 | روو بالبار | Barbell Row | UPPER_BACK | LATS, BICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع |
| SH-001 | ضغط فوق الرأس | Overhead Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع |
| BA-001 | سحب عالي | Pull Up | LATS | BICEPS, UPPER_BACK | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع |
| BI-002 | بايسيبس دمبل | Dumbbell Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | معاينة مجانية |
| TR-001 | ترايسيبس بول داون | Tricep Pushdown | TRICEPS | — | CABLE_STATION | intermediate | placeholder | معاينة مجانية |

---

## 6. قائمة الأسماء الكاملة (عربي + إنجليزي)

| exercise_id | name_ar | name_en | slug |
|-------------|---------|---------|------|
| CH-001 | بنش برس | Bench Press | `bench-press` |
| CH-002 | بنش علوي | Incline Bench Press | `incline-bench-press` |
| CH-003 | بنش دمبل | Dumbbell Bench Press | `dumbbell-bench-press` |
| CH-004 | ضغط | Push Up | `push-up` |
| CH-005 | فلاي صدر | Chest Fly | `chest-fly` |
| CH-006 | بنش سفلي | Decline Bench Press | `decline-bench-press` |
| CH-007 | ضغط دمبل علوي | Incline Dumbbell Press | `incline-dumbbell-press` |
| CH-008 | ضغط دمبل سفلي | Decline Dumbbell Press | `decline-dumbbell-press` |
| CH-009 | فلاي دمبل | Dumbbell Fly | `dumbbell-fly` |
| CH-010 | كيبل فلاي علوي | Cable Fly High | `cable-fly-high` |
| CH-011 | كيبل فلاي سفلي | Cable Fly Low | `cable-fly-low` |
| CH-012 | جهاز ضغط صدر | Machine Chest Press | `machine-chest-press` |
| CH-013 | ضغط ماسة | Diamond Push Up | `diamond-push-up` |
| CH-014 | دِبّ صدر | Chest Dip | `chest-dip` |
| BA-001 | سحب عالي | Pull Up | `pull-up` |
| BA-002 | سحب قبضة معكوسة | Chin Up | `chin-up` |
| BA-003 | سحب عريض | Wide Grip Pull Up | `wide-grip-pull-up` |
| BA-004 | سحب قبضة محايدة | Neutral Grip Pull Up | `neutral-grip-pull-up` |
| BA-005 | سحب عالي بمساعدة | Assisted Pull Up | `assisted-pull-up` |
| BA-006 | سحب لات | Lat Pulldown | `lat-pulldown` |
| BA-007 | سحب لات عريض | Wide Grip Lat Pulldown | `wide-grip-lat-pulldown` |
| BA-008 | سحب لات ضيق | Close Grip Lat Pulldown | `close-grip-lat-pulldown` |
| BA-009 | سحب ذراع مستقيم | Straight Arm Pulldown | `straight-arm-pulldown` |
| BA-010 | روو بالبار | Barbell Row | `barbell-row` |
| BA-011 | بيندلاي روو | Pendlay Row | `pendlay-row` |
| BA-012 | تي بار روو | T-Bar Row | `t-bar-row` |
| BA-013 | روو دمبل منحني | Bent Over Dumbbell Row | `bent-over-dumbbell-row` |
| BA-014 | روو دمبل بيد واحدة | Single Arm Dumbbell Row | `single-arm-dumbbell-row` |
| BA-015 | روو كيبل بيد واحدة | One Arm Cable Row | `one-arm-cable-row` |
| BA-016 | روو كيبل جالس | Seated Cable Row | `seated-cable-row` |
| BA-017 | روو بصدر مدعوم | Chest Supported Row | `chest-supported-row` |
| BA-018 | روو بالجهاز | Machine Row | `machine-row` |
| BA-019 | ميدوز روو | Meadows Row | `meadows-row` |
| BA-020 | سيل روو | Seal Row | `seal-row` |
| BA-021 | روو معكوس | Inverted Row | `inverted-row` |
| BA-022 | ديدليفت تقليدي | Conventional Deadlift | `conventional-deadlift` |
| BA-023 | ديدليفت روماني | Romanian Deadlift | `romanian-deadlift` |
| BA-024 | ديدليفت سومو | Sumo Deadlift | `sumo-deadlift` |
| BA-025 | ديدليفت تراب بار | Trap Bar Deadlift | `trap-bar-deadlift` |
| BA-026 | راك بول | Rack Pull | `rack-pull` |
| BA-027 | فيس بول | Face Pull | `face-pull` |
| BA-028 | شراغ بالبار | Barbell Shrug | `barbell-shrug` |
| BA-029 | شراغ دمبل | Dumbbell Shrug | `dumbbell-shrug` |
| BA-030 | هايبر إكستنشن | Hyperextension | `hyperextension` |
| BA-031 | جود مورنينغ | Good Morning | `good-morning` |
| WU-001 | دوائر الذراع | Arm Circles | `arm-circles` |
| WU-002 | تأرجح الرجلين | Leg Swings | `leg-swings` |
| WU-003 | دوائر الورك | Hip Circles | `hip-circles` |
| WU-004 | قفزات جاك | Jumping Jacks | `jumping-jacks` |
| WU-005 | ركب عالية | High Knees | `high-knees` |
| WU-006 | ركلات الردف | Butt Kicks | `butt-kicks` |
| WU-007 | إنش وورم | Inchworm | `inchworm` |
| WU-008 | قط بقرة | Cat Cow | `cat-cow` |
| WU-009 | أعظم تمدد | World's Greatest Stretch | `world-s-greatest-stretch` |
| WU-010 | فصل المقاومة | Band Pull Apart | `band-pull-apart` |
| WU-011 | اندفاع ديناميكي | Dynamic Lunge | `dynamic-lunge` |
| WU-012 | لف الجذع | Torso Twists | `torso-twists` |
| WU-013 | لف الكتف | Shoulder Rolls | `shoulder-rolls` |
| WU-014 | دوائر الكاحل | Ankle Circles | `ankle-circles` |
| WU-015 | جري خفيف | Light Jog | `light-jog` |
| WU-016 | مشي فرانكشتاين | Frankenstein Walk | `frankenstein-walk` |
| WU-017 | سكوات وزن الجسم | Bodyweight Squat | `bodyweight-squat` |
| WU-018 | اندفاع سبايدرمان | Spiderman Lunge | `spiderman-lunge` |
| WU-019 | تأرجح الذراع | Arm Swings | `arm-swings` |
| WU-020 | فتح الورك | Hip Openers | `hip-openers` |
| WU-021 | ضغط كتفي | Scapular Push Up | `scapular-push-up` |
| WU-022 | جسر أرداف مشي | Glute Bridge March | `glute-bridge-march` |
| WU-023 | مشي في المكان | March in Place | `march-in-place` |
| WU-024 | إحماء الرسغ | Wrist Warm Up | `wrist-warm-up` |
| WU-025 | فتح وإغلاق البوابة | Open Close the Gate | `open-close-the-gate` |
| MO-001 | تحريك الكتف بالمقاومة | Shoulder Dislocations | `shoulder-dislocations` |
| MO-002 | امتداد الظهر العلوي | Thoracic Extension | `thoracic-extension` |
| MO-003 | تمدد مثنية الورك | Hip Flexor Stretch | `hip-flexor-stretch` |
| MO-004 | وضعية الحمامة | Pigeon Stretch | `pigeon-stretch` |
| MO-005 | تمدد أوتار الركبة | Hamstring Stretch | `hamstring-stretch` |
| MO-006 | تمدد الفخذ الأمامي | Quad Stretch | `quad-stretch` |
| MO-007 | حركة الكاحل | Ankle Mobility Drill | `ankle-mobility-drill` |
| MO-008 | دوائر الرسغ | Wrist Circles | `wrist-circles` |
| MO-009 | تبديل الورك 90/90 | 90/90 Hip Switch | `90-90-hip-switch` |
| MO-010 | قرفصاء عميق ثابت | Deep Squat Hold | `deep-squat-hold` |
| MO-011 | انزلاق الحائط | Wall Slides | `wall-slides` |
| MO-012 | انزلاق الكتف على الحائط | Scapular Wall Slides | `scapular-wall-slides` |
| MO-013 | فوم رولر ظهر علوي | Foam Roller Thoracic | `foam-roller-thoracic` |
| MO-014 | حركة الرقبة | Neck Mobility | `neck-mobility` |
| MO-015 | قرفصاء كوزاك | Cossack Squat | `cossack-squat` |
| MO-016 | كوبرا | Prone Cobra | `prone-cobra` |
| MO-017 | وضعية الطفل | Child's Pose | `child-s-pose` |
| MO-018 | خيط الإبرة | Thread the Needle | `thread-the-needle` |
| MO-019 | تمدد الرقم 4 | Figure Four Stretch | `figure-four-stretch` |
| MO-020 | تمدد المقربات | Adductor Stretch | `adductor-stretch` |
| MO-021 | تمدد الأرداف | Glute Stretch | `glute-stretch` |
| MO-022 | تمدد اللات | Lat Stretch | `lat-stretch` |
| MO-023 | تمدد الصدر | Pec Stretch | `pec-stretch` |
| MO-024 | لف العمود الفقري | Spinal Twist | `spinal-twist` |
| MO-025 | جيفرسون كيرل | Jefferson Curl | `jefferson-curl` |
| SH-001 | ضغط فوق الرأس | Overhead Press | `overhead-press` |
| SH-002 | ضغط كتف دمبل | Dumbbell Shoulder Press | `dumbbell-shoulder-press` |
| SH-003 | أرنولد برس | Arnold Press | `arnold-press` |
| SH-004 | بوش برس | Push Press | `push-press` |
| SH-005 | رفرفة جانبية | Lateral Raise | `lateral-raise` |
| SH-006 | رفرفة أمامية | Front Raise | `front-raise` |
| SH-007 | فلاي خلفي للكتف | Rear Delt Fly | `rear-delt-fly` |
| SH-008 | فلاي عكسي منحني | Bent Over Reverse Fly | `bent-over-reverse-fly` |
| SH-009 | رفرفة جانبية كيبل | Cable Lateral Raise | `cable-lateral-raise` |
| SH-010 | ضغط كتف بالجهاز | Machine Shoulder Press | `machine-shoulder-press` |
| SH-011 | روو عمودي | Upright Row | `upright-row` |
| SH-012 | لاندماين برس | Landmine Press | `landmine-press` |
| SH-013 | كوبان برس | Cuban Press | `cuban-press` |
| SH-014 | رفعة Y | Y Raise | `y-raise` |
| SH-015 | رفرفة جانبية بالجهاز | Machine Lateral Raise | `machine-lateral-raise` |
| SH-016 | رفرفة جانبية مائلة | Leaning Lateral Raise | `leaning-lateral-raise` |
| SH-017 | فلاي خلفي كيبل | Cable Rear Delt Fly | `cable-rear-delt-fly` |
| SH-018 | برادفورد برس | Bradford Press | `bradford-press` |
| SH-019 | ضغط دمبل جالس | Seated Dumbbell Press | `seated-dumbbell-press` |
| SH-020 | فايكنغ برس | Viking Press | `viking-press` |
| SH-021 | سائق الحافلة | Bus Driver | `bus-driver` |
| SH-022 | رفرفة أمامية بقرص | Plate Front Raise | `plate-front-raise` |
| SH-023 | رفعة كيبل عبر الجسم | Cross Body Cable Raise | `cross-body-cable-raise` |
| SH-024 | لو رايز | Lu Raise | `lu-raise` |
| SH-025 | باول رايز | Powell Raise | `powell-raise` |
| SH-026 | رفعة Y كيبل | Cable Y Raise | `cable-y-raise` |
| SH-027 | ضغط سميث | Smith Machine Press | `smith-machine-press` |
| SH-028 | لاندماين برس بيد واحدة | Single Arm Landmine Press | `single-arm-landmine-press` |
| SH-029 | رفرفة جانبية خلف الظهر | Behind the Back Lateral Raise | `behind-the-back-lateral-raise` |
| SH-030 | ضغط نصف ركبة | Half Kneeling Press | `half-kneeling-press` |
| BI-001 | بايسيبس بار | Barbell Curl | `barbell-curl` |
| BI-002 | بايسيبس دمبل | Dumbbell Curl | `dumbbell-curl` |
| BI-003 | هامر كيرل | Hammer Curl | `hammer-curl` |
| BI-004 | بريشر كيرل | Preacher Curl | `preacher-curl` |
| BI-005 | كونسنتريشن كيرل | Concentration Curl | `concentration-curl` |
| BI-006 | بايسيبس كيبل | Cable Curl | `cable-curl` |
| BI-007 | بايسيبس دمبل مائل | Incline Dumbbell Curl | `incline-dumbbell-curl` |
| BI-008 | سبايدر كيرل | Spider Curl | `spider-curl` |
| BI-009 | بايسيبس EZ بار | EZ Bar Curl | `ez-bar-curl` |
| BI-010 | بايسيبس عكسي | Reverse Curl | `reverse-curl` |
| BI-011 | بايسيبس كيبل بايبل | Bayesian Cable Curl | `bayesian-cable-curl` |
| BI-012 | بايسيبس بالجهاز | Machine Curl | `machine-curl` |
| BI-013 | دراج كيرل | Drag Curl | `drag-curl` |
| BI-014 | سكوت كيرل | Scott Curl | `scott-curl` |
| BI-015 | هامر كيرل عبر الجسم | Cross Body Hammer Curl | `cross-body-hammer-curl` |
| BI-016 | ويتر كيرل | Waiter Curl | `waiter-curl` |
| BI-017 | هامر كيرل كيبل | Cable Hammer Curl | `cable-hammer-curl` |
| BI-018 | بريشر كيرل قبضة عكسية | Reverse Grip Preacher Curl | `reverse-grip-preacher-curl` |
| BI-019 | 21 كيرل | 21s Curl | `21s-curl` |
| BI-020 | بايسيبس كيبل مستلقي | Lying Cable Curl | `lying-cable-curl` |
| TR-001 | ترايسيبس بول داون | Tricep Pushdown | `tricep-pushdown` |
| TR-002 | ترايسيبس حبل | Rope Pushdown | `rope-pushdown` |
| TR-003 | امتداد ترايسيبس فوق الرأس | Overhead Tricep Extension | `overhead-tricep-extension` |
| TR-004 | سكول كرشر | Skull Crusher | `skull-crusher` |
| TR-005 | بنش قبضة ضيقة | Close Grip Bench Press | `close-grip-bench-press` |
| TR-006 | كيك باك دمبل | Dumbbell Kickback | `dumbbell-kickback` |
| TR-007 | دِب ترايسيبس | Tricep Dip | `tricep-dip` |
| TR-008 | دِب على المقعد | Bench Dip | `bench-dip` |
| TR-009 | امتداد كيبل علوي | Cable Overhead Extension | `cable-overhead-extension` |
| TR-010 | جي إم برس | JM Press | `jm-press` |
| TR-011 | ترايسيبس بيد واحدة | Single Arm Pushdown | `single-arm-pushdown` |
| TR-012 | تيت برس | Tate Press | `tate-press` |
| TR-013 | امتداد دمبل متدحرج | Rolling Dumbbell Extension | `rolling-dumbbell-extension` |
| TR-014 | فلور برس قبضة ضيقة | Floor Press Close Grip | `floor-press-close-grip` |
| TR-015 | بول داون قبضة عكسية | Reverse Grip Pushdown | `reverse-grip-pushdown` |
| TR-016 | بول داون V بار | V-Bar Pushdown | `v-bar-pushdown` |
| TR-017 | امتداد دمبل ذراعين | Two Arm Dumbbell Extension | `two-arm-dumbbell-extension` |
| TR-018 | سكول كرشر وزن الجسم | Bodyweight Skull Crusher | `bodyweight-skull-crusher` |
| TR-019 | بورد برس | Board Press | `board-press` |
| TR-020 | كاليفورنيا برس | California Press | `california-press` |
| FO-001 | كيرل الرسغ | Wrist Curl | `wrist-curl` |
| FO-002 | كيرل رسغ عكسي | Reverse Wrist Curl | `reverse-wrist-curl` |
| FO-003 | مشي المزارع | Farmer's Walk | `farmer-s-walk` |
| FO-004 | لفافة الرسغ | Wrist Roller | `wrist-roller` |
| FO-005 | قرص بين الأصابع | Plate Pinch | `plate-pinch` |
| FO-006 | تعليق ثابت | Dead Hang | `dead-hang` |
| FO-007 | تعليق بمنشفة | Towel Grip Hang | `towel-grip-hang` |
| FO-008 | قبضة سميكة | Fat Grip Hold | `fat-grip-hold` |
| FO-009 | كيرل رسغ خلف الظهر | Behind Back Wrist Curl | `behind-back-wrist-curl` |
| FO-010 | زوتمان كيرل | Zottman Curl | `zottman-curl` |
| FO-011 | تعليق على الرف | Rack Hold | `rack-hold` |
| FO-012 | رفع مطرقة | Sledgehammer Levering | `sledgehammer-levering` |
| FO-013 | ضغط المقبض | Gripper Squeeze | `gripper-squeeze` |
| FO-014 | إمساك بار سميك | Thick Bar Hold | `thick-bar-hold` |
| FO-015 | كيرل الأصابع | Finger Curls | `finger-curls` |
| LE-001 | سكوات خلفي | Back Squat | `back-squat` |
| LE-002 | فرونت سكوات | Front Squat | `front-squat` |
| LE-003 | جوبلت سكوات | Goblet Squat | `goblet-squat` |
| LE-004 | ضغط رجلين | Leg Press | `leg-press` |
| LE-005 | هاك سكوات | Hack Squat | `hack-squat` |
| LE-006 | سكوات بلغاري | Bulgarian Split Squat | `bulgarian-split-squat` |
| LE-007 | اندفاع مشي | Walking Lunge | `walking-lunge` |
| LE-008 | اندفاع خلفي | Reverse Lunge | `reverse-lunge` |
| LE-009 | امتداد الرجل | Leg Extension | `leg-extension` |
| LE-010 | ثني الرجل | Leg Curl | `leg-curl` |
| LE-011 | نورديك كيرل | Nordic Curl | `nordic-curl` |
| LE-012 | سيسي سكوات | Sissy Squat | `sissy-squat` |
| LE-013 | صعود درجة | Step Up | `step-up` |
| LE-014 | سكوات مسدس | Pistol Squat | `pistol-squat` |
| LE-015 | سكوات سميث | Smith Machine Squat | `smith-machine-squat` |
| LE-016 | اندفاع جانبي | Lateral Lunge | `lateral-lunge` |
| LE-017 | سكوات صندوق | Box Squat | `box-squat` |
| LE-018 | سكوات بحزام | Belt Squat | `belt-squat` |
| LE-019 | زيرشر سكوات | Zercher Squat | `zercher-squat` |
| LE-020 | سكوات منقسم | Split Squat | `split-squat` |
| LE-021 | سكوات فوق الرأس | Overhead Squat | `overhead-squat` |
| LE-022 | سكوات مع توقف | Pause Squat | `pause-squat` |
| LE-023 | سكوات بار أمان | Safety Bar Squat | `safety-bar-squat` |
| LE-024 | سكوات بندول | Pendulum Squat | `pendulum-squat` |
| LE-025 | اندفاع تحية | Curtsy Lunge | `curtsy-lunge` |
| LE-026 | اندفاع بعجز | Deficit Lunge | `deficit-lunge` |
| LE-027 | برس رجل واحدة | Single Leg Press | `single-leg-press` |
| LE-028 | ثني رجل جالس | Seated Leg Curl | `seated-leg-curl` |
| LE-029 | ثني رجل واقف | Standing Leg Curl | `standing-leg-curl` |
| LE-030 | ثني رجل مستلقي | Lying Leg Curl | `lying-leg-curl` |
| LE-031 | جهاز المقربات | Adductor Machine | `adductor-machine` |
| LE-032 | سكوات إسباني | Spanish Squat | `spanish-squat` |
| LE-033 | سكوات دراج | Cyclist Squat | `cyclist-squat` |
| LE-034 | سكوات كعب مرتفع | Heels Elevated Squat | `heels-elevated-squat` |
| LE-035 | سكوات وقفة عريضة | Wide Stance Squat | `wide-stance-squat` |
| LE-036 | سكوات وقفة ضيقة | Narrow Stance Squat | `narrow-stance-squat` |
| LE-037 | أندرسون سكوات | Anderson Squat | `anderson-squat` |
| LE-038 | سكوات دبوس | Pin Squat | `pin-squat` |
| LE-039 | سكوات تمبو | Tempo Squat | `tempo-squat` |
| LE-040 | جيفرسون سكوات | Jefferson Squat | `jefferson-squat` |
| LE-041 | سكوات لاندماين | Landmine Squat | `landmine-squat` |
| LE-042 | جلوس على الحائط | Wall Sit | `wall-sit` |
| LE-043 | امتداد ركبة طرفي | Terminal Knee Extension | `terminal-knee-extension` |
| LE-044 | صعود درجة بوليكوين | Poliquin Step Up | `poliquin-step-up` |
| LE-045 | هاتفيلد سكوات | Hatfield Squat | `hatfield-squat` |
| GL-001 | هيب ثراست | Hip Thrust | `hip-thrust` |
| GL-002 | جسر الأرداف | Glute Bridge | `glute-bridge` |
| GL-003 | كيك باك كيبل | Cable Kickback | `cable-kickback` |
| GL-004 | ضخ ضفدع | Frog Pump | `frog-pump` |
| GL-005 | سحب كيبل من الأسفل | Cable Pull Through | `cable-pull-through` |
| GL-006 | هيب ثراست رجل واحدة | Single Leg Hip Thrust | `single-leg-hip-thrust` |
| GL-007 | تبعيد الورك | Hip Abduction Machine | `hip-abduction-machine` |
| GL-008 | جسر بمقاومة | Banded Glute Bridge | `banded-glute-bridge` |
| GL-009 | مرآة الحريق | Fire Hydrant | `fire-hydrant` |
| GL-010 | صدفة | Clamshell | `clamshell` |
| GL-011 | سكوات سومو | Sumo Squat | `sumo-squat` |
| GL-012 | رفع الأرداف والفخذ الخلفي | Glute Ham Raise | `glute-ham-raise` |
| GL-013 | هيب ثراست مع توقف | Paused Hip Thrust | `paused-hip-thrust` |
| GL-014 | ركلة حمار | Donkey Kick | `donkey-kick` |
| GL-015 | مشي جانبي بمقاومة | Banded Lateral Walk | `banded-lateral-walk` |
| GL-016 | مشي الوحش | Monster Walk | `monster-walk` |
| GL-017 | سوينغ كيتل بيل | Kettlebell Swing | `kettlebell-swing` |
| GL-018 | هيب ثراست بعجز | Deficit Hip Thrust | `deficit-hip-thrust` |
| GL-019 | كاس جسر أرداف | Kas Glute Bridge | `kas-glute-bridge` |
| GL-020 | هيب ثراست بالجهاز | Hip Thrust Machine | `hip-thrust-machine` |
| GL-021 | كيك باك أرداف واقف | Standing Glute Kickback | `standing-glute-kickback` |
| GL-022 | هيب ثراست سميث | Smith Machine Hip Thrust | `smith-machine-hip-thrust` |
| GL-023 | جسر أرداف بالبار | Barbell Glute Bridge | `barbell-glute-bridge` |
| GL-024 | مشي جانبي بشريط | Lateral Band Walk | `lateral-band-walk` |
| GL-025 | نزول درجة | Step Down | `step-down` |
| CA-001 | ربلة واقف | Standing Calf Raise | `standing-calf-raise` |
| CA-002 | ربلة جالس | Seated Calf Raise | `seated-calf-raise` |
| CA-003 | ربلة حمار | Donkey Calf Raise | `donkey-calf-raise` |
| CA-004 | ربلة برس | Leg Press Calf Raise | `leg-press-calf-raise` |
| CA-005 | ربلة رجل واحدة | Single Leg Calf Raise | `single-leg-calf-raise` |
| CA-006 | ربلة سميث | Smith Machine Calf Raise | `smith-machine-calf-raise` |
| CA-007 | رفع الساق الأمامي | Tibialis Raise | `tibialis-raise` |
| CA-008 | ربلة على درجة | Calf Raise on Step | `calf-raise-on-step` |
| CA-009 | ربلة هاك سكوات | Hack Squat Calf Raise | `hack-squat-calf-raise` |
| CA-010 | ربلة بالبار | Barbell Calf Raise | `barbell-calf-raise` |
| CA-011 | ربلة انفجارية | Explosive Calf Raise | `explosive-calf-raise` |
| CA-012 | ثبات ربلة | Isometric Calf Hold | `isometric-calf-hold` |
| CA-013 | ربلة مرحلة سالبة | Eccentric Calf Raise | `eccentric-calf-raise` |
| CA-014 | ربلة بلغارية | Bulgarian Calf Raise | `bulgarian-calf-raise` |
| CA-015 | ربلة أثناء سكوات | Squat Hold Calf Raise | `squat-hold-calf-raise` |
| AB-001 | كرنش | Crunch | `crunch` |
| AB-002 | كرنش عكسي | Reverse Crunch | `reverse-crunch` |
| AB-003 | كرنش دراجة | Bicycle Crunch | `bicycle-crunch` |
| AB-004 | رفع رجل معلق | Hanging Leg Raise | `hanging-leg-raise` |
| AB-005 | رفع ركبة معلق | Hanging Knee Raise | `hanging-knee-raise` |
| AB-006 | بلانك | Plank | `plank` |
| AB-007 | بلانك جانبي | Side Plank | `side-plank` |
| AB-008 | لف روسي | Russian Twist | `russian-twist` |
| AB-009 | عجلة البطن | Ab Wheel Rollout | `ab-wheel-rollout` |
| AB-010 | كرنش كيبل | Cable Crunch | `cable-crunch` |
| AB-011 | ديد باغ | Dead Bug | `dead-bug` |
| AB-012 | بالوف برس | Pallof Press | `pallof-press` |
| AB-013 | في أب | V-Up | `v-up` |
| AB-014 | دراجون فلاق | Dragon Flag | `dragon-flag` |
| AB-015 | أصابع للعارضة | Toes to Bar | `toes-to-bar` |
| AB-016 | ثبات مجوف | Hollow Hold | `hollow-hold` |
| AB-017 | هز مجوف | Hollow Rock | `hollow-rock` |
| AB-018 | جلوس L | L-Sit | `l-sit` |
| AB-019 | جلوس كامل | Sit Up | `sit-up` |
| AB-020 | جاك نايف | Jackknife | `jackknife` |
| AB-021 | ركلات رفرفة | Flutter Kicks | `flutter-kicks` |
| AB-022 | ماسحات الزجاج | Windshield Wipers | `windshield-wipers` |
| AB-023 | بلانك كوبنهاغن | Copenhagen Plank | `copenhagen-plank` |
| AB-024 | تقطيع خشب كيبل | Cable Wood Chop | `cable-wood-chop` |
| AB-025 | كرنش مائل | Oblique Crunch | `oblique-crunch` |
| AB-026 | لمس الكعب | Heel Taps | `heel-taps` |
| AB-027 | زحف الدب | Bear Crawl | `bear-crawl` |
| AB-028 | تحريك القدر | Stir the Pot | `stir-the-pot` |
| AB-029 | ماسحات معلقة | Hanging Windshield Wiper | `hanging-windshield-wiper` |
| AB-030 | جلوس مائل للأسفل | Decline Sit Up | `decline-sit-up` |
| CR-001 | جري على جهاز المشي | Treadmill Run | `treadmill-run` |
| CR-002 | دراجة ثابتة | Stationary Bike | `stationary-bike` |
| CR-003 | جهاز التجديف | Rowing Machine | `rowing-machine` |
| CR-004 | إليبتيكال | Elliptical | `elliptical` |
| CR-005 | نط الحبل | Jump Rope | `jump-rope` |
| CR-006 | بيربي | Burpees | `burpees` |
| CR-007 | تسلق جبل | Mountain Climbers | `mountain-climbers` |
| CR-008 | حبال المعركة | Battle Ropes | `battle-ropes` |
| CR-009 | درج متحرك | Stair Climber | `stair-climber` |
| CR-010 | تكرارات سبرينت | Sprint Intervals | `sprint-intervals` |
| CR-011 | دراجة أسولت | Assault Bike | `assault-bike` |
| CR-012 | سباحة | Swimming | `swimming` |
| CR-013 | ملاكمة ظل | Shadow Boxing | `shadow-boxing` |
| CR-014 | دائرة HIIT | HIIT Circuit | `hiit-circuit` |
| CR-015 | مشي مائل | Incline Walk | `incline-walk` |
| CR-016 | جري خارجي | Outdoor Run | `outdoor-run` |
| CR-017 | دراجة خارجية | Outdoor Cycling | `outdoor-cycling` |
| CR-018 | ملاكمة | Boxing | `boxing` |
| CR-019 | كيك بوكسينغ | Kickboxing | `kickboxing` |
| CR-020 | تاباتا | Tabata | `tabata` |
| CR-021 | دفع زلاجة | Sled Push | `sled-push` |
| CR-022 | سحب زلاجة | Sled Drag | `sled-drag` |
| CR-023 | جهاز تزلج | Ski Erg | `ski-erg` |
| CR-024 | جهاز تسلق | Versa Climber | `versa-climber` |
| CR-025 | جري مائي | Aqua Jogging | `aqua-jogging` |

---

## 7. الجدول الموحّد الكامل

أعمدة التسليم المطلوبة، مع `movement` و`exercise_type` و`group` و`v2_status` و`slug` للتصنيف الكامل.

| exercise_id | name_ar | name_en | primary_muscle | secondary_muscles | equipment | difficulty | media_status | used_in_programs | movement | exercise_type | group | v2_status | slug |
|-------------|---------|---------|----------------|-------------------|-----------|------------|--------------|------------------|----------|---------------|-------|-----------|------|
| CH-001 | بنش برس | Bench Press | CHEST | TRICEPS, ANTERIOR_DELTOID | BARBELL | intermediate | placeholder | معاينة مجانية | HORIZONTAL_PUSH | strength | Chest | APPROVED | `bench-press` |
| CH-002 | بنش علوي | Incline Bench Press | CHEST | TRICEPS, ANTERIOR_DELTOID | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `incline-bench-press` |
| CH-003 | بنش دمبل | Dumbbell Bench Press | CHEST | TRICEPS, ANTERIOR_DELTOID | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `dumbbell-bench-press` |
| CH-004 | ضغط | Push Up | CHEST | TRICEPS, ANTERIOR_DELTOID | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `push-up` |
| CH-005 | فلاي صدر | Chest Fly | CHEST | TRICEPS, ANTERIOR_DELTOID | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `chest-fly` |
| CH-006 | بنش سفلي | Decline Bench Press | CHEST | TRICEPS, ANTERIOR_DELTOID | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `decline-bench-press` |
| CH-007 | ضغط دمبل علوي | Incline Dumbbell Press | CHEST | TRICEPS, ANTERIOR_DELTOID | DUMBBELLS | intermediate | placeholder | معاينة مجانية | HORIZONTAL_PUSH | strength | Chest | APPROVED | `incline-dumbbell-press` |
| CH-008 | ضغط دمبل سفلي | Decline Dumbbell Press | CHEST | TRICEPS, ANTERIOR_DELTOID | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `decline-dumbbell-press` |
| CH-009 | فلاي دمبل | Dumbbell Fly | CHEST | TRICEPS, ANTERIOR_DELTOID | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `dumbbell-fly` |
| CH-010 | كيبل فلاي علوي | Cable Fly High | CHEST | TRICEPS, ANTERIOR_DELTOID | CABLE_STATION | intermediate | placeholder | معاينة مجانية | HORIZONTAL_PUSH | strength | Chest | APPROVED | `cable-fly-high` |
| CH-011 | كيبل فلاي سفلي | Cable Fly Low | CHEST | TRICEPS, ANTERIOR_DELTOID | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `cable-fly-low` |
| CH-012 | جهاز ضغط صدر | Machine Chest Press | CHEST | TRICEPS, ANTERIOR_DELTOID | MACHINE | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `machine-chest-press` |
| CH-013 | ضغط ماسة | Diamond Push Up | TRICEPS | CHEST | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Chest | APPROVED | `diamond-push-up` |
| CH-014 | دِبّ صدر | Chest Dip | CHEST | TRICEPS, ANTERIOR_DELTOID | PARALLEL_BARS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PUSH | strength | Chest | APPROVED | `chest-dip` |
| BA-001 | سحب عالي | Pull Up | LATS | BICEPS, UPPER_BACK | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `pull-up` |
| BA-002 | سحب قبضة معكوسة | Chin Up | LATS | BICEPS, UPPER_BACK | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `chin-up` |
| BA-003 | سحب عريض | Wide Grip Pull Up | LATS | BICEPS, UPPER_BACK | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `wide-grip-pull-up` |
| BA-004 | سحب قبضة محايدة | Neutral Grip Pull Up | LATS | BICEPS, UPPER_BACK | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `neutral-grip-pull-up` |
| BA-005 | سحب عالي بمساعدة | Assisted Pull Up | LATS | BICEPS, UPPER_BACK | ASSISTED_PULL_UP_MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `assisted-pull-up` |
| BA-006 | سحب لات | Lat Pulldown | LATS | BICEPS, UPPER_BACK | MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `lat-pulldown` |
| BA-007 | سحب لات عريض | Wide Grip Lat Pulldown | LATS | BICEPS, UPPER_BACK | MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `wide-grip-lat-pulldown` |
| BA-008 | سحب لات ضيق | Close Grip Lat Pulldown | LATS | BICEPS, UPPER_BACK | MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `close-grip-lat-pulldown` |
| BA-009 | سحب ذراع مستقيم | Straight Arm Pulldown | LATS | BICEPS, UPPER_BACK | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `straight-arm-pulldown` |
| BA-010 | روو بالبار | Barbell Row | UPPER_BACK | LATS, BICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `barbell-row` |
| BA-011 | بيندلاي روو | Pendlay Row | UPPER_BACK | LATS, BICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `pendlay-row` |
| BA-012 | تي بار روو | T-Bar Row | UPPER_BACK | LATS, BICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `t-bar-row` |
| BA-013 | روو دمبل منحني | Bent Over Dumbbell Row | UPPER_BACK | LATS, BICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `bent-over-dumbbell-row` |
| BA-014 | روو دمبل بيد واحدة | Single Arm Dumbbell Row | UPPER_BACK | LATS, BICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `single-arm-dumbbell-row` |
| BA-015 | روو كيبل بيد واحدة | One Arm Cable Row | UPPER_BACK | LATS, BICEPS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `one-arm-cable-row` |
| BA-016 | روو كيبل جالس | Seated Cable Row | UPPER_BACK | LATS, BICEPS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `seated-cable-row` |
| BA-017 | روو بصدر مدعوم | Chest Supported Row | UPPER_BACK | LATS, BICEPS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `chest-supported-row` |
| BA-018 | روو بالجهاز | Machine Row | LATS | BICEPS, UPPER_BACK | MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `machine-row` |
| BA-019 | ميدوز روو | Meadows Row | UPPER_BACK | LATS, BICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `meadows-row` |
| BA-020 | سيل روو | Seal Row | UPPER_BACK | LATS, BICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `seal-row` |
| BA-021 | روو معكوس | Inverted Row | UPPER_BACK | LATS, BICEPS | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Back | APPROVED | `inverted-row` |
| BA-022 | ديدليفت تقليدي | Conventional Deadlift | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | advanced | placeholder | غير معيّن في المستودع | HINGE | strength | Back | APPROVED | `conventional-deadlift` |
| BA-023 | ديدليفت روماني | Romanian Deadlift | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HINGE | strength | Back | APPROVED | `romanian-deadlift` |
| BA-024 | ديدليفت سومو | Sumo Deadlift | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HINGE | strength | Back | APPROVED | `sumo-deadlift` |
| BA-025 | ديدليفت تراب بار | Trap Bar Deadlift | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HINGE | strength | Back | APPROVED | `trap-bar-deadlift` |
| BA-026 | راك بول | Rack Pull | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HINGE | strength | Back | APPROVED | `rack-pull` |
| BA-027 | فيس بول | Face Pull | POSTERIOR_DELTOID | TRAPEZIUS, RHOMBOIDS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_EXTERNAL_ROTATION | strength | Back | APPROVED | `face-pull` |
| BA-028 | شراغ بالبار | Barbell Shrug | TRAPEZIUS | FOREARMS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `barbell-shrug` |
| BA-029 | شراغ دمبل | Dumbbell Shrug | TRAPEZIUS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PULL | strength | Back | APPROVED | `dumbbell-shrug` |
| BA-030 | هايبر إكستنشن | Hyperextension | UPPER_BACK | GLUTES, HAMSTRINGS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Back | APPROVED | `hyperextension` |
| BA-031 | جود مورنينغ | Good Morning | HAMSTRINGS | GLUTES, UPPER_BACK | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HINGE | strength | Back | APPROVED | `good-morning` |
| WU-001 | دوائر الذراع | Arm Circles | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `arm-circles` |
| WU-002 | تأرجح الرجلين | Leg Swings | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `leg-swings` |
| WU-003 | دوائر الورك | Hip Circles | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `hip-circles` |
| WU-004 | قفزات جاك | Jumping Jacks | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | LOCOMOTION | warmup | Warm Up | APPROVED | `jumping-jacks` |
| WU-005 | ركب عالية | High Knees | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | LOCOMOTION | warmup | Warm Up | APPROVED | `high-knees` |
| WU-006 | ركلات الردف | Butt Kicks | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | LOCOMOTION | warmup | Warm Up | APPROVED | `butt-kicks` |
| WU-007 | إنش وورم | Inchworm | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `inchworm` |
| WU-008 | قط بقرة | Cat Cow | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `cat-cow` |
| WU-009 | أعظم تمدد | World's Greatest Stretch | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `world-s-greatest-stretch` |
| WU-010 | فصل المقاومة | Band Pull Apart | FULL_BODY | — | RESISTANCE_BAND | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `band-pull-apart` |
| WU-011 | اندفاع ديناميكي | Dynamic Lunge | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `dynamic-lunge` |
| WU-012 | لف الجذع | Torso Twists | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `torso-twists` |
| WU-013 | لف الكتف | Shoulder Rolls | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `shoulder-rolls` |
| WU-014 | دوائر الكاحل | Ankle Circles | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `ankle-circles` |
| WU-015 | جري خفيف | Light Jog | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | LOCOMOTION | warmup | Warm Up | APPROVED | `light-jog` |
| WU-016 | مشي فرانكشتاين | Frankenstein Walk | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `frankenstein-walk` |
| WU-017 | سكوات وزن الجسم | Bodyweight Squat | QUADRICEPS | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | SQUAT | warmup | Warm Up | APPROVED | `bodyweight-squat` |
| WU-018 | اندفاع سبايدرمان | Spiderman Lunge | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `spiderman-lunge` |
| WU-019 | تأرجح الذراع | Arm Swings | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `arm-swings` |
| WU-020 | فتح الورك | Hip Openers | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `hip-openers` |
| WU-021 | ضغط كتفي | Scapular Push Up | UPPER_BACK | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | SCAPULAR_CONTROL | warmup | Warm Up | APPROVED | `scapular-push-up` |
| WU-022 | جسر أرداف مشي | Glute Bridge March | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `glute-bridge-march` |
| WU-023 | مشي في المكان | March in Place | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `march-in-place` |
| WU-024 | إحماء الرسغ | Wrist Warm Up | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `wrist-warm-up` |
| WU-025 | فتح وإغلاق البوابة | Open Close the Gate | FULL_BODY | — | NO_EQUIPMENT | beginner | placeholder | غير معيّن في المستودع | WARMUP | warmup | Warm Up | APPROVED | `open-close-the-gate` |
| MO-001 | تحريك الكتف بالمقاومة | Shoulder Dislocations | SHOULDERS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `shoulder-dislocations` |
| MO-002 | امتداد الظهر العلوي | Thoracic Extension | SHOULDERS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `thoracic-extension` |
| MO-003 | تمدد مثنية الورك | Hip Flexor Stretch | HIP_FLEXORS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `hip-flexor-stretch` |
| MO-004 | وضعية الحمامة | Pigeon Stretch | HIP_FLEXORS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `pigeon-stretch` |
| MO-005 | تمدد أوتار الركبة | Hamstring Stretch | HAMSTRINGS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `hamstring-stretch` |
| MO-006 | تمدد الفخذ الأمامي | Quad Stretch | QUADRICEPS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `quad-stretch` |
| MO-007 | حركة الكاحل | Ankle Mobility Drill | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `ankle-mobility-drill` |
| MO-008 | دوائر الرسغ | Wrist Circles | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `wrist-circles` |
| MO-009 | تبديل الورك 90/90 | 90/90 Hip Switch | HIP_FLEXORS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `90-90-hip-switch` |
| MO-010 | قرفصاء عميق ثابت | Deep Squat Hold | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `deep-squat-hold` |
| MO-011 | انزلاق الحائط | Wall Slides | SHOULDERS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `wall-slides` |
| MO-012 | انزلاق الكتف على الحائط | Scapular Wall Slides | SHOULDERS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `scapular-wall-slides` |
| MO-013 | فوم رولر ظهر علوي | Foam Roller Thoracic | SHOULDERS | — | FOAM_ROLLER | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `foam-roller-thoracic` |
| MO-014 | حركة الرقبة | Neck Mobility | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `neck-mobility` |
| MO-015 | قرفصاء كوزاك | Cossack Squat | HIP_FLEXORS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `cossack-squat` |
| MO-016 | كوبرا | Prone Cobra | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `prone-cobra` |
| MO-017 | وضعية الطفل | Child's Pose | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `child-s-pose` |
| MO-018 | خيط الإبرة | Thread the Needle | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `thread-the-needle` |
| MO-019 | تمدد الرقم 4 | Figure Four Stretch | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `figure-four-stretch` |
| MO-020 | تمدد المقربات | Adductor Stretch | FULL_BODY | — | MACHINE | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `adductor-stretch` |
| MO-021 | تمدد الأرداف | Glute Stretch | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `glute-stretch` |
| MO-022 | تمدد اللات | Lat Stretch | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `lat-stretch` |
| MO-023 | تمدد الصدر | Pec Stretch | SHOULDERS | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `pec-stretch` |
| MO-024 | لف العمود الفقري | Spinal Twist | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `spinal-twist` |
| MO-025 | جيفرسون كيرل | Jefferson Curl | FULL_BODY | — | MAT | beginner | placeholder | غير معيّن في المستودع | MOBILITY | mobility | Mobility | APPROVED | `jefferson-curl` |
| SH-001 | ضغط فوق الرأس | Overhead Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `overhead-press` |
| SH-002 | ضغط كتف دمبل | Dumbbell Shoulder Press | SHOULDERS | TRICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `dumbbell-shoulder-press` |
| SH-003 | أرنولد برس | Arnold Press | SHOULDERS | TRICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `arnold-press` |
| SH-004 | بوش برس | Push Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `push-press` |
| SH-005 | رفرفة جانبية | Lateral Raise | LATERAL_DELTOID | TRAPEZIUS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `lateral-raise` |
| SH-006 | رفرفة أمامية | Front Raise | ANTERIOR_DELTOID | CHEST | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_FLEXION | strength | Shoulders | APPROVED | `front-raise` |
| SH-007 | فلاي خلفي للكتف | Rear Delt Fly | POSTERIOR_DELTOID | RHOMBOIDS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Shoulders | APPROVED | `rear-delt-fly` |
| SH-008 | فلاي عكسي منحني | Bent Over Reverse Fly | POSTERIOR_DELTOID | RHOMBOIDS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Shoulders | APPROVED | `bent-over-reverse-fly` |
| SH-009 | رفرفة جانبية كيبل | Cable Lateral Raise | LATERAL_DELTOID | TRAPEZIUS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `cable-lateral-raise` |
| SH-010 | ضغط كتف بالجهاز | Machine Shoulder Press | SHOULDERS | TRICEPS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `machine-shoulder-press` |
| SH-011 | روو عمودي | Upright Row | LATERAL_DELTOID | TRAPEZIUS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `upright-row` |
| SH-012 | لاندماين برس | Landmine Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `landmine-press` |
| SH-013 | كوبان برس | Cuban Press | POSTERIOR_DELTOID | UPPER_BACK | BARBELL | advanced | placeholder | غير معيّن في المستودع | SHOULDER_EXTERNAL_ROTATION | strength | Shoulders | APPROVED | `cuban-press` |
| SH-014 | رفعة Y | Y Raise | LATERAL_DELTOID | TRAPEZIUS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `y-raise` |
| SH-015 | رفرفة جانبية بالجهاز | Machine Lateral Raise | LATERAL_DELTOID | TRAPEZIUS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `machine-lateral-raise` |
| SH-016 | رفرفة جانبية مائلة | Leaning Lateral Raise | LATERAL_DELTOID | TRAPEZIUS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `leaning-lateral-raise` |
| SH-017 | فلاي خلفي كيبل | Cable Rear Delt Fly | POSTERIOR_DELTOID | RHOMBOIDS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Shoulders | APPROVED | `cable-rear-delt-fly` |
| SH-018 | برادفورد برس | Bradford Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `bradford-press` |
| SH-019 | ضغط دمبل جالس | Seated Dumbbell Press | SHOULDERS | TRICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `seated-dumbbell-press` |
| SH-020 | فايكنغ برس | Viking Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `viking-press` |
| SH-021 | سائق الحافلة | Bus Driver | ANTERIOR_DELTOID | CHEST | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_FLEXION | strength | Shoulders | REVIEW_REQUIRED | `bus-driver` |
| SH-022 | رفرفة أمامية بقرص | Plate Front Raise | ANTERIOR_DELTOID | CHEST | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_FLEXION | strength | Shoulders | APPROVED | `plate-front-raise` |
| SH-023 | رفعة كيبل عبر الجسم | Cross Body Cable Raise | SHOULDERS | TRICEPS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `cross-body-cable-raise` |
| SH-024 | لو رايز | Lu Raise | LATERAL_DELTOID | TRAPEZIUS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | REVIEW_REQUIRED | `lu-raise` |
| SH-025 | باول رايز | Powell Raise | POSTERIOR_DELTOID | RHOMBOIDS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HORIZONTAL_PULL | strength | Shoulders | REVIEW_REQUIRED | `powell-raise` |
| SH-026 | رفعة Y كيبل | Cable Y Raise | LATERAL_DELTOID | TRAPEZIUS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `cable-y-raise` |
| SH-027 | ضغط سميث | Smith Machine Press | SHOULDERS | TRICEPS | SMITH_MACHINE | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `smith-machine-press` |
| SH-028 | لاندماين برس بيد واحدة | Single Arm Landmine Press | SHOULDERS | TRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `single-arm-landmine-press` |
| SH-029 | رفرفة جانبية خلف الظهر | Behind the Back Lateral Raise | LATERAL_DELTOID | TRAPEZIUS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SHOULDER_ABDUCTION | strength | Shoulders | APPROVED | `behind-the-back-lateral-raise` |
| SH-030 | ضغط نصف ركبة | Half Kneeling Press | SHOULDERS | TRICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | VERTICAL_PUSH | strength | Shoulders | APPROVED | `half-kneeling-press` |
| BI-001 | بايسيبس بار | Barbell Curl | BICEPS | FOREARMS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `barbell-curl` |
| BI-002 | بايسيبس دمبل | Dumbbell Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | معاينة مجانية | ELBOW_FLEXION | strength | Biceps | APPROVED | `dumbbell-curl` |
| BI-003 | هامر كيرل | Hammer Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | معاينة مجانية | ELBOW_FLEXION | strength | Biceps | APPROVED | `hammer-curl` |
| BI-004 | بريشر كيرل | Preacher Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `preacher-curl` |
| BI-005 | كونسنتريشن كيرل | Concentration Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `concentration-curl` |
| BI-006 | بايسيبس كيبل | Cable Curl | BICEPS | FOREARMS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `cable-curl` |
| BI-007 | بايسيبس دمبل مائل | Incline Dumbbell Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `incline-dumbbell-curl` |
| BI-008 | سبايدر كيرل | Spider Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `spider-curl` |
| BI-009 | بايسيبس EZ بار | EZ Bar Curl | BICEPS | FOREARMS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `ez-bar-curl` |
| BI-010 | بايسيبس عكسي | Reverse Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `reverse-curl` |
| BI-011 | بايسيبس كيبل بايبل | Bayesian Cable Curl | BICEPS | FOREARMS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `bayesian-cable-curl` |
| BI-012 | بايسيبس بالجهاز | Machine Curl | BICEPS | FOREARMS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `machine-curl` |
| BI-013 | دراج كيرل | Drag Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `drag-curl` |
| BI-014 | سكوت كيرل | Scott Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `scott-curl` |
| BI-015 | هامر كيرل عبر الجسم | Cross Body Hammer Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `cross-body-hammer-curl` |
| BI-016 | ويتر كيرل | Waiter Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `waiter-curl` |
| BI-017 | هامر كيرل كيبل | Cable Hammer Curl | BICEPS | FOREARMS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `cable-hammer-curl` |
| BI-018 | بريشر كيرل قبضة عكسية | Reverse Grip Preacher Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `reverse-grip-preacher-curl` |
| BI-019 | 21 كيرل | 21s Curl | BICEPS | FOREARMS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `21s-curl` |
| BI-020 | بايسيبس كيبل مستلقي | Lying Cable Curl | BICEPS | FOREARMS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Biceps | APPROVED | `lying-cable-curl` |
| TR-001 | ترايسيبس بول داون | Tricep Pushdown | TRICEPS | — | CABLE_STATION | intermediate | placeholder | معاينة مجانية | ELBOW_EXTENSION | strength | Triceps | APPROVED | `tricep-pushdown` |
| TR-002 | ترايسيبس حبل | Rope Pushdown | TRICEPS | — | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `rope-pushdown` |
| TR-003 | امتداد ترايسيبس فوق الرأس | Overhead Tricep Extension | TRICEPS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `overhead-tricep-extension` |
| TR-004 | سكول كرشر | Skull Crusher | TRICEPS | — | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `skull-crusher` |
| TR-005 | بنش قبضة ضيقة | Close Grip Bench Press | TRICEPS | CHEST | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `close-grip-bench-press` |
| TR-006 | كيك باك دمبل | Dumbbell Kickback | TRICEPS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `dumbbell-kickback` |
| TR-007 | دِب ترايسيبس | Tricep Dip | TRICEPS | CHEST | PARALLEL_BARS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `tricep-dip` |
| TR-008 | دِب على المقعد | Bench Dip | TRICEPS | CHEST | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `bench-dip` |
| TR-009 | امتداد كيبل علوي | Cable Overhead Extension | TRICEPS | — | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `cable-overhead-extension` |
| TR-010 | جي إم برس | JM Press | TRICEPS | CHEST | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | REVIEW_REQUIRED | `jm-press` |
| TR-011 | ترايسيبس بيد واحدة | Single Arm Pushdown | TRICEPS | — | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `single-arm-pushdown` |
| TR-012 | تيت برس | Tate Press | TRICEPS | CHEST | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `tate-press` |
| TR-013 | امتداد دمبل متدحرج | Rolling Dumbbell Extension | TRICEPS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `rolling-dumbbell-extension` |
| TR-014 | فلور برس قبضة ضيقة | Floor Press Close Grip | TRICEPS | CHEST | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `floor-press-close-grip` |
| TR-015 | بول داون قبضة عكسية | Reverse Grip Pushdown | TRICEPS | — | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `reverse-grip-pushdown` |
| TR-016 | بول داون V بار | V-Bar Pushdown | TRICEPS | — | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `v-bar-pushdown` |
| TR-017 | امتداد دمبل ذراعين | Two Arm Dumbbell Extension | TRICEPS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `two-arm-dumbbell-extension` |
| TR-018 | سكول كرشر وزن الجسم | Bodyweight Skull Crusher | TRICEPS | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `bodyweight-skull-crusher` |
| TR-019 | بورد برس | Board Press | TRICEPS | CHEST | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | APPROVED | `board-press` |
| TR-020 | كاليفورنيا برس | California Press | TRICEPS | CHEST | BARBELL | intermediate | placeholder | غير معيّن في المستودع | ELBOW_EXTENSION | strength | Triceps | REVIEW_REQUIRED | `california-press` |
| FO-001 | كيرل الرسغ | Wrist Curl | FOREARMS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `wrist-curl` |
| FO-002 | كيرل رسغ عكسي | Reverse Wrist Curl | FOREARMS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `reverse-wrist-curl` |
| FO-003 | مشي المزارع | Farmer's Walk | FOREARMS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | LOADED_CARRY | strength | Forearms | APPROVED | `farmer-s-walk` |
| FO-004 | لفافة الرسغ | Wrist Roller | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `wrist-roller` |
| FO-005 | قرص بين الأصابع | Plate Pinch | FOREARMS | — | WEIGHT_PLATE | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `plate-pinch` |
| FO-006 | تعليق ثابت | Dead Hang | FOREARMS | — | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `dead-hang` |
| FO-007 | تعليق بمنشفة | Towel Grip Hang | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `towel-grip-hang` |
| FO-008 | قبضة سميكة | Fat Grip Hold | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `fat-grip-hold` |
| FO-009 | كيرل رسغ خلف الظهر | Behind Back Wrist Curl | FOREARMS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `behind-back-wrist-curl` |
| FO-010 | زوتمان كيرل | Zottman Curl | FOREARMS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `zottman-curl` |
| FO-011 | تعليق على الرف | Rack Hold | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `rack-hold` |
| FO-012 | رفع مطرقة | Sledgehammer Levering | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `sledgehammer-levering` |
| FO-013 | ضغط المقبض | Gripper Squeeze | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `gripper-squeeze` |
| FO-014 | إمساك بار سميك | Thick Bar Hold | FOREARMS | — | GRIP_IMPLEMENT | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `thick-bar-hold` |
| FO-015 | كيرل الأصابع | Finger Curls | FOREARMS | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | ELBOW_FLEXION | strength | Forearms | APPROVED | `finger-curls` |
| LE-001 | سكوات خلفي | Back Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `back-squat` |
| LE-002 | فرونت سكوات | Front Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | advanced | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `front-squat` |
| LE-003 | جوبلت سكوات | Goblet Squat | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `goblet-squat` |
| LE-004 | ضغط رجلين | Leg Press | QUADRICEPS | GLUTES, HAMSTRINGS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `leg-press` |
| LE-005 | هاك سكوات | Hack Squat | QUADRICEPS | GLUTES, HAMSTRINGS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `hack-squat` |
| LE-006 | سكوات بلغاري | Bulgarian Split Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `bulgarian-split-squat` |
| LE-007 | اندفاع مشي | Walking Lunge | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `walking-lunge` |
| LE-008 | اندفاع خلفي | Reverse Lunge | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `reverse-lunge` |
| LE-009 | امتداد الرجل | Leg Extension | QUADRICEPS | — | MACHINE | intermediate | placeholder | غير معيّن في المستودع | KNEE_EXTENSION | strength | Legs | APPROVED | `leg-extension` |
| LE-010 | ثني الرجل | Leg Curl | HAMSTRINGS | CALVES | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | KNEE_FLEXION | strength | Legs | APPROVED | `leg-curl` |
| LE-011 | نورديك كيرل | Nordic Curl | HAMSTRINGS | CALVES | NO_EQUIPMENT | advanced | placeholder | غير معيّن في المستودع | KNEE_FLEXION | strength | Legs | APPROVED | `nordic-curl` |
| LE-012 | سيسي سكوات | Sissy Squat | QUADRICEPS | — | NO_EQUIPMENT | advanced | placeholder | غير معيّن في المستودع | KNEE_EXTENSION | strength | Legs | APPROVED | `sissy-squat` |
| LE-013 | صعود درجة | Step Up | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `step-up` |
| LE-014 | سكوات مسدس | Pistol Squat | QUADRICEPS | GLUTES, HAMSTRINGS | NO_EQUIPMENT | advanced | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `pistol-squat` |
| LE-015 | سكوات سميث | Smith Machine Squat | QUADRICEPS | GLUTES, HAMSTRINGS | SMITH_MACHINE | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `smith-machine-squat` |
| LE-016 | اندفاع جانبي | Lateral Lunge | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `lateral-lunge` |
| LE-017 | سكوات صندوق | Box Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `box-squat` |
| LE-018 | سكوات بحزام | Belt Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `belt-squat` |
| LE-019 | زيرشر سكوات | Zercher Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `zercher-squat` |
| LE-020 | سكوات منقسم | Split Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `split-squat` |
| LE-021 | سكوات فوق الرأس | Overhead Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | advanced | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `overhead-squat` |
| LE-022 | سكوات مع توقف | Pause Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `pause-squat` |
| LE-023 | سكوات بار أمان | Safety Bar Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `safety-bar-squat` |
| LE-024 | سكوات بندول | Pendulum Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `pendulum-squat` |
| LE-025 | اندفاع تحية | Curtsy Lunge | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `curtsy-lunge` |
| LE-026 | اندفاع بعجز | Deficit Lunge | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `deficit-lunge` |
| LE-027 | برس رجل واحدة | Single Leg Press | QUADRICEPS | GLUTES, HAMSTRINGS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `single-leg-press` |
| LE-028 | ثني رجل جالس | Seated Leg Curl | HAMSTRINGS | CALVES | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | KNEE_FLEXION | strength | Legs | APPROVED | `seated-leg-curl` |
| LE-029 | ثني رجل واقف | Standing Leg Curl | HAMSTRINGS | CALVES | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | KNEE_FLEXION | strength | Legs | APPROVED | `standing-leg-curl` |
| LE-030 | ثني رجل مستلقي | Lying Leg Curl | HAMSTRINGS | CALVES | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | KNEE_FLEXION | strength | Legs | APPROVED | `lying-leg-curl` |
| LE-031 | جهاز المقربات | Adductor Machine | ADDUCTORS | — | MACHINE | intermediate | placeholder | غير معيّن في المستودع | HIP_ADDUCTION | strength | Legs | APPROVED | `adductor-machine` |
| LE-032 | سكوات إسباني | Spanish Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `spanish-squat` |
| LE-033 | سكوات دراج | Cyclist Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `cyclist-squat` |
| LE-034 | سكوات كعب مرتفع | Heels Elevated Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `heels-elevated-squat` |
| LE-035 | سكوات وقفة عريضة | Wide Stance Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `wide-stance-squat` |
| LE-036 | سكوات وقفة ضيقة | Narrow Stance Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `narrow-stance-squat` |
| LE-037 | أندرسون سكوات | Anderson Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `anderson-squat` |
| LE-038 | سكوات دبوس | Pin Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `pin-squat` |
| LE-039 | سكوات تمبو | Tempo Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `tempo-squat` |
| LE-040 | جيفرسون سكوات | Jefferson Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `jefferson-squat` |
| LE-041 | سكوات لاندماين | Landmine Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `landmine-squat` |
| LE-042 | جلوس على الحائط | Wall Sit | QUADRICEPS | GLUTES | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `wall-sit` |
| LE-043 | امتداد ركبة طرفي | Terminal Knee Extension | QUADRICEPS | — | RESISTANCE_BAND | intermediate | placeholder | غير معيّن في المستودع | KNEE_EXTENSION | strength | Legs | APPROVED | `terminal-knee-extension` |
| LE-044 | صعود درجة بوليكوين | Poliquin Step Up | QUADRICEPS | GLUTES, HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `poliquin-step-up` |
| LE-045 | هاتفيلد سكوات | Hatfield Squat | QUADRICEPS | GLUTES, HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Legs | APPROVED | `hatfield-squat` |
| GL-001 | هيب ثراست | Hip Thrust | GLUTES | HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `hip-thrust` |
| GL-002 | جسر الأرداف | Glute Bridge | GLUTES | HAMSTRINGS | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `glute-bridge` |
| GL-003 | كيك باك كيبل | Cable Kickback | GLUTES | HAMSTRINGS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `cable-kickback` |
| GL-004 | ضخ ضفدع | Frog Pump | GLUTES | HAMSTRINGS | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `frog-pump` |
| GL-005 | سحب كيبل من الأسفل | Cable Pull Through | GLUTES | HAMSTRINGS | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `cable-pull-through` |
| GL-006 | هيب ثراست رجل واحدة | Single Leg Hip Thrust | GLUTES | HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `single-leg-hip-thrust` |
| GL-007 | تبعيد الورك | Hip Abduction Machine | GLUTEUS_MEDIUS | GLUTES | MACHINE | intermediate | placeholder | غير معيّن في المستودع | HIP_ABDUCTION | strength | Glutes | APPROVED | `hip-abduction-machine` |
| GL-008 | جسر بمقاومة | Banded Glute Bridge | GLUTES | HAMSTRINGS | RESISTANCE_BAND | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `banded-glute-bridge` |
| GL-009 | مرآة الحريق | Fire Hydrant | GLUTEUS_MEDIUS | GLUTES | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HIP_ABDUCTION | strength | Glutes | APPROVED | `fire-hydrant` |
| GL-010 | صدفة | Clamshell | GLUTEUS_MEDIUS | GLUTES | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HIP_ABDUCTION | strength | Glutes | APPROVED | `clamshell` |
| GL-011 | سكوات سومو | Sumo Squat | GLUTES | QUADRICEPS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Glutes | APPROVED | `sumo-squat` |
| GL-012 | رفع الأرداف والفخذ الخلفي | Glute Ham Raise | HAMSTRINGS | GLUTES | DUMBBELLS | advanced | placeholder | غير معيّن في المستودع | KNEE_FLEXION | strength | Glutes | APPROVED | `glute-ham-raise` |
| GL-013 | هيب ثراست مع توقف | Paused Hip Thrust | GLUTES | HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `paused-hip-thrust` |
| GL-014 | ركلة حمار | Donkey Kick | GLUTES | HAMSTRINGS | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `donkey-kick` |
| GL-015 | مشي جانبي بمقاومة | Banded Lateral Walk | GLUTEUS_MEDIUS | GLUTES | RESISTANCE_BAND | intermediate | placeholder | غير معيّن في المستودع | HIP_ABDUCTION | strength | Glutes | APPROVED | `banded-lateral-walk` |
| GL-016 | مشي الوحش | Monster Walk | GLUTEUS_MEDIUS | GLUTES | RESISTANCE_BAND | intermediate | placeholder | غير معيّن في المستودع | HIP_ABDUCTION | strength | Glutes | APPROVED | `monster-walk` |
| GL-017 | سوينغ كيتل بيل | Kettlebell Swing | GLUTES | HAMSTRINGS | KETTLEBELL | intermediate | placeholder | غير معيّن في المستودع | HINGE | strength | Glutes | APPROVED | `kettlebell-swing` |
| GL-018 | هيب ثراست بعجز | Deficit Hip Thrust | GLUTES | HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `deficit-hip-thrust` |
| GL-019 | كاس جسر أرداف | Kas Glute Bridge | GLUTES | HAMSTRINGS | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `kas-glute-bridge` |
| GL-020 | هيب ثراست بالجهاز | Hip Thrust Machine | GLUTES | HAMSTRINGS | MACHINE | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `hip-thrust-machine` |
| GL-021 | كيك باك أرداف واقف | Standing Glute Kickback | GLUTES | HAMSTRINGS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `standing-glute-kickback` |
| GL-022 | هيب ثراست سميث | Smith Machine Hip Thrust | GLUTES | HAMSTRINGS | SMITH_MACHINE | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `smith-machine-hip-thrust` |
| GL-023 | جسر أرداف بالبار | Barbell Glute Bridge | GLUTES | HAMSTRINGS | BARBELL | intermediate | placeholder | غير معيّن في المستودع | HIP_EXTENSION | strength | Glutes | APPROVED | `barbell-glute-bridge` |
| GL-024 | مشي جانبي بشريط | Lateral Band Walk | GLUTEUS_MEDIUS | GLUTES | RESISTANCE_BAND | intermediate | placeholder | غير معيّن في المستودع | HIP_ABDUCTION | strength | Glutes | APPROVED | `lateral-band-walk` |
| GL-025 | نزول درجة | Step Down | GLUTES | QUADRICEPS | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | SQUAT | strength | Glutes | APPROVED | `step-down` |
| CA-001 | ربلة واقف | Standing Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `standing-calf-raise` |
| CA-002 | ربلة جالس | Seated Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `seated-calf-raise` |
| CA-003 | ربلة حمار | Donkey Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `donkey-calf-raise` |
| CA-004 | ربلة برس | Leg Press Calf Raise | CALVES | — | MACHINE | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `leg-press-calf-raise` |
| CA-005 | ربلة رجل واحدة | Single Leg Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `single-leg-calf-raise` |
| CA-006 | ربلة سميث | Smith Machine Calf Raise | CALVES | — | SMITH_MACHINE | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `smith-machine-calf-raise` |
| CA-007 | رفع الساق الأمامي | Tibialis Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `tibialis-raise` |
| CA-008 | ربلة على درجة | Calf Raise on Step | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `calf-raise-on-step` |
| CA-009 | ربلة هاك سكوات | Hack Squat Calf Raise | CALVES | — | MACHINE | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `hack-squat-calf-raise` |
| CA-010 | ربلة بالبار | Barbell Calf Raise | CALVES | — | BARBELL | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `barbell-calf-raise` |
| CA-011 | ربلة انفجارية | Explosive Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `explosive-calf-raise` |
| CA-012 | ثبات ربلة | Isometric Calf Hold | CALVES | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `isometric-calf-hold` |
| CA-013 | ربلة مرحلة سالبة | Eccentric Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `eccentric-calf-raise` |
| CA-014 | ربلة بلغارية | Bulgarian Calf Raise | CALVES | — | DUMBBELLS | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `bulgarian-calf-raise` |
| CA-015 | ربلة أثناء سكوات | Squat Hold Calf Raise | CALVES | — | BARBELL | intermediate | placeholder | غير معيّن في المستودع | CALF_RAISE | strength | Calves | APPROVED | `squat-hold-calf-raise` |
| AB-001 | كرنش | Crunch | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `crunch` |
| AB-002 | كرنش عكسي | Reverse Crunch | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `reverse-crunch` |
| AB-003 | كرنش دراجة | Bicycle Crunch | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `bicycle-crunch` |
| AB-004 | رفع رجل معلق | Hanging Leg Raise | RECTUS_ABDOMINIS | CORE | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `hanging-leg-raise` |
| AB-005 | رفع ركبة معلق | Hanging Knee Raise | RECTUS_ABDOMINIS | CORE | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `hanging-knee-raise` |
| AB-006 | بلانك | Plank | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `plank` |
| AB-007 | بلانك جانبي | Side Plank | OBLIQUES | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LATERAL_STABILITY | strength | Abs | APPROVED | `side-plank` |
| AB-008 | لف روسي | Russian Twist | OBLIQUES | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_ROTATION | strength | Abs | APPROVED | `russian-twist` |
| AB-009 | عجلة البطن | Ab Wheel Rollout | RECTUS_ABDOMINIS | CORE | AB_WHEEL | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `ab-wheel-rollout` |
| AB-010 | كرنش كيبل | Cable Crunch | RECTUS_ABDOMINIS | CORE | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `cable-crunch` |
| AB-011 | ديد باغ | Dead Bug | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `dead-bug` |
| AB-012 | بالوف برس | Pallof Press | OBLIQUES | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_ROTATION | strength | Abs | APPROVED | `pallof-press` |
| AB-013 | في أب | V-Up | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `v-up` |
| AB-014 | دراجون فلاق | Dragon Flag | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | advanced | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `dragon-flag` |
| AB-015 | أصابع للعارضة | Toes to Bar | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `toes-to-bar` |
| AB-016 | ثبات مجوف | Hollow Hold | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `hollow-hold` |
| AB-017 | هز مجوف | Hollow Rock | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `hollow-rock` |
| AB-018 | جلوس L | L-Sit | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `l-sit` |
| AB-019 | جلوس كامل | Sit Up | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `sit-up` |
| AB-020 | جاك نايف | Jackknife | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `jackknife` |
| AB-021 | ركلات رفرفة | Flutter Kicks | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `flutter-kicks` |
| AB-022 | ماسحات الزجاج | Windshield Wipers | OBLIQUES | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_ROTATION | strength | Abs | APPROVED | `windshield-wipers` |
| AB-023 | بلانك كوبنهاغن | Copenhagen Plank | OBLIQUES | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LATERAL_STABILITY | strength | Abs | APPROVED | `copenhagen-plank` |
| AB-024 | تقطيع خشب كيبل | Cable Wood Chop | OBLIQUES | CORE | CABLE_STATION | intermediate | placeholder | غير معيّن في المستودع | ANTI_ROTATION | strength | Abs | APPROVED | `cable-wood-chop` |
| AB-025 | كرنش مائل | Oblique Crunch | OBLIQUES | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LATERAL_STABILITY | strength | Abs | APPROVED | `oblique-crunch` |
| AB-026 | لمس الكعب | Heel Taps | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `heel-taps` |
| AB-027 | زحف الدب | Bear Crawl | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `bear-crawl` |
| AB-028 | تحريك القدر | Stir the Pot | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | ANTI_EXTENSION | strength | Abs | APPROVED | `stir-the-pot` |
| AB-029 | ماسحات معلقة | Hanging Windshield Wiper | OBLIQUES | CORE | PULL_UP_BAR | intermediate | placeholder | غير معيّن في المستودع | ANTI_ROTATION | strength | Abs | APPROVED | `hanging-windshield-wiper` |
| AB-030 | جلوس مائل للأسفل | Decline Sit Up | RECTUS_ABDOMINIS | CORE | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | TRUNK_FLEXION | strength | Abs | APPROVED | `decline-sit-up` |
| CR-001 | جري على جهاز المشي | Treadmill Run | FULL_BODY | — | TREADMILL | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `treadmill-run` |
| CR-002 | دراجة ثابتة | Stationary Bike | FULL_BODY | — | BIKE | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `stationary-bike` |
| CR-003 | جهاز التجديف | Rowing Machine | FULL_BODY | — | ROWER | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `rowing-machine` |
| CR-004 | إليبتيكال | Elliptical | FULL_BODY | — | ELLIPTICAL | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `elliptical` |
| CR-005 | نط الحبل | Jump Rope | FULL_BODY | — | JUMP_ROPE | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `jump-rope` |
| CR-006 | بيربي | Burpees | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `burpees` |
| CR-007 | تسلق جبل | Mountain Climbers | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `mountain-climbers` |
| CR-008 | حبال المعركة | Battle Ropes | FULL_BODY | — | BATTLE_ROPES | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `battle-ropes` |
| CR-009 | درج متحرك | Stair Climber | FULL_BODY | — | STAIR_CLIMBER | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `stair-climber` |
| CR-010 | تكرارات سبرينت | Sprint Intervals | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `sprint-intervals` |
| CR-011 | دراجة أسولت | Assault Bike | FULL_BODY | — | BIKE | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `assault-bike` |
| CR-012 | سباحة | Swimming | FULL_BODY | — | POOL | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `swimming` |
| CR-013 | ملاكمة ظل | Shadow Boxing | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `shadow-boxing` |
| CR-014 | دائرة HIIT | HIIT Circuit | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | REVIEW_REQUIRED | `hiit-circuit` |
| CR-015 | مشي مائل | Incline Walk | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `incline-walk` |
| CR-016 | جري خارجي | Outdoor Run | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `outdoor-run` |
| CR-017 | دراجة خارجية | Outdoor Cycling | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `outdoor-cycling` |
| CR-018 | ملاكمة | Boxing | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `boxing` |
| CR-019 | كيك بوكسينغ | Kickboxing | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | APPROVED | `kickboxing` |
| CR-020 | تاباتا | Tabata | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | INTERVAL_CONDITIONING | cardio | Cardio | REVIEW_REQUIRED | `tabata` |
| CR-021 | دفع زلاجة | Sled Push | FULL_BODY | — | SLED | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `sled-push` |
| CR-022 | سحب زلاجة | Sled Drag | FULL_BODY | — | SLED | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `sled-drag` |
| CR-023 | جهاز تزلج | Ski Erg | FULL_BODY | — | SKI_ERG | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `ski-erg` |
| CR-024 | جهاز تسلق | Versa Climber | FULL_BODY | — | VERSA_CLIMBER | intermediate | placeholder | غير معيّن في المستودع | STEADY_CARDIO | cardio | Cardio | APPROVED | `versa-climber` |
| CR-025 | جري مائي | Aqua Jogging | FULL_BODY | — | NO_EQUIPMENT | intermediate | placeholder | غير معيّن في المستودع | LOCOMOTION | cardio | Cardio | APPROVED | `aqua-jogging` |

---

## 8. حدود هذا الجرد

- العدد 320 من كتالوج المستودع، لا من استعلام حي على PRODUCTION/STAGING.
- UUID `id` غير مدرج لكل صف لأنه غير موجود في JSON.
- استخدام برامج المدربين والعملاء الحية غير مؤكد بدون استعلام قاعدة بيانات.
- لا إنشاء تمارين، لا مزامنة، لا تغيير وسائط.

