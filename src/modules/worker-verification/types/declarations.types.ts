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
  /** Previously worked in a GCC country and returned to India. */
  gccReturn: 'no' | 'yes' | '';
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
  twoYearEmploymentCommitment: boolean;
}

export type EnHi = { en: string; hi: string };

/** The mandatory acknowledgements — shared by the form and the completed review. */
export const CANDIDATE_ACKNOWLEDGEMENT_ITEMS: ReadonlyArray<{
  key: keyof CandidateAcknowledgements;
  text: string;
  textHi: string;
}> = [
  {
    key: 'noJobGuarantee',
    text: 'I understand that registration with SafeWork Global does not guarantee employment.',
    textHi: 'मैं समझता/समझती हूँ कि SafeWork Global के साथ पंजीकरण रोजगार की गारंटी नहीं है।',
  },
  {
    key: 'subjectToEmployerReqs',
    text: "I understand that final selection is subject to the employer's requirements and applicable recruitment procedures.",
    textHi: 'मैं समझता/समझती हूँ कि अंतिम चयन नियोक्ता की आवश्यकताओं और लागू भर्ती प्रक्रियाओं पर निर्भर है।',
  },
  {
    key: 'subjectToVisaClearance',
    text: 'I understand that visa issuance and immigration/emigration clearance are subject to the relevant authorities and applicable requirements.',
    textHi: 'मैं समझता/समझती हूँ कि वीज़ा जारी करना और आप्रवास/उत्प्रवास मंजूरी संबंधित अधिकारियों और लागू आवश्यकताओं पर निर्भर है।',
  },
  {
    key: 'tradeTestNoGuarantee',
    text: 'I understand that a trade test or skill verification does not guarantee employment.',
    textHi: 'मैं समझता/समझती हूँ कि ट्रेड टेस्ट या कौशल सत्यापन रोजगार की गारंटी नहीं है।',
  },
  {
    key: 'agreeGenuineInfo',
    text: 'I agree to provide genuine and accurate information and documents.',
    textHi: 'मैं सही और सच्ची जानकारी तथा दस्तावेज़ देने के लिए सहमत हूँ।',
  },
  {
    key: 'falseDocConsequences',
    text: 'I understand that submitting false documents or false information may result in cancellation of my application and may have legal consequences.',
    textHi: 'मैं समझता/समझती हूँ कि झूठे दस्तावेज़ या गलत जानकारी देने से मेरा आवेदन रद्द हो सकता है और कानूनी परिणाम हो सकते हैं।',
  },
  {
    key: 'agreeMedicalAndTesting',
    text: 'I agree to undergo medical examination, skill testing and other verification required for the relevant job/country.',
    textHi: 'मैं संबंधित नौकरी/देश के लिए आवश्यक चिकित्सा जाँच, कौशल परीक्षण और अन्य सत्यापन कराने के लिए सहमत हूँ।',
  },
  {
    key: 'transparentCharges',
    text: 'I have been informed that applicable recruitment/service charges will be disclosed transparently and handled through the authorized process.',
    textHi: 'मुझे बताया गया है कि लागू भर्ती/सेवा शुल्क पारदर्शी रूप से बताए जाएँगे और अधिकृत प्रक्रिया से लिए जाएँगे।',
  },
  {
    key: 'twoYearEmploymentCommitment',
    text: 'I agree to comply with my 2-year employment commitment and understand that if I voluntarily leave before completing the agreed period, I may be liable for any applicable penalty or legally recoverable costs specified in my employment contract and applicable law.',
    textHi: 'मैं अपनी 2-वर्षीय रोजगार प्रतिबद्धता का पालन करने के लिए सहमत हूँ, और समझता/समझती हूँ कि यदि मैं सहमत अवधि पूरी करने से पहले स्वेच्छा से नौकरी छोड़ता/छोड़ती हूँ, तो मैं अपने रोजगार अनुबंध और लागू कानून में बताए गए दंड या कानूनी रूप से वसूली योग्य खर्चों के लिए उत्तरदायी हो सकता/सकती हूँ।',
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
    'Keep your original Aadhaar card with you. PAN and passport can be uploaded later — we will ask for them after your skill test is complete.',
  bodyHi:
    'अपना मूल आधार कार्ड अपने पास रखें। पैन और पासपोर्ट बाद में अपलोड कर सकते हैं — कौशल परीक्षा पूरी होने के बाद हम ये माँगेंगे।',
  items: [
    { en: 'Original PAN card', hi: 'मूल पैन कार्ड' },
    { en: 'Original Aadhaar card (Must)', hi: 'मूल आधार कार्ड (अनिवार्य)' },
    { en: 'Original passport', hi: 'मूल पासपोर्ट' },
  ],
  continueEn: 'I have my Aadhaar — Continue',
  continueHi: 'मेरा आधार मेरे पास है — आगे बढ़ें',
} as const;

/** English on top, Hindi below — used throughout the pre-journey declaration form. */
export const PRE_JOURNEY_COPY = {
  headerBadge: { en: 'Pre-Journey Validation & Declarations', hi: 'यात्रा-पूर्व सत्यापन और घोषणाएँ' },
  headerTitle: { en: 'Worker Pre-Placement Declarations', hi: 'श्रमिक प्री-प्लेसमेंट घोषणाएँ' },
  headerDesc: {
    en: 'Before starting your worker journey, please complete these mandatory health, overseas work, recruitment fee, and candidate compliance checks.',
    hi: 'वर्कर जर्नी शुरू करने से पहले, ये अनिवार्य स्वास्थ्य, विदेशी काम, रिक्रूटमेंट शुल्क और अनुपालन जाँच पूरी करें।',
  },
  nav: [
    { en: 'Medical & Fitness', hi: 'चिकित्सा और फिटनेस' },
    { en: 'Overseas Work', hi: 'विदेशी काम' },
    { en: 'Agent & Fees', hi: 'एजेंट और शुल्क' },
    { en: 'Acknowledgements', hi: 'स्वीकृतियाँ' },
  ],
  yes: { en: 'Yes', hi: 'हाँ' },
  no: { en: 'No', hi: 'नहीं' },
  notSure: { en: 'Not Sure', hi: 'पता नहीं' },
  yesDetails: { en: 'Yes — Details', hi: 'हाँ — विवरण' },
  yesMedical: { en: 'Yes — Please provide relevant information', hi: 'हाँ — कृपया जानकारी दें' },
  yesAmount: { en: 'Yes — Amount / Details', hi: 'हाँ — राशि / विवरण' },
  back: { en: 'Back', hi: 'पीछे' },
  next: { en: 'Next Step', hi: 'अगला चरण' },
  submit: { en: 'Validate & Start Worker Journey', hi: 'सत्यापित करें और वर्कर जर्नी शुरू करें' },
  saving: { en: 'Saving Declarations...', hi: 'घोषणाएँ सहेजी जा रही हैं...' },
  selectAll: { en: 'Agree to all terms and conditions', hi: 'सभी नियम और शर्तों से सहमत हूँ' },
  allAccepted: { en: 'All terms accepted', hi: 'सभी शर्तें स्वीकार की गईं' },
  incomplete: { en: 'Incomplete Declarations', hi: 'अधूरी घोषणाएँ' },
  medical: {
    title: { en: '1. Medical & Fitness', hi: '1. चिकित्सा और फिटनेस' },
    desc: {
      en: 'Declare your physical suitability for overseas skilled trade work.',
      hi: 'विदेशी कुशल काम के लिए अपनी शारीरिक उपयुक्तता घोषित करें।',
    },
    q1: {
      en: '1. Do you consider yourself physically fit to perform the essential duties of the trade/job you are applying for?',
      hi: '1. क्या आप उस ट्रेड/नौकरी के आवश्यक काम करने के लिए अपने आपको शारीरिक रूप से फिट मानते हैं?',
    },
    q2: {
      en: '2. Do you have any medical condition or physical limitation that you believe may prevent you from safely performing the essential duties of the job?',
      hi: '2. क्या आपको कोई ऐसी बीमारी या शारीरिक सीमा है जिससे आप इस नौकरी का काम सुरक्षित रूप से नहीं कर पाएँगे?',
    },
    details: { en: 'Medical Details & Information', hi: 'चिकित्सा विवरण और जानकारी' },
    disclaimerTitle: { en: 'Medical Fitness Disclaimer', hi: 'चिकित्सा फिटनेस अस्वीकरण' },
    disclaimerBody: {
      en: 'This declaration does not replace the medical examination required by the employer, destination country or applicable authorities. Final medical fitness will be determined through the applicable medical examination process.',
      hi: 'यह घोषणा नियोक्ता, गंतव्य देश या अधिकारियों द्वारा आवश्यक चिकित्सा जाँच की जगह नहीं लेती। अंतिम चिकित्सा फिटनेस निर्धारित चिकित्सा जाँच से तय होगी।',
    },
  },
  overseas: {
    title: { en: '2. Previous Overseas Employment', hi: '2. पिछला विदेशी रोजगार' },
    desc: {
      en: 'Tell us about your prior work experience outside India and immigration history.',
      hi: 'भारत के बाहर अपने पिछले काम और इमिग्रेशन इतिहास के बारे में बताएँ।',
    },
    q3: {
      en: '3. Have you previously worked outside India?',
      hi: '3. क्या आप पहले भारत के बाहर काम कर चुके हैं?',
    },
    q4: {
      en: '4. Are you a GCC return worker?',
      hi: '4. क्या आप GCC रिटर्न वर्कर हैं?',
    },
    q4Hint: {
      en: 'Have you previously worked in a GCC country (UAE, Saudi Arabia, Qatar, Kuwait, Oman or Bahrain) and returned to India?',
      hi: 'क्या आप पहले किसी GCC देश (UAE, सऊदी अरब, कतर, कुवैत, ओमान या बहरीन) में काम करके भारत लौटे हैं?',
    },
    details: { en: 'Details of Previous Overseas Employment', hi: 'पिछले विदेशी रोजगार का विवरण' },
    country: { en: 'Country', hi: 'देश' },
    employer: { en: 'Employer Name', hi: 'नियोक्ता का नाम' },
    jobTrade: { en: 'Job / Trade', hi: 'नौकरी / ट्रेड' },
    durationYear: { en: 'Duration & Year', hi: 'अवधि और वर्ष' },
    q5: {
      en: '5. Have you previously been deported, removed or repatriated from another country?',
      hi: '5. क्या आपको पहले किसी दूसरे देश से निर्वासित, निकाला या वापस भेजा गया है?',
    },
    deportedDetails: { en: 'Deportation / Repatriation Details', hi: 'निर्वासन / वापसी का विवरण' },
    q6: {
      en: '6. Have you ever been refused entry, refused a work visa, or had an employment/residence visa cancelled by another country?',
      hi: '6. क्या किसी देश ने कभी आपका प्रवेश या वर्क वीज़ा अस्वीकार किया है, या आपका रोजगार/निवास वीज़ा रद्द किया है?',
    },
    visaDetails: { en: 'Visa Refusal Details', hi: 'वीज़ा अस्वीकृति का विवरण' },
    q7: {
      en: '7. Have you ever overstayed a visa or violated immigration rules in another country?',
      hi: '7. क्या आपने कभी किसी दूसरे देश में वीज़ा ओवरस्टे किया है या इमिग्रेशन नियम तोड़े हैं?',
    },
    overstayDetails: { en: 'Immigration Overstay Details', hi: 'वीज़ा ओवरस्टे का विवरण' },
  },
  recruitment: {
    title: { en: '3. Previous Recruitment / Agent Experience', hi: '3. पिछला रिक्रूटमेंट / एजेंट अनुभव' },
    desc: {
      en: 'Help SafeWork protect you against unauthorized agency fees, fraud, or duplicate recruitment.',
      hi: 'अनधिकृत एजेंसी शुल्क, धोखाधड़ी या दोहरी भर्ती से सुरक्षा के लिए बताएँ।',
    },
    q8: {
      en: '8. Have you previously registered with another overseas recruitment agency/agent for this job or another overseas job?',
      hi: '8. क्या आपने पहले किसी अन्य ओवरसीज़ रिक्रूटमेंट एजेंसी/एजेंट के साथ इस नौकरी या किसी अन्य विदेशी नौकरी के लिए पंजीकरण किया है?',
    },
    agencyDetails: { en: 'Agency / Agent Details', hi: 'एजेंसी / एजेंट का विवरण' },
    q9: {
      en: '9. Have you already paid money to any person/agency for an overseas job related to this application?',
      hi: '9. क्या आपने इस आवेदन से जुड़ी विदेशी नौकरी के लिए किसी व्यक्ति/एजेंसी को पहले से पैसे दिए हैं?',
    },
    paidDetails: { en: 'Amount & Payment Details', hi: 'राशि और भुगतान का विवरण' },
    q10: {
      en: '10. Has anyone promised you a guaranteed overseas job, visa or deployment in exchange for money?',
      hi: '10. क्या किसी ने पैसे के बदले आपको गारंटीशुदा विदेशी नौकरी, वीज़ा या तैनाती का वादा किया है?',
    },
    promiseDetails: { en: 'Promise Details', hi: 'वादे का विवरण' },
  },
  ack: {
    title: { en: '4. Worker Understanding', hi: '4. श्रमिक की सहमति' },
    desc: {
      en: 'Candidate Acknowledgement — Before allowing entry into the next stage, all 9 checkboxes are mandatory.',
      hi: 'उम्मीदवार स्वीकृति — अगले चरण में जाने से पहले सभी 9 बॉक्स अनिवार्य हैं।',
    },
  },
  summary: {
    title: { en: 'Pre-Journey Declarations & Screening Verified', hi: 'यात्रा-पूर्व घोषणाएँ और स्क्रीनिंग सत्यापित' },
  },
} as const;
