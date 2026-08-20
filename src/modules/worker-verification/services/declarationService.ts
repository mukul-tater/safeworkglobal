import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import type {
  WorkerPreJourneyDeclaration,
  ValidationResult,
  MedicalFitnessDeclaration,
  PreviousOverseasEmploymentDeclaration,
  RecruitmentAgentExperienceDeclaration,
  CandidateAcknowledgements,
} from '../types/declarations.types';

const supabase: any = supabaseTyped;

const LOCAL_STORAGE_KEY_PREFIX = 'swg_pre_journey_decl_';

export const INITIAL_MEDICAL: MedicalFitnessDeclaration = {
  fitForDuties: '',
  hasMedicalCondition: '',
  medicalConditionDetails: '',
  disclaimerAcknowledged: true,
};

export const INITIAL_OVERSEAS: PreviousOverseasEmploymentDeclaration = {
  workedOutsideIndia: '',
  gccReturn: '',
  overseasDetails: {
    country: '',
    employer: '',
    jobTrade: '',
    duration: '',
    year: '',
  },
  beenDeported: '',
  deportedDetails: '',
  refusedVisaOrEntry: '',
  refusedVisaDetails: '',
  overstayedVisa: '',
  overstayedDetails: '',
};

export const INITIAL_RECRUITMENT: RecruitmentAgentExperienceDeclaration = {
  registeredWithOtherAgency: '',
  agencyDetails: '',
  paidMoneyForJob: '',
  paidAmountDetails: '',
  promisedGuaranteedJobForMoney: '',
  promisedJobDetails: '',
};

export const INITIAL_ACKNOWLEDGEMENTS: CandidateAcknowledgements = {
  noJobGuarantee: false,
  subjectToEmployerReqs: false,
  subjectToVisaClearance: false,
  tradeTestNoGuarantee: false,
  agreeGenuineInfo: false,
  falseDocConsequences: false,
  agreeMedicalAndTesting: false,
  transparentCharges: false,
};

export function validateStep1(medical: MedicalFitnessDeclaration): ValidationResult {
  const errors: Record<string, string> = {};
  if (!medical.fitForDuties) {
    errors.fitForDuties = 'Please select if you consider yourself physically fit.';
  }
  if (!medical.hasMedicalCondition) {
    errors.hasMedicalCondition = 'Please indicate if you have any medical condition or physical limitation.';
  }
  if (medical.hasMedicalCondition === 'yes' && (!medical.medicalConditionDetails || !medical.medicalConditionDetails.trim())) {
    errors.medicalConditionDetails = 'Please provide details of your medical condition or limitation.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep2(overseas: PreviousOverseasEmploymentDeclaration): ValidationResult {
  const errors: Record<string, string> = {};
  if (!overseas.workedOutsideIndia) {
    errors.workedOutsideIndia = 'Please select if you have previously worked outside India.';
  }
  if (!overseas.gccReturn) {
    errors.gccReturn = 'Please select if you are a GCC return worker.';
  }
  if (overseas.workedOutsideIndia === 'yes' || overseas.gccReturn === 'yes') {
    const details = overseas.overseasDetails;
    if (!details?.country?.trim()) errors.country = 'Please enter country name.';
    if (!details?.employer?.trim()) errors.employer = 'Please enter employer name.';
    if (!details?.jobTrade?.trim()) errors.jobTrade = 'Please enter job/trade.';
    if (!details?.duration?.trim()) errors.duration = 'Please enter duration of work.';
    if (!details?.year?.trim()) errors.year = 'Please enter year of employment.';
  }

  if (!overseas.beenDeported) {
    errors.beenDeported = 'Please select if you have ever been deported, removed or repatriated.';
  }
  if (overseas.beenDeported === 'yes' && (!overseas.deportedDetails || !overseas.deportedDetails.trim())) {
    errors.deportedDetails = 'Please provide details regarding deportation/repatriation.';
  }

  if (!overseas.refusedVisaOrEntry) {
    errors.refusedVisaOrEntry = 'Please select if you have ever been refused entry or work visa.';
  }
  if (overseas.refusedVisaOrEntry === 'yes' && (!overseas.refusedVisaDetails || !overseas.refusedVisaDetails.trim())) {
    errors.refusedVisaDetails = 'Please provide details regarding visa refusal.';
  }

  if (!overseas.overstayedVisa) {
    errors.overstayedVisa = 'Please select if you have ever overstayed a visa or violated immigration rules.';
  }
  if (overseas.overstayedVisa === 'yes' && (!overseas.overstayedDetails || !overseas.overstayedDetails.trim())) {
    errors.overstayedDetails = 'Please provide details regarding immigration rule violations.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep3(recruitment: RecruitmentAgentExperienceDeclaration): ValidationResult {
  const errors: Record<string, string> = {};
  if (!recruitment.registeredWithOtherAgency) {
    errors.registeredWithOtherAgency = 'Please select if you have registered with another recruitment agency.';
  }

  if (!recruitment.paidMoneyForJob) {
    errors.paidMoneyForJob = 'Please select if you have paid money to any person/agency.';
  }
  if (recruitment.paidMoneyForJob === 'yes' && (!recruitment.paidAmountDetails || !recruitment.paidAmountDetails.trim())) {
    errors.paidAmountDetails = 'Please provide amount and details of payment.';
  }

  if (!recruitment.promisedGuaranteedJobForMoney) {
    errors.promisedGuaranteedJobForMoney = 'Please select if anyone promised a guaranteed job for money.';
  }
  if (recruitment.promisedGuaranteedJobForMoney === 'yes' && (!recruitment.promisedJobDetails || !recruitment.promisedJobDetails.trim())) {
    errors.promisedJobDetails = 'Please provide details of the promise made.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep4(ack: CandidateAcknowledgements): ValidationResult {
  const errors: Record<string, string> = {};
  if (!ack.noJobGuarantee) errors.noJobGuarantee = 'Required';
  if (!ack.subjectToEmployerReqs) errors.subjectToEmployerReqs = 'Required';
  if (!ack.subjectToVisaClearance) errors.subjectToVisaClearance = 'Required';
  if (!ack.tradeTestNoGuarantee) errors.tradeTestNoGuarantee = 'Required';
  if (!ack.agreeGenuineInfo) errors.agreeGenuineInfo = 'Required';
  if (!ack.falseDocConsequences) errors.falseDocConsequences = 'Required';
  if (!ack.agreeMedicalAndTesting) errors.agreeMedicalAndTesting = 'Required';
  if (!ack.transparentCharges) errors.transparentCharges = 'Required';

  const allChecked =
    ack.noJobGuarantee &&
    ack.subjectToEmployerReqs &&
    ack.subjectToVisaClearance &&
    ack.tradeTestNoGuarantee &&
    ack.agreeGenuineInfo &&
    ack.falseDocConsequences &&
    ack.agreeMedicalAndTesting &&
    ack.transparentCharges;

  if (!allChecked) {
    errors._general = 'All 8 candidate acknowledgements must be accepted before starting your journey.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateAllDeclarations(decl: Partial<WorkerPreJourneyDeclaration>): ValidationResult {
  const s1 = validateStep1(decl.medical || INITIAL_MEDICAL);
  const s2 = validateStep2(decl.overseas || INITIAL_OVERSEAS);
  const s3 = validateStep3(decl.recruitment || INITIAL_RECRUITMENT);
  const s4 = validateStep4(decl.acknowledgements || INITIAL_ACKNOWLEDGEMENTS);

  const combinedErrors = { ...s1.errors, ...s2.errors, ...s3.errors, ...s4.errors };
  return {
    isValid: Object.keys(combinedErrors).length === 0,
    errors: combinedErrors,
  };
}

export async function getWorkerDeclarations(userId: string): Promise<WorkerPreJourneyDeclaration | null> {
  if (!userId) return null;

  // 1. Check local storage first
  try {
    const localData = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (localData) {
      const parsed = JSON.parse(localData) as WorkerPreJourneyDeclaration;
      if (parsed && parsed.completed_at) {
        return parsed;
      }
    }
  } catch {
    /* ignore local storage error */
  }

  // 2. Fetch from Supabase worker_pre_journey_declarations table
  try {
    const { data, error } = await supabase
      .from('worker_pre_journey_declarations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      const decl: WorkerPreJourneyDeclaration = {
        id: data.id,
        user_id: data.user_id,
        medical: data.medical || INITIAL_MEDICAL,
        overseas: data.overseas || INITIAL_OVERSEAS,
        recruitment: data.recruitment || INITIAL_RECRUITMENT,
        acknowledgements: data.acknowledgements || INITIAL_ACKNOWLEDGEMENTS,
        completed_at: data.completed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // Save to localStorage cache
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(decl));
      } catch {
        /* ignore */
      }

      return decl;
    }
  } catch {
    /* table might not exist yet */
  }

  // 3. Check fallback metadata on worker_verification
  try {
    const { data: vData } = await supabase
      .from('worker_verification')
      .select('pre_screening_completed_at, screening_declarations')
      .eq('user_id', userId)
      .maybeSingle();

    if (vData && (vData as any).pre_screening_completed_at && (vData as any).screening_declarations) {
      const decl = (vData as any).screening_declarations as WorkerPreJourneyDeclaration;
      return decl;
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function saveWorkerDeclarations(
  userId: string,
  medical: MedicalFitnessDeclaration,
  overseas: PreviousOverseasEmploymentDeclaration,
  recruitment: RecruitmentAgentExperienceDeclaration,
  acknowledgements: CandidateAcknowledgements,
): Promise<WorkerPreJourneyDeclaration> {
  const completedAt = new Date().toISOString();
  const declRecord: WorkerPreJourneyDeclaration = {
    user_id: userId,
    medical,
    overseas,
    recruitment,
    acknowledgements,
    completed_at: completedAt,
  };

  // Validate first
  const valResult = validateAllDeclarations(declRecord);
  if (!valResult.isValid) {
    const errorMsg = Object.values(valResult.errors)[0] || 'Please complete all required fields and declarations.';
    throw new Error(errorMsg);
  }

  // Always cache locally first
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(declRecord));
  } catch {
    /* ignore */
  }

  // Try writing to dedicated table
  let dbSuccess = false;
  try {
    const { data, error } = await supabase
      .from('worker_pre_journey_declarations')
      .upsert(
        {
          user_id: userId,
          medical,
          overseas,
          recruitment,
          acknowledgements,
          completed_at: completedAt,
          updated_at: completedAt,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .maybeSingle();

    if (!error && data) {
      dbSuccess = true;
      declRecord.id = data.id;
    }
  } catch {
    /* ignore error if table is missing */
  }

  // Also update worker_verification metadata as fallback
  try {
    await supabase
      .from('worker_verification')
      .update({
        pre_screening_completed_at: completedAt,
        screening_declarations: declRecord,
        updated_at: completedAt,
      })
      .eq('user_id', userId);
  } catch {
    /* ignore */
  }

  return declRecord;
}
