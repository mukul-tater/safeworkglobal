import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import JobAlertsSubscription from "@/components/JobAlertsSubscription";
import NotificationSettings from "@/components/NotificationSettings";
import AlertsManagement from "@/components/AlertsManagement";
import { Bell } from "lucide-react";

export default function JobAlerts() {
  return (
    <div className="min-h-screen flex flex-col bg-background has-mobile-nav">
      <Header />
      <MobileBottomNav />

      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/[0.04] to-background">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
                <Bell className="h-3.5 w-3.5" />
                Alerts
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-foreground mb-4 tracking-tight">
                Job Alerts
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Stay updated with the latest opportunities matching your preferences
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <Tabs defaultValue="subscribe" className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
                    <TabsTrigger value="manage">Manage</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="subscribe"><JobAlertsSubscription /></TabsContent>
                <TabsContent value="manage"><AlertsManagement /></TabsContent>
                <TabsContent value="settings"><NotificationSettings /></TabsContent>
              </Tabs>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
