import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import { COUNTRY_INSIGHTS } from "@/modules/country-insights";
import { CountryListing } from "@/modules/country-insights/components/CountryCard";
import { Bi } from "@/modules/country-insights/components/Bi";

export default function CountryInsightsPage() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 overflow-x-hidden">
      <SEOHead
        title="Country Insights | SafeWork Global"
        description="Know the country, understand the work, and learn about living conditions before you travel."
        canonicalUrl="https://www.safeworkglobal.com/country-insights"
      />
      <Header />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold tracking-wide uppercase mb-4">
            Country Insights
          </span>
          <Bi
            text={{ en: "Explore Your Destination", hi: "अपना रोजगार गंतव्य जानें" }}
            as="h1"
            className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-foreground mb-4"
          />
          <Bi
            text={{
              en: "Know the country, understand the work, and learn about living conditions before you travel.",
              hi: "विदेश जाने से पहले देश, काम और रहने की वास्तविक परिस्थितियों को समझें।",
            }}
            className="text-base sm:text-lg text-muted-foreground max-w-3xl"
          />
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <CountryListing countries={COUNTRY_INSIGHTS} />
      </section>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
