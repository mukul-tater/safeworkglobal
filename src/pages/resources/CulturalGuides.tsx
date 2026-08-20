import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const guides = [
  {
    flag: "🇦🇪",
    country: "UAE",
    weekend: "Sat – Sun",
    workWeek: "Sun – Thu (48 hrs)",
    do: ["Dress modestly in public", "Greet with 'As-salaam alaikum'", "Use right hand for eating & exchanging items", "Respect prayer times"],
    dont: ["Eat or drink in public during Ramadan daylight", "Use offensive gestures or swear in public", "Photograph people without permission", "Show public affection"],
    tip: "Friday is the most important day for prayer — many shops open after 1pm.",
  },
  {
    flag: "🇸🇦",
    country: "Saudi Arabia",
    weekend: "Fri – Sat",
    workWeek: "Sun – Thu (48 hrs)",
    do: ["Wear long sleeves & trousers", "Stand for the national anthem", "Accept Arabic coffee (gahwa) when offered", "Carry your iqama at all times"],
    dont: ["Bring alcohol, pork or non-Islamic religious items", "Eat in public during Ramadan daylight", "Mix freely with the opposite gender at work", "Discuss politics or religion casually"],
    tip: "Most stores close 5 times a day for prayer (~20 mins each). Plan errands around them.",
  },
  {
    flag: "🇶🇦",
    country: "Qatar",
    weekend: "Fri – Sat",
    workWeek: "Sun – Thu (48 hrs)",
    do: ["Cover shoulders & knees in malls", "Use formal titles (Mr/Mrs)", "Tip 10% in restaurants", "Be punctual for meetings"],
    dont: ["Drink alcohol outside licensed venues", "Discuss the royal family", "Take photos of government buildings", "Use offensive language online"],
    tip: "Qatari Arabic uses 'Inshallah' (God willing) — it can mean 'yes', 'maybe' or 'no'. Confirm details in writing.",
  },
  {
    flag: "🇩🇪",
    country: "Germany",
    weekend: "Sat – Sun",
    workWeek: "Mon – Fri (40 hrs)",
    do: ["Be exactly on time — 5 mins early is normal", "Recycle correctly (yellow/blue/black bins)", "Address people as 'Herr' or 'Frau' + surname", "Carry cash — many shops still don't take cards"],
    dont: ["Be loud on Sundays — it's a quiet day by law", "Cross the road on a red light, even if empty", "Skip a contract's fine print", "Discuss salary with colleagues"],
    tip: "Sundays (Sonntag) are 'Ruhetag' — most shops are closed. Stock up on Saturday.",
  },
  {
    flag: "🇸🇬",
    country: "Singapore",
    weekend: "Sat – Sun",
    workWeek: "Mon – Fri/Sat (44 hrs)",
    do: ["Queue patiently — Singaporeans take it seriously", "Use 'lah' & 'lor' to fit in (after a while!)", "Carry your work permit card always", "Try hawker food — it's safe and cheap"],
    dont: ["Chew gum (illegal to import)", "Litter — fines start at S$300", "Eat or drink on public transport", "Jaywalk in the city centre"],
    tip: "MRT (metro) is the cheapest way around. Get an EZ-Link card on day one.",
  },
  {
    flag: "🇨🇦",
    country: "Canada",
    weekend: "Sat – Sun",
    workWeek: "Mon – Fri (37.5 – 40 hrs)",
    do: ["Say 'sorry' often — it's a national habit", "Tip 15–20% in restaurants", "Layer clothing in winter (-20°C is normal)", "Respect indigenous land acknowledgements"],
    dont: ["Confuse Canadian with American culture", "Skip workplace safety briefings (very strict)", "Drive without winter tyres in Quebec/Ontario (Dec–Mar)", "Discuss someone's salary"],
    tip: "Healthcare is free for permanent residents but you'll need private insurance for the first 3 months in some provinces.",
  },
];

export default function CulturalGuides() {
  return (
    <ResourcePageLayout
      title="Cultural Guides for Indian Workers Abroad | SafeWork Global"
      description="Practical cultural do's and don'ts for Indian workers moving to the UAE, Saudi Arabia, Qatar, Germany, Singapore and Canada."
      eyebrow="Cultural Guides"
      heading="Settle in faster, work smarter"
      intro="Quick cultural primers for the top 6 destinations — from work-week timings to local etiquette and rookie mistakes to avoid."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guides.map((g) => (
          <Card key={g.country} className="hover:shadow-lg hover:border-primary/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{g.flag}</span>
                  <div>
                    <h3 className="text-lg font-heading font-bold">{g.country}</h3>
                    <p className="text-xs text-muted-foreground">Weekend: {g.weekend}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{g.workWeek}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-success mb-1.5">✓ DO</p>
                  <ul className="text-xs space-y-1">
                    {g.do.map((d) => (
                      <li key={d} className="flex items-start gap-1.5 text-foreground/80">
                        <span className="h-1 w-1 rounded-full bg-success mt-1.5 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-destructive mb-1.5">✗ DON'T</p>
                  <ul className="text-xs space-y-1">
                    {g.dont.map((d) => (
                      <li key={d} className="flex items-start gap-1.5 text-foreground/80">
                        <span className="h-1 w-1 rounded-full bg-destructive mt-1.5 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic border-t pt-3">
                💡 {g.tip}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ResourcePageLayout>
  );
}
