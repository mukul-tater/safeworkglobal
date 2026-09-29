-- auth.refresh_tokens.user_id is varchar, not uuid. Comparing it directly
-- raised "operator does not exist: character varying = uuid" and rolled back
-- the password change.

CREATE OR REPLACE FUNCTION public.admin_set_partner_password(
  p_partner_id uuid,
  p_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_user_id uuid;
  v_center text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  IF p_password IS NULL
     OR length(p_password) < 6
     OR length(p_password) > 72
     OR p_password !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Use letters and numbers only, at least 6 characters. No spaces or symbols.';
  END IF;

  SELECT user_id, center_name
  INTO v_user_id, v_center
  FROM public.partner_profiles
  WHERE id = p_partner_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Centre not found';
  END IF;

  IF public.has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot change an admin password';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Login account not found';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = v_user_id;

  BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id::text = v_user_id::text;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;

  BEGIN
    DELETE FROM auth.sessions WHERE user_id = v_user_id;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;

  INSERT INTO public.admin_actions (
    admin_id, target_type, target_id, action, metadata
  ) VALUES (
    auth.uid(),
    'partner_profile',
    p_partner_id,
    'set_password',
    jsonb_build_object('partner_user_id', v_user_id, 'center_name', v_center)
  );
END;
$$;
