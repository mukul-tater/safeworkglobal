import { BadgeCheck, Handshake, Landmark } from "lucide-react";

const steps = [
  {
    icon: BadgeCheck,
    title: "We verify the worker",
    description:
      "Identity, documents, skill test, trade test, and medical checks — so an employer only ever sees genuine, job-ready candidates.",
  },
  {
    icon: Handshake,
    title: "The employer selects directly",
    description:
      "Employers review verified profiles and interview the workers they want. The job terms and salary are agreed between the employer and the worker, in writing.",
  },
  {
    icon: Landmark,
    title: "Licensed partners deploy",
    description:
      "Visa, emigration clearance, and travel are carried out by licensed recruitment partners, in line with Indian emigration rules.",
  },
];

export default function HomeHowWeWork() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/20 border-y border-border/60">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-3">
            How we work
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-3">
            Verification by us. <span className="text-gradient">Deployment by licensed partners.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            SafeWork Global is the verification layer between Indian workers and overseas
            employers — we make sure both sides are genuine before anyone commits.
          </p>
        </div>

        <ol className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-3xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          SafeWork Global is a verification and matching platform. We do not recruit on our
          own licence and we do not hold or pay wages — salary is paid by your employer under
          the contract you sign, and emigration is carried out by our licensed partners.
        </p>
      </div>
    </section>
  );
}
