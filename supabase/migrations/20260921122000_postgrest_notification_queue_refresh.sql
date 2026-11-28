-- Supabase recovery step for a stale PostgREST schema cache: touching the
-- notification queue allows the listener to recover before requesting reload.
SELECT pg_notification_queue_usage();
NOTIFY pgrst, 'reload schema';
