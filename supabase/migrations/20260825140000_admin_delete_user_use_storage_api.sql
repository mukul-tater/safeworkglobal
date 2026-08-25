-- Storage rejects DELETE FROM storage.objects in SQL ("Use the Storage API instead").
-- Remove that from admin_delete_user, let admins delete files via the Storage API,
-- and detach leftover storage.owner refs so auth.users can still be removed.

DROP POLICY IF EXISTS "Admins manage user storage objects" ON storage.objects;
CREATE POLICY "Admins manage user storage objects"
  ON storage.objects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

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

  -- Do not DELETE storage.objects here. Detach owner so auth.users delete is not blocked.
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
      AND n.nspname = 'public'
      AND array_length(con.conkey, 1) = 1
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
