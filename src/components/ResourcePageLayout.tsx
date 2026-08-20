import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import { ReactNode } from "react";

interface ResourcePageLayoutProps {
  title: string;
  description: string;
  eyebrow?: string;
  heading: string;
  intro: string;
  children: ReactNode;
}

export default function ResourcePageLayout({
  title,
  description,
  eyebrow,
  heading,
  intro,
  children,
}: ResourcePageLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 overflow-x-hidden">
      <SEOHead title={title} description={description} />
      <Header />

      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold tracking-wide uppercase mb-4">
                {eyebrow}
              </span>
            )}
            <h1 className="text-[1.75rem] leading-tight sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-foreground mb-3">
              {heading}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">{intro}</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {children}
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
