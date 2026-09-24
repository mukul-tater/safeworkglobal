import { supabase } from '@/integrations/supabase/client';

export type AdminActionItem = {
  id: string;
  title: string;
  detail: string;
  count: number;
  href: string;
  tone: 'urgent' | 'warn' | 'default';
};

async function countRows(
  table: string,
  apply: (query: any) => any,
): Promise<number> {
  try {
    const { count, error } = await apply(
      (supabase as any).from(table).select('id', { count: 'exact', head: true }),
    );
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/** Pending admin work. Each row links to the page where it can be approved or completed. */
export async function loadAdminActionInbox(): Promise<AdminActionItem[]> {
  const [
    kyc,
    interviews,
    bankTransfers,
    medical,
    bonds,
    tradeTests,
    partners,
    emitraWorkers,
    withdrawals,
    disputes,
    flags,
    contacts,
    documents,
    jobs,
  ] = await Promise.all([
    countRows('worker_verification', (q) => q.eq('kyc_status', 'submitted')),
    countRows('worker_verification', (q) => q.in('stage', ['awaiting_interview', 'interview'])),
    countRows('worker_assessment_payments', (q) =>
      q.eq('provider', 'bank_transfer').eq('status', 'submitted'),
    ),
    countRows('worker_verification', (q) =>
      q.eq('stage', 'medical').eq('medical_status', 'scheduled'),
    ),
    countRows('worker_bond_security', (q) => q.eq('status', 'submitted')),
    countRows('assessments', (q) => q.eq('status', 'allocated')),
    countRows('partner_profiles', (q) => q.in('status', ['applied', 'under_review'])),
    countRows('worker_profiles', (q) =>
      q.eq('source_type', 'emitra').eq('review_status', 'pending'),
    ),
    countRows('withdrawal_requests', (q) => q.eq('status', 'pending')),
    countRows('disputes', (q) => q.eq('status', 'open')),
    countRows('content_flags', (q) => q.eq('status', 'pending')),
    countRows('contact_submissions', (q) => q.eq('status', 'new')),
    countRows('worker_documents', (q) => q.eq('verification_status', 'pending')),
    countRows('jobs', (q) => q.eq('status', 'PENDING')),
  ]);

  const items: AdminActionItem[] = [
    {
      id: 'kyc',
      title: 'KYC to review',
      detail: 'Workers submitted ID and documents',
      count: kyc,
      href: '/admin/journey-ops?tab=kyc',
      tone: 'urgent',
    },
    {
      id: 'payments',
      title: 'Bank transfers to confirm',
      detail: 'Payment proofs waiting for approval',
      count: bankTransfers,
      href: '/admin/journey-ops?tab=payment',
      tone: 'urgent',
    },
    {
      id: 'bonds',
      title: 'Agreements to review',
      detail: 'Bond and security packs submitted',
      count: bonds,
      href: '/admin/journey-ops?tab=bond',
      tone: 'urgent',
    },
    {
      id: 'medical',
      title: 'Medical reports to approve',
      detail: 'Lab reports uploaded by workers',
      count: medical,
      href: '/admin/journey-ops?tab=medical',
      tone: 'warn',
    },
    {
      id: 'interviews',
      title: 'Interviews to schedule or score',
      detail: 'Workers waiting in the interview queue',
      count: interviews,
      href: '/admin/journey-ops?tab=interview',
      tone: 'warn',
    },
    {
      id: 'trade-tests',
      title: 'Trade tests to conduct',
      detail: 'Allocated assessments in the inbox',
      count: tradeTests,
      href: '/admin/trade-tests',
      tone: 'warn',
    },
    {
      id: 'partners',
      title: 'E-Mitra centres not yet active',
      detail: 'Older applications that are not active yet',
      count: partners,
      href: '/admin/partners',
      tone: 'urgent',
    },
    {
      id: 'emitra-workers',
      title: 'e-Mitra workers to approve',
      detail: 'Partner-onboarded workers pending review',
      count: emitraWorkers,
      href: '/admin/emitra/worker-review',
      tone: 'warn',
    },
    {
      id: 'withdrawals',
      title: 'Withdrawal requests',
      detail: 'Partner payouts waiting to be processed',
      count: withdrawals,
      href: '/admin/emitra/withdrawals',
      tone: 'urgent',
    },
    {
      id: 'documents',
      title: 'Documents to verify',
      detail: 'Worker documents pending verification',
      count: documents,
      href: '/admin/document-verification',
      tone: 'warn',
    },
    {
      id: 'jobs',
      title: 'Jobs to approve',
      detail: 'Listings waiting to go live',
      count: jobs,
      href: '/admin/jobs',
      tone: 'warn',
    },
    {
      id: 'disputes',
      title: 'Open disputes',
      detail: 'Cases that still need a decision',
      count: disputes,
      href: '/admin/disputes',
      tone: 'urgent',
    },
    {
      id: 'flags',
      title: 'Flagged content',
      detail: 'Reports waiting for moderation',
      count: flags,
      href: '/admin/content-moderation',
      tone: 'warn',
    },
    {
      id: 'contacts',
      title: 'New contact messages',
      detail: 'Website form submissions',
      count: contacts,
      href: '/admin/contact-submissions',
      tone: 'default',
    },
  ];
  return items.filter((item) => item.count > 0);
}
