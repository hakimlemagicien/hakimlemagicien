# MAAKFIT SMART PROGRESSION V1 — IMPLEMENTATION REPORT

**Date:** 2026-09-05  
**Environment:** LOCAL ONLY  
**Staging deploy:** not performed  
**Production deploy:** not performed  
**Main merge:** not performed

This document records what was implemented in the local repository. It is not a proposal.

---

## 1. EXECUTIVE SUMMARY

Program Source and Progression Strategy are now separate on the **client assignment**.

Admin → Client 360 → Training shows:

- Program Source (Strategy Matrix / Program Template / Coach Custom)
- Progression Strategy (Smart Locked / Matrix Managed / Coach Managed)

Smart Progression — Exercise Locked reuses the existing Training Engine (`getNextSessionProgression`) for load/reps. It never auto-replaces exercise identity. Variation/plateau/recovery/safety become coach reviews. Coach Managed shows data and does not auto-apply. Matrix Managed keeps the current engine path.

Client runtime reads `assignment.progression_strategy` and applies the same lock. The client app cannot change the strategy.

---

## 2. EXISTING COMPONENTS REUSED

| Area | Reuse |
|------|--------|
| `src/lib/platform/progression/` | KEEP — `getNextSessionProgression`, `applyProgressionToLoad`, reason codes, explanations |
| `excludeCurrentSession` | KEEP — active workout snapshot |
| `client_program_assignments` | EXTEND — strategy/status/state columns on assignment, not template |
| `_assignment_tree` / `to_jsonb(a)` | KEEP — new columns auto-flow into admin detail + client runtime |
| `admin_save_client_assignment_exercises` | KEEP — stale_update, client-only edit, exercise replace |
| `AdminExercisePicker` | KEEP — coach replace workflow |
| Coach Override | KEEP — no second override engine |
| `admin_record_adaptive_decision` + `audit_events` | KEEP / EXTEND event names |
| `buildClientAttentionAlerts` | EXTEND — training review alert |
| Strategy Matrix / V2 orchestrator | KEEP — Matrix Managed path |
| Core 100 / session muscle presentation | UNTOUCHED |
| Nutrition / membership / client goal | UNTOUCHED |

No second Training Engine. No second Strategy Matrix. No invented RIR/RPE/recovery science.

---

## 3. FILES CHANGED

### Created

- `src/lib/platform/progression-strategy/` (`types`, `labels`, `scope`, `parse`, `apply`, `evaluate`, `reviews`, `audit`, `index`, tests)
- `src/lib/admin/admin-progression-strategy-api.ts`
- `src/components/admin/ClientProgressionStrategyCard.tsx`
- `supabase/migrations/20260905150000_admin_client_progression_strategy.sql`
- `docs/MAAKFIT_SMART_PROGRESSION_V1_IMPLEMENTATION_REPORT.md`

### Modified

- `src/components/admin/ClientTrainingWorkspace.tsx`
- `src/lib/admin/admin-client-training-api.ts`
- `src/lib/admin/admin-client-training.test.ts`
- `src/lib/admin/admin-client-ops.ts`
- `src/lib/admin/admin-clients-api.ts`
- `src/lib/platform/assigned-program-api.ts`
- `src/hooks/useWorkoutPlayer.ts`
- `src/routes/_platform/app/program/workout/exercise.tsx`
- `src/components/platform/workout/ExercisePlayerView.tsx`
- `src/integrations/supabase/types.ts`
- `src/styles.css`
- `package.json`

---

## 4. DATA MODEL CHANGES

Assignment is the source of truth. Template catalog is not given a progression field.

`client_program_assignments` (local migration only):

| Column | Default | Meaning |
|--------|---------|---------|
| `progression_strategy` | `MATRIX_MANAGED_PROGRESSION` | How this client progresses |
| `progression_status` | `WAITING_FOR_DATA` | ACTIVE / WAITING_FOR_DATA / REVIEW_REQUIRED / PAUSED |
| `last_progression_evaluation_at` | null | Last stored evaluation time |
| `progression_state` | `{}` | Reviews, kept decisions, snapshot — not workout history |

Existing assignments default to **Matrix Managed** so current auto-progression is preserved.

RPCs:

- `admin_set_client_progression_strategy` — authorized strategy write + `audit_events` + stale check
- `admin_resolve_progression_review` — coach keep, records reason, does not re-open the same signal
- `admin_get_client_overview` — assignment payload now includes `progression_status` / `progression_strategy`

---

## 5. ADMIN UI IMPLEMENTED

Path: Admin → Clients → Client 360 → Training

After Current Program Summary:

1. **استراتيجية التطور** card — current strategy, Arabic description, automation scope, status, last evaluation
2. **تغيير استراتيجية التطور** picker — three Arabic options, reason required
3. **مراجعات المدرب** — keep / review / replace
4. **سجل التطور** — previous load → next load + reason, no raw JSON
5. Template assign preview includes strategy selection before activate

Empty / status copy:

- No program: «لا يوجد برنامج تدريبي نشط لهذا العميل.»
- No data: «بانتظار بيانات الأداء»
- No reviews: «لا توجد مراجعات مطلوبة حاليًا.»
- Coach managed: «يدير المدرب تطور البرنامج يدويًا.»
- Smart active: «التطور الذكي نشط.»

Loading waits for assignment data. Default is not flashed as Smart.

---

## 6. PROGRESSION STRATEGIES IMPLEMENTED

| Canonical | Arabic | Auto load/reps | Auto exercise replace |
|-----------|--------|----------------|------------------------|
| `SMART_PROGRESSION_EXERCISE_LOCKED` | التطور الذكي — التمارين ثابتة | Yes, via existing engine | Forbidden → review |
| `MATRIX_MANAGED_PROGRESSION` | تطور Strategy Matrix | Yes, current engine | Existing engine only; safety still reviews |
| `COACH_MANAGED` | إدارة المدرب | No | No |

Automation scope (derived, not independent toggles):

- Smart / Matrix: load AUTO, reps AUTO, sets COACH, rest COACH, exercises COACH ONLY
- Coach Managed: all COACH

Sets and rest are not advertised as AUTO because the current engine does not auto-write them.

---

## 7. EXERCISE LOCK IMPLEMENTATION

`lockExerciseIdentity` converts `PROGRESS_VARIATION` / `REGRESS_VARIATION` to `KEEP_LOAD`.

`applyAllowedPrescription` never changes `exercise_id`, `exercise_external_id`, `sets`, or `rest_seconds`.

`assertExerciseIdentityPreserved` is covered by focused tests.

Coach replace still uses the existing picker + save RPC + compatibility/safety already in the editor.

---

## 8. COACH REVIEW WORKFLOW

When Smart Locked would change exercise identity, or plateau/recovery/safety fires:

1. System opens `EXERCISE_REVIEW_RECOMMENDED` (or the engine reason)
2. Admin card shows the exercise, last available metrics, Arabic reason
3. **الإبقاء عليه** → `admin_resolve_progression_review` stores kept + original reason; same signal does not re-nag
4. **تغيير التمرين** → existing `AdminExercisePicker` on the client snapshot
5. **مراجعة** → opens the client editor on that exercise

No medical diagnosis. No invented injury from missed reps.

---

## 9. PROGRESSION ENGINE INTEGRATION

`evaluateAssignmentProgression` wraps `getNextSessionProgression` only.

Runtime (`useWorkoutPlayer`):

```
raw = getNextSessionProgression(...)
effective = progressionForRuntime(strategy, raw)
```

- Coach Managed → `null` (no auto apply)
- Smart Locked → identity lock, then existing load/rep apply
- Matrix Managed → existing engine result

No-data → `WAITING_FOR_DATA`, no invented increase.

Missed sessions are not given a new penalty. Adherence stays on existing continuity/recovery signals only.

---

## 10. ASSIGNMENT / VERSIONING INTEGRATION

- Strategy lives on the assignment, not the template. Two clients can share a template and differ in strategy.
- Historical `workout_set_logs` are read-only inputs.
- Active session uses `excludeCurrentSession` so in-progress work is not rewritten.
- Coach save still uses `p_expected_updated_at`. Stale write shows: «تم تحديث البرنامج منذ فتح هذه الصفحة. راجع أحدث نسخة قبل الحفظ.»
- Next prescription for the client is produced by the existing runtime engine against the assignment snapshot. This task does **not** add a second writer that mutates assignment exercise rows in batch.

Program source identity is unchanged by strategy (`PROGRAM_TEMPLATE` stays template; Matrix stays Matrix).

---

## 11. SAFETY INTEGRATION

`SAFETY_REVIEW` / `prescriptionState === SAFETY_REVIEW` → blocked (`PAUSED`). No Continue Anyway.

Hard safety remains above progression. Coach Override workflow is unchanged and still audited.

---

## 12. AUDIT / CONCURRENCY

| Who | What |
|-----|------|
| COACH | strategy change — before/after/reason in `audit_events` + `adaptive_decision_logs` |
| COACH | keep exercise |
| SYSTEM path | existing progression reason codes on runtime decisions |

`stale_update` is reused on strategy, keep, and assignment exercise save.

---

## 13. CLIENT RUNTIME IMPACT

- Runtime assignment now carries `progression_strategy`.
- Workout player consumes it. Client cannot set it.
- Client still sees current prescription (sets / reps / load / rest).
- If prescribed load moved vs assigned snapshot, the player may show «تم تحديث هدفك للجلسة القادمة».
- No engine enums, matrix scores, or admin review state in the client UI.

---

## 14. LOCAL MIGRATIONS CREATED

`supabase/migrations/20260905150000_admin_client_progression_strategy.sql`

**Not applied** to Staging. **Not applied** to Production. **Not applied** automatically to local Supabase from this task.

Until applied, strategy RPCs return a function-missing error and the card shows «تعذر حفظ استراتيجية التطور…». Matrix default still parses on missing columns as Matrix Managed.

---

## 15. FOCUSED TESTS

`src/lib/platform/progression-strategy/progression-strategy.test.ts` covers TEST 01–20:

01 select Smart Locked  
02 persist per assignment  
03 same template, different clients  
04 allowed field via existing rules  
05 exercise id locked  
06 auto replace → keep/review  
07 coach sees review  
08 coach keep  
09 replace uses existing picker (workflow assertion)  
10 Coach Managed no auto write  
11 no-data waiting  
12 hard safety blocked  
13 no extra training days  
14 template master untouched  
15 historical logs not mutated  
16 active snapshot excluded  
17 stale write detected  
18 audit who/before/after/reason  
19 RTL/Arabic UI, no raw Smart enum in the card  
20 client still reads latest valid prescription  

Also: `admin-client-training.test.ts` (card wired), `admin-a4.test.ts` (attention helpers still pass).

**Result:** PASS

---

## 16. REGRESSION RESULTS

Focused only (not a full suite / not a production build):

- Admin training workspace still contains Strategy Matrix + Program Template assign paths
- Coach Override still present
- Attention builder still constructs existing coaching/membership alerts
- Progression engine is wrapped, not replaced
- Weekly calendar / Core 100 / session muscle files were not redesigned in this task

---

## 17. KNOWN ISSUES

1. Local/Staging/Production databases do not have the new columns/RPCs until the migration is applied by a later authorized step.
2. Admin UI was verified on Client 360 → Training (Hakim): Program Source and Progression Strategy render separately; Matrix Managed is the default for the existing assignment; the Arabic picker opens with all three options and save stays disabled until a reason is entered. Strategy was **not** saved in that session (live admin data).
3. Sets and rest remain coach-owned because the current progression engine does not auto-write them.
4. Durable batch rewrite of assignment exercise rows is not added; next load/reps continue to come from the existing workout runtime + logs.
5. `HAKIM_TASK_ROUTING_AND_HANDOFF_PROTOCOL.md` is not in this repository.

NONE of these block the local code implementation.

---

## 18. STAGING REQUIREMENTS IF ANY

STAGING_REQUIRED: **YES — FOR FUTURE BACKEND VERIFICATION**

Apply `20260905150000_admin_client_progression_strategy.sql` on Staging, then verify:

1. Change strategy persists on the assignment
2. Keep review writes `progression_state`
3. Overview attention shows «مراجعة تدريب» when `progression_status = REVIEW_REQUIRED`
4. Client runtime receives `progression_strategy`
5. Template master unchanged after client Smart progression

STAGING_DEPLOY: **NOT_EXECUTED**

---

## 19. FINAL STATUS

```
EXECUTION_ENVIRONMENT:
LOCAL

STAGING_REQUIRED:
YES — FOR FUTURE BACKEND VERIFICATION

STAGING_DEPLOY:
NOT_EXECUTED

PRODUCTION_REQUIRED:
NO

PRODUCTION_DEPLOY:
NOT_AUTHORIZED

FILES_CHANGED:
src/lib/platform/progression-strategy/*
src/lib/admin/admin-progression-strategy-api.ts
src/components/admin/ClientProgressionStrategyCard.tsx
src/components/admin/ClientTrainingWorkspace.tsx
src/lib/admin/admin-client-training-api.ts
src/lib/admin/admin-client-training.test.ts
src/lib/admin/admin-client-ops.ts
src/lib/admin/admin-clients-api.ts
src/lib/platform/assigned-program-api.ts
src/hooks/useWorkoutPlayer.ts
src/routes/_platform/app/program/workout/exercise.tsx
src/components/platform/workout/ExercisePlayerView.tsx
src/integrations/supabase/types.ts
src/styles.css
package.json
supabase/migrations/20260905150000_admin_client_progression_strategy.sql
docs/MAAKFIT_SMART_PROGRESSION_V1_IMPLEMENTATION_REPORT.md

TEST_RESULT:
PASS

BUILD_RESULT:
NOT_REQUIRED

KNOWN_ISSUES:
1. Migration not applied (local/staging/production)
2. Strategy save was not executed against the open Admin session (labeled PRODUCTION in the shell). Persistence still requires applying the local migration on a non-production database.
3. Sets/rest remain coach-owned (existing engine)
4. Next prescription remains runtime-evaluated, not a new assignment-row batch writer
5. Routing protocol file missing from repo
```

FINAL_STATUS:

**MAAKFIT_SMART_PROGRESSION_V1_IMPLEMENTATION_COMPLETE**

---

## NEXT HANDOFF

**EMPLOYEE:** QA Manager  

The file `HAKIM_TASK_ROUTING_AND_HANDOFF_PROTOCOL.md` is **not in this repository**. Existing project routing in `docs/v1/PLATFORM_QA_HANDOFF.md` is Platform Developer → QA Manager. This is that handoff, not a new employee name.

**REASON:** Local implementation is in the repo. Next work is verification after the local/staging migration is applied — not a new training-science design and not production deploy.

**FILES:**

- `docs/MAAKFIT_SMART_PROGRESSION_V1_IMPLEMENTATION_REPORT.md`
- `src/components/admin/ClientProgressionStrategyCard.tsx`
- `src/components/admin/ClientTrainingWorkspace.tsx`
- `src/lib/platform/progression-strategy/`
- `src/hooks/useWorkoutPlayer.ts`
- `supabase/migrations/20260905150000_admin_client_progression_strategy.sql`

**VERIFICATION:**

1. Apply the local migration on a non-production database
2. Client 360 → Training: Program Source + Progression Strategy visible
3. Save Smart Locked; reload; strategy persists on that assignment only
4. Same template, second client, Coach Managed — independent
5. Workout with completed sets: load/reps may progress; exercise id does not
6. Variation/plateau opens coach review; Keep dismisses; Replace uses picker
7. Coach Managed does not auto-change prescription
8. Stale save after a newer update is refused with the Arabic stale copy
9. Template catalog row unchanged
10. Client app still shows current prescription only

**COMPLETION_CRITERIA:** Coach can lock exercises, let MAAKFIT manage allowed prescription variables through the existing engine, and take the final exercise decision from Client 360 Training.
