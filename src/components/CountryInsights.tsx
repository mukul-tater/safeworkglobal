import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Users, MapPin, Clock, AlertCircle, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CountryInsights = () => {
  const navigate = useNavigate();

  const countries = [
    {
      name: "Japan", flag: "🇯🇵", status: "High Demand",
      statusColor: "bg-destructive text-destructive-foreground",
      reason: "Aging workforce & infrastructure renewal",
      avgSalary: "₹45,000 - ₹85,000 per month", visaProcess: "Work visa (3-6 months)",
      languages: ["Japanese", "English"],
      topJobs: ["Construction", "Manufacturing", "Elderly Care"]
    },
    {
      name: "Germany", flag: "🇩🇪", status: "Very High",
      statusColor: "bg-destructive text-destructive-foreground",
      reason: "Green energy transition & skilled labor shortage",
      avgSalary: "₹50,000 - ₹95,000 per month", visaProcess: "EU Blue Card (2-4 months)",
      languages: ["German", "English"],
      topJobs: ["Renewable Energy", "Engineering", "Construction"]
    },
    {
      name: "UAE", flag: "🇦🇪", status: "High Demand",
      statusColor: "bg-warning text-warning-foreground",
      reason: "Expo legacy projects & Vision 2071 development",
      avgSalary: "₹30,000 - ₹70,000 per month", visaProcess: "Employer sponsored (1-3 months)",
      languages: ["Arabic", "English"],
      topJobs: ["Construction", "Hospitality", "Transportation"]
    },
    {
      name: "Saudi Arabia", flag: "🇸🇦", status: "Very High",
      statusColor: "bg-destructive text-destructive-foreground",
      reason: "Vision 2030 mega projects & NEOM development",
      avgSalary: "₹28,000 - ₹65,000 per month", visaProcess: "Work visa (2-4 months)",
      languages: ["Arabic", "English"],
      topJobs: ["Construction", "Oil & Gas", "Hospitality"]
    },
    {
      name: "Singapore", flag: "🇸🇬", status: "High Demand",
      statusColor: "bg-warning text-warning-foreground",
      reason: "Tech hub expansion & skilled trades shortage",
      avgSalary: "₹55,000 - ₹1,00,000 per month", visaProcess: "S Pass (2-4 weeks)",
      languages: ["English", "Mandarin", "Malay"],
      topJobs: ["Construction", "Manufacturing", "IT"]
    },
    {
      name: "Australia", flag: "🇦🇺", status: "High Demand",
      statusColor: "bg-warning text-warning-foreground",
      reason: "Mining boom & construction skills gap",
      avgSalary: "₹60,000 - ₹1,20,000 per month", visaProcess: "Skilled Worker Visa (3-6 months)",
      languages: ["English"],
      topJobs: ["Mining", "Construction", "Healthcare"]
    }
  ];

  const handleViewJobs = (countryName: string) => {
    navigate(`/jobs?location=${encodeURIComponent(countryName)}`);
  };

  return (
    <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            <Globe className="h-3.5 w-3.5" />
            Market Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4 tracking-tight">
            Country <span className="text-gradient">Insights</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Strategic insights into countries with the highest demand for skilled workers
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12">
          {countries.map((country, index) => (
            <div
              key={index}
              className="group"
            >
              <Card
                className="h-full bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden flex flex-col"
                onClick={() => handleViewJobs(country.name)}
              >
                <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-3xl sm:text-4xl shrink-0">{country.flag}</span>
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg font-heading group-hover:text-primary transition-colors truncate">
                          {country.name}
                        </CardTitle>
                        <Badge className={`${country.statusColor} mt-1 text-[10px] sm:text-xs`}>
                          {country.status}
                        </Badge>
                      </div>
                    </div>
                    <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0 ${country.status.includes('Very High') ? 'animate-bounce' : ''}`} />
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-3 p-4 sm:p-5 pt-0">
                  {/* Why high demand */}
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle className="h-3 w-3 text-primary" />
                      <span className="font-medium text-foreground text-[10px] sm:text-xs">Why High Demand?</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{country.reason}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-success font-bold text-xs sm:text-sm">₹</span>
                      <div>
                        <div className="text-[10px] sm:text-xs font-medium text-foreground">{country.avgSalary}</div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground">Avg. Salary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-foreground truncate">{country.visaProcess}</div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground">Visa Process</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Jobs */}
                  <div>
                    <div className="text-[10px] sm:text-xs font-medium mb-1.5 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Top Categories
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {country.topJobs.map((job, jobIndex) => (
                        <Badge key={jobIndex} variant="secondary" className="text-[10px] sm:text-xs">
                          {job}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {country.languages.map((lang, langIndex) => (
                      <Badge key={langIndex} variant="outline" className="text-[10px] sm:text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex-1" />

                  <Button
                    className="w-full rounded-xl group/btn flex items-center justify-center gap-2 mt-auto text-sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handleViewJobs(country.name); }}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">View {country.name} Jobs</span>
                    <ArrowRight className="h-4 w-4 shrink-0 ml-auto group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="rounded-xl px-8 shadow-primary hover:shadow-hover transition-all flex items-center justify-center gap-2"
            onClick={() => navigate('/jobs')}
          >
            <span>Explore All Countries</span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CountryInsights;
