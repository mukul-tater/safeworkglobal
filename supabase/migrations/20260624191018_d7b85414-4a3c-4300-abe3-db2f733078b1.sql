
-- Revoke anonymous EXECUTE on admin-only and seed RPCs (they self-check has_role/admin, but anon should not even be able to call).
REVOKE EXECUTE ON FUNCTION public.seed_demo_users(jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.seed_officials_demo() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_job(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_mark_withdrawal_paid(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_whitelisted_admin() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.seed_demo_users(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_officials_demo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_withdrawal_paid(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_whitelisted_admin() TO authenticated;
