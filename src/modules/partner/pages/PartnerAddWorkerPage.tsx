import QuickWorkerSignup from "@/pages/worker/QuickWorkerSignup";

/**
 * Partners add a worker with the same account form as independent signup,
 * then continue the full GCC journey as that worker. The worker is listed
 * under My Workers as created by the partner.
 */
export default function PartnerAddWorkerPage() {
  return <QuickWorkerSignup assistedByPartner />;
}
