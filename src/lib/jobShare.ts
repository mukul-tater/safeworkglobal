import { supabase } from "@/integrations/supabase/client";

const OPEN_STORAGE_PREFIX = "job-share-open:";

export type JobShareRow = {
  share_id: string;
  job_id: string;
  sharer_role: string;
  sharer_name: string;
  partner_code: string | null;
  created_at: string;
  open_count: number;
};

export function absoluteJobUrl(slug: string, code?: string | null) {
  const path = `/jobs/${slug}`;
  const url = `${window.location.origin}${path}`;
  if (!code) return url;
  return `${url}?s=${encodeURIComponent(code)}`;
}

export function whatsappShareUrl(title: string, url: string) {
  const text = `Check out this job: ${title}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function createJobShare(jobId: string) {
  const { data, error } = await supabase.rpc("create_job_share", { p_job_id: jobId });
  if (error) throw error;
  if (!data) throw new Error("Could not create a share link");
  return data;
}

export async function recordJobShareOpen(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return;
  const key = OPEN_STORAGE_PREFIX + trimmed.toUpperCase();
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    // Private browsing can block session storage. Still record the open once.
  }

  const { error } = await supabase.rpc("record_job_share_open", { p_code: trimmed });
  if (error) return;

  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // The open is already stored. A refresh in this tab may count again.
  }
}

export async function listAdminJobShares(): Promise<JobShareRow[]> {
  const { data, error } = await supabase.rpc("admin_list_job_shares");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    partner_code: row.partner_code ?? null,
    open_count: Number(row.open_count ?? 0),
  }));
}
