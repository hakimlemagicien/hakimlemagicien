-- MAAKFIT Command Center Phase 7 nutrition assignment RLS/RPC plan (non-production).
-- Do not run against production. Requires 20260820250000_client_nutrition_assignments.sql
-- DATABASE_RUNTIME_QA_ENVIRONMENT_BLOCKED until Docker/local Supabase exists.

-- Actors: anon, member A, member B, admin.

-- Authorization
-- 1. SET sub = anon; SELECT admin_assign_client_nutrition(...) → denied.
-- 2. SET sub = A; SELECT admin_assign_client_nutrition(...) → forbidden.
-- 3. SET sub = A; SELECT admin_save_client_nutrition_slots(...) → forbidden.
-- 4. SET sub = A; SELECT admin_list_client_nutrition_logs(B) → forbidden.
-- 5. SET sub = A; SELECT client_get_my_nutrition_runtime() → own assignment only.
-- 6. SET sub = A; SELECT * FROM client_nutrition_slots WHERE assignment.client_id = B → 0 rows.
-- 7. SET sub = A; INSERT INTO client_nutrition_slots → permission denied.
-- 8. SET sub = A; INSERT INTO client_nutrition_meal_logs → permission denied (RPC only).
-- 9. SET sub = Admin; assign four published meals → snapshot rows created.

-- Snapshot immutability (mandatory)
-- 10. Create published meal X with calories=400 allergens={}.
-- 11. Assign X to A breakfast snapshot.
-- 12. UPDATE meals SET calories=900, allergens='{peanut}' WHERE id=X.
-- 13. A's client_nutrition_slots.calories remain 400 and allergens remain {}.
-- 14. library_allergen_review becomes true if watch_allergens includes peanut.

-- Replacement
-- 15. Assign without p_replace while A is active → active_nutrition_exists.
-- 16. Assign with p_replace=true → previous status=replaced, history readable, new snapshot active.
-- 17. Old meal logs keep previous source_external_id.

-- Isolation
-- 18. A cannot read B assignment/slots/logs.
-- 19. Updating A servings does not change B slots.
-- 20. Admin can list both clients' logs via RPC.

-- Allergen
-- 21. watch_allergens={peanut} + slot.allergens={peanut} → allergen_conflict true, assignment still allowed.
-- 22. No product policy auto-block exists; UI must show REVIEW REQUIRED.

-- Logging
-- 23. client_log_nutrition_meal on own active slot succeeds with assignment_id + slot_id + source_external_id.
-- 24. ON CONFLICT keeps original source_external_id.
-- 25. Legacy log with null assignment_id remains readable as unlinked.

-- Archive safety
-- 26. Archive meal SET NULL on snapshot.source_meal_id; frozen name/external_id/macros remain.
-- 27. Archived meal is meal_not_assignable for new assignments/substitutions.

-- Concurrency
-- 28. admin_save_client_nutrition_slots with stale p_expected_updated_at → stale_update.

-- No-plan
-- 29. Member without assignment: client_get_my_nutrition_runtime reason=no_program, slots=[].
