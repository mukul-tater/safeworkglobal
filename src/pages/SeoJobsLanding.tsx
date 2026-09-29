import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import SEOHead from '@/components/SEOHead';
import PublicBreadcrumbs from '@/components/PublicBreadcrumbs';
import JobResultCard, { type JobListItem } from '@/components/jobs/JobResultCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { breadcrumbJsonLd, canonicalUrl } from '@/lib/seo';
import { formatJobSalaryNative } from '@/lib/jobSalaryUtils';
import { recordSeoEvent } from '@/lib/seoEvents';

const SPECIAL: Record<string, { title: string; description: string; country?: string; city?: string }> = {
  'dubai-jobs': { title: 'Dubai Jobs for Indian Skilled Workers', description: 'Browse current Dubai job openings published on SafeWork Global, with salary, requirements and benefits shown from live listings.', country: 'UAE', city: 'Dubai' },
  'uae-jobs': { title: 'UAE Jobs for Indian Skilled Workers', description: 'Browse current skilled job opportunities across the UAE with transparent role, salary and application information.', country: 'UAE' },
  'gcc-jobs': { title: 'GCC Jobs for Indian Skilled Workers', description: 'Explore current Gulf employment opportunities available through SafeWork Global.' },
  'overseas-jobs': { title: 'Overseas Jobs for Indian Skilled Workers', description: 'Find current overseas skilled-work opportunities and review the requirements before applying.' },
};

function titleCase(value: string) { return value.split('-').map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(' '); }

export default function SeoJobsLanding() {
  const location = useLocation();
  const { category, place } = useParams<{ category?: string; place?: string }>();
  const routeKey = location.pathname.slice(1);
  const special = SPECIAL[routeKey];
  const categoryName = category ? titleCase(category) : undefined;
  const placeName = place ? titleCase(place) : undefined;
  const cityFromRoute = routeKey.endsWith('-jobs') && !special ? titleCase(routeKey.replace(/-jobs$/, '')) : special?.city;
  const title = special?.title ?? (categoryName ? `${categoryName} Jobs${placeName ? ` in ${placeName}` : ''}` : `${cityFromRoute} Jobs`);
  const description = special?.description ?? `Browse current ${title.toLowerCase()} on SafeWork Global. Listings show real role details, salary and requirements.`;
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordSeoEvent('landing_view', { path: location.pathname, country: special?.country, city: cityFromRoute, category: categoryName });
    void (async () => {
      let query = supabase.from('jobs').select('*, job_skills(skill_name)').eq('status', 'ACTIVE').eq('indexable', true).order('posted_at', { ascending: false });
      if (special?.country) query = query.eq('country', special.country);
      if (cityFromRoute) query = query.ilike('city', cityFromRoute);
      if (categoryName) query = query.ilike('category', categoryName);
      if (placeName) query = query.or(`city.ilike.${placeName},country.ilike.${placeName}`);
      const { data } = await query;
      setJobs(((data ?? []) as any[]).map((job) => ({
        id: job.id, slug: job.slug ?? job.id, title: job.title, company: '', companyLogoUrl: null,
        location: `${job.location}, ${job.country}`, country: job.country, salaryDisplay: job.salary_display,
        rawSalaryMin: job.salary_min, rawSalaryMax: job.salary_max, currency: job.currency,
        salaryMin: job.currency === 'INR' ? job.salary_min : null, salaryMax: job.currency === 'INR' ? job.salary_max : null,
        type: job.job_type?.replace('_', ' '), category: job.category ?? 'Other', experienceLevel: job.experience_level,
        visaSponsorship: Boolean(job.visa_sponsorship), postedAt: new Date(job.posted_at ?? job.created_at),
        description: job.description, skills: job.job_skills?.map((s: any) => s.skill_name) ?? [], serviceCharge: job.service_charge,
      })));
      setLoading(false);
    })();
  }, [location.pathname, special?.country, cityFromRoute, categoryName, placeName]);

  const schemas = useMemo(() => [
    breadcrumbJsonLd([{ name: 'Jobs', path: '/jobs' }, { name: title, path: location.pathname }]),
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: canonicalUrl(location.pathname) },
  ], [description, location.pathname, title]);

  return <div className="min-h-screen bg-background has-mobile-nav">
    <SEOHead title={title} description={description} canonicalUrl={location.pathname} structuredData={schemas} robots={jobs.length === 0 && !loading ? 'noindex,follow' : undefined} />
    <Header /><MobileBottomNav />
    <main className="container mx-auto px-4 py-8 sm:px-6 md:py-12">
      <PublicBreadcrumbs items={[{ label: 'Jobs', to: '/jobs' }, { label: title }]} />
      <header className="max-w-3xl"><h1 className="text-3xl font-bold sm:text-4xl">{title}</h1><p className="mt-3 text-muted-foreground">{description}</p></header>
      <div className="mt-8 space-y-3">
        {loading ? <p>Loading current jobs…</p> : jobs.length ? jobs.map((job) => <JobResultCard key={job.id} job={job} />) : <div className="border-y border-border py-10"><h2 className="text-xl font-semibold">No current matching jobs</h2><p className="mt-2 text-muted-foreground">This page is not being indexed while no relevant jobs are available.</p><Button asChild className="mt-5"><Link to="/jobs">Browse all current jobs</Link></Button></div>}
      </div>
      {jobs.length > 0 && <p className="mt-8 text-sm text-muted-foreground">Salary is shown in each job's native listed currency. {jobs.map((j) => formatJobSalaryNative(j.rawSalaryMin, j.rawSalaryMax, j.currency)).length} current listings are shown.</p>}
    </main><Footer />
  </div>;
}