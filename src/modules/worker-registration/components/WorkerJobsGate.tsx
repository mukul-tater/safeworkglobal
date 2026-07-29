import type { ReactNode } from 'react';

interface WorkerJobsGateProps {
  readonly children: ReactNode;
}

/**
 * Browse is always allowed. Apply/interest is gated on the job detail / apply actions.
 */
export default function WorkerJobsGate({ children }: WorkerJobsGateProps) {
  return <>{children}</>;
}
