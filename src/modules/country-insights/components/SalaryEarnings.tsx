import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CountryInsight } from "../types";
import { Bi, BiInline } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";
import { UNAVAILABLE } from "../types";

export function SalaryEarnings({ country }: { country: CountryInsight }) {
  const data = country.salary;
  return (
    <SectionShell id="salary-earnings" heading={data.heading}>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {data.packages.map((pkg) => (
          <Card key={pkg.trade.en}>
            <CardContent className="p-5 space-y-2 text-sm">
              <Bi text={pkg.trade} as="h3" className="text-lg font-heading font-bold mb-3" />
              <Row label="Basic Salary" value={pkg.basicSalary ?? UNAVAILABLE.en} />
              <Row label="Overtime" value={<BiInline text={pkg.overtime} />} />
              <Row label="Accommodation" value={<BiInline text={pkg.accommodation} />} />
              <Row label="Food" value={<BiInline text={pkg.food} />} />
              <Row label="Transport" value={<BiInline text={pkg.transport} />} />
              <Row label="Medical Insurance" value={<BiInline text={pkg.medicalInsurance} />} />
              <Row label="Annual Leave" value={<BiInline text={pkg.annualLeave} />} />
            </CardContent>
          </Card>
        ))}
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
