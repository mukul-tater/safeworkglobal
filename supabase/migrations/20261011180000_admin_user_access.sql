-- Admin can disable, enable, or delete any non-admin account:
-- workers, employers, e-Mitra (SEN), trade-test centres (SSVN), RAs (SRN), and other partners.
-- Disable bans the auth user so they cannot sign in, and suspends a partner centre.
-- Enable clears the ban and restores the centre status from before the disable.

CREATE OR REPLACE FUNCTION public.admin_clear_blocking_fks(
  p_schema text,
  p_table text,
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      a.attname AS column_name,
      NOT a.attnotnull AS is_nullable
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY (con.conkey)
    JOIN pg_class fc ON fc.oid = con.confrelid
    JOIN pg_namespace fn ON fn.oid = fc.relnamespace
    WHERE con.contype = 'f'
      AND fn.nspname = p_schema
      AND fc.relname = p_table
      AND con.confdeltype IN ('a', 'r')
      AND array_length(con.conkey, 1) = 1
      AND n.nspname = 'public'
  LOOP
    IF rec.is_nullable THEN
      EXECUTE format(
        'UPDATE %I.%I SET %I = NULL WHERE %I = $1',
        rec.schema_name, rec.table_name, rec.column_name, rec.column_name
      ) USING p_id;
    ELSE
      EXECUTE format(
        'DELETE FROM %I.%I WHERE %I = $1',
        rec.schema_name, rec.table_name, rec.column_name
      ) USING p_id;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_blocking_fks(text, text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_enabled(
  p_user_id uuid,
  p_enabled boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid := auth.uid();
  v_partner_id uuid;
  v_partner_status text;
  v_profile_status text;
  v_notes text;
  v_snapshot jsonb := '{}'::jsonb;
  v_restore_partner text;
  v_restore_profile text;
BEGIN
  IF NOT public.has_role(admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User id is required';
  END IF;

  IF p_user_id = admin_id THEN
    RAISE EXCEPTION 'Cannot change access for your own account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Cannot disable or enable admin users';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'Enabled flag is required';
  END IF;

  IF NOT p_enabled AND btrim(COALESCE(p_reason, '')) = '' THEN
    RAISE EXCEPTION 'A reason is required to disable a user';
  END IF;

  IF to_regclass('public.partners') IS NOT NULL THEN
    SELECT id, status::text
      INTO v_partner_id, v_partner_status
    FROM public.partners
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  IF to_regclass('public.partner_profiles') IS NOT NULL THEN
    SELECT status::text
      INTO v_profile_status
    FROM public.partner_profiles
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  IF NOT p_enabled THEN
    SELECT notes INTO v_notes
    FROM public.user_moderation
    WHERE user_id = p_user_id
      AND is_active = true
      AND action IN ('banned', 'blocked', 'suspended')
    ORDER BY created_at DESC
    LIMIT 1;

    BEGIN
      IF v_notes IS NOT NULL AND left(btrim(v_notes), 1) = '{' THEN
        v_snapshot := v_notes::jsonb;
      END IF;
    EXCEPTION
      WHEN others THEN
        v_snapshot := '{}'::jsonb;
    END;

    IF v_partner_status IS NOT NULL
       AND v_partner_status <> 'suspended'
       AND NOT (v_snapshot ? 'partners_status') THEN
      v_snapshot := v_snapshot || jsonb_build_object('partners_status', v_partner_status);
    END IF;

    IF v_profile_status IS NOT NULL
       AND v_profile_status <> 'suspended'
       AND NOT (v_snapshot ? 'partner_profiles_status') THEN
      v_snapshot := v_snapshot || jsonb_build_object('partner_profiles_status', v_profile_status);
    END IF;

    UPDATE auth.users
    SET banned_until = timestamptz '2099-01-01 00:00:00+00'
    WHERE id = p_user_id;

    IF v_partner_id IS NOT NULL AND v_partner_status IS DISTINCT FROM 'suspended' THEN
      UPDATE public.partners
      SET status = 'suspended'::public.partner_org_status,
          rejection_reason = btrim(p_reason),
          updated_at = now()
      WHERE id = v_partner_id;
    END IF;

    IF v_profile_status IS NOT NULL AND v_profile_status IS DISTINCT FROM 'suspended' THEN
      UPDATE public.partner_profiles
      SET status = 'suspended'::public.partner_status,
          rejection_reason = btrim(p_reason),
          reviewed_by = admin_id,
          reviewed_at = now()
      WHERE user_id = p_user_id;
    END IF;

    UPDATE public.user_moderation
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    INSERT INTO public.user_moderation (user_id, action, reason, actioned_by, is_active, notes)
    VALUES (
      p_user_id,
      'banned',
      btrim(p_reason),
      admin_id,
      true,
      v_snapshot::text
    );
  ELSE
    SELECT notes INTO v_notes
    FROM public.user_moderation
    WHERE user_id = p_user_id
      AND is_active = true
      AND action IN ('banned', 'blocked', 'suspended')
    ORDER BY created_at DESC
    LIMIT 1;

    BEGIN
      IF v_notes IS NOT NULL AND left(btrim(v_notes), 1) = '{' THEN
        v_snapshot := v_notes::jsonb;
      END IF;
    EXCEPTION
      WHEN others THEN
        v_snapshot := '{}'::jsonb;
    END;

    v_restore_partner := v_snapshot->>'partners_status';
    v_restore_profile := v_snapshot->>'partner_profiles_status';

    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = p_user_id;

    IF v_partner_id IS NOT NULL AND v_partner_status = 'suspended' THEN
      IF v_restore_partner IS NULL OR v_restore_partner NOT IN ('pending', 'approved', 'rejected') THEN
        v_restore_partner := 'approved';
      END IF;
      UPDATE public.partners
      SET status = v_restore_partner::public.partner_org_status,
          rejection_reason = CASE WHEN v_restore_partner = 'rejected' THEN rejection_reason ELSE NULL END,
          approved_at = CASE WHEN v_restore_partner = 'approved' THEN COALESCE(approved_at, now()) ELSE approved_at END,
          approved_by = CASE WHEN v_restore_partner = 'approved' THEN COALESCE(approved_by, admin_id) ELSE approved_by END,
          updated_at = now()
      WHERE id = v_partner_id;
    END IF;

    IF v_profile_status = 'suspended' THEN
      IF v_restore_profile IS NULL
         OR v_restore_profile NOT IN ('applied', 'under_review', 'approved', 'active', 'rejected') THEN
        v_restore_profile := 'active';
      END IF;
      UPDATE public.partner_profiles
      SET status = v_restore_profile::public.partner_status,
          rejection_reason = CASE WHEN v_restore_profile = 'rejected' THEN rejection_reason ELSE NULL END,
          reviewed_by = admin_id,
          reviewed_at = now(),
          approved_by = CASE WHEN v_restore_profile IN ('approved', 'active') THEN COALESCE(approved_by, admin_id) ELSE approved_by END,
          approved_at = CASE WHEN v_restore_profile IN ('approved', 'active') THEN COALESCE(approved_at, now()) ELSE approved_at END
      WHERE user_id = p_user_id;
    END IF;

    UPDATE public.user_moderation
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;

    INSERT INTO public.user_moderation (user_id, action, reason, actioned_by, is_active, notes)
    VALUES (
      p_user_id,
      'unbanned',
      COALESCE(NULLIF(btrim(p_reason), ''), 'Enabled by admin'),
      admin_id,
      false,
      NULL
    );
  END IF;

  BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id::text = p_user_id::text;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      NULL;
  END;

  BEGIN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_enabled(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_enabled(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_enabled(uuid, boolean, text) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid := auth.uid();
  v_partner_id uuid;
  v_profile_id uuid;
BEGIN
  IF NOT public.has_role(admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User id is required';
  END IF;

  IF p_user_id = admin_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Cannot delete admin users';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF to_regclass('public.employer_worker_assignments') IS NOT NULL THEN
    DELETE FROM public.employer_worker_assignments
    WHERE worker_user_id = p_user_id OR assigned_by = p_user_id;
  END IF;

  IF to_regclass('public.employer_org_members') IS NOT NULL THEN
    DELETE FROM public.employer_org_members WHERE user_id = p_user_id;
  END IF;

  IF to_regclass('public.employer_organizations') IS NOT NULL THEN
    DELETE FROM public.employer_organizations
    WHERE owner_user_id = p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.employer_org_members m
        WHERE m.org_id = employer_organizations.id
      );
    UPDATE public.employer_organizations
    SET owner_user_id = NULL
    WHERE owner_user_id = p_user_id;
  END IF;

  IF to_regclass('public.employer_worker_access_rules') IS NOT NULL THEN
    UPDATE public.employer_worker_access_rules
    SET created_by = NULL
    WHERE created_by = p_user_id;
  END IF;

  BEGIN
    UPDATE storage.objects
    SET owner = NULL
    WHERE owner = p_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
    WHEN undefined_table THEN
      NULL;
  END;

  -- Partner orgs (e-Mitra, trade test, RA) cascade from auth.users.
  -- Clear NO ACTION links first so assessments and similar rows do not block delete.
  IF to_regclass('public.partners') IS NOT NULL THEN
    FOR v_partner_id IN
      SELECT id FROM public.partners WHERE user_id = p_user_id
    LOOP
      PERFORM public.admin_clear_blocking_fks('public', 'partners', v_partner_id);
    END LOOP;
  END IF;

  IF to_regclass('public.partner_profiles') IS NOT NULL THEN
    FOR v_profile_id IN
      SELECT id FROM public.partner_profiles WHERE user_id = p_user_id
    LOOP
      PERFORM public.admin_clear_blocking_fks('public', 'partner_profiles', v_profile_id);
    END LOOP;
  END IF;

  PERFORM public.admin_clear_blocking_fks('auth', 'users', p_user_id);

  BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id::text = p_user_id::text;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      NULL;
  END;

  BEGIN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      NULL;
  END;

  DELETE FROM auth.users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO service_role;
