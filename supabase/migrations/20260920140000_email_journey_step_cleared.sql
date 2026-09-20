-- Email workers (and keep the in-app row) when a GCC journey step is cleared.
-- Pre-declaration is not a worker_verification.stage, so it inserts its own
-- journey_step_cleared notification. Email is sent asynchronously via pg_net.
--
-- One-time ops (required for email, in-app still works without it):
--   1. Insert Vault secret name = journey_email_webhook_secret
--   2. Set the same value as JOURNEY_EMAIL_WEBHOOK_SECRET on
--      the email-journey-step-cleared edge function
--   3. Confirm LOVABLE_API_KEY is set (same as Contact Us)

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.journey_email_webhook_secret()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret text;
BEGIN
  BEGIN
    SELECT decrypted_secret
      INTO secret
      FROM vault.decrypted_secrets
     WHERE name = 'journey_email_webhook_secret'
     LIMIT 1;
  EXCEPTION WHEN undefined_table OR undefined_object THEN
    secret := NULL;
  END;

  IF secret IS NULL OR length(trim(secret)) = 0 THEN
    BEGIN
      secret := nullif(current_setting('app.settings.journey_email_webhook_secret', true), '');
    EXCEPTION WHEN OTHERS THEN
      secret := NULL;
    END;
  END IF;

  RETURN secret;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_journey_step_email(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_secret text;
  project_url text := 'https://etpiadoqryvtlpmiuxia.supabase.co';
BEGIN
  IF p_notification_id IS NULL THEN
    RETURN;
  END IF;

  webhook_secret := public.journey_email_webhook_secret();
  IF webhook_secret IS NULL THEN
    RAISE WARNING 'journey email skipped: journey_email_webhook_secret is not set';
    RETURN;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := project_url || '/functions/v1/email-journey-step-cleared',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || webhook_secret
      ),
      body := jsonb_build_object('notification_id', p_notification_id)
    );
  EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
    RAISE WARNING 'journey email skipped: pg_net is not available';
  WHEN OTHERS THEN
    RAISE WARNING 'journey email request failed for %: %', p_notification_id, SQLERRM;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_journey_step_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IS NOT DISTINCT FROM 'journey_step_cleared' THEN
    PERFORM public.request_journey_step_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_journey_step_email ON public.notifications;
CREATE TRIGGER trg_enqueue_journey_step_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_journey_step_email();

CREATE OR REPLACE FUNCTION public.notify_worker_pre_declaration_cleared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.user_id,
      'journey_step_cleared',
      'Pre-declaration cleared / प्री-डिक्लेरेशन पूरा',
      'You cleared Pre-declaration. You can now proceed to Essentials. / आपने प्री-डिक्लेरेशन पूरा कर लिया है। अब आवश्यक जानकारी पर जाएँ।',
      jsonb_build_object(
        'href', '/worker/journey',
        'cleared_stage', 'pre_declaration',
        'next_stage', 'essentials'
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'pre-declaration notification failed for %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_worker_pre_declaration_cleared ON public.worker_pre_journey_declarations;
CREATE TRIGGER trg_notify_worker_pre_declaration_cleared
  AFTER INSERT OR UPDATE OF completed_at ON public.worker_pre_journey_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_worker_pre_declaration_cleared();
