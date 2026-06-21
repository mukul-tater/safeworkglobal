import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote, MapPin, Briefcase, IndianRupee, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const stories = [
  {
    name: "Rahul S.",
    role: "Welder",
    from: "Bhilwara, Rajasthan",
    to: "Dubai, UAE",
    salaryBefore: "₹18,000/mo",
    salaryAfter: "₹95,000/mo",
    quote: "I doubled my income in 6 months. SafeWorkGlobal verified my employer before I signed anything — that gave my family peace of mind.",
  },
  {
    name: "Anita P.",
    role: "Nurse",
    from: "Kochi, Kerala",
    to: "Riyadh, Saudi Arabia",
    salaryBefore: "₹28,000/mo",
    salaryAfter: "₹1,40,000/mo",
    quote: "The platform handled my visa, GAMCA medical and contract review. I landed in Riyadh fully prepared and started saving from month one.",
  },
  {
    name: "Vinod K.",
    role: "Construction Foreman",
    from: "Lucknow, UP",
    to: "Doha, Qatar",
    salaryBefore: "₹22,000/mo",
    salaryAfter: "₹85,000/mo",
    quote: "Zero agent fees. The 1% platform charge is a fraction of what local middlemen demanded. My employer paid everything else.",
  },
  {
    name: "Salim A.",
    role: "Electrician",
    from: "Hyderabad, Telangana",
    to: "Singapore",
    salaryBefore: "₹25,000/mo",
    salaryAfter: "₹1,10,000/mo",
    quote: "I uploaded my certificates once. Three offers within two weeks. The contract was clear — no hidden deductions, exactly as promised.",
  },
  {
    name: "Manjeet K.",
    role: "Heavy Vehicle Driver",
    from: "Jalandhar, Punjab",
    to: "Frankfurt, Germany",
    salaryBefore: "₹30,000/mo",
    salaryAfter: "₹2,20,000/mo",
    quote: "Never thought a driver from Punjab could work in Germany. The language training and skill recognition support made it possible.",
  },
  {
    name: "Priya M.",
    role: "Caregiver",
    from: "Pune, Maharashtra",
    to: "Toronto, Canada",
    salaryBefore: "₹20,000/mo",
    salaryAfter: "₹1,80,000/mo",
    quote: "I'm now on my way to Permanent Residency. SafeWorkGlobal connected me with a family I trust and a clear PR pathway.",
  },
];

export default function SuccessStories() {
  return (
    <ResourcePageLayout
      title="Success Stories — Real Workers, Real Earnings | SafeWorkGlobal"
      description="Read how Indian workers transformed their families' lives by working overseas through SafeWorkGlobal."
      eyebrow="Success Stories"
      heading="From small towns to global careers"
      intro="Six stories of workers who used SafeWorkGlobal to land verified overseas jobs — with no agent fees and full visa support."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stories.map((s) => (
          <Card key={s.name} className="hover:shadow-lg hover:border-primary/40 transition-all">
            <CardContent className="p-6">
              <Quote className="h-6 w-6 text-primary/40 mb-3" />
              <p className="text-sm text-foreground italic mb-5 leading-relaxed">"{s.quote}"</p>

              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-11 w-11 ring-2 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {s.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {s.role}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t pt-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{s.from} → <span className="font-semibold text-foreground">{s.to}</span></span>
                </div>
                <div className="flex items-center justify-between bg-success/5 rounded-lg p-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Earnings</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      <span className="line-through text-muted-foreground text-xs">{s.salaryBefore.replace('₹','').replace('/mo','')}</span>
                      {' → '}
                      <span className="text-success">{s.salaryAfter}</span>
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 text-xs">5x</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-10 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 text-center">
        <h3 className="text-lg font-heading font-bold mb-1">Ready to write your own story?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your free profile and get matched with verified overseas employers within 48 hours.
        </p>
        <Link to="/worker/quick-signup">
          <Button size="lg" className="rounded-xl">
            Start your journey <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </Card>
    </ResourcePageLayout>
  );
}
