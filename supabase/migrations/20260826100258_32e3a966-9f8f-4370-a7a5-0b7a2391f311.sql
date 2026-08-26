-- Default-deny self-update guards: any column not explicitly editable is protected,
-- so newly added sensitive columns are automatically safe.

CREATE OR REPLACE FUNCTION public.partner_profile_self_update_allowed(_new public.partner_profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _old public.partner_profiles%ROWTYPE;
  _editable text[] := ARRAY[
    'agency_name','license_number','regions_covered','bio','updated_at',
    'center_name','owner_name','mobile','whatsapp','email','state','district','address','pincode',
    'aadhaar_number','pan_number','aadhaar_front_url','aadhaar_back_url','pan_card_url','shop_photo_url',
    'years_in_operation','services_offered','monthly_footfall',
    'offers_passport_service','offers_doc_scanning','offers_worker_registration',
    'account_holder','account_number','ifsc','upi_id',
    'accepted_terms','accepted_privacy','confirmed_accuracy','current_step','submitted_at',
    'emitra_id','village_city','has_computer','has_scanner','has_printer','has_internet',
    'worker_categories','emitra_certificate_url','address_proof_url','owner_photo_url',
    'compliance_acknowledged_at','no_jobs_promise','no_unauthorized_fees','mobile_verified',
    'date_of_birth','google_maps_url',
    'agree_no_misrepresentation','agree_accurate_info','agree_not_sub_agent'
  ];
BEGIN
  SELECT * INTO _old FROM public.partner_profiles WHERE id = _new.id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN (to_jsonb(_new) - _editable) = (to_jsonb(_old) - _editable);
END;
$function$;

CREATE OR REPLACE FUNCTION public.partners_self_update_allowed(_new public.partners)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _old public.partners%ROWTYPE;
  _editable text[] := ARRAY['state','district','city','metadata','updated_at'];
BEGIN
  SELECT * INTO _old FROM public.partners WHERE id = _new.id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN (to_jsonb(_new) - _editable) = (to_jsonb(_old) - _editable);
END;
$function$;