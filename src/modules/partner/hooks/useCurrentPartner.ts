import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentPartner {
  id: string;
  partner_type_id: string;
  partner_type_code: string;
  partner_type_name: string;
  partner_code: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  verification_status: "unverified" | "in_review" | "verified" | "rejected";
  state: string | null;
  district: string | null;
  city: string | null;
  rating: number | null;
  company_name: string | null;
  wallet_available: number;
  wallet_pending: number;
}

export function useCurrentPartner() {
  const [partner, setPartner] = useState<CurrentPartner | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("current_partner");
    if (!error && data && data.length > 0) {
      setPartner(data[0] as CurrentPartner);
    } else {
      setPartner(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { partner, loading, refetch };
}
