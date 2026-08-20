-- Identity KYC uploads: passport first/last page as distinct document types.

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
    'id_proof',
    'other',
    'pan',
    'aadhaar',
    'aadhaar_front',
    'aadhaar_back'
  ));

NOTIFY pgrst, 'reload schema';
