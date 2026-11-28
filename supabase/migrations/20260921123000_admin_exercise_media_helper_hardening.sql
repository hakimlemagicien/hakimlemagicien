-- Internal composite-type helper: it is called by SECURITY DEFINER manager
-- RPCs and must not be exposed as a customer-facing PostgREST function.
REVOKE ALL ON FUNCTION public._exercise_media_snapshot(public.exercises)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._exercise_media_snapshot(public.exercises)
  TO service_role;
-- Recover a stale PostgREST notification listener, then rebuild the cache with
-- the internal helper excluded from the exposed authenticated RPC surface.
SELECT pg_notification_queue_usage();
NOTIFY pgrst, 'reload schema';
