SELECT jsonb_build_object(
  'coaching_conversations', to_regclass('public.coaching_conversations') IS NOT NULL,
  'coaching_messages', to_regclass('public.coaching_messages') IS NOT NULL,
  'coaching_attachments', to_regclass('public.coaching_attachments') IS NOT NULL,
  'coaching_notifications', to_regclass('public.coaching_notifications') IS NOT NULL,
  'coaching_chat_bucket', EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'coaching-chat' AND public = false),
  'ensure_fn', to_regprocedure('public.ensure_my_coaching_conversation()') IS NOT NULL,
  'send_fn', EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_coaching_message'),
  'rls_conversations', (SELECT relrowsecurity FROM pg_class WHERE relname = 'coaching_conversations'),
  'rls_messages', (SELECT relrowsecurity FROM pg_class WHERE relname = 'coaching_messages'),
  'rls_attachments', (SELECT relrowsecurity FROM pg_class WHERE relname = 'coaching_attachments'),
  'rls_notifications', (SELECT relrowsecurity FROM pg_class WHERE relname = 'coaching_notifications'),
  'realtime_tables', (
    SELECT coalesce(jsonb_agg(tablename ORDER BY tablename), '[]'::jsonb)
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename LIKE 'coaching%'
  )
) AS postcheck;
