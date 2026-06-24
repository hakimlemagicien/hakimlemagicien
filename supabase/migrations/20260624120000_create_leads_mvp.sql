-- MVP: pending quiz leads secured via RPC (no direct anon table access)

CREATE TYPE public.lead_status AS ENUM (
  'pending_lead',
  'plan_selected',
  'payment_submitted'
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
access_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')

  status public.lead_status NOT NULL DEFAULT 'pending_lead',

  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  gender TEXT,
  goal_id TEXT,
  challenge_id TEXT,

  full_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  location_preference TEXT,

  tier_id TEXT,
  tier_name TEXT,
  plan_price NUMERIC(10, 2),
  training_mode TEXT,

  payment_method public.payment_method,
  payment_amount NUMERIC(10, 2),
  payment_currency TEXT NOT NULL DEFAULT 'USD',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  proof_path TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_proof_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_proof_uploads_lead_id ON public.lead_proof_uploads(lead_id);
CREATE INDEX idx_lead_proof_uploads_storage_path ON public.lead_proof_uploads(storage_path);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_proof_uploads ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated table access. RPC functions run as SECURITY DEFINER.
REVOKE ALL ON public.leads FROM anon, authenticated;
REVOKE ALL ON public.lead_proof_uploads FROM anon, authenticated;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.lead_proof_uploads TO service_role;

-- Admin-only direct read access to leads (Supabase Studio / future admin UI)
GRANT SELECT ON public.leads TO authenticated;
CREATE POLICY "leads_admin_select"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow upload only to a pre-reserved path (via reserve_proof_upload RPC).
CREATE OR REPLACE FUNCTION public.is_proof_upload_reserved(p_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lead_proof_uploads u
    WHERE u.storage_path = p_path
      AND u.expires_at > now()
      AND u.used_at IS NULL
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_proof_upload_reserved(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_proof_upload_reserved(TEXT) TO anon, authenticated;

CREATE POLICY "proofs_reserved_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND public.is_proof_upload_reserved(name)
  );

CREATE OR REPLACE FUNCTION public.create_lead(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id UUID;
 v_token TEXT := encode(extensions.gen_random_bytes(32), 'hex');
BEGIN
  INSERT INTO public.leads (
    access_token,
    status,
    answers,
    gender,
    goal_id,
    challenge_id,
    full_name,
    email,
    phone,
    city,
    country,
    location_preference
  ) VALUES (
    v_token,
    COALESCE((p_payload->>'status')::public.lead_status, 'pending_lead'),
    COALESCE(p_payload->'answers', '{}'::jsonb),
    NULLIF(p_payload->>'gender', ''),
    NULLIF(p_payload->>'goal_id', ''),
    NULLIF(p_payload->>'challenge_id', ''),
    NULLIF(p_payload->>'full_name', ''),
    NULLIF(p_payload->>'email', ''),
    NULLIF(p_payload->>'phone', ''),
    NULLIF(p_payload->>'city', ''),
    NULLIF(p_payload->>'country', ''),
    NULLIF(p_payload->>'location_preference', '')
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'lead_id', v_id,
    'access_token', v_token
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead(
  p_lead_id UUID,
  p_access_token TEXT,
  p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_lead_id IS NULL OR p_access_token IS NULL OR length(trim(p_access_token)) = 0 THEN
    RAISE EXCEPTION 'invalid_lead_credentials' USING ERRCODE = '42501';
  END IF;

  UPDATE public.leads
  SET
    answers = COALESCE(p_payload->'answers', answers),
    gender = COALESCE(NULLIF(p_payload->>'gender', ''), gender),
    goal_id = COALESCE(NULLIF(p_payload->>'goal_id', ''), goal_id),
    challenge_id = COALESCE(NULLIF(p_payload->>'challenge_id', ''), challenge_id),
    full_name = COALESCE(NULLIF(p_payload->>'full_name', ''), full_name),
    email = COALESCE(NULLIF(p_payload->>'email', ''), email),
    phone = COALESCE(NULLIF(p_payload->>'phone', ''), phone),
    city = COALESCE(NULLIF(p_payload->>'city', ''), city),
    country = COALESCE(NULLIF(p_payload->>'country', ''), country),
    location_preference = COALESCE(NULLIF(p_payload->>'location_preference', ''), location_preference),
    tier_id = COALESCE(NULLIF(p_payload->>'tier_id', ''), tier_id),
    tier_name = COALESCE(NULLIF(p_payload->>'tier_name', ''), tier_name),
    plan_price = COALESCE(NULLIF(p_payload->>'plan_price', '')::NUMERIC, plan_price),
    training_mode = COALESCE(NULLIF(p_payload->>'training_mode', ''), training_mode),
    payment_method = COALESCE(NULLIF(p_payload->>'payment_method', '')::public.payment_method, payment_method),
    payment_amount = COALESCE(NULLIF(p_payload->>'payment_amount', '')::NUMERIC, payment_amount),
    payment_currency = COALESCE(NULLIF(p_payload->>'payment_currency', ''), payment_currency),
    payment_status = CASE
      WHEN NULLIF(p_payload->>'payment_method', '') IS NOT NULL THEN 'pending'::public.payment_status
      ELSE payment_status
    END,
    status = CASE
      WHEN (p_payload->>'status') IN ('pending_lead', 'plan_selected')
        THEN (p_payload->>'status')::public.lead_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_lead_id
    AND access_token = p_access_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_lead_credentials' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_proof_upload(
  p_lead_id UUID,
  p_access_token TEXT,
  p_file_ext TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ext TEXT := lower(trim(coalesce(p_file_ext, '')));
  v_path TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = p_lead_id
      AND l.access_token = p_access_token
  ) THEN
    RAISE EXCEPTION 'invalid_lead_credentials' USING ERRCODE = '42501';
  END IF;

  IF v_ext NOT IN ('jpg', 'jpeg', 'png', 'webp', 'pdf') THEN
    RAISE EXCEPTION 'invalid_file_extension' USING ERRCODE = '22023';
  END IF;

  IF v_ext = 'jpeg' THEN
    v_ext := 'jpg';
  END IF;

  v_path := p_lead_id::text || '/' || floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint || '.' || v_ext;

  INSERT INTO public.lead_proof_uploads (lead_id, storage_path, expires_at)
  VALUES (p_lead_id, v_path, now() + interval '15 minutes');

  RETURN v_path;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_payment_proof_metadata(
  p_lead_id UUID,
  p_access_token TEXT,
  p_proof_path TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_proof_path IS NULL OR length(trim(p_proof_path)) = 0 THEN
    RAISE EXCEPTION 'invalid_proof_path' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = p_lead_id
      AND l.access_token = p_access_token
  ) THEN
    RAISE EXCEPTION 'invalid_lead_credentials' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.lead_proof_uploads u
    WHERE u.lead_id = p_lead_id
      AND u.storage_path = p_proof_path
      AND u.expires_at > now()
      AND u.used_at IS NULL
  ) THEN
    RAISE EXCEPTION 'invalid_proof_upload' USING ERRCODE = '42501';
  END IF;

  UPDATE public.lead_proof_uploads
  SET used_at = now()
  WHERE lead_id = p_lead_id
    AND storage_path = p_proof_path
    AND used_at IS NULL;

  UPDATE public.leads
  SET
    proof_path = p_proof_path,
    payment_status = 'submitted',
    status = 'payment_submitted',
    updated_at = now()
  WHERE id = p_lead_id
    AND access_token = p_access_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_lead(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_lead(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_proof_upload(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_payment_proof_metadata(UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_lead(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_lead(UUID, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_proof_upload(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof_metadata(UUID, TEXT, TEXT) TO anon, authenticated;
