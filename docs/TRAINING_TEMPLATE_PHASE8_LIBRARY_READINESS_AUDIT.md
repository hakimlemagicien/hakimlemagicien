# TRAINING TEMPLATE SYSTEM V1 — Phase 8/10
# Exercise Library Compatibility, Media & Content Readiness Audit

**Phase:** 8/10  
**Phase name:** `EXERCISE_LIBRARY_COMPATIBILITY_MEDIA_AND_CONTENT_READINESS_AUDIT`  
**Status:** `PASS_WITH_GAPS`  
**Environment:** LOCAL only (no Staging / Production changes)  
**Machine-readable artifact:** [`docs/data/training-template-phase8-readiness.json`](./data/training-template-phase8-readiness.json)  
**Audit logic:** `src/lib/platform/training-templates/phase8/`

---

## 1. Executive summary

Phase 8 audited the Exercise Library against Template System V1 needs **before** importing templates 5–36.

**Verdict:** The library is large enough (321 exercises; Core 100 healthy) and Pilot 4 references still resolve. **Do not bulk-import the remaining 32 templates yet.** Critical content gaps:

1. **Treadmill Brisk Walk does not exist** as a distinct approved activity (`EXERCISE_LIBRARY_ADDITION_REQUIRED`). Fat Loss GYM must not silently use Treadmill Run.
2. **HOME aerobic options are thin** (March in Place is warm-up; Jump Rope / Burpees / Mountain Climbers are high-impact). Machine-free brisk walk is missing.
3. **HOME client capability metadata is absent** on exercise rows (`CAPABILITY_METADATA_GAP`).
4. **Female media variants are not modeled** (0% coverage for female-targeted preferences).
5. **Official 36-template content pack is not in-repo** — provisional keys classify all 36; only Pilot 4 sequences are `APPROVED_EXERCISE`.
6. **Client runtime activity-role chips remain mostly generic** (RPC correct; UI partially labeled).

**Templates imported remain 4. Template 5+ imported: 0.**

Phase 9 readiness: **PARTIAL** — import only after PM decision on review batches; block content-addition and reference-blocked rows.

---

## 2. Exercise library counts

| Metric | Value |
|--------|------:|
| Catalog (`scripts/exercise-library.json`) | **321** |
| V2 metadata rows | **321** |
| Strength | 246 |
| Warm-up | 25 |
| Mobility | 25 |
| Cardio | 25 |
| Core 100 IDs | 100 (all present in catalog) |
| Local DB `exercises` (observed) | 321 |
| Local DB `video_status=placeholder` | 321 |
| Templates imported (Pilot 4) | 4 |
| Templates 5+ imported | 0 |

Core 100 is **preferred foundation, not hard maximum**. Full-library references are accepted.

---

## 3. Core 100 health

| Check | Result |
|-------|--------|
| Count = 100 unique | PASS |
| All IDs in catalog | PASS |
| No duplicate Core IDs | PASS |
| **CORE_100_VALIDATION** | **PASS** |

Source: `src/lib/platform/strategy-matrix/config/core-100-external-ids.ts`.

---

## 4. Duplicate audit

| Check | Result |
|-------|--------|
| Duplicate `external_id` | **None** |
| Duplicate name-derived slugs | **None** |
| Exact near-duplicate English names | **None** |
| Large `substitution_group`s | Present (intentional variations — e.g. `SQUAT_PATTERN` 28) |

**Duplicate candidates for merge:** none automatic.  
**Variation candidates (review only, do not merge):** equipment/loading variants inside substitution groups.

**DUPLICATE_AUDIT:** COMPLETE

---

## 5. Warm-up readiness

| Metric | Value |
|--------|------:|
| Warm-up count | **25** (matches ~25 expectation) |
| Supports 3 warm-ups / session across 36 templates | **Yes** (inventory depth ≥ 15) |

Regions observed (name heuristic): shoulder, lower-body, hip, spine/trunk, ankle, general cardio, movement preparation.

**WARMUP_READINESS:** CLASSIFIED — sufficient inventory; programming variety still coach/content responsibility.

---

## 6. Mobility readiness

| Metric | Value |
|--------|------:|
| Mobility count | **25** |
| Kinds | dynamic mobility / controlled ROM / static stretch / activation (heuristic) |
| Areas | hips, shoulders, thoracic spine, ankles, trunk, general |

Static stretch is **not** forced as required finisher.  
Gaps for `MOBILITY_FUNCTIONAL` / `HEALTHY_AGING` / `ATHLETIC` are mainly **sequence definition**, not raw inventory count.

**MOBILITY_READINESS:** CLASSIFIED

---

## 7. Cardio readiness

| Activity | Status |
|----------|--------|
| Treadmill Run (`CR-001`) | Present (GYM) |
| Treadmill Brisk Walk | **ABSENT** → `EXERCISE_LIBRARY_ADDITION_REQUIRED` |
| Incline Walk (`CR-015`) | Present — **not** a substitute for brisk walk |
| Stationary Bike (`CR-002`) | Present (GYM) |
| Jump Rope / Burpees / Mountain Climbers | Present; HOME+GYM; higher impact |

Duration prescription model: **SUPPORTED** (roles use `DURATION`; no fake sets×reps required).

**FAT_LOSS_GYM_CARDIO_ACTIVITY:** `ADDITION_REQUIRED`  
**TREADMILL_BRISK_WALK_STATUS:** KNOWN — ABSENT  
**CARDIO_READINESS:** CLASSIFIED

---

## 8. Power readiness

Power / athletic candidates exist (e.g. Jumping Jacks, Kettlebell Swing, Jump Rope) and are tagged:

`LOW_COMPLEXITY` · `MODERATE_COMPLEXITY` · `JUMP_REQUIRED` · `SPACE_REQUIRED` · `BAND_REQUIRED` · `BALL_REQUIRED` · `MACHINE_REQUIRED`

Policy preserved: Athletic Performance ≠ mandatory jumping; Olympic lifts not required.

**POWER_READINESS:** CLASSIFIED (thin but usable for beginner HOME/GYM with review)

---

## 9. HOME compatibility readiness

| Metric | Value |
|--------|------:|
| `location_compatibility` includes HOME | **180** |
| HOME aerobic options (incl. warm-up march / high-impact cardio) | counted in audit JSON |
| `HOME_CARDIO_READINESS` | **ADDITION_REQUIRED** |
| Capability fields on exercise rows | **Missing** |

Missing capability fields (METADATA_MODEL_GAP — no migration in Phase 8):

- `training_space`
- `available_load`
- `load_increment_granularity`
- `safe_band_anchor`
- `stable_bench_or_chair`
- `stable_elevated_surface`

**HOME_EQUIPMENT_READINESS:** CLASSIFIED  
**HOME_CAPABILITY_GAPS:** DOCUMENTED  
Unknown HOME capability → **REVIEW_REQUIRED** (not silent assume).

---

## 10. GYM compatibility readiness

GYM inventory is broad. Specialty / non-universal equipment flagged for review (Smith, cable, sled, ski erg, pool, battle ropes, etc.). Do not treat specialty machines as universally available.

**GYM_EQUIPMENT_READINESS:** CLASSIFIED

---

## 11. Media readiness

| Class | Count |
|-------|------:|
| MEDIA_READY | 0 |
| MEDIA_PARTIAL | 321 (catalog `status: placeholder`) |
| MEDIA_MISSING | 0 (identity exists; media incomplete) |

Local DB: all rows `video_status=placeholder`; empty `video_path` / `thumbnail_path`.

Core-100 content pack on disk has anatomy/stage images for many IDs; **videos largely not synced into DB**.

**MEDIA_READINESS:** CLASSIFIED — visible readiness issue; **not** an automatic import hard-block for all templates (library readiness states remain separate: `MISSING_MEDIA` vs `MISSING_EXERCISE`).

---

## 12. Female media readiness

| Metric | Value |
|--------|------:|
| TOTAL_RELEVANT_EXERCISES (glute/warmup/mobility heuristic) | see JSON |
| FEMALE_MEDIA_READY | **0** |
| STANDARD_ONLY | = relevant set |
| FEMALE_MEDIA_COVERAGE_PERCENT | **0** |
| FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE | **true** (Glute Focus) |

Canonical identity remains single — **do not duplicate records for women**.  
Resolution order: FEMALE → STANDARD → MEDIA_MISSING.  
Preference fields (`PREFERRED_DEMONSTRATOR` / `PREFERRED_MEDIA_VARIANT`) are contract-level; **no row-level female media fields yet**.

**FEMALE_MEDIA_READINESS:** CLASSIFIED

---

## 13. Runtime activity-role rendering readiness

| Role | Classification |
|------|----------------|
| MAIN_RESISTANCE | FULLY_RENDERED |
| GENERAL_WARM_UP | GENERIC_RENDERING |
| TARGETED_DYNAMIC_WARM_UP | GENERIC_RENDERING |
| EXERCISE_SPECIFIC_RAMP_UP | GENERIC_RENDERING |
| POST_WORKOUT_CARDIO | GENERIC_RENDERING |
| AEROBIC_ENDURANCE_BLOCK | GENERIC_RENDERING |
| CONTROLLED_AEROBIC_INTERVAL_BLOCK | NOT_SUPPORTED |
| POWER_SKILL_BLOCK | GENERIC_RENDERING |
| MOBILITY_ACTIVITY | GENERIC_RENDERING |
| DAILY_ACTIVITY | NOT_SUPPORTED |

Admin preview uses `activityRoleLabelAr`. Client workout UI still often shows generic chips despite correct `activity_role` in RPC (Phase 6 gap carried).

**No UI redesign in Phase 8** beyond Admin editor load-failure fix.

---

## 14. Family readiness matrix

| FAMILY | GYM | HOME | NOTES |
|--------|-----|------|-------|
| FAT_LOSS | CONTENT_GAPS | CONTENT_GAPS | Brisk walk missing (GYM+HOME) |
| MUSCLE_GAIN | READY_WITH_REVIEW | READY_WITH_REVIEW | Capability metadata gap on HOME |
| BODY_RECOMPOSITION | READY_WITH_REVIEW | READY_WITH_REVIEW | Sequences not locked |
| GENERAL_FITNESS | READY_WITH_REVIEW | READY_WITH_REVIEW | Media partial |
| STRENGTH | READY_WITH_REVIEW | CONTENT_GAPS | GYM-primary in provisional 36 |
| ENDURANCE | READY_WITH_REVIEW | CONTENT_GAPS | HOME aerobic thin |
| MOBILITY_FUNCTIONAL | READY_WITH_REVIEW | READY_WITH_REVIEW | Inventory OK; sequences TBD |
| HEALTHY_AGING_ACTIVE_LIFE | READY_WITH_REVIEW | READY_WITH_REVIEW | Gate high-impact power |
| ATHLETIC_PERFORMANCE | READY_WITH_REVIEW | READY_WITH_REVIEW | Power candidates; no Olympic requirement |
| GLUTE_FOCUS | READY_WITH_REVIEW | CONTENT_GAPS | Female media + HOME sequences |

---

## 15. 36-template import-readiness matrix

**Provenance:** Official locked content pack is **not checked into the repository**. Keys live in `approved-36-reference.ts` as **provisional** product naming aligned to Pilot 4 + family plan. Non-Pilot sequences are `CANDIDATE_FOR_REVIEW` or `NOT_YET_DEFINED` — **not invented as approved programming**.

| OVERALL_IMPORT_READINESS | Count |
|--------------------------|------:|
| READY_FOR_IMPORT | **0** |
| READY_WITH_REVIEW | **27** |
| CONTENT_ADDITION_REQUIRED | **7** |
| BLOCKED_BY_REFERENCE | **2** |
| **Total classified** | **36/36** |

### CONTENT_ADDITION_REQUIRED (7)

- `FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D` (already Pilot-imported; content gap remains for true brisk walk)
- `FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D`
- `FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D`
- `FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D`
- `GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D`
- `GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D`
- `ENDURANCE_FOUNDATION_BEGINNER_HOME_3D`

### BLOCKED_BY_REFERENCE (2)

- `GLUTE_FOCUS_FOUNDATION_BEGINNER_HOME_3D`
- `GLUTE_FOCUS_PROGRESS_INTERMEDIATE_HOME_4D`

Full per-template rows: `docs/data/training-template-phase8-readiness.json` → `template_36_readiness`.

---

## 16. Missing exercise additions required

### 1) Treadmill Brisk Walk

| Field | Value |
|-------|-------|
| Classification | `EXERCISE_LIBRARY_ADDITION_REQUIRED` |
| Movement | AEROBIC_WALK |
| Environment | GYM |
| Equipment | TREADMILL |
| Difficulty | beginner |
| Roles | GENERAL_WARM_UP / POST_WORKOUT_CARDIO (duration) |
| Similar | CR-001 Treadmill Run (`POSSIBLE_DUPLICATE`), CR-015 Incline Walk (`POSSIBLE_DUPLICATE`) |
| Duplicate risk | MEDIUM |
| Do **not** invent `external_id` | — |

### 2) Brisk Walk (Outdoor / Neighborhood)

| Field | Value |
|-------|-------|
| Classification | `EXERCISE_LIBRARY_ADDITION_REQUIRED` |
| Environment | HOME |
| Equipment | NO_EQUIPMENT |
| Similar | WU-023 March in Place, CR-016 Outdoor Run (`POSSIBLE_DUPLICATE`) |
| Reason | Machine-free low-impact aerobic for HOME Fat Loss / Endurance |

**No fake IDs created. No auto-insert into library.**

---

## 17. Missing media work

| Work item | Status |
|-----------|--------|
| Catalog videos mostly placeholder | Explicit |
| DB video paths empty | Explicit |
| Female media variants | 0 — METADATA_MODEL_GAP |
| AB-001 local `exercise.mp4` in assets | Present on disk; DB still placeholder |
| Image generation | Out of scope |
| Video download/generation | Out of scope |

---

## 18. Blocking vs non-blocking issues

### Blocking for Phase 9 bulk import

- Missing Treadmill Brisk Walk (Fat Loss GYM policy)
- Missing HOME brisk-walk / low-impact aerobic
- Glute HOME templates without defined exercise sequences
- Female media policy incomplete for Glute Focus release

### Non-blocking (classify / review)

- Catalog media placeholder (visible `MISSING_MEDIA` / MEDIA_PARTIAL)
- Client generic activity-role chips
- HOME capability metadata gap (review, don’t assume)
- Specialty gym equipment availability
- Phase 7 gaps: override reason history; in-progress replace safety
- Recommendation coach defaults when client context absent (`EXPLICIT_DEFAULT_USED` — label in Phase 10)

### Fixed in Phase 8 (small, local)

- Admin «عرض القالب» infinite skeleton when `getAdminProgramTemplate` fails → clear `selectedId` / `draft` on error (`ProgramLibraryManager.tsx`)
- **ADMIN_EDITOR:** PASS (prior KNOWN_BLOCKER addressed locally)

---

## 19. Phase 9 recommendation

| Item | Recommendation |
|------|----------------|
| Phase 9 ready? | **PARTIAL** |
| Import templates 5–36 blindly? | **NO** |
| Import READY_FOR_IMPORT batch? | Empty (0) |
| Import READY_WITH_REVIEW? | Only with **explicit PM decision** + approved exercise sequences (content pack) |
| CONTENT_ADDITION_REQUIRED? | Block until library additions or written PM waiver |
| BLOCKED_BY_REFERENCE? | Do not import |
| Pilot 4 | Keep as-is (4 templates). Do not re-import. Fix Fat Loss brisk-walk semantics when addition lands |
| Migrations | Prefer 0 until product approves capability/female-media metadata model |
| Next handoff | Platform Architect / Project Manager |

### Suggested Phase 9 importable batches (decision gate)

1. `PILOT_4_ALREADY_IMPORTED` — no action  
2. `READY_WITH_REVIEW_SEQUENCES` — PM + content pack required  
3. `CONTENT_ADDITION_REQUIRED` — block  
4. `BLOCKED_BY_REFERENCE` — block  

---

## Known IDs validation

| ID | Expected | Result |
|----|----------|--------|
| WU-001 | Arm Circles | FOUND |
| WU-002 | Leg Swings | FOUND |
| LE-003 | Goblet Squat | FOUND |
| CH-003 | Dumbbell Bench Press | FOUND |
| BA-016 | Seated Cable Row | FOUND |
| BA-023 | Romanian Deadlift | FOUND |
| SH-005 | Lateral Raise | FOUND |
| AB-011 | Dead Bug | FOUND |
| CR-001 | Treadmill Run | FOUND |
| CH-002 | Incline Bench Press | FOUND |
| SH-027 | Smith Machine Press | FOUND |
| AB-001 | Crunch (+ local video asset) | FOUND |

**KNOWN_IDS_VALIDATED:** PASS

---

## Ramp-up model

**RAMP_UP_LIBRARY_MODEL:** SUPPORTED  
Same exercise identity + `activity_role = EXERCISE_SPECIFIC_RAMP_UP` + distinct load/reps — already used by Pilot 4. No separate ramp-up exercise records required.

---

## Recommendation defaults gap (audit only)

| When | Classification |
|------|----------------|
| Client level/days present | CLIENT_CONTEXT_PRESENT |
| Admin panel fills coach level/days (+ HOME equipment) | EXPLICIT_DEFAULT_USED |
| Resolver missing dimensions | INSUFFICIENT_CONTEXT (no silent inference) |

**Phase 10:** clearer UI labeling recommended. Product policy unchanged in Phase 8.

---

## Phase 7 gaps carried forward

1. Coach Override reason not fully historical  
2. In-progress workout replacement safety not newly hardened  

---

## Tests

```bash
npx tsx src/lib/platform/training-templates/phase8/phase8-audit.test.ts
npx tsx src/lib/platform/training-templates/pilot-4/pilot-4.test.ts
```

**TEST_RESULT:** PASS  
**PILOT_4_REGRESSION:** PASS  
**MIGRATIONS_CREATED:** 0  
**STAGING_CHANGED:** NO  
**PRODUCTION_CHANGED:** NO  

---

## STOP

Phase 8 complete. **Do not import template 5. Do not start Phase 9. Do not create missing exercises or generate media without separate approval.**

**Expected final state:**  
`PHASE_8_LIBRARY_READINESS_AUDIT_COMPLETE` + Core 100 validated + 36/36 classified + missing exercises/media explicit + HOME classified + female coverage known + runtime role readiness known + Phase 9 import decision ready (PARTIAL).
