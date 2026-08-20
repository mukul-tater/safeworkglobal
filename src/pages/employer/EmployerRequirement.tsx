import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadEmployerRegistration, totalWorkers } from "@/services/employerRegistrationService";

export default function EmployerRequirement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referenceId, setReferenceId] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [model, setModel] = useState("");
  const [roles, setRoles] = useState<{ trade: string; workers: string }[]>([]);
  const [workers, setWorkers] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { draft } = await loadEmployerRegistration(user.id);
        setReferenceId(draft.referenceId);
        setCompany(draft.companyLegalName);
        setContact(draft.contactFullName);
        setEmail(draft.businessEmail);
        setPhone(draft.uaeMobile);
        setModel(draft.partnershipModel === "custom" ? "Customized terms" : "1% Employer Model");
        setRoles(
          draft.requirements.map((item) => ({
            trade: item.trade === "Other" ? item.customTrade || "Other" : item.trade,
            workers: item.numberOfWorkers,
          })),
        );
        setWorkers(totalWorkers(draft.requirements));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  return (
    <DashboardLayout
      navGroups={employerNavGroups}
      portalLabel="Employer Portal"
      portalName="Employer Portal"
      profileMenuItems={employerProfileMenu}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manpower Requirement</h1>
        <p className="text-sm text-muted-foreground">Submitted requirement for SafeWork coordination.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference ID</p>
            <p className="mt-1 font-mono text-lg font-semibold">{referenceId || "Not submitted yet"}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</p>
                <p className="font-medium">{company || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                <p className="font-medium">{contact || "—"}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <p className="text-sm text-muted-foreground">{phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commercial model</p>
                <p className="font-medium">{model}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total workers</p>
                <p className="font-medium">{workers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Roles requested</h2>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No manpower requirements on file.</p>
            ) : (
              <ul className="space-y-2">
                {roles.map((role, index) => (
                  <li key={`${role.trade}-${index}`} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="font-medium">
                      Requirement #{index + 1} · {role.trade}
                    </span>
                    <Badge variant="secondary">{role.workers} workers</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex gap-2">
            <Button asChild>
              <Link to="/employer/dashboard">Employer dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to SafeWork Global</Link>
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
