import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  flagged_by: string;
  created_at: string;
}

export default function AdminContentModeration() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFlags(); }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("content_flags")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFlags(((data || []) as Array<Record<string, unknown>>).map((d) => ({
        id: d.id as string,
        content_type: d.content_type as string,
        content_id: d.content_id as string,
        reason: (d.flag_reason as string) ?? (d.description as string) ?? "",
        status: d.status as string,
        flagged_by: d.flagged_by as string,
        created_at: d.created_at as string,
      })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load content flags");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("content_flags").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Flag marked as ${status}`);
      fetchFlags();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update flag");
    }
  };

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Content Moderation</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Review flagged content across the platform — {flags.length} total flags
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : flags.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-40" />
          No content flags to review
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <Card key={f.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{f.content_type}</Badge>
                    <Badge variant={f.status === "open" ? "destructive" : "secondary"}>{f.status}</Badge>
                  </div>
                  <p className="font-medium">{f.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Content ID: {f.content_id} · {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
                {f.status === "open" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleResolve(f.id, "resolved")}>Resolve</Button>
                    <Button variant="outline" size="sm" onClick={() => handleResolve(f.id, "dismissed")}>Dismiss</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
