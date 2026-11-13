import { supabase } from '@/integrations/supabase/client';
import { isValidIndianMobile, normalizeIndianMobile } from '@/lib/validations/common';

export type MarketingLeadSource =
  | 'instagram_dm'
  | 'instagram_ad'
  | 'whatsapp_dm'
  | 'influencer'
  | 'facebook_ad'
  | 'other';

export type MarketingLeadStatus =
  | 'lead_created'
  | 'invited'
  | 'registered'
  | 'converted'
  | 'archived';

export interface MarketingLead {
  id: string;
  phone: string;
  full_name: string | null;
  source: MarketingLeadSource;
  campaign_name: string | null;
  job_interest: string | null;
  notes: string | null;
  status: MarketingLeadStatus;
  worker_user_id: string | null;
  invite_sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  worker_verification?: {
    stage: string;
    quiz_completed_at: string | null;
    quiz_score: number | null;
    media_submitted_at: string | null;
    kyc_status: string | null;
    payment_status: string | null;
  } | null;
}

export interface CreateMarketingLeadInput {
  phone: string;
  full_name?: string;
  source: MarketingLeadSource;
  campaign_name?: string;
  job_interest?: string;
  notes?: string;
}

export interface MarketingMatrixStats {
  totalLeads: number;
  invitedCount: number;
  registeredCount: number;
  quizPassedCount: number;
  kycVerifiedCount: number;
  conversionRate: number;
  sources: {
    source: MarketingLeadSource;
    label: string;
    count: number;
    registered: number;
    percentage: number;
  }[];
  campaigns: {
    campaign_name: string;
    source: string;
    leads: number;
    registered: number;
    quizPassed: number;
    conversionRate: number;
  }[];
}

export const LEAD_SOURCE_LABELS: Record<MarketingLeadSource, string> = {
  instagram_dm: 'Instagram DM',
  instagram_ad: 'Instagram Ad',
  whatsapp_dm: 'WhatsApp DM',
  influencer: 'Influencer Promo',
  facebook_ad: 'Facebook Ad',
  other: 'Other Channel',
};

export const LEAD_STATUS_LABELS: Record<MarketingLeadStatus, { label: string; color: string }> = {
  lead_created: { label: 'Lead Logged', color: 'bg-muted text-muted-foreground' },
  invited: { label: 'Invite Sent', color: 'bg-primary/10 text-primary' },
  registered: { label: 'Active on Portal', color: 'bg-warning/10 text-warning' },
  converted: { label: 'KYC Verified', color: 'bg-success/10 text-success' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground line-through' },
};

export const COMMON_POPULAR_TRADES = [
  'Security Guard',
  'Light Driver',
  'Heavy Driver',
  'Electrician',
  'Plumber',
  'Mason',
  'Welder',
  'Carpenter',
  'Cleaner',
  'House Maid / Nanny',
  'Warehouse Packer',
  'HVAC / AC Technician',
  'Steel Fixer',
];

const LOCAL_STORAGE_KEY = 'swg_local_marketing_leads';

function getLocalLeads(): MarketingLead[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: MarketingLead[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  } catch {
    /* ignore */
  }
}

/**
 * Builds a direct WhatsApp message URL with pre-filled Hindi & English copy
 * and custom tracking parameters so the worker lands right into the journey.
 */
export function buildWhatsAppInviteUrl(opts: {
  phone: string;
  name?: string | null;
  job?: string | null;
  campaign?: string | null;
  source?: string | null;
}): { url: string; messageText: string } {
  const normPhone = normalizeIndianMobile(opts.phone);
  const namePart = opts.name?.trim() ? `${opts.name.trim()} ji` : 'ji';
  const jobPart = opts.job?.trim() ? `${opts.job.trim()} (UAE)` : 'Gulf/UAE jobs';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://safeworkglobal.com';

  const params = new URLSearchParams();
  params.set('m', normPhone);
  if (opts.source) params.set('utm_source', opts.source);
  if (opts.campaign) params.set('utm_campaign', opts.campaign);
  const journeyLink = `${baseUrl}/worker/login?${params.toString()}`;

  const messageText = `Namaste ${namePart}! 🙏

SafeWork Global me aapka ${jobPart} ke liye profile register ho gaya hai.

Aap direct is link se apna trade test aur journey complete kar sakte hain:
👉 ${journeyLink}

✅ Zero fraud & direct UAE employer matching
✅ Kisi bhi sawal ke liye aap hume isi number par reply kar sakte hain.

- Team SafeWork Global`;

  const url = `https://wa.me/91${normPhone}?text=${encodeURIComponent(messageText)}`;
  return { url, messageText };
}

/**
 * Creates a new marketing lead from an Instagram Ad, DM, or Influencer lead.
 */
export async function createMarketingLead(input: CreateMarketingLeadInput): Promise<MarketingLead> {
  const phone = normalizeIndianMobile(input.phone);
  if (!isValidIndianMobile(phone)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }

  const { data: authData } = await supabase.auth.getUser();
  const adminId = authData?.user?.id || null;

  // Check if a worker profile already exists with this phone number
  let existingWorkerUserId: string | null = null;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (profile?.id) {
      existingWorkerUserId = profile.id;
    }
  } catch {
    /* non-blocking */
  }

  const payload = {
    phone,
    full_name: input.full_name?.trim() || null,
    source: input.source,
    campaign_name: input.campaign_name?.trim() || null,
    job_interest: input.job_interest?.trim() || null,
    notes: input.notes?.trim() || null,
    status: existingWorkerUserId ? 'registered' : 'lead_created',
    worker_user_id: existingWorkerUserId,
    created_by: adminId,
  };

  try {
    const { data, error } = await (supabase as any)
      .from('marketing_leads')
      .insert(payload)
      .select('*')
      .single();

    if (!error && data) {
      return data as MarketingLead;
    }
    throw error;
  } catch (err) {
    // Graceful fallback to local storage if migration is not yet executed remotely
    console.warn('DB marketing_leads insert fell back to local store:', err);
    const newLead: MarketingLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...payload,
      invite_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const local = getLocalLeads();
    saveLocalLeads([newLead, ...local]);
    return newLead;
  }
}

/**
 * Lists all marketing leads with live verification funnel status for linked workers.
 */
export async function listMarketingLeads(filters?: {
  search?: string;
  source?: string;
  campaign?: string;
  status?: string;
}): Promise<MarketingLead[]> {
  let leads: MarketingLead[] = [];

  try {
    let query = (supabase as any)
      .from('marketing_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.source && filters.source !== 'all') {
      query = query.eq('source', filters.source);
    }
    if (filters?.campaign && filters.campaign !== 'all') {
      query = query.eq('campaign_name', filters.campaign);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    leads = (data || []) as MarketingLead[];
  } catch (err) {
    console.warn('DB query failed, loading from local fallback:', err);
    leads = getLocalLeads();
    if (filters?.source && filters.source !== 'all') {
      leads = leads.filter((l) => l.source === filters.source);
    }
    if (filters?.campaign && filters.campaign !== 'all') {
      leads = leads.filter((l) => l.campaign_name === filters.campaign);
    }
    if (filters?.status && filters.status !== 'all') {
      leads = leads.filter((l) => l.status === filters.status);
    }
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    leads = leads.filter(
      (l) =>
        l.phone.includes(q) ||
        (l.full_name && l.full_name.toLowerCase().includes(q)) ||
        (l.campaign_name && l.campaign_name.toLowerCase().includes(q)) ||
        (l.job_interest && l.job_interest.toLowerCase().includes(q)),
    );
  }

  // Hydrate verification funnel status for linked worker accounts
  const workerIds = leads.map((l) => l.worker_user_id).filter(Boolean) as string[];
  if (workerIds.length > 0) {
    try {
      const { data: verifications } = await supabase
        .from('worker_verifications')
        .select('user_id, stage, quiz_completed_at, quiz_score, media_submitted_at, kyc_status, payment_status')
        .in('user_id', workerIds);

      if (verifications) {
        const vMap = new Map(verifications.map((v) => [v.user_id, v]));
        leads = leads.map((l) => ({
          ...l,
          worker_verification: l.worker_user_id ? vMap.get(l.worker_user_id) || null : null,
        }));
      }
    } catch {
      /* non-blocking */
    }
  }

  return leads;
}

/**
 * Updates a lead's status or internal notes.
 */
export async function updateMarketingLeadStatus(
  leadId: string,
  status: MarketingLeadStatus,
  notes?: string,
): Promise<void> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) patch.notes = notes;

  try {
    const { error } = await (supabase as any)
      .from('marketing_leads')
      .update(patch)
      .eq('id', leadId);
    if (error) throw error;
  } catch {
    const local = getLocalLeads();
    const updated = local.map((l) => (l.id === leadId ? { ...l, ...patch } : l));
    saveLocalLeads(updated as MarketingLead[]);
  }
}

/**
 * Marks that a WhatsApp invite was sent to the worker.
 */
export async function markMarketingLeadInvited(leadId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const { error } = await (supabase as any)
      .from('marketing_leads')
      .update({
        invite_sent_at: now,
        status: 'invited',
        updated_at: now,
      })
      .eq('id', leadId);
    if (error) throw error;
  } catch {
    const local = getLocalLeads();
    const updated = local.map((l) =>
      l.id === leadId ? { ...l, invite_sent_at: now, status: 'invited' as MarketingLeadStatus } : l,
    );
    saveLocalLeads(updated);
  }
}

/**
 * Aggregates overall performance metrics for the acquisition matrix dashboard.
 */
export async function getMarketingMatrixStats(): Promise<MarketingMatrixStats> {
  const leads = await listMarketingLeads();
  const totalLeads = leads.length;

  const invitedCount = leads.filter((l) => Boolean(l.invite_sent_at) || l.status === 'invited').length;
  const registeredCount = leads.filter(
    (l) => Boolean(l.worker_user_id) || l.status === 'registered' || l.status === 'converted',
  ).length;

  const quizPassedCount = leads.filter((l) => {
    const v = l.worker_verification;
    return Boolean(v?.quiz_completed_at && (v.quiz_score ?? 0) >= 50);
  }).length;

  const kycVerifiedCount = leads.filter((l) => {
    const v = l.worker_verification;
    return v?.kyc_status === 'verified' || l.status === 'converted';
  }).length;

  const conversionRate = totalLeads > 0 ? Math.round((registeredCount / totalLeads) * 100) : 0;

  // Source breakdown
  const sourceKeys: MarketingLeadSource[] = [
    'instagram_dm',
    'instagram_ad',
    'whatsapp_dm',
    'influencer',
    'facebook_ad',
    'other',
  ];

  const sources = sourceKeys.map((src) => {
    const matching = leads.filter((l) => l.source === src);
    const count = matching.length;
    const registered = matching.filter(
      (l) => Boolean(l.worker_user_id) || l.status === 'registered' || l.status === 'converted',
    ).length;
    return {
      source: src,
      label: LEAD_SOURCE_LABELS[src],
      count,
      registered,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    };
  });

  // Campaign breakdown
  const campaignMap = new Map<
    string,
    { campaign_name: string; source: string; leads: number; registered: number; quizPassed: number }
  >();

  for (const l of leads) {
    const campKey = l.campaign_name?.trim() || 'General / Untagged';
    const existing = campaignMap.get(campKey) || {
      campaign_name: campKey,
      source: LEAD_SOURCE_LABELS[l.source] || l.source,
      leads: 0,
      registered: 0,
      quizPassed: 0,
    };
    existing.leads += 1;
    if (l.worker_user_id || l.status === 'registered' || l.status === 'converted') {
      existing.registered += 1;
    }
    if (l.worker_verification?.quiz_completed_at) {
      existing.quizPassed += 1;
    }
    campaignMap.set(campKey, existing);
  }

  const campaigns = Array.from(campaignMap.values()).map((c) => ({
    ...c,
    conversionRate: c.leads > 0 ? Math.round((c.registered / c.leads) * 100) : 0,
  }));

  return {
    totalLeads,
    invitedCount,
    registeredCount,
    quizPassedCount,
    kycVerifiedCount,
    conversionRate,
    sources,
    campaigns,
  };
}

