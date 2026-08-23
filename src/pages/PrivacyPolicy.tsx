import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import { SAFEWORK_CONTACT } from "@/config/workerSupport";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background has-mobile-nav">
      <SEOHead
        title="Privacy Policy | SafeWork Global"
        description="Learn how SafeWork Global collects, uses, and protects your personal data."
      />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">1. Introduction</h2>
            <p>SafeWorkGlobal ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform, website, and services (collectively, the "Services").</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register.</li>
              <li><strong>Profile Information:</strong> Work experience, skills, certifications, education, passport details, and profile photos.</li>
              <li><strong>Documents:</strong> Resumes, identification documents, medical certificates, and other documents you upload for verification.</li>
              <li><strong>Communications:</strong> Messages exchanged through our platform's messaging system.</li>
              <li><strong>Payment Information:</strong> Payment details processed through our secure escrow system.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Usage data (pages visited, features used, search queries)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, maintain, and improve our Services</li>
              <li>To match workers with relevant job opportunities</li>
              <li>To verify identities and documents for trust and safety</li>
              <li>To process payments and manage escrow transactions</li>
              <li>To communicate with you about opportunities, updates, and support</li>
              <li>To comply with legal obligations, including immigration and labor laws</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">4. Information Sharing</h2>
            <p>We share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>With Employers:</strong> Your profile, skills, and application materials are shared with employers you apply to.</li>
              <li><strong>With Verification Partners:</strong> Document and identity verification providers to validate your credentials.</li>
              <li><strong>Government Authorities:</strong> When required by law, such as for visa processing or labor compliance.</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate the platform (hosting, analytics, email).</li>
              <li><strong>With Your Consent:</strong> In any other circumstances where you have given explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">5. Data Security</h2>
            <p>We implement industry-standard security measures including encryption in transit and at rest, role-based access controls, and regular security audits. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">6. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide Services. We may retain certain information as required by law or for legitimate business purposes, such as resolving disputes and enforcing agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, correct, or delete your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability — receive your data in a structured format</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:mukultater@safeworkglobal.com" className="text-primary underline">mukultater@safeworkglobal.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">8. International Data Transfers</h2>
            <p>As a global platform, your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">9. Cookies</h2>
            <p>We use essential cookies to operate the platform and optional analytics cookies to understand usage patterns. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-heading text-foreground">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
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
