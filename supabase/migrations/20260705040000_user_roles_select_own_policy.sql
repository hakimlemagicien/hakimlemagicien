-- Allow authenticated users to read only their own row(s) in user_roles (required for admin guard)

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
