import type { ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuickEmployerSignup from '@/pages/employer/QuickEmployerSignup';
import EmployerLoginPage from '@/pages/employer/EmployerLoginPage';
import QuickPostJob from '@/pages/employer/QuickPostJob';
import PilotOffer from '@/pages/employer/PilotOffer';
import RecommendedWorkers from '@/pages/employer/RecommendedWorkers';
import EmployerOnboarding from '@/pages/employer/EmployerOnboarding';
import EmployerDashboard from '@/pages/employer/EmployerDashboard';
import EmployerProfile from '@/pages/employer/EmployerProfile';
import CompanyProfile from '@/pages/employer/CompanyProfile';
import PostJob from '@/pages/employer/PostJob';
import ManageJobs from '@/pages/employer/ManageJobs';
import EmployerEditJob from '@/pages/employer/EditJob';
import SearchWorkers from '@/pages/employer/SearchWorkers';
import EmployerInterviews from '@/pages/employer/InterviewScheduling';
import EmployerOffers from '@/pages/employer/OfferManagement';
import EmployerEscrow from '@/pages/employer/EscrowPayments';
import EmployerCompliance from '@/pages/employer/ComplianceReports';
import EmployerMessaging from '@/pages/employer/EmployerMessaging';
import EmployerSavedSearches from '@/pages/employer/SavedSearches';
import ApplicationReview from '@/pages/employer/ApplicationReview';
import ApplicationDetail from '@/pages/employer/ApplicationDetail';
import WorkerShortlist from '@/pages/employer/WorkerShortlist';
import ManageFormalities from '@/pages/employer/ManageFormalities';
import EmployerPayments from '@/pages/employer/EmployerPayments';
import ContractManagement from '@/pages/employer/ContractManagement';
import EmployerContractHistory from '@/pages/employer/ContractHistory';
import EmployerReports from '@/pages/employer/EmployerReports';

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
    <Route path="/employer/register" element={<Navigate to="/employer/quick-signup" replace />} />
    <Route path="/employer/trust" element={<Navigate to="/employer/dashboard" replace />} />
    {employerRoute('/employer/quick-post-job', <QuickPostJob />)}
    {employerRoute('/employer/pilot-offer', <PilotOffer />)}
    {employerRoute('/employer/recommended-workers', <RecommendedWorkers />)}
    {employerRoute('/employer/onboarding', <EmployerOnboarding />)}
    {employerRoute('/employer/dashboard', <EmployerDashboard />)}
    {employerRoute('/employer/profile', <EmployerProfile />)}
    {employerRoute('/employer/company', <CompanyProfile />)}
    {employerRoute('/employer/post-job', <PostJob />)}
    {employerRoute('/employer/manage-jobs', <ManageJobs />)}
    {employerRoute('/employer/edit-job/:jobId', <EmployerEditJob />)}
    {employerRoute('/employer/search-workers', <SearchWorkers />)}
    {employerRoute('/employer/interviews', <EmployerInterviews />)}
    {employerRoute('/employer/offers', <EmployerOffers />)}
    {employerRoute('/employer/escrow', <EmployerEscrow />)}
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
