import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_DESCRIPTION, DEFAULT_TITLE, canonicalUrl } from "@/lib/seo";
import HeroSection from "@/components/HeroSection";
import HomeSearchBar from "@/components/HomeSearchBar";
import HomeTradesStrip from "@/components/HomeTradesStrip";
import WhySafeWork from "@/components/WhySafeWork";
import WorkerJourneyDemo from "@/components/WorkerJourneyDemo";
import ProcessTimeline from "@/components/ProcessTimeline";
import FeaturedJobs from "@/components/FeaturedJobs";
import HomeFooterCTA from "@/components/HomeFooterCTA";
import EmployerHomeSections from "@/components/EmployerHomeSections";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import { peekPendingOAuthRedirect, peekPendingOAuthRole, hasOAuthCallbackInUrl } from "@/lib/oauthRedirect";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const { loading, profileLoading, role, isAuthenticated } = useAuth();
  // Post-OAuth landing is handled globally by <OAuthLandingHandler />.

  // Wait for role only on cold start. If role is already known, never blank
  // the page when profileLoading flickers (tab focus / token refresh).
  const waitingForRole = isAuthenticated && !role && (loading || profileLoading);
  const oauthReturning =
    (loading || !isAuthenticated || waitingForRole) &&
    (hasOAuthCallbackInUrl() || !!peekPendingOAuthRedirect() || !!peekPendingOAuthRole());
  const isEmployer = !waitingForRole && !oauthReturning && role === "employer";
  const showDefaultHome = !waitingForRole && !oauthReturning && role !== "employer";

  if (oauthReturning) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Signing you in..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background has-mobile-nav overflow-x-hidden">
      <SEOHead
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        ogDescription={DEFAULT_OG_DESCRIPTION}
        twitterDescription="India's skilled workforce. Global opportunities."
        canonicalUrl={canonicalUrl("/")}
      />
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
