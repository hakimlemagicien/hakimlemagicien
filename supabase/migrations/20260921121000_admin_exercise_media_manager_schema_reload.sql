-- Ensure PostgREST sees the new Exercise Media Manager table and RPCs
-- immediately after the schema migration commits.
NOTIFY pgrst, 'reload schema';
