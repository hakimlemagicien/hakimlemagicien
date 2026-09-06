-- Program template cover images: admin upload from device, public read for display.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'program-covers',
  'program-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "program_covers_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "program_covers_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "program_covers_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "program_covers_public_select" ON storage.objects;

CREATE POLICY "program_covers_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'program-covers'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "program_covers_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'program-covers'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'program-covers'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "program_covers_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'program-covers'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "program_covers_public_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'program-covers');
