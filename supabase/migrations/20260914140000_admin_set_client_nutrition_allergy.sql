-- Admin can confirm client allergy status before Strategy V1 nutrition generation.
-- Fail-closed: admin_generate_client_nutrition requires non-UNKNOWN allergy_status.

CREATE OR REPLACE FUNCTION public.admin_set_client_nutrition_allergy(
  p_client_id UUID,
  p_status TEXT,
  p_allergens TEXT[] DEFAULT '{}'::text[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_status TEXT := upper(btrim(COALESCE(p_status, '')));
  v_allergens TEXT[] := COALESCE(p_allergens, '{}'::text[]);
BEGIN
  v_admin := public._require_admin();

  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  IF v_status NOT IN ('CONFIRMED_NONE', 'KNOWN_ALLERGIES') THEN
    RAISE EXCEPTION 'invalid_allergy_status' USING ERRCODE = '22023';
  END IF;

  IF v_status = 'KNOWN_ALLERGIES' AND coalesce(array_length(v_allergens, 1), 0) < 1 THEN
    RAISE EXCEPTION 'allergens_required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.client_nutrition_profiles AS p (
    client_id,
    allergy_status,
    confirmed_none_at,
    known_allergens,
    dietary_restrictions,
    updated_at
  ) VALUES (
    p_client_id,
    v_status,
    CASE WHEN v_status = 'CONFIRMED_NONE' THEN now() ELSE NULL END,
    CASE WHEN v_status = 'KNOWN_ALLERGIES' THEN v_allergens ELSE '{}'::text[] END,
    '{}'::text[],
    now()
  )
  ON CONFLICT (client_id) DO UPDATE SET
    allergy_status = EXCLUDED.allergy_status,
    confirmed_none_at = EXCLUDED.confirmed_none_at,
    known_allergens = EXCLUDED.known_allergens,
    updated_at = now();

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'client_nutrition_allergy_updated',
    jsonb_build_object(
      'allergy_status', v_status,
      'known_allergens', to_jsonb(v_allergens)
    )
  );

  RETURN jsonb_build_object(
    'client_id', p_client_id,
    'allergy_status', v_status,
    'known_allergens', to_jsonb(v_allergens)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_client_nutrition_allergy(UUID, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_client_nutrition_allergy(UUID, TEXT, TEXT[]) TO authenticated, service_role;
