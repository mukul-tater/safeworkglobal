import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Handshake, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import Header from "@/components/Header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_PARTNER_SIGNUP_CODE,
  EMITRA_STATE_BRANDS,
  PARTNER_SIGNUP_OPTIONS,
  getPartnerSignupOption,
  type PartnerSignupOption,
} from "@/modules/partner/config/partnerSignupOptions";

/**
 * Partner signup hub — choose a partner type.
 * Live types (E-Mitra, SSVN, ITI, MEA Licensed RA, Consultants, Employer) redirect to their onboarding after confirm.
 */
export default function PartnerRegister() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [selectedCode, setSelectedCode] = useState(DEFAULT_PARTNER_SIGNUP_CODE);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = useMemo(
    () => getPartnerSignupOption(selectedCode) ?? PARTNER_SIGNUP_OPTIONS[0],
    [selectedCode],
  );

  const requestContinue = (option: PartnerSignupOption) => {
    setSelectedCode(option.code);
    if (option.status !== "live" || !option.registerPath) return;
    setConfirmOpen(true);
  };

  const goToOnboarding = () => {
    const path = selected?.registerPath;
    setConfirmOpen(false);
    if (path) navigate(path);
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-16 md:pb-0">
      <Header />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
            <Handshake className="h-3.5 w-3.5" />
            {t("partner.badge")}
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">{t("partner.title")}</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            {t("partner.subtitle")}
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t("partner.type")}</h2>
            <Badge variant="secondary" className="font-normal">
              {PARTNER_SIGNUP_OPTIONS.filter((o) => o.status === "live").length} {t("partner.live")}
            </Badge>
          </div>

          <div className="grid gap-3">
            {PARTNER_SIGNUP_OPTIONS.filter((o) => o.status === "live").map((option) => {
              const Icon = option.icon;
              const isSelected = selectedCode === option.code;
              const isLive = option.status === "live";

              return (
                <div
                  key={option.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedCode(option.code);
                    if (isLive) requestContinue(option);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCode(option.code);
                      if (isLive) requestContinue(option);
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border p-4 transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-lg shrink-0", option.accentClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base">{option.name}</span>
                        {option.code === "EMITRA" && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                aria-label={t("partner.emitraInfoAria")}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-[22rem] sm:w-96 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="border-b px-3 py-2.5">
                                <p className="text-sm font-semibold">{t("partner.emitraInfoTitle")}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {t("partner.emitraInfoHint")}
                                </p>
                              </div>
                              <ul className="max-h-72 overflow-y-auto divide-y">
                                {EMITRA_STATE_BRANDS.map((row) => (
                                  <li key={row.stateEn} className="px-3 py-2">
                                    <p className="text-xs text-muted-foreground">
                                      {locale === "hi" ? row.stateHi : row.stateEn}
                                    </p>
                                    <p className="text-sm font-medium leading-snug">{row.brand}</p>
                                  </li>
                                ))}
                              </ul>
                            </PopoverContent>
                          </Popover>
                        )}
                        <Badge className="h-5 text-[10px]">{t("partner.available")}</Badge>
                        {option.code === DEFAULT_PARTNER_SIGNUP_CODE && (
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            {t("partner.default")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {option.shortDescription}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => navigate("/")}>
              {t("partner.cancel")}
            </Button>
            <Button
              disabled={selected.status !== "live"}
              onClick={() => selected && requestContinue(selected)}
              className="gap-1.5"
            >
              {t("partner.continue", { name: selected.name })}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("partner.already")}{" "}
            <Link to="/partner/login" className="text-primary hover:underline font-medium">
              {t("partner.signIn")}
            </Link>
          </p>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Handshake className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center">
              {t("partner.confirmTitle", { name: selected?.name ?? "Partner" })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t("partner.confirmBody", { name: selected?.name ?? "partner" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel>{t("partner.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={goToOnboarding}>{t("partner.confirmCta")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
