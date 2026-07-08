import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import PageTransition from "./components/PageTransition";
import PilotPhaseBanner from "./components/PilotPhaseBanner";
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
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerOnboarding from "./pages/partner/PartnerOnboarding";
import PartnerRegister from "./modules/partner/pages/PartnerRegister";
import PendingApproval from "./modules/partner/pages/PendingApproval";
import PartnerDashboardRouter from "./modules/partner/pages/PartnerDashboardRouter";
import SsvnDashboard from "./modules/partner/pages/ssvn/SsvnDashboard";
import SsvnAssessments from "./modules/partner/pages/ssvn/SsvnAssessments";
import SsvnCheckin from "./modules/partner/pages/ssvn/SsvnCheckin";
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
import AdminApplications from "./pages/admin/AdminApplications";
import AdminPartnerWorkers from "./pages/admin/AdminPartnerWorkers";
import AdminContentModeration from "./pages/admin/AdminContentModeration";
import AdminMessages from "./pages/admin/AdminMessages";
import {
  EmitraRegisterPage,
  EmitraLoginPage,
  EmitraDashboardPage,
  EmitraWorkersPage,
  EmitraRegisterWorkerPage,
  EmitraWorkerDetailPage,
  EmitraNotificationsPage,
  EmitraCompliancePage,
  EmitraOnboardWorkerPage,
  EmitraMyWorkersPage,
  EmitraRewardsPage,
  EmitraWithdrawalsPage,
} from "./modules/emitra";
import AdminEmitraWorkerReview from "./pages/admin/AdminEmitraWorkerReview";
import AdminEmitraWithdrawals from "./pages/admin/AdminEmitraWithdrawals";
import AdminEmitraAnalytics from "./pages/admin/AdminEmitraAnalytics";
import {
  WorkerAuthProvider,
  WorkerLanguageProvider,
} from "./modules/worker-registration";
import { useIsActiveModuleRoute } from "./modules/worker-registration/hooks/useIsWorkerRegistrationRoute";

const qc = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
      {children}
    </ProtectedRoute>
  );
}

function AppShell() {
  const isActiveModule = useIsActiveModuleRoute();

  return (
    <>
      {!isActiveModule && <PilotPhaseBanner />}
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
          <Route path="/onboarding" element={<Navigate to="/worker/onboarding" replace />} />

          {/* Employer portal */}
          {legacyEmployerRoutes}

          {/* Legacy Supabase worker portal */}
          {legacyWorkerRoutes}

          {/* E-Mitra partner */}
          <Route path="/emitra/register" element={<EmitraRegisterPage />} />
          <Route path="/emitra/login" element={<EmitraLoginPage />} />
          <Route
            path="/emitra/dashboard"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/workers"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraWorkersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/onboard-worker"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraOnboardWorkerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/my-workers"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraMyWorkersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/rewards"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraRewardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/withdrawals"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraWithdrawalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/workers/register"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraRegisterWorkerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/workers/:workerId"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraWorkerDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/notifications"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emitra/compliance"
            element={
              <ProtectedRoute allowedRoles={["partner"]}>
                <EmitraCompliancePage />
              </ProtectedRoute>
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
          <Route path="/partner/ssvn/calendar" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Assessment Calendar" filter="calendar" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/today" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Today's Schedule" filter="today" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/history" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnAssessments title="Assessment History" filter="history" /></ProtectedRoute>} />
          <Route path="/partner/ssvn/checkin" element={<ProtectedRoute allowedRoles={["partner"]}><SsvnCheckin /></ProtectedRoute>} />

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

          {/* Legacy partner dashboard (kept for backwards compat) */}
          <Route path="/partner/legacy-dashboard" element={<ProtectedRoute allowedRoles={["partner"]}><PartnerDashboard /></ProtectedRoute>} />

          {/* Admin portal */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/investor-dashboard" element={<AdminRoute><InvestorDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/workers" element={<AdminRoute><AdminWorkers /></AdminRoute>} />
          <Route path="/admin/employers" element={<AdminRoute><AdminEmployers /></AdminRoute>} />
          <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
          <Route path="/admin/partner-workers" element={<AdminRoute><AdminPartnerWorkers /></AdminRoute>} />
          <Route path="/admin/partners" element={<AdminRoute><PartnerApprovals /></AdminRoute>} />
          <Route path="/admin/partners-v2" element={<AdminRoute><AdminPartnersV2 /></AdminRoute>} />
          <Route path="/admin/partner-ecosystem" element={<AdminRoute><AdminPartnersV2 /></AdminRoute>} />
          <Route path="/admin/jobs" element={<AdminRoute><JobVerification /></AdminRoute>} />
          <Route path="/admin/content-moderation" element={<AdminRoute><AdminContentModeration /></AdminRoute>} />
          <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
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
