import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import PublicBreadcrumbs from '@/components/PublicBreadcrumbs';
import JobResultCard, { type JobListItem } from '@/components/jobs/JobResultCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { breadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

export default function PublicEmployer() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<any>(undefined);
  useEffect(() => { void (supabase as any).rpc('public_employer_by_slug', { p_slug: slug }).then(({ data: row }: any) => setData(row)); }, [slug]);
  if (data === undefined) return <div className="min-h-screen bg-background"><Header /><main className="container mx-auto px-4 py-12">Loading employer…</main></div>;
  if (!data) return <div className="min-h-screen bg-background"><SEOHead title="Employer Not Found" description="This public employer page is unavailable." robots="noindex,follow" /><Header /><main className="container mx-auto px-4 py-12"><h1 className="text-2xl font-bold">Employer not found</h1><Button asChild className="mt-5"><Link to="/jobs">Browse jobs</Link></Button></main><Footer /></div>;
  const jobs: JobListItem[] = (data.jobs ?? []).map((job: any) => ({ id: job.id, slug: job.slug, title: job.title, company: data.name, companyLogoUrl: data.logo_url, location: `${job.location}, ${job.country}`, country: job.country, salaryDisplay: null, rawSalaryMin: job.salary_min, rawSalaryMax: job.salary_max, currency: job.currency, salaryMin: job.currency === 'INR' ? job.salary_min : null, salaryMax: job.currency === 'INR' ? job.salary_max : null, type: job.job_type?.replace('_', ' '), category: job.category ?? 'Other', experienceLevel: job.experience_level, visaSponsorship: Boolean(job.visa_sponsorship), postedAt: new Date(job.posted_at), description: job.description, skills: [], serviceCharge: null }));
  const description = data.description || `View current vacancies from ${data.name} on SafeWork Global.`;
  return <div className="min-h-screen bg-background has-mobile-nav"><SEOHead title={`${data.name} Jobs`} description={description} canonicalUrl={`/employers/${data.slug}`} structuredData={[breadcrumbJsonLd([{ name: 'Jobs', path: '/jobs' }, { name: data.name, path: `/employers/${data.slug}` }]), { '@context': 'https://schema.org', '@type': 'Organization', name: data.name, url: canonicalUrl(`/employers/${data.slug}`), description: data.description || undefined, logo: data.logo_url || undefined }]} /><Header /><main className="container mx-auto px-4 py-8 sm:px-6"><PublicBreadcrumbs items={[{ label: 'Jobs', to: '/jobs' }, { label: data.name }]} /><div className="border-b border-border pb-8"><div className="flex items-center gap-4">{data.logo_url && <img src={data.logo_url} alt="" className="h-16 w-16 rounded-lg border object-contain" />}<div><h1 className="text-3xl font-bold">{data.name}</h1><p className="text-muted-foreground">{[data.industry, data.location].filter(Boolean).join(' · ')}</p>{data.verified && <Badge className="mt-2">Verified employer</Badge>}</div></div>{data.description && <p className="mt-5 max-w-3xl">{data.description}</p>}</div><section className="py-8"><h2 className="text-2xl font-bold">Current vacancies</h2><div className="mt-5 space-y-3">{jobs.length ? jobs.map((job) => <JobResultCard key={job.id} job={job} />) : <p className="text-muted-foreground">No current vacancies.</p>}</div></section></main><Footer /></div>;
}