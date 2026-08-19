import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";

export function SafetyChecklist({ country }: { country: CountryInsight }) {
  const data = country.safetyChecklist;
  const storageKey = `swg-country-checklist-${country.slug}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const toggle = (id: string, value: boolean) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: value };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const total = data.items.length;
  const done = useMemo(
    () => data.items.filter((item) => checked[item.id]).length,
    [checked, data.items],
  );

  return (
    <SectionShell id="safety-checklist" heading={data.heading}>
      <p className="text-sm font-semibold mb-3">
        {done}/{total} {done === total ? "— Ready to Review" : "checked"}
      </p>
      <Progress value={(done / total) * 100} className="h-2 mb-5" />
      <ul className="space-y-2 mb-6">
        {data.items.map((item) => (
          <li key={item.id}>
            <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 min-h-12 cursor-pointer">
              <Checkbox
                checked={!!checked[item.id]}
                onCheckedChange={(v) => toggle(item.id, v === true)}
                className="mt-0.5"
              />
              <Bi text={item.label} className="text-sm font-medium" />
            </label>
          </li>
        ))}
      </ul>
      <DisclaimerBox text={data.note} />
    </SectionShell>
  );
}
