import { Shield, FileCheck, Building2, Award } from "lucide-react";

const RA_ENTITIES = [
  {
    name: "SafeWork Global",
    role: "Platform & Worker Verification",
    description:
      "End-to-end digital platform for worker onboarding, GCC journey management, skill verification, and employer matching.",
    icon: Shield,
  },
  {
    name: "E-Mitra Network",
    role: "Field Registration & Assisted Onboarding",
    description:
      "Grassroots network of certified e-Mitra centres across Rajasthan for in-person worker registration, document verification, and deployment support.",
    icon: Building2,
  },
  {
    name: "Vesta",
    role: "Licensed Recruiting Agent (RA)",
    description:
      "Ministry of External Affairs licensed recruiting agent responsible for regulatory compliance, emigration clearance, and worker deployment to GCC countries.",
    icon: Award,
  },
];

export default function HomeRADetails() {
  return (
    <section className="py-14 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <FileCheck className="h-3.5 w-3.5" />
            Licensed & Regulated
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight mb-3">
            Our Recruitment & Deployment Partners
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Every worker placement goes through a licensed, government-regulated
            chain — from digital verification to MEA-approved deployment.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {RA_ENTITIES.map(({ name, role, description, icon: Icon }) => (
            <div
              key={name}
              className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{name}</h3>
                <p className="text-xs text-primary font-medium mt-0.5">
                  {role}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
