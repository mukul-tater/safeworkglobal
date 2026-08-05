import {
  GCC_JOURNEY_NAV_STEPS,
  navStepForStage,
  navStepIndex,
  type GccNavStepId,
  type VerificationStage,
} from '@/modules/worker-verification/constants';

/**
 * Presentation-only grouping of the 12 GCC nav steps into 4 named phases.
 * The database `stage` enum is unchanged — this only makes the journey feel
 * like four short chapters instead of an endless 12-step list.
 */
export type JourneyPhaseId = 'profile' | 'verify' | 'assess' | 'deploy';

export interface JourneyPhase {
  id: JourneyPhaseId;
  label: string;
  /** Nav steps that belong to this phase, in order. */
  steps: GccNavStepId[];
}

export const JOURNEY_PHASES: JourneyPhase[] = [
  { id: 'profile', label: 'Profile', steps: ['essentials', 'test1', 'skill_proof'] },
  { id: 'verify', label: 'Verify', steps: ['identity', 'test2'] },
  { id: 'assess', label: 'Assess', steps: ['payment', 'test3', 'medical'] },
  { id: 'deploy', label: 'Deploy', steps: ['bond', 'pdot', 'gcc_ready', 'deployment'] },
];

export type PhaseStatus = 'completed' | 'current' | 'upcoming';

const STEP_TO_PHASE: Record<GccNavStepId, JourneyPhaseId> = (() => {
  const map = {} as Record<GccNavStepId, JourneyPhaseId>;
  for (const phase of JOURNEY_PHASES) {
    for (const step of phase.steps) map[step] = phase.id;
  }
  return map;
})();

export function phaseForNavStep(step: GccNavStepId): JourneyPhaseId {
  return STEP_TO_PHASE[step] ?? 'profile';
}

export function phaseForStage(stage: VerificationStage): JourneyPhaseId {
  return phaseForNavStep(navStepForStage(stage));
}

export function phaseIndex(id: JourneyPhaseId): number {
  return JOURNEY_PHASES.findIndex((p) => p.id === id);
}

/** Overall journey completion as a percentage of the 12 nav steps. */
export function journeyProgressPercent(stage: VerificationStage): number {
  const idx = navStepIndex(navStepForStage(stage));
  return Math.round(((idx + 1) / GCC_JOURNEY_NAV_STEPS.length) * 100);
}

/** 1-based position of the current stage across all 12 nav steps. */
export function stepPositionForStage(stage: VerificationStage): {
  position: number;
  total: number;
} {
  return {
    position: navStepIndex(navStepForStage(stage)) + 1,
    total: GCC_JOURNEY_NAV_STEPS.length,
  };
}

/** Status of each phase relative to the worker's current stage. */
export function phaseStatusesForStage(
  stage: VerificationStage,
): Record<JourneyPhaseId, PhaseStatus> {
  const currentPhase = phaseForStage(stage);
  const curIdx = phaseIndex(currentPhase);
  const out = {} as Record<JourneyPhaseId, PhaseStatus>;
  for (const phase of JOURNEY_PHASES) {
    const i = phaseIndex(phase.id);
    // gcc_ready means Profile/Verify/Assess are all behind us.
    if (stage === 'gcc_ready' && i <= curIdx) out[phase.id] = 'completed';
    else if (i < curIdx) out[phase.id] = 'completed';
    else if (i === curIdx) out[phase.id] = 'current';
    else out[phase.id] = 'upcoming';
  }
  return out;
}

/** Position of the current step within its phase, e.g. "2 of 3 in Verify". */
export function stepWithinPhase(stage: VerificationStage): {
  phase: JourneyPhase;
  position: number;
  total: number;
} {
  const phaseId = phaseForStage(stage);
  const phase = JOURNEY_PHASES[phaseIndex(phaseId)];
  const navId = navStepForStage(stage);
  const position = Math.max(1, phase.steps.indexOf(navId) + 1);
  return { phase, position, total: phase.steps.length };
}
