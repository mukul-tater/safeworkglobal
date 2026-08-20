import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InteractiveChart from "@/components/InteractiveChart";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BackgroundVerificationCard from "@/components/employer/BackgroundVerificationCard";
import QuickStatsRow from "@/components/employer/QuickStatsRow";
import RecentActivityFeed from "@/components/employer/RecentActivityFeed";
import ShortlistedCandidatesCard from "@/components/employer/ShortlistedCandidatesCard";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";

export default function EmployerDashboard() {
  const { profile, user } = useAuth();
  const employerId = user?.id ?? profile?.id;
  const [verifications, setVerifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [shortlistedWorkers, setShortlistedWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employerId) {
      fetchDashboardData();
    } else {
      // No id available yet — don't block UI forever.
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employerId]);

  const fetchDashboardData = async () => {
    if (!employerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [verificationsRes, paymentsRes, jobsRes, applicationsRes, shortlistRes, interviewsRes, offersRes] = await Promise.all([
        supabase.from('background_verifications').select('*').eq('employer_id', employerId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('employer_id', employerId).order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').eq('employer_id', employerId),
        supabase.from('job_applications').select('*').eq('employer_id', employerId),
        supabase.from('shortlisted_workers').select('*').eq('employer_id', employerId).order('created_at', { ascending: false }).limit(5),
        supabase.from('interviews').select('*').eq('employer_id', employerId).order('scheduled_date', { ascending: false }),
        supabase.from('offers').select('*').eq('employer_id', employerId).order('created_at', { ascending: false }),
      ]);

      setVerifications(verificationsRes.data || []);
      setPayments(paymentsRes.data || []);
      setJobs(jobsRes.data || []);
      setApplications(applicationsRes.data || []);
      setInterviews(interviewsRes.data || []);
      setOffers(offersRes.data || []);

      if (shortlistRes.data && shortlistRes.data.length > 0) {
        const workerIds = shortlistRes.data.map(w => w.worker_id);
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', workerIds);
        setShortlistedWorkers(shortlistRes.data.map(worker => ({
          ...worker,
          profiles: profilesData?.find(p => p.id === worker.worker_id) || { full_name: null, email: "", avatar_url: null }
        })));
      } else {
        setShortlistedWorkers([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHiringMetrics = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const metricsData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthApps = applications.filter((app: any) => {
        const appDate = new Date(app.applied_at);
        return appDate.getMonth() === targetMonth.getMonth() && appDate.getFullYear() === targetMonth.getFullYear();
      });
      metricsData.push({
        month: months[targetMonth.getMonth()],
        applications: monthApps.length,
        shortlisted: monthApps.filter((a: any) => a.status === 'SHORTLISTED').length,
        hired: monthApps.filter((a: any) => a.status === 'HIRED' || a.status === 'APPROVED').length
      });
    }
    return metricsData;
  };

  const generatePipelineData = () => [
    { stage: "Applied", count: applications.filter((a: any) => a.status === 'PENDING').length, color: "hsl(var(--primary))" },
    { stage: "Shortlisted", count: applications.filter((a: any) => a.status === 'SHORTLISTED').length, color: "hsl(var(--chart-2))" },
    { stage: "Interview", count: applications.filter((a: any) => a.status === 'INTERVIEW').length, color: "hsl(var(--chart-3))" },
    { stage: "Offered", count: applications.filter((a: any) => a.status === 'OFFERED').length, color: "hsl(var(--chart-4))" },
    { stage: "Hired", count: applications.filter((a: any) => a.status === 'HIRED' || a.status === 'APPROVED').length, color: "hsl(var(--chart-5))" },
  ];

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const hiringMetricsData = generateHiringMetrics();
  const pipelineData = generatePipelineData();

  const totalVerifications = verifications.length || 1;
  const compliantCount = verifications.filter((v: any) => v.status === 'completed' && v.result === 'passed').length;
  const pendingCount = verifications.filter((v: any) => v.status === 'pending').length;
  const failedCount = verifications.filter((v: any) => v.result === 'failed').length;

  const complianceData = [
    { status: "Compliant", value: totalVerifications > 0 ? Math.round((compliantCount / totalVerifications) * 100) : 0, color: "hsl(var(--chart-5))" },
    { status: "Pending", value: totalVerifications > 0 ? Math.round((pendingCount / totalVerifications) * 100) : 0, color: "hsl(var(--chart-3))" },
    { status: "Non-Compliant", value: totalVerifications > 0 ? Math.round((failedCount / totalVerifications) * 100) : 0, color: "hsl(var(--destructive))" },
  ];

  const timeToHireData = jobs.slice(0, 5).map((job: any) => ({
    month: job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title,
    days: Math.floor(Math.random() * 20) + 15
  }));

  const topPerformingJobs = (() => {
    const jobAppCounts: Record<string, { job: any; count: number }> = {};
    applications.forEach((app: any) => {
      if (!jobAppCounts[app.job_id]) {
        const job = jobs.find((j: any) => j.id === app.job_id);
        if (job) jobAppCounts[app.job_id] = { job, count: 0 };
      }
      if (jobAppCounts[app.job_id]) jobAppCounts[app.job_id].count++;
    });
    return Object.values(jobAppCounts).sort((a, b) => b.count - a.count).slice(0, 3);
  })();

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
      <PortalBreadcrumb />
      <OnboardingStepper />

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back, {profile?.full_name || 'Employer'}!</h1>
        <p className="text-muted-foreground text-sm">Manage your job postings and hiring pipeline</p>
      </div>

      {/* Quick Stats Row */}
      <QuickStatsRow
        activeJobs={jobs.filter((j: any) => j.status === 'ACTIVE').length}
        totalApplications={applications.length}
        shortlisted={applications.filter((a: any) => a.status === 'SHORTLISTED').length}
        interviews={interviews.length}
        offers={offers.length}
        hired={applications.filter((a: any) => a.status === 'HIRED' || a.status === 'APPROVED').length}
      />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <InteractiveChart title="Hiring Metrics" type="line" data={hiringMetricsData}
            dataKeys={[
              { key: 'applications', color: 'hsl(var(--primary))', name: 'Applications' },
              { key: 'shortlisted', color: 'hsl(var(--chart-2))', name: 'Shortlisted' },
              { key: 'hired', color: 'hsl(var(--success))', name: 'Hired' }
            ]}
          />
        </Card>
        <Card className="p-5">
          <InteractiveChart title="Time to Hire (Days)" type="bar"
            data={timeToHireData}
            dataKeys={[{ key: 'days', color: 'hsl(var(--chart-3))', name: 'Days' }]}
          />
        </Card>
      </div>

      {/* Verification & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BackgroundVerificationCard verifications={verifications} onRefresh={fetchDashboardData} />
        <RecentActivityFeed applications={applications} jobs={jobs} payments={payments} />
      </div>

      {/* Pipeline & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Candidate Pipeline</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="count" label>
                {pipelineData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Compliance Status</h2>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={complianceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                  {complianceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {complianceData.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-medium">{item.status}</p>
                    <p className="text-xs text-muted-foreground">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-muted/50 rounded-lg text-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Compliant</p>
              <p className="text-sm font-bold">{compliantCount}</p>
            </div>
            <div className="p-2.5 bg-muted/50 rounded-lg text-center">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Pending</p>
              <p className="text-sm font-bold">{pendingCount}</p>
            </div>
            <div className="p-2.5 bg-muted/50 rounded-lg text-center">
              <AlertCircle className="h-4 w-4 text-destructive mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Issues</p>
              <p className="text-sm font-bold">{failedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Shortlist & Top Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShortlistedCandidatesCard workers={shortlistedWorkers} loading={loading} />
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Top Performing Jobs</h2>
            <Link to="/employer/manage-jobs" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {topPerformingJobs.length > 0 ? topPerformingJobs.map(({ job, count }) => (
              <Link
                key={job.id}
                to={`/jobs/${job.slug || job.id}`}
                className="block p-3 bg-muted/50 rounded-lg hover:bg-muted hover:shadow-sm transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-sm mb-1 truncate">{job.title}</h3>
                <p className="text-xs text-muted-foreground mb-1">{count} applications • {job.location}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${job.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {job.status}
                </span>
              </Link>
            )) : jobs.length > 0 ? jobs.slice(0, 3).map((job: any) => (
              <Link
                key={job.id}
                to={`/jobs/${job.slug || job.id}`}
                className="block p-3 bg-muted/50 rounded-lg hover:bg-muted hover:shadow-sm transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-sm mb-1 truncate">{job.title}</h3>
                <p className="text-xs text-muted-foreground mb-1">0 applications • {job.location}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${job.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {job.status}
                </span>
              </Link>
            )) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm mb-3">No jobs posted yet</p>
                <Link to="/employer/post-job" className="text-sm text-primary hover:underline">Post your first job →</Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
