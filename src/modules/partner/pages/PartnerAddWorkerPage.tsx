import QuickWorkerSignup from "@/pages/worker/QuickWorkerSignup";

/**
 * Partners add a worker, stay signed in, and fill the GCC journey as a kiosk
 * service. The worker can also sign in later with the mobile and password.
 */
export default function PartnerAddWorkerPage() {
  return <QuickWorkerSignup assistedByPartner />;
}
