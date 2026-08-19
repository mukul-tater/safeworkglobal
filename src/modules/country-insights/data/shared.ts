import type {
  Bilingual,
  ChecklistItem,
  ComparisonRow,
  CountryInsight,
  PhotoRecord,
  RuleCard,
  SalaryPackage,
  SectorCard,
} from "../types";
import { PENDING_VERIFY } from "../types";

export const pendingPhoto = (id: string, category: string, alt: Bilingual): PhotoRecord => ({
  id,
  category,
  alt,
});

export const GCC_SECTORS: Bilingual[] = [
  { en: "Construction", hi: "निर्माण" },
  { en: "MEP / Electrical", hi: "MEP / बिजली" },
  { en: "Hospitality", hi: "आतिथ्य" },
  { en: "Logistics", hi: "लॉजिस्टिक्स" },
];

export const LISTING_BLURB: Bilingual = {
  en: "Explore work opportunities, working conditions, accommodation, lifestyle and important information for Indian workers.",
  hi: "भारतीय workers के लिए काम के अवसर, working conditions, accommodation, lifestyle और महत्वपूर्ण जानकारी देखें।",
};

const asPerContract: Bilingual = {
  en: "As per applicable employment terms",
  hi: "लागू employment terms के अनुसार",
};

const varies: Bilingual = {
  en: "Employer provided / allowance / self — confirm in your contract",
  hi: "Employer provided / allowance / स्वयं — अपने contract में confirm करें",
};

export const SALARY_PACKAGES: SalaryPackage[] = [
  { trade: { en: "Electrician", hi: "इलेक्ट्रीशियन" } },
  { trade: { en: "Plumber", hi: "प्लंबर" } },
  { trade: { en: "Welder", hi: "वेल्डर" } },
  { trade: { en: "HVAC Technician", hi: "HVAC तकनीशियन" } },
].map((row) => ({
  ...row,
  basicSalary: null,
  overtime: asPerContract,
  accommodation: varies,
  food: varies,
  transport: varies,
  medicalInsurance: {
    en: "As applicable",
    hi: "जहां लागू हो",
  },
  annualLeave: {
    en: "As per applicable contract/law",
    hi: "लागू contract/कानून के अनुसार",
  },
}));

export const BENEFIT_ITEMS: ChecklistItem[] = [
  { id: "salary", label: { en: "Salary", hi: "वेतन" } },
  { id: "hours", label: { en: "Working Hours", hi: "काम के घंटे" } },
  { id: "ot", label: { en: "Overtime", hi: "ओवरटाइम" } },
  { id: "acc", label: { en: "Accommodation", hi: "रहने की व्यवस्था" } },
  { id: "food", label: { en: "Food / Food Allowance", hi: "खाना / फूड अलाउंस" } },
  { id: "transport", label: { en: "Transport", hi: "परिवहन" } },
  { id: "medical", label: { en: "Medical Insurance", hi: "मेडिकल इंश्योरेंस" } },
  { id: "leave", label: { en: "Annual Leave", hi: "वार्षिक छुट्टी" } },
  { id: "ticket", label: { en: "Air Ticket, where applicable", hi: "जहां लागू हो, एयर टिकट" } },
  { id: "contract", label: { en: "Employment Contract", hi: "Employment Contract" } },
];

export const SAFETY_ITEMS: ChecklistItem[] = [
  { id: "employer", label: { en: "Employer Name", hi: "Employer का नाम" } },
  { id: "title", label: { en: "Job Title", hi: "Job Title" } },
  { id: "salary", label: { en: "Basic Salary", hi: "बेसिक सैलरी" } },
  { id: "ot", label: { en: "Overtime Terms", hi: "ओवरटाइम शर्तें" } },
  { id: "hours", label: { en: "Working Hours", hi: "काम के घंटे" } },
  { id: "acc", label: { en: "Accommodation", hi: "रहने की व्यवस्था" } },
  { id: "food", label: { en: "Food / Allowance", hi: "खाना / अलाउंस" } },
  { id: "transport", label: { en: "Transport", hi: "परिवहन" } },
  { id: "medical", label: { en: "Medical Insurance", hi: "मेडिकल इंश्योरेंस" } },
  { id: "contract", label: { en: "Employment Contract", hi: "Employment Contract" } },
];

export const KNOW_ITEMS: ChecklistItem[] = [
  { id: "role", label: { en: "Job role", hi: "Job role" } },
  { id: "employer", label: { en: "Employer", hi: "Employer" } },
  { id: "salary", label: { en: "Salary", hi: "वेतन" } },
  { id: "hours", label: { en: "Working hours", hi: "काम के घंटे" } },
  { id: "ot", label: { en: "Overtime", hi: "ओवरटाइम" } },
  { id: "acc", label: { en: "Accommodation", hi: "रहने की व्यवस्था" } },
  { id: "food", label: { en: "Food", hi: "खाना" } },
  { id: "transport", label: { en: "Transport", hi: "परिवहन" } },
  { id: "medical", label: { en: "Medical insurance", hi: "मेडिकल इंश्योरेंस" } },
  { id: "contract", label: { en: "Contract", hi: "Contract" } },
  { id: "visa", label: { en: "Visa", hi: "Visa" } },
  { id: "recruitment", label: { en: "Recruitment process", hi: "भर्ती प्रक्रिया" } },
  { id: "fees", label: { en: "Applicable fees", hi: "लागू शुल्क" } },
  { id: "ecr", label: { en: "Emigration requirements", hi: "इमिग्रेशन आवश्यकताएं" } },
];

export const RULE_CARDS: RuleCard[] = [
  {
    id: "passport",
    title: { en: "Passport", hi: "पासपोर्ट" },
    body: {
      en: "A valid passport is required for emigration clearance and international travel. You can still appear for a trade test without a passport.",
      hi: "इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है। ट्रेड टेस्ट पासपोर्ट के बिना भी दिया जा सकता है।",
    },
  },
  {
    id: "contract",
    title: { en: "Employment Contract", hi: "Employment Contract" },
    body: {
      en: "Read your written job terms, salary, hours, overtime and deductions before you agree to travel.",
      hi: "यात्रा से पहले लिखित job terms, वेतन, घंटे, ओवरटाइम और कटौती पढ़ें।",
    },
  },
  {
    id: "visa",
    title: { en: "Visa", hi: "Visa" },
    body: {
      en: "Visa issuance is decided by the relevant authorities. SafeWork does not guarantee a visa.",
      hi: "Visa संबंधित authorities के अधीन होता है। SafeWork visa की guarantee नहीं देता।",
    },
  },
  {
    id: "medical",
    title: { en: "Medical", hi: "Medical" },
    body: {
      en: "Medical requirements depend on the job, destination and applicable recruitment process.",
      hi: "Medical आवश्यकताएं job, देश और लागू भर्ती प्रक्रिया पर निर्भर करती हैं।",
    },
  },
  {
    id: "insurance",
    title: { en: "Insurance", hi: "Insurance" },
    body: {
      en: "Confirm medical insurance cover in your offer and contract before travelling.",
      hi: "यात्रा से पहले अपने offer और contract में medical insurance की पुष्टि करें।",
    },
  },
  {
    id: "employer",
    title: { en: "Employer Details", hi: "Employer Details" },
    body: {
      en: "Know the employer name, job title and work location in writing.",
      hi: "Employer का नाम, job title और work location लिखित में जानें।",
    },
  },
  {
    id: "accommodation",
    title: { en: "Accommodation", hi: "Accommodation" },
    body: {
      en: "Confirm whether housing is provided, an allowance is paid, or you arrange it yourself.",
      hi: "रहने की व्यवस्था company देती है, allowance मिलता है, या स्वयं करनी है — यह confirm करें।",
    },
  },
  {
    id: "transport",
    title: { en: "Transport", hi: "Transport" },
    body: {
      en: "Ask how you will travel between accommodation and the worksite.",
      hi: "Accommodation और worksite के बीच आना-जाना कैसे होगा, पूछें।",
    },
  },
  {
    id: "ecr",
    title: { en: "Emigration Clearance, where applicable", hi: "जहां लागू हो Emigration Clearance" },
    body: {
      en: "Some Indian workers need emigration clearance depending on passport category and destination. Verify through official Government of India channels.",
      hi: "कुछ भारतीय workers को passport category और destination के अनुसार emigration clearance चाहिए हो सकता है। आधिकारिक भारत सरकार के माध्यमों से verify करें।",
    },
    officialUrl: "https://emigrate.gov.in/",
  },
];

export const WORKING_SECTORS: SectorCard[] = [
  {
    id: "construction",
    name: { en: "Construction", hi: "निर्माण" },
    summary: {
      en: "Building, infrastructure and site work on projects that vary by employer and location.",
      hi: "भवन, इंफ्रास्ट्रक्चर और साइट का काम — employer और location के अनुसार अलग हो सकता है।",
    },
    environment: {
      en: "Often outdoor or mixed indoor/outdoor sites. Confirm hours, PPE and heat-safety rules in your contract and site briefing.",
      hi: "अक्सर बाहरी या मिश्रित साइट। घंटे, PPE और गर्मी से सुरक्षा अपने contract और साइट briefing में confirm करें।",
    },
  },
  {
    id: "mep",
    name: { en: "MEP", hi: "MEP" },
    summary: {
      en: "Mechanical, electrical and plumbing installation and maintenance.",
      hi: "मैकेनिकल, इलेक्ट्रिकल और प्लंबिंग इंस्टॉलेशन तथा मेंटेनेंस।",
    },
    environment: {
      en: "May include plant rooms, buildings under construction, and occupied facilities.",
      hi: "प्लांट रूम, निर्माणाधीन भवन और occupied facilities शामिल हो सकते हैं।",
    },
  },
  {
    id: "fm",
    name: { en: "Facilities Management", hi: "Facilities Management" },
    summary: {
      en: "Upkeep of buildings, services and technical systems after handover.",
      hi: "हैंडओवर के बाद भवन, सेवाओं और तकनीकी सिस्टम की देखरेख।",
    },
    environment: {
      en: "Typically shift-based indoor/outdoor mix depending on the facility.",
      hi: "Facility के अनुसार शिफ्ट-आधारित इनडोर/आउटडोर मिश्रण हो सकता है।",
    },
  },
  {
    id: "logistics",
    name: { en: "Logistics", hi: "लॉजिस्टिक्स" },
    summary: {
      en: "Warehousing, driving and goods movement supporting trade and projects.",
      hi: "वेयरहाउसिंग, ड्राइविंग और सामान की आवाजाही।",
    },
    environment: {
      en: "Warehouses, yards and roads. Confirm licence, hours and rest rules in writing.",
      hi: "वेयरहाउस, यार्ड और सड़क। लाइसेंस, घंटे और आराम के नियम लिखित में confirm करें।",
    },
  },
  {
    id: "hospitality",
    name: { en: "Hospitality", hi: "आतिथ्य" },
    summary: {
      en: "Hotels, kitchens, housekeeping and guest services.",
      hi: "होटल, किचन, हाउसकीपिंग और गेस्ट सेवाएं।",
    },
    environment: {
      en: "Indoor shift work is common. Rest days and overtime should be in the contract.",
      hi: "अंदर शिफ्ट काम आम है। छुट्टियां और ओवरटाइम contract में होने चाहिए।",
    },
  },
  {
    id: "manufacturing",
    name: { en: "Manufacturing", hi: "विनिर्माण" },
    summary: {
      en: "Factory and workshop production, depending on available openings.",
      hi: "फैक्ट्री और वर्कशॉप उत्पादन — उपलब्ध openings के अनुसार।",
    },
    environment: {
      en: "Plant or workshop settings with site-specific safety rules.",
      hi: "प्लांट या वर्कशॉप — साइट की सुरक्षा नियम लागू होते हैं।",
    },
  },
];

export const ACCOMMODATION_SLOTS: { id: string; category: string; alt: Bilingual }[] = [
  { id: "ext", category: "Exterior", alt: { en: "Accommodation exterior (placeholder)", hi: "Accommodation बाहरी दृश्य (placeholder)" } },
  { id: "bed", category: "Bedroom", alt: { en: "Bedroom (placeholder)", hi: "बेडरूम (placeholder)" } },
  { id: "bath", category: "Bathroom", alt: { en: "Bathroom (placeholder)", hi: "बाथरूम (placeholder)" } },
  { id: "dine", category: "Dining", alt: { en: "Dining area (placeholder)", hi: "डाइनिंग क्षेत्र (placeholder)" } },
  { id: "kit", category: "Kitchen", alt: { en: "Kitchen (placeholder)", hi: "किचन (placeholder)" } },
  { id: "rec", category: "Recreation", alt: { en: "Recreation area (placeholder)", hi: "मनोरंजन क्षेत्र (placeholder)" } },
  { id: "tr", category: "Transport", alt: { en: "Transport area (placeholder)", hi: "परिवहन क्षेत्र (placeholder)" } },
];

export const GALLERY_CATEGORIES: Bilingual[] = [
  { en: "Worksites", hi: "वर्कसाइट" },
  { en: "Accommodation", hi: "रहने की जगह" },
  { en: "Transport", hi: "परिवहन" },
  { en: "Dining", hi: "भोजन" },
  { en: "City & Lifestyle", hi: "शहर और जीवनशैली" },
  { en: "Worker Facilities", hi: "Worker सुविधाएं" },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: "construction",
    label: { en: "Construction opportunities", hi: "निर्माण के अवसर" },
    cells: {},
  },
  {
    id: "electrician",
    label: { en: "Electrician opportunities", hi: "इलेक्ट्रीशियन के अवसर" },
    cells: {},
  },
  {
    id: "welder",
    label: { en: "Welder opportunities", hi: "वेल्डर के अवसर" },
    cells: {},
  },
  {
    id: "plumber",
    label: { en: "Plumber opportunities", hi: "प्लंबर के अवसर" },
    cells: {},
  },
  {
    id: "climate",
    label: { en: "Climate", hi: "जलवायु" },
    cells: {},
  },
  {
    id: "environment",
    label: { en: "Typical work environment", hi: "काम का सामान्य माहौल" },
    cells: {},
  },
  {
    id: "accommodation",
    label: { en: "Accommodation model", hi: "रहने की व्यवस्था का मॉडल" },
    cells: {},
  },
];

const GCC_SLUGS = ["uae", "saudi-arabia", "qatar", "oman", "kuwait", "bahrain"] as const;

export function withPendingComparison(rows: ComparisonRow[]): ComparisonRow[] {
  return rows.map((row) => {
    const cells = { ...row.cells };
    for (const slug of GCC_SLUGS) {
      if (!cells[slug]) {
        cells[slug] = { ...PENDING_VERIFY, pending: true };
      }
    }
    return { ...row, cells };
  });
}

export function buildCountryInsight(
  base: Pick<
    CountryInsight,
    "id" | "slug" | "flag" | "name" | "jobsQuery" | "exploreCta" | "detailReady"
  > & {
    listingSectors?: Bilingual[];
    listingDescription?: Bilingual;
    hero?: CountryInsight["hero"];
  },
): CountryInsight {
  const nameEn = base.name.en;
  return {
    listingDescription: base.listingDescription ?? LISTING_BLURB,
    listingSectors: base.listingSectors ?? GCC_SECTORS,
    hero: base.hero ?? {
      headline: { en: "Know Before You Go.", hi: "जाने से पहले जानें।" },
      subheading: {
        en: `Real information about work, wages, accommodation, lifestyle and working conditions for workers considering employment in ${nameEn}.`,
        hi: `${nameEn} में रोजगार पर जाने से पहले काम, वेतन, रहने की व्यवस्था, जीवनशैली और working conditions के बारे में महत्वपूर्ण जानकारी जानें।`,
      },
      philosophy: {
        en: "See the Opportunity. Understand the Reality.",
        hi: "अवसर देखें। वास्तविकता समझें।",
      },
    },
    workingEnvironment: {
      heading: { en: "01 — Working Environment", hi: "काम का माहौल" },
      subheading: {
        en: `What is work actually like in ${nameEn}?`,
        hi: `${nameEn} में काम का वास्तविक माहौल कैसा हो सकता है?`,
      },
      sectors: WORKING_SECTORS,
      disclaimer: {
        en: "Working conditions vary by occupation, employer, project and location. Workers should understand their working hours, duties, overtime and benefits from their employment contract.",
        hi: "काम की परिस्थितियां आपके trade, employer, project और location के अनुसार अलग हो सकती हैं। विदेश जाने से पहले employment contract में duties, working hours, overtime और benefits को समझें।",
      },
    },
    accommodation: {
      heading: { en: "02 — Accommodation", hi: "रहने की व्यवस्था" },
      subheading: {
        en: "What does worker accommodation look like?",
        hi: "Worker accommodation कैसी दिख सकती है?",
      },
      photos: ACCOMMODATION_SLOTS.map((s) => pendingPhoto(s.id, s.category, s.alt)),
      disclaimer: {
        en: "Accommodation varies by employer and facility. Always confirm accommodation arrangements before travelling.",
        hi: "रहने की व्यवस्था employer और accommodation facility के अनुसार अलग हो सकती है। यात्रा से पहले accommodation की जानकारी अवश्य confirm करें।",
      },
    },
    workerLife: {
      heading: { en: "03 — A Typical Worker Day", hi: "एक सामान्य Worker का दिन" },
      steps: [
        { time: "05:30 AM", title: { en: "Wake Up", hi: "उठना" } },
        { time: "06:00–07:00 AM", title: { en: "Breakfast / Transport", hi: "नाश्ता / Transport" } },
        { time: "Morning", title: { en: "Worksite", hi: "काम की जगह" } },
        { time: "Midday", title: { en: "Break", hi: "ब्रेक" } },
        { time: "Afternoon", title: { en: "Work", hi: "काम" } },
        { time: "Evening", title: { en: "Return to Accommodation", hi: "Accommodation वापस" } },
        { time: "Night", title: { en: "Dinner / Family Call", hi: "डिनर / परिवार से बात" } },
        { time: "Night", title: { en: "Rest", hi: "आराम" } },
      ],
      disclaimer: {
        en: "Illustrative daily routine — actual timings depend on the employer, occupation and employment contract.",
        hi: "यह केवल उदाहरणात्मक दिनचर्या है। वास्तविक समय employer, occupation और employment contract के अनुसार अलग हो सकता है।",
      },
    },
    salary: {
      heading: { en: "04 — Salary & Earnings", hi: "वेतन और कमाई" },
      packages: SALARY_PACKAGES,
      disclaimer: {
        en: "Don't compare jobs by salary alone. Consider the complete employment package.",
        hi: "सिर्फ salary देखकर नौकरी की तुलना न करें। Accommodation, food, transport, medical insurance, overtime और leave को भी समझें।",
      },
    },
    employerBenefits: {
      heading: { en: "05 — What Does the Employer Provide?", hi: "Employer क्या provide करता है?" },
      items: BENEFIT_ITEMS,
      disclaimer: {
        en: "Benefits vary by employer and job. Always check your actual employment offer and contract.",
        hi: "Benefits employer और job के अनुसार अलग हो सकते हैं। हमेशा अपने actual employment offer और contract को ध्यान से पढ़ें।",
      },
    },
    workingConditions: {
      heading: { en: "06 — Working Conditions", hi: "काम की वास्तविक परिस्थितियां" },
      cards: [
        {
          id: "outdoor",
          title: { en: "Outdoor Work", hi: "बाहरी काम" },
          body: {
            en: "Some trades spend long hours outdoors. Confirm the worksite type in your offer.",
            hi: "कुछ trades में लंबे समय बाहर काम हो सकता है। अपने offer में worksite का प्रकार confirm करें।",
          },
        },
        {
          id: "sites",
          title: { en: "Construction Sites", hi: "निर्माण साइट" },
          body: {
            en: "Sites differ by project. Follow the safety briefing for that location.",
            hi: "साइट project के अनुसार अलग होती है। उस जगह की safety briefing का पालन करें।",
          },
        },
        {
          id: "heat",
          title: { en: "Heat Exposure", hi: "गर्मी" },
          body: {
            en: "GCC summers can be very hot. Ask about rest breaks and heat-safety rules.",
            hi: "GCC की गर्मियां बहुत तेज़ हो सकती हैं। आराम और गर्मी से सुरक्षा के नियम पूछें।",
          },
        },
        {
          id: "ppe",
          title: { en: "PPE & Safety", hi: "PPE और सुरक्षा" },
          body: {
            en: "Use the PPE required for your trade and site. Do not skip site-specific rules.",
            hi: "अपने trade और साइट के लिए आवश्यक PPE पहनें। साइट के नियमों को न छोड़ें।",
          },
        },
        {
          id: "bus",
          title: { en: "Worker Transport", hi: "Worker परिवहन" },
          body: {
            en: "Many workers travel by company bus. Confirm pickup point and timing in writing.",
            hi: "कई workers कंपनी बस से जाते हैं। पिकअप जगह और समय लिखित में confirm करें।",
          },
        },
      ],
      disclaimer: {
        en: "Working conditions vary by occupation, employer and project. Workers should follow site-specific safety requirements and use appropriate PPE where required.",
        hi: "काम की परिस्थितियां trade, employer और project के अनुसार अलग हो सकती हैं। Site-specific safety requirements और आवश्यक PPE का पालन करें।",
      },
    },
    livingConditions: {
      heading: { en: "07 — Living Conditions", hi: "रहने की वास्तविकता" },
      photos: ACCOMMODATION_SLOTS.map((s) => pendingPhoto(`live-${s.id}`, s.category, s.alt)),
      info: {
        en: "Accommodation quality, room occupancy and facilities can vary significantly between employers and facilities.",
        hi: "Accommodation की quality, room occupancy और facilities employer और facility के अनुसार काफी अलग हो सकती हैं।",
      },
    },
    opportunityReality: {
      headline: {
        en: "See the Opportunity. Understand the Reality.",
        hi: "अवसर देखें। वास्तविकता समझें।",
      },
      opportunity: {
        title: { en: "The Opportunity", hi: "अवसर" },
        points: [
          { en: "International work experience", hi: "अंतरराष्ट्रीय कार्य अनुभव" },
          { en: "Large infrastructure projects", hi: "बड़े इंफ्रास्ट्रक्चर प्रोजेक्ट" },
          { en: "Multinational workforce", hi: "बहुराष्ट्रीय workforce" },
          { en: "Modern cities", hi: "आधुनिक शहर" },
          { en: "Career opportunities", hi: "करियर के अवसर" },
          { en: "Exposure to international projects", hi: "अंतरराष्ट्रीय प्रोजेक्ट का अनुभव" },
        ],
      },
      reality: {
        title: { en: "The Reality", hi: "वास्तविकता" },
        points: [
          { en: "Outdoor/site work can be physically demanding", hi: "साइट/बाहरी काम शारीरिक रूप से कठिन हो सकता है" },
          { en: "Accommodation may be shared", hi: "रहने की जगह साझा हो सकती है" },
          { en: "Work location may be outside city centres", hi: "काम शहर के केंद्र से दूर हो सकता है" },
          { en: "Transport arrangements matter", hi: "परिवहन व्यवस्था मायने रखती है" },
          { en: "Climate may be challenging", hi: "जलवायु चुनौतीपूर्ण हो सकती है" },
          { en: "Actual conditions vary by employer and job", hi: "वास्तविक परिस्थितियां employer और job के अनुसार अलग होती हैं" },
        ],
      },
    },
    countryRules: {
      heading: { en: "09 — Important Rules Before You Travel", hi: "विदेश जाने से पहले जरूरी नियम" },
      cards: RULE_CARDS,
      disclaimer: {
        en: "Rules and requirements may change. Always verify current requirements through official government sources. This is general information, not legal advice.",
        hi: "नियम और आवश्यकताएं बदल सकती हैं। वर्तमान जानकारी आधिकारिक सरकारी स्रोतों से verify करें। यह सामान्य जानकारी है, कानूनी सलाह नहीं।",
      },
    },
    safetyChecklist: {
      heading: { en: "10 — Before You Travel", hi: `${nameEn} जाने से पहले ये जरूर जांचें` },
      items: SAFETY_ITEMS,
      note: {
        en: "If any important information is unclear, ask for clarification before travelling.",
        hi: "अगर कोई महत्वपूर्ण जानकारी clear नहीं है, तो travel करने से पहले clarification लें।",
      },
    },
    photoGallery: {
      heading: { en: "11 — Real Working & Living Conditions", hi: "काम और रहने की वास्तविक तस्वीरें" },
      categories: GALLERY_CATEGORIES,
      photos: GALLERY_CATEGORIES.map((cat, i) =>
        pendingPhoto(`gal-${i}`, cat.en, {
          en: `${cat.en} photo — to be added after verification`,
          hi: `${cat.hi} फोटो — सत्यापन के बाद जोड़ी जाएगी`,
        }),
      ),
      disclaimer: {
        en: "Images are provided for informational purposes. Actual conditions may vary. We do not use unverified photos to represent a specific employer or facility.",
        hi: "तस्वीरें जानकारी के लिए हैं। वास्तविक परिस्थितियां अलग हो सकती हैं। हम किसी खास employer या facility के लिए असत्यापित फोटो नहीं दिखाते।",
      },
    },
    employerSpecific: {
      heading: { en: "12 — Know Your Employer", hi: "अपने Employer को जानें" },
      empty: {
        en: "Employer-specific information will be shown where available.",
        hi: "जहां उपलब्ध होगा, वहां employer-specific information दिखाई जाएगी।",
      },
      cards: [],
    },
    comparison: {
      heading: { en: "13 — Compare Destinations", hi: "देशों की तुलना करें" },
      disclaimer: {
        en: "Information varies by job, employer and location.",
        hi: "जानकारी job, employer और location के अनुसार अलग होती है।",
      },
      rows: withPendingComparison(COMPARISON_ROWS),
    },
    knowBeforeYouGo: {
      heading: { en: "14 — Know Before You Go", hi: "जाने से पहले जानें" },
      items: KNOW_ITEMS,
      message: {
        en: "Going abroad for work is a major decision. Understand the opportunity before you travel.",
        hi: "विदेश में नौकरी एक बड़ा फैसला है। यात्रा करने से पहले अवसर, नौकरी और रहने की परिस्थितियों को अच्छी तरह समझें।",
      },
    },
    ...base,
  };
}
