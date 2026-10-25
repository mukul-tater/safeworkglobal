import { lazy, type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

// Route-level code splitting: each employer page downloads only when visited.
const QuickEmployerSignup = lazy(() => import('@/pages/employer/QuickEmployerSignup'));
const EmployerLoginPage = lazy(() => import('@/pages/employer/EmployerLoginPage'));
const WorkerBindMobilePage = lazy(() => import('@/pages/worker/WorkerBindMobilePage'));
const QuickPostJob = lazy(() => import('@/pages/employer/QuickPostJob'));
const PilotOffer = lazy(() => import('@/pages/employer/PilotOffer'));
const RecommendedWorkers = lazy(() => import('@/pages/employer/RecommendedWorkers'));
const EmployerDashboard = lazy(() => import('@/pages/employer/EmployerDashboard'));
const EmployerRequirement = lazy(() => import('@/pages/employer/EmployerRequirement'));
const EmployerProfile = lazy(() => import('@/pages/employer/EmployerProfile'));
const CompanyProfile = lazy(() => import('@/pages/employer/CompanyProfile'));
const PostJob = lazy(() => import('@/pages/employer/PostJob'));
const ManageJobs = lazy(() => import('@/pages/employer/ManageJobs'));
const EmployerEditJob = lazy(() => import('@/pages/employer/EditJob'));
const SearchWorkers = lazy(() => import('@/pages/employer/SearchWorkers'));
const SharedWorkers = lazy(() => import('@/pages/employer/SharedWorkers'));
const EmployerInterviews = lazy(() => import('@/pages/employer/InterviewScheduling'));
const EmployerOffers = lazy(() => import('@/pages/employer/OfferManagement'));
const EmployerOfferLetters = lazy(() => import('@/pages/employer/EmployerOfferLetters'));
const EmployerCompliance = lazy(() => import('@/pages/employer/ComplianceReports'));
const EmployerMessaging = lazy(() => import('@/pages/employer/EmployerMessaging'));
const EmployerSavedSearches = lazy(() => import('@/pages/employer/SavedSearches'));
const ApplicationReview = lazy(() => import('@/pages/employer/ApplicationReview'));
const ApplicationDetail = lazy(() => import('@/pages/employer/ApplicationDetail'));
const WorkerShortlist = lazy(() => import('@/pages/employer/WorkerShortlist'));
const ManageFormalities = lazy(() => import('@/pages/employer/ManageFormalities'));
const EmployerPayments = lazy(() => import('@/pages/employer/EmployerPayments'));
const ContractManagement = lazy(() => import('@/pages/employer/ContractManagement'));
const EmployerContractHistory = lazy(() => import('@/pages/employer/ContractHistory'));
const EmployerReports = lazy(() => import('@/pages/employer/EmployerReports'));

function employerRoute(path: string, page: ReactNode) {
  return (
    <Route
      key={path}
      path={path}
      element={<ProtectedRoute allowedRoles={['employer']}>{page}</ProtectedRoute>}
    />
  );
}

/** Supabase employer portal routes (restored from legacy App.tsx). */
export const legacyEmployerRoutes = (
  <>
    <Route path="/employer/quick-signup" element={<QuickEmployerSignup />} />
    <Route path="/employer/login" element={<EmployerLoginPage />} />
    <Route
      path="/employer/bind-mobile"
      element={
        <ProtectedRoute allowedRoles={['employer']} loginPath="/employer/login" requireMobileVerified={false}>
          <WorkerBindMobilePage />
        </ProtectedRoute>
      }
    />
    <Route path="/employer/register" element={<Navigate to="/employer/quick-signup" replace />} />
    <Route path="/employer/trust" element={<Navigate to="/employer/dashboard" replace />} />
    {employerRoute('/employer/quick-post-job', <QuickPostJob />)}
    {employerRoute('/employer/pilot-offer', <PilotOffer />)}
    {employerRoute('/employer/recommended-workers', <RecommendedWorkers />)}
    <Route path="/employer/onboarding" element={<Navigate to="/employer/quick-signup" replace />} />
    {employerRoute('/employer/dashboard', <EmployerDashboard />)}
    {employerRoute('/employer/requirement', <EmployerRequirement />)}
    {employerRoute('/employer/profile', <EmployerProfile />)}
    {employerRoute('/employer/company', <CompanyProfile />)}
    {employerRoute('/employer/post-job', <PostJob />)}
    {employerRoute('/employer/manage-jobs', <ManageJobs />)}
    {employerRoute('/employer/edit-job/:jobId', <EmployerEditJob />)}
    {employerRoute('/employer/search-workers', <SearchWorkers />)}
    {employerRoute('/employer/shared-workers', <SharedWorkers />)}
    {employerRoute('/employer/interviews', <EmployerInterviews />)}
    {employerRoute('/employer/offers', <EmployerOffers />)}
    {employerRoute('/employer/offer-letters', <EmployerOfferLetters />)}
    <Route path="/employer/escrow" element={<Navigate to="/employer/dashboard" replace />} />
    {employerRoute('/employer/compliance', <EmployerCompliance />)}
    {employerRoute('/employer/messaging', <EmployerMessaging />)}
    {employerRoute('/employer/saved-searches', <EmployerSavedSearches />)}
    {employerRoute('/employer/applications', <ApplicationReview />)}
    {employerRoute('/employer/applications/:applicationId', <ApplicationDetail />)}
    {employerRoute('/employer/shortlist', <WorkerShortlist />)}
    {employerRoute('/employer/formalities', <ManageFormalities />)}
    {employerRoute('/employer/payments', <EmployerPayments />)}
    {employerRoute('/employer/contracts', <ContractManagement />)}
    {employerRoute('/employer/contract-history', <EmployerContractHistory />)}
    {employerRoute('/employer/reports', <EmployerReports />)}
    <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />
  </>
);
