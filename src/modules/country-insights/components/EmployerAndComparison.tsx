import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CountryInsight } from "../types";
import { Bi, BiInline } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";
import { COUNTRY_INSIGHTS } from "../data/countries";

export function EmployerReality({ country }: { country: CountryInsight }) {
  const data = country.employerSpecific;
  return (
    <SectionShell id="employer-reality" heading={data.heading}>
      {data.cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <Bi text={data.empty} className="text-sm max-w-lg mx-auto" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.cards.map((card) => (
            <Card key={`${card.employerName}-${card.job}`}>
              <CardContent className="p-5 text-sm space-y-1">
                <p className="font-heading font-bold text-base">{card.employerName}</p>
                <p>Location: {card.location}</p>
                <p>Job: {card.job}</p>
                <p>Accommodation: {card.accommodation}</p>
                <p>Room occupancy: {card.roomOccupancy}</p>
                <p>Transport: {card.transport}</p>
                <p>Food: {card.food}</p>
                <p>Medical: {card.medical}</p>
                <p className="text-muted-foreground">Last verified: {card.lastVerified}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function CountryComparison({ country }: { country: CountryInsight }) {
  const data = country.comparison;
  const cols = COUNTRY_INSIGHTS;
  return (
    <SectionShell id="country-comparison" heading={data.heading}>
      <div className="overflow-x-auto rounded-xl border border-border mb-4">
        <table className="w-full text-xs sm:text-sm min-w-[44rem]">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-semibold"> </th>
              {cols.map((c) => (
                <th key={c.id} className="text-left p-3 font-semibold whitespace-nowrap">
                  {c.flag} {c.name.en}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="p-3 font-medium whitespace-nowrap">
                  <BiInline text={row.label} />
                </td>
                {cols.map((c) => {
                  const cell = row.cells[c.slug];
                  return (
                    <td key={c.id} className="p-3 text-muted-foreground">
                      {cell ? <BiInline text={cell} /> : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}
