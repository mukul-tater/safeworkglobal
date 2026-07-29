import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Video, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface Interview {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  interview_mode: string;
  status: string;
  location: string | null;
  meeting_link: string | null;
  duration_minutes: number;
  job_id: string;
  employer_id: string;
}

interface JobDetails {
  id: string;
  title: string;
  company_name: string | null;
}

export default function WorkerCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobDetails, setJobDetails] = useState<Record<string, JobDetails>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("worker_id", user?.id)
        .in("status", ["SCHEDULED", "CONFIRMED", "scheduled", "confirmed"]);

      if (error) throw error;

      setInterviews(data || []);

      // Fetch job details
      const jobIds = [...new Set(data?.map((i) => i.job_id) || [])];
      const employerIds = [...new Set(data?.map((i) => i.employer_id) || [])];

      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title")
          .in("id", jobIds);

        const { data: employers } = await supabase
          .from("employer_profiles")
          .select("user_id, company_name")
          .in("user_id", employerIds);

        const jobMap: Record<string, JobDetails> = {};
        jobs?.forEach((job) => {
          const interview = data?.find((i) => i.job_id === job.id);
          const employer = employers?.find((e) => e.user_id === interview?.employer_id);
          jobMap[job.id] = {
            id: job.id,
            title: job.title,
            company_name: employer?.company_name || null,
          };
        });
        setJobDetails(jobMap);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.scheduled_date);
      return isSameDay(interviewDate, date);
    });
  };

  const selectedDateInterviews = selectedDate ? getInterviewsForDate(selectedDate) : [];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <WorkerPortalLayout>
          <PortalBreadcrumb />
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {/* Week day headers */}
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Padding days */}
                    {paddingDays.map((_, index) => (
                      <div key={`padding-${index}`} className="aspect-square" />
                    ))}

                    {/* Calendar days */}
                    {daysInMonth.map((day) => {
                      const dayInterviews = getInterviewsForDate(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`aspect-square p-1 rounded-lg border transition-colors flex flex-col items-center justify-start ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : isToday
                              ? "border-primary/50 bg-primary/5"
                              : "border-transparent hover:bg-muted"
                          }`}
                        >
                          <span
                            className={`text-sm ${
                              isToday ? "font-bold text-primary" : ""
                            } ${!isSameMonth(day, currentMonth) ? "text-muted-foreground" : ""}`}
                          >
                            {format(day, "d")}
                          </span>
                          {dayInterviews.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                              {dayInterviews.slice(0, 3).map((_, idx) => (
                                <div
                                  key={idx}
                                  className="w-1.5 h-1.5 rounded-full bg-primary"
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Date Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMMM d")
                    : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <p className="text-muted-foreground text-sm">
                    Click on a date to see scheduled interviews
                  </p>
                ) : selectedDateInterviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No interviews scheduled for this date
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedDateInterviews.map((interview) => {
                      const job = jobDetails[interview.job_id];
                      return (
                        <div
                          key={interview.id}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">
                                {job?.title || "Interview"}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {job?.company_name || "Company"}
                              </p>
                            </div>
                            <Badge
                              variant={
                                interview.interview_mode === "video"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {interview.interview_mode === "video" ? (
                                <Video className="h-3 w-3 mr-1" />
                              ) : (
                                <MapPin className="h-3 w-3 mr-1" />
                              )}
                              {interview.interview_mode}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {interview.scheduled_time} ({interview.duration_minutes} min)
                            </span>
                          </div>

                          {interview.interview_mode === "video" && interview.meeting_link && (
                            <Button
                              size="sm"
                              className="w-full mt-3"
                              asChild
                            >
                              <a
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Video className="h-3 w-3 mr-2" />
                                Join Meeting
                              </a>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Link to="/worker/interviews">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Interviews
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </WorkerPortalLayout>
  );
}
