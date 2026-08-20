import { useState } from 'react';
import {
  CheckCircle2,
  Stethoscope,
  Globe2,
  UserCheck,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CANDIDATE_ACKNOWLEDGEMENT_ITEMS,
  type WorkerPreJourneyDeclaration,
} from '@/modules/worker-verification/types/declarations.types';

interface Props {
  declaration: WorkerPreJourneyDeclaration;
  className?: string;
}

function formatYesNo(value: string | undefined): string {
  if (!value) return '—';
  if (value === 'not_sure') return 'Not sure';
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  return value;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function WorkerDeclarationsSummary({ declaration, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = declaration.completed_at
    ? new Date(declaration.completed_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Completed';

  const acceptedCount = CANDIDATE_ACKNOWLEDGEMENT_ITEMS.filter(
    (item) => declaration.acknowledgements?.[item.key],
  ).length;

  return (
    <Card className={cn('border-emerald-500/30 bg-emerald-500/5', className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0">
              <CardTitle className="text-sm font-bold text-foreground">
                Pre-Journey Declarations & Screening Verified
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Completed on {formattedDate} • {acceptedCount}/{CANDIDATE_ACKNOWLEDGEMENT_ITEMS.length}{' '}
                Candidate Acknowledgements Verified
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 shrink-0 gap-1 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {expanded ? (
              <>
                Hide Details <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                View Declarations <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="mt-2 space-y-4 border-t border-emerald-500/20 p-4 pt-3 text-sm">
          <div className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5 text-primary" /> Medical & Fitness
            </h4>
            <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-border/40 bg-background/60 p-3 sm:grid-cols-2">
              <Detail
                label="Physically fit for the trade"
                value={formatYesNo(declaration.medical?.fitForDuties)}
              />
              <Detail
                label="Medical condition or limitation"
                value={formatYesNo(declaration.medical?.hasMedicalCondition)}
              />
              {declaration.medical?.hasMedicalCondition === 'yes' &&
                declaration.medical?.medicalConditionDetails && (
                  <div className="sm:col-span-2">
                    <Detail
                      label="Condition details"
                      value={declaration.medical.medicalConditionDetails}
                    />
                  </div>
                )}
            </dl>
          </div>

          <div className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Globe2 className="h-3.5 w-3.5 text-primary" /> Previous Overseas Employment
            </h4>
            <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-border/40 bg-background/60 p-3 sm:grid-cols-2">
              <Detail
                label="Worked outside India"
                value={formatYesNo(declaration.overseas?.workedOutsideIndia)}
              />
              {declaration.overseas?.workedOutsideIndia === 'yes' && declaration.overseas?.overseasDetails && (
                <>
                  <Detail
                    label="Country"
                    value={declaration.overseas.overseasDetails.country || '—'}
                  />
                  <Detail
                    label="Employer"
                    value={declaration.overseas.overseasDetails.employer || '—'}
                  />
                  <Detail
                    label="Job / trade"
                    value={declaration.overseas.overseasDetails.jobTrade || '—'}
                  />
                  <Detail
                    label="Duration"
                    value={declaration.overseas.overseasDetails.duration || '—'}
                  />
                  <Detail label="Year" value={declaration.overseas.overseasDetails.year || '—'} />
                </>
              )}
              <Detail
                label="Deported / repatriated"
                value={formatYesNo(declaration.overseas?.beenDeported)}
              />
              {declaration.overseas?.beenDeported === 'yes' && declaration.overseas?.deportedDetails && (
                <Detail label="Deportation details" value={declaration.overseas.deportedDetails} />
              )}
              <Detail
                label="Visa or entry refused"
                value={formatYesNo(declaration.overseas?.refusedVisaOrEntry)}
              />
              {declaration.overseas?.refusedVisaOrEntry === 'yes' &&
                declaration.overseas?.refusedVisaDetails && (
                  <Detail label="Refusal details" value={declaration.overseas.refusedVisaDetails} />
                )}
              <Detail
                label="Overstayed visa"
                value={formatYesNo(declaration.overseas?.overstayedVisa)}
              />
              {declaration.overseas?.overstayedVisa === 'yes' && declaration.overseas?.overstayedDetails && (
                <Detail label="Overstay details" value={declaration.overseas.overstayedDetails} />
              )}
            </dl>
          </div>

          <div className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5 text-primary" /> Recruitment & Agent History
            </h4>
            <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-border/40 bg-background/60 p-3 sm:grid-cols-2">
              <Detail
                label="Registered with another agency"
                value={formatYesNo(declaration.recruitment?.registeredWithOtherAgency)}
              />
              {declaration.recruitment?.registeredWithOtherAgency === 'yes' &&
                declaration.recruitment?.agencyDetails && (
                  <Detail label="Agency details" value={declaration.recruitment.agencyDetails} />
                )}
              <Detail
                label="Paid money for a job"
                value={formatYesNo(declaration.recruitment?.paidMoneyForJob)}
              />
              {declaration.recruitment?.paidMoneyForJob === 'yes' &&
                declaration.recruitment?.paidAmountDetails && (
                  <Detail
                    label="Payment details"
                    value={declaration.recruitment.paidAmountDetails}
                  />
                )}
              <Detail
                label="Guaranteed job promised for money"
                value={formatYesNo(declaration.recruitment?.promisedGuaranteedJobForMoney)}
              />
              {declaration.recruitment?.promisedGuaranteedJobForMoney === 'yes' &&
                declaration.recruitment?.promisedJobDetails && (
                  <Detail
                    label="Promise details"
                    value={declaration.recruitment.promisedJobDetails}
                  />
                )}
            </dl>
          </div>

          <div className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Candidate Acknowledgements (
              {acceptedCount}/{CANDIDATE_ACKNOWLEDGEMENT_ITEMS.length} verified)
            </h4>
            <ul className="grid grid-cols-1 gap-2">
              {CANDIDATE_ACKNOWLEDGEMENT_ITEMS.map((item, idx) => {
                const accepted = Boolean(declaration.acknowledgements?.[item.key]);
                return (
                  <li
                    key={item.key}
                    className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2"
                  >
                    <CheckCircle2
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        accepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                      )}
                    />
                    <span className="text-sm leading-snug text-foreground">
                      <span className="mr-1 text-xs font-semibold text-muted-foreground">
                        [{idx + 1}]
                      </span>
                      {item.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
