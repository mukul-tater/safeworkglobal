import { supabase } from "@/integrations/supabase/client";
import { partnerTypeConfig } from "../config/partnerTypes";

type PartnerWorkerSource =
  | { type: "emitra"; partnerProfileId: string; orgId?: string }
  | { type: "partner"; orgId?: string };

export const PARTNER_ADD_WORKER_PATH = "/partner/add-worker";
export const PARTNER_MY_WORKERS_PATH = "/partner/my-workers";
export const CREATED_BY_PARTNER_LABEL = "Created by partner";

const PARTNER_TYPE_DISPLAY_NAMES: Record<string, string> = {
  SEN: "eMitra",
  SSVN: "SSVN",
  ITI: "ITI",
  SRN: "SRN",
  CONSULTANT: "Consultant",
  SEN_GLOBAL: "SEN Global",
};

export function partnerDisplayName(opts: {
  sourceType?: "emitra" | "partner" | string | null;
  partnerTypeCode?: string | null;
}): string {
  if (opts.sourceType === "emitra") return "eMitra";
  const code = (opts.partnerTypeCode || "").toUpperCase();
  if (code === "SEN") return "eMitra";
  return PARTNER_TYPE_DISPLAY_NAMES[code] || "partner";
}

/** e.g. "Created by eMitra" / "Created by ITI". */
export function createdByAttribution(opts: {
  sourceType?: "emitra" | "partner" | string | null;
  partnerTypeCode?: string | null;
}): string {
  const name = partnerDisplayName(opts);
  return name === "partner" ? CREATED_BY_PARTNER_LABEL : `Created by ${name}`;
}

export function partnerWorkerJourneyPath(workerUserId: string) {
  return `/partner/workers/${workerUserId}/journey`;
}

const PARK_KEY = "swg_parked_partner_session";
const WORKER_RESUME_KEY = "swg_parked_worker_resume";
const WORKER_RESUME_TTL_MS = 30 * 60 * 1000;

export type ParkedPartnerSession = {
  access_token: string;
  refresh_token: string;
  returnTo: string;
};

export type ParkedWorkerResume = {
  access_token: string;
  refresh_token: string;
  userId: string;
  mobile: string;
  ts: number;
};

export type PartnerAddWorkerContext = {
  allowed: boolean;
  returnTo: string;
  myWorkersPath: string;
  source: PartnerWorkerSource;
  status: string | null;
  partnerTypeCode: string | null;
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
  clearParkedWorkerResume();
  return parked.returnTo || PARTNER_MY_WORKERS_PATH;
}

export function parkWorkerResume(session: Omit<ParkedWorkerResume, "ts">) {
  try {
    sessionStorage.setItem(
      WORKER_RESUME_KEY,
      JSON.stringify({ ...session, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function getParkedWorkerResume(): ParkedWorkerResume | null {
  try {
    const raw = sessionStorage.getItem(WORKER_RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ParkedWorkerResume;
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.userId) return null;
    if (parsed.ts && Date.now() - parsed.ts > WORKER_RESUME_TTL_MS) {
      clearParkedWorkerResume();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearParkedWorkerResume() {
  try {
    sessionStorage.removeItem(WORKER_RESUME_KEY);
  } catch {
    /* ignore */
  }
}

export function hasParkedWorkerResume(): boolean {
  return getParkedWorkerResume() !== null;
}

/**
 * Partner stays signed in after create. Call this when they choose to fill
 * the worker's GCC journey now: park the partner, switch to the worker.
 */
export async function continueParkedWorkerJourney(partnerReturnTo: string): Promise<{
  userId: string;
  mobile: string;
}> {
  const worker = getParkedWorkerResume();
  if (!worker) {
    throw new Error(
      "This session can no longer open the worker journey. Ask the worker to sign in, or add them again.",
    );
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token || !data.session.refresh_token) {
    throw new Error("Partner session was lost. Please sign in again.");
  }

  parkPartnerSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    returnTo: partnerReturnTo || PARTNER_MY_WORKERS_PATH,
  });

  const { error } = await supabase.auth.setSession({
    access_token: worker.access_token,
    refresh_token: worker.refresh_token,
  });
  if (error) {
    clearParkedPartnerSession();
    throw new Error(
      "Could not open the worker journey. Ask the worker to sign in with the mobile and password you set.",
    );
  }
  clearParkedWorkerResume();
  return { userId: worker.userId, mobile: worker.mobile };
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
  const partnerTypeCode = (org?.partner_type_code as string | undefined) || (emitraProfile ? "SEN" : null);

  const returnTo =
    landingForPartnerType(partnerTypeCode) ||
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
    partnerTypeCode,
  };
}
