import { Navigate, Route } from 'react-router-dom';
import Workers from '@/pages/Workers';
import WorkerPublicProfile from '@/pages/worker/WorkerPublicProfile';
import EmailVerificationPending from '@/pages/EmailVerificationPending';
import VisaGuide from '@/pages/resources/VisaGuide';
import SuccessStories from '@/pages/resources/SuccessStories';
import SupportCenter from '@/pages/resources/SupportCenter';
import LanguageResources from '@/pages/resources/LanguageResources';
import CountryInsightsPage from '@/pages/resources/CountryInsightsPage';
import SalaryGuide from '@/pages/resources/SalaryGuide';
import LegalAdvice from '@/pages/resources/LegalAdvice';
import CulturalGuides from '@/pages/resources/CulturalGuides';

/** Public routes restored from legacy App.tsx — required for employer hiring flow. */
export const legacyPublicRoutes = (
  <>
    <Route path="/workers" element={<Workers />} />
    <Route path="/worker-profile/:id" element={<WorkerPublicProfile />} />
    {/* Alias used by employer recommended-workers links */}
    <Route path="/workers/:id" element={<WorkerPublicProfile />} />
    <Route path="/verify-email" element={<EmailVerificationPending />} />
    <Route path="/visa-guide" element={<VisaGuide />} />
    <Route path="/success-stories" element={<SuccessStories />} />
    <Route path="/support" element={<SupportCenter />} />
    <Route path="/language-resources" element={<LanguageResources />} />
    <Route path="/country-insights" element={<CountryInsightsPage />} />
    <Route path="/salary-guide" element={<SalaryGuide />} />
    <Route path="/legal-advice" element={<LegalAdvice />} />
    <Route path="/cultural-guides" element={<CulturalGuides />} />
    <Route path="/legacy" element={<Navigate to="/" replace />} />
  </>
);
