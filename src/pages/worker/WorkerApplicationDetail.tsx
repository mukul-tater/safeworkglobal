import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Building2
} from "lucide-react";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface ApplicationData {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  notes: string | null;
}

interface JobData {
  id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  benefits: string | null;
  requirements: string | null;
  responsibilities: string | null;
  employer_id: string;
}

interface EmployerProfile {
  company_name: string | null;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function WorkerApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && applicationId) {
      loadApplicationData();
    }
  }, [user, applicationId]);

  const loadApplicationData = async () => {
    try {
      // Fetch application
      const { data: appData, error: appError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", applicationId)
        .eq("worker_id", user?.id)
        .single();

      if (appError) throw appError;
      setApplication(appData);

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", appData.job_id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch employer profile
      const { data: empData } = await supabase
        .from("employer_profiles")
        .select("company_name")
        .eq("user_id", jobData.employer_id)
        .single();

      setEmployer(empData);

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from("application_status_history")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });

      if (!historyError && historyData) {
        setStatusHistory(historyData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "default";
      case "REVIEWING": return "secondary";
      case "APPROVED": 
      case "SHORTLISTED":
      case "OFFERED":
      case "HIRED": return "default";
      case "INTERVIEWED": return "secondary";
      case "REJECTED": return "destructive";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "REJECTED": return <XCircle className="h-5 w-5 text-destructive" />;
      case "HIRED": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "APPROVED":
      case "OFFERED": return <CheckCircle2 className="h-5 w-5 text-primary" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return "Not specified";
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    return `Up to ${currency} ${max?.toLocaleString()}`;
  };

  if (loading) {
    return (
      <WorkerPortalLayout>
            <div className="text-center">Loading application details...</div>
          </WorkerPortalLayout>
    );
  }

  if (!application || !job) {
    return (
      <WorkerPortalLayout>
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Application Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This application does not exist or you don't have access to it.
              </p>
              <Button asChild>
                <Link to="/worker/applications">Back to Applications</Link>
              </Button>
            </Card>
          </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
          <PortalBreadcrumb />
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/worker/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>

          {/* Application Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Building2 className="h-4 w-4" />
                  <span>{employer?.company_name || "Company"}</span>
                  <span>•</span>
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}, {job.country}</span>
                </div>
              </div>
              <Badge variant={getStatusColor(application.status)} className="text-sm px-3 py-1">
                {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Applied {format(new Date(application.applied_at), "MMMM d, yyyy")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Job Details</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{job.job_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatSalary(job.salary_min, job.salary_max, job.currency)}</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
                  </div>
                  
                  {job.requirements && (
                    <div>
                      <h3 className="font-medium mb-2">Requirements</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                    </div>
                  )}
                  
                  {job.responsibilities && (
                    <div>
                      <h3 className="font-medium mb-2">Responsibilities</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{job.responsibilities}</p>
                    </div>
                  )}
                  
                  {job.benefits && (
                    <div>
                      <h3 className="font-medium mb-2">Benefits</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{job.benefits}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Cover Letter */}
              {application.cover_letter && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Cover Letter</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {application.cover_letter}
                  </p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Timeline */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Application Timeline</h2>
                <div className="space-y-4">
                  {/* Initial application */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      {(statusHistory.length > 0 || application.status !== "PENDING") && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">Application Submitted</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(application.applied_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>

                  {/* Status history */}
                  {statusHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {getStatusIcon(history.status)}
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">
                          {history.status.charAt(0) + history.status.slice(1).toLowerCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(history.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Current status if no history */}
                  {statusHistory.length === 0 && application.status !== "PENDING" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {getStatusIcon(application.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(application.updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Employer Notes (if any) */}
              {application.notes && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Notes from Employer</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {application.notes}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </WorkerPortalLayout>
  );
}
