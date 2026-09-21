-- Emergency rollback for Admin Exercise Media Manager V1.
-- This removes only objects introduced by migration 20260921120000.
-- Canonical media fields on public.exercises are intentionally preserved.

BEGIN;

DROP POLICY IF EXISTS exercise_media_staff_insert ON storage.objects;
DROP POLICY IF EXISTS exercise_media_staff_update ON storage.objects;

DROP FUNCTION IF EXISTS public.admin_list_exercise_media_catalog(JSONB);
DROP FUNCTION IF EXISTS public.admin_restore_previous_exercise_media(UUID);
DROP FUNCTION IF EXISTS public.admin_publish_exercise_media(UUID);
DROP FUNCTION IF EXISTS public.admin_stage_exercise_media(UUID, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_get_exercise_media_manager(UUID);
DROP FUNCTION IF EXISTS public._exercise_media_snapshot(public.exercises);
DROP FUNCTION IF EXISTS public._exercise_media_admin_allowed(UUID);

DROP TABLE IF EXISTS public.exercise_media_versions;

COMMIT;
