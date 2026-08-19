import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";
import { useState } from "react";

export function WorkingEnvironment({ country }: { country: CountryInsight }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { workingEnvironment: data } = country;

  return (
    <SectionShell id="working-environment" heading={data.heading} subheading={data.subheading}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.sectors.map((sector) => (
          <Card key={sector.id} className="overflow-hidden">
            <div className="h-28 bg-gradient-to-br from-primary/15 to-muted flex items-center justify-center">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardContent className="p-4">
              <Bi text={sector.name} as="h3" className="font-heading font-bold mb-2" />
              <Bi text={sector.summary} className="text-sm text-muted-foreground mb-3" />
              {openId === sector.id && (
                <Bi text={sector.environment} className="text-sm mb-3" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0 h-auto text-primary"
                onClick={() => setOpenId(openId === sector.id ? null : sector.id)}
              >
                {openId === sector.id ? "Hide" : "Learn More"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}
