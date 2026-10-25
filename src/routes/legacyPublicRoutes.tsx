import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ComingSoon from '@/pages/ComingSoon';
import { USERS_ONLY_LAUNCH } from '@/lib/launchGate';

// Route-level code splitting: each public page downloads only when visited.
const Workers = lazy(() => import('@/pages/Workers'));
const WorkerPublicProfile = lazy(() => import('@/pages/worker/WorkerPublicProfile'));
const EmailVerificationPending = lazy(() => import('@/pages/EmailVerificationPending'));
const VisaGuide = lazy(() => import('@/pages/resources/VisaGuide'));
const SuccessStories = lazy(() => import('@/pages/resources/SuccessStories'));
const SupportCenter = lazy(() => import('@/pages/resources/SupportCenter'));
const CountryInsightsPage = lazy(() => import('@/pages/resources/CountryInsightsPage'));
const CountryInsightDetailPage = lazy(() => import('@/pages/resources/CountryInsightDetailPage'));
const LegalAdvice = lazy(() => import('@/pages/resources/LegalAdvice'));
const CulturalGuides = lazy(() => import('@/pages/resources/CulturalGuides'));
const FaqPage = lazy(() => import('@/pages/resources/FaqPage'));

/** Public routes restored from legacy App.tsx — hiring directory is gated during users-only launch. */
export const legacyPublicRoutes = (
  <>
    {USERS_ONLY_LAUNCH ? (
      <>
        <Route path="/workers" element={<ComingSoon audience="employer" />} />
        <Route path="/worker-profile/:id" element={<ComingSoon audience="employer" />} />
        <Route path="/workers/:id" element={<ComingSoon audience="employer" />} />
      </>
    ) : (
      <>
        <Route path="/workers" element={<Workers />} />
        <Route path="/worker-profile/:id" element={<WorkerPublicProfile />} />
        {/* Alias used by employer recommended-workers links */}
        <Route path="/workers/:id" element={<WorkerPublicProfile />} />
      </>
    )}
    <Route path="/verify-email" element={<EmailVerificationPending />} />
    <Route path="/visa-guide" element={<VisaGuide />} />
    <Route path="/success-stories" element={<SuccessStories />} />
    <Route path="/support" element={<SupportCenter />} />
    <Route path="/country-insights" element={<CountryInsightsPage />} />
    <Route path="/country-insights/:slug" element={<CountryInsightDetailPage />} />
    <Route path="/legal-advice" element={<LegalAdvice />} />
    <Route path="/cultural-guides" element={<CulturalGuides />} />
    <Route path="/faq" element={<FaqPage />} />
    <Route path="/legacy" element={<Navigate to="/" replace />} />
  </>
);
