import { Navigate } from 'react-router-dom';

/** Old GCC Queue — actions now live on the Worker queue (journey ops) in stage order. */
export default function AdminVerificationQueue() {
  return <Navigate to="/admin/journey-ops" replace />;
}
