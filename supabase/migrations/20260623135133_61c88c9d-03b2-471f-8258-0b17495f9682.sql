
-- Payment proofs storage policies
CREATE POLICY "Users can update their own payment proofs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete any payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- user_roles INSERT/DELETE policies (admins only)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
