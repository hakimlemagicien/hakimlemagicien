# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 8/12 — ADHERENCE + MISSED SESSIONS + PROGRAM CONTINUITY ENGINE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Status:** `PHASE_8_IMPLEMENTED_READY_FOR_QA`  
**Phase 9:** not started

---

## A. EXECUTIVE SUMMARY

Phase 8 adds a centralized continuity engine that reasons from **actual training sequence**, not weekday labels. Missed, partial, interrupted, rescheduled, skipped, and returning-after-break behavior is classified deterministically. The next workout is a stable `program_day_id`. Missed work is never stacked, never punished, and never converted into nutrition or gamification penalties.

Service: `getProgramContinuityDecision` in `src/lib/platform/continuity/engine.ts`.  
UI: existing Program / Home / Your Day / Resume flows via `useProgramContinuity`.

---

## B. EXISTING SCHEDULE/CONTINUITY AUDIT

| Surface | Before Phase 8 | After |
|---|---|---|
| `runtimeToWeekdayPlans` | ISO `day_number` → Mon–Sun | still calendar display; identity now includes `programDayId` |
| Home `buildNextSession` | `assignedPlans[getWeekdayIdFromDate()]` | overlay of **next sequence day** onto today |
| Workout page | selected weekday plan | today uses continuity overlay; other days keep planned display |
| Your Day | hardcoded `TODAY_WORKOUT_PRESCRIPTIONS.length` (6) | paid assigned uses effective plan length |
| `workout_sessions.status` | READY / IN_PROGRESS / PARTIALLY_COMPLETED / COMPLETED / INTERRUPTED / CANCELLED | unchanged factual contract |
| `client_get_my_training_runtime` | already returns `day_id` | TS now reads `day_id` |
| No `training_schedule_v2` table | confirmed | not created |

Hardcoded weekday was the Phase 1 gap. Continuity overlay fixes **today’s effective session** without rewriting the weekly calendar generator (Phase 10).

---

## C. ENGINE ARCHITECTURE

```
FACTS (client_program_days + workout_sessions + pending sync + Phase 7 recovery)
  → getProgramContinuityDecision(context)
  → action + next_program_day_id + reconditioning gates
  → overlayTodayPlan (today only)
  → Program / Home / Your Day / Start-or-Resume CTA
  → Phase 4 prescription_state / Phase 6 recoveryHold / Phase 7 continuityState
```

Pure domain: `src/lib/platform/continuity/`.  
No React rules. No calendar component logic.

---

## D. CONTINUITY INPUT CONTRACT

`ContinuityContext` (`src/lib/platform/continuity/types.ts`):

- `assignmentId`, `assignmentStatus`, `previousAssignmentId`
- `timezone`, `now`
- `days: ContinuityProgramDay[]` (stable `programDayId`, `sequenceIndex`, `dayNumber` as metadata, `primaryRegions`, exercise priorities)
- `sessions: ContinuitySessionFact[]` (factual status, timestamps, working-set counts, optional `skipAttribution`, `pendingSync`)
- `daysPerWeek`, `recoveryState`, `localFatigueRegions`, `safetyActive`, `pendingSync`, `recentSwapCount`, `goalChanged`

Hook loads only last 24 `workout_sessions` rows (`listOwnRecentWorkoutSessions`) — not historical set logs.

---

## E. CONTINUITY OUTPUT CONTRACT

`ContinuityDecision`:

| Field | Role |
|---|---|
| `action` | typed continuity action |
| `next_program_day_id` | stable identity (not “Wednesday”) |
| `current_sequence_position` | sequence index |
| `effective_date` | local date after timezone |
| `original_scheduled_date` | planned occurrence |
| `previous_session_state` | COMPLETED / PARTIAL / MISSED / RESCHEDULED / INTERRUPTED / NONE |
| `recommended_session_status` | expire IN_PROGRESS → INTERRUPTED/PARTIAL without marking COMPLETED |
| `resume_session_id` | same workout_session |
| `reconditioning_state` / `prescription_state` | Phase 4/6/7 gates |
| `recalibration_required` | exercise load gate, not experience wipe |
| `schedule_review_required` | capacity/duration mismatch |
| `reason_code` + `confidence` | LOW / MODERATE / HIGH |
| `client_explanation` | Arabic, non-punitive |
| `adherence` | factual counters |
| `hold_progression` / `hold_volume` | no catch-up |

Mappers: `toVolumeContinuityInput`, `toProgressionRecoveryHold`.

---

## F. SESSION STATE MODEL

Canonical factual statuses remain Phase 2/5:

`READY | IN_PROGRESS | PARTIALLY_COMPLETED | COMPLETED | INTERRUPTED | CANCELLED`

Continuity **interpretations** (not stored as duplicate status enum):

`MISSED | RESCHEDULED | SKIPPED_BY_USER | COACH_CANCELLED`

`previous_session_state` on the decision may be `MISSED` / `RESCHEDULED` without writing those strings into `workout_sessions.status`.

---

## G. ACTUAL SEQUENCE MODEL

`workoutSequence()` keeps only `day_type === "workout"` with exercises, ordered by `sequenceIndex`.

Example: planned Mon=A, Wed=B, Fri=C. Rest Tuesday is **not** a sequence identity. Completing A then returning Thursday still yields **B**, not “Thursday’s weekday plan”.

`nextAfter(sequence, lastCompleted.programDayId)` is the default successor. Weekday labels are scheduling metadata only (`dayNumber`).

---

## H. CALENDAR VS SEQUENCE HANDLING

- Calendar week strip: still ISO-day mapping for **planned** display.
- Today / Start Workout: `overlayTodayPlan` replaces **today’s** plan content with the next sequence day (`src/lib/platform/continuity/apply.ts`).
- Planned Wednesday identity is not deleted when Thursday displays B.
- `session_date` remains the actual local date; `assignment_day_id` preserves program-day identity (`ensureWorkoutSession` now receives `assignmentDayId`).

---

## I. COMPLETED SESSION HANDLING

Last `COMPLETED` + meaningful working exposure → next sequence day. The completed day is not re-offered unless `REPEAT_PRIORITY_SESSION` from a later partial/priority miss.

---

## J. PARTIAL SESSION HANDLING

Completed working sets are preserved (player already persists logs). Continuity does **not** restart the whole session by default.

- Recent incomplete (`<= 18h`): `RESUME_SESSION` (same `workout_session` id).
- Stale IN_PROGRESS (`> 36h`): interpret as INTERRUPTED/PARTIAL; never COMPLETED; never delete.
- Warm-up only (`warmupOnly` or 0 working sets): not meaningful exposure.

---

## K. PRIMARY-WORK PARTIAL LOGIC

`primaryCompletion()` uses exercise `priority` (`PRIMARY`/`IMPORTANT` vs `OPTIONAL`/`SUPPORT`). First exercises of a program day are PRIMARY/IMPORTANT (`programDaysFromRuntime`).

- Primary ratio `>= 0.67` → `ADVANCE_AFTER_PARTIAL` (optional miss allowed).
- Optional-only or primary ratio `< 0.4` → `REPEAT_PRIORITY_SESSION`.
- Percentage alone is not used; optional accessories are not equal to primary stimulus.

---

## L. MISSED SESSION DEFINITION

A session is interpreted as **MISSED** only when:

1. It was the expected next sequence day (`next_program_day_id`).
2. No meaningful working exposure occurred (`completedWorkingSets > 0`).
3. The **frequency-aware window has closed**.

Window (`dates.ts`):

- `permittedShiftDays`: 2 if `daysPerWeek <= 3`, else 1.
- Closed only if `nowLocalDate > scheduledLocalDate + shiftDays`.
- **Same local date is never closed** (no midnight reset).
- Local dates via `getLocalDateKey` (`Intl` `en-CA`, client timezone). Never `toISOString().slice(0,10)` for miss logic.

Empty history (never started) is **not** missed — first day is `CONTINUE_SEQUENCE`.

Pending sync → `INSUFFICIENT_DATA` / `PENDING_SYNC`, not MISSED.

---

## M. RESCHEDULING

`RESCHEDULE_SESSION` keeps the **same** `program_day_id`. `original_scheduled_date` vs `effective_date` are both on the decision. No second program exposure is created. Overlay places that day onto today.

Client explicit skip uses `skipAttribution: USER_SKIP` (distinct). Coach cancel: `COACH_CANCEL`. No duplicate Wednesday MISSED + Thursday brand-new B.

---

## N. SESSION SWAPS

If last completed primary regions overlap next HIGH/LIMITED session within ~20h: try `SWAP_SESSION_ORDER` to another sequence day without that overlap. `recentSwapCount >= 2` → `PROGRAM_REVIEW_REQUIRED` (no infinite shuffle). Does not invent new sessions or change exercises.

---

## O. BACK-TO-BACK TRAINING

No blanket 48h or “no two days in a row”.

- Different primary regions + recovery NORMAL → `BACK_TO_BACK_ALLOWED` / continue.
- Same region + HIGH demand or LIMITED recovery → DEFER or SWAP.

---

## P. LOCAL RECOVERY INTEGRATION

`localFatigueRegions` (Phase 7) compared with next `primaryRegions` via `regionsOverlap`. Same-region conflict → SWAP/DEFER, not weekday continuation.

---

## Q. GLOBAL RECOVERY INTEGRATION

`recoveryState === "POOR"` → `DEFER_SESSION` / `RECOVERY_CONFLICT`, `hold_progression` + `hold_volume`. Missed work is not stacked onto the next day.

---

## R. SHORT BREAK RETURN

`classifyAbsence` (`reconditioning.ts`): not calendar-only.

Normal inter-session gap (`≈ 7/daysPerWeek`) with 0 missed expected exposures → `NONE`.

Short: missed `<= 2` and duration `<= 4` days (after excluding normal gap) → `SHORT_BREAK_RETURN`, `hold_progression`, `prescription_state = NORMAL`. No reconditioning, no level reset.

---

## S. LONG BREAK RETURN

Long if **missed expected exposures >= 3**, or **duration >= 8 and missed >= 2**, or sparse/dense frequency variants. → `ENTER_RECONDITIONING`. History is not deleted.

---

## T. RECONDITIONING TRIGGERS

Evidence: absence duration **and** missed expected exposures **and** program frequency.  
Not `7 days = -10%`. No universal percentage law.

Output: `reconditioning_state: true`, `prescription_state: "RECONDITIONING"`.  
`trainingLevel` is never written by this engine.

---

## U. RECALIBRATION TRIGGERS

`shouldRecalibrate`: LONG_BREAK + established history + MODERATE/HIGH demand. Not every exercise, not NEW movements.

Phase 4 already maps `prescriptionState === "RECONDITIONING"` → `RECALIBRATION_REQUIRED` (`prescription/engine.ts`). Player now passes `prescriptionState` from continuity.

---

## V. TRAINING LEVEL PRESERVATION

Continuity never sets BEGINNER. `ensureTrainingLevel` remains the level source. Returning INTERMEDIATE stays INTERMEDIATE while `prescription_state = RECONDITIONING`.

---

## W. EXERCISE EXPERIENCE PRESERVATION

No writes to `client_exercise_experience`. Experience stays historically known; load baseline may require recalibration.

---

## X. WEEK/MICROCYCLE BOUNDARY

Sequence wraps A→B→C independently of Monday–Sunday. Sunday planned / Monday performed is the same `program_day_id` with a new `session_date`. Volume accounting remains Phase 7 by actual timestamps. No volume debt field exists.

---

## Y. ADHERENCE METRICS

`AdherenceMetrics`: `sessions_prescribed | completed | partial | missed`, `working_sets_prescribed | completed`. Coach/system cancels excluded from prescribed. Not app-open counts. Rolling window ≈ last 3 sequence lengths.

---

## Z. SCHEDULE CAPACITY MISMATCH

If `daysPerWeek >= 4` and completion share is at or below `3/daysPerWeek` with `sessions_missed >= 4` over the recent window → `SCHEDULE_REVIEW_REQUIRED` / `SCHEDULE_CAPACITY_MISMATCH`. No stacking to force the prescribed day count.

---

## AA. SESSION DURATION MISMATCH

`>= 3` of last 4 client sessions `PARTIALLY_COMPLETED` → `PROGRAM_DURATION_MISMATCH`. Not labeled poor adherence.

---

## AB. PROGRAM CHANGE HANDLING

Sessions filtered to current `assignmentId`. New assignment with different id starts at sequence 0. Ended/cancelled assignment → `PROGRAM_REVIEW_REQUIRED`. Historical rows are not updated or deleted.

---

## AC. GOAL CHANGE HANDLING

`goalChanged` only annotates `GOAL_CHANGE` on an otherwise normal continue. No goal rewrite, no history delete. Full goal intelligence is Phase 9.

---

## AD. COACH AUTHORITY

`skipAttribution: COACH_CANCEL` advances sequence and is **not** counted as client miss. Deleted coach sessions are not recreated.

---

## AE. CLIENT RESCHEDULE OVERRIDE

`RESCHEDULE_SESSION` uses `effective_date` (today local) and keeps `original_scheduled_date`. Continuity no longer treats the original weekday as the active expected exposure once the window has passed.

---

## AF. OFFLINE/PENDING-SYNC HANDLING

`readPendingQueue()` in `useProgramContinuity`. Any pending set or `session.pendingSync` → `INSUFFICIENT_DATA` / `PENDING_SYNC`. No MISSED classification until reconcile.

---

## AG. TIMEZONE HANDLING

`getLocalDateKey` / `getUserTimeZone` from `src/lib/platform/readiness.ts`. Session create date uses local key, not UTC `toISOString`. Workout today-key on Program page uses `continuity.todayKey`. DST-safe: local calendar dates, not 24h millisecond arithmetic for day identity (`addLocalDays` uses UTC date components of a `YYYY-MM-DD` civil date).

---

## AH. REASON CODES

Typed in `CONTINUITY_REASON_CODES` (`types.ts`):  
`NORMAL_SEQUENCE`, `ACTIVE_SESSION_RESUME`, `PARTIAL_PRIMARY_COMPLETE`, `PARTIAL_PRIMARY_MISSED`, `SESSION_MISSED`, `SESSION_RESCHEDULED`, `RECOVERY_CONFLICT`, `LOCAL_FATIGUE_CONFLICT`, `BACK_TO_BACK_ALLOWED`, `BACK_TO_BACK_DEFERRED`, `SHORT_BREAK_RETURN`, `LONG_BREAK_RETURN`, `RECONDITIONING_REQUIRED`, `SCHEDULE_CAPACITY_MISMATCH`, `PROGRAM_DURATION_MISMATCH`, `PENDING_SYNC`, `COACH_PROGRAM_CHANGE`, `GOAL_CHANGE`, `INSUFFICIENT_DATA`, `SAFETY_BLOCK`, `STALE_ACTIVE_SESSION`, `USER_SKIPPED`, `COACH_CANCELLED`, `NO_VOLUME_DEBT`.

---

## AI. DECISION CONFIDENCE

`LOW` pending/insufficient; `MODERATE` single miss / short break; `HIGH` clear resume, primary-complete advance, safety, long break with `missed >= 3`. No fake percentages.

---

## AJ. UI INTEGRATION

No new continuity screen. Copy in `explanations.ts` (Arabic, non-punitive). Resume CTA: «استكمل التمرين». Reconditioning: «سنعود تدريجيًا إلى مستواك السابق بناءً على أدائك الحالي.» No “you became a beginner.”

---

## AK. PROGRAM / YOUR-DAY INTEGRATION

- Program: `useProgramContinuity` + overlay today + notice on reschedule/defer/partial/reconditioning/schedule review.
- Home: overlay today plan; resume CTA override in `buildNextSession`.
- Your Day: workout total from effective assigned plan, not 6 seed exercises.
- Start Workout still `/app/program/workout/exercise` with `day=today`; overlay ensures that plan is the sequence day.

---

## AL. PHASE 4/6/7 INTEGRATION

| Phase | Gate from Phase 8 |
|---|---|
| 4 | `prescriptionState: RECONDITIONING` → existing `RECALIBRATION_REQUIRED` |
| 6 | `toProgressionRecoveryHold` → `PROGRESSION_HOLD` / `RECOVERY_LIMITED` (`useWorkoutPlayer` `recoveryHold`) |
| 7 | `toVolumeContinuityInput` → `reconditioningActive` + `continuityState` (Phase 7 already accepts these inputs; it does not detect absence itself) |

Peak load is not restored: Phase 4 reconditioning path already uses `RECONDITIONING_HISTORY` / recalibration, not last peak as active load.

---

## AM. PHASE 9 COMPATIBILITY

No regional response, goal success/plateau, body-composition, or goal-level reallocation. Continuity only preserves goal **priority of session work** for partial interpretation.

---

## AN. NUTRITION BOUNDARY

Engine source has no calories/macros/meals mutation (asserted in `continuity-engine.test.ts`). Missed session does not change nutrition.

---

## AO. TESTS ADDED

`src/lib/platform/continuity/continuity-engine.test.ts`  
`package.json` `npm test` includes it.

---

## AP. TEST RESULTS

`npm test` — exit 0 (Phase 1–8 including continuity).  
`npm run build` — exit 0.

---

## AQ. RLS / SECURITY

No new table. Continuity reads `workout_sessions` with existing own-select RLS (`listOwnRecentWorkoutSessions` filters `user_id = auth.uid()`). Status expiry uses `client_update_workout_session_status` (own row). Plan additions in `supabase/tests/training_engine_v2_rls_test_plan.sql` items 28–31. Runtime QA still blocked without local DB (`DATABASE_RUNTIME_QA_ENVIRONMENT_BLOCKED` from Phase 2).

---

## AR. PERFORMANCE

Targeted last-24 sessions query. No full set-log scan on Program/Home load. Continuity is O(sessions + program days). Overlay is in-memory.

---

## AS. BUILD / TYPECHECK / LINT

- `npm test` pass
- `npm run build` pass
- IDE lints on touched continuity/UI files: none

---

## AT. FILES MODIFIED

See section grouped list below (handoff §176).

---

## AU. DATABASE/MIGRATIONS IF ANY

**None.** Reused `client_program_days.id`, `workout_sessions.assignment_day_id`, existing session statuses, `client_get_my_training_runtime.day_id`.

---

## AV. LEGACY COMPATIBILITY

Free preview still uses weekday seed plans (`resolveWeekdayPlan` without assignment). Paid empty assignment still rest/empty. Legacy `+10%` isolated. `SET_WEIGHT_INCREMENT` unused by continuity.

---

## AW. OPEN GAPS

- Skip-by-user UI control is not a dedicated button yet; attribution is supported when a session is written with `skipAttribution` (no extra column; caller must pass it into facts). Product skip CTA may still map to CANCELLED without attribution until a later small persistence field.
- Coach cancel attribution likewise depends on caller facts, not a new DB enum.
- Weekly calendar still shows planned ISO days; only **today** is overlaid. Full week rewrite is Phase 10.
- Phase 7 volume engine is not auto-invoked on page load (same as Phase 7); continuity **feeds** it when called.

---

## AX. DEFERRED ITEMS

- Phase 9 regional response / goal intelligence
- Phase 10 program generator / validator
- Phase 11 notifications (only `effective_date` / `original_scheduled_date` prepared)
- Explicit client “reschedule to custom day” picker
- Side-specific logging (still deferred from Phase 5)

---

## AY. BLOCKERS / NEEDS_DECISION

None blocking Phase 8 QA. Optional later: persist `skip_attribution` on `workout_sessions` if product skip must survive a facts-only roundtrip without the client passing attribution.

---

## AZ. FINAL STATUS

**PHASE_8_IMPLEMENTED_READY_FOR_QA**

---

## CONTINUITY ACTION EXAMPLES (tested)

| Action | Inputs | Decision | Reason | Confidence |
|---|---|---|---|---|
| CONTINUE_SEQUENCE | A completed Mon; now Wed; 3-day | B next | NORMAL_SEQUENCE | HIGH |
| RESUME_SESSION | IN_PROGRESS 5h ago | same session id | ACTIVE_SESSION_RESUME | HIGH |
| ADVANCE_AFTER_PARTIAL | Primary+important sets done; optional 0 | B next | PARTIAL_PRIMARY_COMPLETE | HIGH |
| REPEAT_PRIORITY_SESSION | Optional done; primary 0 | stay A | PARTIAL_PRIMARY_MISSED | HIGH |
| RESCHEDULE_SESSION | A done; B window open/past; still B not C | B today | SESSION_RESCHEDULED or SESSION_MISSED | MODERATE |
| DEFER_SESSION | A done; recovery POOR | defer, no stack | RECOVERY_CONFLICT | HIGH |
| SWAP_SESSION_ORDER | Heavy glute yesterday; B glute HIGH; C upper available | C | LOCAL_FATIGUE_CONFLICT | — |
| ENTER_RECONDITIONING | ~24d absence, missed expected ≥2/3 | reconditioning + hold | RECONDITIONING_REQUIRED | HIGH if missed≥3 |
| RECALIBRATION_REQUIRED | long break + HIGH demand + history | flag true | via LONG_BREAK | — |
| SCHEDULE_REVIEW_REQUIRED | 5-day program, mostly incomplete / 3+ partials | review | CAPACITY or DURATION | — |
| INSUFFICIENT_DATA | pendingSync or no workout days | no miss | PENDING_SYNC / INSUFFICIENT_DATA | LOW |

---

## MISSED SESSION REPORT

**When:** expected sequence day + no working exposure + local window closed (`nowLocal > scheduled + permittedShiftDays`).  
**Not when:** midnight of scheduled day; pending offline writes; never-started program; coach cancel; user skip; UTC day roll while local is still previous evening.  
**User skip:** `USER_SKIPPED`, advances without debt.  
**Coach cancel:** `COACH_CANCELLED`, not client miss.  
**Reschedule:** same `program_day_id`, new `effective_date`.

---

## RECONDITIONING REPORT

Short break: continue sequence, hold progression, keep training level, keep experience.  
Long break: `ENTER_RECONDITIONING` + optional `recalibration_required`. Phase 4 recalibrates load; Phase 6 holds progression; Phase 7 `reconditioningActive` holds/reduces volume restoration. No 10/20/40% universal cut. Peak load/volume not blindly restored.

---

## FILES BY GROUP

### CONTINUITY ENGINE
- `src/lib/platform/continuity/types.ts` — contracts
- `src/lib/platform/continuity/engine.ts` — `getProgramContinuityDecision`
- `src/lib/platform/continuity/sequence.ts` — actual sequence
- `src/lib/platform/continuity/dates.ts` — timezone windows
- `src/lib/platform/continuity/reconditioning.ts` — absence class
- `src/lib/platform/continuity/explanations.ts` — Arabic copy
- `src/lib/platform/continuity/index.ts` — public API

### SESSION SCHEDULING / PROGRAM SEQUENCE
- `src/lib/platform/continuity/apply.ts` — overlay + runtime mapping
- `src/lib/platform/assigned-program-api.ts` — `day_id` / `programDayId` / `assignmentDayId`
- `src/lib/platform/weekly-workout-schedule.ts` — optional `programDayId`

### ADHERENCE
- Adherence counters on `ContinuityDecision.adherence` (engine)

### RECONDITIONING
- `reconditioning.ts` + engine `ENTER_RECONDITIONING`

### PHASE 4 INTEGRATION
- `src/hooks/useWorkoutPlayer.ts` — `prescriptionState`
- `src/routes/_platform/app/program/workout/exercise.tsx` — pass state

### PHASE 6 INTEGRATION
- `toProgressionRecoveryHold` → player `recoveryHold`

### PHASE 7 INTEGRATION
- `toVolumeContinuityInput` (consumed when volume engine is called)

### PROGRAM UI / YOUR DAY / WORKOUT RESUME
- `src/hooks/useProgramContinuity.ts`
- `src/routes/_platform/app/program/workout/index.tsx`
- `src/routes/_platform/app/index.tsx`
- `src/lib/platform/home-hub.ts` — resume CTA
- `src/components/platform/your-day/YourDayPage.tsx`
- `src/hooks/useTodayWorkout.ts` — `assignmentDayId`

### TIMEZONE / DATE UTILITIES
- Reuse `readiness.ts` `getLocalDateKey`; `continuity/dates.ts` windows

### DATABASE / RLS
- `supabase/tests/training_engine_v2_rls_test_plan.sql` — items 28–31  
- No new migration

### TYPES
- `today-workout.ts`, `workout-session.ts`, `training-v2-api.ts` session record fields

### TESTS
- `src/lib/platform/continuity/continuity-engine.test.ts`
- `package.json` test script

### DOCS
- this report; `docs/README.md`

### LEGACY COMPATIBILITY
- Free weekday preview untouched. Player `legacy_free` isolated. Continuity enabled only when assigned runtime `reason === "ok"`.

---

## ACCEPTANCE (handoff §180)

Sequence identity, no weekday-only logic, no midnight miss, no volume debt, no stacking, no nutrition/gamification, no level/goal auto-change, resume vs start, timezone local dates, Phase 9/10/11 not implemented, tests/build green — covered above.

Phase 9 was not started.
