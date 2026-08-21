import QuickWorkerSignup from "@/pages/worker/QuickWorkerSignup";

/**
 * Partners add a worker with the same account form as independent signup.
 * The partner stays signed in. The worker is listed under My Workers and
 * signs in later to continue the GCC journey.
 */
export default function PartnerAddWorkerPage() {
  return <QuickWorkerSignup assistedByPartner />;
}
