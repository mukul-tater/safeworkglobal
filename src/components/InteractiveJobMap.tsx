import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Zap, CheckCircle, Briefcase, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InteractiveJobMap = () => {
  const navigate = useNavigate();

  const regions = [
    {
      name: "Eastern Europe",
      countries: ["Poland", "Czech Republic", "Romania"],
      jobs: "62+",
      avgSalary: "₹1.75-2.5L per month",
      easyHiring: true,
      hiringTime: "2-4 weeks",
      visaComplexity: "Simple",
      highlights: ["Fast work permits", "Minimal paperwork", "EU access"],
      topJobs: ["Manufacturing", "Logistics", "Construction"],
      gradient: "from-emerald-500 to-teal-600",
      searchCountry: "Poland"
    },
    {
      name: "Middle East",
      countries: ["UAE", "Saudi Arabia", "Qatar"],
      jobs: "72+",
      avgSalary: "₹2.2-3.5L per month",
      easyHiring: true,
      hiringTime: "1-3 weeks",
      visaComplexity: "Simple",
      highlights: ["Employer-sponsored visa", "Tax-free income", "Fast processing"],
      topJobs: ["Construction", "Hospitality", "Transportation"],
      gradient: "from-amber-500 to-orange-600",
      searchCountry: "United Arab Emirates"
    },
    {
      name: "Western Europe",
      countries: ["Germany", "Netherlands", "Belgium"],
      jobs: "66+",
      avgSalary: "₹2.75-3.8L per month",
      easyHiring: false,
      hiringTime: "2-6 months",
      visaComplexity: "Moderate",
      highlights: ["High salaries", "Great benefits", "Quality of life"],
      topJobs: ["Renewable Energy", "Engineering", "Healthcare"],
      gradient: "from-blue-500 to-indigo-600",
      searchCountry: "Germany"
    },
    {
      name: "East Asia",
      countries: ["Japan", "South Korea", "Singapore"],
      jobs: "88+",
      avgSalary: "₹2.5-3.5L per month",
      easyHiring: false,
      hiringTime: "3-6 months",
      visaComplexity: "Complex",
      highlights: ["Career growth", "Cultural experience", "Modern facilities"],
      topJobs: ["Manufacturing", "Construction", "Technology"],
      gradient: "from-purple-500 to-pink-600",
      searchCountry: "Japan"
    },
    {
      name: "Scandinavia",
      countries: ["Norway", "Sweden", "Denmark"],
      jobs: "65+",
      avgSalary: "₹3.15-4.3L per month",
      easyHiring: false,
      hiringTime: "2-6 months",
      visaComplexity: "Moderate",
      highlights: ["Highest salaries", "Work-life balance", "Social benefits"],
      topJobs: ["Oil & Gas", "Renewable Energy", "Maritime"],
      gradient: "from-cyan-500 to-blue-600",
      searchCountry: "Norway"
    },
    {
      name: "Southeast Asia",
      countries: ["Malaysia", "Thailand", "Vietnam"],
      jobs: "65+",
      avgSalary: "₹1.4-2.2L per month",
      easyHiring: true,
      hiringTime: "2-4 weeks",
      visaComplexity: "Simple",
      highlights: ["Low cost of living", "Quick hiring", "Growing markets"],
      topJobs: ["Manufacturing", "Hospitality", "Agriculture"],
      gradient: "from-teal-500 to-green-600",
      searchCountry: "Malaysia"
    }
  ];

  const handleExploreRegion = (searchCountry: string) => {
    navigate(`/jobs?location=${encodeURIComponent(searchCountry)}`);
  };

  return (
    <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-info/10 text-info mb-4">
            <MapPin className="h-3.5 w-3.5" />
            Global Opportunities
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4 tracking-tight">
            Explore Jobs by <span className="text-gradient">Region</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-5">
            Discover opportunities with salary insights and hiring timelines
          </p>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            <Badge className="bg-success text-white border-0 px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-md text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Fast Hiring: 1-4 weeks
            </Badge>
            <Badge className="bg-warning text-white border-0 px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-md text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Moderate: 2-6 months
            </Badge>
          </div>
        </div>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {regions.map((region, index) => (
            <div
              key={index}
              className="group"
            >
              <Card
                className={`h-full relative overflow-hidden bg-card border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  region.easyHiring ? 'border-success/30 hover:border-success/50' : 'border-border/50 hover:border-primary/30'
                }`}
                onClick={() => handleExploreRegion(region.searchCountry)}
              >
                <div className={`h-1 bg-gradient-to-r ${region.gradient}`} />

                <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold font-heading text-foreground mb-1 group-hover:text-primary transition-colors">
                        {region.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {region.countries.join(" • ")}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${region.gradient} shrink-0`}>
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {region.easyHiring && (
                    <div className="mb-3">
                      <Badge className="bg-success text-white border-0 shadow-sm text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Fast Hiring
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5 text-primary mb-0.5">
                        <Briefcase className="h-3 w-3" />
                        <span className="text-[10px] sm:text-xs font-medium">Jobs</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-foreground">{region.jobs}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5 text-success mb-0.5">
                        <span className="text-[10px] sm:text-xs font-medium">₹ Salary</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-foreground">{region.avgSalary}</div>
                    </div>
                  </div>

                  {/* Hiring info */}
                  <div className="space-y-1.5 mb-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hiring Time</span>
                      <span className={`font-semibold ${region.easyHiring ? 'text-success' : 'text-warning'}`}>
                        {region.hiringTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Visa Process</span>
                      <span className={`font-semibold ${
                        region.visaComplexity === 'Simple' ? 'text-success' :
                        region.visaComplexity === 'Moderate' ? 'text-warning' : 'text-destructive'
                      }`}>
                        {region.visaComplexity}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-4">
                    <div className="space-y-1">
                      {region.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-success shrink-0" />
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top jobs */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-4">
                    {region.topJobs.map((job, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs">
                        {job}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex-1" />

                  <Button
                    className="w-full rounded-xl group/btn flex items-center justify-center gap-2 mt-auto text-sm"
                    onClick={(e) => { e.stopPropagation(); handleExploreRegion(region.searchCountry); }}
                  >
                    <span>Explore {region.name}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InteractiveJobMap;
