-- Approve the local E-Mitra test partner created by scripts/create-emitra.mjs
-- Email: emitra@safeworkglobal.com
-- Run in Supabase Dashboard → SQL Editor (project etpiadoqryvtlpmiuxia).

DO $$
DECLARE
  v_uid uuid := 'c15ca05a-0a99-4223-a3b8-a172a2298365'::uuid;
  v_sen uuid;
  v_org uuid;
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('full_name', 'Kailash eMitra', 'role', 'partner', 'mobile_verified', true)
  WHERE id = v_uid;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'partner')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.partner_profiles
  SET status = 'approved',
      approved_at = COALESCE(approved_at, now()),
      compliance_acknowledged_at = COALESCE(compliance_acknowledged_at, now()),
      submitted_at = COALESCE(submitted_at, now()),
      current_step = 6,
      mobile_verified = true
  WHERE user_id = v_uid;

  SELECT id INTO v_sen FROM public.partner_types WHERE code = 'SEN';

  IF v_sen IS NOT NULL THEN
    INSERT INTO public.partners (
      user_id, partner_type_id, status, verification_status, state, district, city, approved_at
    ) VALUES (
      v_uid, v_sen, 'approved', 'verified', 'Rajasthan', 'Jaipur', 'Jaipur', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      partner_type_id = EXCLUDED.partner_type_id,
      status = 'approved',
      verification_status = 'verified',
      approved_at = COALESCE(public.partners.approved_at, now())
    RETURNING id INTO v_org;

    INSERT INTO public.partner_profiles_ext (partner_id, company_name, owner_name, mobile, email)
    VALUES (v_org, 'SafeWork Jaipur eMitra', 'Kailash eMitra', '9876500123', 'emitra@safeworkglobal.com')
    ON CONFLICT (partner_id) DO NOTHING;

    INSERT INTO public.partner_wallets (partner_id, available_balance)
    VALUES (v_org, 0)
    ON CONFLICT (partner_id) DO NOTHING;
  END IF;
END $$;

SELECT u.email, r.role, pp.status AS emitra_status, p.status AS org_status, p.partner_code
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.partner_profiles pp ON pp.user_id = u.id
LEFT JOIN public.partners p ON p.user_id = u.id
WHERE u.id = 'c15ca05a-0a99-4223-a3b8-a172a2298365'::uuid;
