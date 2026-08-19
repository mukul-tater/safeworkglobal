export type Bilingual = {
  en: string;
  hi: string;
};

export type PhotoRecord = {
  id: string;
  src?: string;
  alt: Bilingual;
  location?: string;
  date?: string;
  source?: string;
  caption?: Bilingual;
  category?: string;
};

export type SectorCard = {
  id: string;
  name: Bilingual;
  summary: Bilingual;
  environment: Bilingual;
  image?: PhotoRecord;
};

export type SalaryPackage = {
  trade: Bilingual;
  basicSalary: string | null;
  overtime: Bilingual;
  accommodation: Bilingual;
  food: Bilingual;
  transport: Bilingual;
  medicalInsurance: Bilingual;
  annualLeave: Bilingual;
};

export type TimelineStep = {
  time: string;
  title: Bilingual;
};

export type RuleCard = {
  id: string;
  title: Bilingual;
  body: Bilingual;
  officialUrl?: string;
};

export type ChecklistItem = {
  id: string;
  label: Bilingual;
};

export type ComparisonCell = {
  en: string;
  hi: string;
  pending?: boolean;
};

export type ComparisonRow = {
  id: string;
  label: Bilingual;
  cells: Record<string, ComparisonCell>;
};

export type EmployerRealityCard = {
  employerName: string;
  location: string;
  job: string;
  accommodation: string;
  roomOccupancy: string;
  transport: string;
  food: string;
  medical: string;
  lastVerified: string;
};

export type CountryInsight = {
  id: string;
  slug: string;
  flag: string;
  name: Bilingual;
  jobsQuery: string;
  listingDescription: Bilingual;
  listingSectors: Bilingual[];
  exploreCta: Bilingual;
  hero: {
    headline: Bilingual;
    subheading: Bilingual;
    philosophy: Bilingual;
    collage?: PhotoRecord[];
  };
  workingEnvironment: {
    heading: Bilingual;
    subheading: Bilingual;
    sectors: SectorCard[];
    disclaimer: Bilingual;
  };
  accommodation: {
    heading: Bilingual;
    subheading: Bilingual;
    photos: PhotoRecord[];
    disclaimer: Bilingual;
  };
  workerLife: {
    heading: Bilingual;
    steps: TimelineStep[];
    disclaimer: Bilingual;
  };
  salary: {
    heading: Bilingual;
    packages: SalaryPackage[];
    disclaimer: Bilingual;
  };
  employerBenefits: {
    heading: Bilingual;
    items: ChecklistItem[];
    disclaimer: Bilingual;
  };
  workingConditions: {
    heading: Bilingual;
    cards: { id: string; title: Bilingual; body: Bilingual; image?: PhotoRecord }[];
    disclaimer: Bilingual;
  };
  livingConditions: {
    heading: Bilingual;
    photos: PhotoRecord[];
    info: Bilingual;
  };
  opportunityReality: {
    headline: Bilingual;
    opportunity: { title: Bilingual; points: Bilingual[] };
    reality: { title: Bilingual; points: Bilingual[] };
    opportunityImage?: PhotoRecord;
    realityImage?: PhotoRecord;
  };
  countryRules: {
    heading: Bilingual;
    cards: RuleCard[];
    disclaimer: Bilingual;
  };
  safetyChecklist: {
    heading: Bilingual;
    items: ChecklistItem[];
    note: Bilingual;
  };
  photoGallery: {
    heading: Bilingual;
    categories: Bilingual[];
    photos: PhotoRecord[];
    disclaimer: Bilingual;
  };
  employerSpecific: {
    heading: Bilingual;
    empty: Bilingual;
    cards: EmployerRealityCard[];
  };
  comparison: {
    heading: Bilingual;
    disclaimer: Bilingual;
    rows: ComparisonRow[];
  };
  knowBeforeYouGo: {
    heading: Bilingual;
    items: ChecklistItem[];
    message: Bilingual;
  };
  detailReady: boolean;
};

export const SECTION_NAV: { id: string; en: string; hi: string }[] = [
  { id: "working-environment", en: "Working Environment", hi: "काम का माहौल" },
  { id: "accommodation", en: "Accommodation", hi: "रहने की व्यवस्था" },
  { id: "real-worker-life", en: "Real Worker Life", hi: "Worker का दिन" },
  { id: "employer-benefits", en: "Employer Benefits", hi: "Employer लाभ" },
  { id: "working-conditions", en: "Working Conditions", hi: "काम की परिस्थितियां" },
  { id: "living-conditions", en: "Living Conditions", hi: "रहने की वास्तविकता" },
  { id: "opportunity-reality", en: "Opportunity vs Reality", hi: "अवसर और वास्तविकता" },
  { id: "country-rules", en: "Country Rules", hi: "जरूरी नियम" },
  { id: "safety-checklist", en: "Safety Checklist", hi: "जांच सूची" },
  { id: "real-photos", en: "Real Photos", hi: "वास्तविक तस्वीरें" },
  { id: "employer-reality", en: "Employer-Specific Reality", hi: "Employer जानकारी" },
  { id: "country-comparison", en: "Country Comparison", hi: "देशों की तुलना" },
  { id: "know-before-you-go", en: "Know Before You Go", hi: "जाने से पहले जानें" },
];

export const UNAVAILABLE: Bilingual = {
  en: "Information not yet available.",
  hi: "जानकारी अभी उपलब्ध नहीं है।",
};

export const PENDING_VERIFY: Bilingual = {
  en: "To be updated after verification.",
  hi: "सत्यापन के बाद अपडेट किया जाएगा।",
};
