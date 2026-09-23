import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import constructionIcon from "@/assets/construction-icon.png";
import electricianIcon from "@/assets/electrician-icon.png";
import welderIcon from "@/assets/welder-icon.png";
import { Link, useNavigate } from "react-router-dom";

const JobCategories = () => {
  const navigate = useNavigate();

  const categories = [
    { icon: constructionIcon, title: "Construction", jobs: "74", avgSalary: "₹35,000 - ₹65,000 per month", description: "Infrastructure projects, residential and commercial building", demand: "High", countries: ["Japan", "Germany", "UAE", "Saudi Arabia", "Qatar"] },
    { icon: electricianIcon, title: "Electrical", jobs: "103", avgSalary: "₹40,000 - ₹80,000 per month", description: "Industrial electrical work, renewable energy projects", demand: "Very High", countries: ["Norway", "Australia", "Canada", "Singapore", "UK"] },
    { icon: welderIcon, title: "Welding", jobs: "77", avgSalary: "₹45,000 - ₹90,000 per month", description: "Pipeline, shipbuilding, and heavy industry welding", demand: "High", countries: ["Qatar", "South Korea", "Kuwait", "Bahrain", "Malaysia"] },
    { icon: "🔧", title: "Plumbing", jobs: "73", avgSalary: "₹30,000 - ₹60,000 per month", description: "Residential and commercial plumbing systems", demand: "Medium", countries: ["UK", "Ireland", "New Zealand", "Australia", "Canada"] },
    { icon: "🚚", title: "Delivery & Logistics", jobs: "79", avgSalary: "₹25,000 - ₹50,000 per month", description: "Package delivery, freight, and supply chain", demand: "Very High", countries: ["Netherlands", "Belgium", "Denmark", "Germany", "France"] },
    { icon: "🏭", title: "Manufacturing", jobs: "103", avgSalary: "₹28,000 - ₹55,000 per month", description: "Assembly line, quality control, machine operation", demand: "High", countries: ["Czech Republic", "Poland", "Malaysia", "Vietnam", "Thailand"] }
  ];

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "Very High": return "text-red-600 bg-red-50";
      case "High": return "text-success bg-success/10";
      case "Medium": return "text-warning bg-warning/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const handleCategoryClick = (categoryTitle: string) => {
    navigate(`/jobs?category=${encodeURIComponent(categoryTitle)}`);
  };

  return (
    <section className="py-14 sm:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Popular Job Categories
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore high-demand positions across various industries worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12">
          {categories.map((category, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-border cursor-pointer flex flex-col"
              onClick={() => handleCategoryClick(category.title)}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {typeof category.icon === 'string' && !category.icon.startsWith('/') && category.icon.length <= 2 ? (
                    <div className="text-2xl sm:text-3xl">{category.icon}</div>
                  ) : (
                    <img src={category.icon} alt={category.title} className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">{category.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-muted-foreground">{category.jobs} jobs</span>
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${getDemandColor(category.demand)}`}>
                        {category.demand} Demand
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                  {category.description}
                </p>

                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold text-foreground">{category.avgSalary}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Average salary</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-medium text-foreground">Top Markets:</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {category.countries.slice(0, 3).join(", ")}
                    </div>
                  </div>
                </div>

                <div className="flex-1" />

                <Button
                  variant="professional"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center gap-2 mt-auto text-sm"
                  onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.title); }}
                >
                  <span>View {category.title} Jobs</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/job-categories">
            <Button variant="outline" size="lg" className="flex items-center justify-center gap-2">
              <span>View All Categories</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
