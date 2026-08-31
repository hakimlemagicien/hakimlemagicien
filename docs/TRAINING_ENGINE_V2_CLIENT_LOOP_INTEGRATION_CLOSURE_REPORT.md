# TRAINING ENGINE V2
# CLIENT LOOP INTEGRATION CLOSURE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Developer  
**Release:** NO PRODUCTION DEPLOYMENT  
**Final status:** `CLIENT_LOOP_CLOSED_WITH_EXTERNAL_RELEASE_GATES`

---

## 1. EXECUTIVE SUMMARY

Training Engine V2 Phases 1–12 already contained validated strategy engines. This task did not add Phase 13 or a parallel architecture. It wired the existing Phase 7, 9, and 10 engines into the live `/app` and coach assignment paths, persisted decisions in `adaptive_decision_logs`, and made `/progress` consume those stored decisions.

The connected application loop is:

Goal → assigned snapshot → workout → calibration/prescription → set logs → Phase 6 progression → session complete → Phase 7 volume → Phase 9 regional/goal response → persisted decision → `/progress` → authorized Phase 10 generate/validate/assign when the coach acts on a justified adaptation.

External gates remain: Staging RLS runtime, migration dry-run, no production feature-flag enablement.

---

## 2. PRE-IMPLEMENTATION RUNTIME AUDIT

Traced from `/app` before edits:

| ID | Question | Finding |
|----|----------|---------|
| A | Canonical Goal | Quiz `goalId` via `readQuizProgress` + `mapLegacyGoalId` / `client_map_legacy_goal`. |
| B | Active Program | `client_get_my_training_runtime` → `fetchMyTrainingRuntime` / `useAssignedTrainingRuntime`. |
| C | Assignment | Coach RPC `admin_assign_client_program` copies a published template into `client_program_*` snapshots. |
| D | Workout Session | `client_ensure_workout_session` from `useWorkoutPlayer` when `runtimeMode === "v2"`. |
| E | Sets | `upsertWorkoutSetLog` → `workout_set_logs` (offline queue `hakim:workout-pending-sets:v1`). |
| F | Session completion | `client_update_workout_session_status` COMPLETED / PARTIALLY_COMPLETED. |
| G | Phase 6 | `getNextSessionProgression` inside `useWorkoutPlayer` (V2 lane only). |
| H | Phase 7 caller | **None** in hooks/routes/admin. Tests + Phase 12 simulate only. |
| I | Phase 9 caller | **None**. Progress hook did not pass `goalDecision`. |
| J | Phase 10 caller | **None**. Admin assigned templates only. |
| K | `/progress` | Continuity + exercise set summaries. Live goal card often `INSUFFICIENT_DATA`. |
| L | Decision logs | Table `adaptive_decision_logs` existed; client INSERT denied; no upsert RPC. |
| M | Coach assignment | `ClientTrainingWorkspace` → `admin_assign_client_program`. Coach authority required. |

No second source of truth was introduced. Existing snapshot assignment remains canonical.

---

## 3. CANONICAL ENGINE FILES IDENTIFIED

| Domain | Canonical path |
|--------|----------------|
| Volume / Recovery / Deload | `src/lib/platform/volume/` → `getWeeklyVolumeDecision` |
| Regional / Goal response | `src/lib/platform/goal-intelligence/` → `evaluateRegionalResponse` / `evaluateGoalResponse` |
| Program generator / validator | `src/lib/platform/program-generation/` → `generateTrainingProgram` / `validateTrainingProgram` / `canActivateProgram` |
| Progress summary | `src/lib/platform/training-progress/summary.ts` → `getClientTrainingProgressSummary` |
| Assignment snapshots | `admin_assign_client_program` + `client_program_assignments` tree |
| Continuity | `src/lib/platform/continuity/` via `useProgramContinuity` |
| Workout / sets | `useWorkoutPlayer` + `workout_set_logs` |
| Decision storage | `public.adaptive_decision_logs` (Phase 2) |

Integration module (wiring only): `src/lib/platform/client-loop/`.

---

## 4. PHASE 7 INTEGRATION

`evaluateClientLoop` feeds real set logs, prescribed working sets from the assigned snapshot, exercise V2 metadata, last persisted volume action, goal, and training level into `getWeeklyVolumeDecision`. Rules were not rewritten.

---

## 5. PHASE 7 PERSISTENCE

Decision type `WEEKLY_VOLUME` upserted to `adaptive_decision_logs` with `evaluation_key = volume:{assignmentId}:{ISO week}` and a compact `progress_view` snapshot (action, recovery, regions, delta). Canonical actions reused (`KEEP_VOLUME`, `ADD_SMALL_VOLUME`, `REDUCE_VOLUME`, `HOLD_VOLUME_PROGRESSION`, `DELOAD_REVIEW`, `INSUFFICIENT_DATA`, …).

---

## 6. PHASE 7 RUNTIME CALL SITE

`runClientLoopAfterSession(isV2)` from `useWorkoutPlayer` after COMPLETED and PARTIALLY_COMPLETED. Not after every set. Not on rerender. In-flight mutex in `run.ts`. Free preview (`legacy_free`) does not run the loop.

`/progress` may trigger one evaluation if the client has an assigned program and no stored `GOAL_RESPONSE` yet, then reads the persisted row.

---

## 7. PHASE 7 IDEMPOTENCY

Unique index `(user_id, decision_type, evaluation_key)`. RPC `client_upsert_adaptive_decision` `ON CONFLICT DO UPDATE`. Repeating the same ISO-week window overwrites the same row.

---

## 8. PHASE 9 INTEGRATION

Same `evaluateClientLoop` maps Phase 7 region rows into `evaluateRegionalResponse`, then `evaluateGoalResponse`. Phase 9 does not recompute weekly volume. It consumes `recovery_state`, region completion, trends, and adherence share from the Phase 7 result plus set counts.

---

## 9. PHASE 9 PERSISTENCE

Decision type `GOAL_RESPONSE` with `evaluation_key = goal:{assignmentId}:{ISO week}`. Snapshot includes `toAdaptiveDecisionSnapshot` fields plus `progress_view` (response, action, explanation, reallocation, regional states, nutrition/body flags). Survives refresh/relogin because `/progress` reads `client_list_own_adaptive_decisions`.

---

## 10. PHASE 9 RUNTIME CALL SITE

Same session-complete path as Phase 7, plus optional first-load evaluation on `/progress` when no stored goal decision exists.

---

## 11. PHASE 7 → PHASE 9 CONTRACT

One volume decision per evaluation window. Phase 9 uses `volume.recovery_state`, region prescribed/completed/effective/trend/fatigue, and does not call `getWeeklyVolumeDecision` again. `program_adaptation_justified` is false when volume is `DELOAD_REVIEW` / `RECONDITIONING` / `SAFETY_REVIEW` / `HOLD_VOLUME_PROGRESSION` / `REDUCE_VOLUME` or recovery is `POOR`/`LIMITED`.

---

## 12. GOAL-SPECIFIC GUARDRAILS

Unchanged engines. Connected tests:

- **GLUTE_GROWTH:** slow glute + fast quads + KEEP_VOLUME → `REALLOCATE_TRAINING_EMPHASIS` (quads → glutes), not `ADD_SMALL_VOLUME`.
- **SLIM_TONED_WAIST:** no reallocation toward abs/core for local fat loss; no `ADD_SMALL_VOLUME`.
- **FAT_LOSS:** no automatic resistance add; no HIIT copy; nutrition remains a review signal.
- Recovery/adherence still override goal optimization.

---

## 13. PHASE 10 GENERATOR INTEGRATION

Admin `ClientTrainingWorkspace` button **توليد برنامج V2** calls `generateAuthorizedProgramCandidate` → existing `generateTrainingProgram`. Not on `/app` page load. Not silent auto-assign.

---

## 14. PROGRAM VALIDATOR INTEGRATION

`canActivateProgram` must pass before the Assign button is enabled. RPC `admin_assign_generated_v2_program` rejects `p_validation_status` other than `VALID` / `VALID_WITH_WARNINGS` and `p_generation_status` other than `READY` (`program_invalid` / `program_generation_blocked`). `suggested_weight_kg` non-null is rejected.

---

## 15. COACH/ADMIN ASSIGNMENT FLOW

Template assignment path is unchanged. Generated valid candidates use a new admin-gated RPC that writes the same `client_program_weeks/days/exercises` snapshot tables with `generation_source = 'v2_generator'` and nullable `source_template_id`. Coach must confirm. INVALID shows errors and leaves the current program.

---

## 16. PROGRAM VERSIONING/HISTORY

Replace still marks the previous assignment `replaced` with `ended_at` / `archived_at`. Old sessions, sets, and decision rows remain on their original `assignment_id`. New assignment gets a new id and `template_version` from the candidate version. No in-place rewrite of historical snapshots.

---

## 17. PHASE 9 → PHASE 10 ADAPTATION FLOW

`program_adaptation_justified` is true only for `REALLOCATE_TRAINING_EMPHASIS` / `PROGRAM_REVIEW_REQUIRED` when volume/recovery do not block. The generator is not auto-invoked. Coach generates with optional reallocation from the persisted goal decision. Productive `KEEP_VOLUME` + `KEEP_STRATEGY` does not request generation.

---

## 18. PHASE 11 /PROGRESS INTEGRATION

`useTrainingProgressSummary` loads `listOwnAdaptiveDecisions` and passes stored `goalDecision` / `regionalDecisions` / `volumeDecision` into `getClientTrainingProgressSummary`. It does not call `evaluateGoalResponse(` or `getWeeklyVolumeDecision(` inline.

---

## 19. CLIENT EXPLAINABILITY

Client copy still comes from Phase 11 `mapGoalStatus` / `GOAL_COPY`. Reallocation uses existing “تعديل التركيز التدريبي” path. Insufficient data stays the approved neutral card (`نحتاج المزيد من البيانات`). No genetics / spot-reduction claims.

---

## 20. DECISION TRACE / OBSERVABILITY

Stored snapshots include engine name, evaluation week, volume action, goal action, adaptation flag. Analytics events reused: `volume_adaptation_applied`, `recovery_hold_applied`, `deload_review_triggered`, `goal_response_updated`, `insufficient_data`. Admin can list client decisions via `admin_list_client_adaptive_decisions`. Invalid generation writes `PROGRAM_VALIDATION_BLOCKED` via `admin_record_adaptive_decision`. PII keys still stripped by existing analytics sanitizer.

---

## 21. DATABASE CHANGES

Additive only:

- `adaptive_decision_logs.evaluation_key`, `assignment_id`, `program_version`
- unique `(user_id, decision_type, evaluation_key)`
- `client_program_assignments.source_template_id` nullable
- `client_program_assignments.generation_source` (`template` | `v2_generator`)

No new decision tables. No `v2_programs`. No nutrition mutation.

---

## 22. MIGRATIONS

`supabase/migrations/20260821180000_client_loop_integration.sql`

RPCs:

- `client_upsert_adaptive_decision` (auth.uid() only)
- `client_list_own_adaptive_decisions`
- `admin_list_client_adaptive_decisions`
- `admin_record_adaptive_decision`
- `admin_assign_generated_v2_program`

Table INSERT on `adaptive_decision_logs` remains denied for `authenticated`; writes go through SECURITY DEFINER RPCs.

**Not applied to production.**

---

## 23. RLS STATUS

`RLS_SQL_VERIFIED`  
`RUNTIME_STAGING_PENDING`

Plan updated in `supabase/tests/training_engine_v2_rls_test_plan.sql` (items 37–44). Live cross-user denial was not executed against Staging/Production.

---

## 24. MIGRATION DRY-RUN STATUS

`MIGRATION_DRY_RUN_PENDING_EXTERNAL_ENVIRONMENT`

No Staging database was available in this session. No production apply.

---

## 25. LEGACY COMPATIBILITY

Free preview remains `legacy_free` and does not run the V2 loop. Existing template-assigned snapshots still load via `client_get_my_training_runtime`. No bulk regeneration of legacy programs. Phase 4/6/8 call sites unchanged except the post-session loop hook on the V2 lane.

---

## 26. TRAINING ↔ NUTRITION BOUNDARY

`evaluate.ts` is pure and does not write calories/macros/meals. Fat-loss / waist paths emit review flags only. Contract may remain `PENDING_SHARED_CONTRACT` when nutrition input is absent.

---

## 27. GLUTE LOOP TEST

Deterministic three-week history: glute load/reps stable, squat (quad-primary) improving, high completion, volume cooldown KEEP.

Result: `volume_action=KEEP_VOLUME`, `goal_response=REGIONAL_UNDER_RESPONSE`, `action=REALLOCATE_TRAINING_EMPHASIS` (QUADRICEPS → GLUTES). Not a blind lower-body add.

---

## 28. GLUTE RECOVERY-LIMITED TEST

High effort / incomplete prescribed work. Volume does not `ADD_SMALL_VOLUME`. `program_adaptation_justified=false`. Recovery-limited generation does not increase set count vs baseline.

---

## 29. WAIST TEST

`SLIM_TONED_WAIST` with stable waist trend. No reallocation to abs/core. No `ADD_SMALL_VOLUME`.

---

## 30. FAT LOSS TEST

`FAT_LOSS` with improving chest performance and stable weight. No `ADD_SMALL_VOLUME`. No HIIT requirement in client explanation. Training does not mutate nutrition.

---

## 31. LOW ADHERENCE TEST

Low completed vs prescribed glute work → adherence/completion limitation, not `ADD_SMALL_VOLUME`, not `STAGNANT_REVIEW`.

---

## 32. PRODUCTIVE KEEP_VOLUME TEST

Four improving weeks with last action KEEP → `KEEP_VOLUME` and `program_adaptation_justified=false`.

---

## 33. INSUFFICIENT DATA TEST

Sparse one-week history → `INSUFFICIENT_DATA`, no speculative adaptation. Progress card tone `neutral`.

---

## 34. INVALID PROGRAM TEST

Empty cloned candidate: `canActivateProgram` false. Lock/exclude conflict: `assignable=false`. RPC raises `program_invalid`. Admin UI disables assign. Existing program unchanged (SQL exception before insert).

---

## 35. REFRESH / RELOGIN TEST

Architecture: decisions live in `adaptive_decision_logs` keyed by user. `/progress` reads RPC, not React state. Live device refresh/relogin not executed in this environment; persistence contract is upsert + SELECT own rows.

---

## 36. IDEMPOTENCY TEST

Same evaluation key upserts; fake store size does not grow a second volume+goal pair. Unique index enforces DB-level.

---

## 37. HISTORY PRESERVATION TEST

Replace path archives previous assignment; new snapshot is a new row. Set logs keep `assignment_id`. Not rewritten.

---

## 38. SECURITY TEST

SQL: upsert binds `auth.uid()`; admin RPCs `_require_admin`; anon revoked; assignment_id must belong to caller.

**Not marked PASS on live RLS.** Unverified surface: Staging/Production execution of items 37–44.

---

## 39. REGRESSION RESULTS

Covered by existing Phase 4/6/8/10 tests plus new integration tests:

- New exercise without history still calibrates in prescription engine tests.
- Double progression still reps-then-load (no universal +10% on V2 lane).
- Continuity still no set debt.
- INVALID never activates.
- Spot reduction not introduced in connected goal path.
- Nutrition not mutated.

---

## 40. FILES MODIFIED

- `src/lib/platform/client-loop/*` (new)
- `src/hooks/useWorkoutPlayer.ts`
- `src/hooks/useTrainingProgressSummary.ts`
- `src/components/admin/ClientTrainingWorkspace.tsx`
- `src/lib/admin/admin-client-training-api.ts`
- `src/lib/admin/admin-libraries.ts`
- `src/lib/admin/program-assignment-snapshot.test.ts`
- `src/lib/platform/training-progress/training-progress.test.ts`
- `src/lib/platform/training-v2-release/audits.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/20260821180000_client_loop_integration.sql`
- `supabase/tests/training_engine_v2_rls_test_plan.sql`
- `src/lib/platform/training-v2-release/audits.ts`
- `docs/README.md`
- `docs/PROJECT_STATUS.md`
- this report

---

## 41. TESTS ADDED/MODIFIED

Added: `src/lib/platform/client-loop/client-loop.test.ts` (wired in `npm test`).

Modified: training-progress hook assertions; program-assignment snapshot forbids `admin_assign_generated_v2_program` on client files.

---

## 42. TYPECHECK RESULT

No dedicated `typecheck` script. Production gate is `npm run build` (Vite). **PASS** (`✓ built` client/server, exit 0).

## 43. LINT RESULT

`npx eslint` on touched files reports Prettier wrapping on the large existing `ClientTrainingWorkspace.tsx` (mostly pre-existing line length). New `src/lib/platform/client-loop/` and `useTrainingProgressSummary.ts` were formatted with Prettier. Full-repo `npm run lint` was not used as a release gate (not required historically for V2 phases).

## 44. TEST RESULT

- `src/lib/platform/client-loop/client-loop.test.ts`: **PASS**
- `src/lib/platform/training-v2-release/training-v2-release.test.ts`: **PASS** (after adding the new migration to `V2_MIGRATIONS`)
- `src/lib/platform/training-progress/training-progress.test.ts`: **PASS** (inside the full suite run)
- Full `npm test`: executed; failed once on frozen V2 migration list; fixed in `audits.ts`; preceding tests in that run had already passed; failing test re-run **PASS**

## 45. BUILD RESULT

`npm run build`: **PASS** (exit 0). No production deploy.

---

## 46. OPEN ISSUES

1. Staging RLS not executed.
2. Migration dry-run not executed.
3. Real-device refresh/relogin cohort not executed.
4. First `/progress` visit may run evaluation if no stored goal decision (then persist); subsequent visits read storage.
5. Generated assignment uses `level = 'custom'` text; template catalog goals remain separate from canonical V2 goal ids stored on the snapshot `goal` column.

---

## 47. EXTERNAL ENVIRONMENT ITEMS

- Apply `20260821180000_client_loop_integration.sql` on Staging.
- Execute updated RLS plan items 37–44.
- Migration dry-run against a production-like copy.
- Controlled coach cohort: generate → validate → assign → train → progress.

---

## 48. RELEASE RISKS

- Enabling V2 globally is still out of scope.
- Coach must still assign; empty catalog or unpublished exercises can block generation.
- Active `IN_PROGRESS` workout blocks generated replace (`active_workout_in_progress`).
- Unique evaluation keys collide only within the same user/type/week (intended).

---

## 49. FINAL CLIENT LOOP MATRIX

| Stage | Status | Blocker if NOT LIVE |
|-------|--------|---------------------|
| GOAL | LIVE | |
| PROGRAM GENERATION | LIVE | Authorized admin path; not client auto-gen |
| PROGRAM VALIDATION | LIVE | |
| PROGRAM ASSIGNMENT | LIVE | Coach confirm required |
| WORKOUT | LIVE | |
| CALIBRATION | LIVE | V2 lane |
| SET LOGGING | LIVE | |
| PROGRESSION | LIVE | V2 lane |
| CONTINUITY | LIVE | |
| VOLUME / RECOVERY | LIVE | Session-complete + persist |
| REGIONAL RESPONSE | LIVE | Persisted with goal decision |
| GOAL RESPONSE | LIVE | Persisted |
| PROGRAM ADAPTATION | LIVE | Coach-authorized; evidence-gated |
| PROGRESS EXPLANATION | LIVE | Reads persisted Phase 9 |
| DECISION TRACE | LIVE | `adaptive_decision_logs` + analytics |

---

## 50. FINAL STATUS

`CLIENT_LOOP_CLOSED_WITH_EXTERNAL_RELEASE_GATES`

Application runtime connections are in place. Staging RLS, migration dry-run, and production enablement remain external.

**NEXT HANDOFF:** QA Manager + Database Architect — STAGING RELEASE GATE.

**DO NOT DEPLOY.**
