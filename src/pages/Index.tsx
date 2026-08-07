import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HomeSearchBar from "@/components/HomeSearchBar";
import HomeTradesStrip from "@/components/HomeTradesStrip";
import WhySafeWork from "@/components/WhySafeWork";
import HomeHowWeWork from "@/components/HomeHowWeWork";
import WorkerJourneyDemo from "@/components/WorkerJourneyDemo";
import ProcessTimeline from "@/components/ProcessTimeline";
import FeaturedJobs from "@/components/FeaturedJobs";
import HomeFooterCTA from "@/components/HomeFooterCTA";
import EmployerHomeSections from "@/components/EmployerHomeSections";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { loading, profileLoading, role, isAuthenticated } = useAuth();
  // Post-OAuth landing is handled globally by <OAuthLandingHandler />.

  // Wait for role only on cold start. If role is already known, never blank
  // the page when profileLoading flickers (tab focus / token refresh).
  const waitingForRole = isAuthenticated && !role && (loading || profileLoading);
  const isEmployer = !waitingForRole && role === "employer";
  const showDefaultHome = !waitingForRole && role !== "employer";

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <HeroSection />

      {isEmployer ? (
        <>
          <HomeSearchBar />
          <ScrollReveal>
            <HomeTradesStrip />
          </ScrollReveal>
          <ScrollReveal>
            <ProcessTimeline />
          </ScrollReveal>
          <ScrollReveal>
            <EmployerHomeSections />
          </ScrollReveal>
        </>
      ) : showDefaultHome ? (
        <>
          <HomeSearchBar />

          <ScrollReveal>
            <HomeTradesStrip />
          </ScrollReveal>

          <ScrollReveal>
            <WhySafeWork />
          </ScrollReveal>

          <ScrollReveal>
            <HomeHowWeWork />
          </ScrollReveal>

          <ScrollReveal>
            <WorkerJourneyDemo />
          </ScrollReveal>

          <ScrollReveal>
            <FeaturedJobs />
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
