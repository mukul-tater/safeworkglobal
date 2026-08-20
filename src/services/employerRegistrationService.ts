import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WORK_LOCATION } from "@/lib/employerTradeSkills";
import type { ManpowerRequirementForm } from "@/lib/validations/employerRegistration";

export type RegistrationSection = 1 | 2 | 3 | 4;

export interface EmployerRegistrationDraft {
  companyLegalName: string;
  tradeName: string;
  companyType: string;
  businessActivity: string;
  emirate: string;
  website: string;
  linkedin: string;
  tradeLicencePath: string;
  companyProfilePath: string;
  contactFullName: string;
  designation: string;
  uaeMobile: string;
  whatsapp: string;
  businessEmail: string;
  preferredCommunication: string;
  additionalContact: string;
  requirements: ManpowerRequirementForm[];
  partnershipModel: string;
  commercialNotes: string;
  declarationAuthorized: boolean;
  declarationAccurate: boolean;
  declarationRegulations: boolean;
  declarationContactOk: boolean;
  referenceId: string;
}

export function emptyRequirement(): ManpowerRequirementForm {
  return {
    id: crypto.randomUUID(),
    trade: "",
    customTrade: "",
    numberOfWorkers: "",
    experience: "",
    location: DEFAULT_WORK_LOCATION,
    projectName: "",
    joiningDate: "",
    projectDuration: "",
    gender: "Any",
    technicalSkills: [],
    additionalRequirements: "",
  };
}

export function emptyDraft(): EmployerRegistrationDraft {
  return {
    companyLegalName: "",
    tradeName: "",
    companyType: "",
    businessActivity: "",
    emirate: "Dubai",
    website: "",
    linkedin: "",
    tradeLicencePath: "",
    companyProfilePath: "",
    contactFullName: "",
    designation: "",
    uaeMobile: "",
    whatsapp: "",
    businessEmail: "",
    preferredCommunication: "",
    additionalContact: "",
    requirements: [],
    partnershipModel: "",
    commercialNotes: "",
    declarationAuthorized: false,
    declarationAccurate: false,
    declarationRegulations: false,
    declarationContactOk: false,
    referenceId: "",
  };
}

function resolvedTrade(item: ManpowerRequirementForm): string {
  return item.trade === "Other" ? item.customTrade?.trim() || "Other" : item.trade;
}

export function totalWorkers(requirements: ManpowerRequirementForm[]): number {
  return requirements.reduce((sum, item) => sum + (Number(item.numberOfWorkers) || 0), 0);
}

function profilePayload(userId: string, draft: EmployerRegistrationDraft, completed: boolean) {
  const trades = [...new Set(draft.requirements.map(resolvedTrade).filter(Boolean))];
  const locations = [...new Set(draft.requirements.map((r) => r.location.trim()).filter(Boolean))];
  const joiningDates = draft.requirements.map((r) => r.joiningDate).filter(Boolean).sort();

  return {
    user_id: userId,
    company_name: draft.companyLegalName || null,
    trade_name: draft.tradeName || null,
    company_type: draft.companyType || null,
    business_type: draft.businessActivity || null,
    industry: draft.businessActivity || null,
    emirate: draft.emirate || null,
    country: "United Arab Emirates",
    office_state: draft.emirate || null,
    website: draft.website || null,
    linkedin_url: draft.linkedin || null,
    trade_licence_path: draft.tradeLicencePath || null,
    company_profile_path: draft.companyProfilePath || null,
    contact_full_name: draft.contactFullName || null,
    contact_designation: draft.designation || null,
    employer_role: draft.designation || null,
    uae_mobile: draft.uaeMobile || null,
    whatsapp_number: draft.whatsapp || null,
    business_email: draft.businessEmail || null,
    preferred_communication: draft.preferredCommunication || null,
    additional_contact_number: draft.additionalContact || null,
    partnership_model: draft.partnershipModel || null,
    commercial_notes: draft.commercialNotes || null,
    declaration_authorized: draft.declarationAuthorized,
    declaration_accurate: draft.declarationAccurate,
    declaration_regulations: draft.declarationRegulations,
    declaration_contact_ok: draft.declarationContactOk,
    hiring_roles: trades,
    workers_required: totalWorkers(draft.requirements) || null,
    work_locations: locations,
    expected_start_date: joiningDates[0] || null,
    onboarding_completed: completed,
  };
}

export async function loadEmployerRegistration(userId: string): Promise<{
  draft: EmployerRegistrationDraft;
  completed: boolean;
}> {
  const draft = emptyDraft();
  const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("id", userId).maybeSingle();
  const { data: ep } = await supabase.from("employer_profiles").select("*").eq("user_id", userId).maybeSingle();
  const { data: reqs } = await supabase
    .from("employer_manpower_requirements")
    .select("*")
    .eq("employer_user_id", userId)
    .order("sort_order", { ascending: true });

  const row = (ep || {}) as Record<string, unknown>;
  draft.companyLegalName = (row.company_name as string) || "";
  draft.tradeName = (row.trade_name as string) || "";
  draft.companyType = (row.company_type as string) || "";
  draft.businessActivity = (row.business_type as string) || "";
  draft.emirate = (row.emirate as string) || "Dubai";
  draft.website = (row.website as string) || "";
  draft.linkedin = (row.linkedin_url as string) || "";
  draft.tradeLicencePath = (row.trade_licence_path as string) || "";
  draft.companyProfilePath = (row.company_profile_path as string) || "";
  draft.contactFullName = (row.contact_full_name as string) || (profile?.full_name as string) || "";
  draft.designation = (row.contact_designation as string) || (row.employer_role as string) || "";
  draft.uaeMobile = (row.uae_mobile as string) || (profile?.phone as string) || "";
  draft.whatsapp = (row.whatsapp_number as string) || "";
  draft.businessEmail = (row.business_email as string) || (profile?.email as string) || "";
  draft.preferredCommunication = (row.preferred_communication as string) || "";
  draft.additionalContact = (row.additional_contact_number as string) || "";
  draft.partnershipModel = (row.partnership_model as string) || "";
  draft.commercialNotes = (row.commercial_notes as string) || "";
  draft.declarationAuthorized = Boolean(row.declaration_authorized);
  draft.declarationAccurate = Boolean(row.declaration_accurate);
  draft.declarationRegulations = Boolean(row.declaration_regulations);
  draft.declarationContactOk = Boolean(row.declaration_contact_ok);
  draft.referenceId = (row.requirement_reference_id as string) || "";

  const knownTrades = new Set([
    "Electrician",
    "Plumber",
    "Welder",
    "HVAC Technician",
    "Fitter",
    "Pipe Fitter",
    "Fabricator",
    "Mason",
    "Carpenter",
    "Painter",
    "Scaffolder",
    "Steel Fixer",
    "Construction Worker",
    "Other",
  ]);

  draft.requirements = ((reqs || []) as Record<string, unknown>[]).map((item) => {
    const trade = (item.trade as string) || "";
    const known = knownTrades.has(trade);
    return {
      id: (item.id as string) || crypto.randomUUID(),
      trade: known ? trade : "Other",
      customTrade: known ? "" : trade,
      numberOfWorkers: item.number_of_workers != null ? String(item.number_of_workers) : "",
      experience: (item.experience as string) || "",
      location: (item.location as string) || DEFAULT_WORK_LOCATION,
      projectName: (item.project_name as string) || "",
      joiningDate: (item.joining_date as string) || "",
      projectDuration: (item.project_duration as string) || "",
      gender: (item.gender as string) || "Any",
      technicalSkills: (item.technical_skills as string[]) || [],
      additionalRequirements: (item.additional_requirements as string) || "",
    };
  });

  return { draft, completed: Boolean(row.onboarding_completed) };
}

export async function saveEmployerRegistration(
  userId: string,
  draft: EmployerRegistrationDraft,
  completed: boolean,
): Promise<string | null> {
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: draft.contactFullName || null,
      phone: draft.uaeMobile || null,
    })
    .eq("id", userId);
  if (profileErr) throw profileErr;

  const { error: epErr } = await supabase.from("employer_profiles").upsert(profilePayload(userId, draft, completed) as never, {
    onConflict: "user_id",
  });
  if (epErr) throw epErr;

  const { error: delErr } = await supabase.from("employer_manpower_requirements").delete().eq("employer_user_id", userId);
  if (delErr) throw delErr;

  if (draft.requirements.length > 0) {
    const rows = draft.requirements.map((item, index) => ({
      employer_user_id: userId,
      trade: resolvedTrade(item),
      number_of_workers: Number(item.numberOfWorkers) || 1,
      experience: item.experience || null,
      location: item.location || DEFAULT_WORK_LOCATION,
      project_name: item.projectName || null,
      joining_date: item.joiningDate || null,
      project_duration: item.projectDuration || null,
      gender: item.gender || "Any",
      technical_skills: item.technicalSkills,
      additional_requirements: item.additionalRequirements || null,
      sort_order: index,
    }));
    const { error: insErr } = await supabase.from("employer_manpower_requirements").insert(rows as never);
    if (insErr) throw insErr;
  }

  if (!completed) return draft.referenceId || "";

  const { data, error: refErr } = await supabase.rpc("assign_employer_requirement_ref", {
    p_user_id: userId,
  });
  if (refErr) throw refErr;
  return (data as string) || null;
}
