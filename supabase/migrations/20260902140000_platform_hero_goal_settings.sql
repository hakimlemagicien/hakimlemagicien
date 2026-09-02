-- Platform hero goal framing + card theme settings (admin-managed, client-read).

CREATE TABLE IF NOT EXISTS public.platform_hero_goal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_kind TEXT NOT NULL CHECK (setting_kind IN ('framing', 'card_theme')),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  goal_id TEXT NOT NULL CHECK (char_length(btrim(goal_id)) > 0),
  asset_file_name TEXT NOT NULL DEFAULT '' CHECK (char_length(asset_file_name) <= 255),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT platform_hero_goal_settings_kind_asset_chk CHECK (
    (setting_kind = 'framing' AND char_length(btrim(asset_file_name)) > 0)
    OR (setting_kind = 'card_theme' AND asset_file_name = '')
  ),
  CONSTRAINT platform_hero_goal_settings_unique UNIQUE (setting_kind, gender, goal_id, asset_file_name)
);

CREATE INDEX IF NOT EXISTS idx_platform_hero_goal_settings_lookup
  ON public.platform_hero_goal_settings (setting_kind, gender, goal_id);

ALTER TABLE public.platform_hero_goal_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public._hero_goal_framing_key(
  p_gender TEXT,
  p_goal_id TEXT,
  p_asset_file_name TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_gender || ':' || p_goal_id || ':' || p_asset_file_name;
$$;

CREATE OR REPLACE FUNCTION public._hero_goal_card_theme_key(
  p_gender TEXT,
  p_goal_id TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_gender || ':' || p_goal_id;
$$;

CREATE OR REPLACE FUNCTION public._validate_hero_goal_framing_payload(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_scale NUMERIC;
  v_offset_x INTEGER;
  v_offset_y INTEGER;
  v_flip_x BOOLEAN;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid_framing_payload' USING ERRCODE = '22023';
  END IF;

  v_scale := (p_payload ->> 'scale')::NUMERIC;
  v_offset_x := (p_payload ->> 'offsetX')::INTEGER;
  v_offset_y := (p_payload ->> 'offsetY')::INTEGER;
  v_flip_x := COALESCE((p_payload ->> 'flipX')::BOOLEAN, false);

  IF v_scale IS NULL OR v_scale < 0.72 OR v_scale > 1.35 THEN
    RAISE EXCEPTION 'invalid_framing_scale' USING ERRCODE = '22023';
  END IF;
  IF v_offset_x IS NULL OR v_offset_x < -96 OR v_offset_x > 96 THEN
    RAISE EXCEPTION 'invalid_framing_offset_x' USING ERRCODE = '22023';
  END IF;
  IF v_offset_y IS NULL OR v_offset_y < -96 OR v_offset_y > 96 THEN
    RAISE EXCEPTION 'invalid_framing_offset_y' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object(
    'scale', round(v_scale, 3),
    'offsetX', v_offset_x,
    'offsetY', v_offset_y,
    'flipX', v_flip_x
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._validate_hero_goal_card_theme_payload(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_color TEXT;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid_card_theme_payload' USING ERRCODE = '22023';
  END IF;

  v_color := NULLIF(btrim(COALESCE(p_payload ->> 'color', '')), '');
  IF v_color IS NULL THEN
    RETURN jsonb_build_object('color', NULL);
  END IF;

  IF v_color !~ '^#[0-9a-fA-F]{6}$' THEN
    RAISE EXCEPTION 'invalid_card_theme_color' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('color', lower(v_color));
END;
$$;

CREATE OR REPLACE FUNCTION public.client_get_hero_goal_settings()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_framing JSONB := '{}'::jsonb;
  v_card_themes JSONB := '{}'::jsonb;
  v_row RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  FOR v_row IN
    SELECT setting_kind, gender, goal_id, asset_file_name, payload
    FROM public.platform_hero_goal_settings
  LOOP
    IF v_row.setting_kind = 'framing' THEN
      v_framing := v_framing || jsonb_build_object(
        public._hero_goal_framing_key(v_row.gender, v_row.goal_id, v_row.asset_file_name),
        v_row.payload
      );
    ELSE
      v_card_themes := v_card_themes || jsonb_build_object(
        public._hero_goal_card_theme_key(v_row.gender, v_row.goal_id),
        v_row.payload
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'framing', v_framing,
    'card_themes', v_card_themes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_hero_goal_framing(
  p_gender TEXT,
  p_goal_id TEXT,
  p_asset_file_name TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_payload JSONB;
  v_asset TEXT;
  v_row public.platform_hero_goal_settings%ROWTYPE;
BEGIN
  v_admin := public._require_staff_permission('content.manage');
  v_asset := btrim(COALESCE(p_asset_file_name, ''));
  IF p_gender NOT IN ('male', 'female') OR char_length(btrim(COALESCE(p_goal_id, ''))) = 0 OR v_asset = '' THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023';
  END IF;

  v_payload := public._validate_hero_goal_framing_payload(p_payload);

  INSERT INTO public.platform_hero_goal_settings (
    setting_kind, gender, goal_id, asset_file_name, payload, updated_by
  )
  VALUES ('framing', p_gender, btrim(p_goal_id), v_asset, v_payload, v_admin)
  ON CONFLICT (setting_kind, gender, goal_id, asset_file_name)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by
  RETURNING * INTO v_row;

  PERFORM public._write_audit_event(
    v_admin,
    NULL,
    'hero_goal_framing_saved',
    jsonb_build_object(
      'gender', v_row.gender,
      'goal_id', v_row.goal_id,
      'asset_file_name', v_row.asset_file_name,
      'payload', v_row.payload
    )
  );

  RETURN jsonb_build_object(
    'key', public._hero_goal_framing_key(v_row.gender, v_row.goal_id, v_row.asset_file_name),
    'payload', v_row.payload,
    'updated_at', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_hero_goal_card_theme(
  p_gender TEXT,
  p_goal_id TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_payload JSONB;
  v_row public.platform_hero_goal_settings%ROWTYPE;
BEGIN
  v_admin := public._require_staff_permission('content.manage');
  IF p_gender NOT IN ('male', 'female') OR char_length(btrim(COALESCE(p_goal_id, ''))) = 0 THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023';
  END IF;

  v_payload := public._validate_hero_goal_card_theme_payload(p_payload);

  IF v_payload ->> 'color' IS NULL THEN
    DELETE FROM public.platform_hero_goal_settings
    WHERE setting_kind = 'card_theme'
      AND gender = p_gender
      AND goal_id = btrim(p_goal_id)
      AND asset_file_name = '';

    PERFORM public._write_audit_event(
      v_admin,
      NULL,
      'hero_goal_card_theme_reset',
      jsonb_build_object('gender', p_gender, 'goal_id', btrim(p_goal_id))
    );

    RETURN jsonb_build_object(
      'key', public._hero_goal_card_theme_key(p_gender, btrim(p_goal_id)),
      'payload', jsonb_build_object('color', NULL),
      'updated_at', now()
    );
  END IF;

  INSERT INTO public.platform_hero_goal_settings (
    setting_kind, gender, goal_id, asset_file_name, payload, updated_by
  )
  VALUES ('card_theme', p_gender, btrim(p_goal_id), '', v_payload, v_admin)
  ON CONFLICT (setting_kind, gender, goal_id, asset_file_name)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by
  RETURNING * INTO v_row;

  PERFORM public._write_audit_event(
    v_admin,
    NULL,
    'hero_goal_card_theme_saved',
    jsonb_build_object(
      'gender', v_row.gender,
      'goal_id', v_row.goal_id,
      'payload', v_row.payload
    )
  );

  RETURN jsonb_build_object(
    'key', public._hero_goal_card_theme_key(v_row.gender, v_row.goal_id),
    'payload', v_row.payload,
    'updated_at', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_hero_goal_setting(
  p_kind TEXT,
  p_gender TEXT,
  p_goal_id TEXT,
  p_asset_file_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_asset TEXT;
BEGIN
  v_admin := public._require_staff_permission('content.manage');
  IF p_kind NOT IN ('framing', 'card_theme')
     OR p_gender NOT IN ('male', 'female')
     OR char_length(btrim(COALESCE(p_goal_id, ''))) = 0 THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023';
  END IF;

  v_asset := btrim(COALESCE(p_asset_file_name, ''));
  IF p_kind = 'framing' AND v_asset = '' THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023';
  END IF;
  IF p_kind = 'card_theme' THEN
    v_asset := '';
  END IF;

  DELETE FROM public.platform_hero_goal_settings
  WHERE setting_kind = p_kind
    AND gender = p_gender
    AND goal_id = btrim(p_goal_id)
    AND asset_file_name = v_asset;

  PERFORM public._write_audit_event(
    v_admin,
    NULL,
    'hero_goal_setting_reset',
    jsonb_build_object(
      'kind', p_kind,
      'gender', p_gender,
      'goal_id', btrim(p_goal_id),
      'asset_file_name', NULLIF(v_asset, '')
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON TABLE public.platform_hero_goal_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.client_get_hero_goal_settings() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_hero_goal_framing(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_hero_goal_card_theme(TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_hero_goal_setting(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.platform_hero_goal_settings TO service_role;
GRANT EXECUTE ON FUNCTION public.client_get_hero_goal_settings() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_hero_goal_framing(TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_hero_goal_card_theme(TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_hero_goal_setting(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
