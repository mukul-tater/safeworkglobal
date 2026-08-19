/** Worker-facing support contact — used for help links. */
export const WORKER_SUPPORT_EMAIL = "mukul@safeworkglobal.com";

export function getWorkerSupportMailtoUrl(subject = "SafeWork Global – Worker Help"): string {
  return `mailto:${WORKER_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** Verified SafeWork Global contact details used on public pages. Do not invent numbers. */
export const SAFEWORK_CONTACT = {
  email: WORKER_SUPPORT_EMAIL,
  officeAddress: "Ward No. 12, Pratap Choraha, Fatehnagar, Udaipur, Rajasthan 313205",
} as const;

export function getSafeworkMailtoUrl(subject = "SafeWork Global – Enquiry", body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${SAFEWORK_CONTACT.email}?${params.toString()}`;
}

/** Official Government of India overseas-employment channels (not SafeWork). */
export const MEA_PBSK = {
  name: "MEA Pravasi Bharatiya Sahayata Kendra (PBSK)",
  phoneDisplay: "1800-11-3090",
  phoneTel: "tel:1800113090",
  whatsappDisplay: "+91 74283 21144",
  whatsappUrl: "https://wa.me/917428321144",
  email: "helpline@mea.gov.in",
  overseasPhoneDisplay: "+91-11-2688-5021",
  overseasPhoneTel: "tel:+911126885021",
} as const;

export const EMIGRATE_PORTAL_URL = "https://emigrate.gov.in/";
export const MADAD_PORTAL_URL = "https://www.madad.gov.in/madad/";
