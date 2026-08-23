import { Link, useNavigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ArrowRight, Home } from "lucide-react";

const dashboardForRole: Record<AppRole, { path: string; label: string }> = {
  worker: { path: "/worker/dashboard", label: "Worker Dashboard" },
  employer: { path: "/employer/dashboard", label: "Employer Dashboard" },
  admin: { path: "/admin/dashboard", label: "Admin Dashboard" },
  partner: { path: "/emitra/dashboard", label: "E-Mitra Dashboard" },
  interviewer: { path: "/interviewer/queue", label: "Interviewer Queue" },
};

export default function AccessDenied() {
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const target = role ? dashboardForRole[role] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated
                ? `Your account is registered as a ${role ?? "user"} and can't access this area. Each email is tied to one role only.`
                : "You need to sign in to access this area."}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {target ? (
              <Button onClick={() => navigate(target.path, { replace: true })} className="w-full gap-2">
                Go to {target.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/worker/login", { replace: true })} className="w-full">
                Sign in
              </Button>
            )}
            <Link to="/">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
