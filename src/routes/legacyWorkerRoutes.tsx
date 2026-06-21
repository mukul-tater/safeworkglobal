import type { ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkerDashboard from '@/pages/worker/WorkerDashboard';
import WorkerProfile from '@/pages/worker/WorkerProfile';
import WorkerApplications from '@/pages/worker/WorkerApplications';
import WorkerApplicationDetail from '@/pages/worker/WorkerApplicationDetail';
import ApplicationTracking from '@/pages/worker/ApplicationTracking';
import WorkerMessaging from '@/pages/worker/WorkerMessaging';
import WorkerDocuments from '@/pages/worker/WorkerDocuments';
import WorkerNotifications from '@/pages/worker/WorkerNotifications';
import WorkerTraining from '@/pages/worker/Training';
import WorkerContracts from '@/pages/worker/Contracts';
import WorkerTravelStatus from '@/pages/worker/TravelStatus';
import WorkerInsurance from '@/pages/worker/Insurance';
import WorkerSavedSearches from '@/pages/worker/SavedSearches';
import WorkerSavedJobs from '@/pages/worker/SavedJobs';
import WorkerPublicProfile from '@/pages/worker/WorkerPublicProfile';
import WorkerOffers from '@/pages/worker/WorkerOffers';
import WorkerInterviews from '@/pages/worker/WorkerInterviews';
import WorkerCalendar from '@/pages/worker/WorkerCalendar';
import WorkerContractHistory from '@/pages/worker/ContractHistory';
import WorkerPayments from '@/pages/worker/WorkerPayments';
import WorkerVerificationStatus from '@/pages/worker/VerificationStatus';
import WorkerOnboarding from '@/pages/worker/WorkerOnboarding';
import ApplicationSuccess from '@/pages/worker/ApplicationSuccess';
import WorkerGoogleLandingRedirect from '@/modules/worker-registration/pages/WorkerGoogleLandingRedirect';
import QuickWorkerSignup from '@/pages/worker/QuickWorkerSignup';
import WorkerLoginPage from '@/pages/worker/WorkerLoginPage';

/** Must return <Route> directly — wrapper components break React Router v6 matching. */
function workerRoute(path: string, page: ReactNode) {
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute allowedRoles={['worker']} loginPath="/worker/login">
          {page}
        </ProtectedRoute>
      }
    />
  );
}

/** Supabase/Lovable worker portal routes (restored from legacy App.tsx). */
export const legacyWorkerRoutes = (
  <>
    <Route path="/worker/quick-signup" element={<QuickWorkerSignup />} />
    <Route path="/worker/login" element={<WorkerLoginPage />} />
    <Route path="/worker/trust" element={<WorkerGoogleLandingRedirect />} />
    <Route path="/worker/discover" element={<Navigate to="/jobs" replace />} />
    {workerRoute('/worker/application-success/:applicationId', <ApplicationSuccess />)}
    {workerRoute('/worker/onboarding', <WorkerOnboarding />)}
    {workerRoute('/worker/dashboard', <WorkerDashboard />)}
    {workerRoute('/worker/profile', <WorkerProfile />)}
    {workerRoute('/worker/applications', <WorkerApplications />)}
    {workerRoute('/worker/applications/:applicationId', <WorkerApplicationDetail />)}
    {workerRoute('/worker/application-tracking', <ApplicationTracking />)}
    {workerRoute('/worker/messaging', <WorkerMessaging />)}
    {workerRoute('/worker/training', <WorkerTraining />)}
    {workerRoute('/worker/contracts', <WorkerContracts />)}
    {workerRoute('/worker/travel', <WorkerTravelStatus />)}
    {workerRoute('/worker/insurance', <WorkerInsurance />)}
    {workerRoute('/worker/documents', <WorkerDocuments />)}
    {workerRoute('/worker/notifications', <WorkerNotifications />)}
    {workerRoute('/worker/saved-searches', <WorkerSavedSearches />)}
    {workerRoute('/worker/saved-jobs', <WorkerSavedJobs />)}
    {workerRoute('/worker/offers', <WorkerOffers />)}
    {workerRoute('/worker/interviews', <WorkerInterviews />)}
    {workerRoute('/worker/calendar', <WorkerCalendar />)}
    {workerRoute('/worker/contract-history', <WorkerContractHistory />)}
    {workerRoute('/worker/verification', <WorkerVerificationStatus />)}
    {workerRoute('/worker/payments', <WorkerPayments />)}
    <Route path="/worker-profile/:id" element={<WorkerPublicProfile />} />
  </>
);
