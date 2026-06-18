export type NavItem = {
  name: string;
  label: string;
  group: string;
};

export const workerNavItems: NavItem[] = [
  { name: 'WorkerDashboard', label: 'Dashboard', group: 'Overview' },
  { name: 'WorkerProfile', label: 'Profile', group: 'Overview' },
  { name: 'WorkerVerification', label: 'Verification', group: 'Overview' },
  { name: 'Jobs', label: 'Job Search', group: 'Jobs' },
  { name: 'WorkerSavedJobs', label: 'Saved Jobs', group: 'Jobs' },
  { name: 'WorkerSavedSearches', label: 'Saved Searches', group: 'Jobs' },
  { name: 'WorkerApplications', label: 'Applications', group: 'Jobs' },
  { name: 'WorkerApplicationTracking', label: 'Track Applications', group: 'Jobs' },
  { name: 'WorkerInterviews', label: 'Interviews', group: 'Hiring Process' },
  { name: 'WorkerCalendar', label: 'Calendar', group: 'Hiring Process' },
  { name: 'WorkerOffers', label: 'Job Offers', group: 'Hiring Process' },
  { name: 'WorkerTraining', label: 'Training & PDOT', group: 'Hiring Process' },
  { name: 'WorkerContracts', label: 'Contracts', group: 'Post-Hiring' },
  { name: 'WorkerContractHistory', label: 'Contract History', group: 'Post-Hiring' },
  { name: 'WorkerTravel', label: 'Travel & Visa', group: 'Post-Hiring' },
  { name: 'WorkerInsurance', label: 'Insurance', group: 'Post-Hiring' },
  { name: 'WorkerPayments', label: 'Payments', group: 'Post-Hiring' },
  { name: 'WorkerDocuments', label: 'Documents', group: 'Account' },
  { name: 'WorkerMessaging', label: 'Messages', group: 'Account' },
  { name: 'WorkerNotifications', label: 'Notifications', group: 'Account' },
];

export const employerNavItems: NavItem[] = [
  { name: 'EmployerOnboarding', label: 'Onboarding', group: 'Overview' },
  { name: 'EmployerDashboard', label: 'Dashboard', group: 'Overview' },
  { name: 'EmployerProfile', label: 'My Profile', group: 'Overview' },
  { name: 'EmployerCompany', label: 'Company & KYC', group: 'Overview' },
  { name: 'EmployerPostJob', label: 'Post a Job', group: 'Jobs & Hiring' },
  { name: 'EmployerManageJobs', label: 'Manage Jobs', group: 'Jobs & Hiring' },
  { name: 'EmployerSearchWorkers', label: 'Search Workers', group: 'Jobs & Hiring' },
  { name: 'EmployerSavedSearches', label: 'Saved Searches', group: 'Jobs & Hiring' },
  { name: 'EmployerApplications', label: 'Applications', group: 'Applications' },
  { name: 'EmployerShortlist', label: 'Shortlist', group: 'Applications' },
  { name: 'EmployerInterviews', label: 'Interviews', group: 'Applications' },
  { name: 'EmployerOffers', label: 'Offers', group: 'Applications' },
  { name: 'EmployerFormalities', label: 'Formalities', group: 'Operations' },
  { name: 'EmployerContracts', label: 'Contracts', group: 'Operations' },
  { name: 'EmployerContractHistory', label: 'Contract History', group: 'Operations' },
  { name: 'EmployerEscrow', label: 'Payments', group: 'Operations' },
  { name: 'EmployerCompliance', label: 'Compliance', group: 'Reports' },
  { name: 'EmployerReports', label: 'Analytics', group: 'Reports' },
  { name: 'EmployerMessaging', label: 'Messages', group: 'Reports' },
];

export const adminNavItems: NavItem[] = [
  { name: 'AdminDashboard', label: 'Dashboard', group: 'Overview' },
  { name: 'AdminInvestorDashboard', label: 'Investor Dashboard', group: 'Overview' },
  { name: 'AdminReports', label: 'Reports', group: 'Overview' },
  { name: 'AdminUsers', label: 'All Users', group: 'People' },
  { name: 'AdminWorkers', label: 'Workers', group: 'People' },
  { name: 'AdminEmployers', label: 'Employers', group: 'People' },
  { name: 'AdminPartners', label: 'Partners', group: 'People' },
  { name: 'AdminPartnerWorkers', label: 'E-Mitra Workers', group: 'People' },
  { name: 'AdminJobs', label: 'All Jobs', group: 'Jobs & Applications' },
  { name: 'AdminApplications', label: 'Applications', group: 'Jobs & Applications' },
  { name: 'AdminJobVerification', label: 'Job Verification', group: 'Jobs & Applications' },
  { name: 'AdminDocumentVerification', label: 'Documents', group: 'Verification' },
  { name: 'AdminIDVerification', label: 'ID Verification', group: 'Verification' },
  { name: 'AdminECRManagement', label: 'ECR Management', group: 'Verification' },
  { name: 'AdminCompliance', label: 'Compliance', group: 'Verification' },
  { name: 'AdminDisputes', label: 'Disputes', group: 'Support' },
  { name: 'AdminContentModeration', label: 'Content Moderation', group: 'Support' },
  { name: 'AdminMessages', label: 'Messages', group: 'Support' },
  { name: 'AdminContactSubmissions', label: 'Contact Submissions', group: 'Support' },
];

export const partnerNavItems: NavItem[] = [
  { name: 'PartnerDashboard', label: 'Dashboard', group: 'Overview' },
  { name: 'PartnerWorkers', label: 'Workers', group: 'Workers' },
  { name: 'PartnerRegisterWorker', label: 'Register Worker', group: 'Workers' },
  { name: 'PartnerNotifications', label: 'Notifications', group: 'Account' },
  { name: 'PartnerCompliance', label: 'Compliance', group: 'Account' },
];
