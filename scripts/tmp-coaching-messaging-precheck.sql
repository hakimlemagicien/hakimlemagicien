SELECT jsonb_build_object(
  'coaching_conversations', to_regclass('public.coaching_conversations') IS NOT NULL,
  'coaching_messages', to_regclass('public.coaching_messages') IS NOT NULL,
  'coaching_attachments', to_regclass('public.coaching_attachments') IS NOT NULL,
  'coaching_notifications', to_regclass('public.coaching_notifications') IS NOT NULL,
  'coaching_types', (SELECT coalesce(jsonb_agg(typname ORDER BY typname), '[]'::jsonb) FROM pg_type WHERE typname LIKE 'coaching%'),
  'coaching_chat_bucket', EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'coaching-chat'),
  'has_role', to_regprocedure('public.has_role(uuid, public.app_role)') IS NOT NULL,
  'user_roles', to_regclass('public.user_roles') IS NOT NULL,
  'profiles', to_regclass('public.profiles') IS NOT NULL,
  'memberships', to_regclass('public.memberships') IS NOT NULL,
  'realtime_tables', (
    SELECT coalesce(jsonb_agg(tablename ORDER BY tablename), '[]'::jsonb)
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
  )
) AS precheck;
