import { useAuth } from "@/contexts/AuthContext";
import { formatSalaryINR } from '@/lib/utils';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Briefcase, FileText, MessageSquare, TrendingUp, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DocumentVerificationCard from "@/components/worker/DocumentVerificationCard";
import ECRStatusCard from "@/components/worker/ECRStatusCard";
import ProfileProgressCard from "@/components/worker/ProfileProgressCard";
import JobJourneyProgressCard from "@/components/worker/JobJourneyProgressCard";
import ApplicationProgressCard from "@/components/worker/ApplicationProgressCard";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { Link } from "react-router-dom";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { formatDistanceToNow } from "date-fns";
import { workerNavGroups, workerProfileMenu } from "@/config/workerNav";

interface RecentActivity {
  id: string;
  type: 'application' | 'message' | 'notification';
  title: string;
  subtitle: string;
  timestamp: string;
}

interface RecommendedJob {
  id: string;
  title: string;
  slug: string | null;
  location: string;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  experience_level: string;
}

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobFormalities, setJobFormalities] = useState([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) fetchWorkerData();
  }, [profile?.id]);

  const fetchWorkerData = async () => {
    try {
      const [docsRes, profileRes, skillsRes, expRes, certsRes, appsRes, formalitiesRes, notificationsRes, jobsRes] = await Promise.all([
        supabase.from('worker_documents').select('*').eq('worker_id', profile?.id),
        supabase.from('worker_profiles').select('*').eq('user_id', profile?.id).single(),
        supabase.from('worker_skills').select('*').eq('worker_id', profile?.id),
        supabase.from('work_experience').select('*').eq('worker_id', profile?.id),
        supabase.from('worker_certifications').select('*').eq('worker_id', profile?.id),
        supabase.from('job_applications').select(`*, jobs:job_id (title, location, country)`).eq('worker_id', profile?.id).order('applied_at', { ascending: false }).limit(5),
        supabase.from('job_formalities').select(`*, jobs:job_id (title, location, country)`).eq('worker_id', profile?.id),
        supabase.from('notifications').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('jobs').select('id, title, slug, location, country, salary_min, salary_max, currency, experience_level').eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(3)
      ]);

      setDocuments(docsRes.data || []);
      setWorkerProfile(profileRes.data);
      setSkills(skillsRes.data || []);
      setExperience(expRes.data || []);
      setCertifications(certsRes.data || []);
      setApplications(appsRes.data || []);
      setJobFormalities(formalitiesRes.data || []);
      setRecommendedJobs(jobsRes.data || []);

      const activities: RecentActivity[] = [];
      (appsRes.data || []).forEach((app: any) => {
        activities.push({
          id: `app-${app.id}`, type: 'application',
          title: `Applied to ${app.jobs?.title || 'Position'}`,
          subtitle: `${app.jobs?.location || ''} • ${formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}`,
          timestamp: app.applied_at
        });
      });
      (notificationsRes.data || []).forEach((notif: any) => {
        activities.push({
          id: `notif-${notif.id}`, type: 'notification',
          title: notif.title,
          subtitle: `${notif.message.substring(0, 50)}${notif.message.length > 50 ? '...' : ''} • ${formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}`,
          timestamp: notif.created_at
        });
      });
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching worker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifiedDocsCount = documents.filter((d: any) => d.verification_status === 'verified').length;
  const pendingDocsCount = documents.filter((d: any) => d.verification_status === 'pending').length;

  if (loading) {
    return (
      <DashboardLayout navGroups={workerNavGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={workerNavGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
      <PortalBreadcrumb />
      <OnboardingStepper />

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back, {profile?.full_name || 'Worker'}!</h1>
        <p className="text-muted-foreground text-sm">Here's an overview of your activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { icon: Briefcase, value: applications.length, label: "Applications", color: "text-primary", to: "/worker/applications" },
          { icon: FileText, value: `${verifiedDocsCount}/${documents.length}`, label: "Verified Docs", color: "text-success", to: "/worker/documents" },
          { icon: MessageSquare, value: pendingDocsCount, label: "Pending Checks", color: "text-warning", to: "/worker/verification" },
          { icon: TrendingUp, value: skills.length, label: "Skills Added", color: "text-info", to: "/worker/profile" },
        ].map(stat => (
          <Link key={stat.label} to={stat.to} aria-label={`Go to ${stat.label}`}>
            <Card className="p-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer h-full">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ProfileProgressCard
          hasProfile={!!workerProfile} hasDocuments={documents.length > 0}
          documentsVerified={verifiedDocsCount > 0} hasSkills={skills.length > 0}
          hasExperience={experience.length > 0} hasCertifications={certifications.length > 0}
        />
        <ECRStatusCard
          ecrStatus={workerProfile?.ecr_status || 'not_checked'}
          ecrCategory={workerProfile?.ecr_category || null}
          nationality={workerProfile?.nationality || null}
          hasPassport={workerProfile?.has_passport || false}
        />
      </div>

      <div className="mb-6">
        <DocumentVerificationCard documents={documents} />
      </div>

      <div className="mb-6">
        <ApplicationProgressCard userId={profile?.id || ""} />
      </div>

      {jobFormalities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Job Journey Progress</h2>
          <JobJourneyProgressCard formalities={jobFormalities} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={activity.id} className={`flex items-start gap-3 ${index < recentActivity.length - 1 ? 'pb-3 border-b' : ''}`}>
                <div className="bg-primary/10 p-2 rounded">
                  {activity.type === 'application' ? <Briefcase className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-6 text-sm">No recent activity</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Recommended Jobs</h2>
          <div className="space-y-3">
            {recommendedJobs.length > 0 ? recommendedJobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.slug || job.id}`} className="block">
                <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <h3 className="font-semibold text-sm mb-1 truncate">{job.title}</h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    {job.location}, {job.country}
                    {(job.salary_min != null || job.salary_max != null) && (
                      <> • {formatSalaryINR(job.salary_min, job.salary_max, job.currency)}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{job.experience_level} experience</p>
                </div>
              </Link>
            )) : (
              <p className="text-muted-foreground text-center py-6 text-sm">No jobs available</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
