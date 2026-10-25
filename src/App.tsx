import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { usePlatformPaymentSettings } from "@/lib/platformPaymentSettings";
import { useJourneyRules } from "@/lib/journeyRules";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { recordSiteVisitOnce } from "@/lib/recordSiteVisit";
import { installWhatsAppErrorToasts } from "@/lib/whatsappSupport";

installWhatsAppErrorToasts();
import { AuthProvider } from "./contexts/AuthContext";
import OAuthLandingHandler from "./components/OAuthLandingHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import PageTransition from "./components/PageTransition";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { comingSoonPortalRoutes } from "./routes/comingSoonPortalRoutes";
import { USERS_ONLY_LAUNCH } from "./lib/launchGate";
import { legacyEmployerRoutes } from "./routes/legacyEmployerRoutes";
import { legacyPublicRoutes } from "./routes/legacyPublicRoutes";
import { legacyWorkerRoutes } from "./routes/legacyWorkerRoutes";
import {
  WorkerAuthProvider,
  WorkerLanguageProvider,
} from "./modules/worker-registration";
import OfflineNotice from "./components/OfflineNotice";

// Route-level code splitting: every page below downloads only when visited.
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const JobCategories = lazy(() => import("./pages/JobCategories"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Payments = lazy(() => import("./pages/Payments"));
const PaymentComplete = lazy(() => import("./pages/PaymentComplete"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PartnerOnboarding = lazy(() => import("./pages/partner/PartnerOnboarding"));
const PartnerRegister = lazy(() => import("./modules/partner/pages/PartnerRegister"));
const PartnerRegisterLegacy = lazy(() => import("./modules/partner/pages/PartnerRegisterLegacy"));
const PendingApproval = lazy(() => import("./modules/partner/pages/PendingApproval"));
const PartnerDashboardRouter = lazy(() => import("./modules/partner/pages/PartnerDashboardRouter"));
const PartnerAddWorkerPage = lazy(() => import("./modules/partner/pages/PartnerAddWorkerPage"));
const PartnerWorkerJourneyPage = lazy(() => import("./modules/partner/pages/PartnerWorkerJourneyPage"));
const PartnerMyWorkersPage = lazy(() => import("./modules/partner/pages/PartnerMyWorkersPage"));
const SsvnDashboard = lazy(() => import("./modules/partner/pages/ssvn/SsvnDashboard"));
const SsvnAssessments = lazy(() => import("./modules/partner/pages/ssvn/SsvnAssessments"));
const SsvnCheckin = lazy(() => import("./modules/partner/pages/ssvn/SsvnCheckin"));
const SsvnAssessmentWizard = lazy(() => import("./modules/partner/pages/ssvn/SsvnAssessmentWizard"));
const SsvnLoginPage = lazy(() => import("./modules/partner/pages/ssvn/SsvnLoginPage"));
const WorkerBindMobilePage = lazy(() => import("./pages/worker/WorkerBindMobilePage"));
const ItiDashboard = lazy(() => import("./modules/partner/pages/iti/ItiDashboard"));
const ConsultantDashboard = lazy(() => import("./modules/partner/pages/consultant/ConsultantDashboard"));
const PartnerLoginChooser = lazy(() => import("./modules/partner/pages/PartnerLoginChooser"));
const AdminTradeTestAllocations = lazy(() => import("./pages/admin/AdminTradeTestAllocations"));
const AdminTradeTestsPage = lazy(() => import("./pages/admin/AdminTradeTestsPage"));
const PartnerWallet = lazy(() => import("./modules/partner/pages/shared/PartnerWallet"));
const PartnerReports = lazy(() => import("./modules/partner/pages/shared/PartnerReports"));
const PartnerSupport = lazy(() => import("./modules/partner/pages/shared/PartnerSupport"));
const PartnerInvoices = lazy(() => import("./modules/partner/pages/shared/PartnerInvoices"));
const PartnerPayouts = lazy(() => import("./modules/partner/pages/shared/PartnerPayouts"));
const PartnerTickets = lazy(() => import("./modules/partner/pages/shared/PartnerTickets"));
const SrnDashboard = lazy(() => import("./modules/partner/pages/srn/SrnDashboard"));
const SrnWorkers = lazy(() => import("./modules/partner/pages/srn/SrnWorkers"));
const SrnSharedWorkers = lazy(() => import("./modules/partner/pages/srn/SrnSharedWorkers"));
const SrnStageManager = lazy(() => import("./modules/partner/pages/srn/SrnStageManager"));
const SenGlobalDashboard = lazy(() => import("./modules/partner/pages/senGlobal/SenGlobalDashboard"));
const SenGlobalLeads = lazy(() => import("./modules/partner/pages/senGlobal/SenGlobalLeads"));
const SenGlobalRevenue = lazy(() => import("./modules/partner/pages/senGlobal/SenGlobalRevenue"));
const AdminPartnerPayouts = lazy(() => import("./pages/admin/AdminPartnerPayouts"));
const AdminPartnerTickets = lazy(() => import("./pages/admin/AdminPartnerTickets"));
const AdminPartnersV2 = lazy(() => import("./pages/admin/AdminPartnersV2"));
const BenefitsForEmployers = lazy(() => import("./pages/BenefitsForEmployers"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const PartnerApprovals = lazy(() => import("./pages/admin/PartnerApprovals"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminRegisterPage = lazy(() => import("./pages/admin/AdminRegisterPage"));
const InvestorDashboard = lazy(() => import("./pages/admin/InvestorDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const DocumentVerification = lazy(() => import("./pages/admin/DocumentVerification"));
const IDVerification = lazy(() => import("./pages/admin/IDVerification"));
const ECRManagement = lazy(() => import("./pages/admin/ECRManagement"));
const JobVerification = lazy(() => import("./pages/admin/JobVerification"));
const EditJob = lazy(() => import("./pages/admin/EditJob"));
const AdminPostJob = lazy(() => import("./pages/admin/PostJob"));
const ComplianceCheck = lazy(() => import("./pages/admin/ComplianceCheck"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const DisputeResolution = lazy(() => import("./pages/admin/DisputeResolution"));
const ContactSubmissions = lazy(() => import("./pages/admin/ContactSubmissions"));
const AdminPartnerRewards = lazy(() => import("./pages/admin/AdminPartnerRewards"));
const AdminPaymentSettings = lazy(() => import("./pages/admin/AdminPaymentSettings"));
const AdminJourneyRules = lazy(() => import("./pages/admin/AdminJourneyRules"));
const AdminSiteContent = lazy(() => import("./pages/admin/AdminSiteContent"));
const AdminWorkers = lazy(() => import("./pages/admin/AdminWorkers"));
const SharedWorkerPage = lazy(() => import("./pages/shared/SharedWorkerPage"));
const AdminEmployers = lazy(() => import("./pages/admin/AdminEmployers"));
const EmployerAccessControl = lazy(() => import("./pages/admin/EmployerAccessControl"));
const AdminApplications = lazy(() => import("./pages/admin/AdminApplications"));
const AdminPartnerWorkers = lazy(() => import("./pages/admin/AdminPartnerWorkers"));
const AdminContentModeration = lazy(() => import("./pages/admin/AdminContentModeration"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const EmitraOnboardingPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraOnboardingPage })));
const EmitraLoginPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraLoginPage })));
const EmitraDashboardPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraDashboardPage })));
const EmitraWorkersPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraWorkersPage })));
const EmitraRegisterWorkerPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraRegisterWorkerPage })));
const EmitraWorkerDetailPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraWorkerDetailPage })));
const EmitraNotificationsPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraNotificationsPage })));
const EmitraCompliancePage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraCompliancePage })));
const EmitraMyWorkersPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraMyWorkersPage })));
const EmitraRewardsPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraRewardsPage })));
const EmitraWithdrawalsPage = lazy(() => import("./modules/emitra").then((m) => ({ default: m.EmitraWithdrawalsPage })));
const AdminEmitraWorkerReview = lazy(() => import("./pages/admin/AdminEmitraWorkerReview"));
const AdminEmitraWithdrawals = lazy(() => import("./pages/admin/AdminEmitraWithdrawals"));
const AdminEmitraAnalytics = lazy(() => import("./pages/admin/AdminEmitraAnalytics"));
const AdminVerificationQueue = lazy(() => import("./pages/admin/AdminVerificationQueue"));
const AdminQuizCms = lazy(() => import("./pages/admin/AdminQuizCms"));
const AdminJourneyOps = lazy(() => import("./pages/admin/AdminJourneyOps"));
const InterviewerLoginPage = lazy(() => import("./modules/interviewer/pages/InterviewerLoginPage"));
const InterviewerQueuePage = lazy(() => import("./modules/interviewer/pages/InterviewerQueuePage"));
const AdminLsps = lazy(() => import("./pages/admin/AdminLsps"));
const AdminLspDeveloperDocs = lazy(() => import("./pages/admin/AdminLspDeveloperDocs"));
const LspEntryPage = lazy(() => import("./modules/lsp/pages/LspEntryPage"));
const LspVerifyPage = lazy(() => import("./modules/lsp/pages/LspVerifyPage"));
const LspDeniedPage = lazy(() => import("./modules/lsp/pages/LspDeniedPage"));

/** Shown briefly while a page's code downloads on first visit. */
function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

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
  usePlatformPaymentSettings();
  useJourneyRules();
  const { pathname } = useLocation();
  useEffect(() => {
    recordSiteVisitOnce();
  }, [pathname]);

  return (
    <>
      <OAuthLandingHandler />
      <PageTransition>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Original SafeWork Global home */}
          <Route path="/" element={<Index />} />

          {/* Public pages linked from home */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:slug" element={<JobDetail />} />
          <Route path="/job-categories" element={<JobCategories />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/complete" element={<PaymentComplete />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/benefits-for-employers" element={<BenefitsForEmployers />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/shared-worker/:token" element={<SharedWorkerPage />} />

          {/* Public pages used by employer hiring flow + marketing footer */}
          {legacyPublicRoutes}

          {USERS_ONLY_LAUNCH ? comingSoonPortalRoutes : null}

          {/* Worker auth — dedicated pages (legacy Supabase flow) */}
          <Route path="/register" element={<Navigate to="/worker/login" replace />} />
          <Route path="/login" element={<Navigate to="/worker/login" replace />} />
          <Route path="/worker-start" element={<Navigate to="/worker/login" replace />} />
          <Route path="/home" element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="/onboarding" element={<Navigate to="/worker/journey" replace />} />

          {/* Employer portal */}
          {!USERS_ONLY_LAUNCH && legacyEmployerRoutes}

          {/* Legacy Supabase worker portal */}
          {legacyWorkerRoutes}

          {!USERS_ONLY_LAUNCH && (
          <>
          {/* LSP (Rajasthan) trusted entry → E-Mitra */}
          <Route path="/lsp/entry" element={<LspEntryPage />} />
          <Route path="/lsp/verify" element={<LspVerifyPage />} />
          <Route path="/lsp/denied" element={<LspDeniedPage />} />
          </>
          )}

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
            path="/partner/workers/:workerId/journey"
            element={
              <ProtectedRoute
                allowedRoles={["partner"]}
                loginPath="/partner/login"
                requireMobileVerified={false}
              >
                <PartnerWorkerJourneyPage />
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
          <Route path="/partner/srn/shared-workers" element={<ProtectedRoute allowedRoles={["partner"]}><SrnSharedWorkers /></ProtectedRoute>} />
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
          <Route path="/admin/journey-rules" element={<AdminRoute><AdminJourneyRules /></AdminRoute>} />
          <Route path="/admin/site-content" element={<AdminRoute><AdminSiteContent /></AdminRoute>} />
          <Route path="/admin/quiz-cms" element={<AdminRoute><AdminQuizCms /></AdminRoute>} />
          {!USERS_ONLY_LAUNCH && (
            <Route path="/interviewer/login" element={<InterviewerLoginPage />} />
          )}
          <Route
            path="/interviewer/queue"
            element={
              USERS_ONLY_LAUNCH ? (
                <AdminRoute>
                  <InterviewerQueuePage />
                </AdminRoute>
              ) : (
                <ProtectedRoute allowedRoles={["interviewer", "admin"]} loginPath="/interviewer/login">
                  <InterviewerQueuePage />
                </ProtectedRoute>
              )
            }
          />
          <Route path="/admin/trade-test-allocations" element={<AdminRoute><AdminTradeTestAllocations /></AdminRoute>} />
          <Route path="/admin/trade-tests/:assessmentId" element={<AdminRoute><SsvnAssessmentWizard /></AdminRoute>} />
          <Route path="/admin/trade-tests" element={<AdminRoute><AdminTradeTestsPage /></AdminRoute>} />
          <Route path="/admin/interviews" element={<AdminRoute><InterviewerQueuePage /></AdminRoute>} />
          <Route path="/admin/document-verification" element={<AdminRoute><DocumentVerification /></AdminRoute>} />
          <Route path="/admin/id-verification" element={<AdminRoute><IDVerification /></AdminRoute>} />
          <Route path="/admin/ecr-management" element={<AdminRoute><ECRManagement /></AdminRoute>} />
          <Route path="/admin/job-verification" element={<AdminRoute><JobVerification /></AdminRoute>} />
          <Route path="/admin/post-job" element={<AdminRoute><AdminPostJob /></AdminRoute>} />
          <Route path="/admin/payment-settings" element={<AdminRoute><AdminPaymentSettings /></AdminRoute>} />
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
        </Suspense>
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
              <OfflineNotice />
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
