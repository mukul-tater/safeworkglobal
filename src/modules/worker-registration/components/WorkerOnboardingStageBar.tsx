import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ONBOARDING_STEPS, STAGE_LABELS, type OnboardingStage } from '../types/onboarding.types';
import { cn } from '@/lib/utils';

interface Props {
  currentStep: number;
  onboardingStage: OnboardingStage;
  skillsWithMediaCount: number;
  onboardingCompleted: boolean;
}

export default function WorkerOnboardingStageBar({
  currentStep,
  onboardingStage,
  skillsWithMediaCount,
  onboardingCompleted,
}: Props) {
  const stages: { key: OnboardingStage; label: string; done: boolean }[] = [
    { key: 'REGISTERED', label: STAGE_LABELS.REGISTERED, done: currentStep > 1 || onboardingStage !== 'REGISTERED' },
    {
      key: 'PROFILE_COMPLETE',
      label: STAGE_LABELS.PROFILE_COMPLETE,
      done: currentStep > 2 || ['SKILLS_UPLOADED', 'JOB_READY'].includes(onboardingStage),
    },
    {
      key: 'SKILLS_UPLOADED',
      label: STAGE_LABELS.SKILLS_UPLOADED,
      done: skillsWithMediaCount > 0 || onboardingStage === 'JOB_READY' || onboardingCompleted,
    },
    {
      key: 'JOB_READY',
      label: STAGE_LABELS.JOB_READY,
      done: onboardingCompleted,
    },
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <Badge
            key={stage.key}
            variant={stage.done ? 'default' : 'outline'}
            className={cn('gap-1', stage.done && 'bg-success hover:bg-success/90')}
          >
            {stage.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {stage.label}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Step {currentStep} of {ONBOARDING_STEPS.length} — {ONBOARDING_STEPS[currentStep - 1]?.title}
        {skillsWithMediaCount > 0 && ` · ${skillsWithMediaCount} skill(s) with photos/videos`}
      </p>
    </div>
  );
}
