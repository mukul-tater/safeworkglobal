import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  checklistKeyFromLabel,
  getJourneyRules,
  isBuiltinDeploymentKey,
  journeyRulesFromDatabase,
  loadJourneyRules,
  saveJourneyRules,
  tradeTestSkillCatalog,
  type DeploymentChecklistItem,
  type MedicalTestCopy,
} from '@/lib/journeyRules';
import type { WorkerTermsSection } from '@/modules/worker-verification/constants';

export default function AdminJourneyRules() {
  const catalog = useMemo(() => tradeTestSkillCatalog(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stored, setStored] = useState(true);
  const [loadedVersion, setLoadedVersion] = useState('');
  const [loadedContent, setLoadedContent] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [medicalIntro, setMedicalIntro] = useState('');
  const [tests, setTests] = useState<MedicalTestCopy[]>([]);
  const [checklist, setChecklist] = useState<DeploymentChecklistItem[]>([]);
  const [termsVersion, setTermsVersion] = useState('');
  const [termsSummary, setTermsSummary] = useState('');
  const [sections, setSections] = useState<WorkerTermsSection[]>([]);
  const [identityWait, setIdentityWait] = useState('');
  const [interviewWait, setInterviewWait] = useState('');
  const [pdotWait, setPdotWait] = useState('');
  const [offerWait, setOfferWait] = useState('');

  const skillOptions = useMemo(
    () => [...catalog, ...skills.filter((skill) => !catalog.includes(skill))],
    [catalog, skills],
  );

  useEffect(() => {
    let cancelled = false;
    void loadJourneyRules()
      .then((rules) => {
        if (cancelled) return;
        setSkills(rules.tradeTestSkills);
        setMedicalIntro(rules.medicalIntro);
        setTests(rules.medicalTests);
        setChecklist(rules.deploymentChecklist);
        setTermsVersion(rules.termsVersion);
        setTermsSummary(rules.termsSummary);
        setSections(rules.termsSections);
        setIdentityWait(rules.stageExpectations.identity);
        setInterviewWait(rules.stageExpectations.interview);
        setPdotWait(rules.stageExpectations.pdot);
        setOfferWait(rules.stageExpectations.offer);
        setLoadedVersion(rules.termsVersion);
        setLoadedContent(JSON.stringify({ summary: rules.termsSummary, sections: rules.termsSections }));
        setStored(journeyRulesFromDatabase());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSkill = (skill: string, on: boolean) => {
    setSkills((current) => {
      if (on) return current.includes(skill) ? current : [...current, skill];
      return current.filter((item) => item !== skill);
    });
  };

  const save = async () => {
    try {
      const chosen = skills.map((skill) => skill.trim()).filter(Boolean);
      if (chosen.length < 1) throw new Error('Choose at least one trade that requires a physical trade test');
      const medical = tests.map((test) => ({ title: test.title.trim(), body: test.body.trim() }));
      if (!medicalIntro.trim() || medical.length < 1) {
        throw new Error('Medical instructions and at least one test are required');
      }
      const items = checklist.map((item) => ({
        key: item.key.trim().toLowerCase(),
        label: item.label.trim(),
      }));
      if (items.length < 1) throw new Error('Keep at least one deployment checklist item');
      if (new Set(items.map((item) => item.key)).size !== items.length) {
        throw new Error('Deployment checklist keys must be unique');
      }
      const nextSections = sections.map((section) => ({
        id: section.id.trim().toLowerCase(),
        title: section.title.trim(),
        body: section.body.trim(),
      }));
      if (nextSections.length < 1 || !termsSummary.trim()) {
        throw new Error('Terms need a summary and at least one section');
      }
      const content = JSON.stringify({ summary: termsSummary.trim(), sections: nextSections });
      let version = termsVersion.trim();
      if (content !== loadedContent && version === loadedVersion) {
        const day = `worker-${new Date().toISOString().slice(0, 10)}`;
        version = version === day ? `${day}-${Date.now().toString(36).slice(-4)}` : day;
      }
      setSaving(true);
      await saveJourneyRules({
        tradeTestSkills: chosen,
        medicalIntro: medicalIntro.trim(),
        medicalTests: medical,
        deploymentChecklist: items,
        termsVersion: version,
        termsSummary: termsSummary.trim(),
        termsSections: nextSections,
        stageExpectations: {
          identity: identityWait.trim(),
          interview: interviewWait.trim(),
          pdot: pdotWait.trim(),
          offer: offerWait.trim(),
        },
      });
      const saved = getJourneyRules();
      setTermsVersion(saved.termsVersion);
      setLoadedVersion(saved.termsVersion);
      setLoadedContent(JSON.stringify({ summary: saved.termsSummary, sections: saved.termsSections }));
      setStored(true);
      toast.success('Journey rules saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save journey rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Journey rules</h1>
          <p className="text-sm text-muted-foreground">
            These rules apply the next time a worker is checked. Someone already past a step keeps the decision stored on their journey.
            Changing the terms text starts a new version so the next agreement is the updated text.
          </p>
        </div>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {!stored && (
              <p className="text-sm text-amber-800">
                Showing the built-in rules. Saving needs the journey rules migration applied on the database.
              </p>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stage timing</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Identity review</Label>
                  <Input value={identityWait} onChange={(e) => setIdentityWait(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Interview scheduling</Label>
                  <Input value={interviewWait} onChange={(e) => setInterviewWait(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>PDOT batch</Label>
                  <Input value={pdotWait} onChange={(e) => setPdotWait(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Offer letter</Label>
                  <Input value={offerWait} onChange={(e) => setOfferWait(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trades that require a physical trade test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Unchecked trades skip Test 3 and go to the medical step after payment.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={skills.includes(skill)}
                        onCheckedChange={(value) => toggleSkill(skill, value === true)}
                      />
                      {skill}
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label>Add a trade</Label>
                    <Input
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Trade name"
                      className="w-56"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const name = customSkill.trim();
                      if (!name) return;
                      toggleSkill(name, true);
                      setCustomSkill('');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Instructions</Label>
                  <Textarea value={medicalIntro} onChange={(e) => setMedicalIntro(e.target.value)} rows={3} />
                </div>
                {tests.map((test, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Test {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove test"
                        disabled={tests.length === 1}
                        onClick={() => setTests(tests.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={test.title}
                      onChange={(e) => {
                        const next = [...tests];
                        next[index] = { ...test, title: e.target.value };
                        setTests(next);
                      }}
                      placeholder="Title"
                    />
                    <Textarea
                      value={test.body}
                      rows={3}
                      onChange={(e) => {
                        const next = [...tests];
                        next[index] = { ...test, body: e.target.value };
                        setTests(next);
                      }}
                      placeholder="What the worker should know"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setTests([...tests, { title: '', body: '' }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deployment checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Offer, contract, emigration, visa, insurance, and ticket stay on the worker record. Extra items are saved beside them.
                </p>
                {checklist.map((item, index) => (
                  <div key={`${item.key}-${index}`} className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1.5">
                      <Label>Key</Label>
                      <Input value={item.key} disabled className="w-36" />
                    </div>
                    <div className="min-w-[16rem] flex-1 space-y-1.5">
                      <Label>Label</Label>
                      <Input
                        value={item.label}
                        onChange={(e) => {
                          const next = [...checklist];
                          next[index] = { ...item, label: e.target.value };
                          setChecklist(next);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove checklist item"
                      disabled={checklist.length === 1}
                      onClick={() => setChecklist(checklist.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const label = 'New step';
                    let key = checklistKeyFromLabel(label);
                    const used = new Set(checklist.map((item) => item.key));
                    let n = 2;
                    while (used.has(key) || isBuiltinDeploymentKey(key)) {
                      key = `step_${n}`;
                      n += 1;
                    }
                    setChecklist([...checklist, { key, label }]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add item
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Worker terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Version</Label>
                  <Input value={termsVersion} onChange={(e) => setTermsVersion(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    If you change the text and leave the version as it is, a new date version is saved for you.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Short summary</Label>
                  <Textarea value={termsSummary} onChange={(e) => setTermsSummary(e.target.value)} rows={4} />
                </div>
                {sections.map((section, index) => (
                  <div key={`${section.id}-${index}`} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Section {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove section"
                        disabled={sections.length === 1}
                        onClick={() => setSections(sections.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input value={section.id} disabled />
                    <Input
                      value={section.title}
                      onChange={(e) => {
                        const next = [...sections];
                        next[index] = { ...section, title: e.target.value };
                        setSections(next);
                      }}
                      placeholder="Title"
                    />
                    <Textarea
                      value={section.body}
                      rows={4}
                      onChange={(e) => {
                        const next = [...sections];
                        next[index] = { ...section, body: e.target.value };
                        setSections(next);
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    let id = `section_${sections.length + 1}`;
                    const used = new Set(sections.map((section) => section.id));
                    let n = sections.length + 1;
                    while (used.has(id)) {
                      n += 1;
                      id = `section_${n}`;
                    }
                    setSections([...sections, { id, title: '', body: '' }]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add section
                </Button>
              </CardContent>
            </Card>

            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save journey rules
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
