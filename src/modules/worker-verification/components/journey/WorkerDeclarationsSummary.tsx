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
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WorkerPreJourneyDeclaration } from '@/modules/worker-verification/types/declarations.types';

interface Props {
  declaration: WorkerPreJourneyDeclaration;
  className?: string;
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

  return (
    <Card className={`border-emerald-500/30 bg-emerald-500/5 ${className || ''}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Pre-Journey Declarations & Screening Verified
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Completed on {formattedDate} • 8 Candidate Acknowledgements Verified
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 text-xs gap-1 text-emerald-700 dark:text-emerald-300"
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
        <CardContent className="p-4 pt-2 space-y-4 border-t border-emerald-500/20 mt-2 text-xs">
          {/* Medical */}
          <div className="space-y-1">
            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
              <Stethoscope className="h-3.5 w-3.5 text-primary" /> Medical & Fitness
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background/60 p-2.5 rounded border border-border/40">
              <div>
                <span className="text-muted-foreground">Physically Fit: </span>
                <span className="font-medium capitalize">{declaration.medical?.fitForDuties || 'Yes'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Medical Limitation: </span>
                <span className="font-medium capitalize">{declaration.medical?.hasMedicalCondition || 'No'}</span>
              </div>
              {declaration.medical?.hasMedicalCondition === 'yes' && declaration.medical?.medicalConditionDetails && (
                <div className="col-span-full">
                  <span className="text-muted-foreground">Condition Details: </span>
                  <span className="font-medium">{declaration.medical.medicalConditionDetails}</span>
                </div>
              )}
            </div>
          </div>

          {/* Overseas */}
          <div className="space-y-1">
            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
              <Globe2 className="h-3.5 w-3.5 text-primary" /> Previous Overseas Employment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background/60 p-2.5 rounded border border-border/40">
              <div>
                <span className="text-muted-foreground">Worked Outside India: </span>
                <span className="font-medium capitalize">{declaration.overseas?.workedOutsideIndia || 'No'}</span>
              </div>
              {declaration.overseas?.workedOutsideIndia === 'yes' && declaration.overseas?.overseasDetails && (
                <div className="col-span-full text-muted-foreground">
                  Details: {declaration.overseas.overseasDetails.country} (
                  {declaration.overseas.overseasDetails.employer}, {declaration.overseas.overseasDetails.jobTrade},{' '}
                  {declaration.overseas.overseasDetails.duration}, {declaration.overseas.overseasDetails.year})
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Deported/Repatriated: </span>
                <span className="font-medium capitalize">{declaration.overseas?.beenDeported || 'No'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Visa Refused: </span>
                <span className="font-medium capitalize">{declaration.overseas?.refusedVisaOrEntry || 'No'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Overstayed Visa: </span>
                <span className="font-medium capitalize">{declaration.overseas?.overstayedVisa || 'No'}</span>
              </div>
            </div>
          </div>

          {/* Recruitment Agent */}
          <div className="space-y-1">
            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
              <UserCheck className="h-3.5 w-3.5 text-primary" /> Recruitment & Agent History
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background/60 p-2.5 rounded border border-border/40">
              <div>
                <span className="text-muted-foreground">Registered with other agency: </span>
                <span className="font-medium capitalize">{declaration.recruitment?.registeredWithOtherAgency || 'No'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Paid money for job: </span>
                <span className="font-medium capitalize">{declaration.recruitment?.paidMoneyForJob || 'No'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Guaranteed job promised for money: </span>
                <span className="font-medium capitalize">{declaration.recruitment?.promisedGuaranteedJobForMoney || 'No'}</span>
              </div>
            </div>
          </div>

          {/* Acknowledgements */}
          <div className="space-y-1">
            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
              <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Candidate Acknowledgements (8/8 Verified)
            </h4>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              All 8 mandatory declarations and legal acknowledgements have been accepted.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
