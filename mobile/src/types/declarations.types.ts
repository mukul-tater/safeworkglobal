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
  noJobGuarantee: boolean;
  subjectToEmployerReqs: boolean;
  subjectToVisaClearance: boolean;
  tradeTestNoGuarantee: boolean;
  agreeGenuineInfo: boolean;
  falseDocConsequences: boolean;
  agreeMedicalAndTesting: boolean;
  transparentCharges: boolean;
}

/** The 8 mandatory acknowledgements — shared by the form and the completed review. */
export const CANDIDATE_ACKNOWLEDGEMENT_ITEMS: ReadonlyArray<{
  key: keyof CandidateAcknowledgements;
  text: string;
}> = [
  {
    key: 'noJobGuarantee',
    text: 'I understand that registration with SafeWork Global does not guarantee employment.',
  },
  {
    key: 'subjectToEmployerReqs',
    text: "I understand that final selection is subject to the employer's requirements and applicable recruitment procedures.",
  },
  {
    key: 'subjectToVisaClearance',
    text: 'I understand that visa issuance and immigration/emigration clearance are subject to the relevant authorities and applicable requirements.',
  },
  {
    key: 'tradeTestNoGuarantee',
    text: 'I understand that a trade test or skill verification does not guarantee employment.',
  },
  {
    key: 'agreeGenuineInfo',
    text: 'I agree to provide genuine and accurate information and documents.',
  },
  {
    key: 'falseDocConsequences',
    text: 'I understand that submitting false documents or false information may result in cancellation of my application and may have legal consequences.',
  },
  {
    key: 'agreeMedicalAndTesting',
    text: 'I agree to undergo medical examination, skill testing and other verification required for the relevant job/country.',
  },
  {
    key: 'transparentCharges',
    text: 'I have been informed that applicable recruitment/service charges will be disclosed transparently and handled through the authorized process.',
  },
];

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

/** Shown before medical questions — keep original ID documents in hand. */
export const ORIGINAL_DOCS_READY_NOTICE = {
  badgeEn: 'Before you begin',
  badgeHi: 'शुरू करने से पहले',
  titleEn: 'Keep your original documents with you',
  titleHi: 'अपने मूल दस्तावेज़ अपने पास रखें',
  bodyEn:
    'Before you start the worker journey and continue filling this form, keep your original PAN card, Aadhaar card, and passport with you and available.',
  bodyHi:
    'वर्कर जर्नी शुरू करने और यह फॉर्म भरना जारी रखने से पहले, अपना मूल पैन कार्ड, आधार कार्ड और पासपोर्ट अपने पास तैयार रखें।',
  items: [
    { en: 'Original PAN card', hi: 'मूल पैन कार्ड' },
    { en: 'Original Aadhaar card', hi: 'मूल आधार कार्ड' },
    { en: 'Original passport', hi: 'मूल पासपोर्ट' },
  ],
  continueEn: 'I have them with me — Continue',
  continueHi: 'ये दस्तावेज़ मेरे पास हैं — आगे बढ़ें',
} as const;
