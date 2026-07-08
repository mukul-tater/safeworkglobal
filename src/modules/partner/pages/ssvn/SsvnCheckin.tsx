import { useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SsvnCheckin() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const checkin = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from("assessments")
      .update({ status: "checked_in" })
      .eq("id", code.trim())
      .select();
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Candidate checked in");
    setCode("");
  };

  return (
    <PartnerLayout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Candidate Check-in</h1>
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Assessment ID / QR Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste assessment id" />
          </div>
          <Button className="w-full" onClick={checkin} disabled={busy}>
            {busy ? "Checking in..." : "Check in candidate"}
          </Button>
        </Card>
      </div>
    </PartnerLayout>
  );
}
