import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import { Building2, Users, Target, Award, Heart, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutUs() {
  const stats = [
    { icon: Building2, value: "120+", label: "Companies", color: "bg-primary/10 text-primary" },
    { icon: Users, value: "450+", label: "Workers Placed", color: "bg-secondary/10 text-secondary" },
    { icon: Target, value: "920+", label: "Jobs Posted", color: "bg-info/10 text-info" },
    { icon: Award, value: "98%", label: "Satisfaction", color: "bg-success/10 text-success" },
  ];

  const values = [
    {
      icon: Heart,
      title: "Worker First",
      description: "We prioritize worker welfare, safety, and fair compensation in everything we do.",
    },
    {
      icon: Shield,
      title: "Transparency",
      description: "Clear terms, honest communication, and complete visibility throughout the process.",
    },
    {
      icon: Award,
      title: "Quality",
      description: "We maintain high standards for both workers and employers on our platform.",
    },
  ];

  const team = [
    { name: "Mukul Tater", role: "Founder & CEO", initials: "MT" },
    { name: "Kailash Gayari", role: "Head of Platform / Tech", initials: "KG" },
    { name: "Deependra Gadwal", role: "Operations & Legal Advisor", initials: "DG" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Header />
      <MobileBottomNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/[0.04] to-background">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
                <Globe className="h-3.5 w-3.5" />
                Our Story
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-foreground mb-4 tracking-tight">
                About SafeWorkGlobal
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Connecting skilled workers with verified opportunities across the globe — safely, ethically, and transparently.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Mission + Stats */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-24">
              <ScrollReveal>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  SafeWorkGlobal is dedicated to bridging the gap between skilled workers and employers worldwide.
                  We provide a secure, transparent platform that empowers workers to find meaningful employment
                  while helping employers discover qualified talent.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  With a focus on compliance, worker welfare, and fair employment practices, we're building
                  the future of global workforce mobility.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => (
                    <Card key={stat.label} className="text-center border-border/50">
                      <CardContent className="pt-6 pb-5">
                        <div className={`inline-flex p-3 rounded-xl ${stat.color.split(' ')[0]} mb-3`}>
                          <stat.icon className={`h-6 w-6 ${stat.color.split(' ')[1]}`} />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Values */}
            <ScrollReveal>
              <div className="bg-muted/30 rounded-2xl p-8 sm:p-12">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-center mb-10">Our Values</h2>
                <div className="grid sm:grid-cols-3 gap-8">
                  {values.map((v, i) => (
                    <ScrollReveal key={v.title} delay={i * 0.08}>
                      <div className="text-center">
                        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                          <v.icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">{v.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Team */}
            <ScrollReveal>
              <div className="mt-16 md:mt-24 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-3">Leadership Team</h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-10">
                  The people building safer pathways for global work.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-3xl mx-auto items-stretch">
                  {team.map((member, i) => (
                    <ScrollReveal key={member.name} delay={i * 0.08} className="h-full">
                      <Card className="h-full border-border/50 bg-card/80 hover:border-primary/30 transition-colors">
                        <CardContent className="pt-7 pb-6 px-5 h-full flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center mb-4 shrink-0">
                            <span className="text-lg font-bold text-primary">{member.initials}</span>
                          </div>
                          <h4 className="font-semibold text-foreground leading-snug">{member.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1.5 min-h-[2.5rem] flex items-start justify-center leading-snug">
                            {member.role}
                          </p>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
