import { Link } from 'react-router-dom';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import { Card, CardContent } from '@/components/ui/card';

const resources = [
  ['/visa-guide', 'Visa guide', 'Understand the documentation and official checks involved in overseas employment.'],
  ['/country-insights', 'Country insights', 'Review work and living conditions before travelling.'],
  ['/cultural-guides', 'Cultural guides', 'Prepare for workplace and everyday life in your destination.'],
  ['/legal-advice', 'Worker rights and legal guidance', 'Read practical guidance and links to official resources.'],
  ['/faq', 'Frequently asked questions', 'Answers about registration, assessments, documents, fees and safety.'],
  ['/support', 'Support', 'Get help with your SafeWork Global journey.'],
] as const;

export default function ResourcesIndex() {
  return <ResourcePageLayout title="Overseas Employment Resources | SafeWork Global" description="Practical SafeWork Global guidance for Indian workers considering UAE and overseas jobs." eyebrow="Resources" heading="Overseas employment resources" intro="Practical guidance to help workers understand jobs, documents, destinations and the SafeWork Global process."><div className="grid gap-4 md:grid-cols-2">{resources.map(([to, title, description]) => <Link key={to} to={to}><Card className="h-full transition-colors hover:border-primary/40"><CardContent className="p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></CardContent></Card></Link>)}</div></ResourcePageLayout>;
}