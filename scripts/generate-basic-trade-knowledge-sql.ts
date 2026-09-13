/**
 * Emits the Test 1 MCQ seed SQL from BASIC_TRADE_KNOWLEDGE_BANK.
 * Run: npx tsx scripts/generate-basic-trade-knowledge-sql.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UAE_LISTED_JOBS } from '../src/lib/uaeListedJobs.ts';
import { BASIC_TRADE_KNOWLEDGE_BANK } from '../src/modules/worker-verification/quiz-data/basic-trade-knowledge.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

const rows: string[] = [];
for (const skill of UAE_LISTED_JOBS) {
  const questions = BASIC_TRADE_KNOWLEDGE_BANK[skill];
  if (questions.length !== 10) {
    throw new Error(`${skill} has ${questions.length} questions, expected 10`);
  }
  questions.forEach((q, index) => {
    rows.push(
      `  (${sqlLiteral(skill)}, ${sqlLiteral(q.question)}, ${sqlLiteral(q.question_hi)}, ${sqlLiteral(JSON.stringify(q.options))}::jsonb, ${sqlLiteral(q.correct)}, ${index + 1})`,
    );
  });
}

const seedSql = `INSERT INTO public.worker_skill_quiz_items
  (skill_code, question, question_hi, options, correct_option, sort_order)
VALUES
${rows.join(',\n')};
`;

const outPath = join(__dirname, 'generated-basic-trade-knowledge-seed.sql');
writeFileSync(outPath, seedSql);
console.log(`Wrote ${rows.length} question rows to ${outPath}`);
