export interface MedicalFitnessDeclaration {
  fitForDuties: 'yes' | 'no' | 'not_sure' | '';
  hasMedicalCondition: 'no' | 'yes' | '';
  medicalConditionDetails?: string;
  disclaimerAcknowledged: boolean;
}

export interface OverseasWorkItem {
  country: string;
  employer: string;
  jobTrade: string;
  duration: string;
  year: string;
}

export interface PreviousOverseasEmploymentDeclaration {
  workedOutsideIndia: 'no' | 'yes' | '';
  overseasDetails?: OverseasWorkItem;
  beenDeported: 'no' | 'yes' | '';
  deportedDetails?: string;
  refusedVisaOrEntry: 'no' | 'yes' | '';
  refusedVisaDetails?: string;
  overstayedVisa: 'no' | 'yes' | '';
  overstayedDetails?: string;
}

export interface RecruitmentAgentExperienceDeclaration {
  registeredWithOtherAgency: 'no' | 'yes' | '';
  agencyDetails?: string;
  paidMoneyForJob: 'no' | 'yes' | '';
  paidAmountDetails?: string;
  promisedGuaranteedJobForMoney: 'no' | 'yes' | '';
  promisedJobDetails?: string;
}

export interface CandidateAcknowledgements {
  noJobGuarantee: boolean; // 1. Registration with SafeWork Global does not guarantee employment
  subjectToEmployerReqs: boolean; // 2. Final selection is subject to employer's requirements & procedures
  subjectToVisaClearance: boolean; // 3. Visa issuance & clearance subject to relevant authorities
  tradeTestNoGuarantee: boolean; // 4. Trade test / skill verification does not guarantee employment
  agreeGenuineInfo: boolean; // 5. Agree to provide genuine and accurate info and documents
  falseDocConsequences: boolean; // 6. False docs/info may result in cancellation & legal consequences
  agreeMedicalAndTesting: boolean; // 7. Agree to undergo medical exam, skill testing & verification
  transparentCharges: boolean; // 8. Applicable recruitment charges will be disclosed transparently
}

export interface WorkerPreJourneyDeclaration {
  id?: string;
  user_id: string;
  medical: MedicalFitnessDeclaration;
  overseas: PreviousOverseasEmploymentDeclaration;
  recruitment: RecruitmentAgentExperienceDeclaration;
  acknowledgements: CandidateAcknowledgements;
  completed_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
