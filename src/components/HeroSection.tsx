import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  MapPin,
  ArrowRight,
  CheckCircle,
  Shield,
  Users,
  BadgeCheck,
  Ban,
} from "lucide-react";
import heroImage from "@/assets/hero-workers.jpg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DESTINATION_COUNTRIES, JOB_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading } = useAuth();
  const isEmployer = role === "employer";
  const authResolving = loading || (isAuthenticated && profileLoading);
  const [isSticky, setIsSticky] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.5;
      setIsSticky(window.scrollY > heroHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (isEmployer) {
      const params = new URLSearchParams();
      if (searchKeyword) params.set("skill", searchKeyword);
      if (searchLocation) params.set("country", searchLocation);
      navigate(`/employer/search-workers?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams();
    if (searchKeyword) params.set("keyword", searchKeyword);
    if (searchLocation) params.set("location", searchLocation);
    if (searchCategory) params.set("category", searchCategory);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleFindJobs = () => {
    if (!isAuthenticated) {
      navigate("/worker/quick-signup");
      return;
    }
    if (role === "employer") {
      toast.error("This is an employer account. Switch to a worker account to browse jobs.");
      return;
    }
    navigate("/jobs");
  };

  const handleHireWorkers = () => {
    if (!isAuthenticated) {
      navigate("/employer/quick-signup");
      return;
    }
    if (role === "worker") {
      toast.error("This is a worker account. Switch to an employer account to hire workers.");
      return;
    }
    navigate("/employer/dashboard");
  };

  const workerTrustBadges = [
    { icon: Ban, text: "No agent fees" },
    { icon: BadgeCheck, text: "Verified jobs only" },
    { icon: Shield, text: "Salary protected" },
  ];

  const employerTrustBadges = [
    { icon: Shield, text: "Verified workers" },
    { icon: CheckCircle, text: "Escrow-secured" },
    { icon: Users, text: "No upfront fees" },
  ];

  const trustBadges = isEmployer ? employerTrustBadges : workerTrustBadges;

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-background to-info/[0.04]">
        <img
          src={heroImage}
          alt="Workers finding jobs abroad"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.06] mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/75 to-background" />
      </div>

      <div className="hidden lg:block absolute top-24 right-[8%] w-72 h-72 bg-primary/8 rounded-full blur-3xl" />
      <div className="hidden lg:block absolute bottom-24 left-[5%] w-96 h-96 bg-info/8 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 py-14 sm:py-18 lg:py-24">
        <div className={`flex flex-col gap-10 min-h-[70vh] ${isEmployer ? "lg:flex-row lg:items-center lg:gap-16" : "max-w-3xl"}`}>
          <div className={`flex-1 text-center lg:text-left w-full ${isEmployer ? "max-w-2xl" : ""}`}>
            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5 border border-success/20">
              <Shield className="h-3.5 w-3.5" />
              <span>
                {isEmployer
                  ? "Compliance-first global hiring platform"
                  : "India's trusted portal for safe jobs abroad"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold font-heading text-foreground mb-4 leading-[1.12] tracking-tight">
              {isEmployer ? (
                <>
                  Hire Verified
                  <span className="block mt-1 text-gradient">Workers Worldwide</span>
                </>
              ) : (
                <>
                  Find Verified
                  <span className="block mt-1 text-gradient">Jobs Abroad</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-2 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {isEmployer
                ? "No upfront fees. Pre-verified workers. Escrow-secured payments — pay only after you hire."
                : "Verified employers. Salary protected. No agent fees — only standard government visa & emigration charges apply."}
            </p>

            {!isEmployer && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                1000+ verified jobs · 50+ countries
              </p>
            )}

            {!authResolving && (
              <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-center lg:justify-start">
                {isEmployer ? (
                  <Button
                    size="lg"
                    className="h-12 px-6 gap-2 text-base font-semibold rounded-xl shadow-primary"
                    onClick={handleHireWorkers}
                  >
                    Browse Workers <ArrowRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="h-12 px-6 gap-2 text-base font-semibold rounded-xl shadow-primary"
                      onClick={handleFindJobs}
                    >
                      Browse Jobs <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-6 rounded-xl"
                      onClick={() => navigate("/worker/quick-signup")}
                    >
                      Sign Up Free
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="glass-strong p-4 sm:p-5 rounded-2xl max-w-2xl mx-auto lg:mx-0">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-left">
                {isEmployer ? "Search verified workers" : "Search verified jobs abroad"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={isEmployer ? "Skill or worker type" : "Job title or skill"}
                    className="pl-10 h-11 sm:h-12 bg-background/80 border-border/50 rounded-xl"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                  <Select value={searchLocation} onValueChange={setSearchLocation}>
                    <SelectTrigger className="pl-10 h-11 sm:h-12 bg-background/80 border-border/50 rounded-xl">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {DESTINATION_COUNTRIES.filter((c) => c !== "All Countries")
                        .slice(0, 25)
                        .map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isEmployer && (
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger className="h-11 sm:h-12 bg-background/80 border-border/50 rounded-xl sm:col-span-2 lg:col-span-1">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {JOB_CATEGORIES.filter((c) => c !== "All Categories").map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                size="lg"
                className="w-full h-11 sm:h-12 gap-2 font-semibold rounded-xl"
                onClick={handleSearch}
              >
                {isEmployer ? "Search Workers" : "Search Jobs"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-6">
              {trustBadges.map((badge) => (
                <div key={badge.text} className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <div className="p-1 rounded-lg bg-success/10">
                    <badge.icon className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {isEmployer && (
            <div className="flex-1 w-full lg:max-w-md hidden md:block">
              <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-lg">
                <h3 className="font-bold font-heading text-xl mb-4">Why employers choose us</h3>
                <ul className="space-y-4">
                  {[
                    "Pre-verified, skilled worker profiles",
                    "Escrow-secured payments — no upfront fees",
                    "Digital contracts & compliance workflows",
                    "Bulk hiring for GCC, Japan & EU markets",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSticky && !isEmployer && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 glass-strong border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10 h-11 bg-background/80 rounded-xl"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button size="sm" className="h-11 px-4 rounded-xl" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
