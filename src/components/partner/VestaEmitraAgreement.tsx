import { ScrollArea } from "@/components/ui/scroll-area";

const AGREEMENT_VERSION = "vesta-emitra-v1-2026-08";

const CLAUSES = [
  {
    title: "1. Parties",
    body: `This agreement is entered into between:
(a) SafeWork Global ("Platform"), the digital worker verification and job-matching platform;
(b) Vesta ("Recruiting Agent / RA"), the MEA-licensed recruiting agent responsible for regulatory compliance and worker deployment;
(c) The undersigned E-Mitra Partner ("Partner"), operating a registered service centre for field-level worker onboarding.`,
  },
  {
    title: "2. Purpose",
    body: `The Partner shall act as an authorised field registration point under the SafeWork–Vesta recruitment framework, assisting workers with onboarding, document collection, and skill-verification processes as defined by the Platform and the RA.`,
  },
  {
    title: "3. Partner Obligations",
    body: `(a) Verify worker identity documents (Aadhaar, PAN, passport) in person before uploading to the Platform.
(b) Collect only the fees explicitly authorised by SafeWork Global. No additional charges, deposits, or commissions may be collected from workers.
(c) Operate exclusively through the SafeWork Platform for candidate processing — no parallel off-platform recruitment.
(d) Maintain confidentiality of all worker personal data in accordance with applicable data-protection laws.
(e) Complete the SafeWork E-Mitra Training module before registering any workers.
(f) Follow all Ministry of External Affairs (MEA) guidelines for overseas recruitment.`,
  },
  {
    title: "4. RA (Vesta) Obligations",
    body: `(a) Obtain and maintain a valid MEA recruiting-agent licence.
(b) Process emigration clearance for workers deployed through this framework.
(c) Ensure that all employment contracts presented to workers meet MEA/PDOT standards.
(d) Provide the Partner with updated compliance requirements and deployment guidelines.`,
  },
  {
    title: "5. Platform (SafeWork) Obligations",
    body: `(a) Provide the digital infrastructure for worker onboarding, GCC journey tracking, and employer matching.
(b) Verify employer credentials and job authenticity before listing opportunities.
(c) Disburse Partner incentives (registration, verification, placement) as per the published incentive schedule.
(d) Maintain an auditable record of all transactions and worker journeys.`,
  },
  {
    title: "6. Fee & Payment Policy",
    body: `(a) Workers shall never be charged for registration or job matching.
(b) Partner incentives are disbursed upon verified milestones: worker registration (₹50), successful verification (₹100), and confirmed placement (₹500–₹2,000 depending on destination).
(c) Any partner found collecting unauthorised fees will be immediately suspended and reported to the relevant authorities.`,
  },
  {
    title: "7. Term & Termination",
    body: `(a) This agreement is effective from the date of OTP-verified acceptance and continues until terminated by either party with 30 days' written notice.
(b) SafeWork Global or Vesta may suspend or terminate a Partner immediately for violation of any clause, especially clauses 3(b), 3(c), or 3(d).
(c) Upon termination, the Partner must cease all recruitment activities and return any pending worker documents.`,
  },
  {
    title: "8. Governing Law",
    body: `This agreement shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Jaipur, Rajasthan.`,
  },
];

interface VestaEmitraAgreementProps {
  partnerName?: string;
  className?: string;
}

export default function VestaEmitraAgreement({
  partnerName,
  className,
}: VestaEmitraAgreementProps) {
  return (
    <div className={className}>
      <div className="mb-4 text-center">
        <h3 className="text-base font-bold font-heading">
          SafeWork Global E-Mitra/CSC Partner Agreement
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Version {AGREEMENT_VERSION}
        </p>
      </div>

      <ScrollArea className="h-[340px] rounded-lg border border-border bg-muted/20 p-4">
        <div className="space-y-4 pr-2">
          {CLAUSES.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold mb-1">{c.title}</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}

          {partnerName && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Partner:</strong> {partnerName}
              </p>
              <p className="text-xs text-muted-foreground">
                Acceptance confirmed via OTP verification on the registered
                mobile number.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export { AGREEMENT_VERSION };
