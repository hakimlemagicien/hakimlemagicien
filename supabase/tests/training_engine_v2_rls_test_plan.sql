-- Training Engine V2 Phase 2 RLS/RPC plan (non-production).
-- Requires 20260821120000_training_engine_v2_data_contracts.sql
-- DATABASE_RUNTIME_QA_ENVIRONMENT_BLOCKED until Docker/local Supabase exists.

-- Actors: anon, member A, member B, admin.

-- Sessions
-- 1. SET sub = anon; SELECT client_ensure_workout_session('k') → denied.
-- 2. SET sub = A; SELECT client_ensure_workout_session('k') twice → same id (user_id, session_key).
-- 3. SET sub = A; insert second session same date different session_key → allowed.
-- 4. SET sub = A; SELECT * FROM workout_sessions WHERE user_id = B → 0 rows.
-- 5. SET sub = A; UPDATE workout_sessions SET user_id = B → policy reject.
-- 6. SET sub = Admin; SELECT A's sessions → allowed.
-- 7. client_update_workout_session_status(B's id) as A → session_not_found.

-- Set logs
-- 8. A upsert legacy shape (no workout_session_id) still succeeds on (user_id, session_date, exercise_external_id, set_number).
-- 9. A insert with B workout_session_id → reject.
-- 10. skipped=true AND set_completed=true → check constraint reject.
-- 11. Historical row remains readable with effort='hard' and effort_v2='VERY_HARD' after backfill; FAILURE not present.
-- 12. New insert effort='easy' with null effort_v2 → trigger writes EASY.
-- 13. set_type null on insert → WORKING.

-- Training level / experience
-- 14. A SELECT own client_training_levels after ensure → UNASSESSED.
-- 15. A INSERT/UPDATE client_training_levels directly → permission denied.
-- 16. A cannot UPDATE experience_state to ESTABLISHED via table DML.
-- 17. B cannot read A's level or experience.

-- Goals
-- 18. Authenticated SELECT training_goal_legacy_map.fat → FAT_LOSS.
-- 19. tone → LEGACY_UNMAPPED, canonical_id null.
-- 20. A INSERT into training_goal_profiles → denied.
-- 21. A INSERT client_goal_history own row → allowed; B's user_id → denied.

-- Safety / decisions
-- 22. A INSERT safety_signal='pain' → allowed.
-- 23. A INSERT adaptive_decision_logs → denied (engine-owned).
-- 24. A SELECT own decision logs → allowed (empty).

-- History RPC
-- 25. client_list_exercise_set_history('CH-001') returns only own WORKING non-skipped sets.
-- 26. WARMUP rows excluded.

-- Progress / observability (Phase 11)
-- 32. A SELECT own adaptive_decision_logs → allowed. B cannot read A's logs.
-- 33. A SELECT input_snapshot of own logs is technically allowed by table RLS; client API toClientSafeTrace MUST strip input_summary.
-- 34. A INSERT adaptive_decision_logs (table) → denied (engine/service_role owned).
-- 35. Admin SELECT client logs → allowed via adaptive_decision_logs_admin_select.
-- 36. No progress_v2 / notifications_v2 / analytics_v2 tables.
-- 37. A EXECUTE client_upsert_adaptive_decision own WEEKLY_VOLUME/GOAL_RESPONSE → allowed; writes auth.uid() only.
-- 38. A EXECUTE client_upsert_adaptive_decision cannot target B (RPC uses auth.uid()).
-- 39. B SELECT A's adaptive_decision_logs → denied.
-- 40. Anon EXECUTE client_upsert_adaptive_decision / admin_assign_generated_v2_program → denied.
-- 41. Non-admin EXECUTE admin_assign_generated_v2_program → forbidden.
-- 42. Admin assign with p_validation_status=INVALID → program_invalid; existing assignment unchanged.
-- 43. Admin assign while client workout_sessions.status=IN_PROGRESS → active_workout_in_progress.
-- 44. A cannot SELECT B client_program_assignments snapshot created by V2 generator.

-- Runtime compatibility
-- Continuity (Phase 8)
-- 28. A SELECT own workout_sessions for continuity → allowed. B cannot read A's rows.
-- 29. No training_schedule_v2 table. Continuity does not insert into another user's sessions.
-- 30. A UPDATE workout_sessions.status IN_PROGRESS → INTERRUPTED on own stale row → allowed.
-- 31. A UPDATE B's session status → denied.
-- 28. admin_list_client_set_logs still returns legacy columns.
