import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  derivePlacementStatuses,
  type PlacementStepId,
  type PlacementStepStatus,
} from "@/components/worker/placementJourney";

interface PlacementFlags {
  registration: boolean;
  documents: boolean;
  screening: boolean;
  tech_interview: boolean;
  trade_test: boolean;
  skill_verified: boolean;
  employer_matched: boolean;
  interview_scheduled: boolean;
  selected: boolean;
  offer_letter: boolean;
  visa: boolean;
  ready_to_fly: boolean;
  deployed: boolean;
}

const EMPTY_FLAGS: PlacementFlags = {
  registration: false,
  documents: false,
  screening: false,
  tech_interview: false,
  trade_test: false,
  skill_verified: false,
  employer_matched: false,
  interview_scheduled: false,
  selected: false,
  offer_letter: false,
  visa: false,
  ready_to_fly: false,
  deployed: false,
};

/**
 * Derives 13-step home progress from worker_verification + hiring tables.
 */
export function useWorkerPlacementProgress(): {
  loading: boolean;
  statuses: Record<PlacementStepId, PlacementStepStatus>;
  journeyIncomplete: boolean;
} {
  const { user, profile } = useAuth();
  const [flags, setFlags] = useState<PlacementFlags>(EMPTY_FLAGS);
  const [journeyIncomplete, setJourneyIncomplete] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.id || profile?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [
          profileRes,
          docsRes,
          appsRes,
          interviewsRes,
          offersRes,
          formalitiesRes,
          verificationRes,
        ] = await Promise.all([
          supabase
            .from("worker_profiles")
            .select("onboarding_completed")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase
            .from("worker_documents")
            .select("id", { count: "exact", head: true })
            .eq("worker_id", uid),
          supabase
            .from("job_applications")
            .select("id, status")
            .eq("worker_id", uid),
          supabase
            .from("interviews")
            .select("id, status")
            .eq("worker_id", uid),
          supabase
            .from("offers")
            .select("id, status")
            .eq("worker_id", uid),
          supabase
            .from("job_formalities")
            .select(
              "visa_status, flight_booking_status, arrival_date, departure_date, overall_status",
            )
            .eq("worker_id", uid),
          (supabase as any)
            .from("worker_verification")
            .select(
              "stage, essentials_completed_at, quiz_completed_at, media_submitted_at, interview_score, trade_test_required, trade_test_status, medical_status, payment_status, bond_status, gcc_ready_at",
            )
            .eq("user_id", uid)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const apps = appsRes.data ?? [];
        const interviews = interviewsRes.data ?? [];
        const offers = offersRes.data ?? [];
        const formalities = formalitiesRes.data ?? [];
        const v = verificationRes.data;

        const selectedStatuses = new Set([
          "selected",
          "accepted",
          "hired",
          "offer",
          "shortlisted",
        ]);
        const hasSelected = apps.some((a) =>
          selectedStatuses.has(String(a.status || "").toLowerCase()),
        );
        const hasInterview = interviews.length > 0;
        const hasOffer = offers.length > 0;
        const visaInProgress = formalities.some((f) => {
          const vs = String(f.visa_status || "").toLowerCase();
          return Boolean(vs) && vs !== "not_required" && vs !== "none";
        });
        const readyToFly = formalities.some((f) => {
          const flight = String(f.flight_booking_status || "").toLowerCase();
          return (
            Boolean(f.departure_date) ||
            flight.includes("booked") ||
            flight.includes("confirmed") ||
            flight === "ready"
          );
        });
        const deployed = formalities.some(
          (f) =>
            Boolean(f.arrival_date) ||
            String(f.overall_status || "").toLowerCase() === "completed" ||
            String(f.overall_status || "").toLowerCase() === "deployed",
        );

        const registered =
          Boolean(profileRes.data?.onboarding_completed) ||
          Boolean(profile?.full_name?.trim()) ||
          Boolean(user) ||
          Boolean(v?.essentials_completed_at);

        const hasDocs = (docsRes.count ?? 0) > 0;
        const screeningDone = Boolean(v?.quiz_completed_at);
        const techDone = v?.interview_score != null;
        const tradeDone =
          v?.trade_test_status === "passed" ||
          v?.trade_test_status === "not_required" ||
          (v?.trade_test_required === false && techDone);
        const skillVerified =
          Boolean(v?.gcc_ready_at) ||
          (Boolean(v?.medical_status === "passed") && Boolean(tradeDone));

        setJourneyIncomplete(!v || v.stage !== "gcc_ready");

        setFlags({
          registration: registered,
          documents: hasDocs || Boolean(v?.essentials_completed_at),
          screening: screeningDone,
          tech_interview: techDone,
          trade_test: Boolean(tradeDone),
          skill_verified: skillVerified,
          employer_matched: apps.length > 0,
          interview_scheduled: hasInterview,
          selected: hasSelected,
          offer_letter: hasOffer,
          visa: visaInProgress,
          ready_to_fly: readyToFly,
          deployed,
        });
      } catch {
        if (!cancelled) {
          setFlags({
            ...EMPTY_FLAGS,
            registration: Boolean(user),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.id, profile?.full_name, user]);

  const statuses = useMemo(() => derivePlacementStatuses(flags), [flags]);

  return { loading, statuses, journeyIncomplete };
}
