import type { StampPaperValue } from './types';

/** Exact configured amounts. Do not recalculate. */
export const STATE_STAMP_PAPER_VALUES: StampPaperValue[] = [
  { state_id: 'andhra-pradesh', state_name: 'Andhra Pradesh', name_hi: 'आंध्र प्रदेश', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Andhra Pradesh'] },
  { state_id: 'arunachal-pradesh', state_name: 'Arunachal Pradesh', name_hi: 'अरुणाचल प्रदेश', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Arunachal Pradesh'] },
  { state_id: 'assam', state_name: 'Assam', name_hi: 'असम', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Assam'] },
  { state_id: 'bihar', state_name: 'Bihar', name_hi: 'बिहार', state_type: 'state', minimum_stamp_value: 500, currency: 'INR', aliases: ['Bihar'] },
  { state_id: 'chhattisgarh', state_name: 'Chhattisgarh', name_hi: 'छत्तीसगढ़', state_type: 'state', minimum_stamp_value: 250, currency: 'INR', aliases: ['Chhattisgarh'] },
  { state_id: 'goa', state_name: 'Goa', name_hi: 'गोआ', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Goa'] },
  { state_id: 'gujarat', state_name: 'Gujarat', name_hi: 'गुजरात', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Gujarat'] },
  { state_id: 'haryana', state_name: 'Haryana', name_hi: 'हरियाणा', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Haryana'] },
  { state_id: 'himachal-pradesh', state_name: 'Himachal Pradesh', name_hi: 'हिमाचल प्रदेश', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Himachal Pradesh'] },
  { state_id: 'jharkhand', state_name: 'Jharkhand', name_hi: 'झारखंड', state_type: 'state', minimum_stamp_value: 200, currency: 'INR', aliases: ['Jharkhand'] },
  { state_id: 'karnataka', state_name: 'Karnataka', name_hi: 'कर्नाटक', state_type: 'state', minimum_stamp_value: 500, currency: 'INR', aliases: ['Karnataka'] },
  { state_id: 'kerala', state_name: 'Kerala', name_hi: 'केरल', state_type: 'state', minimum_stamp_value: 500, currency: 'INR', aliases: ['Kerala'] },
  { state_id: 'madhya-pradesh', state_name: 'Madhya Pradesh', name_hi: 'मध्य प्रदेश', state_type: 'state', minimum_stamp_value: 1000, currency: 'INR', aliases: ['Madhya Pradesh'] },
  { state_id: 'maharashtra', state_name: 'Maharashtra', name_hi: 'महाराष्ट्र', state_type: 'state', minimum_stamp_value: 500, currency: 'INR', aliases: ['Maharashtra'] },
  { state_id: 'manipur', state_name: 'Manipur', name_hi: 'मणिपुर', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Manipur'] },
  { state_id: 'meghalaya', state_name: 'Meghalaya', name_hi: 'मेघालय', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Meghalaya'] },
  { state_id: 'mizoram', state_name: 'Mizoram', name_hi: 'मिजोरम', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Mizoram'] },
  { state_id: 'nagaland', state_name: 'Nagaland', name_hi: 'नागालैंड', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Nagaland'] },
  { state_id: 'odisha', state_name: 'Odisha', name_hi: 'ओडिशा', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Odisha'] },
  { state_id: 'punjab', state_name: 'Punjab', name_hi: 'पंजाब', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Punjab'] },
  { state_id: 'rajasthan', state_name: 'Rajasthan', name_hi: 'राजस्थान', state_type: 'state', minimum_stamp_value: 200, currency: 'INR', aliases: ['Rajasthan'] },
  { state_id: 'sikkim', state_name: 'Sikkim', name_hi: 'सिक्किम', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Sikkim'] },
  { state_id: 'tamil-nadu', state_name: 'Tamil Nadu', name_hi: 'तमिलनाडु', state_type: 'state', minimum_stamp_value: 200, currency: 'INR', aliases: ['Tamil Nadu'] },
  { state_id: 'telangana', state_name: 'Telangana', name_hi: 'तेलंगाना', state_type: 'state', minimum_stamp_value: 500, currency: 'INR', aliases: ['Telangana'] },
  { state_id: 'tripura', state_name: 'Tripura', name_hi: 'त्रिपुरा', state_type: 'state', minimum_stamp_value: 500, currency: 'INR', aliases: ['Tripura'] },
  { state_id: 'uttar-pradesh', state_name: 'Uttar Pradesh', name_hi: 'उत्तर प्रदेश', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Uttar Pradesh'] },
  { state_id: 'uttarakhand', state_name: 'Uttarakhand', name_hi: 'उत्तराखंड', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['Uttarakhand'] },
  { state_id: 'west-bengal', state_name: 'West Bengal', name_hi: 'पश्चिम बंगाल', state_type: 'state', minimum_stamp_value: 100, currency: 'INR', aliases: ['West Bengal'] },
  { state_id: 'andaman-nicobar', state_name: 'Andaman & Nicobar', name_hi: 'अंडमान और निकोबार', state_type: 'union_territory', minimum_stamp_value: 100, currency: 'INR', aliases: ['Andaman & Nicobar', 'Andaman and Nicobar Islands', 'Andaman and Nicobar'] },
  { state_id: 'chandigarh', state_name: 'Chandigarh', name_hi: 'चंडीगढ़', state_type: 'union_territory', minimum_stamp_value: 100, currency: 'INR', aliases: ['Chandigarh'] },
  { state_id: 'dadra-nagar-haveli', state_name: 'Dadra & Nagar Haveli', name_hi: 'दादरा और नगर हवेली', state_type: 'union_territory', minimum_stamp_value: 100, currency: 'INR', aliases: ['Dadra & Nagar Haveli', 'Dadra and Nagar Haveli', 'Dadra and Nagar Haveli and Daman and Diu'] },
  { state_id: 'daman-diu', state_name: 'Daman & Diu', name_hi: 'दमन और दीव', state_type: 'union_territory', minimum_stamp_value: 100, currency: 'INR', aliases: ['Daman & Diu', 'Daman and Diu'] },
  { state_id: 'delhi', state_name: 'Delhi', name_hi: 'दिल्ली', state_type: 'union_territory', minimum_stamp_value: 100, currency: 'INR', aliases: ['Delhi', 'NCT of Delhi'] },
  { state_id: 'jammu-kashmir', state_name: 'Jammu & Kashmir', name_hi: 'जम्मू और कश्मीर', state_type: 'union_territory', minimum_stamp_value: 500, currency: 'INR', aliases: ['Jammu & Kashmir', 'Jammu and Kashmir'] },
  { state_id: 'ladakh', state_name: 'Ladakh', name_hi: 'लद्दाख', state_type: 'union_territory', minimum_stamp_value: 500, currency: 'INR', aliases: ['Ladakh'] },
  { state_id: 'lakshadweep', state_name: 'Lakshadweep', name_hi: 'लक्षद्वीप', state_type: 'union_territory', minimum_stamp_value: 500, currency: 'INR', aliases: ['Lakshadweep'] },
  { state_id: 'puducherry', state_name: 'Puducherry', name_hi: 'पुडुचेरी', state_type: 'union_territory', minimum_stamp_value: 100, currency: 'INR', aliases: ['Puducherry', 'Pondicherry'] },
];

function norm(value: string): string {
  return value.trim().toLowerCase();
}

export function lookupStampPaper(
  registeredState: string | null | undefined,
  catalog: StampPaperValue[] = STATE_STAMP_PAPER_VALUES,
): StampPaperValue | null {
  if (!registeredState?.trim()) return null;
  const needle = norm(registeredState);
  return (
    catalog.find((row) => {
      if (norm(row.state_name) === needle) return true;
      return (row.aliases || []).some((alias) => norm(alias) === needle);
    }) || null
  );
}

export function formatStampInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
