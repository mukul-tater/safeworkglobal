import { Navigate } from 'react-router-dom';

/** Compliance tools live under ECR Management — keep this route as a redirect. */
export default function ComplianceCheck() {
  return <Navigate to="/admin/ecr-management" replace />;
}
