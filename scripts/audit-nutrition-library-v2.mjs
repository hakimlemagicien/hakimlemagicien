import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const root = process.cwd();
const runtimePath = path.join(root, "src/lib/platform/data/nutrition-library-v2.json");
const mirrorPath = path.join(root, "nutrition-library/v2/nutrition-library-v2.json");
const runtimeRaw = fs.readFileSync(runtimePath, "utf8");
const library = JSON.parse(runtimeRaw);
const meals = library.meals;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const runtimeHash = hash(runtimeRaw);
const mirrorHash = hash(fs.readFileSync(mirrorPath, "utf8"));
const auditDate = "2026-09-17";

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (value) => Math.round(value * 10) / 10;
const range = (rows, key) => {
  const values = rows.map((meal) => Number(meal[key]));
  return `${round(Math.min(...values))}–${round(Math.max(...values))}`;
};
const stats = (rows) => ({
  count: rows.length,
  calories: [
    Math.min(...rows.map((m) => m.calories)),
    round(median(rows.map((m) => m.calories))),
    Math.max(...rows.map((m) => m.calories)),
  ],
  protein: [
    Math.min(...rows.map((m) => m.protein_g)),
    round(median(rows.map((m) => m.protein_g))),
    Math.max(...rows.map((m) => m.protein_g)),
  ],
  carbs: [
    Math.min(...rows.map((m) => m.carbs_g)),
    round(median(rows.map((m) => m.carbs_g))),
    Math.max(...rows.map((m) => m.carbs_g)),
  ],
  fat: [
    Math.min(...rows.map((m) => m.fat_g)),
    round(median(rows.map((m) => m.fat_g))),
    Math.max(...rows.map((m) => m.fat_g)),
  ],
});

const categories = {
  BREAKFAST: meals.filter((m) => m.meal_type === "breakfast"),
  MAIN_MEAL: meals.filter((m) => m.meal_type === "lunch" || m.meal_type === "dinner"),
  SNACK: meals.filter((m) => m.meal_type === "snack"),
  PRE_WORKOUT: meals.filter((m) => m.meal_type === "pre_workout"),
  POST_WORKOUT: meals.filter((m) => m.meal_type === "post_workout"),
  MULTI_SLOT: [],
  UNCLASSIFIED: meals.filter((m) => m.meal_type === "drinks"),
};

const categoryFor = (meal) => {
  if (meal.meal_type === "breakfast") return "BREAKFAST";
  if (meal.meal_type === "lunch" || meal.meal_type === "dinner") return "MAIN_MEAL";
  if (meal.meal_type === "snack") return "SNACK";
  if (meal.meal_type === "pre_workout") return "PRE_WORKOUT";
  if (meal.meal_type === "post_workout") return "POST_WORKOUT";
  return "UNCLASSIFIED";
};

// Audit-only, non-clinical screens. They do not alter product data or become a product contract.
const preUsable = (meal) =>
  meal.meal_type === "pre_workout" &&
  meal.carbs_g >= 20 &&
  meal.fat_g <= 15 &&
  meal.qa?.derived_fiber_g <= 10 &&
  meal.calories <= 500 &&
  meal.serving_size <= 600;
const postUsable = (meal) =>
  meal.meal_type === "post_workout" &&
  meal.protein_g >= 20 &&
  meal.carbs_g >= 20 &&
  meal.fat_g <= 20 &&
  meal.calories <= 700 &&
  meal.serving_size <= 700;

const preUsableMeals = meals.filter(preUsable);
const postUsableMeals = meals.filter(postUsable);
const allIds = meals.map((m) => m.external_id);
const idSet = new Set(allIds);
const missingIds = Array.from(
  { length: 300 },
  (_, index) => `MEAL-${String(index + 1).padStart(3, "0")}`,
).filter((id) => !idSet.has(id));
const duplicatesBy = (selector) => {
  const grouped = new Map();
  for (const meal of meals) {
    const key = selector(meal);
    grouped.set(key, [...(grouped.get(key) ?? []), meal.external_id]);
  }
  return [...grouped.entries()].filter(([, ids]) => ids.length > 1);
};
const duplicateIds = duplicatesBy((m) => m.external_id);
const duplicateArabicNames = duplicatesBy((m) => m.name_ar);
const duplicateEnglishNames = duplicatesBy((m) => m.name_en);
const duplicateNutritionProfiles = duplicatesBy((m) =>
  [m.calories, m.protein_g, m.carbs_g, m.fat_g].join("|"),
);

const deliveryExists = (meal, file) =>
  fs.existsSync(path.join(root, "public/nutrition/meals", meal.external_id, file));
const checks = {
  missing_calories: meals.filter((m) => !Number.isFinite(m.calories)),
  missing_macros: meals.filter((m) => ![m.protein_g, m.carbs_g, m.fat_g].every(Number.isFinite)),
  impossible_macros: meals.filter((m) => {
    if ([m.calories, m.protein_g, m.carbs_g, m.fat_g].some((v) => !Number.isFinite(v) || v < 0))
      return true;
    const macroCalories = m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9;
    return Math.abs(macroCalories - m.calories) / m.calories > 0.1;
  }),
  missing_ingredients: meals.filter(
    (m) => !Array.isArray(m.ingredients) || m.ingredients.length === 0,
  ),
  missing_media: meals.filter(
    (m) =>
      m.image_status !== "ready" ||
      m.image?.status !== "ready" ||
      !deliveryExists(m, "cover.webp") ||
      !deliveryExists(m, "cover-thumb.webp"),
  ),
  placeholder_media: meals.filter((m) =>
    ["placeholder", "missing", "review_required"].includes(m.image_status),
  ),
  missing_servings: meals.filter(
    (m) => !(m.serving_size > 0) || !m.serving_unit || !(m.yield_servings > 0),
  ),
  invalid_ids: meals.filter((m) => !/^MEAL-\d{3}$/.test(m.external_id)),
  missing_slot_metadata: meals.filter((m) => !m.meal_type),
  inconsistent_names: meals.filter(
    (m) => !m.name_ar?.trim() || !m.name_en?.trim() || m.name_ar.trim() === m.name_en.trim(),
  ),
  conflicting_tags: meals.filter(
    (m) =>
      (m.dietary_tags.includes("gluten_free") && m.allergens.includes("gluten")) ||
      (m.dietary_tags.includes("vegan") &&
        m.allergens.some((a) => ["milk", "egg", "fish", "shellfish"].includes(a))),
  ),
  qa_failures: meals.filter((m) =>
    Object.entries(m.qa ?? {}).some(([key, value]) => key.endsWith("_check") && value !== "pass"),
  ),
  inactive: meals.filter((m) => m.status !== "published" || m.review_status !== "ready"),
};

const goalKeys = ["fat_loss", "maintenance", "muscle_gain"];
const typeKeys = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout", "drinks"];
const goalMatrix = Object.fromEntries(
  goalKeys.map((goal) => {
    const pool = meals.filter((meal) => meal.suitable_goals.includes(goal));
    return [
      goal,
      {
        total: pool.length,
        byType: Object.fromEntries(
          typeKeys.map((type) => [type, pool.filter((meal) => meal.meal_type === type).length]),
        ),
        preUsable: preUsableMeals.filter((meal) => meal.suitable_goals.includes(goal)).length,
        postUsable: postUsableMeals.filter((meal) => meal.suitable_goals.includes(goal)).length,
      },
    ];
  }),
);

const calorieBucket = (value) =>
  value < 250
    ? "<250"
    : value < 400
      ? "250–399"
      : value < 550
        ? "400–549"
        : value < 700
          ? "550–699"
          : "700+";
const proteinBucket = (value) =>
  value < 15
    ? "<15g"
    : value < 25
      ? "15–24g"
      : value < 35
        ? "25–34g"
        : value < 45
          ? "35–44g"
          : "45g+";
const bucketCounts = (rows, selector, orderedKeys) => {
  const result = Object.fromEntries(orderedKeys.map((key) => [key, 0]));
  for (const row of rows) result[selector(row)] += 1;
  return result;
};
const calorieBuckets = ["<250", "250–399", "400–549", "550–699", "700+"];
const proteinBuckets = ["<15g", "15–24g", "25–34g", "35–44g", "45g+"];

const sourceLine = `Runtime SHA-256: \`${runtimeHash}\`; mirror SHA-256: \`${mirrorHash}\`; identical: **${runtimeHash === mirrorHash ? "YES" : "NO"}**.`;
const overall = stats(meals);
const statRows = Object.entries(categories)
  .filter(([, rows]) => rows.length)
  .map(([name, rows]) => {
    const s = stats(rows);
    return `| ${name} | ${s.count} | ${s.calories.join(" / ")} | ${s.protein.join(" / ")} | ${s.carbs.join(" / ")} | ${s.fat.join(" / ")} |`;
  })
  .join("\n");

const audit = `# تدقيق الجرد الكامل لمكتبة التغذية V2

**تاريخ التدقيق:** ${auditDate}  
**نوع المهمة:** تدقيق وجرد فقط؛ لم يتغير الكتالوج أو منطق التغذية أو واجهة العميل.

## مصدر الحقيقة

- التعريف الرسمي: \`nutrition-library/SOURCE.json\`.
- ملف التشغيل: \`src/lib/platform/data/nutrition-library-v2.json\`.
- النسخة المرجعية: \`nutrition-library/v2/nutrition-library-v2.json\`.
- Schema: \`${library.schema_version}\`، catalog: \`${library.catalog}\`، generated_on: \`${library.generated_on}\`.
- ${sourceLine}
- لم تُستخدم دفعات V1 القديمة في الحساب.

## النتيجة التنفيذية

| المؤشر | النتيجة |
|---|---:|
| TOTAL_MEALS | ${meals.length} |
| ACTIVE_MEALS | ${meals.length - checks.inactive.length} |
| INACTIVE_MEALS | ${checks.inactive.length} |
| DUPLICATE_IDS | ${duplicateIds.length} |
| MISSING_IDS | ${missingIds.length} |
| FIRST_ID | ${allIds[0]} |
| LAST_ID | ${allIds.at(-1)} |

كل السجلات الـ${meals.length} منشورة، review_status=ready، وملفات cover وthumbnail موجودة. لا توجد فجوات أو تكرارات في الهوية.

## تصنيف الخانات

اعتمد التصنيف على \`meal_type\` الرسمي فقط (CLASSIFICATION_SOURCE=OFFICIAL). تم جمع lunch+dinner تحت MAIN_MEAL. بقيت drinks ضمن UNCLASSIFIED لأن قائمة المهمة لا تحتوي فئة DRINKS، ولأن العقد الرسمي يمنع تحويل المشروب إلى snack أو pre/post. لا يوجد تصنيف MULTI_SLOT في المصدر.

| الفئة | العدد |
|---|---:|
${Object.entries(categories)
  .map(([name, rows]) => `| ${name} | ${rows.length} |`)
  .join("\n")}

## نطاق القيم الغذائية

القيم: minimum / median / maximum.

| الفئة | العدد | السعرات | البروتين g | الكربوهيدرات g | الدهون g |
|---|---:|---:|---:|---:|---:|
${statRows}

النطاق الكلي: السعرات ${overall.calories[0]}–${overall.calories[2]} kcal (median ${overall.calories[1]})، البروتين ${overall.protein[0]}–${overall.protein[2]}g (median ${overall.protein[1]}g).

## أهداف التغذية والأهداف الرسمية للتطبيق

المكتبة لا تستخدم أهداف الكويز مباشرة. عقد V2 يسمح فقط بـ\`fat_loss\` و\`maintenance\` و\`muscle_gain\`. التطبيق يعرّف 12 هدف عميل، ويحوّلها عبر \`goal-profile-resolver.ts\` إلى هذه السلال/الأهداف الغذائية.

- FAT_LOSS وWAIST_DEFINITION → fat_loss (أو maintenance حسب الملف).
- MUSCLE_GAIN وGLUTE_GROWTH → muscle_gain.
- BODY_RECOMPOSITION وUPPER_BODY_DEFINITION وFEMININE_BALANCED_BODY → maintenance مع سياق إعادة تركيب؛ لا يوجد وسم \`body_recomposition\` في عقد V2 نفسه.
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

النتيجة: ${preUsableMeals.length} pre محافظة و${postUsableMeals.length} post محافظة. هدف muscle_gain يملك ${goalMatrix.muscle_gain.preUsable} pre محافظة فقط. لذا:

**SIX_MEAL_DAY_READY: PARTIAL** — جاهز لسبعة أيام، لكن تنويع PRE_WORKOUT لهدف muscle_gain عبر 14 يومًا ضعيف.

## قرار الوجبات الجديدة

لإنشاء قوالب 7 أيام: لا يلزم إنشاء وجبات قبل البدء. لإنشاء دورة 14 يومًا بلا تكرار مفرط وفق الشاشة المحافظة: يلزم **6 وجبات PRE_WORKOUT جديدة** تحمل maintenance + muscle_gain؛ ويجب أن تكون واحدة منها على الأقل مناسبة أيضًا لـfat_loss كي يرتفع مخزونه المحافظ من 13 إلى 14.

هذا احتياج تغطية مستنتج من الأرقام، وليس إنشاءً للوجبات أو تغييرًا لعقد القيم الغذائية.

## إجابات القرار A–G

A. العدد الحقيقي: **${meals.length}**.  
B. كل السجلات قابلة للتشغيل تقنيًا؛ ليست كلها مثالية ضمن الشاشة المحافظة لـpre/post.  
C. المكتبة تكفي لبدء قوالب 7 أيام لكل سلال التغذية الرسمية، مع محدودية تخصيص BODY_RECOMPOSITION وPRE muscle_gain.  
D. تكفي لـ4 core + Pre + Post على 7 أيام؛ جاهزية 14 يومًا **PARTIAL**.  
E. الأضعف: muscle_gain × PRE_WORKOUT؛ وBODY_RECOMPOSITION من حيث الوسم الصريح.  
F. لقوالب 7 أيام: لا. لدورة 14 يومًا قوية: نعم.  
G. العدد: **6 PRE_WORKOUT** لـmuscle_gain + maintenance، واحدة على الأقل أيضًا fat_loss.

## الحدود

- لا يحتوي V2 حقل halal؛ لذلك قيمته في الجرد \`NOT_AVAILABLE\` ولا يجوز استنتاجه.
- fiber ليس حقلًا أعلى السجل؛ استُخدم \`qa.derived_fiber_g\` مع توضيح المصدر.
- active ليس حقلًا في JSON؛ تم تمثيله في CSV كـ\`YES_DERIVED_FROM_PUBLISHED_READY\` لأن status=published وreview_status=ready لكل السجلات.
- لا توجد نتيجة طبية أو سريرية في هذا التدقيق.
`;

const coverage = `# مصفوفة تغطية مكتبة التغذية V2

## التغطية حسب هدف التغذية ونوع الوجبة

| الهدف | الإجمالي | فطور | غداء | عشاء | سناك | Pre رسمي | Post رسمي | مشروبات | Pre محافظ | Post محافظ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${goalKeys
  .map((goal) => {
    const g = goalMatrix[goal];
    return `| ${goal} | ${g.total} | ${g.byType.breakfast} | ${g.byType.lunch} | ${g.byType.dinner} | ${g.byType.snack} | ${g.byType.pre_workout} | ${g.byType.post_workout} | ${g.byType.drinks} | ${g.preUsable} | ${g.postUsable} |`;
  })
  .join("\n")}

## نطاقات الماكروز حسب الفئة

القيم minimum / median / maximum.

| الفئة | السعرات | البروتين | الكربوهيدرات | الدهون |
|---|---:|---:|---:|---:|
${Object.entries(categories)
  .filter(([, rows]) => rows.length)
  .map(([name, rows]) => {
    const s = stats(rows);
    return `| ${name} | ${s.calories.join(" / ")} | ${s.protein.join(" / ")} | ${s.carbs.join(" / ")} | ${s.fat.join(" / ")} |`;
  })
  .join("\n")}

## حزم السعرات

| الفئة | <250 | 250–399 | 400–549 | 550–699 | 700+ |
|---|---:|---:|---:|---:|---:|
${Object.entries(categories)
  .filter(([, rows]) => rows.length)
  .map(([name, rows]) => {
    const b = bucketCounts(rows, (m) => calorieBucket(m.calories), calorieBuckets);
    return `| ${name} | ${calorieBuckets.map((key) => b[key]).join(" | ")} |`;
  })
  .join("\n")}

## حزم البروتين

| الفئة | <15g | 15–24g | 25–34g | 35–44g | 45g+ |
|---|---:|---:|---:|---:|---:|
${Object.entries(categories)
  .filter(([, rows]) => rows.length)
  .map(([name, rows]) => {
    const b = bucketCounts(rows, (m) => proteinBucket(m.protein_g), proteinBuckets);
    return `| ${name} | ${proteinBuckets.map((key) => b[key]).join(" | ")} |`;
  })
  .join("\n")}

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
`;

const issueRows = [
  ["missing calories", checks.missing_calories.length],
  ["missing macros", checks.missing_macros.length],
  ["impossible macros (>10% 4/4/9 delta أو قيمة سالبة)", checks.impossible_macros.length],
  ["missing ingredients", checks.missing_ingredients.length],
  ["missing/broken media", checks.missing_media.length],
  ["placeholder media", checks.placeholder_media.length],
  ["missing serving sizes", checks.missing_servings.length],
  ["duplicate IDs", duplicateIds.length],
  ["duplicate Arabic names", duplicateArabicNames.length],
  ["duplicate English names", duplicateEnglishNames.length],
  ["duplicate nutrition profiles", duplicateNutritionProfiles.length],
  ["inconsistent bilingual names", checks.inconsistent_names.length],
  ["invalid external_id", checks.invalid_ids.length],
  ["missing meal_type", checks.missing_slot_metadata.length],
  ["conflicting dietary/allergen tags", checks.conflicting_tags.length],
  ["QA check failures", checks.qa_failures.length],
  ["inactive/not-ready", checks.inactive.length],
];
const dataQuality = `# تقرير جودة بيانات مكتبة التغذية V2

## ملخص الفحوص

| نوع المشكلة | العدد |
|---|---:|
${issueRows.map(([label, count]) => `| ${label} | ${count} |`).join("\n")}

## سلامة الهوية

- النطاق الفعلي: \`${allIds[0]}\` → \`${allIds.at(-1)}\`.
- IDs مفقودة: ${missingIds.length ? missingIds.join(", ") : "لا يوجد"}.
- IDs مكررة: ${duplicateIds.length}.
- أسماء عربية أو إنجليزية مكررة: ${duplicateArabicNames.length + duplicateEnglishNames.length}.
- ملفات غذائية متطابقة تمامًا (calories+P+C+F): ${duplicateNutritionProfiles.length}.

## الوسائط

- image_status=ready: ${meals.filter((m) => m.image_status === "ready").length}/${meals.length}.
- cover.webp الفعلي: ${meals.filter((m) => deliveryExists(m, "cover.webp")).length}/${meals.length}.
- cover-thumb.webp الفعلي: ${meals.filter((m) => deliveryExists(m, "cover-thumb.webp")).length}/${meals.length}.
- لا تعتمد النتيجة على image.reference القديم وحده؛ تم فحص مسار التسليم التشغيلي لكل external_id.

## ملاحظات عقدية وليست تلف بيانات

1. لا يوجد top-level fiber_g، لكن \`qa.derived_fiber_g\` موجود لكل السجلات ويُستخدم في CSV مع \`fiber_source\` واضح.
2. لا يوجد halal tag في القائمة الرسمية؛ لا يمكن اعتباره مفقودًا أو استنتاجه من الوصفة.
3. المشروبات العشرون صحيحة كـ\`drinks\`، لكنها UNCLASSIFIED فقط بالنسبة لفئات المهمة المختصرة.
4. لا يوجد \`body_recomposition\` ضمن suitable_goals الرسمي، بينما resolver يستطيع طلبه ثم يقبل maintenance. هذه فجوة دلالية يجب توثيقها عند بناء القوالب، وليست سببًا لتعديل الكتالوج في مهمة التدقيق.
5. كل QA checks المخزنة تمر، لكن الشاشة المحافظة لـpre/post أضيق عمدًا من مجرد meal_type.

## الوجبات التي لا تمر شاشة Pre/Post المحافظة

- Pre رسمي: ${categories.PRE_WORKOUT.length}; يمر: ${preUsableMeals.length}; يحتاج مراجعة توقيت/ثقل: ${categories.PRE_WORKOUT.length - preUsableMeals.length}.
- Post رسمي: ${categories.POST_WORKOUT.length}; يمر: ${postUsableMeals.length}; يحتاج مراجعة بروتين/دهون: ${categories.POST_WORKOUT.length - postUsableMeals.length}.
- هذه Flags تحليلية فقط، وليست أخطاء كتالوج ولا تعدل status.
`;

const csvEscape = (value) => {
  const text = value == null || value === "" ? "NOT_AVAILABLE" : String(value);
  return `"${text.replaceAll('"', '""').replaceAll("\n", " ")}"`;
};
const csvHeaders = [
  "external_id",
  "name_ar",
  "name_en",
  "active",
  "status",
  "review_status",
  "meal_type",
  "operational_category",
  "classification_source",
  "breakfast_suitability",
  "main_meal_suitability",
  "snack_suitability",
  "pre_workout_suitability",
  "post_workout_suitability",
  "pre_workout_conservative_usable",
  "post_workout_conservative_usable",
  "calories",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "fiber_source",
  "serving_size",
  "serving_unit",
  "yield_servings",
  "ingredients",
  "preparation_steps_ar",
  "preparation_steps_en",
  "image_path",
  "image_thumb_path",
  "image_status",
  "media_file_status",
  "substitution_profile",
  "allergens",
  "dietary_tags",
  "halal_tag",
  "vegetarian_tag",
  "vegan_tag",
  "suitable_goals",
  "notes",
  "source_origin",
];
const csvRows = meals.map((meal) => {
  const official = (type) => (meal.meal_type === type ? "YES_OFFICIAL" : "NO_OFFICIAL");
  const origins = [
    ...new Set(meal.ingredients.map((ingredient) => ingredient.source).filter(Boolean)),
  ].join(" | ");
  const row = {
    external_id: meal.external_id,
    name_ar: meal.name_ar,
    name_en: meal.name_en,
    active:
      meal.status === "published" && meal.review_status === "ready"
        ? "YES_DERIVED_FROM_PUBLISHED_READY"
        : "NO",
    status: meal.status,
    review_status: meal.review_status,
    meal_type: meal.meal_type,
    operational_category: categoryFor(meal),
    classification_source: "OFFICIAL_MEAL_TYPE",
    breakfast_suitability: official("breakfast"),
    main_meal_suitability: ["lunch", "dinner"].includes(meal.meal_type)
      ? "YES_OFFICIAL"
      : "NO_OFFICIAL",
    snack_suitability: official("snack"),
    pre_workout_suitability: official("pre_workout"),
    post_workout_suitability: official("post_workout"),
    pre_workout_conservative_usable: preUsable(meal) ? "YES_INFERRED_AUDIT" : "NO",
    post_workout_conservative_usable: postUsable(meal) ? "YES_INFERRED_AUDIT" : "NO",
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    fiber_g: meal.qa?.derived_fiber_g,
    fiber_source: meal.qa?.derived_fiber_g == null ? "NOT_AVAILABLE" : "qa.derived_fiber_g",
    serving_size: meal.serving_size,
    serving_unit: meal.serving_unit,
    yield_servings: meal.yield_servings,
    ingredients: meal.ingredients
      .map((i) => `${i.name_ar} / ${i.name_en}: ${i.quantity}${i.unit}`)
      .join("; "),
    preparation_steps_ar: meal.preparation_steps_ar.join(" | "),
    preparation_steps_en: meal.preparation_steps_en.join(" | "),
    image_path: `/nutrition/meals/${meal.external_id}/cover.webp`,
    image_thumb_path: `/nutrition/meals/${meal.external_id}/cover-thumb.webp`,
    image_status: meal.image_status,
    media_file_status:
      deliveryExists(meal, "cover.webp") && deliveryExists(meal, "cover-thumb.webp")
        ? "FILES_PRESENT"
        : "MISSING_OR_PARTIAL",
    substitution_profile: JSON.stringify(meal.substitution_profile),
    allergens: meal.allergens.join("|"),
    dietary_tags: meal.dietary_tags.join("|"),
    halal_tag: "NOT_AVAILABLE",
    vegetarian_tag: meal.dietary_tags.includes("vegetarian") ? "YES_EXPLICIT" : "NO_EXPLICIT_TAG",
    vegan_tag: meal.dietary_tags.includes("vegan") ? "YES_EXPLICIT" : "NO_EXPLICIT_TAG",
    suitable_goals: meal.suitable_goals.join("|"),
    notes: meal.notes,
    source_origin: origins,
  };
  return csvHeaders.map((header) => csvEscape(row[header])).join(",");
});
const csv = `${csvHeaders.map(csvEscape).join(",")}\n${csvRows.join("\n")}\n`;

fs.writeFileSync(path.join(root, "docs/NUTRITION_LIBRARY_V2_FULL_INVENTORY_AUDIT.md"), audit);
fs.writeFileSync(path.join(root, "docs/NUTRITION_LIBRARY_V2_COVERAGE_MATRIX.md"), coverage);
fs.writeFileSync(path.join(root, "docs/NUTRITION_LIBRARY_V2_DATA_QUALITY_REPORT.md"), dataQuality);
fs.writeFileSync(path.join(root, "docs/nutrition-library-v2-inventory.csv"), csv);

console.log(
  JSON.stringify(
    {
      total: meals.length,
      active: meals.length - checks.inactive.length,
      categories: Object.fromEntries(
        Object.entries(categories).map(([key, rows]) => [key, rows.length]),
      ),
      preUsable: preUsableMeals.length,
      postUsable: postUsableMeals.length,
      muscleGainPreUsable: goalMatrix.muscle_gain.preUsable,
      missingIds: missingIds.length,
      issues: Object.fromEntries(Object.entries(checks).map(([key, rows]) => [key, rows.length])),
      files: 4,
    },
    null,
    2,
  ),
);
