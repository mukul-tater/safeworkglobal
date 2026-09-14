import { Navigate, Route } from 'react-router-dom';
import Workers from '@/pages/Workers';
import WorkerPublicProfile from '@/pages/worker/WorkerPublicProfile';
import EmailVerificationPending from '@/pages/EmailVerificationPending';
import VisaGuide from '@/pages/resources/VisaGuide';
import SuccessStories from '@/pages/resources/SuccessStories';
import SupportCenter from '@/pages/resources/SupportCenter';
import CountryInsightsPage from '@/pages/resources/CountryInsightsPage';
import CountryInsightDetailPage from '@/pages/resources/CountryInsightDetailPage';
import LegalAdvice from '@/pages/resources/LegalAdvice';
import CulturalGuides from '@/pages/resources/CulturalGuides';
import FaqPage from '@/pages/resources/FaqPage';
import ComingSoon from '@/pages/ComingSoon';
import { USERS_ONLY_LAUNCH } from '@/lib/launchGate';

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
