export const EMPLOYER_TRADES = [
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
] as const;

export type EmployerTrade = (typeof EMPLOYER_TRADES)[number];

/**
 * Trade → technical skills catalogue.
 * Add a new trade here and it appears in the searchable dropdown
 * with its skill chips — no form-architecture changes required.
 */
export const TRADE_SKILLS: Record<string, readonly string[]> = {
  Electrician: [
    "Single Phase",
    "Three Phase",
    "Wiring",
    "DB / MCB",
    "Cable Glanding",
    "Cable Termination",
    "Electrical Drawing",
    "Multimeter",
    "Fault Finding",
    "Electrical Safety / LOTO",
  ],
  Welder: [
    "ARC",
    "MIG",
    "TIG",
    "Gas Cutting",
    "Fabrication",
    "Grinding",
    "Welding Drawing",
    "PPE / Safety",
  ],
  Plumber: [
    "PVC",
    "CPVC",
    "GI",
    "PPR",
    "Pipe Installation",
    "Leak Testing",
    "Drainage",
    "Pressure Testing",
  ],
  "HVAC Technician": [
    "Split AC",
    "Package Unit",
    "Chiller",
    "Ducting",
    "Refrigerant Charging",
    "Brazing",
    "AHU / FCU",
    "HVAC Safety",
  ],
  Fitter: [
    "Alignment",
    "Assembly",
    "Precision Measurement",
    "Machine Installation",
    "Blueprint Reading",
    "Hand Tools",
    "PPE / Safety",
  ],
  "Pipe Fitter": [
    "Isometric Drawing",
    "Pipe Routing",
    "Flange Fitting",
    "Welding Support",
    "Pressure Testing",
    "GI / CS / SS",
    "PPE / Safety",
  ],
  Fabricator: [
    "Plate Cutting",
    "Fit-up",
    "Grinding",
    "Structural Fabrication",
    "Drawing Reading",
    "Welding Support",
    "PPE / Safety",
  ],
  Mason: [
    "Block Work",
    "Plastering",
    "Tile Work",
    "Concrete Finishing",
    "Leveling",
    "PPE / Safety",
  ],
  Carpenter: [
    "Formwork",
    "Joinery",
    "False Ceiling",
    "Door / Window",
    "Measurement",
    "PPE / Safety",
  ],
  Painter: [
    "Emulsion",
    "Enamel",
    "Spray Painting",
    "Surface Preparation",
    "Epoxy",
    "PPE / Safety",
  ],
  Scaffolder: [
    "Cuplock",
    "Ringlock",
    "Tube & Fitting",
    "Inspection Tagging",
    "Working at Height",
    "PPE / Safety",
  ],
  "Steel Fixer": [
    "Bar Bending",
    "Bar Cutting",
    "Rebar Tying",
    "Drawing Reading",
    "Slab / Column / Beam",
    "PPE / Safety",
  ],
  "Construction Worker": [
    "General Labour",
    "Material Handling",
    "Site Housekeeping",
    "Concrete Work",
    "PPE / Safety",
  ],
  Other: [],
};

export function skillsForTrade(trade: string): readonly string[] {
  if (!trade) return [];
  return TRADE_SKILLS[trade] ?? TRADE_SKILLS.Other ?? [];
}

export const COMPANY_TYPES = [
  "LLC",
  "Free Zone Company",
  "Branch",
  "Sole Establishment",
  "Other",
] as const;

export const BUSINESS_ACTIVITIES = [
  "Construction",
  "MEP",
  "Facilities Management",
  "Engineering",
  "Logistics",
  "Manufacturing",
  "Hospitality",
  "Maintenance",
  "Other",
] as const;

export const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
] as const;

export const CONTACT_DESIGNATIONS = [
  "Owner",
  "Director",
  "HR Manager",
  "Recruitment Manager",
  "Procurement Manager",
  "Project Manager",
  "Other",
] as const;

export const EXPERIENCE_RANGES = [
  "0–2 years",
  "2–5 years",
  "5–10 years",
  "10+ years",
] as const;

export const PROJECT_DURATIONS = [
  "1 month",
  "3 months",
  "6 months",
  "12 months",
  "24 months",
  "Ongoing",
  "Other",
] as const;

export const GENDER_PREFERENCES = ["Any", "Male", "Female"] as const;

export const COMMUNICATION_CHANNELS = ["WhatsApp", "Phone", "Email"] as const;

export const PARTNERSHIP_SERVICES = [
  "Worker sourcing from India",
  "Candidate screening",
  "Skill verification",
  "Trade test coordination",
  "Employer interview coordination",
  "Recruitment documentation coordination",
  "Deployment coordination",
  "Replacement support, as agreed",
  "Ongoing workforce assistance",
] as const;

export const DEFAULT_WORK_LOCATION = "Dubai, UAE";
