-- Allow authenticated admins to read payment proof files (required for view receipt)

DROP POLICY IF EXISTS "proofs_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "proofs_admin_select_v2" ON storage.objects;

CREATE POLICY "proofs_admin_select_v2"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);
