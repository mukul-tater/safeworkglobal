import type { NavigatorScreenParams } from '@react-navigation/native';

export type PublicStackParamList = {
  Home: undefined;
  Jobs: { keyword?: string; country?: string } | undefined;
  JobDetail: { jobId: string; slug?: string | null };
  Auth: { mode?: 'login' | 'signup'; role?: 'worker' | 'employer' | 'partner' };
  About: undefined;
  Contact: undefined;
  Privacy: undefined;
  Terms: undefined;
};

export type WorkerStackParamList = {
  WorkerDashboard: undefined;
  WorkerProfile: undefined;
  WorkerVerification: undefined;
  Jobs: undefined;
  JobDetail: { jobId: string; slug?: string | null };
  WorkerSavedJobs: undefined;
  WorkerSavedSearches: undefined;
  WorkerApplications: undefined;
  WorkerApplicationDetail: { applicationId: string };
  WorkerApplicationTracking: undefined;
  WorkerInterviews: undefined;
  WorkerCalendar: undefined;
  WorkerOffers: undefined;
  WorkerTraining: undefined;
  WorkerContracts: undefined;
  WorkerContractHistory: undefined;
  WorkerTravel: undefined;
  WorkerInsurance: undefined;
  WorkerPayments: undefined;
  WorkerDocuments: undefined;
  WorkerMessaging: undefined;
  WorkerNotifications: undefined;
  WorkerOnboarding: undefined;
  WorkerTrust: undefined;
};

export type EmployerStackParamList = {
  EmployerDashboard: undefined;
  EmployerProfile: undefined;
  EmployerCompany: undefined;
  EmployerPostJob: undefined;
  EmployerManageJobs: undefined;
  EmployerEditJob: { jobId: string };
  EmployerSearchWorkers: undefined;
  EmployerSavedSearches: undefined;
  EmployerApplications: undefined;
  EmployerApplicationDetail: { applicationId: string };
  EmployerShortlist: undefined;
  EmployerInterviews: undefined;
  EmployerOffers: undefined;
  EmployerFormalities: undefined;
  EmployerContracts: undefined;
  EmployerContractHistory: undefined;
  EmployerEscrow: undefined;
  EmployerCompliance: undefined;
  EmployerReports: undefined;
  EmployerMessaging: undefined;
  EmployerOnboarding: undefined;
  EmployerQuickSignup: undefined;
  EmployerQuickPostJob: undefined;
  EmployerTrust: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminInvestorDashboard: undefined;
  AdminReports: undefined;
  AdminUsers: undefined;
  AdminWorkers: undefined;
  AdminEmployers: undefined;
  AdminPartners: undefined;
  AdminPartnerWorkers: undefined;
  AdminJobs: undefined;
  AdminApplications: undefined;
  AdminJobVerification: undefined;
  AdminDocumentVerification: undefined;
  AdminIDVerification: undefined;
  AdminECRManagement: undefined;
  AdminCompliance: undefined;
  AdminDisputes: undefined;
  AdminContentModeration: undefined;
  AdminMessages: undefined;
  AdminContactSubmissions: undefined;
  AdminLogin: undefined;
};

export type PartnerStackParamList = {
  PartnerDashboard: undefined;
  PartnerWorkers: undefined;
  PartnerRegisterWorker: undefined;
  PartnerWorkerDetail: { workerId: string };
  PartnerNotifications: undefined;
  PartnerCompliance: undefined;
  PartnerOnboarding: undefined;
  PartnerLogin: undefined;
  PartnerRegister: undefined;
};

export type RootStackParamList = {
  Public: NavigatorScreenParams<PublicStackParamList>;
  WorkerApp: NavigatorScreenParams<WorkerStackParamList>;
  EmployerApp: NavigatorScreenParams<EmployerStackParamList>;
  AdminApp: NavigatorScreenParams<AdminStackParamList>;
  PartnerApp: NavigatorScreenParams<PartnerStackParamList>;
  RoleSelect: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
