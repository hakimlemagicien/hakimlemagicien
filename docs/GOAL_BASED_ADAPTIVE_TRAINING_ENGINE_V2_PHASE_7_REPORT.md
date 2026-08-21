# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 7/12 — WEEKLY VOLUME + RECOVERY + FATIGUE ENGINE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Final status:** `PHASE_7_IMPLEMENTED_READY_FOR_QA`  
**Phase 8:** not started.

---

## A. EXECUTIVE SUMMARY

Phase 7 answers **how much training the client should receive**, not how much load an exercise should use. That remains Phase 6.

The domain engine `getWeeklyVolumeDecision` (`src/lib/platform/volume/`) derives prescribed vs completed working-set volume, direct/indirect regional contribution from Phase 3 metadata, local vs global fatigue, and a categorical recovery state. Default action is **KEEP_VOLUME**. Volume changes are evidence-driven, small (`±1` working set), and blocked by safety, recovery, deload/reconditioning, recent load increase, and cooldown.

KEEP is a first-class outcome. More sets are not automatically better.

---

## B. EXISTING VOLUME / RECOVERY AUDIT

| Area | Before Phase 7 | Used? |
|------|----------------|-------|
| Phase 3 `muscle_contributions` | DIRECT_PRIMARY / DIRECT_SECONDARY / INDIRECT_MEANINGFUL / MINOR_STABILIZER | Yes — only contribution source |
| Phase 4 `prescribeWorkingSets` | 2–4 sets per exercise by level/priority | Starting structure; Phase 7 does not regenerate programs |
| Phase 6 `recoveryHold` | Input only (`NORMAL` hardcoded in player) | Now fed by Phase 7 `recovery_hold` |
| Daily readiness (`energy` / `sleep` / `body`) | Existing check-in | Optional categorical input — **not** the 1–3 score as a fake % |
| `actual_rest_seconds` | Phase 5 capture | Optional rest-pattern signal |
| Coach snapshot | SoT for paid programs | `coachProtected` → no silent overwrite |
| Nutrition | Separate | Signal only (`nutrition_signal`); no calories/macros/meals |

No parallel volume product. No SQL coaching engine.

---

## C. ENGINE ARCHITECTURE

```
Caller-bounded recent weeks (sets + prescribed)
  → aggregateWeeks (working sets only)
  → contribution from Phase 3 metadata
  → recoveryFromReadiness? + recoveryFromTraining
  → local vs global fatigue
  → getWeeklyVolumeDecision
       ├─ regions[] (priority, prescribed, completed, effective, trend, action)
       └─ recovery_hold → Phase 6 getNextSessionProgression
```

| Function | File |
|----------|------|
| `getWeeklyVolumeDecision` | `volume/engine.ts` |
| `aggregateWeeks` | `volume/aggregate.ts` |
| `exerciseContributions` | `volume/contribution.ts` |
| `toProgressionRecoveryHold` | `volume/recovery.ts` |

Window: caller supplies recent week keys only (typically 1–4). Engine does not scan full history.

---

## D. INPUT CONTRACT

`WeeklyVolumeContext` (`volume/types.ts`): `goalId`, `trainingLevel`, `exercises` by `external_id`, `sets[]`, `prescribed[]`, optional `coachProtected`, `safetyRegions`, `continuityState` (`NORMAL` \| `INTERRUPTED` \| `RECONDITIONING_REQUIRED`), `reconditioningActive`, `deloadActive`, `recentLoadIncrease`, `lastVolumeAction`, `readiness[]`, `recentProgressionActions`.

---

## E. VOLUME ACTION CONTRACT

`KEEP_VOLUME` · `ADD_SMALL_VOLUME` · `REDUCE_VOLUME` · `REALLOCATE_VOLUME` · `HOLD_VOLUME_PROGRESSION` · `DELOAD_REVIEW` · `RECONDITIONING` · `INSUFFICIENT_DATA` · `SAFETY_REVIEW`

`recommended_delta` is `0`, `+1`, or `-1` only. No `ADD_VOLUME` synonym. No weekly ladder.

---

## F. PRESCRIBED VS COMPLETED VOLUME

Prescribed working sets stay on `PrescribedVolumeInput`. Completed volume increments only for countable working sets (`isCountableWorkingSet`: not warmup, not skipped, not cancelled, `setCompleted`). Test: prescribed 3 / skipped 1 → completed 2, prescribed remains 3.

---

## G. DIRECT SET CONTRIBUTION

Phase 3 `DIRECT_PRIMARY` weight **1.0**. Hip Thrust (`GL-001`) → GLUTES 1.0 per completed working set. Evidence: `volume-engine.test.ts` direct set / `contribution.ts`.

---

## H. INDIRECT SET CONTRIBUTION

Weights are **role-based**, not “every secondary muscle = 0.5” applied to raw muscle lists:

| Role | Weight |
|------|--------|
| DIRECT_PRIMARY | 1.0 |
| DIRECT_SECONDARY | 0.5 |
| INDIRECT_MEANINGFUL | 0.25 |
| MINOR_STABILIZER | 0 |

Bench (`CH-001`): CHEST 1.0, TRICEPS 0.5. If `muscle_contributions` missing → `EXERCISE_VOLUME_METADATA_REQUIRED` (listed in `metadata_gaps`); no silent guess.

---

## I. REGIONAL EFFECTIVE VOLUME

`effective = Σ(completed working set × role weight)` per canonical muscle. **Physical set count** is counted once per completed working set (`physical_set_count`). One compound set is not three physical sets.

---

## J. GOAL PRIORITY ALLOCATION

Reuses `GOAL_MUSCLE_PROFILES` / `musclePriorityFor` from Phase 4. Goal allocates attention; it cannot override safety or recovery.

---

## K. PRIMARY / SECONDARY / MAINTENANCE

Same three-level contract as Phase 4. Maintenance is not zero. Reallocation reduces high maintenance before adding total load when recovery is LIMITED.

---

## L. BEGINNER VOLUME STRATEGY

UNASSESSED cannot `ADD_SMALL_VOLUME`. Beginner ceiling: no add once primary prescribed effective ≥ 12. Starting per-exercise sets remain Phase 4 conservative 2–3. Phase 7 does not invent a high weekly set table.

---

## M. INTERMEDIATE VOLUME STRATEGY

INTERMEDIATE ≠ max volume. ADD only with 2 stable completed weeks, recovery NORMAL/GOOD, no recent load/volume stress. Ceiling at prescribed effective ≥ 16 → `VOLUME_CEILING_REACHED` / KEEP.

---

## N. KEEP_VOLUME RULES

Default when performance improving, completion good, fatigue manageable. Four productive progressing weeks still KEEP (test). Fat-loss strength maintenance KEEP. Ambiguous data KEEP.

---

## O. ADD_SMALL_VOLUME RULES

Gates: PRIMARY + 2-week window + completion ≥ 95% + STABLE (not improving) + recovery NORMAL/GOOD + no safety/deload/reconditioning + no recent Phase 6 load increase + volume cooldown elapsed + not FAT_LOSS/SLIM_WAIST core add. Delta **+1**.

---

## P. REDUCE_VOLUME RULES

Repeated low completion (<70% across 2 weeks), or local fatigue HIGH with poor completion. Not from one hard set/session. Floor: delta −1 only; does not zero a region.

---

## Q. REALLOCATE_VOLUME RULES

When PRIMARY is stable/completed, maintenance effective > 6, recovery LIMITED: shift −1 maintenance / +1 primary conceptually, **net recommended_delta 0**. Preferred over ADD_TOTAL.

---

## R. LOCAL FATIGUE

Region DECLINING + ≥50% VERY_HARD/FAILURE on that region’s direct sets, while other regions are not globally down → `local_fatigue = HIGH`. Glute down / chest stable test.

---

## S. GLOBAL FATIGUE

≥2 regions DECLINING + completion < 0.85 + recovery not GOOD → HIGH. One muscle is not global.

---

## T. RECOVERY STATE

`GOOD` \| `NORMAL` \| `LIMITED` \| `POOR` \| `INSUFFICIENT_DATA`

No Recovery = 83%. Readiness 1–3 scores are **not** averaged.

Maps to Phase 6: `toProgressionRecoveryHold` → `NORMAL` \| `RECOVERY_LIMITED` \| `DELOAD_ACTIVE` \| `PROGRESSION_HOLD`.

---

## U. RECOVERY BUDGET

Goal sets allocation. Recovery sets total tolerance. PRIMARY cannot demand unlimited volume. LIMITED → reallocate or hold, not add. POOR → hold/reduce/deload review.

---

## V. PERFORMANCE TREND INTEGRATION

Per region, week-over-week median load and reps (direct primary sets): IMPROVING / STABLE / DECLINING / INSUFFICIENT. Progress is not load-only. Stable/improving during FAT_LOSS is productive (`FAT_LOSS_KEEP_PERFORMANCE`).

---

## W. COMPLETION INTEGRATION

`completionRate = physicalCompleted / physicalPrescribed`. Repeated 9/15 → REDUCE or HOLD, never 17 prescribed. Missed work is **not** redistributed (Phase 8).

---

## X. REST SIGNAL INTEGRATION

If ≥3 rest samples and ≥60% `actual < 0.6 × prescribed` **and** declining performance → `REST_PATTERN_REVIEW` (KEEP, not automatic REDUCE). One rest > 2.5× prescribed is ignored as fatigue proof.

---

## Y. CONDITIONING INTERFERENCE

Conditioning class / INTERVAL / DISTANCE sets counted. Lower-body / FULL_BODY cardio + lower-body resistance decline + recovery strain → `CONDITIONING_INTERFERENCE`. Does not delete conditioning. Does not add Fat Loss cardio.

---

## Z. DELOAD REVIEW

Not every 4th week. Not one hard session. Persistent multi-region decline + high effort + poor recovery + low completion → `DELOAD_REVIEW` with delta 0 (no invented 50%). `DELOAD_REVIEW` ≠ `DELOAD_ACTIVE`. Silent activation is not implemented. `deloadActive` input (coach/future) sets Phase 6 `DELOAD_ACTIVE`.

---

## AA. RECONDITIONING SUPPORT

Accepts `reconditioningActive` / `continuityState = RECONDITIONING_REQUIRED`. Output `RECONDITIONING`, delta 0, no history delete, no restore of prior max volume. Phase 8 owns absence detection.

---

## AB. PHASE 6 INTEGRATION

| Phase 6 | Phase 7 |
|---------|---------|
| `INCREASE_LOAD` | usually `KEEP_VOLUME` (`LOAD_INCREASE_OBSERVATION`) |
| `KEEP_LOAD` | `KEEP_VOLUME` valid |
| `HOLD_PROGRESSION` | `REDUCE_VOLUME` / `DELOAD_REVIEW` possible |

`WeeklyVolumeDecision.recovery_hold` is the gate. Player: `options.recoveryHold` (does not recompute weekly volume on every exercise). Test: `DELOAD_ACTIVE` → Phase 6 `HOLD_PROGRESSION` even on 12/12/12.

---

## AC. ADAPTATION COOLDOWN

After `ADD_SMALL_VOLUME`, `validWeeksAgo < 2` → `VOLUME_COOLDOWN` / KEEP. After Phase 6 load increase → observation KEEP.

---

## AD. ANTI-OSCILLATION

If last action REDUCE and engine would ADD (or vice versa) inside the observation window → KEEP. Ambiguous evidence prefers stability.

---

## AE. COACH OVERRIDE

`coachProtected` → `KEEP_VOLUME` / `COACH_OVERRIDE_ACTIVE` / delta 0. Does not rewrite snapshot structure. **NEEDS_DECISION:** no DB lock column; caller must pass the flag.

---

## AF. NUTRITION CONTRACT BOUNDARY

`nutrition_signal`: `NONE` \| `TRAINING_DEMAND_NORMAL` \| `RECOVERY_LIMITED`. Engine source has no calorie/macro/meal writes (test grep).

---

## AG. PHASE 8 COMPATIBILITY

Accepts `INTERRUPTED` / `RECONDITIONING_REQUIRED` without scheduling, catch-up, or calendar repair (test grep `reschedule` / missed session).

---

## AH. PHASE 9 COMPATIBILITY

Exposes per-region volume, trend, fatigue, actions. Does not interpret waist, glute circumference, or photos (test grep).

---

## AI. DECISION REASON CODES

Typed `VOLUME_REASON_CODES` including productive, underdosed review, recovery, completion, local/global fatigue, conditioning, rest pattern, deload pattern, reconditioning, insufficient data, safety, reallocation, maintenance sufficient, coach override, load observation, cooldown, metadata required, ceiling, one hard session, fat-loss keep.

---

## AJ. CONFIDENCE MODEL

LOW / MODERATE / HIGH only. One week → LOW. Multi-week clear pattern → HIGH/MODERATE. No decimals.

---

## AK. DATA / QUERY PERFORMANCE

Pure function over caller-supplied recent weeks and the exercise map for those `external_id`s. No full-history scan, no 320-exercise loop, no N+1 inside the engine. Persistence: none required; derive from set logs. `adaptive_decision_logs` remains available for later service_role audit (not client INSERT).

---

## AL. TESTS ADDED

`src/lib/platform/volume/volume-engine.test.ts` — cases 123–162 including contribution, warmup/skip, no physical double count, KEEP vs no weekly ladder, ADD +1, one-week no-add, low completion, local vs global, one hard session, deload review, glute keep/fatigue, reallocate, fat loss, waist, arms, balanced, posture, recovery/safety blocks, rest pattern, long rest, conditioning interference, load observation, cooldown, anti-oscillation, reconditioning, Phase 6 deload hold, missing data, coach, determinism, no Phase 8/9/nutrition leak.

---

## AM. TEST RESULTS

`weekly volume engine tests passed`  
`progression engine tests passed` (Phase 6 gate)

Full `npm test` + `npm run build` recorded in AO.

---

## AN. LEGACY REGRESSION RESULTS

Assigned programs unchanged. Phase 7 is a recommendation layer; no regeneration required. Player still runs if `recoveryHold` omitted (`NORMAL`).

---

## AO. BUILD / TYPECHECK / LINT

| Check | Result |
|-------|--------|
| ESLint + Prettier on `src/lib/platform/volume` + player options | pass |
| `npm test` | pass (includes Phases 1–7) |
| `npm run build` | pass |
| Full `tsc` | not the product gate |

---

## AP. FILES MODIFIED

See AU grouping in §166 style below.

---

## AQ. DATABASE / MIGRATIONS IF ANY

**None.** Weekly metrics are derived. No destructive history change. No RLS change.

---

## AR. OPEN GAPS

- No weekly job yet to fetch bounded set logs for all assigned exercises (caller/Phase 10).
- `adaptive_decision_logs` not written from the client.
- Exact session placement of +1 set is Phase 10.
- Conditioning intensity/duration granularity is presence + count only if those fields are on the set row.

---

## AS. DEFERRED ITEMS

Phase 8 continuity/missed sessions. Phase 9 regional body response. Phase 10 program generation/placement. Nutrition engine. Progress dashboard. Push notifications. Automatic deload activation numbers. Catch-up sets.

---

## AT. BLOCKERS / NEEDS_DECISION

1. Coach volume lock: pass `coachProtected` until a DB flag exists.  
2. Deload reduction %: review-only until an approved contract exists.  
3. Who fetches the weekly bounded set query (app vs job).

None block QA of the domain engine.

---

## AU. FINAL STATUS

**PHASE_7_IMPLEMENTED_READY_FOR_QA**

---

## 166. FILES MODIFIED (grouped)

**VOLUME ENGINE**  
`src/lib/platform/volume/engine.ts` · `types.ts` · `index.ts` — decision source.

**RECOVERY ENGINE**  
`src/lib/platform/volume/recovery.ts` — categorical recovery + Phase 6 mapping.

**FATIGUE ENGINE**  
Local/global rules inside `engine.ts` (same module; not a parallel product).

**VOLUME AGGREGATION**  
`src/lib/platform/volume/aggregate.ts`

**EXERCISE CONTRIBUTION**  
`src/lib/platform/volume/contribution.ts` — Phase 3 metadata only.

**GOAL PRIORITY**  
Reuses `src/lib/platform/prescription/goal-profile.ts` (no second anatomy file).

**PHASE 6 INTEGRATION**  
`src/hooks/useWorkoutPlayer.ts` — `options.recoveryHold` instead of hardcoded NORMAL.  
`src/lib/platform/progression` — unchanged API; consumes hold.  
`src/lib/platform/training-v2-contracts.ts` — `PHASE_7_VOLUME_ENGINE` pointer.

**CONDITIONING / DELOAD / RECONDITIONING**  
Same `engine.ts` + `types.ts` inputs/outputs.

**TYPES**  
`volume/types.ts`

**DATABASE / RLS**  
None.

**TESTS**  
`src/lib/platform/volume/volume-engine.test.ts` · `package.json` test script.

**DOCS**  
this report · `docs/README.md`

**LEGACY COMPATIBILITY**  
Player option is optional so existing workouts keep running.

---

## 167. VOLUME MAPPING

Hip Thrust `GL-001`: GLUTES DIRECT_PRIMARY 1.0 (PRIMARY for GLUTE_GROWTH), HAMSTRINGS DIRECT_SECONDARY 0.5 (SECONDARY).  
Bench `CH-001`: CHEST 1.0, TRICEPS 0.5. Physical count 1.  
Gaps: exercises without `muscle_contributions` → `metadata_gaps[]`. V2_ELIGIBLE catalog rows used in tests are complete.

---

## 168. RECOVERY SIGNAL REPORT

| Signal | Source | Canonical field | Role | Required | Fallback |
|--------|--------|-----------------|------|----------|----------|
| Working-set completion | set logs | `setCompleted`, `skipped`, `setType` | volume + completion | yes | KEEP / INSUFFICIENT |
| Effort | Phase 5 | `effort_v2` | fatigue | no | ignore missing; never invent IDEAL |
| Load / reps | Phase 5 | `actual_load`, `actual_reps` | trend | no | INSUFFICIENT trend |
| Rest | Phase 5 | `actual_rest_seconds`, prescribed rest | REST_PATTERN_REVIEW | no | ignore |
| Energy / sleep / body | existing readiness | `energy`, `sleep`, `body` | categorical recovery | no | training-only recovery |
| Readiness numeric score | existing | `score` | **not used** | — | — |
| Safety | context | `safetyRegions` | SAFETY_REVIEW | no | none |
| Continuity | context (Phase 8 later) | `continuityState` | reconditioning input | no | NORMAL |
| Phase 6 load event | context | `recentLoadIncrease` | observation KEEP | no | none |

---

## 169. ADAPTATION EXAMPLES

| Action | Inputs | Reason | Confidence |
|--------|--------|--------|------------|
| KEEP_VOLUME | 4 weeks glute reps 8→11, completion 3/3 | CURRENT_VOLUME_PRODUCTIVE | HIGH/MODERATE |
| ADD_SMALL_VOLUME | 2 weeks 3×10 @50, 100% complete, recovery NORMAL, PRIMARY | PRIMARY_REGION_UNDERDOSED_REVIEW | MODERATE, delta +1 |
| REDUCE_VOLUME | 2 weeks 9/15 completed | COMPLETION_TOO_LOW | HIGH, delta −1 |
| REALLOCATE_VOLUME | Glute stable 3, chest maintenance 8, recovery LIMITED | REALLOCATION_PREFERRED | MODERATE, net 0 |
| DELOAD_REVIEW | Multi-region decline + FAILURE + poor readiness + low completion | DELOAD_PATTERN_DETECTED | HIGH, delta 0 |
| RECONDITIONING | `reconditioningActive` | RECONDITIONING_ACTIVE | HIGH, delta 0 |
| INSUFFICIENT_DATA | empty sets/prescribed | INSUFFICIENT_DATA | LOW |

---

Do not start Phase 8 without explicit approval.
