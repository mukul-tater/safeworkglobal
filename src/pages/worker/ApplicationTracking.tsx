import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Clock, CheckCircle2, XCircle, Calendar,
  MapPin, Briefcase, AlertCircle, Plane, FileCheck,
  Shield, Heart, FileSignature
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface Application {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  jobs: {
    title: string;
    location: string;
    country: string;
  };
  application_status_history: {
    status: string;
    notes: string | null;
    created_at: string;
  }[];
  job_formalities: {
    id: string;
    visa_status: string;
    visa_required: boolean;
    ecr_check_status: string;
    ecr_check_required: boolean;
    medical_exam_status: string;
    medical_exam_required: boolean;
    police_verification_status: string;
    police_verification_required: boolean;
    contract_signed: boolean;
    flight_booking_status: string;
    completion_percentage: number;
    overall_status: string;
    expected_joining_date: string | null;
  }[];
}

export default function ApplicationTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      // Fetch applications first
      const { data: appsData, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          application_status_history (status, notes, created_at),
          job_formalities (*)
        `)
        .eq('worker_id', user?.id)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      if (!appsData || appsData.length === 0) {
        setApplications([]);
        return;
      }

      // Fetch jobs separately
      const jobIds = appsData.map(app => app.job_id);
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, location, country')
        .in('id', jobIds);

      if (jobsError) throw jobsError;

      // Combine data
      const enrichedApps = appsData.map(app => ({
        ...app,
        jobs: jobsData?.find(job => job.id === app.job_id) || { title: 'Unknown Job', location: '', country: '' }
      }));

      setApplications(enrichedApps as any);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      APPROVED: 'bg-green-500',
      REJECTED: 'bg-red-500',
      SHORTLISTED: 'bg-blue-500',
      INTERVIEWING: 'bg-purple-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      PENDING: Clock,
      APPROVED: CheckCircle2,
      REJECTED: XCircle,
      SHORTLISTED: FileCheck,
      INTERVIEWING: AlertCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getFormalityStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NOT_STARTED: 'outline',
      IN_PROGRESS: 'secondary',
      COMPLETED: 'default',
      REJECTED: 'destructive',
    };
    return colors[status] || 'outline';
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return app.status === 'PENDING';
    if (activeTab === 'approved') return app.status === 'APPROVED';
    if (activeTab === 'formalities') return app.job_formalities && app.job_formalities.length > 0;
    return true;
  });

  if (loading) {
    return (
      <WorkerPortalLayout>
            <p>Loading applications...</p>
          </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
          <PortalBreadcrumb />
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Application Tracking</h1>
            <p className="text-muted-foreground">
              Track your job applications and post-approval formalities
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Applications</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="formalities">Post-Approval</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredApplications.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start applying to jobs to track your applications here
                  </p>
                  <Link to="/jobs">
                    <Button>Browse Jobs</Button>
                  </Link>
                </Card>
              ) : (
                filteredApplications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">
                            {application.jobs.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {application.jobs.location}, {application.jobs.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Badge variant={application.status === 'APPROVED' ? 'default' : 'secondary'} className="gap-1">
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {/* Status Timeline */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Application Timeline
                        </h4>
                        <div className="space-y-3">
                          {application.application_status_history && application.application_status_history.length > 0 ? (
                            application.application_status_history
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .map((history, index) => (
                                <div key={index} className="flex items-start gap-3">
                                  <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(history.status)}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {history.status}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(history.created_at), 'MMM d, yyyy h:mm a')}
                                      </span>
                                    </div>
                                    {history.notes && (
                                      <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                                    )}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(application.status)}`} />
                              <div className="flex-1">
                                <Badge variant="outline" className="text-xs">
                                  {application.status}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Application submitted on {format(new Date(application.applied_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post-Approval Formalities */}
                      {application.status === 'APPROVED' && application.job_formalities && application.job_formalities.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <FileCheck className="h-4 w-4" />
                              Post-Approval Formalities
                            </h4>
                            
                            {application.job_formalities.map((formality) => (
                              <div key={formality.id} className="space-y-4">
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Overall Progress</span>
                                    <span className="text-sm text-muted-foreground">
                                      {formality.completion_percentage}%
                                    </span>
                                  </div>
                                  <Progress value={formality.completion_percentage} className="h-2" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Visa Status */}
                                  {formality.visa_required && (
                                    <Card className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Plane className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Visa Processing</span>
                                      </div>
                                      <Badge variant={getFormalityStatusColor(formality.visa_status)}>
                                        {formality.visa_status.replace('_', ' ')}
                                      </Badge>
                                    </Card>
                                  )}

                                  {/* ECR Check */}
                                  {formality.ecr_check_required && (
                                    <Card className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        <span className="font-medium">ECR Clearance</span>
                                      </div>
                                      <Badge variant={getFormalityStatusColor(formality.ecr_check_status)}>
                                        {formality.ecr_check_status.replace('_', ' ')}
                                      </Badge>
                                    </Card>
                                  )}

                                  {/* Medical Exam */}
                                  {formality.medical_exam_required && (
                                    <Card className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Heart className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Medical Examination</span>
                                      </div>
                                      <Badge variant={getFormalityStatusColor(formality.medical_exam_status)}>
                                        {formality.medical_exam_status.replace('_', ' ')}
                                      </Badge>
                                    </Card>
                                  )}

                                  {/* Police Verification */}
                                  {formality.police_verification_required && (
                                    <Card className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Police Verification</span>
                                      </div>
                                      <Badge variant={getFormalityStatusColor(formality.police_verification_status)}>
                                        {formality.police_verification_status.replace('_', ' ')}
                                      </Badge>
                                    </Card>
                                  )}

                                  {/* Contract */}
                                  <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileSignature className="h-4 w-4 text-primary" />
                                      <span className="font-medium">Contract</span>
                                    </div>
                                    <Badge variant={formality.contract_signed ? 'default' : 'outline'}>
                                      {formality.contract_signed ? 'SIGNED' : 'PENDING'}
                                    </Badge>
                                  </Card>

                                  {/* Flight Booking */}
                                  <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Plane className="h-4 w-4 text-primary" />
                                      <span className="font-medium">Travel Arrangements</span>
                                    </div>
                                    <Badge variant={getFormalityStatusColor(formality.flight_booking_status)}>
                                      {formality.flight_booking_status.replace('_', ' ')}
                                    </Badge>
                                  </Card>
                                </div>

                                {formality.expected_joining_date && (
                                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Expected Joining Date: {format(new Date(formality.expected_joining_date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </WorkerPortalLayout>
  );
}
