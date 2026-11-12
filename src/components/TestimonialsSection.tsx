import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote, MapPin, Briefcase, Building2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TestimonialsSection = () => {
  const { role, isAuthenticated, loading, profileLoading } = useAuth();
  const authResolving = loading || (isAuthenticated && profileLoading);
  const isEmployer = role === "employer";

  const workerTestimonials = [
    {
      name: "Rajesh Kumar",
      role: "Construction Foreman",
      country: "Japan",
      avatar: "RK",
      rating: 5,
      text: "SafeWorkGlobal helped me find my dream job in Japan. The process was smooth and transparent. Within 3 months, I was working for a top construction company!",
      placement: "Construction Manager",
      salary: "₹85,000/month"
    },
    {
      name: "Maria Santos",
      role: "Electrical Technician",
      country: "Germany",
      avatar: "MS",
      rating: 5,
      text: "Within 3 weeks of signing up, I had 5 job offers from Germany. The platform made it easy to compare opportunities and choose the best fit for my skills.",
      placement: "Solar Panel Installer",
      salary: "₹78,000/month"
    },
    {
      name: "Ahmed Hassan",
      role: "Skilled Welder",
      country: "UAE",
      avatar: "AH",
      rating: 5,
      text: "SafeWork Global connected me with a reputable company in Dubai. The accommodation and benefits are excellent. I recommend this to all skilled workers!",
      placement: "Pipeline Welder",
      salary: "₹72,000/month"
    },
    {
      name: "Chen Wei",
      role: "Manufacturing Operator",
      country: "Poland",
      avatar: "CW",
      rating: 5,
      text: "Fast hiring process with minimal paperwork. I started my job in Poland within 6 weeks. The platform's support team helped me every step of the way.",
      placement: "Assembly Line Lead",
      salary: "₹55,000/month"
    }
  ];

  const employerTestimonials = [
    {
      name: "Tanaka Hiroshi",
      role: "HR Director",
      company: "Sakura Construction Co.",
      country: "Japan",
      avatar: "TH",
      rating: 5,
      text: "We hired 24 verified construction workers in just 6 weeks. Pre-screening saved us months of effort and the secure payment model gave us complete peace of mind.",
      placement: "24 workers hired",
      salary: "Saved ₹18L vs agents"
    },
    {
      name: "Klaus Müller",
      role: "Talent Acquisition Lead",
      company: "BauWerk Solar GmbH",
      country: "Germany",
      avatar: "KM",
      rating: 5,
      text: "Brilliant pool of skilled electricians. We shortlisted 12 candidates in 8 days and onboarded 9 of them. Zero upfront fees — only paid after hiring.",
      placement: "9 workers hired",
      salary: "85% time saved"
    },
    {
      name: "Fatima Al-Mansoori",
      role: "Project Manager",
      company: "Gulf Pipelines LLC",
      country: "UAE",
      avatar: "FA",
      rating: 5,
      text: "Verified welders, full document checks, and visa support handled end-to-end. We've now hired 40+ workers through SafeWork Global with zero compliance issues.",
      placement: "40+ workers hired",
      salary: "100% compliance"
    },
    {
      name: "Anna Kowalski",
      role: "Operations Director",
      company: "Polska Manufacturing",
      country: "Poland",
      avatar: "AK",
      rating: 5,
      text: "We needed 15 assembly operators urgently. SafeWork Global delivered a vetted shortlist in 7 days. Transparent pricing and a smooth contracting flow.",
      placement: "15 workers hired",
      salary: "Shortlist in 7 days"
    }
  ];

  const testimonials = !authResolving && isEmployer ? employerTestimonials : workerTestimonials;

  const heading = !authResolving && isEmployer ? (
    <>Trusted by <span className="text-gradient">Hiring Teams</span></>
  ) : (
    <>Real People, <span className="text-gradient">Real Success</span></>
  );

  const subheading = !authResolving && isEmployer
    ? "Hear from employers who built their workforce through SafeWorkGlobal"
    : "Hear from workers who transformed their careers through SafeWorkGlobal";

  const trustBadgeText = !authResolving && isEmployer
    ? "4.9/5 from 120+ employers"
    : "4.9/5 from 500+ workers";

  return (
    <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-success/10 text-success mb-4">
            <Star className="h-3.5 w-3.5 fill-current" />
            {trustBadgeText}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4 tracking-tight">
            {heading}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            {subheading}
          </p>
        </div>

        {/* Testimonials Grid - 1 col on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group"
            >
              <Card className="h-full relative overflow-hidden bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="absolute -top-2 -right-2 text-primary/5">
                  <Quote className="h-20 w-20" />
                </div>

                <CardContent className="p-4 sm:p-5 relative z-10 h-full flex flex-col">
                  {/* Rating */}
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 flex-grow line-clamp-4">
                    "{testimonial.text}"
                  </p>

                  {/* Placement */}
                  <div className="p-2.5 sm:p-3 rounded-lg bg-success/5 border border-success/10 mb-4">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <Briefcase className="h-3 w-3 text-success" />
                      <span className="font-medium text-foreground text-xs">{testimonial.placement}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {testimonial.country}
                      </span>
                      <span className="font-semibold text-success">{testimonial.salary}</span>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-border/50">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold font-heading text-foreground text-sm truncate">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {testimonial.role}
                        {(testimonial as any).company ? ` · ${(testimonial as any).company}` : ""}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Trust indicator */}
        <div className="text-center mt-10 sm:mt-12 lg:mt-16">
          <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-muted/50 border border-border/50">
            <div className="flex -space-x-2">
              {testimonials.slice(0, 4).map((t, i) => (
                <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] sm:text-xs font-medium text-primary">
                  {t.avatar}
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {!authResolving && isEmployer ? (
                <>Join <span className="font-semibold text-foreground">120+</span> employers who hired with confidence</>
              ) : (
                <>Join <span className="font-semibold text-foreground">450+</span> workers who found success</>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
