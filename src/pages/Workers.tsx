import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Briefcase,
  ShieldCheck,
  Plane,
  Sparkles,
  ArrowRight,
  Users,
} from "lucide-react";

interface PublicWorker {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  nationality: string | null;
  current_location: string | null;
  primary_work_type: string | null;
  years_of_experience: number | null;
  skill_level: string | null;
  has_passport: boolean;
  has_visa: boolean;
  availability: string | null;
  top_skills: string[];
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "W";

export default function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<PublicWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("list_public_workers", {
        p_limit: 36,
      });
      if (!error && data) setWorkers(data as PublicWorker[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background has-mobile-nav">
      <SEOHead
        title="Browse Verified Workers | SafeWork Global"
        description="Preview verified workers ready to relocate. Skilled tradespeople with passports, visas and global experience — hire in days, not months."
      />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Hire Verified Workers
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-foreground mb-3">
              Skilled workers ready to{" "}
              <span className="text-gradient">deploy globally</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Browse a live preview of verified workers — passport-ready, visa-aware
              and pre-screened. Sign up as an employer to view full profiles and
              shortlist instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="h-12 px-6 gap-2 rounded-xl"
                onClick={() => navigate("/employer/quick-signup")}
              >
                <Users className="h-5 w-5" />
                Start Hiring — No Upfront Fees
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 gap-2 rounded-xl"
                onClick={() => navigate("/contact")}
              >
                Talk to our team <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Worker grid */}
      <section className="container mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <Card className="p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No workers to show yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              New verified workers join every week. Check back soon.
            </p>
            <Link to="/employer/quick-signup">
              <Button>Get notified — sign up free</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold">
                  {workers.length} worker{workers.length === 1 ? "" : "s"} available
                </h2>
                <p className="text-sm text-muted-foreground">
                  Anonymized preview. Create a free employer account to see full
                  details and contact workers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {workers.map((w) => (
                <Card
                  key={w.user_id}
                  className="group relative overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className="h-1 bg-gradient-to-r from-primary via-secondary to-info opacity-60 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12 ring-2 ring-border">
                        <AvatarImage src={w.avatar_url ?? undefined} alt={w.display_name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {initials(w.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {w.display_name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {w.primary_work_type ?? "Skilled worker"}
                          {w.skill_level ? ` • ${w.skill_level}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                      {(w.current_location || w.nationality) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {[w.current_location, w.nationality]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        </div>
                      )}
                      {w.years_of_experience != null && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {Number(w.years_of_experience).toFixed(0)} yrs experience
                          </span>
                        </div>
                      )}
                    </div>

                    {w.top_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {w.top_skills.slice(0, 4).map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="text-xs bg-muted/50"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {w.has_passport && (
                        <Badge className="bg-success/10 text-success border-success/20 text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Passport
                        </Badge>
                      )}
                      {w.has_visa && (
                        <Badge className="bg-info/10 text-info border-info/20 text-xs">
                          <Plane className="h-3 w-3 mr-1" /> Visa-ready
                        </Badge>
                      )}
                      {w.availability && (
                        <Badge variant="secondary" className="text-xs">
                          {w.availability}
                        </Badge>
                      )}
                    </div>

                    <Button
                      className="w-full rounded-xl"
                      variant="outline"
                      onClick={() => navigate("/employer/quick-signup")}
                    >
                      Unlock full profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Card className="inline-block p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <h3 className="text-lg font-heading font-bold mb-1">
                  Ready to hire? Start free — no upfront cost
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a free employer account to message workers, run background
                  checks and post jobs.
                </p>
                <Button
                  size="lg"
                  className="rounded-xl"
                  onClick={() => navigate("/employer/quick-signup")}
                >
                  Get started free
                </Button>
              </Card>
            </div>
          </>
        )}
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
