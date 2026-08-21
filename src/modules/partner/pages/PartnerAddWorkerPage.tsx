import QuickWorkerSignup from "@/pages/worker/QuickWorkerSignup";

/**
 * Partners add a worker with the same account form as independent signup
 * (name, email, mobile OTP, password), then return to My Workers.
 */
export default function PartnerAddWorkerPage() {
  return <QuickWorkerSignup assistedByPartner />;
}
