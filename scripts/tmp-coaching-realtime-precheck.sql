SELECT jsonb_build_object(
  'publication_exists', EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'),
  'publication_all_tables', (SELECT puballtables FROM pg_publication WHERE pubname = 'supabase_realtime')
) AS realtime_precheck;
