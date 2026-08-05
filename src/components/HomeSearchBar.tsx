import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DESTINATION_COUNTRIES, JOB_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

const HomeSearchBar = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isEmployer = role === "employer";
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

  return (
    <>
      <section className="border-b border-border/60 bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              {isEmployer ? "Search verified workers" : "Search verified jobs abroad"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative group lg:col-span-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={isEmployer ? "Skill or worker type" : "Job title or skill"}
                  className="pl-10 h-11 sm:h-12 rounded-xl"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                <Select value={searchLocation} onValueChange={setSearchLocation}>
                  <SelectTrigger className="pl-10 h-11 sm:h-12 rounded-xl">
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
                  <SelectTrigger className="h-11 sm:h-12 rounded-xl">
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

              <Button
                size="lg"
                className="h-11 sm:h-12 gap-2 font-semibold rounded-xl"
                onClick={handleSearch}
              >
                {isEmployer ? "Search Workers" : "Search Jobs"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

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
    </>
  );
};

export default HomeSearchBar;
