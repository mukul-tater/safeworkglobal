-- Allow PAN / Aadhaar document types used by Identity (KYC).

ALTER TABLE public.worker_documents
  DROP CONSTRAINT IF EXISTS worker_documents_document_type_check;

ALTER TABLE public.worker_documents
  ADD CONSTRAINT worker_documents_document_type_check
  CHECK (document_type IN (
    'resume',
    'passport',
    'visa',
    'certificate',
    'id_proof',
    'other',
    'pan',
    'aadhaar',
    'aadhaar_front',
    'aadhaar_back'
  ));
