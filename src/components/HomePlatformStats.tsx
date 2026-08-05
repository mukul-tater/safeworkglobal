import { BadgeCheck, Ban, FileCheck2, ShieldCheck, Users, WalletCards } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WORKER_PROOF = [
  { icon: Ban, value: "₹0", label: "Agent fees" },
  { icon: BadgeCheck, value: "Verified", label: "Jobs & employers" },
  { icon: ShieldCheck, value: "Protected", label: "Salary payments" },
  { icon: FileCheck2, value: "Supported", label: "Visa & compliance" },
];

const EMPLOYER_PROOF = [
  { icon: Users, value: "Verified", label: "Worker profiles" },
  { icon: WalletCards, value: "₹0", label: "Upfront fees" },
  { icon: ShieldCheck, value: "Escrow", label: "Secure payments" },
  { icon: FileCheck2, value: "Built-in", label: "Hiring compliance" },
];

export default function HomePlatformStats() {
  const { role } = useAuth();
  const proof = role === "employer" ? EMPLOYER_PROOF : WORKER_PROOF;

  return (
    <section className="border-b border-border/60 bg-background">
      <div className="container mx-auto px-4 sm:px-6 pt-12 pb-8 sm:pt-14 sm:pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-7 max-w-5xl mx-auto">
          {proof.map((item) => (
            <div key={item.label} className="flex items-center gap-3 justify-start">
              <div className="shrink-0 p-2.5 rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold font-heading text-foreground">
                  {item.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
