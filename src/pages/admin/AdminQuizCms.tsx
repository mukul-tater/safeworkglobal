import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Save, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { QUIZ_SKILL_CODES } from '@/modules/worker-verification/quiz-data/quizSkill';
import { indianStates } from '@/lib/validations/partner';
import { QUIZ_PASS_SCORE, QUIZ_QUESTIONS_TO_SHOW, youtubeEmbedUrl } from '@/modules/worker-verification/constants';
import type { QuizOption, SkillQuizConfig, SkillQuizItem } from '@/modules/worker-verification/types';
import { isMcqQuizItem } from '@/modules/worker-verification/types';
import {
  defaultQuizBankForSkill,
  deleteQuizItem,
  listQuizConfigs,
  listQuizItems,
  publishDefaultQuizBank,
  publishMissingDefaultBanks,
  saveQuizConfig,
  saveQuizItem,
} from '@/modules/worker-verification/services/quizCmsService';
import { loadQuizItems } from '@/modules/worker-verification/services/verificationService';

const ALL_REGIONS = '__all__';

const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

type Draft = {
  id?: string;
  question: string;
  question_hi: string;
  image_url: string;
  youtube_url: string;
  expected_answer: boolean;
  options: QuizOption[];
  correct_option: string;
  region: string;
  sort_order: number;
  active: boolean;
};

const emptyOptions = (): QuizOption[] =>
  OPTION_IDS.map((id) => ({ id, en: '', hi: '' }));

const emptyDraft = (sort: number): Draft => ({
  question: '',
  question_hi: '',
  image_url: '',
  youtube_url: '',
  expected_answer: true,
  options: emptyOptions(),
  correct_option: 'A',
  region: ALL_REGIONS,
  sort_order: sort,
  active: true,
});

export default function AdminQuizCms() {
  const skills = useMemo<string[]>(() => [...QUIZ_SKILL_CODES], []);
  const [skill, setSkill] = useState<string>(skills[0]);
  const [items, setItems] = useState<SkillQuizItem[]>([]);
  const [configs, setConfigs] = useState<SkillQuizConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft(1));
  const [preview, setPreview] = useState<SkillQuizItem[] | null>(null);
  const [previewRegion, setPreviewRegion] = useState<string>(ALL_REGIONS);

  // Config form (per skill, optional region)
  const [cfgRegion, setCfgRegion] = useState<string>(ALL_REGIONS);
  const [cfgCount, setCfgCount] = useState(String(QUIZ_QUESTIONS_TO_SHOW));
  const [cfgPass, setCfgPass] = useState(String(QUIZ_PASS_SCORE));
  const [cfgMode, setCfgMode] = useState<'random_active' | 'explicit_ids'>('random_active');
  const [cfgSelected, setCfgSelected] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, cfgs] = await Promise.all([listQuizItems(skill), listQuizConfigs(skill)]);
      setItems(rows);
      setConfigs(cfgs);
      setDraft(emptyDraft(rows.length + 1));
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load questions');
    } finally {
      setLoading(false);
    }
  }, [skill]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const seeded = await publishMissingDefaultBanks();
        if (cancelled || !seeded.length) return;
        toast.success(`Added default Test 1 questions for ${seeded.join(', ')}`);
        await load();
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Could not add default questions');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const cfg =
      configs.find((c) => (cfgRegion === ALL_REGIONS ? !c.region : c.region === cfgRegion)) || null;
    setCfgCount(String(cfg?.questions_to_show ?? QUIZ_QUESTIONS_TO_SHOW));
    setCfgPass(String(cfg?.pass_score ?? QUIZ_PASS_SCORE));
    setCfgMode(cfg?.selection_mode ?? 'random_active');
    setCfgSelected(cfg?.selected_ids ?? []);
  }, [configs, cfgRegion]);

  const onSaveItem = async () => {
    if (draft.question.trim().length < 5) {
      toast.error('English question is required');
      return;
    }
    const options = draft.options
      .map((o) => ({ id: o.id, en: o.en.trim(), hi: o.hi.trim() }))
      .filter((o) => o.en);
    if (options.length > 0 && options.length < 2) {
      toast.error('Add at least two options, or leave all option fields empty for Yes/No');
      return;
    }
    setSaving(true);
    try {
      await saveQuizItem({
        id: draft.id,
        skill_code: skill,
        question: draft.question,
        question_hi: draft.question_hi || null,
        image_url: draft.image_url || null,
        youtube_url: draft.youtube_url || null,
        expected_answer: draft.expected_answer,
        options: options.length >= 2 ? options : null,
        correct_option: options.length >= 2 ? draft.correct_option : null,
        region: draft.region === ALL_REGIONS ? null : draft.region,
        sort_order: draft.sort_order,
        active: draft.active,
      });
      toast.success(draft.id ? 'Question updated' : 'Question added');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onSaveConfig = async () => {
    setSaving(true);
    try {
      const existing = configs.find((c) =>
        cfgRegion === ALL_REGIONS ? !c.region : c.region === cfgRegion,
      );
      await saveQuizConfig({
        id: existing?.id,
        skill_code: skill,
        region: cfgRegion === ALL_REGIONS ? null : cfgRegion,
        questions_to_show: Math.max(1, Number(cfgCount) || QUIZ_QUESTIONS_TO_SHOW),
        selection_mode: cfgMode,
        selected_ids: cfgMode === 'explicit_ids' ? cfgSelected : [],
        pass_score: Math.min(100, Math.max(0, Number(cfgPass) || QUIZ_PASS_SCORE)),
        active: true,
      });
      toast.success('Test settings saved');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const defaultBank = useMemo(() => defaultQuizBankForSkill(skill), [skill]);

  const onPublishDefaultBank = async () => {
    setSaving(true);
    try {
      const count = await publishDefaultQuizBank(skill);
      toast.success(count ? `Added ${count} default questions` : 'Questions already exist');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add default questions');
    } finally {
      setSaving(false);
    }
  };

  const onPreview = async () => {
    try {
      const rows = await loadQuizItems(skill, previewRegion === ALL_REGIONS ? null : previewRegion);
      setPreview(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed');
    }
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Test 1 — Skill quiz CMS</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Manage the bilingual MCQ bank per UAE trade: English + Hindi question and four options.
        Workers see shuffled option order. Result is a screening pass, not a trade certificate.
      </p>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] items-start">
        <Card className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Skill</Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {skills.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <h2 className="font-semibold text-sm">Test settings</h2>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select value={cfgRegion} onValueChange={setCfgRegion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_REGIONS}>All India (default)</SelectItem>
                  {indianStates.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Questions to show</Label>
                <Input
                  type="number" min={1} max={50}
                  value={cfgCount}
                  onChange={(e) => setCfgCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pass score %</Label>
                <Input
                  type="number" min={0} max={100}
                  value={cfgPass}
                  onChange={(e) => setCfgPass(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Selection</Label>
              <Select value={cfgMode} onValueChange={(v) => setCfgMode(v as typeof cfgMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="random_active">Random from active bank</SelectItem>
                  <SelectItem value="explicit_ids">Only the questions I pick</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={saving} onClick={() => void onSaveConfig()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save test settings
            </Button>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <h2 className="font-semibold text-sm">Preview what a worker sees</h2>
            <Select value={previewRegion} onValueChange={setPreviewRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_REGIONS}>No state (All India)</SelectItem>
                {indianStates.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={() => void onPreview()}>
              <Eye className="h-4 w-4 mr-1" /> Run preview
            </Button>
            {preview && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">{preview.length} question(s) served</p>
                {preview.map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-border p-2 text-xs">
                    <p className="font-medium">{i + 1}. {q.question}</p>
                    {q.question_hi && <p className="text-muted-foreground">{q.question_hi}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">{draft.id ? 'Edit question' : 'Add question'}</h2>
            <div className="space-y-1.5">
              <Label>Question (English) *</Label>
              <Textarea
                rows={2}
                value={draft.question}
                onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Question (Hindi — shown under English)</Label>
              <Textarea
                rows={2}
                value={draft.question_hi}
                onChange={(e) => setDraft((d) => ({ ...d, question_hi: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Options (English + Hindi)</Label>
              {draft.options.map((opt, i) => (
                <div key={opt.id} className="grid sm:grid-cols-2 gap-2 rounded-lg border border-border p-2">
                  <Input
                    value={opt.en}
                    placeholder={`${opt.id} English`}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        options: d.options.map((row, idx) =>
                          idx === i ? { ...row, en: e.target.value } : row,
                        ),
                      }))
                    }
                  />
                  <Input
                    value={opt.hi}
                    placeholder={`${opt.id} Hindi`}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        options: d.options.map((row, idx) =>
                          idx === i ? { ...row, hi: e.target.value } : row,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={draft.image_url}
                  onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>YouTube URL</Label>
                <Input
                  value={draft.youtube_url}
                  onChange={(e) => setDraft((d) => ({ ...d, youtube_url: e.target.value }))}
                  placeholder="https://youtu.be/…"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Select
                  value={draft.region}
                  onValueChange={(v) => setDraft((d) => ({ ...d, region: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_REGIONS}>All India</SelectItem>
                    {indianStates.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Correct option</Label>
                <Select
                  value={draft.correct_option}
                  onValueChange={(v) => setDraft((d) => ({ ...d, correct_option: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPTION_IDS.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Yes/No fallback</Label>
                <Select
                  value={draft.expected_answer ? 'true' : 'false'}
                  onValueChange={(v) => setDraft((d) => ({ ...d, expected_answer: v === 'true' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True / Yes</SelectItem>
                    <SelectItem value="false">False / No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.active}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, active: v }))}
              />
              <span className="text-sm">Active in question bank</span>
            </div>
            {draft.youtube_url && youtubeEmbedUrl(draft.youtube_url) && (
              <iframe
                title="Question clip preview"
                src={youtubeEmbedUrl(draft.youtube_url) as string}
                className="w-full aspect-video rounded-lg border border-border"
                allowFullScreen
              />
            )}
            <div className="flex gap-2">
              <Button disabled={saving} onClick={() => void onSaveItem()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {draft.id ? 'Update question' : 'Add question'}
              </Button>
              {draft.id && (
                <Button variant="ghost" onClick={() => setDraft(emptyDraft(items.length + 1))}>
                  Cancel edit
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Question bank — {skill}</h2>
              <Badge variant="secondary">{items.length} question(s)</Badge>
            </div>
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
            ) : items.length === 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground text-center">
                  No questions in the CMS for this job yet.
                </p>
                {defaultBank.length > 0 && (
                  <>
                    <Button
                      className="w-full"
                      disabled={saving}
                      onClick={() => void onPublishDefaultBank()}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                      Add {defaultBank.length} default questions
                    </Button>
                    <div className="space-y-2">
                      {defaultBank.map((q, i) => (
                        <div key={`${skill}-default-${i}`} className="rounded-lg border border-dashed border-border p-3 space-y-1">
                          <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                          <p className="text-sm text-muted-foreground">{q.question_hi}</p>
                          <Badge variant="outline">Answer: {q.correct}</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((q) => {
                  const picked = cfgSelected.includes(q.id);
                  return (
                    <div key={q.id} className="rounded-lg border border-border p-3 space-y-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{q.sort_order}. {q.question}</p>
                          {q.question_hi && (
                            <p className="text-sm text-muted-foreground">{q.question_hi}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <Badge variant="outline">
                              {isMcqQuizItem(q)
                                ? `Answer: ${q.correct_option || '?'}`
                                : q.expected_answer
                                  ? 'Answer: True'
                                  : 'Answer: False'}
                            </Badge>
                            <Badge variant="outline">{q.region || 'All India'}</Badge>
                            {q.image_url && <Badge variant="outline">Image</Badge>}
                            {q.youtube_url && <Badge variant="outline">Video</Badge>}
                            {q.active === false && <Badge variant="secondary">Inactive</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cfgMode === 'explicit_ids' && (
                            <Button
                              size="sm"
                              variant={picked ? 'default' : 'outline'}
                              onClick={() =>
                                setCfgSelected((prev) =>
                                  picked ? prev.filter((x) => x !== q.id) : [...prev, q.id],
                                )
                              }
                            >
                              {picked ? 'Selected' : 'Select'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDraft({
                                id: q.id,
                                question: q.question,
                                question_hi: q.question_hi || '',
                                image_url: q.image_url || '',
                                youtube_url: q.youtube_url || '',
                                expected_answer: q.expected_answer,
                                options:
                                  q.options?.length
                                    ? OPTION_IDS.map(
                                        (id) =>
                                          q.options?.find((o) => o.id === id) || { id, en: '', hi: '' },
                                      )
                                    : emptyOptions(),
                                correct_option: q.correct_option || 'A',
                                region: q.region || ALL_REGIONS,
                                sort_order: q.sort_order,
                                active: q.active !== false,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await deleteQuizItem(q.id);
                                toast.success('Question deleted');
                                await load();
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : 'Delete failed');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cfgMode === 'explicit_ids' && (
                  <p className="text-xs text-muted-foreground">
                    Selected {cfgSelected.length} question(s) — press “Save test settings” to apply.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}