import QuickWorkerSignup from "@/pages/worker/QuickWorkerSignup";

/**
 * Approved partners (except employers, who are a different role) add workers
 * through the same independent worker signup + /worker/journey flow.
 */
export default function PartnerAddWorkerPage() {
  return <QuickWorkerSignup assistedByPartner />;
}
