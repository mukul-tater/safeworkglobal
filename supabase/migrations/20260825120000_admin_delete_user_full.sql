-- Full admin user deletion: unblock audit FKs, remove storage objects, then
-- delete auth.users so profile / role / journey rows cascade away.

-- Audit-style FKs default to NO ACTION and can block DELETE FROM auth.users.
-- Point them at ON DELETE SET NULL (and allow NULL on actioned_by).
DO $$
DECLARE
  target record;
  con record;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('user_moderation', 'actioned_by'),
      ('disputes', 'resolved_by'),
      ('content_flags', 'reviewed_by'),
      ('compliance_checks', 'reviewed_by'),
      ('worker_onboarding', 'verified_by'),
      ('onboarding_audit_logs', 'actor_id'),
      ('worker_documents', 'verified_by'),
      ('partner_worker_status_history', 'changed_by'),
      ('background_verifications', 'verified_by')
    ) AS t(table_name, column_name)
  LOOP
    IF to_regclass('public.' || target.table_name) IS NULL THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = target.table_name
        AND column_name = target.column_name
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
      target.table_name,
      target.column_name
    );

    FOR con IN
      SELECT pg_constraint.conname
      FROM pg_constraint
      JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      JOIN pg_attribute ON pg_attribute.attrelid = pg_class.oid
        AND pg_attribute.attnum = ANY (pg_constraint.conkey)
      WHERE pg_constraint.contype = 'f'
        AND pg_namespace.nspname = 'public'
        AND pg_class.relname = target.table_name
        AND pg_attribute.attname = target.column_name
        AND array_length(pg_constraint.conkey, 1) = 1
    LOOP
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        target.table_name,
        con.conname
      );
    END LOOP;

    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
        target.table_name,
        target.table_name || '_' || target.column_name || '_fkey',
        target.column_name
      );
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  admin_id uuid := auth.uid();
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

  -- Rows that store user ids without an FK to auth.users (would otherwise be orphaned)
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

  -- Uploaded files are not cascaded by auth.users
  BEGIN
    DELETE FROM storage.objects
    WHERE name = p_user_id::text
       OR name LIKE p_user_id::text || '/%'
       OR name LIKE '%/' || p_user_id::text || '/%'
       OR owner = p_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      DELETE FROM storage.objects
      WHERE name = p_user_id::text
         OR name LIKE p_user_id::text || '/%'
         OR name LIKE '%/' || p_user_id::text || '/%';
    WHEN undefined_table THEN
      NULL;
  END;

  -- Break leftover FKs to this user (NO ACTION / RESTRICT) so auth delete can proceed
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
      AND fn.nspname = 'auth'
      AND fc.relname = 'users'
      AND con.confdeltype IN ('a', 'r')
      AND n.nspname IN ('public', 'storage')
      AND array_length(con.conkey, 1) = 1
      AND NOT (n.nspname = 'storage' AND c.relname = 'objects')
  LOOP
    IF rec.is_nullable
       OR rec.column_name IN (
         'actioned_by', 'verified_by', 'reviewed_by', 'resolved_by',
         'changed_by', 'actor_id', 'flagged_by', 'interviewer_user_id'
       )
    THEN
      EXECUTE format(
        'UPDATE %I.%I SET %I = NULL WHERE %I = $1',
        rec.schema_name, rec.table_name, rec.column_name, rec.column_name
      ) USING p_user_id;
    ELSE
      EXECUTE format(
        'DELETE FROM %I.%I WHERE %I = $1',
        rec.schema_name, rec.table_name, rec.column_name
      ) USING p_user_id;
    END IF;
  END LOOP;

  DELETE FROM auth.users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO service_role;
