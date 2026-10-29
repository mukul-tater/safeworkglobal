import { lazy, type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

// Route-level code splitting: each worker page downloads only when visited.
const WorkerDashboard = lazy(() => import('@/pages/worker/WorkerDashboard'));
const WorkerProfile = lazy(() => import('@/pages/worker/WorkerProfile'));
const WorkerApplications = lazy(() => import('@/pages/worker/WorkerApplications'));
const WorkerApplicationDetail = lazy(() => import('@/pages/worker/WorkerApplicationDetail'));
const ApplicationTracking = lazy(() => import('@/pages/worker/ApplicationTracking'));
const WorkerMessaging = lazy(() => import('@/pages/worker/WorkerMessaging'));
const WorkerDocuments = lazy(() => import('@/pages/worker/WorkerDocuments'));
const WorkerNotifications = lazy(() => import('@/pages/worker/WorkerNotifications'));
const WorkerTraining = lazy(() => import('@/pages/worker/Training'));
const WorkerContracts = lazy(() => import('@/pages/worker/Contracts'));
const WorkerTravelStatus = lazy(() => import('@/pages/worker/TravelStatus'));
const WorkerInsurance = lazy(() => import('@/pages/worker/Insurance'));
const WorkerSavedSearches = lazy(() => import('@/pages/worker/SavedSearches'));
const WorkerSavedJobs = lazy(() => import('@/pages/worker/SavedJobs'));
const WorkerPublicProfile = lazy(() => import('@/pages/worker/WorkerPublicProfile'));
const WorkerOffers = lazy(() => import('@/pages/worker/WorkerOffers'));
const WorkerInterviews = lazy(() => import('@/pages/worker/WorkerInterviews'));
const WorkerCalendar = lazy(() => import('@/pages/worker/WorkerCalendar'));
const WorkerContractHistory = lazy(() => import('@/pages/worker/ContractHistory'));
const WorkerPayments = lazy(() => import('@/pages/worker/WorkerPayments'));
const ApplicationSuccess = lazy(() => import('@/pages/worker/ApplicationSuccess'));
const WorkerGoogleLandingRedirect = lazy(() => import('@/modules/worker-registration/pages/WorkerGoogleLandingRedirect'));
const WorkerLoginPage = lazy(() => import('@/pages/worker/WorkerLoginPage'));
const WorkerBindMobilePage = lazy(() => import('@/pages/worker/WorkerBindMobilePage'));
const WorkerVerificationPage = lazy(() => import('@/modules/worker-verification/pages/WorkerVerificationPage'));

/** Must return <Route> directly — wrapper components break React Router v6 matching. */
function workerRoute(path: string, page: ReactNode) {
  return (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute
          allowedRoles={['worker']}
          loginPath="/worker/login"
          requireMobileVerified
        >
          {page}
        </ProtectedRoute>
      }
    />
  );
}

/** Supabase/Lovable worker portal routes (restored from legacy App.tsx). */
export const legacyWorkerRoutes = (
  <>
    <Route path="/worker/quick-signup" element={<WorkerLoginPage />} />
    <Route path="/worker/login" element={<WorkerLoginPage />} />
    <Route
      path="/worker/bind-mobile"
      element={
        <ProtectedRoute allowedRoles={['worker']} loginPath="/worker/login" requireMobileVerified={false}>
          <WorkerBindMobilePage />
        </ProtectedRoute>
      }
    />
    <Route path="/worker/trust" element={<WorkerGoogleLandingRedirect />} />
    <Route path="/worker/discover" element={<Navigate to="/jobs" replace />} />
    {workerRoute('/worker/application-success/:applicationId', <ApplicationSuccess />)}
    <Route path="/worker/onboarding" element={<Navigate to="/worker/journey" replace />} />
    {workerRoute('/worker/journey', <WorkerVerificationPage />)}
    <Route path="/worker/verification" element={<Navigate to="/worker/journey" replace />} />
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
    {workerRoute('/worker/payments', <WorkerPayments />)}
    <Route path="/worker-profile/:id" element={<WorkerPublicProfile />} />
  </>
);
