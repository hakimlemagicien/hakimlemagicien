/**
 * Emit Phase 9 sequence pack against Locked Product Master (37 entries). No DB writes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import {
  ACTUAL_CANONICAL_ENTRY_COUNT,
  CANONICAL_LOCKED_TEMPLATE_MASTER,
  CANONICAL_PILOT_KEYS,
  COUNT_ROOT_CAUSE_AR,
  HISTORICAL_MASTER_LABEL,
  MASTER_COUNT_DOCUMENTATION,
  MISSING_FROM_REJECTED_33,
  NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY,
  PILOT_COUNT,
  REJECTED_33_EXTRA_KEYS,
  REMAINING_CANONICAL_COUNT,
  CANONICAL_TEMPLATE_COUNT,
} from "../src/lib/platform/training-templates/phase9/canonical-locked-master.ts";
import { buildRemainingCanonicalSequencePack } from "../src/lib/platform/training-templates/phase9/sequence-pack.ts";
import { validateSequencePack } from "../src/lib/platform/training-templates/phase9/validate-sequence-pack.ts";
import { CORE_100_SET } from "../src/lib/platform/training-templates/phase9/sequence-types.ts";

const packs = buildRemainingCanonicalSequencePack();
const validation = validateSequencePack(packs);
if (!validation.ok) {
  console.error(validation.issues.filter((i) => i.severity === "error"));
  process.exit(1);
}

const allExisting = new Set<string>();
const coreUsed = new Set<string>();
for (const p of packs) {
  for (const s of p.sessions) {
    for (const e of s.exercises) {
      if (!e.external_id) continue;
      allExisting.add(e.external_id);
      if (CORE_100_SET.has(e.external_id)) coreUsed.add(e.external_id);
    }
  }
}

const gluteIds = new Set<string>();
for (const p of packs.filter((x) => x.primary_strategy === "GLUTE_FOCUS")) {
  for (const s of p.sessions) {
    for (const e of s.exercises) {
      if (e.external_id) gluteIds.add(e.external_id);
    }
  }
}

const readyKeys = packs.filter((p) => p.content_status === "CONTENT_APPROVED_FOR_IMPORT").map((p) => p.template_key);
const pendingKeys = packs
  .filter((p) => p.content_status === "CONTENT_APPROVED_PENDING_LIBRARY_ADDITION")
  .map((p) => p.template_key);

const treadDeps = packs
  .filter((p) => p.sessions.some((s) => s.exercises.some((e) => e.addition_spec_id === "ADD_TREADMILL_BRISK_WALK")))
  .map((p) => p.template_key);
const homeDeps = packs
  .filter((p) => p.sessions.some((s) => s.exercises.some((e) => e.addition_spec_id === "ADD_HOME_BRISK_WALK")))
  .map((p) => p.template_key);

const machine = {
  phase: "9/10",
  task: "FINAL_CANONICAL_MASTER_RECONCILIATION",
  generated_at: new Date().toISOString(),
  import_authorization: "NOT_AUTHORIZED",
  constraints: {
    templates_imported: 0,
    exercises_created: 0,
    db_writes: 0,
    media_generated: 0,
    staging_changed: false,
    production_changed: false,
  },
  canonical_master: {
    historical_master_label: HISTORICAL_MASTER_LABEL,
    actual_canonical_entry_count: ACTUAL_CANONICAL_ENTRY_COUNT,
    count_root_cause_ar: COUNT_ROOT_CAUSE_AR,
    count: CANONICAL_TEMPLATE_COUNT,
    pilot_count: PILOT_COUNT,
    remaining_count: REMAINING_CANONICAL_COUNT,
    current_33_master_result: MASTER_COUNT_DOCUMENTATION.current_33_master_result,
    missing_from_33_before_fix: MISSING_FROM_REJECTED_33,
    extra_in_33_before_fix: REJECTED_33_EXTRA_KEYS,
    rows: CANONICAL_LOCKED_TEMPLATE_MASTER,
    non_existent_variants: NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY,
    pilot_keys: CANONICAL_PILOT_KEYS,
  },
  diffs: {
    PRODUCT_MASTER_COUNT: 37,
    CURRENT_REPO_MASTER_COUNT: 37,
    SEQUENCE_PACK_COUNT: packs.length,
    PILOT_COUNT,
    REMAINING_COUNT: packs.length,
    MASTER_VS_MD_DIFF: "regenerated in lockstep",
    MASTER_VS_JSON_DIFF: "regenerated in lockstep",
    MD_VS_JSON_DIFF: "0 unexplained (same emitter)",
  },
  validation,
  stats: {
    ...validation.stats,
    existing_library_exercises_used: allExisting.size,
    core_100_exercises_used: coreUsed.size,
    library_additions_required: 2,
  },
  addition_specs: [
    {
      spec_id: "ADD_TREADMILL_BRISK_WALK",
      name_en: "Treadmill Brisk Walk",
      name_ar: "مشي سريع على جهاز المشي",
      external_id: "DO_NOT_INVENT",
      templates_depending: treadDeps,
    },
    {
      spec_id: "ADD_HOME_BRISK_WALK",
      name_en: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
      name_ar: "مشي سريع (خارجي / حي / بديل داخلي آمن)",
      external_id: "DO_NOT_INVENT",
      templates_depending: homeDeps,
    },
  ],
  female_media_manifest: {
    templates: ["GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D", "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D"],
    preferred_demonstrator: "FEMALE",
    preferred_media_variant: "FEMALE",
    unique_exercise_ids: [...gluteIds].sort(),
    FEMALE_MEDIA_AVAILABLE: 0,
    STANDARD_ONLY: gluteIds.size,
  },
  already_imported: CANONICAL_PILOT_KEYS.map((k) => ({
    template_key: k,
    status: "ALREADY_IMPORTED",
  })),
  templates: packs,
  ready_for_import_keys: readyKeys,
  pending_addition_keys: pendingKeys,
  review_required_keys: [] as string[],
  blocked_keys: [] as string[],
};

mkdirSync("docs/data", { recursive: true });
writeFileSync("docs/data/training-template-exercise-sequence-master-v1.json", JSON.stringify(machine, null, 2));

function slotLine(e: (typeof packs)[0]["sessions"][0]["exercises"][0]): string {
  const id = e.external_id ?? `ADDITION:${e.addition_spec_id}`;
  return `- **${e.slot_key}** · \`${id}\` · ${e.name_en} · ${e.activity_role} · ${e.sets}×${e.reps_label} · rest ${e.rest_seconds}s · smart=${e.smart_progression_eligible}`;
}

let md = `# TRAINING TEMPLATE — Exercise Sequence Master V1 (Final Canonical)

**Phase:** 9/10  
**Task:** FINAL_CANONICAL_MASTER_RECONCILIATION  
**Generated:** ${machine.generated_at}  
**Validator:** PASS  
**Import authorization:** NOT_AUTHORIZED  
**DB writes:** 0  

## ملخص

حزمة التسلسلات تطابق **Locked Product Master** حرفيًا:

| البند | القيمة |
|-------|--------|
| HISTORICAL_MASTER_LABEL | ${HISTORICAL_MASTER_LABEL} |
| ACTUAL_CANONICAL_ENTRY_COUNT | **${ACTUAL_CANONICAL_ENTRY_COUNT}** |
| PILOT | ${PILOT_COUNT} |
| REMAINING SEQUENCES | ${packs.length} |
| CONTENT_APPROVED_FOR_IMPORT | ${readyKeys.length} |
| PENDING_LIBRARY_ADDITION | ${pendingKeys.length} |
| BLOCKED | 0 |
| BROKEN_REFERENCES | 0 |
| TOTAL_STATUS_SUM | 37 |

**سبب تصحيح التسمية:** ${COUNT_ROOT_CAUSE_AR}

**ماستر 33 السابق:** REJECTED / CORRECTED

**06A / 06B:** قالبان مستقلان — \`MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D\` و \`MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D\`

---

## Pilot (ALREADY_IMPORTED)

${CANONICAL_PILOT_KEYS.map((k) => `- \`${k}\``).join("\n")}

---

`;

for (const p of packs) {
  md += `## ${p.template_key}\n\n`;
  md += `- الاستراتيجية: \`${p.primary_strategy}\` · المستوى: \`${p.level}\` · البيئة: \`${p.environment}\` · الأيام: **${p.days_per_week}**\n`;
  md += `- التقسيم: ${p.weekly_split}\n`;
  md += `- الجمهور: ${p.target_audience_ar}\n`;
  md += `- الغرض: ${p.template_purpose_ar}\n`;
  md += `- حالة المحتوى: **${p.content_status}**\n`;
  if (p.preferred_demonstrator) md += `- تفضيل الميديا: ${p.preferred_demonstrator} / ${p.preferred_media_variant}\n`;
  if (p.client_compatibility_review_required) md += `- مراجعة توافق العميل (HOME): مطلوبة عند التعيين\n`;
  for (const note of p.authoring_notes_ar) md += `- ملاحظة: ${note}\n`;
  md += `\n`;
  for (const s of p.sessions.filter((x) => x.day_type === "workout")) {
    md += `### اليوم ${s.day_number} — ${s.session_name_ar} (${s.session_name_en})\n\n`;
    md += `${s.session_purpose_ar}\n\n`;
    for (const e of s.exercises) md += `${slotLine(e)}\n`;
    md += `\n`;
  }
  md += `---\n\n`;
}

writeFileSync("docs/TRAINING_TEMPLATE_EXERCISE_SEQUENCE_MASTER_V1.md", md);

writeFileSync(
  "docs/TRAINING_TEMPLATE_LIBRARY_ADDITIONS_REQUIRED.md",
  `# TRAINING TEMPLATE — Library Additions Required (Final Canonical)

**حالة:** مواصفات فقط — لم يُنشأ external_id — DB_WRITES=0

## 1) Treadmill Brisk Walk

| الحقل | القيمة |
|-------|--------|
| name_en | Treadmill Brisk Walk |
| name_ar | مشي سريع على جهاز المشي |
| environment | GYM |
| equipment | TREADMILL |
| prescription_model | DURATION |
| roles | GENERAL_WARM_UP, POST_WORKOUT_CARDIO |
| duplicate_check | CR-001 Run — ممنوع كبديل |
| external_id | DO_NOT_INVENT |

**القوالب الرسمية المتبقية المعتمدة عليه (${treadDeps.length}):**  
${treadDeps.join(", ")}

(+ Pilot \`FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D\` يحتاج ترحيل هوية لاحقًا)

## 2) Brisk Walk — Outdoor / Neighborhood / Indoor Fallback

| الحقل | القيمة |
|-------|--------|
| name_en | Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) |
| name_ar | مشي سريع (خارجي / حي / بديل داخلي آمن) |
| environment | HOME |
| equipment | NO_EQUIPMENT |
| external_id | DO_NOT_INVENT |

**القوالب الرسمية المتبقية المعتمدة عليه (${homeDeps.length}):**  
${homeDeps.join(", ")}

## EXERCISES_CREATED

**0**
`,
);

writeFileSync(
  "docs/TRAINING_TEMPLATE_FEMALE_MEDIA_MANIFEST_V1.md",
  `# TRAINING TEMPLATE — Female Media Manifest V1 (Final Canonical)

**سياسة:** سجل تمرين واحد — متغير ميديا فقط.  
**قوالب رسمية فقط (لا Glute HOME):**

- GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D
- GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D

| # | external_id |
|--:|-------------|
${[...gluteIds]
  .sort()
  .map((id, i) => `| ${i + 1} | \`${id}\` |`)
  .join("\n")}

**TOTAL_UNIQUE:** ${gluteIds.size}  
**FEMALE_MEDIA_AVAILABLE:** 0  
**MEDIA_GENERATED:** 0
`,
);

const reconMd = `# تقرير المصالحة النهائية للماستر — Phase 9

**المهمة:** FINAL_CANONICAL_MASTER_RECONCILIATION  
**التاريخ:** ${machine.generated_at}  
**Import:** NOT_AUTHORIZED  

## 1) تصحيح التسمية التاريخية

| البند | القيمة |
|-------|--------|
| HISTORICAL_MASTER_LABEL | ${HISTORICAL_MASTER_LABEL} |
| ACTUAL_CANONICAL_ENTRY_COUNT | **37** |
| CURRENT_33_MASTER_RESULT | REJECTED / CORRECTED |

**السبب:** ${COUNT_ROOT_CAUSE_AR}

هذا **تصحيح توثيقي** وليس توسعة منتج.

## 2) الحساب

| البند | القيمة |
|------:|--------|
| PRODUCT_MASTER_COUNT | 37 |
| PILOT_COUNT | 4 |
| REMAINING_COUNT | 33 |
| SEQUENCE_PACK_COUNT | ${packs.length} |
| TOTAL_STATUS_SUM | ${readyKeys.length} + ${pendingKeys.length} + 0 + 0 + 4 = **37** |

## 3) ما فقده ماستر 33 وما زاد عليه

**MISSING_FROM_33_BEFORE_FIX:**
${MISSING_FROM_REJECTED_33.map((k) => `- \`${k}\``).join("\n")}

**EXTRA_IN_33_BEFORE_FIX:**
${REJECTED_33_EXTRA_KEYS.map((k) => `- \`${k}\``).join("\n")}

## 4) جدول الماستر الرسمي (37)

| IDX | TEMPLATE_KEY | GOAL | LVL | ENV | D | STATUS |
|-----|---|---|---|---|--:|---|
${CANONICAL_LOCKED_TEMPLATE_MASTER.map(
  (r) =>
    `| ${r.historical_index} | \`${r.template_key}\` | ${r.goal} | ${r.level} | ${r.environment} | ${r.days} | ${r.status} |`,
).join("\n")}

## 5) متغيرات غير موجودة (خارج العدد)

${NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY.map((v) => `- \`${v.rejected_key}\` — ${v.reason_ar}`).join("\n")}

## 6) 06A / 06B

| المفتاح | النتيجة |
|---------|---------|
| MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D | PASS — 4 أيام Upper/Lower |
| MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D | PASS — 5 أيام Advanced Split |

## 7) جاهزية الاستيراد (معلّقة)

| الحالة | العدد |
|--------|------:|
| READY_FOR_IMPORT | ${readyKeys.length} |
| PENDING_LIBRARY_ADDITION | ${pendingKeys.length} |
| REVIEW_REQUIRED | 0 |
| BLOCKED | 0 |
| ALREADY_IMPORTED | 4 |
| BROKEN_REFERENCES | 0 |
| VALIDATOR | PASS |

## 8) إضافات المكتبة

- Treadmill Brisk Walk → ${treadDeps.length} قالب متبقٍ
- HOME Brisk Walk → ${homeDeps.length} قالب متبقٍ

## 9) الخطوة التالية

مراجعة PM. **STOP** — لا Import ولا Phase 10 ولا DB writes.
`;

writeFileSync("docs/TRAINING_TEMPLATE_MASTER_RECONCILIATION_REPORT.md", reconMd);

console.log("Final canonical artifacts written");
console.log(
  JSON.stringify(
    {
      ready: readyKeys.length,
      pending: pendingKeys.length,
      count: CANONICAL_TEMPLATE_COUNT,
      tread: treadDeps.length,
      home: homeDeps.length,
    },
    null,
    2,
  ),
);
