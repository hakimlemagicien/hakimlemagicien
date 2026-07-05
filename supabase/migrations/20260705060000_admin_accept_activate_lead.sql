-- On admin payment confirm: activate lead (status = active). Reject leaves status unchanged.

ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'active';

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
    status = CASE
      WHEN p_payment_status = 'confirmed' THEN 'active'::public.lead_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_lead_id
    AND payment_status = 'submitted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead_not_found_or_not_submitted' USING ERRCODE = 'P0002';
  END IF;
END;
$$;
