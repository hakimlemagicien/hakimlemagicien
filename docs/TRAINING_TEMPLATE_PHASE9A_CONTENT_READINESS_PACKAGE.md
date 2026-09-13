# TRAINING TEMPLATE SYSTEM V1 — Phase 9A/10
# Content Readiness Closure Before Bulk Import

**Phase:** 9A/10  
**Phase name:** `CONTENT_READINESS_CLOSURE_BEFORE_BULK_IMPORT`  
**Status:** `PASS_WITH_DECISIONS_REQUIRED`  
**Environment:** LOCAL_ONLY  
**Bulk import:** NOT AUTHORIZED  

**Artifacts:**
- This report
- [`docs/data/training-template-phase9a-content-readiness.json`](./data/training-template-phase9a-content-readiness.json)
- Logic: `src/lib/platform/training-templates/phase9a/`

---

## 1. Executive decision summary

Phase 9A closes **content-spec / library-mapping** gaps from Phase 8 **without** inventing exercise sequences, IDs, media, or DB rows.

| Decision | Result |
|----------|--------|
| Remaining 32 reviewed | **YES** |
| Exact approved sequences for remaining 32 | **0** (only Pilot 4 has in-repo approved sequences) |
| Safe Phase 9B import set | **EMPTY** |
| Treadmill Brisk Walk | **ADDITION_SPEC_CREATED** (no ID invented) |
| HOME Brisk Walk | **ADDITION_SPEC_CREATED** — genuinely required |
| Glute HOME | **Do not create** — BLOCKED / coverage gap |
| Glute GYM | **GLUTE_SEQUENCE_REVIEW_REQUIRED** |
| Female media | Manifest defined; **0%** available; release ≠ import |
| Templates / exercises / media created this phase | **0 / 0 / 0** |

**Phase 9B ready: NO** — until PM approves exact sequences **and** library additions are created under change control.

Improvising MAIN_RESISTANCE lists from “plausible” library rows is **forbidden** (§ no policy invention).

---

## 2. Remaining 32 template table

Pilot 4 marked `ALREADY_IMPORTED` (reference only — not re-imported).

| TEMPLATE_KEY | Strategy | Lvl | Env | D | IMPORT_READINESS | RELEASE_READINESS |
|--------------|----------|-----|-----|---|------------------|-------------------|
| FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D | FAT_LOSS | BEG | HOME | 3 | CONTENT_ADDITION_REQUIRED | CONTENT_BLOCKED |
| FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D | FAT_LOSS | INT | GYM | 4 | CONTENT_ADDITION_REQUIRED | CONTENT_BLOCKED |
| FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D | FAT_LOSS | INT | HOME | 4 | CONTENT_ADDITION_REQUIRED | CONTENT_BLOCKED |
| MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D | MUSCLE_GAIN | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D | MUSCLE_GAIN | INT | HOME | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D | MUSCLE_GAIN | INT | GYM | 5 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D | RECOMP | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D | RECOMP | BEG | HOME | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D | RECOMP | INT | GYM | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D | RECOMP | INT | HOME | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D | FITNESS | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D | FITNESS | BEG | HOME | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| GENERAL_FITNESS_PROGRESS_INTERMEDIATE_GYM_4D | FITNESS | INT | GYM | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| GENERAL_FITNESS_PROGRESS_INTERMEDIATE_HOME_4D | FITNESS | INT | HOME | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D | GLUTE | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | FEMALE_MEDIA_REQUIRED |
| GLUTE_FOCUS_FOUNDATION_BEGINNER_HOME_3D | GLUTE | BEG | HOME | 3 | BLOCKED_BY_REFERENCE | CONTENT_BLOCKED |
| GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D | GLUTE | INT | GYM | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | FEMALE_MEDIA_REQUIRED |
| GLUTE_FOCUS_PROGRESS_INTERMEDIATE_HOME_4D | GLUTE | INT | HOME | 4 | BLOCKED_BY_REFERENCE | CONTENT_BLOCKED |
| ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D | ATHLETIC | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D | ATHLETIC | INT | GYM | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D | ATHLETIC | INT | HOME | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| STRENGTH_FOUNDATION_BEGINNER_GYM_3D | STRENGTH | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| STRENGTH_PROGRESS_INTERMEDIATE_GYM_5D | STRENGTH | INT | GYM | 5 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| ENDURANCE_FOUNDATION_BEGINNER_GYM_3D | ENDURANCE | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| ENDURANCE_FOUNDATION_BEGINNER_HOME_3D | ENDURANCE | BEG | HOME | 3 | CONTENT_ADDITION_REQUIRED | CONTENT_BLOCKED |
| ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D | ENDURANCE | INT | GYM | 4 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D | MOBILITY | BEG | HOME | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D | MOBILITY | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_3D | MOBILITY | INT | HOME | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D | AGING | BEG | HOME | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D | AGING | BEG | GYM | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |
| HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_3D | AGING | INT | HOME | 3 | PM_SEQUENCE_APPROVAL_REQUIRED | CONTENT_BLOCKED |

**Counts:** READY 0 · WITH_REVIEW_FLAG 0 · CONTENT_ADDITION **4** · PM_SEQUENCE **26** · BLOCKED **2**

---

## 3. Exact exercise-sequence status

| Bucket | Count | Meaning |
|--------|------:|---------|
| Pilot 4 `APPROVED_EXISTING_SEQUENCE` | 4 | In-repo (`definitions.ts`) — already imported |
| Remaining with exact approved sequence | **0** | Official content pack **absent** |
| Session maps emitted with external_ids | **0** | Would be invention |

For every remaining template:

- `EXACT_APPROVED_EXERCISE_SEQUENCE_EXISTS: false`
- `SESSION_EXERCISE_MAP.status: NOT_EMITTED`

**Weekly split shells only** (SESSION_A…E) are dimension labels — not approved programming.

### Structure policy available (Phase 9A brief — not sequences)

Documented in JSON `structure_policy_from_phase9a_brief`:

- Shared: 3 warm-ups, 6 main, Smart AUTO = Weight+Reps
- Fat Loss GYM: Brisk Walk 10 + 15 (no Run substitute)
- Recomp / Fitness / Healthy Aging / Endurance / Strength / Athletic / Mobility: role + duration **policies** from brief
- Healthy Aging Intermediate: brief mentions **4D / 15 min post** vs locked key `…HOME_3D` → **PM reconcile**

---

## 4. Library mapping

Lookup order respected: Core 100 → full library → addition spec.

| Mapping class | Status |
|---------------|--------|
| Existing HOME cardio (March in Place `WU-023`, etc.) | Mapped — see §6 |
| Treadmill Run `CR-001` | Exists — **not** usable as Brisk Walk |
| Incline Walk `CR-015` | Exists — **not** Brisk Walk |
| Glute GYM candidates | 25 glute records (Core-first list in female manifest) — **CANDIDATE_FOR_PM_REVIEW** |
| Remaining MAIN_RESISTANCE picks | **UNRESOLVED** until PM sequence pack |

No pseudo IDs. Unresolved ≠ silent Core 100 fill.

---

## 5. Missing exercise addition specs

### ADD_TREADMILL_BRISK_WALK

| Field | Value |
|-------|--------|
| DISPLAY_NAME_EN | Treadmill Brisk Walk |
| DISPLAY_NAME_AR | مشي سريع على جهاز المشي (**PROPOSED_PENDING_PM**) |
| ACTIVITY_TYPE | CARDIO / WALK |
| ENVIRONMENT | GYM |
| EQUIPMENT | TREADMILL |
| PRESCRIPTION_MODEL | DURATION |
| EXPECTED_ROLES | GENERAL_WARM_UP / POST_WORKOUT_CARDIO |
| SETS_REPS | NOT REQUIRED |
| EXTERNAL_ID | **DO NOT INVENT** |
| DUPLICATE_CHECK | vs `CR-001` Run, `CR-015` Incline Walk — POSSIBLE_DUPLICATE, **not usable** |
| Shared by | Fat Loss GYM templates (incl. Pilot identity gap) |

### ADD_HOME_BRISK_WALK

| Field | Value |
|-------|--------|
| DISPLAY_NAME_EN | Brisk Walk (Outdoor / Neighborhood / Indoor Fallback) |
| DISPLAY_NAME_AR | مشي سريع (خارجي / حي / بديل داخلي آمن) (**PROPOSED_PENDING_PM**) |
| ENVIRONMENT | HOME |
| EQUIPMENT | NO_EQUIPMENT |
| Machine-independent | YES |
| Outdoor not forced | Indoor safe fallback allowed |
| EXTERNAL_ID | **DO NOT INVENT** |
| DUPLICATE_CHECK | vs `WU-023`, `CR-016`, `WU-015` — not sufficient substitutes |
| Shared by | HOME Fat Loss, Endurance, and (once sequenced) Fitness / Recomp / Healthy Aging HOME |

**EXERCISES_CREATED this phase: 0**

---

## 6. HOME cardio resolution

| Activity | Status |
|----------|--------|
| Brisk Walk (canonical HOME) | **ADDITION_REQUIRED** |
| March in Place (`WU-023`) | EXISTING_LIBRARY_RECORD (warmup type; low-impact option) |
| Light Jog (`WU-015`) | EXISTING — not default Foundation Fat Loss / Aging |
| Jump Rope / Burpees / Mountain Climbers | EXISTING — high impact; **NOT_REQUIRED** as Foundation default |
| Treadmill at HOME | **NOT_REQUIRED** |

**HOME_CARDIO_POOL:** GAPS (addition still required)

---

## 7. Fat Loss treadmill resolution

| Item | Decision |
|------|----------|
| Distinct Brisk Walk required | YES |
| Substitute with `CR-001` | **FORBIDDEN** |
| Import GYM Fat Loss (remaining) | **CONTENT_ADDITION_REQUIRED** until addition exists **and** PM approves sequence |
| Pilot `FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D` | ALREADY_IMPORTED; still uses `CR-001`; **do not re-import**; post-addition identity migration = separate PM change control |

---

## 8. Glute unresolved decisions

### GYM (locked existing)

| Key | Result |
|-----|--------|
| `GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D` | **GLUTE_SEQUENCE_REVIEW_REQUIRED** |
| `GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D` | **GLUTE_SEQUENCE_REVIEW_REQUIRED** |

Provide to PM:

- Movement requirements: glute-primary resistance + standard warm-ups; exact lifts TBD
- Candidate existing exercises: 25 Glutes group / Core-first list in JSON
- Unresolved: weekly volume split, accessories, specialty machine assumptions
- Media: `FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE`

### HOME (Phase 8 BLOCKED_BY_REFERENCE — clarified)

Phase 9A: **Do NOT create Glute HOME templates.**

| Key | Result |
|-----|--------|
| `GLUTE_FOCUS_FOUNDATION_BEGINNER_HOME_3D` | BLOCKED_BY_REFERENCE — intentional coverage gap |
| `GLUTE_FOCUS_PROGRESS_INTERMEDIATE_HOME_4D` | BLOCKED_BY_REFERENCE — intentional coverage gap |

**PM decision:** Confirm HOME remains non-importable coverage gap (not content to invent). Locked master stays 36 keys only as product naming; HOME Glute keys are **not** import targets.

What was “blocking” Phase 8 Glute HOME was **absence of any approved sequence + product choice not to create HOME** — not a missing `external_id` inside an approved list.

---

## 9. Female media manifest

Policy unchanged: **one canonical exercise**; media variants only; no Female/Male duplicate records.

| Metric | Value |
|--------|------:|
| Templates | Glute GYM Foundation + Progress |
| PREFERRED_DEMONSTRATOR | FEMALE |
| PREFERRED_MEDIA_VARIANT | FEMALE |
| Fallback | FEMALE → STANDARD → MEDIA_MISSING |
| TOTAL_UNIQUE_EXERCISES (candidate set) | see JSON (~24 prioritized) |
| FEMALE_MEDIA_AVAILABLE | **0** |
| STANDARD_ONLY | = total candidates |
| Coverage % | **0** |

**IMPORT_READINESS** ≠ **RELEASE_READINESS**. Even after sequences exist, Glute remains `FEMALE_MEDIA_REQUIRED` for release unless PM explicitly waives.

**MEDIA_CREATED this phase: 0**

---

## 10. HOME capability review map

Separate:

- `TEMPLATE_CONTENT_READY` — **false** for all remaining 32 (no approved sequences)
- `CLIENT_COMPATIBILITY_REVIEW_REQUIRED` — **true** for all HOME remaining templates

Dependencies called out (not globally inventing metadata rows):

TRAINING_SPACE · AVAILABLE_LOAD · LOAD_INCREMENT_GRANULARITY · SAFE_BAND_ANCHOR · STABLE_BENCH_OR_CHAIR · STABLE_ELEVATED_SURFACE

Thin global metadata alone does **not** invent sequences; unknown client capability → assignment **REVIEW_REQUIRED**.

---

## 11. Runtime-role release issues

| Role | Client | Import | Release |
|------|--------|--------|---------|
| MAIN_RESISTANCE | FULLY_RENDERED | OK | OK |
| Warm-ups / ramp / cardio / power / mobility | GENERIC_RENDERING | Usually OK | RUNTIME_UI_FIX_REQUIRED |
| CONTROLLED_AEROBIC_INTERVAL_BLOCK | NOT_SUPPORTED | Review flag for Endurance | Release blocker |
| DAILY_ACTIVITY | NOT_SUPPORTED | N/A in current pack | Release blocker if used |

**No UI changes in Phase 9A.** Developer follow-ups listed in JSON.

---

## 12. Import readiness

| State | Count |
|-------|------:|
| READY_FOR_PHASE9_IMPORT | **0** |
| READY_FOR_PHASE9_IMPORT_WITH_REVIEW_FLAG | **0** |
| CONTENT_ADDITION_REQUIRED | **4** |
| PM_SEQUENCE_APPROVAL_REQUIRED | **26** |
| BLOCKED_BY_REFERENCE | **2** |

### CONTENT_ADDITION_REQUIRED — exact blockers

1. **FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D** — every cardio slot — missing HOME Brisk Walk — March/Jump/Burpee unsuitable as default — `ADD_HOME_BRISK_WALK` (shared)
2. **FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D** — warm-up 10 + post 15 — missing Treadmill Brisk Walk — Run/Incline insufficient — `ADD_TREADMILL_BRISK_WALK` (shared)
3. **FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D** — same as (1)
4. **ENDURANCE_FOUNDATION_BEGINNER_HOME_3D** — AEROBIC_ENDURANCE_BLOCK — missing HOME Brisk Walk — `ADD_HOME_BRISK_WALK` (shared)

All four **also** need PM sequence approval after additions.

### Re-audit of former Phase 8 “READY_WITH_REVIEW (27)”

Almost all were review because **approved sequence incomplete** (not merely HOME capability or media). Those resolve to **PM_SEQUENCE_APPROVAL_REQUIRED** (or content/blocked as above). Runtime generic rendering is a **release** issue, not an import unlock.

---

## 13. Release readiness

| State | Remaining 32 |
|-------|-------------:|
| RELEASE_READY | 0 |
| RELEASE_WITH_KNOWN_MEDIA_GAP | 0 |
| FEMALE_MEDIA_REQUIRED | 2 (Glute GYM) |
| RUNTIME_UI_FIX_REQUIRED | 0 assigned as sole state* |
| CONTENT_BLOCKED | 30 |

\*Runtime UI fixes apply broadly once content exists; primary release gate today is **content**.

Pilot 4: already imported; release carries known media gap; Fat Loss Pilot still has cardio **identity** gap vs Brisk Walk policy.

---

## 14. Recommended Phase 9B batches

**All batches EMPTY** — no remaining template has an approved exact sequence.

| Batch | Intended grouping | Keys included |
|-------|-------------------|---------------|
| A | Fat Loss + Muscle Gain | _none_ |
| B | Recomp + General Fitness | _none_ |
| C | Strength + Endurance | _none_ |
| D | Mobility + Healthy Aging | _none_ |
| E | Athletic + Glute / specialty | _none_ |

Do not place blocked or sequence-missing templates into batches to preserve grouping.

---

## 15. PM decisions still required

1. **Approve exact exercise sequences** for all non-Pilot import targets (official content pack).
2. **Approve Arabic names** for both addition specs.
3. **Authorize Database/Developer** to create Treadmill Brisk Walk + HOME Brisk Walk (controlled IDs).
4. **Approve Glute GYM sequences** (Foundation 3D + Progress 4D) from candidate pool.
5. **Confirm Glute HOME** stays coverage gap (do not create).
6. **Reconcile Healthy Aging Intermediate** days (brief 4D vs locked `HOME_3D`).
7. **Pilot Fat Loss cardio migration** CR-001 → Brisk Walk after addition exists (separate change control).
8. Optional: waive vs enforce female media before Glute **release** (never confuse with import).

---

## Cross-template unique counts

| Metric | Value |
|--------|------:|
| TOTAL_UNIQUE_EXISTING_EXERCISES (reference pool only) | small cardio/reference set — see JSON |
| TOTAL_UNIQUE_ADDITION_SPECS | **2** |
| TOTAL_UNIQUE_UNRESOLVED (templates awaiting sequence) | **26+** Glute GYM included |

---

## STOP

Phase 9A complete.

- Do **not** send to Developer for bulk import automatically  
- Do **not** import templates  
- Do **not** create exercises  
- Do **not** generate female media  
- Do **not** deploy  

**Expected state:** `PHASE_9A_CONTENT_PACKAGE_COMPLETE` + 32 classified + addition specs defined + Glute decisions visible + female media manifest defined + Phase 9B safe import set **known empty**.
