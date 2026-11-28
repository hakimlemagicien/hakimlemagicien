-- Training runtime: cycle stored program weeks.
--
-- Problem: assignment snapshots are copied from templates that currently store a single
-- week, while duration_weeks = 8. The runtime selected days with
-- `w.week_number = v_week`, so from day 8 (week 2) every client received zero sessions.
--
-- Fix: keep the real calendar week (current_week_number, progress UI) but read days from a
-- "source week": the exact week when it exists, otherwise the stored weeks in order, cycled
-- (1 stored week → repeats; 4 stored weeks → week 5 reads week 1, ...). Templates that later
-- ship full 8-week periodization are used as-is with no further change.
--
-- The runtime body lives in `client_get_my_training_runtime()` or, once the customer-journey
-- migration has wrapped it, in `_client_get_my_training_runtime_entitled()`. The preview RPC
-- may or may not exist. Patch whichever bodies exist in place so their logic is otherwise
-- unchanged. Idempotent.

BEGIN;

CREATE OR REPLACE FUNCTION public._runtime_source_week(p_assignment_id UUID, p_week INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.client_program_weeks
      WHERE assignment_id = p_assignment_id AND week_number = p_week
    ) THEN p_week
    ELSE COALESCE(
      (
        SELECT w.week_number
        FROM public.client_program_weeks w
        WHERE w.assignment_id = p_assignment_id
        ORDER BY w.week_number
        OFFSET (
          (GREATEST(COALESCE(p_week, 1), 1) - 1) % GREATEST(
            (SELECT count(*)::INT FROM public.client_program_weeks c WHERE c.assignment_id = p_assignment_id),
            1
          )
        )
        LIMIT 1
      ),
      p_week
    )
  END;
$$;

COMMENT ON FUNCTION public._runtime_source_week(UUID, INTEGER) IS
  'Stored week to read sessions from for calendar week p_week: exact match, else stored weeks cycled in order.';

REVOKE ALL ON FUNCTION public._runtime_source_week(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._runtime_source_week(UUID, INTEGER) TO service_role;

DO $$
DECLARE
  v_fn TEXT;
  v_def TEXT;
  v_new TEXT;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.client_get_my_training_runtime()',
    'public._client_get_my_training_runtime_entitled()',
    'public.client_get_my_training_preview()'
  ] LOOP
    IF to_regprocedure(v_fn) IS NULL THEN
      CONTINUE;
    END IF;
    v_def := pg_get_functiondef(to_regprocedure(v_fn));
    IF v_def LIKE '%_runtime_source_week%' THEN
      CONTINUE; -- already patched
    END IF;
    v_new := regexp_replace(
      v_def,
      'w\.week_number\s*=\s*v_week',
      'w.week_number = public._runtime_source_week(v_row.id, v_week)',
      'g'
    );
    IF v_new <> v_def THEN
      EXECUTE v_new;
      RAISE NOTICE 'patched %', v_fn;
    END IF;
  END LOOP;
END $$;

COMMIT;
