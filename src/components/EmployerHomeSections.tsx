import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  PlusCircle,
  Users,
  ShieldCheck,
  ArrowRight,
  FileSignature,
  Briefcase,
  TrendingDown,
  Clock,
  Star,
  CheckCircle2,
} from "lucide-react";

/**
 * Employer-focused home page sections.
 * Replaces the worker-centric FeaturedJobs / JobCategories / InteractiveJobMap
 * blocks when the logged-in user is an employer.
 */
export default function EmployerHomeSections() {
  const quickActions = [
    {
      to: "/employer/search-workers",
      icon: Search,
      title: "Search verified workers",
      desc: "Browse pre-vetted candidates by skill, country, and availability.",
      cta: "Browse workers",
    },
    {
      to: "/employer/post-job",
      icon: PlusCircle,
      title: "Post a job",
      desc: "Reach thousands of verified workers across 40+ countries.",
      cta: "Post a job",
    },
    {
      to: "/employer/shortlist",
      icon: Star,
      title: "Your shortlist",
      desc: "Review candidates you've saved and move them to interview.",
      cta: "View shortlist",
    },
    {
      to: "/employer/applications",
      icon: Users,
      title: "Manage applications",
      desc: "Track applicants through every hiring stage.",
      cta: "Open applications",
    },
    {
      to: "/employer/contracts",
      icon: FileSignature,
      title: "Contracts & offers",
      desc: "Send offers and manage signed contracts in one place.",
      cta: "Manage contracts",
    },
  ];

  const valueProps = [
    {
      icon: TrendingDown,
      title: "Lower cost than traditional agents",
      desc: "No large upfront recruiter commission — you pay only once you hire.",
    },
    {
      icon: ShieldCheck,
      title: "Verified workers only",
      desc: "Every candidate is ID, document, and skill verified.",
    },
    {
      icon: Clock,
      title: "Trade-tested candidates",
      desc: "Skill and trade tests completed before a profile reaches you.",
    },
  ];

  return (
    <>
      {/* Quick actions for the logged-in employer */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Briefcase className="h-3.5 w-3.5" />
              Employer Portal
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">
              Everything you need to hire
            </h2>
            <p className="text-muted-foreground">
              Jump straight into the tools you use most — from sourcing to signing contracts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.to}
                  className="group hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold font-heading text-base mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {action.desc}
                        </p>
                        <Link
                          to={action.to}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          {action.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why employers choose us */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">
              Why employers choose SafeWork Global
            </h2>
            <p className="text-muted-foreground">
              Pilot-friendly, fully verified, and built around your hiring workflow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {valueProps.map((vp) => {
              const Icon = vp.icon;
              return (
                <Card key={vp.title} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="p-2.5 w-fit rounded-xl bg-success/10 text-success mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold font-heading text-base mb-1.5">
                      {vp.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {vp.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/employer/search-workers">
                <Search className="h-4 w-4" /> Browse verified workers
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/employer/post-job">
                <PlusCircle className="h-4 w-4" /> Post a job
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
