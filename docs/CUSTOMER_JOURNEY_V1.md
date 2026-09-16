# MAAKFIT — Customer Journey V1 Contract

**Baseline:** `main@54be8ba`
**Status:** Production rollout approved and executed on 2026-09-16
**Database source of truth:** `supabase/migrations/20260916130000_customer_journey_v1.sql`

This is the official V1 contract from completed onboarding through preparation, assigned Training, Nutrition timing, FREE preview, and paid unlock. It reuses the existing onboarding, template snapshot, membership entitlement, Meal Library, nutrition assignment, and upgrade systems.

## FIRST_APP_PREPARATION

`client_customer_journeys` owns one idempotent lifecycle row per user:

| State                 | Contract                                                       |
| --------------------- | -------------------------------------------------------------- |
| `preparing`           | Persistent original timer is running.                          |
| `needs_training_days` | Original timer ended; fixed +10-minute input window is active. |
| `complete_setup`      | Required input remains missing; no fake plan is shown.         |
| `ready`               | A real client assignment exists and is reusable for unlock.    |
| `failed`              | No safe compatible template exists; no random fallback.        |

The first authenticated `/app` shell call starts the row. `preparation_started_at` and `preparation_ready_at` are stored once; refresh, navigation, logout/login, and multiple tabs only reread them. Default duration is 120 minutes in `product_runtime_settings`, not a UI constant. Existing pre-rollout users and clients with an active/scheduled assignment are grandfathered to `ready`.

The preparation countdown is not shown on Home. During preparation, Training and Nutrition each render the same journey-radar hold experience. Training shows one radar timer only. Nutrition exposes no meal-plan content and does not ask for the training meal window until the original timer has completed.

## Training-days and completion window

Training days are never asked in Quiz. Training asks once with values 2–6 and persists `preferred_training_days`; `normalized_training_days = max(3, preferred_training_days)`. Saving before the original timer ends does not shorten it. If missing at expiry, `extra_window_ends_at` is fixed to the original deadline plus the configured 10 minutes. Saving during or after that window finalizes immediately. Expiry without input stays in `complete_setup` until the customer answers.

Both required first-entry questions are modal gates with a blurred backdrop and no dismiss action. Training cannot be used until training days are selected. After preparation, Nutrition cannot be used until the training meal window is selected. The UI does not label either interaction as “mandatory”; enforcement is behavioral.

The answer is also written into the existing `training_profiles.answers` keys so the current Training strategy architecture remains aligned.

## Template matching and assignment

Hard filters are: published/non-archived, authored weeks, exact mapped goal, exact gender or explicitly authored `all`, and compatible level. Missing gender metadata is not neutral. Wrong gender and wrong goal are forbidden.

An explicit Arabic presentation contradiction is also fail-closed during matching. The baseline `54be8ba` copy defect in `MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D` is corrected by `20260916131000_program_template_presentation_integrity.sql`, including already-created snapshots that copied the wrong title.

Candidates are sorted deterministically by: smallest day distance; non-exceeding frequency on a tie; exact gender; exact level; newest template version; UUID. Thus 2→3, exact 3/4 is preferred, and 6→5 when no compatible 6-day template exists. No compatible template produces `failed/no_compatible_template`.

Finalization uses a per-user advisory lock, reuses an existing assignment, and otherwise calls the existing `client_auto_assign_program_template` snapshot path. `program_templates` remain reusable authoring records; `client_program_assignments` remain client-specific immutable snapshots. Repeated calls never duplicate the timer or assignment.

## Training FREE and paid unlock

The existing approved trainer video remains above the FREE result. `client_get_my_training_preview()` returns only assignment title/duration/frequency plus day title, training/rest state, duration, and exercise count. It never returns exercise identities, thumbnails, videos, sets, reps, rest, RIR/RPE, tempo, order, alternatives, notes, or weights.

The full runtime is entitlement-gated at the database boundary. Locked content opens the existing upgrade flow. Upgrade unlocks the same assigned snapshot; it does not generate an unrelated replacement.

## Nutrition timing and six meals

Nutrition asks once: “When do you usually train?” with the eight approved meal-relative windows. The value is stored as `training_meal_window` and positions exactly six deterministic slots: four main meals (`breakfast`, `lunch`, `evening_meal`, `dinner`) plus `pre_workout` and `post_workout`.

For a before-window the order is pre, post, anchor meal; for an after-window it is anchor meal, pre, post. Other main meals keep chronological order. Catalog preview meals come only from the approved Meal Library, filtered by meal type and goal with stable ordering. Existing paid Nutrition assignments and their safety/allergy rules remain authoritative; no random generic paid plan is created.

FREE exposes the full goal-matched breakfast only. All other slots show safe labels and lock state. Direct locked meal/alternatives routes do not reveal names, images, macros, ingredients, or instructions.

## Failure, idempotency, and rollout

- Missing gender/goal: `complete_setup` with a precise failure code.
- Missing days: `needs_training_days`, then `complete_setup`.
- No compatible template: `failed/no_compatible_template`.
- Network/server failure: retry state; never local/mock content.
- Existing completed users: no first-time regression.
- Repeated calls never restart timers, duplicate assignments, or replace the assigned snapshot on upgrade.

Production rollout on 2026-09-16 applied only `20260916130000` and `20260916131000` to project `ufgrbpakuemamggwypdh`; unrelated pending historical migrations were deliberately excluded. The application is deployed from `main` through the existing Vercel Production workflow. Rollback remains application-first because the database changes are additive; the prior application ignores the new journey tables and RPCs.
