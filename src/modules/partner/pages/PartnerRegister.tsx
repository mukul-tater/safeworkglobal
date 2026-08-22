import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import SEOHead from "@/components/SEOHead";
import FormStepPills from "@/components/FormStepPills";
import HindiText from "@/components/indian-workforce/HindiText";
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
  const [emitraInfoOpen, setEmitraInfoOpen] = useState(false);
  const [emitraBrandName, setEmitraBrandName] = useState<string | null>(null);

  const selected = useMemo(
    () => getPartnerSignupOption(selectedCode) ?? PARTNER_SIGNUP_OPTIONS[0],
    [selectedCode],
  );

  const continueName =
    selected.code === "EMITRA" && emitraBrandName ? emitraBrandName : selected.name;

  const requestContinue = (option: PartnerSignupOption, brandName?: string | null) => {
    setSelectedCode(option.code);
    if (option.code !== "EMITRA") {
      setEmitraBrandName(null);
    } else if (brandName !== undefined) {
      setEmitraBrandName(brandName);
    }
    if (option.status !== "live" || !option.registerPath) return;
    setConfirmOpen(true);
  };

  const chooseEmitraState = (brand: string) => {
    setEmitraInfoOpen(false);
    const emitra = getPartnerSignupOption("EMITRA");
    if (!emitra) return;
    // Close the info popover before opening the confirm dialog so focus traps don't clash.
    window.setTimeout(() => requestContinue(emitra, brand), 0);
  };

  const goToOnboarding = () => {
    const path = selected?.registerPath;
    setConfirmOpen(false);
    if (path) navigate(path);
  };

  return (
    <>
      <SEOHead
        title="Partner Registration | SafeWork Global"
        description="Apply to join the SafeWork Global partner network as E-Mitra, a trade test centre, ITI, licensed recruitment agency or consultant."
      />
      <AuthSplitLayout
        audience="partner"
        maxWidthClassName="max-w-[480px]"
        centerVertically={false}
      >
        <div className="mb-5">
          <FormStepPills
            current={1}
            total={3}
            label={t("partner.stepOf", { current: 1, total: 3 })}
          />
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                {t("partner.chooseTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("partner.chooseHint")}</p>
            </div>
            <Badge variant="secondary" className="mt-1 shrink-0 font-normal">
              {PARTNER_SIGNUP_OPTIONS.filter((o) => o.status === "live").length} {t("partner.live")}
            </Badge>
          </div>
        </div>

        <div className="grid gap-2">
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
                  "w-full cursor-pointer rounded-xl border px-3 py-3 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("shrink-0 rounded-lg p-2", option.accentClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold">{option.name}</span>
                      {option.code === "EMITRA" && (
                        <Popover open={emitraInfoOpen} onOpenChange={setEmitraInfoOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              aria-label={t("partner.emitraInfoAria")}
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-[22rem] p-0 sm:w-96"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <div className="border-b px-3 py-2.5">
                              <p className="text-sm font-medium leading-snug text-foreground">
                                CSC Centres are spread across India and may operate under different
                                regional names in different states. We have provided a state-wise
                                list of the corresponding kiosk names for easy reference.
                              </p>
                              <HindiText className="mt-1.5 text-xs leading-snug text-muted-foreground">
                                CSC केंद्र पूरे भारत में फैले हुए हैं और अलग-अलग राज्यों में इनके
                                क्षेत्रीय नाम अलग हो सकते हैं। आपकी सुविधा के लिए हमने राज्यों के
                                अनुसार संबंधित Kiosk के नामों की सूची उपलब्ध कराई है।
                              </HindiText>
                            </div>
                            <ul className="max-h-72 divide-y overflow-y-auto">
                              {EMITRA_STATE_BRANDS.map((row) => {
                                const isActive = emitraBrandName === row.brand;
                                return (
                                  <li key={row.stateEn}>
                                    <button
                                      type="button"
                                      className={cn(
                                        "w-full px-3 py-2 text-left transition-colors hover:bg-primary/5",
                                        isActive && "bg-primary/5",
                                      )}
                                      aria-label={`${row.stateEn}: ${row.brand}`}
                                      onClick={() => chooseEmitraState(row.brand)}
                                    >
                                      <p className="text-xs text-muted-foreground">
                                        {locale === "hi" ? row.stateHi : row.stateEn}
                                      </p>
                                      <p className="text-sm font-medium leading-snug">{row.brand}</p>
                                    </button>
                                  </li>
                                );
                              })}
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
                    <p className="mt-0.5 text-xs text-muted-foreground">{option.shortDescription}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          disabled={selected.status !== "live"}
          onClick={() => selected && requestContinue(selected)}
          className="mt-5 h-11 w-full gap-1.5 bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
        >
          {t("partner.continue", { name: continueName })}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="pt-4 text-center text-sm text-muted-foreground">
          {t("partner.already")}{" "}
          <Link to="/partner/login" className="font-medium text-primary hover:underline">
            {t("partner.signIn")}
          </Link>
        </p>
      </AuthSplitLayout>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Handshake className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center">
              {t("partner.confirmTitle", { name: continueName })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t("partner.confirmBody", { name: continueName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-center">
            <AlertDialogCancel>{t("partner.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={goToOnboarding}>{t("partner.confirmCta")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
