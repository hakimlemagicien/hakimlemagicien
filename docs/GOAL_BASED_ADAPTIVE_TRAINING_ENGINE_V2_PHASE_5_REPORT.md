# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 5/12 — WORKOUT RUNTIME & INTERACTION V2 REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Final status:** `PHASE_5_IMPLEMENTED_READY_FOR_QA`  
**Phase 6:** not started.

---

## A. EXECUTIVE SUMMARY

Phase 5 upgrades the **existing Workout Player** so the Phase 4 prescription becomes operational evidence: prescribed vs actual load/reps/duration, V2 effort, skip vs complete, wall-clock rest, calibration next-set, session persistence, pending sync, audio cues, and a non-blocking hydration reminder.

No parallel player, session table, set-log store, timer engine, or prescription engine.

Paid assigned workouts use `runtimeMode: "v2"`. Free preview uses isolated `legacy_free` (still has +10%).

**Session start rule:** canonical `workout_session` is created/resumed on **first actual set start** (`beginSet`), not on page load.

## B. EXISTING WORKOUT PLAYER AUDIT

| Area | Before | After |
|------|--------|--------|
| Route | `/app/program/workout/exercise` | same route, options passed in |
| Hook | `useWorkoutPlayer` +10% + localStorage authority | V2 path + DB session |
| Set log | legacy `weight_kg`/`reps`/`effort` only | V2 columns + upsert identity |
| Timer | `remainingSeconds--` interval | wall-clock timestamps |
| Effort | easy/medium/hard | V2 four-state on paid path |
| Complete | plan calories/points | factual sets/duration (V2) |

## C. RUNTIME ARCHITECTURE

UI → `useWorkoutPlayer` → domain (`workout-runtime/*`, `prescription/*`, `training-v2-api`) → `workout_sessions` / `workout_set_logs`.

Timer display lives in `SetLogBottomSheet` `RestTimer` (250ms local tick). Parent stores `rest_started_at` / `rest_target_end_at` only.

## D. WORKOUT SESSION INTEGRATION

`ensureWorkoutSession` (`client_ensure_workout_session`) on first `beginSet`.  
`getActiveWorkoutSession` on mount to resume matching `session_key`.  
Status: IN_PROGRESS on ensure; COMPLETED / PARTIALLY_COMPLETED on finish.

## E. SESSION IDEMPOTENCY

Phase 2 unique `(user_id, session_key)`. `session_key` = `YYYY-MM-DD::assignmentOrExternalIds`. Refresh/retry/double tap reuse the same key. Distinct days/keys remain separate attempts.

## F. PRESCRIPTION DISPLAY

Set sheet shows set number, working-set label, target reps or duration, recommended rest. Load hidden when calibration / bodyweight / timed. No fake kg.

## G. ACTUAL LOAD CAPTURE

Editable stepper. Prefill only from recent actual or known `RECENT_HISTORY`. Bodyweight without added load → `actual_load = NULL`. kg only (no lb conversion).

## H. ACTUAL REPS CAPTURE

Prefill is not fact. Client confirms `setDraft.reps` before save. Stored as `actual_reps` separately from `prescribed_reps_min/max`.

## I. ACTUAL DURATION CAPTURE

Timed mode: duration stepper, `actual_duration_seconds`, no fake reps.

## J. EFFORT FEEDBACK

Working sets: EASY / IDEAL / VERY_HARD / FAILURE with Arabic labels. No numeric RIR. Warm-up effort not required (assigned sets remain WORKING). Skip does not require effort. FAILURE is a neutral result.

## K. WARM-UP / WORKING SET UX

Assigned snapshot set count is SoT (coach structure preserved). Logged `set_type = WORKING`. Engine warmup count is not injected as extra volume.

## L. CALIBRATION RUNTIME

After a calibration set, UI calls `getCalibrationAdjustment` (Phase 4). KEEP / SMALL_INCREASE / REDUCE / RECALIBRATE / SAFETY_REVIEW. Next load uses 2.5 kg stepper increment when known — never ×1.10.

## M. +10% LEGACY RULE REMOVAL/ISOLATION

V2 player does not call `getSetProgression` for next load.  
`getSetProgression` / `SET_WEIGHT_INCREMENT` remain for `legacy_free` only (`exercise.tsx` when `!hasWorkoutProgram`). UI copy “+10%” is gated on `runtimeMode !== "v2"`.

## N. SET COMPLETION / SKIP

Complete: `set_completed=true`, `skipped=false`. Skip: opposite. Double-tap guarded by `savingRef`. Skip still advances position; skipped rows are excluded from working-volume counts.

## O. WALL-CLOCK REST TIMER

`createWallClockRest` → remaining = target_end − now. Visibility/focus recalculates. Refresh restores `rest` from localStorage cache. No 1 Hz DB writes.

## P. ACTUAL REST TRACKING

On rest end / early start: `actual_rest_seconds = elapsed wall clock` (not capped to prescribed). Written onto the previous set log.

## Q. AUDIO CUE SYSTEM

Original synthesized WAVs (not commercial):

| Asset | Path | Purpose | Size |
|-------|------|---------|------|
| T-15 | `public/audio/workout/t15.wav` | 15s warning | ~8 KB |
| 3 | `public/audio/workout/count-3.wav` | countdown | ~5 KB |
| 2 | `public/audio/workout/count-2.wav` | countdown | ~5 KB |
| 1 | `public/audio/workout/count-1.wav` | countdown | ~5 KB |
| START | `public/audio/workout/start.wav` | rest complete | ~11 KB |

Cues fire once per rest via `pendingRestCues`. After expiry, only START. Respects `profile-settings` `appSounds`. Timer works muted. Haptic optional (`app.haptics` + `vibrate`).

## R. HYDRATION REMINDER

Cadence: 15 minutes elapsed **or** 6 working sets, **only during rest**, dismissible, session-deduped via `hydrationLastShownAt`. Copy: «وقت لشرب بعض الماء 💧». Not medical.

## S. SESSION RESUME

Matching active DB session + `listOwnSetLogsForDate` merge (pending local wins on same identity) + localStorage v3 cache for position/rest.

## T. LOCALSTORAGE → DB MIGRATION

| Key | Classification |
|-----|----------------|
| `hakim:today-workout-session:v2` | CACHE_ONLY + rest/UI resume (version 3 payload). DB is canonical for sets/session. |
| `hakim:today-workout-progress:v1` (sessionStorage) | LEGACY_ONLY, still migrated then ignored. |
| `hakim:workout-pending-sets:v1` | OFFLINE QUEUE until upsert succeeds. |
| `hakim.profile.settings.v1` | UI_ONLY sound/haptics. |
| `hakim_water_sounds` | unrelated water feature, unchanged. |

localStorage is no longer the only completion authority (`updateWorkoutSessionStatus` + set-log upsert).

## U. OFFLINE/PENDING WRITE STRATEGY

Failed upsert → enqueue by `date::external_id::setNumber` → status `PENDING_SYNC` → copy «سيتم حفظ النتيجة عند عودة الاتصال» → `online` event flushes. Conflict: pending overlay wins over DB for that identity (last client-confirmed edit). Idempotent upsert on Phase 2 unique key.

## V. RESULT EDITING

«تعديل آخر مجموعة» reopens the last log for the current exercise and upserts the same identity. Prescribed fields are not edited by the client.

## W. SUBSTITUTION SUPPORT

**Deferred.** No substitution picker. Skip set / jump exercise remain. Do not transfer load across exercises. Documented for a later UX pass.

## X. SAFETY SIGNAL SUPPORT

Checkbox «شعرت بألم أو تنفيذ غير آمن» → `client_training_safety_signals` insert + calibration `SAFETY_REVIEW`. Separate from FAILURE. No diagnosis.

## Y. MOBILE UX

Existing mobile layout kept. Effort 2×2 min-h-11. Steppers 44px. Finish/edit actions above nav. No new horizontal overflow.

## Z. ACCESSIBILITY

Countdown also visual (`aria-live`). Effort is labeled text, not color-only. Sound not required. Buttons have aria-labels.

## AA. PERFORMANCE

Rest tick is isolated in `RestTimer` (one 250ms interval + visibility/focus listeners, cleaned on unmount). Player tree does not decrement every second. Audio preloaded after first interaction. No DB write per tick.

## AB. RLS / SECURITY

No new policies. Client still uses own-session RPC + own set-log upsert. `workout_session_id` is attached after ensure; RLS remains server-side. Client cannot write training level / metadata / engine rules.

## AC. LEGACY FALLBACK

If V2 metadata/goal/location is insufficient, Phase 4 returns fallback/legacy assigned fields; player still uses snapshot sets/reps/rest. Free preview remains `legacy_free`.

## AD. TESTS ADDED

`src/lib/platform/workout-runtime/workout-runtime.test.ts` (wired in `npm test`). Phase 1–4 tests updated only where Phase 5 replaced “until phase 5” assertions.

## AE. TEST RESULTS

`npm test` passed including workout-runtime, prescription, exercise-library, training-v2-contracts.

## AF. MOBILE TEST RESULTS

Code-level: tap targets, no RIR, timer readable, effort 4 buttons. Live-device matrix is QA (not automated here).

## AG. BUILD / TYPECHECK / LINT RESULT

- `npm test`: passed (Phases 1–5)
- `npm run build`: passed
- Full `tsc` is not the product gate

## AH. FILES MODIFIED

See grouped list in the implementation report body (runtime, session, set logs, calibration, timer, audio, hydration, offline, tests, docs, legacy isolation).

## AI. OPEN GAPS

- SIDE_SPECIFIC_LOGGING_DEFERRED (unilateral L/R)
- Substitution UI deferred
- Goal id not auto-fetched from training profile (assigned fallback used)
- Device clock vs server timestamp: display uses client clock; persisted `completed_at` is client ISO then DB `now()` on session complete
- INTERRUPTED not used for backgrounding (Phase 8)

## AJ. DEFERRED ITEMS FOR PHASE 6+

Double progression, next-session load, plateau, weekly volume, recovery, missed sessions, regional response, program generator, nutrition, push notifications, voice coach.

## AK. BLOCKERS / NEEDS_DECISION

None blocking QA. Optional: whether assigned coach `suggested_weight_kg` should prefill calibration (currently not, to avoid fake baseline).

## AL. FINAL STATUS

**PHASE_5_IMPLEMENTED_READY_FOR_QA**
