/**
 * Automated Verification Script for Phase 1 Marketing Leads & Matrix Engine
 */
import {
  isValidIndianMobile,
  normalizeIndianMobile,
} from '../src/lib/validations/common';
import {
  buildWhatsAppInviteUrl,
  createMarketingLead,
  listMarketingLeads,
  updateMarketingLeadStatus,
  markMarketingLeadInvited,
  getMarketingMatrixStats,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from '../src/services/marketingLeadService';

// Mock localStorage for Node environment
const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => storage[k] || null,
  setItem: (k: string, v: string) => { storage[k] = v; },
  removeItem: (k: string) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  console.log('=== 1. Phone Normalization & Validation Tests ===');
  assert(normalizeIndianMobile('+91 98765 43210') === '9876543210', 'Strips +91 and spaces');
  assert(normalizeIndianMobile('09876543210') === '9876543210', 'Strips leading zero');
  assert(normalizeIndianMobile('+91-98765-43210') === '9876543210', 'Strips dashes');
  assert(isValidIndianMobile('9876543210') === true, 'Accepts valid 10-digit Indian mobile starting with 9');
  assert(isValidIndianMobile('8123456789') === true, 'Accepts valid 10-digit Indian mobile starting with 8');
  assert(isValidIndianMobile('7123456789') === true, 'Accepts valid 10-digit Indian mobile starting with 7');
  assert(isValidIndianMobile('6123456789') === true, 'Accepts valid 10-digit Indian mobile starting with 6');
  assert(isValidIndianMobile('5123456789') === false, 'Rejects Indian mobile starting with 5');
  assert(isValidIndianMobile('12345') === false, 'Rejects short number');
  assert(isValidIndianMobile('9876543210123') === false, 'Rejects long number with non-standard prefix');

  console.log('\n=== 2. WhatsApp Invite Link & Template Tests ===');
  const invite = buildWhatsAppInviteUrl({
    phone: '+91 98765 43210',
    name: 'Suresh Kumar',
    job: 'Security Guard',
    campaign: 'Rahul_Sharma_Reel',
    source: 'instagram_dm',
  });

  assert(invite.url.startsWith('https://wa.me/919876543210?text='), 'WhatsApp URL points to wa.me/919876543210');
  assert(invite.messageText.includes('Namaste Suresh Kumar ji!'), 'Message includes candidate name greeting');
  assert(invite.messageText.includes('Security Guard (UAE)'), 'Message includes target job trade');
  assert(invite.messageText.includes('m=9876543210'), 'Message link includes candidate phone param');
  assert(invite.messageText.includes('utm_source=instagram_dm'), 'Message link includes utm_source');
  assert(invite.messageText.includes('utm_campaign=Rahul_Sharma_Reel'), 'Message link includes utm_campaign');

  console.log('\n=== 3. Marketing Lead Creation & Validation Tests ===');
  // Should reject invalid phone
  let rejected = false;
  try {
    await createMarketingLead({
      phone: '12345',
      source: 'instagram_dm',
    });
  } catch {
    rejected = true;
  }
  assert(rejected === true, 'createMarketingLead rejects invalid phone number');

  // Create valid lead 1 (Instagram DM)
  const lead1 = await createMarketingLead({
    phone: '9876543210',
    full_name: 'Amit Verma',
    source: 'instagram_dm',
    campaign_name: 'Dubai Guard Ad 1',
    job_interest: 'Security Guard',
    notes: 'Inquired about height requirements on IG DM',
  });

  assert(lead1.phone === '9876543210', 'Lead 1 created with normalized phone');
  assert(lead1.full_name === 'Amit Verma', 'Lead 1 has candidate full name');
  assert(lead1.source === 'instagram_dm', 'Lead 1 has source instagram_dm');
  assert(lead1.status === 'lead_created', 'Lead 1 starts with status lead_created');

  // Create valid lead 2 (Influencer promo)
  const lead2 = await createMarketingLead({
    phone: '8765432109',
    full_name: 'Ravi Singh',
    source: 'influencer',
    campaign_name: 'Rahul Sharma Driver Reel',
    job_interest: 'Light Driver',
  });
  assert(lead2.phone === '8765432109', 'Lead 2 created for influencer promo');

  // Create valid lead 3 (WhatsApp DM)
  const lead3 = await createMarketingLead({
    phone: '7654321098',
    full_name: 'Mohan Lal',
    source: 'whatsapp_dm',
    campaign_name: 'Rahul Sharma Driver Reel',
    job_interest: 'Heavy Driver',
  });
  assert(lead3.phone === '7654321098', 'Lead 3 created for WhatsApp DM');

  console.log('\n=== 4. Lead Status Transitions & WhatsApp Invite Marking ===');
  await markMarketingLeadInvited(lead1.id);
  let allLeads = await listMarketingLeads();
  const updatedLead1 = allLeads.find((l) => l.id === lead1.id);
  assert(updatedLead1?.status === 'invited', 'Lead 1 status updated to invited');
  assert(Boolean(updatedLead1?.invite_sent_at), 'Lead 1 invite_sent_at timestamp is set');

  await updateMarketingLeadStatus(lead2.id, 'registered', 'Worker logged into portal via phone OTP');
  allLeads = await listMarketingLeads();
  const updatedLead2 = allLeads.find((l) => l.id === lead2.id);
  assert(updatedLead2?.status === 'registered', 'Lead 2 updated to registered');
  assert(updatedLead2?.notes === 'Worker logged into portal via phone OTP', 'Lead 2 notes updated');

  console.log('\n=== 5. Lead Listing & Search Filtering Tests ===');
  const searchResults = await listMarketingLeads({ search: 'Mohan' });
  assert(searchResults.length === 1 && searchResults[0].id === lead3.id, 'Search by name returns Mohan Lal');

  const phoneResults = await listMarketingLeads({ search: '9876543210' });
  assert(phoneResults.length === 1 && phoneResults[0].id === lead1.id, 'Search by phone returns Lead 1');

  const sourceFilterResults = await listMarketingLeads({ source: 'influencer' });
  assert(sourceFilterResults.length === 1 && sourceFilterResults[0].id === lead2.id, 'Filter by source returns only influencer lead');

  const campaignFilterResults = await listMarketingLeads({ campaign: 'Rahul Sharma Driver Reel' });
  assert(campaignFilterResults.length === 2, 'Filter by campaign returns 2 leads for Rahul Sharma');

  console.log('\n=== 6. Matrix & Funnel Aggregations Tests ===');
  const matrix = await getMarketingMatrixStats();
  assert(matrix.totalLeads === 3, 'Matrix reports total 3 leads');
  assert(matrix.invitedCount === 1, 'Matrix reports 1 invited lead');
  assert(matrix.registeredCount === 1, 'Matrix reports 1 registered lead');
  assert(matrix.conversionRate === 33, 'Conversion rate is 33% (1 registered / 3 total)');

  const igSource = matrix.sources.find((s) => s.source === 'instagram_dm');
  assert(igSource?.count === 1, 'Instagram DM channel has 1 lead');

  const infSource = matrix.sources.find((s) => s.source === 'influencer');
  assert(infSource?.count === 1, 'Influencer channel has 1 lead');

  const rahulCampaign = matrix.campaigns.find((c) => c.campaign_name === 'Rahul Sharma Driver Reel');
  assert(rahulCampaign?.leads === 2, 'Rahul Sharma campaign has 2 leads');
  assert(rahulCampaign?.registered === 1, 'Rahul Sharma campaign has 1 registered worker');
  assert(rahulCampaign?.conversionRate === 50, 'Rahul Sharma campaign conversion rate is 50%');

  console.log('\n=== 7. Worker Login URL Parameter Pre-fill Simulation ===');
  const simulatedUrl = new URL(invite.url);
  const textParam = simulatedUrl.searchParams.get('text') || '';
  const match = textParam.match(/safeworkglobal\.com\/worker\/login\?([^\s]+)/);
  assert(Boolean(match), 'Login URL extracted from WhatsApp message text');

  const loginParams = new URLSearchParams(match![1]);
  assert(loginParams.get('m') === '9876543210', 'Worker login receives ?m=9876543210');
  assert(loginParams.get('utm_source') === 'instagram_dm', 'Worker login receives ?utm_source=instagram_dm');
  assert(loginParams.get('utm_campaign') === 'Rahul_Sharma_Reel', 'Worker login receives ?utm_campaign=Rahul_Sharma_Reel');

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
}

runVerification().catch((err) => {
  console.error('Unexpected error during verification:', err);
  process.exit(1);
});

