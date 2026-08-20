export type FaqEntry = {
  n: number;
  qEn: string;
  qHi: string;
  aEn: string;
  aHi: string;
  bulletsEn?: string[];
  extra?: "vesta-ra";
};

export type FaqGroup = {
  id: string;
  titleEn: string;
  titleHi: string;
  items: FaqEntry[];
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "workers",
    titleEn: "For Workers",
    titleHi: "श्रमिकों के लिए",
    items: [
      {
        n: 1,
        qEn: "What is SafeWork Global?",
        qHi: "SafeWork Global क्या है?",
        aEn: "SafeWork Global is a technology and workforce mobility platform that connects skilled Indian workers with international employment opportunities through worker onboarding, skill verification, trade testing, employer matching and recruitment coordination.",
        aHi: "SafeWork Global एक technology और workforce mobility platform है, जो भारतीय skilled workers को skill verification, trade testing, employer matching और recruitment coordination के माध्यम से अंतरराष्ट्रीय रोजगार के अवसरों से जोड़ता है।",
      },
      {
        n: 2,
        qEn: "Who can register with SafeWork Global?",
        qHi: "कौन रजिस्टर कर सकता है?",
        aEn: "Any eligible skilled worker who is interested in overseas employment can create a profile, subject to the requirements of the particular job.",
        aHi: "विदेश में रोजगार के इच्छुक eligible skilled workers SafeWork Global पर अपना profile बना सकते हैं। प्रत्येक job की अपनी eligibility requirements हो सकती हैं।",
      },
      {
        n: 3,
        qEn: "Do I need a passport to give a trade test?",
        qHi: "क्या ट्रेड टेस्ट के लिए पासपोर्ट जरूरी है?",
        aEn: "No. You can appear for a trade test even if you don't have a passport yet. However, a valid passport is required for emigration clearance and international travel.",
        aHi: "नहीं। अगर आपके पास अभी पासपोर्ट नहीं है, तो भी आप ट्रेड टेस्ट दे सकते हैं। हालांकि, इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।",
      },
      {
        n: 4,
        qEn: "What trades can I register for?",
        qHi: "कौन-कौन से trade उपलब्ध हैं?",
        aEn: "Depending on available opportunities, SafeWork may onboard workers across trades such as:",
        aHi: "उपलब्ध jobs और employer requirements के अनुसार अलग-अलग trades के लिए registration किया जा सकता है।",
        bulletsEn: [
          "Electrician",
          "Plumber",
          "Welder",
          "HVAC Technician",
          "Fitter",
          "Carpenter",
          "Mason",
          "Construction Worker",
          "Driver",
          "Other skilled trades",
        ],
      },
      {
        n: 5,
        qEn: "How does the SafeWork process work?",
        qHi: "प्रक्रिया:",
        aEn: "Register → Document Verification → Technical Screening → Skill/Trade Test → Employer Interview → Recruitment & Documentation → Deployment",
        aHi: "रजिस्ट्रेशन → दस्तावेज़ सत्यापन → तकनीकी स्क्रीनिंग → Skill/Trade Test → Employer Interview → Recruitment एवं Documentation → Deployment",
      },
      {
        n: 6,
        qEn: "What is a trade test?",
        qHi: "ट्रेड टेस्ट क्या है?",
        aEn: "A trade test is a practical assessment used to evaluate your actual skills in your trade. For example, an electrician may be assessed on single-phase & three-phase systems, MCB/DB, wiring, cable termination, electrical drawings, multimeter testing and electrical safety.",
        aHi: "ट्रेड टेस्ट में आपके practical skills को आपके trade के अनुसार assess किया जाता है।",
      },
      {
        n: 7,
        qEn: "Will every worker have to take a physical trade test?",
        qHi: "क्या हर worker को physical trade test देना होगा?",
        aEn: "Not necessarily. The assessment requirement may depend on the trade, employer requirements, previous verification, technical interview and applicable recruitment process.",
        aHi: "जरूरी नहीं। यह trade, employer requirement, technical interview और applicable verification process पर निर्भर कर सकता है।",
      },
      {
        n: 8,
        qEn: "Does passing the trade test guarantee a job?",
        qHi: "क्या ट्रेड टेस्ट पास करने से नौकरी पक्की हो जाती है?",
        aEn: "No. Passing a trade test confirms your performance against the applicable assessment criteria. Final employment selection depends on the employer and other applicable recruitment, documentation and immigration requirements.",
        aHi: "नहीं। ट्रेड टेस्ट आपके skill assessment का परिणाम बताता है। अंतिम चयन employer तथा लागू recruitment, documentation और immigration requirements पर निर्भर करता है।",
      },
      {
        n: 9,
        qEn: "Does SafeWork guarantee a visa?",
        qHi: "क्या SafeWork visa की guarantee देता है?",
        aEn: "No. Visa issuance and immigration clearance are subject to the relevant authorities and applicable requirements.",
        aHi: "नहीं। Visa और immigration clearance संबंधित authorities और लागू requirements के अधीन होते हैं।",
      },
      {
        n: 10,
        qEn: "Can I apply for more than one job?",
        qHi: "क्या मैं एक से ज्यादा jobs के लिए apply कर सकता हूं?",
        aEn: "Yes, where you meet the eligibility requirements and the applicable recruitment process allows it.",
        aHi: "हाँ, यदि आप संबंधित jobs की eligibility requirements पूरी करते हैं और applicable recruitment process इसकी अनुमति देता है।",
      },
    ],
  },
  {
    id: "fees",
    titleEn: "Fees & Payments",
    titleHi: "शुल्क एवं भुगतान",
    items: [
      {
        n: 11,
        qEn: "How much does SafeWork charge workers?",
        qHi: "Worker से कितना charge लिया जाएगा?",
        aEn: "Any applicable candidate/service charges will be communicated transparently before the relevant service and will be subject to applicable Government of India/MEA rules and requirements.",
        aHi: "यदि कोई applicable candidate/service charge है, तो संबंधित service से पहले आपको स्पष्ट रूप से बताया जाएगा और वह भारत सरकार/MEA के लागू नियमों एवं requirements के अनुसार होगा।",
      },
      {
        n: 12,
        qEn: "Should I pay cash to an E-Mitra or other partner?",
        qHi: "क्या मुझे E-Mitra या किसी partner को cash देना चाहिए?",
        aEn: "Do not make any payment unless the charge is officially communicated through the authorized SafeWork/Vesta process and you receive the applicable receipt.",
        aHi: "बिना authorized process और proper receipt के कोई payment न करें। Applicable charges आपको पहले से स्पष्ट रूप से बताए जाएंगे।",
      },
      {
        n: 13,
        qEn: "Is registration a guarantee of employment?",
        qHi: "क्या registration से नौकरी की guarantee मिलती है?",
        aEn: "No. Registration only creates your candidate profile. Employment depends on eligibility, skill verification, employer requirements, selection and the applicable recruitment process.",
        aHi: "नहीं। Registration से आपका candidate profile बनता है। नौकरी eligibility, skill verification, employer requirements, selection और applicable recruitment process पर निर्भर करती है।",
      },
    ],
  },
  {
    id: "documents",
    titleEn: "Documents",
    titleHi: "दस्तावेज़",
    items: [
      {
        n: 14,
        qEn: "What documents may I need?",
        qHi: "कौन से documents चाहिए हो सकते हैं?",
        aEn: "Depending on the job and recruitment stage, you may be asked for documents such as:",
        aHi: "Job और recruitment stage के अनुसार passport, Aadhaar, PAN, educational/ITI certificates, experience certificates, skill certificates और अन्य applicable documents मांगे जा सकते हैं।",
        bulletsEn: [
          "Passport",
          "Aadhaar",
          "PAN",
          "Educational/ITI certificates",
          "Experience certificates",
          "Skill certificates",
          "Photographs",
          "Medical/other documents as applicable",
        ],
      },
      {
        n: 15,
        qEn: "What if I don't have an experience certificate?",
        qHi: "अगर मेरे पास experience certificate नहीं है तो?",
        aEn: "You can still register. However, certain employers or jobs may require documented proof of experience.",
        aHi: "आप registration कर सकते हैं। हालांकि, कुछ employers या jobs में experience का documentary proof आवश्यक हो सकता है।",
      },
      {
        n: 16,
        qEn: "Can I update my profile later?",
        qHi: "क्या मैं बाद में अपना profile update कर सकता हूं?",
        aEn: "Yes. You may update eligible information and documents through the SafeWork platform, subject to verification.",
        aHi: "हाँ, verified process के अनुसार आप अपने profile की eligible information और documents update कर सकते हैं।",
      },
    ],
  },
  {
    id: "overseas",
    titleEn: "Overseas Employment",
    titleHi: "विदेश रोजगार",
    items: [
      {
        n: 17,
        qEn: "Who selects the worker?",
        qHi: "Worker का final selection कौन करता है?",
        aEn: "The overseas employer makes the final employment selection, subject to the applicable recruitment process.",
        aHi: "Final employment selection overseas employer द्वारा किया जाता है, applicable recruitment process के अनुसार।",
      },
      {
        n: 18,
        qEn: "Who conducts the overseas recruitment process?",
        qHi: "Overseas recruitment कौन करता है?",
        aEn: "SafeWork Global provides the technology and workforce mobility platform. Where regulated overseas recruitment is required, the process is conducted through the designated registered Recruitment Agent.",
        aHi: "SafeWork Global technology और workforce mobility platform है। जहां registered Recruitment Agent के माध्यम से recruitment आवश्यक है, वहां applicable overseas recruitment process designated registered Recruitment Agent के माध्यम से conducted होता है।",
        extra: "vesta-ra",
      },
      {
        n: 19,
        qEn: "What happens after an employer selects me?",
        qHi: "Employer के select करने के बाद क्या होगा?",
        aEn: "Depending on the job, the process may include employment documentation, recruitment formalities, medical requirements, visa processing, emigration clearance and other applicable pre-departure requirements.",
        aHi: "Job के अनुसार employment documentation, recruitment formalities, medical, visa processing, emigration clearance और अन्य applicable pre-departure requirements पूरे किए जा सकते हैं।",
      },
      {
        n: 20,
        qEn: "What is emigration clearance?",
        qHi: "Emigration Clearance क्या है?",
        aEn: "Emigration clearance is a regulatory requirement applicable to certain Indian workers travelling abroad for employment, depending on their passport status/category and destination/employment circumstances.",
        aHi: "कुछ भारतीय workers के लिए विदेश में employment के लिए travel करते समय, उनकी passport category और applicable circumstances के अनुसार emigration clearance की आवश्यकता हो सकती है।",
      },
    ],
  },
  {
    id: "safety",
    titleEn: "Safety",
    titleHi: "सुरक्षा",
    items: [
      {
        n: 21,
        qEn: "How can I verify whether a recruitment agent is genuine?",
        qHi: "Recruitment Agent genuine है या नहीं, कैसे check करें?",
        aEn: "Workers should independently verify the Recruitment Agent's registration and relevant overseas employment information through the Government of India's official eMigrate/MEA resources.",
        aHi: "Government of India's official eMigrate/MEA resources के माध्यम से Recruitment Agent की registration details और relevant employment information independently verify करें।",
      },
      {
        n: 22,
        qEn: "Does SafeWork represent the Government of India?",
        qHi: "क्या SafeWork भारत सरकार की संस्था है?",
        aEn: "No. SafeWork Global is a private technology and workforce mobility platform. It is not a Government of India department or agency.",
        aHi: "नहीं। SafeWork Global एक private technology और workforce mobility platform है। यह भारत सरकार का department या agency नहीं है।",
      },
      {
        n: 23,
        qEn: "What should I do if someone promises me a guaranteed foreign job or visa?",
        qHi: "अगर कोई guaranteed foreign job या visa का promise करे तो क्या करें?",
        aEn: "Be cautious. Do not make payments based solely on verbal promises. Ask for the official job details, employment terms, applicable charges and authorized documentation.",
        aHi: "सावधान रहें। केवल verbal promise के आधार पर payment न करें। Official job details, employment terms, applicable charges और authorized documents की जानकारी प्राप्त करें।",
      },
      {
        n: 24,
        qEn: "What if I face a problem or want to make a complaint?",
        qHi: "अगर मुझे कोई समस्या हो तो?",
        aEn: "You can contact SafeWork through our official support channels. For independent government assistance, verification or grievance support, you can also use the official MEA/eMigrate channels.",
        aHi: "SafeWork के official support channels से संपर्क करें। इसके अलावा independent government assistance, verification या grievance के लिए official MEA/eMigrate channels का उपयोग कर सकते हैं।",
      },
    ],
  },
];
