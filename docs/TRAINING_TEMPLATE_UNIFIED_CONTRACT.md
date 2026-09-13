# MAAKFIT — Unified Program Template Contract (Phase 2)

**Status:** Phase 2 contract complete (LOCAL)  
**Date:** 2026-09-12  
**Depends on:** [`TRAINING_TEMPLATE_IMPLEMENTATION_ARCHITECTURE_REPORT.md`](./TRAINING_TEMPLATE_IMPLEMENTATION_ARCHITECTURE_REPORT.md)

> No 36-template import. No Template Resolver. No Staging/Production migration apply.

---

## 1. Primary Training Strategy

Type: `PrimaryTrainingStrategy`

```
FAT_LOSS | MUSCLE_GAIN | GENERAL_FITNESS | ATHLETIC_PERFORMANCE
BODY_RECOMPOSITION | GLUTE_FOCUS | STRENGTH | ENDURANCE
MOBILITY_FUNCTIONAL | HEALTHY_AGING_ACTIVE_LIFE
```

Source: `src/lib/platform/training-templates/primary-strategy.ts`

These are **product template identities**, not Training V2 goal renames.

---

## 2. Training V2 Bridge

`mapTrainingV2GoalToPrimaryStrategy(v2Goal)` — typed, deterministic, fail-closed.

| Training V2 ID | Primary Strategy | Mode |
|----------------|------------------|------|
| FAT_LOSS | FAT_LOSS | DETERMINISTIC |
| MUSCLE_GROWTH | MUSCLE_GAIN | DETERMINISTIC |
| FITNESS_ENERGY | GENERAL_FITNESS | DETERMINISTIC |
| ATHLETIC_PHYSIQUE | ATHLETIC_PERFORMANCE | DETERMINISTIC |
| BODY_RESHAPE | BODY_RECOMPOSITION | DETERMINISTIC |
| HEALTHY_WEIGHT_GAIN | MUSCLE_GAIN | DETERMINISTIC |
| GLUTE_GROWTH | GLUTE_FOCUS | DETERMINISTIC |
| SLIM_TONED_WAIST | BODY_RECOMPOSITION | CONTEXT_SENSITIVE (may → FAT_LOSS later) |
| FEMININE_BALANCED_BODY | BODY_RECOMPOSITION | DETERMINISTIC |
| POSTURE_TONED_BACK | GENERAL_FITNESS | DETERMINISTIC |
| TONED_ARMS_UPPER_BODY | BODY_RECOMPOSITION | CONTEXT_SENSITIVE (coach specialize) |

**Training V2 IDs are unchanged.** `LEGACY_GOAL_MAP` is untouched.

---

## 3. Quiz Mapping (12/12)

Product surfaces = **12** (6 male + 6 female). Unique IDs = **11** because `fat` is shared.

| Quiz ID | Primary Strategy | Notes |
|---------|------------------|-------|
| fat | FAT_LOSS | Shared male/female |
| muscle | MUSCLE_GAIN | |
| fitness | GENERAL_FITNESS | |
| athletic | ATHLETIC_PERFORMANCE | |
| shape | BODY_RECOMPOSITION | |
| gain | MUSCLE_GAIN | Nutrition separate |
| glutes | GLUTE_FOCUS | |
| waist | BODY_RECOMPOSITION | Context may select FAT_LOSS in Phase 3 |
| body | BODY_RECOMPOSITION | |
| fit | GENERAL_FITNESS | |
| tone | BODY_RECOMPOSITION | Coach specialization allowed |

`QUIZ_GOAL_SURFACES` enumerates all 12 gender×goal pairs. Unknown / empty → **FAIL_CLOSED**.

Flow:

```
QUIZ GOAL → Training V2 (existing LEGACY_GOAL_MAP)
         → Primary Strategy (this bridge)
         → Template Family
```

---

## 4. Template Family Identity

V1: `TemplateFamily === PrimaryTrainingStrategy` (1:1).  
Stored as `template_family` inside the contract.

---

## 5. Variant Dimensions

Machine-readable (never name-only):

```ts
variant: {
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  environment: "GYM" | "HOME"
  days_per_week: 1..7
}
```

**BEGINNER ≠ 3 days. INTERMEDIATE ≠ 4 days.** Level and frequency are independent.

---

## 6. Admin Descriptive Fields (required)

- `target_audience`
- `template_purpose`
- `admin_summary` (auto-helper: `Strategy / Level / ENV / N Days`)

---

## 7. Eligibility Model

```ts
eligibility: {
  rules: string[]
  review_conditions: string[]
  equipment_requirements: string[]
  environment_requirements: ("GYM"|"HOME")[]
  capability_requirements: HomeRequirementDeclaration[]
  unknown_required_capability_policy: "REVIEW_REQUIRED"
}
```

`resolveHomeCapabilityGate`: unknown required capability → **REVIEW_REQUIRED** (never SAFE).

---

## 8. Environment Model

Template environments: **GYM | HOME**.

Compatibility helpers:

- Existing metadata `training_location` synced from contract
- `templateEnvironmentFromLocation`: HOME/GYM → env; BOTH/anywhere → `null` (ambiguous → Phase 3 REVIEW)

---

## 9. Activity Roles

Roles with default prescription models:

| Role | Default model |
|------|----------------|
| GENERAL_WARM_UP | DURATION |
| TARGETED_DYNAMIC_WARM_UP | DURATION |
| EXERCISE_SPECIFIC_RAMP_UP | SETS_REPS_LOAD |
| MAIN_RESISTANCE | SETS_REPS_LOAD |
| POST_WORKOUT_CARDIO | DURATION |
| AEROBIC_ENDURANCE_BLOCK | DURATION |
| CONTROLLED_AEROBIC_INTERVAL_BLOCK | INTERVAL_STRUCTURE |
| POWER_SKILL_BLOCK | QUALITY_REPS |
| MOBILITY_ACTIVITY | DURATION |
| DAILY_ACTIVITY | STEPS_OR_DAILY |

Legacy builder roles (`warmup|main|accessory|finisher`) map lossily via `activityRoleFromLegacyExerciseRole`.

---

## 10. Progression Declaration

Default for Smart Exercise Locked:

- AUTO: `WEIGHT`, `REPS` only
- COACH: `SETS`, `REST`, `EXERCISE_IDENTITY`, `EXERCISE_REPLACEMENT`, `TRAINING_DAYS`, `CARDIO_STRUCTURE`

Validation rejects expanding AUTO beyond WEIGHT+REPS.

---

## 11. Coach Controls (declarative)

Extended variables supported as **policy metadata** (not runtime auto-edit in Phase 2):

POWER_PROGRESSION, MOBILITY_PROGRESSION, SUPPORT_LEVEL, CARRY_DISTANCE, BAND_RESISTANCE, ROM, MOVEMENT_COMPLEXITY, CARDIO_DURATION, CARDIO_INTENSITY, CARDIO_MODALITY, INTERVAL_STRUCTURE

---

## 12. HOME Requirement Contract

Keys: equipment, training_space, available_load, load_increment_granularity, safe_band_anchor, stable_bench_or_chair, stable_elevated_surface

Unknown required → REVIEW_REQUIRED.

---

## 13. Media Preference Contract

```ts
media_preference: {
  preferred_demonstrator: "FEMALE" | "STANDARD" | "ANY"
  preferred_media_variant: "FEMALE" | "STANDARD"
  duplicates_exercise_identity: false  // always
}
```

One Exercise Library. No female ID forks.

---

## 14. Review Signals

Includes COACH_REVIEW_REQUIRED, EXERCISE_REVIEW_RECOMMENDED, TRAINING_FREQUENCY_REVIEW_RECOMMENDED, HOME_LOAD_LIMIT_REVIEW_REQUIRED, EQUIPMENT_LIMIT_REVIEW_REQUIRED, MOVEMENT_QUALITY_REVIEW_RECOMMENDED, CARDIO_STRUCTURE_REVIEW_RECOMMENDED, PROGRAM_LEVEL_REVIEW_RECOMMENDED, TRAINING_ENVIRONMENT_REVIEW_RECOMMENDED, EXERCISE_LIBRARY_ADDITION_REQUIRED

**REVIEW_SIGNAL ≠ AUTOMATIC_PROGRAM_CHANGE**

---

## 15. Transition Policy

Advisory only (`advisory: true` expected). Does not auto-reassign clients.

---

## 16. Library Readiness

`READY | MISSING_MEDIA | MISSING_EXERCISE | REVIEW_REQUIRED` + counts.  
Never invent exercise IDs.

---

## 17. Snapshot Policy

| Policy | Fields |
|--------|--------|
| FREEZE_INTO_ASSIGNMENT | legacy_program_goal, variant, duration_weeks, activity_roles |
| PROVENANCE_RECORD | primary_strategy, family, progression, review_signals, media_preference, eligibility |
| MASTER_ONLY | target_audience, template_purpose, admin_summary, transition_policies, library_readiness |

Existing snapshot tables unchanged in Phase 2. Provenance helper: `buildAssignmentProvenanceFromContract`.

---

## 18. Resolver-Ready Fields (Phase 3 inputs)

Already on contract / bridges:

- Quiz → Primary Strategy
- V2 → Primary Strategy
- Family, level, environment, days
- Eligibility + HOME capability gate
- Review signals
- Library readiness

Phase 3 will compose: context → filter published templates with `template_contract` → rank → recommend.

---

## 19. Backwards Compatibility

| Decision | Rationale |
|----------|-----------|
| Keep DB `program_goal` enum (`cut\|bulk\|fitness\|recomp`) | Avoid destructive enum rewrite |
| Rich identity in `metadata.template_contract` | Additive, zero Staging/Prod apply this phase |
| Sync `metadata.training_location` / `primary_strategy` | Existing Admin list filters keep working |
| `legacy_program_goal` on contract | Maps Primary Strategy → enum for RPCs |

**No migration file created.** Schema extension deferred until Phase 3/4 needs indexed columns.

---

## 20. Phase 3 Handoff

Implement **Template Resolver** using:

1. `mapQuizGoalToPrimaryStrategy` / `mapTrainingV2GoalToPrimaryStrategy`
2. `readTemplateContractFromMetadata` on published templates
3. Match `variant.level`, `variant.environment`, `variant.days_per_week`
4. `resolveHomeCapabilityGate` → REVIEW when unknown
5. `assessTemplateCompatibility` (existing) + contract filters
6. Do **not** hardcode 36 names in UI

**STOP after Phase 2 approval — do not start Phase 3 automatically.**

---

## Example metadata blob

```json
{
  "training_location": "HOME",
  "target_gender": "all",
  "primary_strategy": "MUSCLE_GAIN",
  "template_family": "MUSCLE_GAIN",
  "template_contract": {
    "contract_version": 1,
    "primary_strategy": "MUSCLE_GAIN",
    "template_family": "MUSCLE_GAIN",
    "legacy_program_goal": "bulk",
    "variant": { "level": "BEGINNER", "environment": "HOME", "days_per_week": 3 },
    "target_audience": "Beginner client training at home…",
    "template_purpose": "Build a sustainable muscle-gain foundation…",
    "admin_summary": "MUSCLE GAIN / BEGINNER / HOME / 3 Days",
    "eligibility": {
      "unknown_required_capability_policy": "REVIEW_REQUIRED",
      "environment_requirements": ["HOME"],
      "capability_requirements": []
    },
    "progression": {
      "smart_auto_variables": ["WEIGHT", "REPS"],
      "coach_controlled_variables": ["SETS", "REST", "EXERCISE_IDENTITY", "EXERCISE_REPLACEMENT", "TRAINING_DAYS", "CARDIO_STRUCTURE"]
    },
    "media_preference": {
      "preferred_demonstrator": "ANY",
      "preferred_media_variant": "STANDARD",
      "duplicates_exercise_identity": false
    }
  }
}
```

---

## Module map

| File | Role |
|------|------|
| `src/lib/platform/training-templates/primary-strategy.ts` | Strategies + Quiz map |
| `src/lib/platform/training-templates/v2-primary-bridge.ts` | V2 → Primary |
| `src/lib/platform/training-templates/contract.ts` | Unified contract + validation |
| `src/lib/platform/training-templates/activity-roles.ts` | Activity / prescription models |
| `src/lib/platform/training-templates/legacy-program-goal.ts` | Enum compatibility |
| `src/lib/platform/training-templates/snapshot-policy.ts` | Freeze vs master-only |
| `src/lib/platform/training-templates/training-templates.test.ts` | Focused Phase 2 tests |
| `admin-program-builder.ts` | `programTemplateContractFromMetadata` helper (no UI redesign) |
