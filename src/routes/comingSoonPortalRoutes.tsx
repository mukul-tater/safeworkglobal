import { Route } from 'react-router-dom';
import ComingSoon from '@/pages/ComingSoon';

/** Employer, interviewer, and LSP stay behind Coming Soon. E-Mitra partner routes are live. */
export const comingSoonPortalRoutes = (
  <>
    <Route path="/coming-soon/employers" element={<ComingSoon audience="employer" />} />
    <Route path="/coming-soon/partners" element={<ComingSoon audience="partner" />} />
    <Route path="/coming-soon/interviewers" element={<ComingSoon audience="interviewer" />} />
    <Route path="/employer/*" element={<ComingSoon audience="employer" />} />
    <Route path="/interviewer/login" element={<ComingSoon audience="interviewer" />} />
    <Route path="/interviewer" element={<ComingSoon audience="interviewer" />} />
    <Route path="/lsp/*" element={<ComingSoon audience="partner" />} />
  </>
);
