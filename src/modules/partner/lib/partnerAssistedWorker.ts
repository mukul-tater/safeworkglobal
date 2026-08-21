import { supabase } from "@/integrations/supabase/client";
import { partnerTypeConfig } from "../config/partnerTypes";

type PartnerWorkerSource =
  | { type: "emitra"; partnerProfileId: string; orgId?: string }
  | { type: "partner"; orgId?: string };

export const PARTNER_ADD_WORKER_PATH = "/partner/add-worker";
export const PARTNER_MY_WORKERS_PATH = "/partner/my-workers";

const PARK_KEY = "swg_parked_partner_session";

export type ParkedPartnerSession = {
  access_token: string;
  refresh_token: string;
  returnTo: string;
};

export type PartnerAddWorkerContext = {
  allowed: boolean;
  returnTo: string;
  myWorkersPath: string;
  source: PartnerWorkerSource;
  status: string | null;
};

const BLOCKED_ADD_WORKER_STATUSES = new Set(["rejected", "suspended"]);

/** Partners may add workers before admin approval. Rejected/suspended accounts cannot. */
export function partnerCanAddWorkers(status: string | null | undefined): boolean {
  if (!status) return true;
  return !BLOCKED_ADD_WORKER_STATUSES.has(status);
}

export function parkPartnerSession(session: ParkedPartnerSession) {
  try {
    sessionStorage.setItem(PARK_KEY, JSON.stringify(session));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getParkedPartnerSession(): ParkedPartnerSession | null {
  try {
    const raw = sessionStorage.getItem(PARK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ParkedPartnerSession;
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearParkedPartnerSession() {
  try {
    sessionStorage.removeItem(PARK_KEY);
  } catch {
    /* ignore */
  }
}

export function hasParkedPartnerSession(): boolean {
  return getParkedPartnerSession() !== null;
}

export async function restoreParkedPartnerSession(): Promise<string> {
  const parked = getParkedPartnerSession();
  if (!parked) {
    throw new Error("Partner session was lost. Please sign in again.");
  }
  await supabase.auth.signOut();
  const { error } = await supabase.auth.setSession({
    access_token: parked.access_token,
    refresh_token: parked.refresh_token,
  });
  if (error) {
    throw new Error("Could not return to the partner portal. Please sign in again.");
  }
  clearParkedPartnerSession();
  return parked.returnTo || "/partner/dashboard";
}

function landingForPartnerType(code: string | null | undefined): string | null {
  if (!code) return null;
  return partnerTypeConfig[code]?.landing ?? null;
}

/** Any signed-in partner (except rejected/suspended) can add workers, including before admin approval. */
export async function resolvePartnerAddWorkerContext(
  userId: string,
): Promise<PartnerAddWorkerContext> {
  const [{ data: emitra }, { data: rows }] = await Promise.all([
    supabase
      .from("partner_profiles")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle(),
    (supabase as any).rpc("current_partner"),
  ]);

  const org = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  const status = (org?.status as string | undefined) ?? emitra?.status ?? null;
  const emitraProfile = !!emitra?.id;

  const returnTo =
    landingForPartnerType(org?.partner_type_code) ||
    (emitraProfile ? "/emitra/dashboard" : "/partner/dashboard");

  const source: PartnerWorkerSource = emitraProfile
    ? { type: "emitra", partnerProfileId: emitra.id, orgId: org?.id }
    : { type: "partner", orgId: org?.id };

  return {
    allowed: partnerCanAddWorkers(status),
    returnTo,
    myWorkersPath: emitraProfile ? "/emitra/my-workers" : "/partner/my-workers",
    source,
    status,
  };
}
