// Destination countries for job seekers (UAE-only portal)
export const DESTINATION_COUNTRIES = [
  'All Countries',
  'UAE',
];

// Worker nationalities (source countries)
export const NATIONALITIES = [
  'All Nationalities',
  // South Asia
  'India', 'Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka', 'Afghanistan',
  // Southeast Asia
  'Philippines', 'Indonesia', 'Vietnam', 'Thailand', 'Myanmar', 'Cambodia', 'Malaysia',
  // Africa
  'Nigeria', 'Kenya', 'Ethiopia', 'Egypt', 'Ghana', 'Uganda', 'Tanzania', 'South Africa', 'Morocco', 'Sudan',
  // Middle East
  'Yemen', 'Jordan', 'Lebanon', 'Syria', 'Iraq',
  // Central Asia
  'Uzbekistan', 'Kazakhstan', 'Tajikistan', 'Kyrgyzstan', 'Turkmenistan',
  // East Asia
  'China', 'South Korea', 'Japan',
  // Europe
  'Romania', 'Poland', 'Ukraine', 'Bulgaria', 'Hungary', 'Moldova',
  // Americas
  'Brazil', 'Mexico', 'Colombia', 'Peru', 'Venezuela'
];

// Job categories
export const JOB_CATEGORIES = [
  'All Categories',
  'Construction',
  'Electrical',
  'Welding',
  'Plumbing',
  'HVAC',
  'Manufacturing',
  'Carpentry',
  'Painting',
  'Masonry',
  'Steel Fixing',
  'Scaffolding',
  'Heavy Equipment Operation',
  'Crane Operation',
  'Delivery & Logistics',
  'Hospitality',
  'Healthcare',
  'IT & Technology',
  'Engineering',
  'Security',
  'Cleaning & Maintenance',
  'Food & Beverage',
  'Agriculture',
  'Oil & Gas',
  'Mining'
];

// Popular job titles/roles for autocomplete suggestions
export const POPULAR_JOB_TITLES = [
  'Electrician', 'Industrial Electrician', 'Welder', 'TIG Welder', 'MIG Welder', 'Arc Welder',
  'Plumber', 'Pipe Fitter', 'Carpenter', 'Mason', 'Painter', 'Steel Fixer', 'Scaffolder',
  'Construction Worker', 'Construction Helper', 'Site Supervisor', 'Civil Foreman',
  'HVAC Technician', 'AC Technician', 'Refrigeration Technician',
  'Heavy Equipment Operator', 'Crane Operator', 'Forklift Operator', 'Excavator Operator',
  'Driver', 'Heavy Truck Driver', 'Light Vehicle Driver', 'Delivery Driver',
  'Warehouse Worker', 'Warehouse Supervisor', 'Logistics Coordinator',
  'CNC Machinist', 'Fabricator', 'Assembly Line Worker', 'Production Operator', 'Quality Inspector',
  'Oil & Gas Technician', 'Rigger', 'Roustabout', 'Drilling Operator',
  'Chef', 'Cook', 'Kitchen Helper', 'Waiter', 'Housekeeper', 'Hotel Cleaner',
  'Security Guard', 'Cleaner', 'Janitor', 'Gardener',
  'Nurse', 'Caregiver', 'Healthcare Assistant',
  'Farm Worker', 'Agricultural Helper',
  'IT Support', 'Software Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer'
];

// Experience levels
export const EXPERIENCE_LEVELS = [
  'All Levels',
  'Entry Level',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years'
];

// Popular skills for quick filtering
export const POPULAR_SKILLS = [
  'Welding', 'TIG Welding', 'MIG Welding', 'Arc Welding',
  'Electrical', 'Industrial Electrical', 'PLC Programming',
  'Plumbing', 'Pipe Fitting',
  'Construction', 'Carpentry', 'Masonry', 'Concrete Work',
  'Manufacturing', 'Assembly Line', 'Quality Control',
  'Heavy Equipment', 'Crane Operation', 'Forklift',
  'HVAC', 'Air Conditioning', 'Refrigeration',
  'Safety Management', 'First Aid',
  'Scaffolding', 'Steel Fixing', 'Rigging',
  'Painting', 'Plastering', 'Tiling'
];

// Availability options
export const AVAILABILITY_OPTIONS = [
  'All',
  'Immediately',
  'Within 1 month',
  'Within 2 months',
  'Within 3 months',
  'Notice period required'
];

// Worker onboarding constants
export const SKILL_LEVELS = ['Helper', 'Semi-skilled', 'Skilled', 'Expert'];

export const EXPERIENCE_RANGES = ['0-1 years', '1-3 years', '3-5 years', '5+ years'];

export const SHIFT_PREFERENCES = ['Day', 'Night', 'Flexible'];

export const WORK_PREFERENCES = ['Contract', 'Full-time', 'Daily wage'];

export const WAGE_TYPES = ['Daily', 'Monthly'];

export const AVAILABILITY_CHOICES = ['Immediate', '7 days', '15 days'];

export const PROJECT_TYPES = [
  'Residential', 'Commercial', 'Industrial', 'Infrastructure',
  'Oil & Gas', 'Power Plant', 'Marine', 'Hospitality',
  'Healthcare Facility', 'Educational Institution', 'Government',
  'Renovation', 'Maintenance', 'Other'
];

// Languages spoken (for worker filters)
export const WORKER_LANGUAGES = [
  'English', 'Hindi', 'Arabic', 'Tagalog', 'Bengali', 'Nepali',
  'Urdu', 'Tamil', 'Telugu', 'Malayalam', 'Punjabi', 'Marathi',
  'Sinhala', 'Indonesian', 'Vietnamese', 'Thai', 'Mandarin', 'Spanish',
  'French', 'Portuguese', 'Russian', 'Swahili'
];

// Primary work types (for worker search filter)
export const PRIMARY_WORK_TYPES = [
  'Welder', 'Electrician', 'Plumber', 'Mason', 'Carpenter', 'Painter',
  'Steel Fixer', 'Scaffolder', 'HVAC Technician', 'Driver', 'Heavy Equipment Operator',
  'Crane Operator', 'Forklift Operator', 'Construction Worker', 'Helper',
  'Pipe Fitter', 'Fabricator', 'Rigger', 'Site Supervisor', 'Foreman',
  'Cleaner', 'Security Guard', 'Cook', 'Housekeeper', 'Warehouse Worker'
];

// Verifiable document types (must match worker_documents.document_type values)
export const VERIFIABLE_DOC_TYPES = [
  { key: 'passport', label: 'Passport' },
  { key: 'visa', label: 'Visa' },
  { key: 'id', label: 'ID Card' },
  { key: 'police_clearance', label: 'Police Clearance' },
  { key: 'medical', label: 'Medical Certificate' },
];

// ECR status options
export const ECR_STATUS_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'ecr', label: 'ECR' },
  { value: 'ecnr', label: 'ECNR' },
  { value: 'not_checked', label: 'Not Checked' },
];

// Sort options for worker search
export const WORKER_SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'experience_desc', label: 'Most Experience' },
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'most_verified', label: 'Most Verified' },
];

// Currencies
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
];
