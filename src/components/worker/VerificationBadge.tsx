import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, Shield, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

export type VerificationLevel = 'fully_verified' | 'partially_verified' | 'pending' | 'not_verified';

interface VerificationBadgeProps {
  level: VerificationLevel;
  idVerified?: boolean;
  documentsVerified?: number;
  totalDocuments?: number;
  ecrStatus?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const levelConfig = {
  fully_verified: {
    icon: ShieldCheck,
    label: 'Fully Verified',
    className: 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20',
    description: 'All documents verified, ID confirmed'
  },
  partially_verified: {
    icon: Shield,
    label: 'Partially Verified',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20',
    description: 'Some documents verified'
  },
  pending: {
    icon: Clock,
    label: 'Verification Pending',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20',
    description: 'Documents under review'
  },
  not_verified: {
    icon: ShieldAlert,
    label: 'Not Verified',
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
    description: 'No verified documents'
  }
};

export function calculateVerificationLevel(
  idVerified: boolean,
  documentsVerified: number,
  hasPassport: boolean,
  ecrStatus?: string
): VerificationLevel {
  const hasEcrClearance = ecrStatus === 'ecnr' || ecrStatus === 'cleared';
  
  if (idVerified && documentsVerified >= 3 && hasPassport && hasEcrClearance) {
    return 'fully_verified';
  }
  
  if (documentsVerified >= 1 || idVerified) {
    return 'partially_verified';
  }
  
  return 'not_verified';
}

export default function VerificationBadge({
  level,
  idVerified,
  documentsVerified,
  totalDocuments,
  ecrStatus,
  size = 'md',
  showDetails = true
}: VerificationBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizeClasses[size]} gap-1.5`}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );

  if (!showDetails) {
    return badgeContent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex min-h-11 items-center" aria-label={`${config.label} details`}>
          {badgeContent}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{config.description}</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                {idVerified ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Clock className="h-3 w-3 text-muted-foreground" />
                )}
                <span>ID Verification: {idVerified ? 'Confirmed' : 'Pending'}</span>
              </div>
              {totalDocuments !== undefined && documentsVerified !== undefined && (
                <div className="flex items-center gap-2">
                  {documentsVerified > 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>Documents: {documentsVerified}/{totalDocuments} verified</span>
                </div>
              )}
              {ecrStatus && (
                <div className="flex items-center gap-2">
                  {ecrStatus === 'ecnr' || ecrStatus === 'cleared' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>ECR Status: {ecrStatus.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
      </PopoverContent>
    </Popover>
  );
}
