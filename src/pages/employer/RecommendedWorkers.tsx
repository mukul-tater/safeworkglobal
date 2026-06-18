import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Sparkles, MapPin, Briefcase, Wallet, Star, Eye, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  rankWorkers,
  resolveTemplate,
  type MatchResult,
  type JobForMatch,
  type WorkerForMatch,
} from "@/lib/jobTemplates";

export default function RecommendedWorkers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const jobId = params.get("jobId");

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [job, setJob] = useState<any>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [shortlisting, setShortlisting] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !user) return;
    (async () => {
      try {
        // 1. Load the job + skills
        const { data: jobData, error: jobErr } = await supabase
          .from("jobs")
          .select("id, title, country, location, salary_min, salary_max, experience_level")
          .eq("id", jobId)
          .single();
        if (jobErr) throw jobErr;
        setJob(jobData);

        const { data: skillsData } = await supabase
          .from("job_skills")
          .select("skill_name")
          .eq("job_id", jobId);
        const jobSkills = (skillsData || []).map((s) => s.skill_name);

        // Derive experience minimum from level
        const expMap: Record<string, number> = {
          ENTRY: 0, INTERMEDIATE: 3, SENIOR: 5, EXPERT: 8,
        };
        const tpl = resolveTemplate(jobData.title);
        const minYears = tpl?.minYearsExperience ?? expMap[jobData.experience_level] ?? 0;

        const jobMatch: JobForMatch = {
          title: jobData.title,
          skills: jobSkills,
          salary_min: jobData.salary_min,
          salary_max: jobData.salary_max,
          min_years_experience: minYears,
          country: jobData.country,
        };

        // 2. Load public worker pool via RPC
        const { data: workersRaw, error: wErr } = await supabase.rpc("list_public_workers", { p_limit: 200 });
        if (wErr) throw wErr;
        const workers: WorkerForMatch[] = (workersRaw || []) as any;

        // 3. Rank
        const ranked = rankWorkers(jobMatch, workers, 10);
        setMatches(ranked);

        // 4. Load existing shortlist
        const { data: existing } = await supabase
          .from("shortlisted_workers")
          .select("worker_id")
          .eq("employer_id", user.id);
        setShortlistedIds(new Set((existing || []).map((s) => s.worker_id)));
      } catch (err: any) {
        toast.error(err.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, user]);

  const handleShortlist = async (workerId: string) => {
    if (!user) return;
    setShortlisting(workerId);
    try {
      const { error } = await supabase
        .from("shortlisted_workers")
        .insert({ employer_id: user.id, worker_id: workerId, list_name: job?.title || "General" });
      if (error) throw error;
      setShortlistedIds((prev) => new Set(prev).add(workerId));
      toast.success("Added to shortlist");
    } catch (err: any) {
      toast.error(err.message || "Failed to shortlist");
    } finally {
      setShortlisting(null);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-primary" : "text-warning";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-success/10 mb-3">
            <Sparkles className="h-6 w-6 text-success" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">Recommended workers for you</h1>
          {job && (
            <p className="text-sm text-muted-foreground mt-1">
              Top matches for <span className="font-semibold text-foreground">{job.title}</span> · {job.location}, {job.country}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Running smart matching…</span>
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No strong matches yet. We'll notify you as new workers join who fit this role.
              </p>
              <Button className="mt-4" onClick={() => navigate(`/employer/pilot-offer?jobId=${jobId}`)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const w = m.worker;
              const shortlisted = shortlistedIds.has(w.user_id);
              return (
                <Card key={w.user_id} className="hover:shadow-elegant transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={w.avatar_url || undefined} />
                        <AvatarFallback>{(w.display_name || "W").charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="font-semibold text-base">{w.display_name || "Worker"}</h3>
                            <p className="text-sm text-muted-foreground">
                              {w.primary_work_type || "Worker"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${scoreColor(m.score)}`}>{m.score}%</div>
                            <div className="text-xs text-muted-foreground">match score</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            {w.years_of_experience ?? 0} yrs exp
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Wallet className="h-3 w-3" />
                            ₹{(w.expected_salary_min ?? 0).toLocaleString("en-IN")}–
                            ₹{(w.expected_salary_max ?? 0).toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {w.current_location || w.nationality || "—"}
                          </div>
                        </div>

                        {(w.top_skills || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {(w.top_skills || []).slice(0, 5).map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}

                        {/* Score breakdown */}
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {[
                            { label: "Skill", val: m.breakdown.skill, max: 40 },
                            { label: "Salary", val: m.breakdown.salary, max: 20 },
                            { label: "Exp", val: m.breakdown.experience, max: 20 },
                            { label: "Location", val: m.breakdown.location, max: 20 },
                          ].map((b) => (
                            <div key={b.label}>
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                                <span>{b.label}</span>
                                <span>{b.val}/{b.max}</span>
                              </div>
                              <Progress value={(b.val / b.max) * 100} className="h-1" />
                            </div>
                          ))}
                        </div>

                        {m.reasons.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning" />
                            {m.reasons.join(" · ")}
                          </p>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant={shortlisted ? "secondary" : "default"}
                            disabled={shortlisted || shortlisting === w.user_id}
                            onClick={() => handleShortlist(w.user_id)}
                          >
                            {shortlisting === w.user_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : shortlisted ? (
                              "Shortlisted"
                            ) : (
                              "Shortlist"
                            )}
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/worker-profile/${w.user_id}`}>
                              <Eye className="h-3 w-3 mr-1" /> View Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/employer/manage-jobs")}
              >
                Back to my jobs
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/employer/pilot-offer?jobId=${jobId}`)}
              >
                Continue to pilot setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}