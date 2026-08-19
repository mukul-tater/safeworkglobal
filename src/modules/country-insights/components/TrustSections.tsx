import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EMIGRATE_PORTAL_URL, MADAD_PORTAL_URL, RECRUITMENT_PARTNER } from "@/config/workerSupport";
import { Bi } from "./Bi";

const MEA_URL = "https://www.mea.gov.in/";

export function GovernmentResources() {
  return (
    <section id="government-resources" className="scroll-mt-32 py-10 sm:py-14 border-t border-border">
      <Bi
        text={{ en: "Official Government Resources", hi: "आधिकारिक सरकारी संसाधन" }}
        as="h2"
        className="text-xl sm:text-2xl font-heading font-bold mb-2"
      />
      <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
        SafeWork Global is not endorsed by the Government of India. Use official channels to verify
        recruiting agents and overseas employment information.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-bold">eMigrate</h3>
            <p className="text-sm text-muted-foreground">
              Official overseas employment information and Recruiting Agent verification.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <a href={EMIGRATE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                Visit eMigrate <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-bold">MEA</h3>
            <p className="text-sm text-muted-foreground">
              Ministry of External Affairs — official overseas employment assistance.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <a href={MEA_URL} target="_blank" rel="noopener noreferrer">
                Visit MEA <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-bold">MADAD</h3>
            <p className="text-sm text-muted-foreground">Government grievance / consular support portal.</p>
            <Button asChild variant="outline" className="rounded-xl">
              <a href={MADAD_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                Visit MADAD <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-bold">Helplines</h3>
            <p className="text-sm text-muted-foreground">
              PBSK and other official contacts are listed on our Contact page.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/contact#government-resources">Government Assistance</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function ComplianceFooter() {
  return (
    <section className="py-10 sm:py-12 border-t border-border">
      <Bi
        text={{
          en: "SafeWork Global is a technology and workforce mobility platform.",
          hi: "SafeWork Global एक technology और workforce mobility platform है।",
        }}
        className="text-sm mb-5 max-w-2xl"
      />
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-4 text-sm mb-5">
        <p className="font-semibold mb-1">Overseas Recruitment Process Conducted Through:</p>
        <p>{RECRUITMENT_PARTNER.name}</p>
        <p className="text-muted-foreground">{RECRUITMENT_PARTNER.designation}</p>
        <p className="text-muted-foreground">RC No.: {RECRUITMENT_PARTNER.rcNo}</p>
        <p className="text-xs text-muted-foreground mt-2">
          SafeWork Global does not itself hold this recruitment-agent registration.
        </p>
      </div>
      <Bi
        text={{
          en: "SafeWork Global is not a Government of India agency.",
          hi: "SafeWork Global भारत सरकार की सरकारी संस्था नहीं है।",
        }}
        className="text-sm"
      />
    </section>
  );
}
