import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import OAuthLandingHandler from "./components/OAuthLandingHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import PageTransition from "./components/PageTransition";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import JobCategories from "./pages/JobCategories";
import Auth from "./pages/Auth";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PartnerOnboarding from "./pages/partner/PartnerOnboarding";
import PartnerRegister from "./modules/partner/pages/PartnerRegister";
import PartnerRegisterLegacy from "./modules/partner/pages/PartnerRegisterLegacy";
import PendingApproval from "./modules/partner/pages/PendingApproval";
import PartnerDashboardRouter from "./modules/partner/pages/PartnerDashboardRouter";
import PartnerAddWorkerPage from "./modules/partner/pages/PartnerAddWorkerPage";
import PartnerMyWorkersPage from "./modules/partner/pages/PartnerMyWorkersPage";
import SsvnDashboard from "./modules/partner/pages/ssvn/SsvnDashboard";
import SsvnAssessments from "./modules/partner/pages/ssvn/SsvnAssessments";
import SsvnCheckin from "./modules/partner/pages/ssvn/SsvnCheckin";
import SsvnAssessmentWizard from "./modules/partner/pages/ssvn/SsvnAssessmentWizard";
import SsvnLoginPage from "./modules/partner/pages/ssvn/SsvnLoginPage";
import WorkerBindMobilePage from "./pages/worker/WorkerBindMobilePage";
import ItiDashboard from "./modules/partner/pages/iti/ItiDashboard";
import ConsultantDashboard from "./modules/partner/pages/consultant/ConsultantDashboard";
import PartnerLoginChooser from "./modules/partner/pages/PartnerLoginChooser";
import AdminTradeTestAllocations from "./pages/admin/AdminTradeTestAllocations";
import PartnerWallet from "./modules/partner/pages/shared/PartnerWallet";
import PartnerReports from "./modules/partner/pages/shared/PartnerReports";
import PartnerSupport from "./modules/partner/pages/shared/PartnerSupport";
import PartnerInvoices from "./modules/partner/pages/shared/PartnerInvoices";
import PartnerPayouts from "./modules/partner/pages/shared/PartnerPayouts";
import PartnerTickets from "./modules/partner/pages/shared/PartnerTickets";
import SrnDashboard from "./modules/partner/pages/srn/SrnDashboard";
import SrnWorkers from "./modules/partner/pages/srn/SrnWorkers";
import SrnStageManager from "./modules/partner/pages/srn/SrnStageManager";
import SenGlobalDashboard from "./modules/partner/pages/senGlobal/SenGlobalDashboard";
import SenGlobalLeads from "./modules/partner/pages/senGlobal/SenGlobalLeads";
import SenGlobalRevenue from "./modules/partner/pages/senGlobal/SenGlobalRevenue";
import AdminPartnerPayouts from "./pages/admin/AdminPartnerPayouts";
import AdminPartnerTickets from "./pages/admin/AdminPartnerTickets";
import AdminPartnersV2 from "./pages/admin/AdminPartnersV2";
import BenefitsForEmployers from "./pages/BenefitsForEmployers";
import Dashboard from "./pages/Dashboard";
import { legacyEmployerRoutes } from "./routes/legacyEmployerRoutes";
import { legacyPublicRoutes } from "./routes/legacyPublicRoutes";
import { legacyWorkerRoutes } from "./routes/legacyWorkerRoutes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PartnerApprovals from "./pages/admin/PartnerApprovals";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRegisterPage from "./pages/admin/AdminRegisterPage";
import InvestorDashboard from "./pages/admin/InvestorDashboard";
import UserManagement from "./pages/admin/UserManagement";
import DocumentVerification from "./pages/admin/DocumentVerification";
import IDVerification from "./pages/admin/IDVerification";
import ECRManagement from "./pages/admin/ECRManagement";
import JobVerification from "./pages/admin/JobVerification";
import EditJob from "./pages/admin/EditJob";
import ComplianceCheck from "./pages/admin/ComplianceCheck";
import Reports from "./pages/admin/Reports";
import DisputeResolution from "./pages/admin/DisputeResolution";
import ContactSubmissions from "./pages/admin/ContactSubmissions";
import AdminPartnerRewards from "./pages/admin/AdminPartnerRewards";
import AdminWorkers from "./pages/admin/AdminWorkers";
import AdminEmployers from "./pages/admin/AdminEmployers";
import EmployerAccessControl from "./pages/admin/EmployerAccessControl";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminPartnerWorkers from "./pages/admin/AdminPartnerWorkers";
import AdminContentModeration from "./pages/admin/AdminContentModeration";
import AdminMessages from "./pages/admin/AdminMessages";
import {
  EmitraOnboardingPage,
  EmitraLoginPage,
  EmitraDashboardPage,
  EmitraWorkersPage,
  EmitraRegisterWorkerPage,
  EmitraWorkerDetailPage,
  EmitraNotificationsPage,
  EmitraCompliancePage,
  EmitraMyWorkersPage,
  EmitraRewardsPage,
  EmitraWithdrawalsPage,
} from "./modules/emitra";
import AdminEmitraWorkerReview from "./pages/admin/AdminEmitraWorkerReview";
import AdminEmitraWithdrawals from "./pages/admin/AdminEmitraWithdrawals";
import AdminEmitraAnalytics from "./pages/admin/AdminEmitraAnalytics";
import AdminVerificationQueue from "./pages/admin/AdminVerificationQueue";
import AdminQuizCms from "./pages/admin/AdminQuizCms";
import AdminJourneyOps from "./pages/admin/AdminJourneyOps";
import InterviewerLoginPage from "./modules/interviewer/pages/InterviewerLoginPage";
import InterviewerQueuePage from "./modules/interviewer/pages/InterviewerQueuePage";
import AdminLsps from "./pages/admin/AdminLsps";
import AdminLspDeveloperDocs from "./pages/admin/AdminLspDeveloperDocs";
import LspEntryPage from "./modules/lsp/pages/LspEntryPage";
import LspVerifyPage from "./modules/lsp/pages/LspVerifyPage";
import LspDeniedPage from "./modules/lsp/pages/LspDeniedPage";
import {
  WorkerAuthProvider,
  WorkerLanguageProvider,
} from "./modules/worker-registration";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid refetch flashes when switching tabs or resuming mobile Chrome.
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
      {children}
    </ProtectedRoute>
  );
}

function EmitraRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      allowedRoles={["partner"]}
      loginPath="/emitra/login"
      requireMobileVerified={false}
    >
      {children}
    </ProtectedRoute>
  );
}

function AppShell() {
  return (
    <>
      <OAuthLandingHandler />
      <PageTransition>
        <Routes>
          {/* Original SafeWork Global home */}
          <Route path="/" element={<Index />} />

          {/* Public pages linked from home */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:slug" element={<JobDetail />} />
          <Route path="/job-categories" element={<JobCategories />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/benefits-for-employers" element={<BenefitsForEmployers />} />
          <Route path="/auth" element={<Auth />} />

          {/* Public pages used by employer hiring flow + marketing footer */}
          {legacyPublicRoutes}

          {/* Worker auth — dedicated pages (legacy Supabase flow) */}
          <Route path="/register" element={<Navigate to="/worker/quick-signup" replace />} />
          <Route path="/login" element={<Navigate to="/worker/login" replace />} />
          <Route path="/worker-start" element={<Navigate to="/worker/quick-signup" replace />} />
          <Route path="/home" element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="/onboarding" element={<Navigate to="/worker/journey" replace />} />

          {/* Employer portal */}
          {legacyEmployerRoutes}

          {/* Legacy Supabase worker portal */}
          {legacyWorkerRoutes}

          {/* LSP (Rajasthan) trusted entry → E-Mitra */}
          <Route path="/lsp/entry" element={<LspEntryPage />} />
          <Route path="/lsp/verify" element={<LspVerifyPage />} />
          <Route path="/lsp/denied" element={<LspDeniedPage />} />

          {/* E-Mitra partner — canonical register/login; legacy URLs redirect */}
          <Route path="/emitra/register" element={<EmitraOnboardingPage />} />
          <Route path="/emitra/register-legacy" element={<Navigate to="/emitra/register" replace />} />
          <Route path="/emitra/login" element={<EmitraLoginPage />} />
          <Route path="/partner/login" element={<PartnerLoginChooser />} />
          <Route path="/partner/ssvn/login" element={<SsvnLoginPage />} />
          <Route path="/partner/iti/login" element={<SsvnLoginPage />} />
          <Route path="/partner/srn/login" element={<SsvnLoginPage />} />
          <Route path="/partner/consultant/login" element={<SsvnLoginPage />} />
          <Route
            path="/partner/bind-mobile"
            element={
              <ProtectedRoute allowedRoles={["partner"]} loginPath="/partner/login" requireMobileVerified={false}>
                <WorkerBindMobilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/dashboard"
            element={
              <EmitraRoute>
                <EmitraDashboardPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/workers"
            element={
              <EmitraRoute>
                <EmitraWorkersPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/onboard-worker"
            element={<Navigate to="/partner/add-worker" replace />}
          />
          <Route
            path="/partner/add-worker"
            element={
              <ProtectedRoute
                allowedRoles={["partner"]}
                loginPath="/partner/login"
                requireMobileVerified={false}
              >
                <PartnerAddWorkerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/my-workers"
            element={
              <EmitraRoute>
                <PartnerMyWorkersPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/my-workers"
            element={
              <EmitraRoute>
                <EmitraMyWorkersPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/rewards"
            element={
              <EmitraRoute>
                <EmitraRewardsPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/withdrawals"
            element={
              <EmitraRoute>
                <EmitraWithdrawalsPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/workers/register"
            element={
              <EmitraRoute>
                <EmitraRegisterWorkerPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/workers/:workerId"
            element={
              <EmitraRoute>
                <EmitraWorkerDetailPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/notifications"
            element={
              <EmitraRoute>
                <EmitraNotificationsPage />
              </EmitraRoute>
            }
          />
          <Route
            path="/emitra/compliance"
            element={
              <EmitraRoute>
                <EmitraCompliancePage />
              </EmitraRoute>
            }
          />
          <Route
            path="/partner/onboarding"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <PartnerOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <PartnerDashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/register"
            element={<PartnerRegister />}
          />
          <Route path="/partner/register-ssvn" element={<PartnerRegisterLegacy />} />
          <Route path="/partner/register-iti" element={<PartnerRegisterLegacy />} />
          <Route path="/partner/register-srn" element={<PartnerRegisterLegacy />} />
          <Route path="/partner/register-consultant" element={<PartnerRegisterLegacy />} />
          <Route path="/partner/register-legacy" element={<Navigate to="/partner/register" replace />} />
          <Route
            path="/partner/pending"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <PendingApproval />
              </ProtectedRoute>
            }
          />
          <Route path="/partner/wallet" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerWallet /></ProtectedRoute>} />
          <Route path="/partner/reports" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerReports /></ProtectedRoute>} />
          <Route path="/partner/support" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerSupport /></ProtectedRoute>} />
          <Route path="/partner/invoices" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerInvoices /></ProtectedRoute>} />
          <Route path="/partner/payouts" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerPayouts /></ProtectedRoute>} />
          <Route path="/partner/tickets" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerTickets /></ProtectedRoute>} />

          {/* SSVN — Skill Verification Network */}
          <Route path="/partner/ssvn/dashboard" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnDashboard /></ProtectedRoute>} />
          <Route path="/partner/ssvn/inbox" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Inbox — Accept assignments" filter="inbox" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/calendar" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Assessment Calendar" filter="calendar" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/today" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Today's Schedule" filter="today" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/active" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Active assessments" filter="active" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/history" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Assessment History" filter="history" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/assessment/:assessmentId" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessmentWizard /></ProtectedRoute>} />
          <Route path="/partner/ssvn/checkin" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnCheckin /></ProtectedRoute>} />

          {/* ITI — Industrial Training Institutes */}
          <Route path="/partner/iti/dashboard" element={<ProtectedRoute allowedRoles={["partner"]}><ItiDashboard /></ProtectedRoute>} />

          {/* Consultants — placement consultants, NGOs, mobilisers */}
          <Route path="/partner/consultant/dashboard" element={<ProtectedRoute allowedRoles={["partner"]}><ConsultantDashboard /></ProtectedRoute>} />

          {/* SRN — Recruitment Network */}
          <Route path="/partner/srn/dashboard" element={<ProtectedRoute allowedRoles={["partner"]}><SrnDashboard /></ProtectedRoute>} />
          <Route path="/partner/srn/workers" element={<ProtectedRoute allowedRoles={["partner"]}><SrnWorkers /></ProtectedRoute>} />
          <Route path="/partner/srn/medical" element={<ProtectedRoute allowedRoles={["partner"]}><SrnStageManager stage="medical" title="Medical" /></ProtectedRoute>} />
          <Route path="/partner/srn/visa" element={<ProtectedRoute allowedRoles={["partner"]}><SrnStageManager stage="visa" title="Visa" /></ProtectedRoute>} />
          <Route path="/partner/srn/travel" element={<ProtectedRoute allowedRoles={["partner"]}><SrnStageManager stage="travel" title="Travel" /></ProtectedRoute>} />
          <Route path="/partner/srn/deployment" element={<ProtectedRoute allowedRoles={["partner"]}><SrnStageManager stage="deployment" title="Deployment" /></ProtectedRoute>} />

          {/* SEN Global — Employer Network */}
          <Route path="/partner/sen-global/dashboard" element={<ProtectedRoute allowedRoles={["partner"]}><SenGlobalDashboard /></ProtectedRoute>} />
          <Route path="/partner/sen-global/leads" element={<ProtectedRoute allowedRoles={["partner"]}><SenGlobalLeads /></ProtectedRoute>} />
          <Route path="/partner/sen-global/revenue" element={<ProtectedRoute allowedRoles={["partner"]}><SenGlobalRevenue /></ProtectedRoute>} />

          <Route path="/partner/legacy-dashboard" element={<Navigate to="/partner/dashboard" replace />} />

          {/* Admin portal */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/investor-dashboard" element={<AdminRoute><InvestorDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/workers" element={<AdminRoute><AdminWorkers /></AdminRoute>} />
          <Route path="/admin/employers" element={<AdminRoute><AdminEmployers /></AdminRoute>} />
          <Route path="/admin/employer-access" element={<AdminRoute><EmployerAccessControl /></AdminRoute>} />
          <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
          <Route path="/admin/partner-workers" element={<AdminRoute><AdminPartnerWorkers /></AdminRoute>} />
          <Route path="/admin/partners" element={<AdminRoute><PartnerApprovals /></AdminRoute>} />
          <Route path="/admin/partners-v2" element={<AdminRoute><AdminPartnersV2 /></AdminRoute>} />
          <Route path="/admin/partner-ecosystem" element={<AdminRoute><AdminPartnersV2 /></AdminRoute>} />
          <Route path="/admin/jobs" element={<AdminRoute><JobVerification /></AdminRoute>} />
          <Route path="/admin/content-moderation" element={<AdminRoute><AdminContentModeration /></AdminRoute>} />
          <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
          <Route path="/admin/verification-queue" element={<AdminRoute><AdminVerificationQueue /></AdminRoute>} />
          <Route path="/admin/journey-ops" element={<AdminRoute><AdminJourneyOps /></AdminRoute>} />
          <Route path="/admin/quiz-cms" element={<AdminRoute><AdminQuizCms /></AdminRoute>} />
          <Route path="/interviewer/login" element={<InterviewerLoginPage />} />
          <Route
            path="/interviewer/queue"
            element={
              <ProtectedRoute allowedRoles={["interviewer", "admin"]} loginPath="/interviewer/login">
                <InterviewerQueuePage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/trade-test-allocations" element={<AdminRoute><AdminTradeTestAllocations /></AdminRoute>} />
          <Route path="/admin/document-verification" element={<AdminRoute><DocumentVerification /></AdminRoute>} />
          <Route path="/admin/id-verification" element={<AdminRoute><IDVerification /></AdminRoute>} />
          <Route path="/admin/ecr-management" element={<AdminRoute><ECRManagement /></AdminRoute>} />
          <Route path="/admin/job-verification" element={<AdminRoute><JobVerification /></AdminRoute>} />
          <Route path="/admin/edit-job/:jobId" element={<AdminRoute><EditJob /></AdminRoute>} />
          <Route path="/admin/compliance" element={<AdminRoute><ComplianceCheck /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/admin/disputes" element={<AdminRoute><DisputeResolution /></AdminRoute>} />
          <Route path="/admin/contact-submissions" element={<AdminRoute><ContactSubmissions /></AdminRoute>} />
          <Route path="/admin/partner-rewards" element={<AdminRoute><AdminPartnerRewards /></AdminRoute>} />
          <Route path="/admin/partner-payouts" element={<AdminRoute><AdminPartnerPayouts /></AdminRoute>} />
          <Route path="/admin/partner-tickets" element={<AdminRoute><AdminPartnerTickets /></AdminRoute>} />
          <Route path="/admin/emitra/worker-review" element={<AdminRoute><AdminEmitraWorkerReview /></AdminRoute>} />
          <Route path="/admin/emitra/withdrawals" element={<AdminRoute><AdminEmitraWithdrawals /></AdminRoute>} />
          <Route path="/admin/emitra/analytics" element={<AdminRoute><AdminEmitraAnalytics /></AdminRoute>} />
          <Route path="/admin/lsps" element={<AdminRoute><AdminLsps /></AdminRoute>} />
          <Route path="/admin/lsp-docs" element={<AdminRoute><AdminLspDeveloperDocs /></AdminRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WorkerLanguageProvider>
              <WorkerAuthProvider>
                <AuthProvider>
                  <ErrorBoundary>
                    <AppShell />
                  </ErrorBoundary>
                </AuthProvider>
              </WorkerAuthProvider>
            </WorkerLanguageProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
