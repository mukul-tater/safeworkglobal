import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Briefcase, Lock, MapPin } from "lucide-react";
import { formatSalaryLakh } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";

interface JobPreview {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  salary_display?: string | null;
}

interface Props {
  readonly preferredCountry?: string | null;
  readonly canApply: boolean;
}

function displaySalary(job: JobPreview): string {
  if (job.salary_display) return job.salary_display;
  return formatSalaryLakh(job.salary_min, job.salary_max, job.currency);
}

function hasSalary(job: JobPreview): boolean {
  return Boolean(job.salary_display || job.salary_min != null || job.salary_max != null);
}

export default function WorkerFeaturedJobsStrip({ preferredCountry, canApply }: Props) {
  const { t } = useWorkerLanguage();
  const [jobs, setJobs] = useState<JobPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        let query = supabase
          .from("jobs")
          .select("id, slug, title, location, country, salary_min, salary_max, currency, salary_display")
          .eq("status", "ACTIVE")
          .order("posted_at", { ascending: false })
          .limit(3);

        if (preferredCountry) {
          query = query.ilike("country", `%${preferredCountry}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = (data || []) as JobPreview[];

        if (results.length === 0 && preferredCountry) {
          const { data: fallback } = await supabase
            .from("jobs")
            .select("id, slug, title, location, country, salary_min, salary_max, currency, salary_display")
            .eq("status", "ACTIVE")
            .order("posted_at", { ascending: false })
            .limit(3);
          results = (fallback || []) as JobPreview[];
        }

        setJobs(results);
      } catch (error) {
        console.error("Error loading featured jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [preferredCountry]);

  const jobsLink = preferredCountry
    ? `/jobs?location=${encodeURIComponent(preferredCountry)}`
    : "/jobs";

  if (loading) {
    return (
      <section className="mb-5">
        <Skeleton className="h-7 w-48 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold font-heading">{t("jobs.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {preferredCountry
              ? t("jobs.subtitleCountry", { country: preferredCountry })
              : t("jobs.subtitleDefault")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 rounded-xl">
          <Link to={jobsLink}>
            {t("jobs.viewAll")}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {!canApply && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/25 px-3 py-2.5 mb-3 text-sm">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <p>
            <span className="font-medium text-foreground">{t("jobs.lockTitle")}</span>
            <span className="text-muted-foreground text-xs block">{t("jobs.lockSub")}</span>
          </p>
        </div>
      )}

      {jobs.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">{t("jobs.empty")}</p>
          <Button asChild variant="outline" size="sm">
            <Link to={jobsLink}>{t("jobs.browseAll")}</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} to={`/jobs/${job.slug || job.id}`} className="block group">
              <Card className="p-4 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">
                        {job.location}, {job.country}
                      </span>
                    </div>
                    {hasSalary(job) && (
                      <p className="text-lg font-bold text-primary">
                        {displaySalary(job)}
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">
                          {t("jobs.perMonth")}
                        </span>
                      </p>
                    )}
                  </div>
                  {hasSalary(job) && (
                    <Badge className="shrink-0 bg-success/10 text-success border-success/20 hover:bg-success/10">
                      {t("jobs.verified")}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
