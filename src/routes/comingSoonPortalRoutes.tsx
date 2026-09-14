import { Route } from 'react-router-dom';
import ComingSoon from '@/pages/ComingSoon';

/** Users-only launch: employer, partner, interviewer, and LSP portals. */
export const comingSoonPortalRoutes = (
  <>
    <Route path="/coming-soon/employers" element={<ComingSoon audience="employer" />} />
    <Route path="/coming-soon/partners" element={<ComingSoon audience="partner" />} />
    <Route path="/coming-soon/interviewers" element={<ComingSoon audience="interviewer" />} />
    <Route path="/employer/*" element={<ComingSoon audience="employer" />} />
    <Route path="/partner/*" element={<ComingSoon audience="partner" />} />
    <Route path="/emitra/*" element={<ComingSoon audience="partner" />} />
    <Route path="/interviewer/login" element={<ComingSoon audience="interviewer" />} />
    <Route path="/interviewer" element={<ComingSoon audience="interviewer" />} />
    <Route path="/lsp/*" element={<ComingSoon audience="partner" />} />
  </>
);
