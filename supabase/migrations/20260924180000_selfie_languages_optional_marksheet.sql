-- Single migration for the Identity selfie.
-- The document-type rule already exists, so it is replaced with the same
-- list plus 'selfie'. No mother tongue column is created or removed.
-- Languages already exist on worker_profiles. The optional 10th marksheet
-- is handled in the app.

ALTER TABLE public.worker_documents
  DROP CONSTRAINT IF EXISTS worker_documents_document_type_check;

ALTER TABLE public.worker_documents
  ADD CONSTRAINT worker_documents_document_type_check
  CHECK (document_type IN (
    'resume',
    'passport',
    'passport_front',
    'passport_last',
    'visa',
    'certificate',
    'tenth_marksheet',
    'id_proof',
    'other',
    'pan',
    'aadhaar',
    'aadhaar_front',
    'aadhaar_back',
    'selfie'
  ));

NOTIFY pgrst, 'reload schema';
