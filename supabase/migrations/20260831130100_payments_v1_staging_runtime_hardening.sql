-- P3 Staging runtime hardening (additive only)
-- 1) Staging enum drift: legacy payment_status used 'confirmed' without 'approved'
-- 2) Supabase default EXECUTE grants on public functions — restrict trusted RPC to service_role

ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'approved';

REVOKE ALL ON FUNCTION public.apply_provider_subscription_event(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_provider_subscription_event(JSONB) TO service_role;
