import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import HindiText from '@/components/indian-workforce/HindiText';
import {
  INDEMNITY_BOND_CLAUSES,
  INDEMNITY_BOND_PARTICULARS,
  INDEMNITY_BOND_PREAMBLE,
  INDEMNITY_BOND_SCHEDULE_A,
  INDEMNITY_BOND_SCHEDULE_B,
  INDEMNITY_BOND_SIGNATURES,
  INDEMNITY_BOND_SUBTITLE,
  INDEMNITY_BOND_TITLE,
  INDEMNITY_BOND_VERSION,
  type BondLang,
} from '@/modules/worker-verification/agreement/indemnityBondContent';

const HINDI_FONT =
  'Kohinoor Devanagari, Devanagari Sangam MN, Nirmala UI, Noto Sans Devanagari, Mangal, ui-sans-serif, system-ui, sans-serif';

function printAgreement() {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
  if (!win) return;
  const clauses = INDEMNITY_BOND_CLAUSES.map(
    (c) =>
      `<p style="margin:0 0 10px"><strong>${c.no}.</strong> ${c.hi}</p><p style="margin:0 0 16px;color:#444">${c.en}</p>`,
  ).join('');
  const sigHi = INDEMNITY_BOND_SIGNATURES.hi.map((l) => `<p>${l}</p>`).join('');
  const sigEn = INDEMNITY_BOND_SIGNATURES.en.map((l) => `<p>${l}</p>`).join('');
  const fields = (list: readonly string[]) =>
    list.map((f) => `<p>${f}: ________________________________</p>`).join('');
  win.document.write(`<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>${INDEMNITY_BOND_TITLE.en}</title>
  <style>
    body { font-family: ${HINDI_FONT}; font-size: 12.5px; line-height: 1.55; color: #111; max-width: 720px; margin: 24px auto; padding: 0 20px; }
    h1 { font-size: 18px; margin: 0 0 4px; text-align: center; }
    h2 { font-size: 13px; margin: 0 0 16px; text-align: center; font-weight: 600; }
    h3 { font-size: 13px; margin: 22px 0 8px; }
    .muted { color: #555; font-size: 11px; text-align: center; margin-bottom: 18px; }
    .block { margin-bottom: 14px; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>${INDEMNITY_BOND_TITLE.hi}</h1>
  <h2>${INDEMNITY_BOND_TITLE.en}</h2>
  <p class="muted">${INDEMNITY_BOND_SUBTITLE.en} · ${INDEMNITY_BOND_VERSION}</p>
  <div class="block"><p>${INDEMNITY_BOND_PREAMBLE.hi}</p><p>${INDEMNITY_BOND_PREAMBLE.en}</p></div>
  <h3>अभ्यर्थी / Candidate</h3>
  ${fields(INDEMNITY_BOND_PARTICULARS.candidate.hi)}
  <h3>गारंटर / Guarantor</h3>
  ${fields(INDEMNITY_BOND_PARTICULARS.guarantor.hi)}
  <h3>रोजगार विवरण / Employment</h3>
  ${fields(INDEMNITY_BOND_PARTICULARS.employment.hi)}
  <h3>नियम एवं शर्तें / Terms</h3>
  ${clauses}
  <h3>हस्ताक्षर / Signatures</h3>
  ${sigHi}
  <p class="muted">${sigEn.replace(/<\/p><p>/g, ' · ').replace(/<\/?p>/g, '')}</p>
  <h3>${INDEMNITY_BOND_SCHEDULE_A.title.hi}</h3>
  ${fields(INDEMNITY_BOND_SCHEDULE_A.fields.hi)}
  <h3>${INDEMNITY_BOND_SCHEDULE_B.title.hi}</h3>
  <p>${INDEMNITY_BOND_SCHEDULE_B.body.hi}</p>
  <p>${INDEMNITY_BOND_SCHEDULE_B.body.en}</p>
</body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
}

function BlankLine() {
  return <span className="ml-1 inline-block min-w-[10rem] border-b border-dotted border-foreground/40" />;
}

function Particulars({ lang, labels }: { lang: BondLang; labels: readonly string[] }) {
  return (
    <ul className="space-y-1.5">
      {labels.map((label) => (
        <li key={label} className="flex items-baseline text-xs text-foreground">
          {lang === 'hi' ? (
            <HindiText className="shrink-0">{label}</HindiText>
          ) : (
            <span className="shrink-0">{label}</span>
          )}
          <BlankLine />
        </li>
      ))}
    </ul>
  );
}

interface Props {
  className?: string;
  /** Scroll viewport height, e.g. h-[320px] */
  heightClass?: string;
  showPrintButton?: boolean;
}

export default function IndemnityBondAgreement({
  className,
  heightClass = 'h-[360px]',
  showPrintButton = false,
}: Props) {
  const [lang, setLang] = useState<BondLang>('hi');

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={cn(
              'rounded-md px-2.5 py-1 font-medium',
              lang === 'hi' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={cn(
              'rounded-md px-2.5 py-1 font-medium',
              lang === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            English
          </button>
        </div>
        {showPrintButton ? (
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={printAgreement}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print for stamp paper
          </Button>
        ) : null}
      </div>

      <ScrollArea className={cn('rounded-lg border border-border bg-muted/20 p-4', heightClass)}>
        <div className="space-y-4 pr-3 text-sm">
          <div className="text-center">
            {lang === 'hi' ? (
              <>
                <HindiText className="font-heading text-base font-bold leading-snug">
                  {INDEMNITY_BOND_TITLE.hi}
                </HindiText>
                <p className="mt-1 text-xs text-muted-foreground">{INDEMNITY_BOND_SUBTITLE.en}</p>
              </>
            ) : (
              <>
                <h3 className="font-heading text-base font-bold leading-snug">{INDEMNITY_BOND_TITLE.en}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{INDEMNITY_BOND_SUBTITLE.en}</p>
              </>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Version {INDEMNITY_BOND_VERSION}</p>
          </div>

          {lang === 'hi' ? (
            <HindiText className="text-xs leading-relaxed text-muted-foreground">
              {INDEMNITY_BOND_PREAMBLE.hi}
            </HindiText>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">{INDEMNITY_BOND_PREAMBLE.en}</p>
          )}

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
              {lang === 'hi' ? 'अभ्यर्थी' : 'Candidate'}
            </p>
            <Particulars lang={lang} labels={INDEMNITY_BOND_PARTICULARS.candidate[lang]} />
          </section>
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
              {lang === 'hi' ? 'गारंटर' : 'Guarantor'}
            </p>
            <Particulars lang={lang} labels={INDEMNITY_BOND_PARTICULARS.guarantor[lang]} />
          </section>
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
              {lang === 'hi' ? 'रोजगार विवरण' : 'Employment details'}
            </p>
            <Particulars lang={lang} labels={INDEMNITY_BOND_PARTICULARS.employment[lang]} />
          </section>

          <ol className="space-y-3">
            {INDEMNITY_BOND_CLAUSES.map((clause) => (
              <li key={clause.no} className="text-xs leading-relaxed">
                <span className="font-semibold">{clause.no}. </span>
                {lang === 'hi' ? (
                  <HindiText className="inline">{clause.hi}</HindiText>
                ) : (
                  <span>{clause.en}</span>
                )}
              </li>
            ))}
          </ol>

          <section className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
              {lang === 'hi' ? 'हस्ताक्षर' : 'Signatures'}
            </p>
            <ul className="space-y-1.5 text-xs">
              {INDEMNITY_BOND_SIGNATURES[lang].map((line) => (
                <li key={line}>
                  {lang === 'hi' ? <HindiText>{line}</HindiText> : line}
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold">
              {lang === 'hi' ? INDEMNITY_BOND_SCHEDULE_A.title.hi : INDEMNITY_BOND_SCHEDULE_A.title.en}
            </p>
            <Particulars lang={lang} labels={INDEMNITY_BOND_SCHEDULE_A.fields[lang]} />
          </section>

          <section className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold">
              {lang === 'hi' ? INDEMNITY_BOND_SCHEDULE_B.title.hi : INDEMNITY_BOND_SCHEDULE_B.title.en}
            </p>
            {lang === 'hi' ? (
              <HindiText className="text-xs leading-relaxed text-muted-foreground">
                {INDEMNITY_BOND_SCHEDULE_B.body.hi}
              </HindiText>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {INDEMNITY_BOND_SCHEDULE_B.body.en}
              </p>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
