-- Private avatars bucket with per-user folder isolation and 5 MB object limit.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[],
  updated_at = now();

CREATE OR REPLACE FUNCTION public.is_own_avatar_path(p_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (storage.foldername(p_path))[1] = auth.uid()::text;
$$;

REVOKE EXECUTE ON FUNCTION public.is_own_avatar_path(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_own_avatar_path(TEXT) TO authenticated;

DROP POLICY IF EXISTS "avatars_own_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_own_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_own_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_own_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_select" ON storage.objects;

CREATE POLICY "avatars_own_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND public.is_own_avatar_path(name));

CREATE POLICY "avatars_own_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND public.is_own_avatar_path(name));

CREATE POLICY "avatars_own_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND public.is_own_avatar_path(name))
  WITH CHECK (bucket_id = 'avatars' AND public.is_own_avatar_path(name));

CREATE POLICY "avatars_own_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND public.is_own_avatar_path(name));

CREATE POLICY "avatars_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));
