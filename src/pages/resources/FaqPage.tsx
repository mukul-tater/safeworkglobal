import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleHelp,
  ExternalLink,
  FileText,
  HardHat,
  Landmark,
  Mail,
  Plane,
  Search,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EMIGRATE_PORTAL_URL,
  RECRUITMENT_PARTNER,
  SAFEWORK_CONTACT,
  getSafeworkMailtoUrl,
} from "@/config/workerSupport";
import { FAQ_GROUPS, type FaqEntry, type FaqGroup } from "./faqContent";

const GROUP_META: Record<
  string,
  { icon: typeof HardHat; accent: string }
> = {
  workers: { icon: HardHat, accent: "bg-primary/10 text-primary" },
  fees: { icon: Wallet, accent: "bg-secondary/10 text-secondary" },
  documents: { icon: FileText, accent: "bg-info/10 text-info" },
  overseas: { icon: Plane, accent: "bg-primary/10 text-primary" },
  safety: { icon: ShieldCheck, accent: "bg-success/10 text-success" },
};

function matchesQuery(item: FaqEntry, query: string) {
  if (!query) return true;
  const haystack = [item.qEn, item.qHi, item.aEn, item.aHi, ...(item.bulletsEn ?? [])].join(" ").toLowerCase();
  return haystack.includes(query);
}

function FaqAnswer({ item }: { item: FaqEntry }) {
  return (
    <div className="space-y-4 pb-1">
      <p className="text-sm sm:text-[15px] text-foreground leading-relaxed">{item.aEn}</p>
      {item.bulletsEn && (
        <ul className="flex flex-wrap gap-2">
          {item.bulletsEn.map((b) => (
            <li
              key={b}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs sm:text-sm font-medium text-foreground"
            >
              {b}
            </li>
          ))}
        </ul>
      )}
      <p className="rounded-xl bg-muted/50 px-3.5 py-3 text-sm text-muted-foreground leading-relaxed">{item.aHi}</p>
      {item.extra === "vesta-ra" && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3.5 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1.5">
            Overseas Recruitment Process Conducted Through
          </p>
          <p className="font-semibold text-foreground">{RECRUITMENT_PARTNER.name}</p>
          <p className="text-muted-foreground">{RECRUITMENT_PARTNER.designation}</p>
          <p className="text-muted-foreground">RC No.: {RECRUITMENT_PARTNER.rcNo}</p>
        </div>
      )}
    </div>
  );
}

function FaqGroupSection({ group }: { group: FaqGroup }) {
  const meta = GROUP_META[group.id] ?? { icon: CircleHelp, accent: "bg-primary/10 text-primary" };
  const Icon = meta.icon;

  return (
    <section id={group.id} className="scroll-mt-36 md:scroll-mt-28">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${meta.accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold leading-tight">{group.titleEn}</h2>
          <p className="text-sm text-muted-foreground">{group.titleHi}</p>
        </div>
      </div>
      <Accordion type="single" collapsible className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
        {group.items.map((item, i) => (
          <AccordionItem
            key={item.n}
            value={`faq-${item.n}`}
            className={`px-4 sm:px-5 ${i === group.items.length - 1 ? "border-b-0" : "border-border/60"}`}
          >
            <AccordionTrigger className="text-left hover:no-underline py-4 sm:py-5 items-start gap-2 group/trigger">
              <span className="pr-2 sm:pr-3 flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                <span className="mt-0.5 h-6 min-w-6 sm:h-7 sm:min-w-7 px-1 rounded-md sm:rounded-lg bg-primary/10 text-primary text-[10px] sm:text-xs font-bold font-mono flex items-center justify-center shrink-0">
                  {String(item.n).padStart(2, "0")}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm sm:text-base font-semibold text-foreground break-words group-hover/trigger:text-primary transition-colors">
                    {item.qEn}
                  </span>
                  <span className="block text-xs sm:text-sm font-normal text-muted-foreground mt-0.5 break-words">{item.qHi}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-0 sm:pl-10">
                <FaqAnswer item={item} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function TopicButton({
  id,
  title,
  subtitle,
  count,
  active,
  icon: Icon,
  accent,
}: {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  active: boolean;
  icon: typeof HardHat;
  accent: string;
}) {
  return (
    <a
      href={`#${id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all border-l-[3px]",
        active
          ? "bg-primary/8 border-l-primary text-foreground"
          : "border-l-transparent hover:bg-muted/70 text-foreground",
      )}
    >
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-heading font-semibold leading-tight truncate", active && "text-primary")}>
          {title}
        </p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {typeof count === "number" && (
        <span
          className={cn(
            "text-[11px] font-mono font-semibold tabular-nums shrink-0",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {String(count).padStart(2, "0")}
        </span>
      )}
    </a>
  );
}

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(FAQ_GROUPS[0]?.id ?? "workers");
  const normalized = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalized) return FAQ_GROUPS;
    return FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesQuery(item, normalized)),
    })).filter((group) => group.items.length > 0);
  }, [normalized]);

  const totalCount = FAQ_GROUPS.reduce((n, g) => n + g.items.length, 0);
  const resultCount = filteredGroups.reduce((n, g) => n + g.items.length, 0);

  useEffect(() => {
    const ids = [...filteredGroups.map((g) => g.id), "government-resources", "need-help"];
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.15, 0.4, 0.7] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredGroups]);

  return (
    <ResourcePageLayout
      title="FAQ | SafeWork Global"
      description="Frequently asked questions for workers about SafeWork Global registration, trade tests, documents, fees, overseas recruitment and safety."
      eyebrow="FAQ"
      heading="Frequently Asked Questions"
      intro="श्रमिकों के लिए अक्सर पूछे जाने वाले प्रश्न। English and Hindi answers are shown together."
    >
      <div className="max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <nav aria-label="FAQ topics" className="rounded-2xl border border-border/70 bg-card p-2 shadow-sm">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Topics
                </p>
                <div className="space-y-0.5">
                  {FAQ_GROUPS.map((group) => {
                    const meta = GROUP_META[group.id] ?? {
                      icon: CircleHelp,
                      accent: "bg-primary/10 text-primary",
                    };
                    const filtered = filteredGroups.find((g) => g.id === group.id);
                    const count = normalized ? filtered?.items.length ?? 0 : group.items.length;
                    return (
                      <TopicButton
                        key={group.id}
                        id={group.id}
                        title={group.titleEn}
                        subtitle={group.titleHi}
                        count={count}
                        active={activeId === group.id}
                        icon={meta.icon}
                        accent={meta.accent}
                      />
                    );
                  })}
                </div>
              </nav>

              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-secondary/8 p-4">
                <p className="text-sm font-heading font-bold mb-1">Need help?</p>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Can’t find an answer? Send an enquiry to SafeWork support.
                </p>
                <Button asChild size="sm" className="rounded-xl w-full">
                  <Link to="/contact">
                    <Send className="h-3.5 w-3.5" />
                    Send Enquiry
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            <div className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 mb-2 bg-background/95 backdrop-blur border-b border-border">
              <nav
                aria-label="FAQ topics"
                className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {FAQ_GROUPS.map((group) => {
                  const meta = GROUP_META[group.id] ?? {
                    icon: CircleHelp,
                    accent: "bg-primary/10 text-primary",
                  };
                  const Icon = meta.icon;
                  const active = activeId === group.id;
                  return (
                    <a
                      key={group.id}
                      href={`#${group.id}`}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {group.titleEn}
                    </a>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions… | प्रश्न खोजें"
                  className="h-12 pl-10 rounded-xl"
                  aria-label="Search FAQ"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {normalized
                  ? `${resultCount} of ${totalCount} questions`
                  : `${totalCount} questions across ${FAQ_GROUPS.length} topics`}
              </p>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                <CircleHelp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-heading font-bold mb-1">No matching questions</p>
                <p className="text-sm text-muted-foreground mb-4">Try a different keyword, or send us an enquiry.</p>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/contact">Contact support</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {filteredGroups.map((group) => (
                  <FaqGroupSection key={group.id} group={group} />
                ))}
              </div>
            )}

            <section
              id="government-resources"
              className="scroll-mt-36 md:scroll-mt-28 rounded-2xl border border-[#c4a35a]/35 bg-[#f7f4ec] dark:bg-[#1a1c18] dark:border-[#c4a35a]/20 p-5 sm:p-8"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5c1e] dark:text-[#e0c27a] mb-2">
                Government of India
              </p>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1e2a4a] dark:text-[#e8eadf]">
                Official Government Resources
              </h2>
              <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-1 mb-2">आधिकारिक सरकारी सहायता</p>
              <p className="text-sm text-[#1e2a4a]/80 dark:text-[#e8eadf]/80 mb-5 leading-relaxed">
                SafeWork Global is not a Government of India agency. Workers should independently verify recruitment
                and employment information through official Government of India channels.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <article className="rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] dark:border-[#e8eadf]/10 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e2a4a]/8 text-[#1e2a4a] dark:bg-[#e8eadf]/10 dark:text-[#e8eadf] shrink-0">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-[#1e2a4a] dark:text-[#e8eadf]">eMigrate</h3>
                      <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-0.5 leading-relaxed">
                        विदेशी रोजगार से संबंधित आधिकारिक जानकारी और Recruitment Agent verification के लिए Government of
                        India&apos;s eMigrate portal का उपयोग करें.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="rounded-xl w-full bg-[#1e2a4a] hover:bg-[#162038] text-white">
                    <a href={EMIGRATE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                      Visit eMigrate
                      <ExternalLink className="h-4 w-4 ml-1.5" />
                    </a>
                  </Button>
                </article>
                <article className="rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] dark:border-[#e8eadf]/10 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e2a4a]/8 text-[#1e2a4a] dark:bg-[#e8eadf]/10 dark:text-[#e8eadf] shrink-0">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-[#1e2a4a] dark:text-[#e8eadf]">MEA / PBSK</h3>
                      <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-0.5 leading-relaxed">
                        विदेश रोजगार से संबंधित सहायता और जानकारी के लिए Ministry of External Affairs के official channels
                        का उपयोग करें।
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl w-full border-[#1e2a4a]/25 text-[#1e2a4a] hover:bg-[#1e2a4a]/5 dark:text-[#e8eadf] dark:border-[#e8eadf]/20"
                  >
                    <Link to="/contact#government-resources">
                      Government Assistance & Helpline
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                </article>
              </div>
            </section>

            <section
              id="need-help"
              className="scroll-mt-36 md:scroll-mt-28 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-secondary/8 p-5 sm:p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-bold mb-1">Need Help? | सहायता चाहिए?</h2>
              <p className="text-sm font-medium text-foreground mb-1">SafeWork Global Support</p>
              <a
                href={getSafeworkMailtoUrl("SafeWork Global – FAQ")}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
              >
                {SAFEWORK_CONTACT.email}
              </a>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                <a
                  href={SAFEWORK_CONTACT.websiteUrl}
                  className="hover:text-foreground hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SAFEWORK_CONTACT.websiteDisplay}
                </a>
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                आपके सवाल का जवाब नहीं मिला? Send an enquiry | हमसे संपर्क करें
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
                <Button asChild className="rounded-xl w-full sm:w-auto">
                  <Link to="/contact">
                    <Send className="h-4 w-4" />
                    Send Enquiry
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl w-full sm:w-auto">
                  <a href={getSafeworkMailtoUrl("SafeWork Global – FAQ")}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ResourcePageLayout>
  );
}
