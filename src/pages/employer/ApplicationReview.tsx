import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { FileText, Star, User, Calendar, Search, Eye, MapPin, Briefcase, Phone, Globe, Award, Shield } from "lucide-react";
import { isWorkerKycVerified } from "@/lib/workerKyc";

interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  notes: string | null;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
  job: {
    title: string;
  } | null;
  worker_profile: {
    years_of_experience: number | null;
    nationality: string | null;
    current_location: string | null;
    bio: string | null;
    availability: string | null;
    languages: string[] | null;
  } | null;
  skills: {
    skill_name: string;
    proficiency_level: string | null;
  }[];
  kycVerified: boolean;
}

export default function ApplicationReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter, searchQuery]);

  const fetchApplications = async () => {
    try {
      const { data: applicationsData, error: appsError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("employer_id", user?.id)
        .order("applied_at", { ascending: false });

      if (appsError) throw appsError;

      // Fetch worker profiles separately
      const workerIds = applicationsData?.map(app => app.worker_id) || [];
      const jobIds = applicationsData?.map(app => app.job_id) || [];

      const [profilesResult, workerProfilesResult, jobsResult, skillsResult, documentsResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url, phone").in("id", workerIds),
        supabase.from("worker_profiles").select("user_id, years_of_experience, nationality, current_location, bio, availability, languages").in("user_id", workerIds),
        supabase.from("jobs").select("id, title").in("id", jobIds),
        supabase.from("worker_skills").select("worker_id, skill_name, proficiency_level").in("worker_id", workerIds),
        supabase.from("worker_documents").select("worker_id, document_type, verification_status").in("worker_id", workerIds),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      // Combine the data
      const enrichedApplications = applicationsData?.map(app => {
        const workerDocs = documentsResult.data?.filter((doc) => doc.worker_id === app.worker_id) || [];
        return {
          ...app,
          profiles: profilesResult.data?.find(profile => profile.id === app.worker_id) || {
            full_name: null,
            email: "",
            avatar_url: null,
            phone: null
          },
          job: jobsResult.data?.find(job => job.id === app.job_id) || null,
          worker_profile: workerProfilesResult.data?.find(wp => wp.user_id === app.worker_id) || null,
          skills: skillsResult.data?.filter(skill => skill.worker_id === app.worker_id) || [],
          kycVerified: isWorkerKycVerified(workerDocs),
        };
      }) || [];

      setApplications(enrichedApplications as any);
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

  const filterApplications = () => {
    let filtered = applications;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application status updated",
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addToShortlist = async (workerId: string) => {
    try {
      const { error } = await supabase
        .from("shortlisted_workers")
        .insert({
          employer_id: user?.id,
          worker_id: workerId,
          list_name: "General",
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Shortlisted",
            description: "This worker is already in your shortlist",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Worker added to shortlist",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "default";
      case "REVIEWING": return "secondary";
      case "APPROVED": return "default";
      case "SHORTLISTED": return "default";
      case "INTERVIEWED": return "secondary";
      case "OFFERED": return "default";
      case "HIRED": return "default";
      case "REJECTED": return "destructive";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
            <div className="text-center">Loading applications...</div>
          </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Application Review</h1>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Applications</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                <SelectItem value="INTERVIEWED">Interviewed</SelectItem>
                <SelectItem value="OFFERED">Offered</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {filteredApplications.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">
              {statusFilter !== "ALL" 
                ? "Try adjusting your filters"
                : "Applications will appear here when workers apply to your jobs"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <Card key={app.id} className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {app.profiles?.avatar_url ? (
                        <img src={app.profiles.avatar_url} alt="" className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {app.job?.title || "Job Position"}
                        </Badge>
                        <Badge variant={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-1 truncate">
                        {app.profiles?.full_name || "Applicant"}
                      </h3>
                      
                      {/* Contact Info — hidden until admin KYC verification */}
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-3">
                        {app.kycVerified ? (
                          <>
                            <span className="truncate max-w-[200px]">{app.profiles?.email}</span>
                            {app.profiles?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {app.profiles.phone}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="flex items-center gap-1 italic">
                            <Shield className="h-3 w-3" />
                            Contact hidden until KYC verified
                          </span>
                        )}
                      </div>

                      {/* Worker Details */}
                      {app.worker_profile && (
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3">
                          {app.worker_profile.years_of_experience && (
                            <Badge variant="secondary" className="text-xs">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {app.worker_profile.years_of_experience} yrs
                            </Badge>
                          )}
                          {app.worker_profile.nationality && (
                            <Badge variant="secondary" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              {app.worker_profile.nationality}
                            </Badge>
                          )}
                          {app.worker_profile.current_location && (
                            <Badge variant="secondary" className="text-xs hidden sm:flex">
                              <MapPin className="h-3 w-3 mr-1" />
                              {app.worker_profile.current_location}
                            </Badge>
                          )}
                          {app.worker_profile.availability && (
                            <Badge variant="secondary" className="text-xs hidden md:flex">
                              {app.worker_profile.availability}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Skills */}
                      {app.skills && app.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Award className="h-4 w-4 text-muted-foreground mr-1 flex-shrink-0" />
                          {app.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill.skill_name}
                            </Badge>
                          ))}
                          {app.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Applied Date */}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Applied {format(new Date(app.applied_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions - Stack on mobile */}
                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                    <Button variant="default" size="sm" asChild className="w-full lg:w-auto">
                      <Link to={`/employer/applications/${app.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Link>
                    </Button>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 lg:flex-none text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => updateApplicationStatus(app.id, 'APPROVED')}
                        disabled={app.status === 'APPROVED' || app.status === 'HIRED'}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 lg:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                        disabled={app.status === 'REJECTED'}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 lg:flex-none"
                        onClick={() => addToShortlist(app.worker_id)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Shortlist
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </DashboardLayout>
  );
}
