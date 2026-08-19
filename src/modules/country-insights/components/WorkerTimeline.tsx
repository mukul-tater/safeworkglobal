import { ArrowDown } from "lucide-react";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";

export function WorkerTimeline({ country }: { country: CountryInsight }) {
  const data = country.workerLife;
  return (
    <SectionShell id="real-worker-life" heading={data.heading}>
      <ol className="max-w-xl space-y-0 mb-6">
        {data.steps.map((step, i) => (
          <li key={`${step.time}-${step.title.en}`} className="relative">
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs font-semibold text-primary">{step.time}</p>
              <Bi text={step.title} as="p" className="font-medium" />
            </div>
            {i < data.steps.length - 1 && (
              <div className="flex justify-center py-1.5 text-muted-foreground">
                <ArrowDown className="h-4 w-4" />
              </div>
            )}
          </li>
        ))}
      </ol>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}
