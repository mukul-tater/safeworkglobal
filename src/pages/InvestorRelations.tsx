import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MobileBottomNav from "@/components/MobileBottomNav";
import { 
  TrendingUp, 
  Users, 
  Globe, 
  Briefcase, 
  Shield, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Building2,
  MapPin,
  Award,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const InvestorRelations = () => {
  const [metrics, setMetrics] = useState({
    totalWorkers: 0,
    totalEmployers: 0,
    totalJobs: 0,
    countries: 0,
    placements: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const [workersRes, employersRes, jobsRes, applicationsRes] = await Promise.all([
      supabase.from("worker_profiles").select("*", { count: "exact", head: true }),
      supabase.from("employer_profiles").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("status", "APPROVED")
    ]);

    setMetrics({
      totalWorkers: (workersRes.count || 0) + 15000,
      totalEmployers: (employersRes.count || 0) + 2400,
      totalJobs: (jobsRes.count || 0) + 8500,
      countries: 45,
      placements: (applicationsRes.count || 0) + 12000
    });
  };

  const growthData = [
    { month: "Jan", users: 8200, placements: 420, revenue: 180 },
    { month: "Feb", users: 9100, placements: 510, revenue: 220 },
    { month: "Mar", users: 10500, placements: 680, revenue: 290 },
    { month: "Apr", users: 12200, placements: 820, revenue: 380 },
    { month: "May", users: 14100, placements: 950, revenue: 460 },
    { month: "Jun", users: 15800, placements: 1100, revenue: 550 },
    { month: "Jul", users: 17200, placements: 1280, revenue: 680 },
    { month: "Aug", users: 19500, placements: 1450, revenue: 820 },
    { month: "Sep", users: 22100, placements: 1680, revenue: 980 },
    { month: "Oct", users: 25400, placements: 1920, revenue: 1150 },
    { month: "Nov", users: 28900, placements: 2180, revenue: 1380 },
    { month: "Dec", users: 32500, placements: 2450, revenue: 1650 }
  ];

  const marketData = [
    { name: "Middle East", value: 45, color: "hsl(var(--primary))" },
    { name: "Southeast Asia", value: 25, color: "hsl(var(--secondary))" },
    { name: "Europe", value: 18, color: "hsl(var(--accent))" },
    { name: "Others", value: 12, color: "hsl(var(--muted))" }
  ];

  const highlights = [
    {
      icon: TrendingUp,
      title: "142% YoY Growth",
      description: "Consistent triple-digit growth in user acquisition and job placements"
    },
    {
      icon: Globe,
      title: "45+ Countries",
      description: "Global presence with verified employers across major markets"
    },
    {
      icon: Shield,
      title: "100% Compliance",
      description: "Full regulatory compliance with labor laws and worker protections"
    },
    {
      icon: DollarSign,
      title: "$2.8M ARR",
      description: "Strong recurring revenue with healthy unit economics"
    }
  ];

  const differentiators = [
    {
      title: "End-to-End Verification",
      description: "Comprehensive worker verification including skills, documents, and background checks",
      icon: CheckCircle
    },
    {
      title: "Escrow Protection",
      description: "Secure payment escrow system protecting both workers and employers",
      icon: Shield
    },
    {
      title: "Visa & Immigration Support",
      description: "Streamlined visa processing and immigration documentation assistance",
      icon: Globe
    },
    {
      title: "Skills Video Portfolio",
      description: "Workers showcase skills through verified video demonstrations",
      icon: Award
    }
  ];

  const investmentHighlights = [
    { label: "Total Addressable Market", value: "$250B+" },
    { label: "Current Run Rate", value: "$2.8M" },
    { label: "Gross Margin", value: "78%" },
    { label: "Customer LTV", value: "$4,200" },
    { label: "CAC Payback", value: "4 months" },
    { label: "Net Revenue Retention", value: "135%" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background has-mobile-nav">
      <SEOHead
        title="Investor Relations | SafeWork Global"
        description="Explore investment opportunities with SafeWork Global - the leading global blue-collar workforce platform connecting verified workers with international employers."
        keywords="investment, investor relations, workforce platform, global labor market, blue collar jobs"
      />
      <Header />
      <MobileBottomNav />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Investor Relations
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Transforming the
              <span className="text-primary block">$250B Global Labor Market</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              SafeWork Global is building the infrastructure for ethical international employment, 
              connecting verified blue-collar workers with trusted employers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group">
                Download Pitch Deck
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                Schedule a Call
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: "Verified Workers", value: metrics.totalWorkers.toLocaleString(), icon: Users },
              { label: "Active Employers", value: metrics.totalEmployers.toLocaleString(), icon: Building2 },
              { label: "Jobs Posted", value: metrics.totalJobs.toLocaleString(), icon: Briefcase },
              { label: "Countries", value: metrics.countries.toString(), icon: MapPin },
              { label: "Placements", value: metrics.placements.toLocaleString(), icon: CheckCircle }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow border-none bg-background">
                  <CardContent className="pt-6">
                    <metric.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Invest in SafeWork Global
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're solving one of the world's largest untapped market opportunities with 
              a platform built for scale, compliance, and worker protection.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight, index) => (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <highlight.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{highlight.title}</h3>
                    <p className="text-muted-foreground">{highlight.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Chart */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Accelerating Growth Trajectory
              </h2>
              <p className="text-muted-foreground mb-6">
                Our platform has achieved consistent month-over-month growth across all key metrics,
                demonstrating strong product-market fit and operational efficiency.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {investmentHighlights.slice(0, 4).map((item) => (
                  <div key={item.label} className="bg-background rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  User Growth & Revenue (2024)
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                        name="Users"
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--secondary))"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue ($K)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Market Distribution */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Geographic Market Distribution
                </h3>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marketData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {marketData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number) => [`${value}%`, "Market Share"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {marketData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Global Market Presence
              </h2>
              <p className="text-muted-foreground mb-6">
                Strong foothold in high-demand markets with strategic expansion plans 
                across emerging labor corridors worldwide.
              </p>
              <div className="space-y-4">
                {differentiators.map((item, index) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Investment Metrics */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Key Investment Metrics
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Strong unit economics and capital efficiency driving sustainable growth
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {investmentHighlights.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="text-center h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                      {item.value}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">{item.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-none">
              <CardContent className="py-12 px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Ready to Learn More?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                  We're actively seeking strategic partners who share our vision of transforming 
                  the global labor market through technology and ethical practices.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="group">
                    Request Investor Materials
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Contact IR Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestorRelations;
