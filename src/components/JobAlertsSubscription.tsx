import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Globe, Briefcase, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JOB_CATEGORIES } from "@/lib/constants";

const JobAlertsSubscription = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const { toast } = useToast();

  const countries = [
    { id: "uae", name: "UAE", demand: "Very High", reason: "Infrastructure expansion" },
  ];

  const industries = JOB_CATEGORIES.filter(c => c !== 'All Categories');

  const handleCountryToggle = (countryId: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryId) 
        ? prev.filter(id => id !== countryId)
        : [...prev, countryId]
    );
  };

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const handleSubscribe = () => {
    if (selectedCountries.length === 0 || selectedIndustries.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one country and industry to subscribe to alerts.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Alert Subscription Activated",
      description: `You'll receive notifications for ${selectedIndustries.length} industries in ${selectedCountries.length} countries.`,
    });
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "Critical": return "bg-destructive text-destructive-foreground";
      case "Very High": return "bg-warning text-warning-foreground";
      case "High": return "bg-primary text-primary-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Real-Time Job Alerts</CardTitle>
          <CardDescription className="text-lg">
            Get instant notifications for high-demand opportunities in countries experiencing labor shortages
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Select Countries & Regions
            </CardTitle>
            <CardDescription>
              Choose countries where you'd like to receive job alerts
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {countries.map((country) => (
              <div key={country.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    checked={selectedCountries.includes(country.id)}
                    onCheckedChange={() => handleCountryToggle(country.id)}
                  />
                  <div>
                    <span className="font-medium">{country.name}</span>
                    <p className="text-sm text-muted-foreground">{country.reason}</p>
                  </div>
                </div>
                <Badge className={getDemandColor(country.demand)}>
                  {country.demand}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Preferences
            </CardTitle>
            <CardDescription>
              Customize alerts based on your skills and interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">Industries of Interest</label>
              <div className="grid grid-cols-1 gap-2">
                {industries.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox 
                      checked={selectedIndustries.includes(industry)}
                      onCheckedChange={() => handleIndustryToggle(industry)}
                    />
                    <span className="text-sm">{industry}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Experience Level</label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                  <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                  <SelectItem value="expert">Expert Level (10+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold">Ready to Start Receiving Alerts?</h3>
              <p className="text-sm text-muted-foreground">
                Get notified instantly when matching opportunities become available
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </Button>
              <Button onClick={handleSubscribe} className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Subscribe to Alerts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobAlertsSubscription;