export type SlipJob = {
  title?: string | null;
  country?: string | null;
  location?: string | null;
  experienceLevel?: string | null;
};

export function tradeLabel(skill: string | null | undefined, jobTitle?: string | null): string {
  const skillText = (skill || '').trim();
  if (skillText) return skillText;
  const title = (jobTitle || '').trim();
  return title || 'your trade';
}

export function appliedForLine(trade: string): string {
  return `Applied for: ${trade}`;
}

export function testTodayLine(trade: string): string {
  return `Test today: ${trade} physical trade test`;
}

export function slipIntroLine(trade: string): string {
  return `This person applied for a ${trade} job and is here to give the ${trade} physical trade test.`;
}

export function workerReference(userId: string | null | undefined): string {
  const compact = (userId || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  return compact ? `SW-${compact}` : '—';
}

export function slipStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'allocated':
      return 'Booked';
    case 'accepted':
    case 'scheduled':
      return 'Accepted by centre';
    case 'checked_in':
    case 'kyc_done':
    case 'running':
      return 'Checked in';
    case 'centre_rejected':
      return 'Cancelled';
    default:
      return status ? status.replace(/_/g, ' ') : 'Booked';
  }
}

export function isOpenTradeBooking(status: string | null | undefined): boolean {
  return [
    'allocated',
    'accepted',
    'scheduled',
    'checked_in',
    'kyc_done',
    'running',
    'centre_submitted',
    'under_review',
  ].includes(status || '');
}

export function centreOffersTrade(
  trades: string[] | null | undefined,
  skill: string | null | undefined,
): boolean {
  const wanted = (skill || '').trim();
  if (!wanted) return false;
  return (trades || []).some((trade) => trade === wanted);
}

export function jobPlaceLine(job: SlipJob | null | undefined): string | null {
  if (!job) return null;
  const parts = [job.location, job.country].map((part) => (part || '').trim()).filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}
