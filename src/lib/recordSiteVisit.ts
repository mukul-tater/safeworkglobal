import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'swg_visit_recorded';

export type SiteVisitDay = { date: string; count: number };

export type SiteVisitStats = {
  all_time: number;
  today: number;
  yesterday: number;
  last_7: number;
  series: SiteVisitDay[];
};

function isInternalAdminPath(pathname = window.location.pathname) {
  return /^\/(admin|interviewer)(\/|$)/.test(pathname);
}

/** Count this browser session once. Skips admin / interviewer portals. */
export function recordSiteVisitOnce() {
  if (typeof window === 'undefined' || isInternalAdminPath()) return;

  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
  } catch {
    return;
  }

  void (supabase as any)
    .rpc('record_site_visit')
    .then(({ error }: { error: { message?: string } | null }) => {
      if (error) return;
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore quota / private-mode */
      }
    });
}

export async function getSiteVisitStats(): Promise<SiteVisitStats> {
  const empty: SiteVisitStats = {
    all_time: 0,
    today: 0,
    yesterday: 0,
    last_7: 0,
    series: [],
  };

  const { data, error } = await (supabase as any).rpc('get_site_visit_stats');
  if (error || !data || typeof data !== 'object') return empty;

  const row = data as Record<string, unknown>;
  const series = Array.isArray(row.series)
    ? row.series.map((item) => {
        const day = item as Record<string, unknown>;
        return {
          date: String(day.date || ''),
          count: Number(day.count) || 0,
        };
      })
    : [];

  return {
    all_time: Number(row.all_time) || 0,
    today: Number(row.today) || 0,
    yesterday: Number(row.yesterday) || 0,
    last_7: Number(row.last_7) || 0,
    series,
  };
}
