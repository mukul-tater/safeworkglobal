import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import { SAFEWORK_CONTACT } from "@/config/workerSupport";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEOHead
        title="Terms of Service | SafeWork Global"
        description="Read the terms and conditions governing your use of the SafeWork Global platform."
      />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using SafeWorkGlobal's platform and services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be at least 18 years of age to use the Services.</li>
              <li>You must provide accurate, complete, and current information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">3. Platform Description</h2>
            <p>SafeWorkGlobal is an international job marketplace that connects workers with employers across borders. We provide tools for job discovery, application management, document verification, interview scheduling, contract management, and escrow-based payments.</p>
            <p className="mt-2"><strong>Important:</strong> SafeWorkGlobal is a platform facilitator. We are not an employer, staffing agency, or immigration consultant. We do not guarantee employment, visa approval, or placement outcomes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">4. User Responsibilities</h2>
            <h3 className="text-lg font-medium text-foreground">4.1 Workers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide truthful information in your profile, applications, and documents.</li>
              <li>Ensure all uploaded documents are genuine and unaltered.</li>
              <li>Comply with immigration and labor laws of your home and destination countries.</li>
              <li>Communicate professionally with employers through the platform.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">4.2 Employers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Post only genuine job opportunities with accurate descriptions and compensation.</li>
              <li>Comply with all applicable labor laws, including fair wage requirements.</li>
              <li>Process payments through the platform's escrow system when applicable.</li>
              <li>Not engage in deceptive recruitment practices or charge workers illegal fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">5. Prohibited Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submitting false or misleading information</li>
              <li>Engaging in fraud, human trafficking, or forced labor</li>
              <li>Charging workers illegal recruitment fees</li>
              <li>Harassing, threatening, or discriminating against other users</li>
              <li>Attempting to circumvent platform security or payment systems</li>
              <li>Scraping, data mining, or automated access to the platform</li>
              <li>Impersonating another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">6. Payments & Escrow</h2>
            <p>Payments processed through our escrow system are held securely until agreed-upon conditions are met. Platform fees and commission structures are disclosed at the time of transaction. Disputes related to payments will be handled through our dispute resolution process.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">7. Document Verification</h2>
            <p>We may verify documents and identities uploaded to the platform. Verification is for trust and safety purposes and does not constitute legal validation or government endorsement. Users found submitting fraudulent documents will be permanently banned.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">8. Intellectual Property</h2>
            <p>All content, design, and technology of the SafeWorkGlobal platform are owned by us or our licensors. You may not reproduce, distribute, or create derivative works without written consent. Content you upload remains yours, but you grant us a license to use it in connection with the Services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, SafeWorkGlobal shall not be liable for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Employment outcomes, visa decisions, or immigration results</li>
              <li>Actions or conduct of employers, workers, or other users</li>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of data, revenue, or profits arising from use of the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">10. Dispute Resolution</h2>
            <p>Any disputes between users should first be reported through our in-platform dispute resolution system. If unresolved, disputes will be settled through binding arbitration under the laws of India, with proceedings conducted in Jaipur, Rajasthan.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">11. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms. You may deactivate your account at any time by contacting support. Upon termination, your right to use the Services ceases immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">12. Modifications</h2>
            <p>We may update these Terms at any time. Continued use of the Services after changes constitutes acceptance of the revised Terms. Material changes will be communicated via email or in-platform notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">13. Contact Us</h2>
            <p>For questions about these Terms, contact us at:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:mukultater@safeworkglobal.com" className="text-primary underline">mukultater@safeworkglobal.com</a></li>
              <li>Office Address: {SAFEWORK_CONTACT.officeAddress}</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
