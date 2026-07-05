-- Admin RPCs for reviewing submitted lead payments (SECURITY DEFINER + role check)

CREATE OR REPLACE FUNCTION public.admin_list_submitted_leads()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  payment_amount NUMERIC,
  payment_currency TEXT,
  payment_method public.payment_method,
  proof_path TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.full_name,
    l.email,
    l.phone,
    l.payment_amount,
    l.payment_currency,
    l.payment_method,
    l.proof_path,
    l.created_at
  FROM public.leads l
  WHERE l.payment_status = 'submitted'
  ORDER BY l.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_lead_payment_status(
  p_lead_id UUID,
  p_payment_status public.payment_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_payment_status NOT IN ('confirmed', 'rejected') THEN
    RAISE EXCEPTION 'invalid_payment_status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.leads
  SET
    payment_status = p_payment_status,
    updated_at = now()
  WHERE id = p_lead_id
    AND payment_status = 'submitted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead_not_found_or_not_submitted' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_submitted_leads() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_lead_payment_status(UUID, public.payment_status) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_list_submitted_leads() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_lead_payment_status(UUID, public.payment_status) TO authenticated;
