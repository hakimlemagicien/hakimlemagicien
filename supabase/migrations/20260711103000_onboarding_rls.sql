-- RLS policies for onboarding tables. Draft table access remains RPC-only.

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.membership_tiers TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.training_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.user_roles, public.profiles, public.quiz_answers, public.plans,
  public.payments, public.membership_tiers, public.memberships, public.onboarding_drafts, public.training_profiles TO service_role;

REVOKE ALL ON public.onboarding_drafts FROM anon, authenticated;

DROP POLICY IF EXISTS "user_roles_own_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
CREATE POLICY "user_roles_own_select" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "quiz_answers_own_all" ON public.quiz_answers;
DROP POLICY IF EXISTS "quiz_answers_admin_select" ON public.quiz_answers;
CREATE POLICY "quiz_answers_own_all" ON public.quiz_answers
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quiz_answers_admin_select" ON public.quiz_answers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "plans_own_all" ON public.plans;
DROP POLICY IF EXISTS "plans_admin_select" ON public.plans;
CREATE POLICY "plans_own_all" ON public.plans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plans_admin_select" ON public.plans
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "payments_own_select" ON public.payments;
DROP POLICY IF EXISTS "payments_own_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_own_update_pending" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_own_select" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "payments_own_insert" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_own_update_pending" ON public.payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending','submitted'))
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_admin_select" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments_admin_update" ON public.payments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "membership_tiers_read_all" ON public.membership_tiers;
CREATE POLICY "membership_tiers_read_all" ON public.membership_tiers
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "memberships_own_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_admin_select" ON public.memberships;
CREATE POLICY "memberships_own_select" ON public.memberships
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memberships_admin_select" ON public.memberships
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "training_profiles_own_select" ON public.training_profiles;
DROP POLICY IF EXISTS "training_profiles_own_insert" ON public.training_profiles;
DROP POLICY IF EXISTS "training_profiles_own_update" ON public.training_profiles;
DROP POLICY IF EXISTS "training_profiles_admin_select" ON public.training_profiles;
CREATE POLICY "training_profiles_own_select" ON public.training_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "training_profiles_own_insert" ON public.training_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "training_profiles_own_update" ON public.training_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "training_profiles_admin_select" ON public.training_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- No direct anon/authenticated access to drafts; create/update/finalize RPCs enforce token ownership.
DROP POLICY IF EXISTS "onboarding_drafts_no_direct_access" ON public.onboarding_drafts;
CREATE POLICY "onboarding_drafts_no_direct_access" ON public.onboarding_drafts
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
