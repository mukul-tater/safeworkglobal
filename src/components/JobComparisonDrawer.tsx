import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MapPin, Wallet, ShieldCheck, Home, Utensils, Clock, FileText, BadgeIndianRupee } from 'lucide-react';
import { jobCompareBenefitRows } from '@/lib/jobBenefits';
import { formatServiceChargeInr } from '@/lib/jobServiceCharge';
import { formatINRAmount } from '@/lib/utils';
import type { JobListItem } from '@/components/jobs/JobResultCard';

interface JobComparisonDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobListItem[];
  onRemoveJob: (jobId: string) => void;
  onClearAll: () => void;
}

function salaryCeiling(job: JobListItem): number | null {
  return job.salaryMax ?? job.salaryMin;
}

function formatInrSalary(job: JobListItem): string {
  const min = job.salaryMin;
  const max = job.salaryMax;
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) {
    return `${formatINRAmount(min)} – ${formatINRAmount(max)}`;
  }
  return formatINRAmount((min ?? max) as number);
}

function placeLabel(job: JobListItem): string {
  const city = job.city?.trim();
  if (city) return city;
  const location = job.location?.trim();
  if (!location) return '—';
  const countrySuffix = `, ${job.country}`;
  return location.endsWith(countrySuffix) ? location.slice(0, -countrySuffix.length) : location;
}

export default function JobComparisonDrawer({
  open,
  onOpenChange,
  jobs,
  onRemoveJob,
  onClearAll,
}: JobComparisonDrawerProps) {
  const ceilings = jobs.map(salaryCeiling).filter((value): value is number => value != null);
  const higherSalary = ceilings.length >= 2 ? Math.max(...ceilings) : null;
  const salariesDiffer = higherSalary != null && ceilings.some((value) => value < higherSalary);

  const rows: { key: string; label: string; icon: typeof Wallet }[] = [
    { key: 'salary', label: 'Salary', icon: Wallet },
    { key: 'place', label: 'Place', icon: MapPin },
    { key: 'visa', label: 'Visa', icon: ShieldCheck },
    { key: 'stay', label: 'Stay', icon: Home },
    { key: 'food', label: 'Food', icon: Utensils },
    { key: 'hours', label: 'Hours', icon: Clock },
    { key: 'contract', label: 'Contract', icon: FileText },
    { key: 'fee', label: 'Our fee', icon: BadgeIndianRupee },
  ];

  const cell = (job: JobListItem, key: string) => {
    const benefits = jobCompareBenefitRows(job.benefits);
    switch (key) {
      case 'salary':
        return formatInrSalary(job);
      case 'place':
        return placeLabel(job);
      case 'visa':
        return job.visaSponsorship ? 'Yes' : 'No';
      case 'stay':
        return benefits.stay;
      case 'food':
        return benefits.food;
      case 'hours':
        return benefits.hours;
      case 'contract':
        return benefits.contract;
      case 'fee':
        return formatServiceChargeInr(job.serviceCharge);
      default:
        return '—';
    }
  };

  const isHigherSalary = (job: JobListItem) =>
    salariesDiffer && salaryCeiling(job) === higherSalary;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh]">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="font-heading text-xl">Compare jobs</SheetTitle>
              <SheetDescription>Salary is shown in rupees per month.</SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100%-88px)]">
          {jobs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium">No jobs to compare</p>
              <p className="text-sm text-muted-foreground">Select two jobs from the list</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-6">
              <p className="mb-2 text-xs text-muted-foreground lg:hidden">Swipe to compare</p>
              <table className="w-full min-w-[36rem]">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 w-28 bg-background px-3 py-3 text-left text-sm font-semibold text-muted-foreground">
                      {' '}
                    </th>
                    {jobs.map((job) => (
                      <th key={job.id} className="min-w-[11rem] px-3 py-3 text-left align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{job.country}</p>
                            <p className="line-clamp-2 text-sm font-normal text-muted-foreground">{job.title}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            aria-label={`Remove ${job.country}`}
                            onClick={() => onRemoveJob(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.key} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td
                        className={`sticky left-0 px-3 py-3 text-sm font-medium text-muted-foreground ${index % 2 === 0 ? 'bg-muted' : 'bg-background'}`}
                      >
                        <span className="flex items-center gap-2">
                          <row.icon className="h-4 w-4 shrink-0" />
                          {row.label}
                        </span>
                      </td>
                      {jobs.map((job) => (
                        <td key={job.id} className="px-3 py-3 text-sm text-foreground">
                          {row.key === 'salary' ? (
                            <span className="inline-flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-primary">{cell(job, row.key)}</span>
                              {isHigherSalary(job) && (
                                <Badge className="border-success/20 bg-success/10 font-normal text-success">
                                  Higher
                                </Badge>
                              )}
                            </span>
                          ) : (
                            cell(job, row.key)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="sticky left-0 bg-background px-3 py-4" />
                    {jobs.map((job) => (
                      <td key={job.id} className="px-3 py-4">
                        <Button size="sm" asChild>
                          <Link to={`/jobs/${job.slug}`}>View job</Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
