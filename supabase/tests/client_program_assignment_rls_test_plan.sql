-- MAAKFIT Command Center Phase 6 assignment snapshot RLS/RPC plan (non-production).
-- Do not run against production. Requires 20260820240000_client_program_assignment_snapshots.sql
-- DATABASE_RUNTIME_QA_ENVIRONMENT_BLOCKED until Docker/local Supabase exists.

-- Actors: anon, member A, member B, admin.

-- Authorization
-- 1. SET sub = anon; SELECT admin_assign_client_program(...) → denied.
-- 2. SET sub = A; SELECT admin_assign_client_program(...) → forbidden.
-- 3. SET sub = A; SELECT admin_save_client_assignment_exercises(...) → forbidden.
-- 4. SET sub = A; SELECT admin_list_client_set_logs(B) → forbidden.
-- 5. SET sub = A; SELECT client_get_my_training_runtime() → own assignment only.
-- 6. SET sub = A; SELECT * FROM client_program_weeks WHERE assignment.client_id = B → 0 rows.
-- 7. SET sub = A; INSERT INTO client_program_weeks → permission denied.
-- 8. SET sub = Admin; assign published template → snapshot rows created.

-- Snapshot immutability (mandatory)
-- 9. Create template V1 with week/day/exercise.
-- 10. Assign to A. Snapshot copies tree.
-- 11. Edit template exercise/sets and publish V2.
-- 12. A's client_program_exercises remain V1 values.
-- 13. source_template_id/template_version on assignment unchanged by template UPDATE.

-- Replacement
-- 14. Assign B-template without p_replace while A is active → active_assignment_exists.
-- 15. Assign with p_replace=true → previous status=replaced, history readable, new snapshot active.

-- Isolation
-- 16. A cannot UPDATE B assignment or logs.
-- 17. A workout_set_logs insert with B assignment_id → policy reject.
-- 18. Admin can list both clients' logs via RPC.

-- Logging
-- 19. New log with assignment_id + assignment_exercise_id of own snapshot succeeds.
-- 20. Legacy log with null assignment_id remains readable.
-- 21. After replace, old logs keep old assignment_id.

-- Archive safety
-- 22. Archive template does not delete client_program_* rows.
-- 23. Archive exercise SET NULL on snapshot.exercise_id; frozen name/external_id remain.
-- 24. Archived template is template_not_assignable for new assignments.

-- Concurrency
-- 25. admin_save_client_assignment_exercises with stale p_expected_updated_at → stale_update.

-- No-program
-- 26. Member without assignment: client_get_my_training_runtime reason=no_program, days=[].
