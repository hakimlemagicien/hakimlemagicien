-- Link confirmed leads to auth.users for post-payment onboarding

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON public.leads (lower(email))
  WHERE email IS NOT NULL;

-- Service role only: used by edge functions to link a lead after invite/signup
REVOKE ALL ON public.leads FROM anon, authenticated;

GRANT ALL ON public.leads TO service_role;
