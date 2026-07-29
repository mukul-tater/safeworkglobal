import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  derivePlacementStatuses,
  type PlacementStepId,
  type PlacementStepStatus,
} from "@/components/worker/WorkerPlacementProgress";

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
 * Derives the 13-step home progress from profile, docs, applications,
 * interviews, offers, and formalities. Steps without pipeline data yet
 * stay waiting after the first incomplete gate.
 */
export function useWorkerPlacementProgress(): {
  loading: boolean;
  statuses: Record<PlacementStepId, PlacementStepStatus>;
} {
  const { user, profile } = useAuth();
  const [flags, setFlags] = useState<PlacementFlags>(EMPTY_FLAGS);
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
        ]);

        if (cancelled) return;

        const apps = appsRes.data ?? [];
        const interviews = interviewsRes.data ?? [];
        const offers = offersRes.data ?? [];
        const formalities = formalitiesRes.data ?? [];

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
          const v = String(f.visa_status || "").toLowerCase();
          return Boolean(v) && v !== "not_required" && v !== "none";
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
          Boolean(user);

        const hasDocs = (docsRes.count ?? 0) > 0;

        // Early pipeline steps (screening → skill) are not fully wired yet;
        // mark documents as the live gate, then unlock later stages from hiring data.
        setFlags({
          registration: registered,
          documents: hasDocs,
          screening: false,
          tech_interview: false,
          trade_test: false,
          skill_verified: false,
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

  return { loading, statuses };
}
