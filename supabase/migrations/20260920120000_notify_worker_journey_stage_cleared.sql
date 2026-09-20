-- In-app notification when a worker clears a GCC journey step and can proceed.
-- Fires on forward stage advances only (rewinds and same-nav find_jobs→apply_job are skipped).

CREATE OR REPLACE FUNCTION public.notify_worker_journey_stage_cleared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_stage text := OLD.stage;
  new_stage text := NEW.stage;
  old_rank integer;
  new_rank integer;
  cleared_en text;
  cleared_short_en text;
  cleared_short_hi text;
  next_en text;
  next_hi text;
  title_text text;
  message_text text;
  used_pass_verb boolean;
BEGIN
  IF old_stage IS NOT DISTINCT FROM new_stage THEN
    RETURN NEW;
  END IF;

  -- Same nav step: Find jobs + apply. Wait until they land on Test 1.
  IF old_stage = 'find_jobs' AND new_stage = 'apply_job' THEN
    RETURN NEW;
  END IF;

  old_rank := CASE old_stage
    WHEN 'essentials' THEN 10
    WHEN 'find_jobs' THEN 20
    WHEN 'apply_job' THEN 30
    WHEN 'quiz' THEN 40
    WHEN 'media' THEN 50
    WHEN 'identity' THEN 60
    WHEN 'awaiting_interview' THEN 70
    WHEN 'awaiting_payment' THEN 80
    WHEN 'trade_test' THEN 90
    WHEN 'tests' THEN 90
    WHEN 'medical' THEN 100
    WHEN 'bond' THEN 110
    WHEN 'pdot' THEN 120
    WHEN 'deployment' THEN 130
    WHEN 'gcc_ready' THEN 140
    ELSE 0
  END;

  new_rank := CASE new_stage
    WHEN 'essentials' THEN 10
    WHEN 'find_jobs' THEN 20
    WHEN 'apply_job' THEN 30
    WHEN 'quiz' THEN 40
    WHEN 'media' THEN 50
    WHEN 'identity' THEN 60
    WHEN 'awaiting_interview' THEN 70
    WHEN 'awaiting_payment' THEN 80
    WHEN 'trade_test' THEN 90
    WHEN 'tests' THEN 90
    WHEN 'medical' THEN 100
    WHEN 'bond' THEN 110
    WHEN 'pdot' THEN 120
    WHEN 'deployment' THEN 130
    WHEN 'gcc_ready' THEN 140
    ELSE 0
  END;

  -- Rewind or unknown stage: do not notify.
  IF new_rank <= old_rank THEN
    RETURN NEW;
  END IF;

  SELECT
    x.cleared_en, x.cleared_short_en, x.cleared_short_hi, x.used_pass
  INTO cleared_en, cleared_short_en, cleared_short_hi, used_pass_verb
  FROM (
    SELECT
      CASE old_stage
        WHEN 'essentials' THEN 'Essentials'
        WHEN 'find_jobs' THEN 'Find jobs'
        WHEN 'apply_job' THEN 'Find jobs'
        WHEN 'quiz' THEN 'Test 1 — Basic trade knowledge'
        WHEN 'media' THEN 'Skill proof upload'
        WHEN 'identity' THEN 'Identity (KYC)'
        WHEN 'awaiting_interview' THEN 'Test 2 — Video interview'
        WHEN 'awaiting_payment' THEN 'Payment'
        WHEN 'trade_test' THEN 'Test 3 — Physical trade test'
        WHEN 'tests' THEN 'Test 3 — Physical trade test'
        WHEN 'medical' THEN 'Medical test'
        WHEN 'bond' THEN 'Bond & Security'
        WHEN 'pdot' THEN 'PDOT training'
        WHEN 'deployment' THEN 'Deployment'
        ELSE coalesce(old_stage, 'step')
      END AS cleared_en,
      CASE old_stage
        WHEN 'essentials' THEN 'Essentials'
        WHEN 'find_jobs' THEN 'Find jobs'
        WHEN 'apply_job' THEN 'Find jobs'
        WHEN 'quiz' THEN 'Test 1'
        WHEN 'media' THEN 'Skill proof'
        WHEN 'identity' THEN 'Identity'
        WHEN 'awaiting_interview' THEN 'Test 2'
        WHEN 'awaiting_payment' THEN 'Payment'
        WHEN 'trade_test' THEN 'Test 3'
        WHEN 'tests' THEN 'Test 3'
        WHEN 'medical' THEN 'Medical test'
        WHEN 'bond' THEN 'Bond & Security'
        WHEN 'pdot' THEN 'PDOT'
        WHEN 'deployment' THEN 'Deployment'
        ELSE 'Step'
      END AS cleared_short_en,
      CASE old_stage
        WHEN 'essentials' THEN 'आवश्यक जानकारी'
        WHEN 'find_jobs' THEN 'नौकरी खोजें'
        WHEN 'apply_job' THEN 'नौकरी खोजें'
        WHEN 'quiz' THEN 'टेस्ट 1'
        WHEN 'media' THEN 'स्किल प्रूफ'
        WHEN 'identity' THEN 'पहचान'
        WHEN 'awaiting_interview' THEN 'टेस्ट 2'
        WHEN 'awaiting_payment' THEN 'भुगतान'
        WHEN 'trade_test' THEN 'टेस्ट 3'
        WHEN 'tests' THEN 'टेस्ट 3'
        WHEN 'medical' THEN 'मेडिकल टेस्ट'
        WHEN 'bond' THEN 'बॉन्ड'
        WHEN 'pdot' THEN 'PDOT'
        WHEN 'deployment' THEN 'डिप्लॉयमेंट'
        ELSE 'चरण'
      END AS cleared_short_hi,
      (old_stage IN ('quiz', 'awaiting_interview', 'trade_test', 'tests', 'medical')) AS used_pass
  ) x;

  SELECT x.next_en, x.next_hi
  INTO next_en, next_hi
  FROM (
    SELECT
      CASE new_stage
        WHEN 'essentials' THEN 'Essentials'
        WHEN 'find_jobs' THEN 'Find jobs'
        WHEN 'apply_job' THEN 'Find jobs'
        WHEN 'quiz' THEN 'Test 1 — Basic trade knowledge'
        WHEN 'media' THEN 'Skill proof upload'
        WHEN 'identity' THEN 'Identity (KYC)'
        WHEN 'awaiting_interview' THEN 'Test 2 — Video interview'
        WHEN 'awaiting_payment' THEN 'Payment'
        WHEN 'trade_test' THEN 'Test 3 — Physical trade test'
        WHEN 'tests' THEN 'Test 3 — Physical trade test'
        WHEN 'medical' THEN 'Medical test'
        WHEN 'bond' THEN 'Bond & Security'
        WHEN 'pdot' THEN 'PDOT training'
        WHEN 'deployment' THEN 'Deployment'
        WHEN 'gcc_ready' THEN 'GCC ready'
        ELSE coalesce(new_stage, 'the next step')
      END AS next_en,
      CASE new_stage
        WHEN 'essentials' THEN 'आवश्यक जानकारी'
        WHEN 'find_jobs' THEN 'नौकरी खोजें'
        WHEN 'apply_job' THEN 'नौकरी खोजें'
        WHEN 'quiz' THEN 'टेस्ट 1 — बुनियादी ट्रेड ज्ञान'
        WHEN 'media' THEN 'स्किल प्रूफ अपलोड'
        WHEN 'identity' THEN 'पहचान (KYC)'
        WHEN 'awaiting_interview' THEN 'टेस्ट 2 — वीडियो इंटरव्यू'
        WHEN 'awaiting_payment' THEN 'भुगतान'
        WHEN 'trade_test' THEN 'टेस्ट 3 — फिजिकल ट्रेड टेस्ट'
        WHEN 'tests' THEN 'टेस्ट 3 — फिजिकल ट्रेड टेस्ट'
        WHEN 'medical' THEN 'मेडिकल टेस्ट'
        WHEN 'bond' THEN 'बॉन्ड और सिक्योरिटी'
        WHEN 'pdot' THEN 'PDOT प्रशिक्षण'
        WHEN 'deployment' THEN 'डिप्लॉयमेंट'
        WHEN 'gcc_ready' THEN 'GCC रेडी'
        ELSE coalesce(new_stage, 'अगला कदम')
      END AS next_hi
  ) x;

  title_text := cleared_short_en || ' cleared / ' || cleared_short_hi || ' पूरा';

  IF new_stage IN ('gcc_ready', 'deployment') THEN
    message_text :=
      'You cleared ' || cleared_en || '. You''re GCC ready. / आपने '
      || cleared_short_hi
      || CASE WHEN used_pass_verb THEN ' पास कर लिया है। ' ELSE ' पूरा कर लिया है। ' END
      || 'आप GCC रेडी हैं।';
  ELSE
    message_text :=
      'You cleared ' || cleared_en || '. You can now proceed to ' || next_en || '. / आपने '
      || cleared_short_hi
      || CASE WHEN used_pass_verb THEN ' पास कर लिया है। अब ' ELSE ' पूरा कर लिया है। अब ' END
      || next_hi || ' पर जाएँ।';
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.user_id,
      'journey_step_cleared',
      title_text,
      message_text,
      jsonb_build_object(
        'href', '/worker/journey',
        'cleared_stage', old_stage,
        'next_stage', new_stage
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'journey step notification failed for %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_worker_journey_stage_cleared ON public.worker_verification;
CREATE TRIGGER trg_notify_worker_journey_stage_cleared
  AFTER UPDATE OF stage ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_worker_journey_stage_cleared();
