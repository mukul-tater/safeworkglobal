import { GCC_JOURNEY_NAV_STEPS } from '@/modules/worker-verification/constants';
import { defaultJourneyCopy, type EnHi, type JourneyCopy } from '@/lib/journeyCopy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function EnHiFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: EnHi;
  onChange: (value: EnHi) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{label} (English)</Label>
        <Input value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>{label} (Hindi)</Label>
        <Input value={value.hi} onChange={(event) => onChange({ ...value, hi: event.target.value })} />
      </div>
    </div>
  );
}

export default function JourneyCopyFields({
  value,
  onChange,
}: {
  value: JourneyCopy;
  onChange: (value: JourneyCopy) => void;
}) {
  const patch = (next: Partial<JourneyCopy>) => onChange({ ...value, ...next });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents notice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Shown before the screening questions. Aadhaar is required now. PAN and passport can come later.
          </p>
          <EnHiFields label="Badge" value={value.documents.badge} onChange={(badge) => patch({ documents: { ...value.documents, badge } })} />
          <EnHiFields label="Title" value={value.documents.title} onChange={(title) => patch({ documents: { ...value.documents, title } })} />
          <EnHiFields label="Notice" value={value.documents.body} onChange={(body) => patch({ documents: { ...value.documents, body } })} />
          {value.documents.items.map((item, index) => (
            <EnHiFields
              key={index}
              label={`Document ${index + 1}`}
              value={item}
              onChange={(next) => {
                const items = value.documents.items.map((current, i) => (i === index ? next : current));
                patch({ documents: { ...value.documents, items } });
              }}
            />
          ))}
          <EnHiFields
            label="Continue button"
            value={value.documents.continue}
            onChange={(next) => patch({ documents: { ...value.documents, continue: next } })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support panel and contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The journey help column, plus the email, WhatsApp number, and office addresses used across the site.
          </p>
          <div className="space-y-1.5">
            <Label>Coming up heading</Label>
            <Input value={value.support.comingUp} onChange={(event) => patch({ support: { ...value.support, comingUp: event.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label>Data safety heading</Label>
            <Input
              value={value.support.dataSafeTitle}
              onChange={(event) => patch({ support: { ...value.support, dataSafeTitle: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data safety lines</Label>
            <Textarea
              rows={3}
              value={value.support.dataSafeBullets.join('\n')}
              onChange={(event) =>
                patch({
                  support: {
                    ...value.support,
                    dataSafeBullets: event.target.value.replace(/\r/g, '').split('\n'),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Help heading</Label>
            <Input value={value.support.helpTitle} onChange={(event) => patch({ support: { ...value.support, helpTitle: event.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label>Help text</Label>
            <Textarea
              rows={3}
              value={value.support.helpBody}
              onChange={(event) => patch({ support: { ...value.support, helpBody: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Support email</Label>
            <Input value={value.support.email} onChange={(event) => patch({ support: { ...value.support, email: event.target.value } })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>WhatsApp display</Label>
              <Input
                value={value.support.whatsappDisplay}
                onChange={(event) => patch({ support: { ...value.support, whatsappDisplay: event.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp digits</Label>
              <Input
                value={value.support.whatsappDigits}
                onChange={(event) => patch({ support: { ...value.support, whatsappDigits: event.target.value } })}
              />
              <p className="text-xs text-muted-foreground">Country code plus number, digits only. Used for WhatsApp and call links.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Registered address</Label>
            <Textarea
              rows={2}
              value={value.support.officeAddress}
              onChange={(event) => patch({ support: { ...value.support, officeAddress: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Working address</Label>
            <Textarea
              rows={2}
              value={value.support.workingAddress}
              onChange={(event) => patch({ support: { ...value.support, workingAddress: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Footer office addresses</Label>
            <Textarea
              rows={3}
              value={value.support.footerAddresses.join('\n')}
              onChange={(event) =>
                patch({
                  support: {
                    ...value.support,
                    footerAddresses: event.target.value.replace(/\r/g, '').split('\n'),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email gate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label>Sentence under the email field</Label>
          <Textarea
            rows={2}
            value={value.emailGateSentence}
            onChange={(event) => patch({ emailGateSentence: event.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test 1 score labels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pass still uses the job or Quiz CMS pass mark. These labels and the 90 / 50 bands only change the words on the result.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Strong from (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={value.quiz.strongMin}
                onChange={(event) => patch({ quiz: { ...value.quiz, strongMin: Number(event.target.value) } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Needs review from (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={value.quiz.reviewMin}
                onChange={(event) => patch({ quiz: { ...value.quiz, reviewMin: Number(event.target.value) } })}
              />
            </div>
          </div>
          <EnHiFields label="Strong" value={value.quiz.strong} onChange={(strong) => patch({ quiz: { ...value.quiz, strong } })} />
          <EnHiFields label="Pass" value={value.quiz.pass} onChange={(pass) => patch({ quiz: { ...value.quiz, pass } })} />
          <EnHiFields label="Needs review" value={value.quiz.review} onChange={(review) => patch({ quiz: { ...value.quiz, review } })} />
          <EnHiFields
            label="Insufficient"
            value={value.quiz.insufficient}
            onChange={(insufficient) => patch({ quiz: { ...value.quiz, insufficient } })}
          />
          <EnHiFields
            label="Screening passed"
            value={value.quiz.screeningPassed}
            onChange={(screeningPassed) => patch({ quiz: { ...value.quiz, screeningPassed } })}
          />
          <EnHiFields
            label="Screening not passed"
            value={value.quiz.screeningFailed}
            onChange={(screeningFailed) => patch({ quiz: { ...value.quiz, screeningFailed } })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase and stage names</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Names only. The step order stays the same. Medical, overseas, and agent-fee questions, and the acknowledgements, stay on Site content.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['profile', 'verify', 'assess', 'deploy'] as const).map((id) => (
              <div key={id} className="space-y-1.5">
                <Label>{id[0].toUpperCase() + id.slice(1)}</Label>
                <Input
                  value={value.phases[id]}
                  onChange={(event) => patch({ phases: { ...value.phases, [id]: event.target.value } })}
                />
              </div>
            ))}
          </div>
          {GCC_JOURNEY_NAV_STEPS.map((step) => {
            const labels = value.stages[step.id] || { label: step.label, shortLabel: step.shortLabel, navLabel: step.navLabel };
            const update = (field: 'label' | 'shortLabel' | 'navLabel', next: string) =>
              patch({ stages: { ...value.stages, [step.id]: { ...labels, [field]: next } } });
            return (
              <div key={step.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <Label>{labels.label || step.id}</Label>
                </div>
                <Input value={labels.label} onChange={(event) => update('label', event.target.value)} placeholder="Label" />
                <Input value={labels.shortLabel} onChange={(event) => update('shortLabel', event.target.value)} placeholder="Short" />
                <Input value={labels.navLabel} onChange={(event) => update('navLabel', event.target.value)} placeholder="Sidebar" />
              </div>
            );
          })}
          <Button type="button" variant="outline" onClick={() => onChange(defaultJourneyCopy())}>
            Use built-in wording
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
