# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 11/12 — PROGRESS UX + EXPLAINABILITY + OBSERVABILITY + NOTIFICATION INTEGRATION REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Status:** `PHASE_11_IMPLEMENTED_READY_FOR_QA`  
**Phase 12:** not started — do not begin without explicit approval.

---

## A. EXECUTIVE SUMMARY

Phase 11 turns existing adaptive engines (Phases 4–10) into a **client-understandable coaching experience** and an **auditable internal trail**. It does **not** create new prescription, progression, volume, continuity, regional, goal, or program-generation rules.

Clients now see on the existing `/app/progress` route: goal status, training performance, regional response (when provided), consistency, recovery/reconditioning, material adaptations, and a nutrition-review **signal** only.

Internal users can inspect structured traces (`engine / action / reason / confidence / source / program version`) without reading server logs. Notifications consume Phase 8 **effective session** state, not a static weekday.

**Final status:** `PHASE_11_IMPLEMENTED_READY_FOR_QA`

---

## B. EXISTING PROGRESS UX AUDIT

| Surface | Before Phase 11 | Phase 11 change |
|---|---|---|
| `/app/progress` (`src/routes/_platform/app/progress.tsx`) | Points, weekly commitment %, today activity, journey stats, measurements, photos, achievements | **Upgraded in place.** Training cards inserted after hero. No `/progress-v2`. |
| `buildProgressDashboard` (`src/lib/platform/progress-experience.ts`) | Workout count, meals, water, points | Kept as legacy-valid journey metrics. |
| Body measurements (`ProgressSections.tsx`) | “تطور القياسات”, empty keys shown as unrecorded | Relabeled **تكوين الجسم**, daily-weight disclaimer, hide unrecorded extra metrics (incl. body-fat unless recorded). |
| Admin client 360 progress tab | “نسبة الالتزام غير معتمدة” | Coach review-flag card via `getCoachTrainingOverview`. Same workspace, no second admin platform. |
| Home `/app/program` | Continuity overlay already live | `training_program_viewed` analytics once per mount. |
| Water reminders | In-app overlay, prefs-aware | Training reminder overlay added beside water; **not** hydration push. |

---

## C. PROGRESS DATA ARCHITECTURE

```
Phase 6 progression samples (optional)
Phase 7 volume/recovery decision (optional)
Phase 8 continuity decision (runtime + one recent-sessions query)
Phase 9 goal/regional decision (optional)
Phase 10 program change (optional)
Recent set rows (ONE query, limit 80)
        ↓
getClientTrainingProgressSummary()   // pure mapper
        ↓
TrainingProgressCards (client)
getCoachTrainingOverview (admin)
getTrainingNotificationContext (reminders)
```

UI does not call `evaluateGoalResponse`, `getNextSessionProgression`, `getWeeklyVolumeDecision`, or `generateTrainingProgram`.

---

## D. CLIENT PROGRESS SUMMARY CONTRACT

`getClientTrainingProgressSummary(input)` in `src/lib/platform/training-progress/summary.ts`

Output: `ClientTrainingProgressSummary` (`types.ts`):

- `goal_card` — title / short_reason / client_action / tone (`neutral|positive|caution`, not red/green)
- `exercise_trends` — max 4
- `regional_cards` — Goal-filtered
- `body_card` — optional, separate from training
- `consistency` — Phase 8 adherence facts
- `recovery` / `adaptations` / `nutrition_review`
- `review_flags` — internal; not rendered as engine JSON on client cards
- `load_error` / `empty`

Hook: `src/hooks/useTrainingProgressSummary.ts` (runtime + continuity + one set-summary query).

---

## E. GOAL STATUS PRESENTATION

Mapped in `mapGoalStatus` (`copy.ts`) from Phase 9 `GoalResponseState`.

| Internal | Client title (AR) |
|---|---|
| `INSUFFICIENT_DATA` | نحتاج المزيد من البيانات |
| `ON_TRACK` | تقدمك يسير في الاتجاه الصحيح |
| `PARTIAL_RESPONSE` / `REGIONAL_UNDER_RESPONSE` | قمنا بتعديل التركيز التدريبي |
| `ADHERENCE_LIMITED` | نحتاج انتظامًا أوضح قبل التقييم |
| `RECOVERY_LIMITED` | نحتاج إلى مزيد من التعافي |
| `NUTRITION_REVIEW_REQUIRED` | جانب التدريب يسير جيدًا |
| Empty new client | ابدأ أولى حصصك |

Raw reason codes are not shown. Tone is text + labels, not color-only (`TrainingProgressCards` uses titles).

---

## F. EXERCISE PROGRESS PRESENTATION

Phase 6 samples render load (`40 كجم → 45 كجم`), reps (`8 → 12 تكرار`), duration (`30 ث → 45 ث`), bodyweight reps (no `0 كجم`).

If only raw logs exist, `aggregateExerciseTrends` shows factual from→to with **`action: null`** — it does not invent `INCREASE_LOAD`.

---

## G. REGIONAL PROGRESS PRESENTATION

Only Goal-relevant regions (`goalSignals` in `copy.ts`). Copy is observed response, not genetics. Glute training-positive without measurements: body card says performance is good and body change is not confirmed.

---

## H. BODY-COMPOSITION PRESENTATION

Shown only when Goal profile expects it **and** data/review is relevant. Existing measurement card kept, visually separated, no body-fat estimate, no daily win/lose framing.

---

## I. ADHERENCE / CONSISTENCY PRESENTATION

Phase 8 `AdherenceMetrics`: “أكملت 8 من آخر 9 حصص.” Partial sessions counted as saved work. No “you owe workouts.” No “poor adherence” label.

---

## J. RECOVERY PRESENTATION

States, not fake %: hold / limited recovery copy from `mapVolumeAction("HOLD_VOLUME_PROGRESSION")`. No “Recovery = 83%”.

---

## K. RECONDITIONING PRESENTATION

`ENTER_RECONDITIONING` / volume `RECONDITIONING` → “عودة تدريجية” (`PROGRAM_COPY.RECONDITIONING` + continuity copy). Training level is not rewritten to Beginner.

---

## L. DELOAD PRESENTATION

`DELOAD_REVIEW` → “سنخفف الضغط التدريبي مؤقتًا لمساعدتك على استعادة الأداء.” Supportive, not punitive.

---

## M. PROGRAM ADAPTATION PRESENTATION

Material `programChange` → “تم تحديث خطتك” + canonical reason / reallocation copy. Minor KEEP decisions are not announced as program updates.

---

## N. CLIENT EXPLAINABILITY CONTRACT

Every mapped action yields `{ title, short_reason, client_action, optional_detail?, importance, date? }` from **one** copy module. Components only render the contract.

---

## O. REASON-CODE → COPY MAPPING

| Source | Mapper |
|---|---|
| Goal states | `mapGoalStatus` + `GOAL_COPY` (Phase 9) |
| Progression actions/reasons | `mapProgressionAction` + `explainProgression` (Phase 6) |
| Volume actions | `mapVolumeAction` |
| Continuity actions | `mapContinuityAction` + `CONTINUITY_COPY` (Phase 8) |
| Program/reallocation | `reallocationCopy` + `PROGRAM_COPY` (Phase 10) |

---

## P. PROGRAM CHANGE COMMUNICATION

Card pattern in `TrainingProgressCards` (“ما الذي تغيّر”). Reason from Phase 9 reallocation or Phase 10 `programChange.reason`. No JSON dump.

---

## Q. GOAL-SPECIFIC UX — GLUTE_GROWTH

Primary signals: glute-targeted performance, consistency, emphasis changes. Regions: GLUTES, QUADRICEPS support. Body card if measurements missing: training may improve without claiming confirmed growth. Reallocation Quad→Glute uses the approved Arabic explanation (concise in UI).

---

## R. GOAL-SPECIFIC UX — SLIM_TONED_WAIST

Core training vs waist/body-composition are separate cards. No “more abs = smaller waist.” No spot-reduction copy.

---

## S. GOAL-SPECIFIC UX — TONED_ARMS_UPPER_BODY

Regions: arms, shoulders, upper back. Slow arms vs fast shoulders → reallocation copy. No light-weight stereotype.

---

## T. GOAL-SPECIFIC UX — FEMININE_BALANCED_BODY

Lower / upper / core conceptually (GLUTES, UPPER_BACK, CORE). Emphasis rebalance without anatomy dump.

---

## U. GOAL-SPECIFIC UX — FAT_LOSS

Training: consistency + performance preservation. No workout calorie-burn charts. Body-composition review is a signal, not calorie instruction.

---

## V. GOAL-SPECIFIC UX — POSTURE_TONED_BACK

Back/pull performance copy includes “هذا ليس تصحيحاً طبياً للقوام.” No medical correction claim.

---

## W. INTERNAL DECISION OBSERVABILITY

`toDecisionTrace` (`observability.ts`) + existing table `public.adaptive_decision_logs` (Phase 2 migration `20260821120000_training_engine_v2_data_contracts.sql`).

Client cards never receive `input_summary`. `toClientSafeTrace` strips it.

---

## X. DECISION TRACE CONTRACT

Fields: `engine`, `engine_version`, `action`, `reason_code`, `confidence`, `object_type`, `object_id`, `source_session_id`, `program_version`, `input_summary`, visibility flags.

QA/coach: `qa_visible` / `coach_visible` true. Client: `client_visible` false.

---

## Y. ENGINE VERSION / PROGRAM VERSION TRACEABILITY

`ENGINE_VERSIONS` maps:

- progression → `getNextSessionProgression`
- volume → `getWeeklyVolumeDecision`
- continuity → `getProgramContinuityDecision`
- goal → `evaluateGoalResponse`
- program → `generateTrainingProgram:v2-phase10-1`
- progress UX → `v2-phase11-1`

Program-affecting traces accept `program_version` (assignment `template_version`).

---

## Z. COACH / ADMIN OBSERVABILITY

Extended `ClientTrainingWorkspace` progress tab (`src/components/admin/ClientTrainingWorkspace.tsx`): current program, last workout, review flags. Existing set-log table retained. No duplicate Admin Training Platform.

`ATTENTION_SIGNAL_CONTRACTS` adds `training_review_flags` LIVE source `getCoachTrainingOverview`.

---

## AA. REVIEW FLAGS

Queryable: `SAFETY_REVIEW_REQUIRED` (highest), `PROGRAM_REVIEW_REQUIRED`, `SCHEDULE_REVIEW_REQUIRED`, `NUTRITION_REVIEW_REQUIRED`, `COACH_REVIEW_REQUIRED`.

Rendering the card does **not** mark flags resolved (no auto-approval). No ticketing system.

---

## AB. QA OBSERVABILITY

Unit traces cover calibration, load ±/hold, volume add/reduce/reallocate, recovery hold, deload, reconditioning, reschedule, regional under-response, goal tradeoff, program regen/validation failure, legacy fallback. Developer tools are not mounted on client progress.

---

## AC. ANALYTICS EVENT MODEL

Reuse `hakim:analytics` (`TRAINING_ANALYTICS_EVENT`). Events in `TRAINING_ANALYTICS_EVENTS` (`analytics.ts`). Wired:

| Event | Where |
|---|---|
| `progress_viewed` | `useTrainingProgressSummary` once |
| `training_program_viewed` | `YourDayPage` once |
| `workout_started` / `workout_resumed` | `useWorkoutPlayer.persistSession` once |
| `workout_completed` / `workout_partial` | complete / finish-early |
| `set_sync_failed` | pending sync result |

Decision audit remains `adaptive_decision_logs` / traces — not these product events.

---

## AD. FALLBACK / ERROR ANALYTICS

Catalog includes `v2_fallback_legacy_prescription`, `insufficient_data`, `exercise_metadata_required`, `goal_mapping_required`, `program_generation_blocked`, `pending_shared_contract`. Operational errors reuse existing `console.warn` on RPCs plus `set_sync_failed`. No second error platform.

---

## AE. ENGINE HEALTH METRICS

`HEALTH_METRIC_CATALOG` (13 ids) documents **instrumentation capability** and source columns. **No fabricated production percentages.** Coverage of actual-reps / effort can be computed later from `workout_set_logs` in Phase 12.

---

## AF. NOTIFICATION ARCHITECTURE

No `notifications_v2`. In-app overlay `TrainingReminderOverlay` uses `getTrainingNotificationContext` + existing `workoutReminders` / `progressUpdates` prefs (`profile-settings-storage.ts`). Push delivery is gated; denial does not break training.

---

## AG. CONTINUITY-AWARE REMINDERS

Upcoming reminder only if `continuity.effective_date ===` Phase 8 local date (`getLocalDateKey`). Deep link `/app/program/workout`. Not original weekday assignment.

---

## AH. RESCHEDULE NOTIFICATIONS

`RESCHEDULE_SESSION` / `DEFER_SESSION` → copy: “تم تحديث موعد حصتك القادمة للحفاظ على ترتيب التدريب والتعافي.” `cancel_keys` include the original scheduled date upcoming key.

---

## AI. ACTIVE / RESUME SESSION NOTIFICATIONS

`RESUME_SESSION` or `resume_session_id` → “حصة قيد التنفيذ” / `/app/program/workout`. Not “start a new workout.”

---

## AJ. PROGRAM UPDATE NOTIFICATIONS

Only `materialProgramChange && progressUpdates`. KEEP/confidence ticks do not notify.

---

## AK. GOAL / PROGRESS NOTIFICATION POLICY

No “your glutes grew.” Performance language lives on Progress. Nutrition review is a Progress signal, not a calorie push.

---

## AL. NOTIFICATION DEDUPLICATION

`notificationDedupeKey(kind, dayId, localDate)` stored in `hakim:training-reminder-sent:v1`. Duplicate event with same key returns `null`. Completed `programDayId` suppresses reminder.

---

## AM. TIMEZONE HANDLING

`getLocalDateKey` / `getUserTimeZone` from Phase 8 readiness helpers. No raw UTC weekday scheduling.

---

## AN. NOTIFICATION PREFERENCES / PERMISSIONS

`workoutReminders` false → no upcoming reminder. `Notification.permission === "denied"` → `deliver_push: false`, `deliver_in_app: true`. Overlay skipped on `/program/workout` (in-session).

---

## AO. TRAINING ↔ NUTRITION UX BOUNDARY

`nutrition_review` copy: “هذا تنبيه للتنسيق مع خطة التغذية، وليس تعليمات سعرات أو وجبات.” `nutrition_contract_status` may be `PENDING_SHARED_CONTRACT`. No calories/macros/meals mutation.

---

## AP. PRIVACY / ANALYTICS DATA PROTECTION

`sanitizeAnalyticsProps` drops `email`, `name`, `full_name`, `phone`, `notes`, `health_notes`, and any key containing `email`/`note`. Decision `input_summary` is IDs/states only in traces.

---

## AQ. RLS / AUTHORIZATION

Existing policies on `adaptive_decision_logs`: own SELECT, admin SELECT, no client INSERT (`20260821120000_...sql`). Phase 11 plan additions: `supabase/tests/training_engine_v2_rls_test_plan.sql` items 32–36. Client summary API does not return internal snapshots.

---

## AR. MOBILE UX

Cards, RTL (`dir="rtl"` on shell), stacked layout, min-height 44px actions, no analytics grid. Progress page already `PlatformStack` mobile-first.

---

## AS. ACCESSIBILITY

Status via text titles/labels, not color-only. Section `aria-labelledby`. Loading `aria-busy`. Links/buttons have visible text. Charts not added (avoid unlabeled axes).

---

## AT. PERFORMANCE / QUERY ARCHITECTURE

Progress hook: training runtime (existing key), recent sessions (continuity), **one** `workout_set_logs` select limit 80. No per-exercise / per-region / per-decision UI queries. Lifetime history not loaded. Cache `staleTime: 60s`; session completion uses existing invalidation of runtime/session keys on next visit (not live subscriptions).

---

## AU. TESTS ADDED

`src/lib/platform/training-progress/training-progress.test.ts` wired in `package.json` `npm test`.

---

## AV. TEST RESULTS

Phase 11 file: **passed**. Full suite: **`npm test` exit 0** (Phases 1–11 including `training-progress phase 11 tests passed`). **`npm run build` exit 0** (`✓ built`, `[verify-vercel-build] OK`).

---

## AW. GOAL-SPECIFIC UX TEST MATRIX

See tests for all six `TRAINING_V2_CANONICAL_GOALS` display names + on-track copy cleanliness, plus GLUTE reallocation, WAIST split, ARMS reallocation, FAT_LOSS no calorie burn, POSTURE non-medical.

---

## AX. OBSERVABILITY TEST MATRIX

16 traces including CALIBRATION, INCREASE/DECREASE/HOLD, volume add/reduce/reallocate, recovery hold, deload, reconditioning, reschedule, regional under-response, goal tradeoff, program regen, validation failure, legacy fallback — each with engine version, program version, coach/QA visible, client `input_summary` stripped.

---

## AY. NOTIFICATION TEST MATRIX

Covered: upcoming, reschedule+cancel stale, duplicate, completed cancel, resume, permission denied, in-workout suppression, no-material spam.

---

## AZ. ANALYTICS TEST MATRIX

PII stripped; fallback + `progress_viewed` in catalog; player/progress/your-day emit once via refs.

---

## BA. LEGACY COMPATIBILITY

Existing journey/points/photos/weekly cards remain. Unrecorded V2 metrics → `INSUFFICIENT_DATA` / hidden cards. Factual old load/reps still display from set logs. Goal change uses current quiz/profile goal; historical set logs are not erased.

---

## BB. BUILD / TYPECHECK / LINT

**Gate:** `npm test` exit 0 + `npm run build` exit 0 (`✓ built`, `[verify-vercel-build] OK`). Full `tsc` still has pre-existing unrelated errors (not the product gate). IDE lint on touched files: clean.

---

## BC. FILES MODIFIED

See section 178 grouping below in this report (FILES MODIFIED REPORT).

---

## BD. DATABASE / MIGRATIONS IF ANY

**None new.** Reused `adaptive_decision_logs`, `workout_set_logs`, `workout_sessions`. Additive comments only on RLS test plan. No `progress_v2` / `notifications_v2` / `analytics_v2`.

---

## BE. OPEN GAPS

- Live Phase 9 `evaluateGoalResponse` is not auto-run on Progress (by design: consume canonical outputs when the caller has them). Until a persistence job writes goal decisions, client goal card often stays `INSUFFICIENT_DATA` even with workout history — honest, not fabricated.
- Coach view does not yet list `adaptive_decision_logs` rows (RLS allows admin SELECT; UI lists flags + existing set logs). Full log browser deferred if needed.
- Push channel is in-app overlay + `deliver_push` flag; no OS push scheduler exists in-product.

---

## BF. PENDING SHARED NUTRITION CONTRACTS

`PENDING_SHARED_CONTRACT` remains a status. Training Progress may show a nutrition-review **signal**. Nutrition Engine still owns advice. No blocking of Phase 11.

---

## BG. DEFERRED ITEMS FOR PHASE 12

Full V2 E2E regression, migration validation, multi-week simulations, weak-phone/network fail-safes, production percentages for health metrics, release gate, deployment. **Not done here.**

---

## BH. BLOCKERS / NEEDS_DECISION

None blocking Phase 11 QA. Optional later: persist Phase 9/10 decisions into `adaptive_decision_logs` from a service-role job so Progress can show ON_TRACK without the client recomputing engines.

---

## BI. FINAL STATUS

`PHASE_11_IMPLEMENTED_READY_FOR_QA`

---

## REQUIRED CLIENT UX MATRIX

| Scenario | Internal | Title | Short reason (concept) | Next action | Must not show |
|---|---|---|---|---|---|
| New client | empty | ابدأ أولى حصصك | سنبدأ بقياس تقدمك | افتح البرنامج | No progress / fake charts |
| Insufficient data | `INSUFFICIENT_DATA` | نحتاج المزيد من البيانات | حصص إضافية للقياس | أكمل الحصص | No progress |
| On track | `ON_TRACK` | الاتجاه الصحيح | GOAL_COPY.ON_TRACK | استمر | Genetic labels |
| Partial | `PARTIAL_RESPONSE` | تعديل التركيز | جزء يتقدم | التركيز أوضح قادمًا | فشلت |
| Recovery limited | `RECOVERY_LIMITED` | مزيد من التعافي | نثبت الحمل | لا رفع أوزان | Goal failed |
| Adherence limited | `ADHERENCE_LIMITED` | انتظام أوضح | حصص غير كافية للتقييم | افتح البرنامج | You owe / poor adherence |
| Reallocation | `REALLOCATE_TRAINING_EMPHASIS` | تعديل التركيز | Quad→Glute or Shoulder→Arm copy | الحصص القادمة | Coefficients |
| Deload | `DELOAD_REVIEW` | تخفيف مؤقت | استعادة الأداء | اتبع الحصص المخففة | Punishment |
| Reconditioning | `ENTER_RECONDITIONING` | عودة تدريجية | من الأداء الحالي | ابدأ الحصة الحالية | Beginner / % loss |
| Load increase | `INCREASE_LOAD` | تقدم في الأداء | TOP_RANGE_MASTERED copy | الوصفة في الحصة القادمة | Shame |
| Load hold | `KEEP_LOAD` | نثبت الأداء | حتى يثبت سقف التكرارات | الحفاظ خطوة صحيحة | No progress |
| Load decrease | `DECREASE_LOAD` | عدّلنا الحمل | ضبط لا تراجع | ليس تراجعًا | Lost progress |
| Program change | material diff | تم تحديث خطتك | canonical reason | التركيز المحدّث | Silent JSON |
| Nutrition review | `NUTRITION_REVIEW_REQUIRED` | التدريب يسير جيدًا | مراجعة تغذية منفصلة | ليست تعليمات سعرات | خفض 200 سعرة |
| Body data required | `body_composition_data_required` | تدريب + تكوين الجسم منفصل | نحتاج بيانات جسم | لا ادّعاء تضخّم مؤكد | Confirmed growth |

---

## REQUIRED GOAL UX MATRIX

| GOAL_ID | Primary signals | Regional display | Body-comp | Positive copy | Review copy | Forbidden |
|---|---|---|---|---|---|---|
| GLUTE_GROWTH | Hip-extension performance, consistency, emphasis | GLUTES + QUADS support | Trend if valid; else “أداء جيد بلا تأكيد جسدي” | الأداء في تمارين المؤخرة يتحسن | أعدنا توزيع التركيز للمؤخرة | Genetically slow / confirmed growth from training only |
| SLIM_TONED_WAIST | Core strength/stability | CORE | Waist trend independent | قوة وثبات الجذع يتحسنان | تغير الخصر يحتاج بيانات | Spot reduction / abs = smaller waist |
| TONED_ARMS_UPPER_BODY | Arm/shoulder/upper-back performance | BICEPS TRICEPS SHOULDERS UPPER_BACK | Optional | أداء الذراعين يتحسن | تركيز أعلى على الذراعين | Light-weight stereotype |
| FEMININE_BALANCED_BODY | Balanced lower/upper/core | GLUTES UPPER_BACK CORE | If valid | توازن التركيز | أعدنا التوزيع | Anatomy dump |
| FAT_LOSS | Consistency + strength preservation | none required | Trend if valid | أداء المقاومة يُحفظ | مراجعة تكوين الجسم | Workout calories |
| POSTURE_TONED_BACK | Pull/back/core control | UPPER_BACK LATS CORE | No | أداء السحب يتحسن | — | Medical posture correction |

---

## REQUIRED OBSERVABILITY MATRIX

All rows: QA+coach visible, client does not get `input_summary`. Confidence `MODERATE` in tests. Program version `3` when supplied.

| Action | Source engine | Reason (test) | Object | Client vis. |
|---|---|---|---|---|
| CALIBRATION_REQUIRED | progression | INSUFFICIENT_HISTORY | exercise | false |
| INCREASE_LOAD | progression | TOP_RANGE_MASTERED | exercise | false |
| DECREASE_LOAD | progression | NEW_LOAD_NOT_TOLERATED | exercise | false |
| HOLD_PROGRESSION | progression | RECOVERY_HOLD | exercise | false |
| ADD_SMALL_VOLUME | volume | RECOVERY_CAPACITY_AVAILABLE | program | false |
| REDUCE_VOLUME | volume | RECOVERY_LIMITED | program | false |
| REALLOCATE_VOLUME | volume | VOLUME_REALLOCATION_PREFERRED | program | false |
| RECOVERY_HOLD | volume HOLD | RECOVERY_LIMITED | program | false |
| DELOAD_REVIEW | volume | DELOAD_PATTERN_DETECTED | program | false |
| RECONDITIONING | volume | RECONDITIONING_ACTIVE | program | false |
| RESCHEDULE_SESSION | continuity | SESSION_RESCHEDULED | session | false |
| REGIONAL_UNDER_RESPONSE | goal | REGIONAL_PROGRESS_SLOW | region | false |
| GOAL_TRADEOFF | goal | GOAL_TRADEOFF_DETECTED | goal | false |
| PROGRAM_REGENERATION | program | GOAL_REALLOCATION | program | false |
| PROGRAM_VALIDATION_FAILURE | program | INVALID | program | false |
| LEGACY_FALLBACK | progress | LEGACY_FALLBACK | session | false |

---

## REQUIRED NOTIFICATION MATRIX

| Scenario | Source | Notification | Deep link | Dedupe key | Cancel/update |
|---|---|---|---|---|---|
| Upcoming | CONTINUE_SEQUENCE today | حصة اليوم | `/app/program/workout` | `training:UPCOMING_SESSION:{day}:{date}` | — |
| Rescheduled B Wed→Thu | RESCHEDULE_SESSION | موعد محدّث | `/app/program` | kind+day+effective Thu | cancel upcoming Wed |
| Resume | RESUME_SESSION | قيد التنفيذ | `/app/program/workout` | RESUME key | not “start new” |
| Completed before reminder | completedProgramDayIds | none | — | — | suppressed |
| Missed continuity | DEFER/MISSED | ترتيب الحصص | `/app/program` | MISSED key | non-punitive |
| Reconditioning | ENTER_RECONDITIONING | عودة تدريجية | `/app/program` | RECONDITIONING key | no % loss |
| Material program | flag | تم تحديث خطتك | `/app/program` | MATERIAL key | no KEEP spam |
| Permission denied | same upcoming | in-app only | workout | same | push false |
| Duplicate | same reschedule twice | second null | — | identical key | one logical |
| Timezone | getLocalDateKey | uses local date | — | includes local date | no UTC shift |
| In-workout | inWorkout true | none | — | — | no hydration push |

---

## REQUIRED ENGINE HEALTH REPORT

Capability only (not production %):

| Metric | Source |
|---|---|
| V2 session usage | `workout_sessions.status` |
| Actual-reps coverage | `workout_set_logs.actual_reps` |
| Effort coverage | `workout_set_logs.effort_v2` |
| V2-eligible exercises | `exercises.v2_metadata_status` |
| Insufficient-data / fallback | decision logs + analytics events |
| Progression / volume / recovery-hold rates | engine actions |
| Program validation/block | Phase 10 generator/validator |
| Set sync failure | `set_sync_failed` |
| Continuity reschedule | `RESCHEDULE_SESSION` |

---

## FILES MODIFIED REPORT

### PROGRESS UX
- `src/routes/_platform/app/progress.tsx` — mount training cards on existing route
- `src/components/platform/progress/TrainingProgressCards.tsx` — client cards
- `src/components/platform/progress/ProgressSections.tsx` — body-comp separation, hide empty metrics
- `src/hooks/useTrainingProgressSummary.ts` — aggregated summary hook

### GOAL STATUS / EXERCISE / REGIONAL / BODY / ADHERENCE / PROGRAM CHANGE / RECONDITIONING / DELOAD / COPY
- `src/lib/platform/training-progress/copy.ts`
- `src/lib/platform/training-progress/summary.ts`
- `src/lib/platform/training-progress/types.ts`
- `src/lib/platform/training-progress/trends.ts`

### CLIENT EXPLAINABILITY / INTERNAL OBSERVABILITY / COACH
- `src/lib/platform/training-progress/observability.ts`
- `src/components/admin/ClientTrainingWorkspace.tsx`
- `src/lib/admin/admin-architecture.ts`

### ANALYTICS
- `src/lib/platform/training-progress/analytics.ts`
- `src/hooks/useWorkoutPlayer.ts`
- `src/components/platform/your-day/YourDayPage.tsx`

### NOTIFICATIONS / REMINDERS
- `src/lib/platform/training-progress/notifications.ts`
- `src/components/platform/workout/TrainingReminderOverlay.tsx`
- `src/components/platform/layout/PlatformShell.tsx`

### API / SERVICES
- `src/lib/platform/training-v2-api.ts` — `listOwnRecentWorkingSetSummaries`
- `src/lib/platform/training-progress/index.ts`

### DATABASE / RLS
- `supabase/tests/training_engine_v2_rls_test_plan.sql` — Phase 11 cases (no schema change)

### TESTS / DOCS / PACKAGE
- `src/lib/platform/training-progress/training-progress.test.ts`
- `package.json`
- `docs/README.md`
- `docs/GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_11_REPORT.md`
- `docs/GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_10_REPORT.md` (pointer only)

### LEGACY COMPATIBILITY
- Existing progress dashboard modules unchanged in behavior except body-comp labeling/filtering.

---

Phase 12 is **not** started.
