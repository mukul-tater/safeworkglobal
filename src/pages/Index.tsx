import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HomePlatformStats from "@/components/HomePlatformStats";
import WhySafeWork from "@/components/WhySafeWork";
import AgentComparison from "@/components/AgentComparison";
import SalaryProtectionSection from "@/components/SalaryProtectionSection";
import GlobalDestinations from "@/components/GlobalDestinations";
import HomeJobCategories from "@/components/HomeJobCategories";
import ProcessTimeline from "@/components/ProcessTimeline";
import FeaturedJobs from "@/components/FeaturedJobs";
import PlatformFeatures from "@/components/PlatformFeatures";
import HomeFooterCTA from "@/components/HomeFooterCTA";
import EmployerHomeSections from "@/components/EmployerHomeSections";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { loading, profileLoading, role, isAuthenticated } = useAuth();
  const authResolving = loading || (isAuthenticated && profileLoading);
  const isEmployer = role === "employer";

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <HeroSection />

      {!authResolving && isEmployer ? (
        <>
          <HomePlatformStats />
          <ScrollReveal>
            <ProcessTimeline />
          </ScrollReveal>
          <ScrollReveal>
            <EmployerHomeSections />
          </ScrollReveal>
        </>
      ) : !authResolving ? (
        <>
          <HomePlatformStats />

          <ScrollReveal>
            <WhySafeWork />
          </ScrollReveal>

          <ScrollReveal>
            <AgentComparison />
          </ScrollReveal>

          <ScrollReveal>
            <SalaryProtectionSection />
          </ScrollReveal>

          <ScrollReveal>
            <GlobalDestinations />
          </ScrollReveal>

          <ScrollReveal>
            <HomeJobCategories />
          </ScrollReveal>

          <ScrollReveal>
            <ProcessTimeline />
          </ScrollReveal>

          <ScrollReveal>
            <FeaturedJobs />
          </ScrollReveal>

          <ScrollReveal>
            <PlatformFeatures />
          </ScrollReveal>

          <ScrollReveal>
            <HomeFooterCTA />
          </ScrollReveal>
        </>
      ) : null}

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
