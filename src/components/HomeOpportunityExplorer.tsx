import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Factory,
  Flame,
  HardHat,
  MapPin,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const destinations = [
  { flag: "🇦🇪", name: "UAE", focus: "Construction, hospitality, logistics", note: "Dubai & Abu Dhabi", search: "United Arab Emirates" },
  { flag: "🇴🇲", name: "Oman", focus: "Construction, oil & gas, infrastructure", note: "Active pilot market", search: "Oman" },
  { flag: "🇸🇦", name: "Saudi Arabia", focus: "NEOM, construction, hospitality", note: "Vision 2030 projects", search: "Saudi Arabia" },
  { flag: "🇯🇵", name: "Japan", focus: "Manufacturing, construction, care work", note: "Skilled worker pathways", search: "Japan" },
  { flag: "🇩🇪", name: "Germany", focus: "Engineering, construction, renewables", note: "Skilled migration routes", search: "Germany" },
  { flag: "🇦🇺", name: "Australia", focus: "Construction, mining, healthcare", note: "Skilled worker pathways", search: "Australia" },
];

const skills: Array<{
  icon: LucideIcon;
  name: string;
  description: string;
  countries: string;
}> = [
  { icon: HardHat, name: "Construction", description: "Infrastructure and commercial building", countries: "UAE, Saudi Arabia, Japan" },
  { icon: Zap, name: "Electrical", description: "Industrial electrical and renewable energy", countries: "Germany, UAE, Australia" },
  { icon: Flame, name: "Welding", description: "Pipeline, shipbuilding and heavy industry", countries: "Qatar, Kuwait, Oman" },
  { icon: Wrench, name: "Plumbing", description: "Residential and commercial systems", countries: "UK, Australia, New Zealand" },
  { icon: Factory, name: "Manufacturing", description: "Assembly, quality control and machinery", countries: "Japan, Poland, Malaysia" },
  { icon: Truck, name: "Logistics", description: "Delivery, freight and supply chain", countries: "UAE, Germany, Netherlands" },
];

export default function HomeOpportunityExplorer() {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-8 sm:mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-info/10 text-info mb-3">
            Explore opportunities
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-3">
            Find work by <span className="text-gradient">destination or skill</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse overseas markets and high-demand trades, then view matching verified jobs.
          </p>
        </div>

        <Tabs defaultValue="destinations">
          <TabsList className="mb-6 grid h-11 w-full max-w-sm grid-cols-2">
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="destinations" className="mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {destinations.map((destination) => (
                <button
                  key={destination.name}
                  type="button"
                  className="group rounded-xl border border-border/60 bg-card p-4 sm:p-5 text-left hover:border-primary/35 hover:bg-primary/[0.02] transition-colors"
                  onClick={() => navigate(`/jobs?location=${encodeURIComponent(destination.search)}`)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl" aria-hidden>{destination.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold font-heading text-foreground">{destination.name}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{destination.focus}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <MapPin className="h-3 w-3" /> {destination.note}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {skills.map((skill) => (
                <button
                  key={skill.name}
                  type="button"
                  className="group rounded-xl border border-border/60 bg-card p-4 sm:p-5 text-left hover:border-primary/35 hover:bg-primary/[0.02] transition-colors"
                  onClick={() => navigate(`/jobs?category=${encodeURIComponent(skill.name)}`)}
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <skill.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold font-heading text-foreground">{skill.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">In demand</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">Popular in: {skill.countries}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          size="lg"
          className="mt-8 rounded-xl gap-2"
          onClick={() => navigate("/jobs")}
        >
          Browse all verified jobs <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
