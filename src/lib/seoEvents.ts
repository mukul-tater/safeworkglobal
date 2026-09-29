import { supabase } from '@/integrations/supabase/client';

export type SeoEventType = 'landing_view' | 'job_view' | 'application_start' | 'application_complete' | 'registration_complete';

export function recordSeoEvent(eventType: SeoEventType, context: {
  path?: string;
  jobId?: string;
  country?: string;
  city?: string;
  category?: string;
} = {}) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const referrerHost = (() => {
    try { return document.referrer ? new URL(document.referrer).hostname : null; } catch { return null; }
  })();
  let sessionId: string | null = null;
  try {
    sessionId = sessionStorage.getItem('swg_seo_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('swg_seo_session', sessionId);
    }
  } catch { /* analytics must never block the page */ }
  void (supabase as any).from('seo_events').insert({
    event_type: eventType,
    path: context.path ?? window.location.pathname,
    job_id: context.jobId ?? null,
    country: context.country ?? null,
    city: context.city ?? null,
    category: context.category ?? null,
    referrer_host: referrerHost,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    session_id: sessionId,
  });
}