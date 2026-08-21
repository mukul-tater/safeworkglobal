import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutDashboard, Users, ClipboardCheck, Briefcase, CheckCircle2, IndianRupee,
  FileText, Bell, Store, Clock, ShieldAlert, ArrowRight, UserPlus, FileEdit,
} from "lucide-react";
import type { NavGroup } from "@/components/layout/DashboardSidebar";

const partnerNavGroups: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [
      { path: "/partner/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/partner/onboarding", icon: FileEdit, label: "My Application" },
    ],
  },
  {
    label: "Workers",
    defaultOpen: true,
    items: [
      { path: "/partner/add-worker", icon: UserPlus, label: "Add Worker" },
      { path: "/partner/dashboard", icon: Users, label: "My Workers" },
    ],
  },
  {
    label: "Earnings",
    items: [
      { path: "/partner/dashboard", icon: IndianRupee, label: "Earnings" },
      { path: "/partner/dashboard", icon: FileText, label: "Documents" },
      { path: "/partner/dashboard", icon: Bell, label: "Notifications" },
    ],
  },
];

const partnerProfileMenu = [
  { label: "My Application", icon: FileEdit, path: "/partner/onboarding" },
];

const STATUS_META: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  applied: { label: "Application In Progress", tone: "outline", description: "Continue and submit your application to start the review." },
  under_review: { label: "Under Review", tone: "secondary", description: "Our team is reviewing your application. You'll be notified when approved." },
  approved: { label: "Approved", tone: "default", description: "Welcome aboard! Your partner account is approved." },
  active: { label: "Active Partner", tone: "default", description: "Your center is live and ready to register workers." },
  suspended: { label: "Suspended", tone: "destructive", description: "Your account is temporarily suspended. Contact support for details." },
  rejected: { label: "Rejected", tone: "destructive", description: "Your application was not approved. See reason below." },
};

export default function PartnerDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setRow(data);
      // If not yet submitted, force them to finish onboarding first.
      if (!data || !data.submitted_at) {
        navigate("/partner/onboarding", { replace: true });
        return;
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  if (loading || !row) {
    return (
      <DashboardLayout navGroups={partnerNavGroups} portalLabel="Partner Portal" portalName="Partner Portal" profileMenuItems={partnerProfileMenu}>
        <div className="py-12 text-center text-muted-foreground">Loading your dashboard…</div>
      </DashboardLayout>
    );
  }

  const status = (row.status || "applied") as keyof typeof STATUS_META;
  const meta = STATUS_META[status];
  const operational = status === "approved" || status === "active";

  const stats = [
    { label: "Workers Registered", value: 0, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Workers Verified", value: 0, icon: ClipboardCheck, color: "text-success bg-success/10" },
    { label: "Interviews", value: 0, icon: Briefcase, color: "text-warning bg-warning/10" },
    { label: "Workers Placed", value: 0, icon: CheckCircle2, color: "text-success bg-success/10" },
  ];

  return (
    <DashboardLayout navGroups={partnerNavGroups} portalLabel="Partner Portal" portalName="Partner Portal" profileMenuItems={partnerProfileMenu}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome, {profile?.full_name?.split(" ")[0] || "Partner"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={meta.tone}>{meta.label}</Badge>
            {row.center_name && <span className="text-sm text-muted-foreground flex items-center gap-1"><Store className="h-3.5 w-3.5" /> {row.center_name}</span>}
          </div>
        </div>
        {!operational && (
          <Button variant="outline" asChild>
            <Link to="/partner/onboarding">View Application</Link>
          </Button>
        )}
        {status !== "rejected" && status !== "suspended" && (
          <Button asChild>
            <Link to="/partner/add-worker">
              <UserPlus className="h-4 w-4 mr-1" /> Add Worker
            </Link>
          </Button>
        )}
      </div>

      {!operational && (
        <Alert className="mb-6">
          {status === "rejected" || status === "suspended" ? <ShieldAlert className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <AlertTitle>{meta.label}</AlertTitle>
          <AlertDescription>
            {meta.description}
            {row.rejection_reason && (
              <div className="mt-2 text-sm"><span className="font-medium">Reason:</span> {row.rejection_reason}</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold font-heading">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No worker registrations yet</p>
              <p className="text-xs mt-1">Use Add Worker to register a candidate on the independent worker journey.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Earnings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Registration incentives", value: "₹0" },
              { label: "Verification incentives", value: "₹0" },
              { label: "Placement incentives", value: "₹0" },
            ].map(e => (
              <div key={e.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{e.label}</span>
                <span className="font-medium">{e.value}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-semibold">Total Earnings</span>
              <span className="font-bold">₹0</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">Payouts coming soon</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2">
          {(status !== "rejected" && status !== "suspended") && (
            <Button variant="outline" asChild className="justify-between h-11">
              <Link to="/partner/add-worker">
                <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Add Worker</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="justify-between h-11">
            <Link to="/partner/onboarding">
              <span className="flex items-center gap-2"><FileEdit className="h-4 w-4" /> View My Application</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}