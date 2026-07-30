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
import { ArrowRight, Handshake, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PARTNER_SIGNUP_CODE,
  PARTNER_SIGNUP_OPTIONS,
  getPartnerSignupOption,
  type PartnerSignupOption,
} from "@/modules/partner/config/partnerSignupOptions";

/**
 * Partner signup hub — choose a partner type.
 * E-Mitra is live (redirects to /emitra/register after confirm).
 * Other types are listed as coming soon for future expansion.
 */
export default function PartnerRegister() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
            <Handshake className="h-3.5 w-3.5" />
            Partner network
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Become a SafeWork Partner</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Choose your partner type to continue. More partner programmes will open here as they go live.
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Partner type</h2>
            <Badge variant="secondary" className="font-normal">
              {PARTNER_SIGNUP_OPTIONS.filter((o) => o.status === "live").length} live
            </Badge>
          </div>

          <div className="grid gap-3">
            {PARTNER_SIGNUP_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedCode === option.code;
              const isLive = option.status === "live";

              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    setSelectedCode(option.code);
                    if (isLive) requestContinue(option);
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border p-4 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                      : "border-border hover:bg-muted/50",
                    !isLive && "opacity-75",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-lg shrink-0", option.accentClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base">{option.name}</span>
                        {isLive ? (
                          <Badge className="h-5 text-[10px]">Available</Badge>
                        ) : (
                          <Badge variant="outline" className="h-5 text-[10px]">
                            Coming soon
                          </Badge>
                        )}
                        {option.code === DEFAULT_PARTNER_SIGNUP_CODE && (
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {option.shortDescription}
                      </p>
                    </div>
                    {isSelected && isLive && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button
              disabled={selected.status !== "live"}
              onClick={() => selected && requestContinue(selected)}
              className="gap-1.5"
            >
              Continue as {selected.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Already a partner?{" "}
            <Link to="/emitra/login" className="text-primary hover:underline font-medium">
              Sign in
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
              Continue as {selected?.name ?? "Partner"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You will be redirected to the dedicated {selected?.name ?? "partner"} onboarding form
              to complete your application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={goToOnboarding}>Continue to Onboarding</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
