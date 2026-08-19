import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import type { CountryInsight } from "../types";
import { CountryHero } from "./CountryHero";
import { SectionNavigation } from "./SectionNavigation";
import { WorkingEnvironment } from "./WorkingEnvironment";
import { AccommodationGallery, LivingConditions, RealPhotosGallery } from "./Galleries";
import { WorkerTimeline } from "./WorkerTimeline";
import { BenefitsChecklist, WorkingConditions } from "./BenefitsAndConditions";
import { OpportunityReality } from "./OpportunityReality";
import { CountryRules } from "./CountryRules";
import { SafetyChecklist } from "./SafetyChecklist";
import { EmployerReality, CountryComparison } from "./EmployerAndComparison";
import { KnowBeforeYouGo } from "./KnowBeforeYouGo";
import { GovernmentResources, ComplianceFooter } from "./TrustSections";
import { MobileStickyCta } from "./MobileStickyCta";

export function CountryInsightsDetail({ country }: { country: CountryInsight }) {
  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0">
      <SEOHead
        title={`${country.name.en} Country Insights | SafeWork Global`}
        description={country.hero.subheading.en}
        canonicalUrl={`https://safeworkglobal.com/country-insights/${country.slug}`}
      />
      <Header />
      <CountryHero country={country} />
      <SectionNavigation />
      <main className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <WorkingEnvironment country={country} />
        <AccommodationGallery country={country} />
        <WorkerTimeline country={country} />
        <BenefitsChecklist country={country} />
        <WorkingConditions country={country} />
        <LivingConditions country={country} />
        <OpportunityReality country={country} />
        <CountryRules country={country} />
        <SafetyChecklist country={country} />
        <RealPhotosGallery country={country} />
        <EmployerReality country={country} />
        <CountryComparison country={country} />
        <KnowBeforeYouGo country={country} />
        <GovernmentResources />
        <ComplianceFooter />
      </main>
      <Footer />
      <MobileBottomNav />
      <MobileStickyCta country={country} />
    </div>
  );
}
