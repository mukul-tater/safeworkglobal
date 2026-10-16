import { isEuropeQuizJob } from '@/lib/europeQuizJobs';
import { UAE_LISTED_JOBS, type UaeListedJob } from '@/lib/uaeListedJobs';
import { BASIC_TRADE_KNOWLEDGE_BANK, type TradeQuizQuestion } from './basic-trade-knowledge';
import { EUROPE_TRADE_KNOWLEDGE_BANK } from './europe-trade-knowledge';

/** Bundled 10-question MCQ paper for a UAE trade or a Czech listing that has one. */
export function bundledMcqBank(skill: string): TradeQuizQuestion[] | null {
  if ((UAE_LISTED_JOBS as readonly string[]).includes(skill)) {
    return BASIC_TRADE_KNOWLEDGE_BANK[skill as UaeListedJob];
  }
  if (isEuropeQuizJob(skill)) return EUROPE_TRADE_KNOWLEDGE_BANK[skill];
  return null;
}
