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
} from "./modules/emitra";
import {
  WorkerAuthProvider,
  WorkerRegistrationHome,
  WorkerRegisterPage,
  WorkerLoginPage,
  WorkerDashboardPage,
  WorkerProtectedRoute,
  WorkerOnboardingPage,
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

          {/* Phase-1 worker registration (backend API) */}
          <Route path="/register" element={<WorkerRegisterPage />} />
          <Route path="/login" element={<WorkerLoginPage />} />
          <Route path="/worker/quick-signup" element={<Navigate to="/register" replace />} />
          <Route path="/worker-start" element={<WorkerRegistrationHome />} />

          {/* Employer portal */}
          {legacyEmployerRoutes}

          <Route
            path="/home"
            element={
              <WorkerProtectedRoute>
                <WorkerDashboardPage />
              </WorkerProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <WorkerProtectedRoute>
                <WorkerOnboardingPage />
              </WorkerProtectedRoute>
            }
          />
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
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />

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
