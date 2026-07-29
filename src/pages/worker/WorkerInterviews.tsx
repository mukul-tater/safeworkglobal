import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, Phone, MapPin, Building2, Briefcase, User, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isAfter } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/lib/calendar-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
interface Interview {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  interview_mode: string;
  status: string;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  feedback: string | null;
  job_title?: string;
  company_name?: string;
  employer_name?: string;
}

export default function WorkerInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      
      // Fetch interviews for the worker
      const { data: interviewsData, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("worker_id", user?.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      // Fetch related data separately since no FK relationships exist
      const jobIds = [...new Set((interviewsData || []).map(i => i.job_id))];
      const employerIds = [...new Set((interviewsData || []).map(i => i.employer_id))];

      const [jobsResult, employerProfilesResult, profilesResult] = await Promise.all([
        jobIds.length > 0 
          ? supabase.from("jobs").select("id, title").in("id", jobIds)
          : { data: [] },
        employerIds.length > 0
          ? supabase.from("employer_profiles").select("user_id, company_name").in("user_id", employerIds)
          : { data: [] },
        employerIds.length > 0
          ? supabase.from("profiles").select("id, full_name").in("id", employerIds)
          : { data: [] },
      ]);

      const jobsMap = new Map((jobsResult.data || []).map(j => [j.id, j]));
      const employerProfilesMap = new Map((employerProfilesResult.data || []).map(e => [e.user_id, e]));
      const profilesMap = new Map((profilesResult.data || []).map(p => [p.id, p]));

      const formattedInterviews = (interviewsData || []).map((interview: any) => ({
        ...interview,
        job_title: jobsMap.get(interview.job_id)?.title || "Unknown Job",
        company_name: employerProfilesMap.get(interview.employer_id)?.company_name || "Unknown Company",
        employer_name: profilesMap.get(interview.employer_id)?.full_name || "Unknown",
      }));

      setInterviews(formattedInterviews);
    } catch (error: any) {
      console.error("Error fetching interviews:", error);
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <Badge className={styles[status] || "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    );
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "PHONE":
        return <Phone className="h-4 w-4" />;
      case "IN_PERSON":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const now = new Date();
  const upcomingInterviews = interviews.filter(
    (i) => i.status === "SCHEDULED" && isAfter(parseISO(i.scheduled_date), now)
  );
  const pastInterviews = interviews.filter(
    (i) => i.status === "COMPLETED" || !isAfter(parseISO(i.scheduled_date), now)
  );

  const handleAddToGoogleCalendar = (interview: Interview) => {
    const url = generateGoogleCalendarUrl({
      title: `Interview: ${interview.job_title} at ${interview.company_name}`,
      description: `Interview for ${interview.job_title} position at ${interview.company_name}.\n\nMode: ${interview.interview_mode}\n${interview.meeting_link ? `Meeting Link: ${interview.meeting_link}` : ""}${interview.notes ? `\n\nNotes: ${interview.notes}` : ""}`,
      location: interview.interview_mode === "IN_PERSON" ? interview.location || "" : interview.meeting_link || "",
      startDate: interview.scheduled_date,
      startTime: interview.scheduled_time,
      durationMinutes: interview.duration_minutes,
    });
    window.open(url, "_blank");
  };

  const handleDownloadICS = (interview: Interview) => {
    downloadICSFile(
      {
        title: `Interview: ${interview.job_title} at ${interview.company_name}`,
        description: `Interview for ${interview.job_title} position at ${interview.company_name}.\n\nMode: ${interview.interview_mode}\n${interview.meeting_link ? `Meeting Link: ${interview.meeting_link}` : ""}${interview.notes ? `\n\nNotes: ${interview.notes}` : ""}`,
        location: interview.interview_mode === "IN_PERSON" ? interview.location || "" : interview.meeting_link || "",
        startDate: interview.scheduled_date,
        startTime: interview.scheduled_time,
        durationMinutes: interview.duration_minutes,
      },
      `interview-${interview.job_title?.replace(/\s+/g, "-").toLowerCase()}.ics`
    );
    toast({
      title: "Downloaded",
      description: "Calendar file downloaded. Open it to add to Outlook or Apple Calendar.",
    });
  };

  const renderInterviewCard = (interview: Interview) => (
    <Card key={interview.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{interview.job_title}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{interview.company_name}</span>
            </div>
          </div>
          {getStatusBadge(interview.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(parseISO(interview.scheduled_date), "PPP")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{interview.scheduled_time} ({interview.duration_minutes} min)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {getModeIcon(interview.interview_mode)}
          <span className="capitalize">{interview.interview_mode.toLowerCase().replace("_", " ")} Interview</span>
        </div>

        {interview.interview_mode === "IN_PERSON" && interview.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{interview.location}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {interview.interview_mode === "VIDEO" && interview.meeting_link && interview.status === "SCHEDULED" && (
            <Button asChild size="sm">
              <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </a>
            </Button>
          )}

          {interview.status === "SCHEDULED" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleAddToGoogleCalendar(interview)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadICS(interview)}>
                  <Download className="h-4 w-4 mr-2" />
                  Outlook / Apple Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {interview.notes && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">{interview.notes}</p>
          </div>
        )}

        {interview.feedback && interview.status === "COMPLETED" && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Feedback</p>
            <p className="text-sm text-green-700 dark:text-green-400">{interview.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <WorkerPortalLayout>
            <LoadingSpinner />
          </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
          <PortalBreadcrumb />
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">My Interviews</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your scheduled interviews
            </p>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingInterviews.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastInterviews.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({interviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Interviews</h3>
                  <p className="text-muted-foreground">
                    You don't have any scheduled interviews at the moment.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingInterviews.map(renderInterviewCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastInterviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Past Interviews</h3>
                  <p className="text-muted-foreground">
                    You haven't completed any interviews yet.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pastInterviews.map(renderInterviewCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {interviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Interviews</h3>
                  <p className="text-muted-foreground">
                    Apply for jobs to get interview invitations.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {interviews.map(renderInterviewCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </WorkerPortalLayout>
  );
}
