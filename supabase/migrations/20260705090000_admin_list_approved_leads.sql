-- List approved leads for admin resend-access actions

CREATE OR REPLACE FUNCTION public.admin_list_approved_leads()
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
  WHERE l.payment_status = 'approved'
  ORDER BY l.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_approved_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_approved_leads() TO authenticated;
