-- MAAKFIT Command Center Phase 5 library RLS/RPC plan (non-production).
-- Do not run against production. Requires 20260820230000_admin_library_management.sql
-- plus Phase 3 contracts. DATABASE_RUNTIME_QA_ENVIRONMENT_BLOCKED until Docker/local Supabase exists.

-- Actors: anon, member A, admin.

-- Authorization
-- 1. SET sub = anon; SELECT admin_list_exercises() → denied/forbidden.
-- 2. SET sub = A; SELECT admin_list_meals() → forbidden.
-- 3. SET sub = A; SELECT admin_save_exercise('{}') → forbidden.
-- 4. SET sub = A; SELECT admin_save_meal('{}') → forbidden.
-- 5. SET sub = A; SELECT admin_save_program_template('{}') → forbidden.
-- 6. SET sub = A; SELECT admin_save_discover_content('{}') → forbidden.
-- 7. SET sub = A; SELECT admin_set_discover_content_status(...) → forbidden.
-- 8. SET sub = Admin; list RPCs succeed and p_limit 200 is clamped to 50.

-- Hard delete
-- 9. SET sub = Admin; DELETE FROM exercises → permission denied.
-- 10. SET sub = Admin; DELETE FROM meals → permission denied.
-- 11. SET sub = Admin; DELETE FROM program_templates → permission denied.
-- 12. SET sub = Admin; DELETE FROM discover_content → permission denied.

-- Meal integrity
-- 13. Admin save_meal with duplicate external_id → duplicate_external_id.
-- 14. Admin save_meal with quantity 0 → invalid_quantity.
-- 15. Admin save_meal changing ingredients without allergens_confirmed → allergens_review_required.
-- 16. Admin save_meal + ingredients is atomic (failed insert rolls back meal update).
-- 17. Member SELECT meals sees only is_active AND status=published.

-- Program safety
-- 18. Admin archive template does not UPDATE client_program_assignments.
-- 19. Assignment source_template_id/template_version remain immutable.
-- 20. admin_list_program_templates.assignment_count is aggregate, not a client dump.

-- Content
-- 21. Member cannot insert discover_content (admin policy).
-- 22. Public read still only published OR scheduled with publish_at <= now().
-- 23. Unpublish/archive slug appears in client_list_hidden_library_keys for authenticated users.

-- Audit
-- 24. exercise_archived / meal_published / program_template_published / discover_content_published
--     write audit_events without full body/payload.
