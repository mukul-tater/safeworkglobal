-- Add interviewer app role for video-interview decisions (approve → unlock payment).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'interviewer';
