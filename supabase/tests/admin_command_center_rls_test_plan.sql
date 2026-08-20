-- MAAKFIT Command Center Phase 3 RLS/RPC plan (non-production).
-- Environment: local/staging only. Do not apply or run against production.
-- Requires migrations 20260820120000_legal_billing_privacy_v1 and
-- 20260820210000_admin_command_center_data_contracts.

-- Actors: anon, member A, member B, admin.

-- Privilege escalation
-- 1. SET sub = A; INSERT into user_roles (user_id, role) values (A, 'admin') → forbidden.
-- 2. SET sub = A; UPDATE user_roles SET role = 'admin' WHERE user_id = A → forbidden.
-- 3. SET sub = NULL (trigger for handle_new_user); INSERT role user is allowed.
-- 4. SET sub = Admin; INSERT another staff admin is allowed by this trigger (current RBAC = admin).

-- Admin contracts
-- 5. SET sub = anon; SELECT admin_list_clients() → permission denied / forbidden.
-- 6. SET sub = A; SELECT admin_list_clients() → forbidden.
-- 7. SET sub = Admin; SELECT admin_list_clients(p_limit := 200) returns at most 25 rows.
-- 8. SET sub = Admin; SELECT admin_get_client_overview(A) returns profile + membership, not workouts array.
-- 9. SET sub = A; SELECT admin_get_client_overview(B) → forbidden.

-- Coach notes
-- 10. SET sub = A; SELECT from coach_client_notes WHERE client_id = A → 0 rows.
-- 11. SET sub = A; INSERT into coach_client_notes → permission denied.
-- 12. SET sub = A; SELECT admin_add_client_note(A, 'x') → forbidden.
-- 13. SET sub = Admin; admin_add_client_note(A, 'staff note') succeeds.
-- 14. SET sub = A; SELECT admin_list_client_notes(A) → forbidden.
-- 15. SET sub = Admin; list notes for A includes the note; audit_events metadata must not include body.

-- Audit
-- 16. SET sub = A; SELECT admin_list_audit_events() → forbidden.
-- 17. SET sub = Admin; SELECT admin_list_audit_events(p_limit := 500) returns at most 50 rows.

-- Support transitions
-- 18. SET sub = Admin; admin_set_support_ticket_status(closed_ticket, 'received') → invalid_transition.

-- Payments
-- 19. SET sub = Admin; admin_update_lead_payment_status(submitted_lead, 'rejected', NULL) → reason_required.
-- 20. SET sub = A; admin_update_lead_payment_status(...) → forbidden.

-- Assignments
-- 21. SET sub = A; UPDATE client_program_assignments SET template_version = template_version + 1 → permission denied.
-- 22. Service/admin SQL that updates source_template_id → assignment_immutable.
