import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { displayableEmail } from '@/lib/workerAuthEmail';
import {
  createBondTemplate,
  listBondTemplates,
  listInterviewers,
  markPdotCompleted,
  reviewWorkerKyc,
  scheduleWorkerAssessment,
  scheduleWorkerInterview,
  setActiveBondTemplate,
  setPdotPlan,
  updateDeploymentChecklist,
} from '@/modules/worker-verification/services/verificationService';
import type { BondTemplate } from '@/modules/worker-verification/types';
import AdminBondSecurityReview from '@/pages/admin/AdminBondSecurityReview';

type OpsTab = 'kyc' | 'interview' | 'trade_test' | 'medical' | 'bond' | 'pdot' | 'deployment';

const TABS: { value: OpsTab; label: string }[] = [
  { value: 'kyc', label: 'KYC review' },
  { value: 'interview', label: 'Interviews' },
  { value: 'trade_test', label: 'Trade test' },
  { value: 'medical', label: 'Medical' },
  { value: 'bond', label: 'Bond & Security' },
  { value: 'pdot', label: 'PDOT' },
  { value: 'deployment', label: 'Deployment' },
];

type Row = Record<string, any> & {
  id: string;
  user_id: string;
  stage: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
};

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function AdminJourneyOps() {
  const [tab, setTab] = useState<OpsTab>('kyc');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, Record<string, string>>>({});
  const [interviewers, setInterviewers] = useState<
    { user_id: string; full_name: string | null; email: string | null }[]
  >([]);
  const [templates, setTemplates] = useState<BondTemplate[]>([]);
  const [tplForm, setTplForm] = useState({
    version: '',
    title: '',
    address: '',
    instructions: '',
    workerChequeAmount: '',
    guarantorChequeAmount: '',
  });
  const [tplFile, setTplFile] = useState<File | null>(null);

  const setField = (id: string, key: string, value: string) =>
    setForm((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));
  const field = (id: string, key: string) => form[id]?.[key] ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('worker_verification')
        .select('*')
        .order('updated_at', { ascending: false });

      if (tab === 'kyc') query = query.eq('kyc_status', 'submitted');
      else if (tab === 'interview') query = query.in('stage', ['kyc', 'interview', 'awaiting_interview']);
      else if (tab === 'trade_test') query = query.eq('stage', 'trade_test');
      else if (tab === 'medical') query = query.eq('stage', 'medical');
      else if (tab === 'bond') query = query.eq('stage', 'bond');
      else if (tab === 'pdot') query = query.eq('stage', 'pdot');
      else query = query.eq('stage', 'deployment');

      const { data, error } = await query;
      if (error) throw error;
      const list = (data || []) as Row[];

      if (list.length) {
        const ids = list.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .in('id', ids);
        const map = new Map((profiles || []).map((p) => [p.id, p]));
        list.forEach((r) => {
          const p = map.get(r.user_id);
          r.full_name = p?.full_name;
          r.phone = p?.phone;
          r.email = displayableEmail(p?.email) || null;
        });
      }
      setRows(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load workers');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === 'interview') {
      listInterviewers().then(setInterviewers).catch(() => setInterviewers([]));
    }
    if (tab === 'bond') {
      listBondTemplates().then(setTemplates).catch(() => setTemplates([]));
    }
  }, [tab]);

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setActingId(id);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActingId(null);
    }
  };

  const renderActions = (r: Row) => {
    const busy = actingId === r.user_id;

    if (tab === 'kyc') {
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Aadhaar / PAN submitted {fmt(r.kyc_submitted_at)}
          </div>
          <Textarea
            rows={2}
            placeholder="Reason (required if rejecting)"
            value={field(r.user_id, 'reason')}
            onChange={(e) => setField(r.user_id, 'reason', e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void run(r.user_id, () => reviewWorkerKyc(r.user_id, true), 'KYC verified')}
            >
              Approve KYC
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(
                  r.user_id,
                  () => reviewWorkerKyc(r.user_id, false, field(r.user_id, 'reason')),
                  'KYC rejected',
                )
              }
            >
              Reject
            </Button>
          </div>
        </div>
      );
    }

    if (tab === 'interview') {
      const kycOk = r.kyc_status === 'verified';
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            KYC: <strong>{r.kyc_status || 'pending'}</strong> · Scheduled: {fmt(r.interview_scheduled_at)}
          </div>
          {!kycOk ? (
            <p className="text-xs text-amber-600">Verify KYC before scheduling the video interview.</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={field(r.user_id, 'when')}
                    onChange={(e) => setField(r.user_id, 'when', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meeting link</Label>
                  <Input
                    placeholder="https://meet.google.com/…"
                    value={field(r.user_id, 'link')}
                    onChange={(e) => setField(r.user_id, 'link', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Interviewer</Label>
                <Select
                  value={field(r.user_id, 'interviewer')}
                  onValueChange={(v) => setField(r.user_id, 'interviewer', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Assign interviewer" /></SelectTrigger>
                  <SelectContent>
                    {interviewers.map((i) => (
                      <SelectItem key={i.user_id} value={i.user_id}>
                        {i.full_name || i.email || i.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {interviewers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No interviewer accounts yet — grant the interviewer role from All Users.
                  </p>
                )}
              </div>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  const when = field(r.user_id, 'when');
                  const link = field(r.user_id, 'link');
                  const who = field(r.user_id, 'interviewer');
                  if (!when || !link || !who) {
                    toast.error('Date, meeting link and interviewer are all required');
                    return;
                  }
                  void run(
                    r.user_id,
                    () =>
                      scheduleWorkerInterview({
                        userId: r.user_id,
                        scheduledAt: new Date(when).toISOString(),
                        meetingUrl: link,
                        interviewerUserId: who,
                      }),
                    'Interview scheduled',
                  );
                }}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {r.interview_scheduled_at ? 'Reschedule / reassign' : 'Schedule interview'}
              </Button>
            </>
          )}
        </div>
      );
    }

    if (tab === 'trade_test' || tab === 'medical') {
      const kind = tab === 'trade_test' ? 'trade_test' : 'medical';
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Status: <strong>{(tab === 'trade_test' ? r.trade_test_status : r.medical_status) || 'pending'}</strong>
            {' · '}Scheduled: {fmt(tab === 'trade_test' ? r.trade_test_scheduled_at : r.medical_scheduled_at)}
          </div>
          {tab === 'medical' && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {(r.medical_blood_report_url || r.medical_result_url) && (
                <a className="text-primary underline" href={r.medical_blood_report_url || r.medical_result_url} target="_blank" rel="noreferrer">
                  Blood report
                </a>
              )}
              {r.medical_xray_report_url && (
                <a className="text-primary underline" href={r.medical_xray_report_url} target="_blank" rel="noreferrer">
                  X-ray report
                </a>
              )}
              {r.medical_xray_photo_url && (
                <a className="text-primary underline" href={r.medical_xray_photo_url} target="_blank" rel="noreferrer">
                  X-ray photo
                </a>
              )}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Date &amp; time</Label>
              <Input
                type="datetime-local"
                value={field(r.user_id, 'when')}
                onChange={(e) => setField(r.user_id, 'when', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Place / centre</Label>
              <Input
                value={field(r.user_id, 'place')}
                onChange={(e) => setField(r.user_id, 'place', e.target.value)}
              />
            </div>
          </div>
          <Textarea
            rows={2}
            placeholder="Instructions for the worker (documents, reporting time…)"
            value={field(r.user_id, 'instr')}
            onChange={(e) => setField(r.user_id, 'instr', e.target.value)}
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              const when = field(r.user_id, 'when');
              if (!when) {
                toast.error('Pick a date and time');
                return;
              }
              void run(
                r.user_id,
                () =>
                  scheduleWorkerAssessment({
                    userId: r.user_id,
                    kind: kind as 'trade_test' | 'medical',
                    scheduledAt: new Date(when).toISOString(),
                    place: field(r.user_id, 'place'),
                    instructions: field(r.user_id, 'instr'),
                  }),
                'Schedule sent to worker',
              );
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Save schedule
          </Button>
        </div>
      );
    }

    if (tab === 'bond') {
      return (
        <AdminBondSecurityReview
          userId={r.user_id}
          workerName={r.full_name}
          workerId={r.user_id}
          state={r.state}
          bondStatus={r.bond_status}
          busy={busy}
          onDone={async () => {
            await load();
          }}
        />
      );
    }

    if (tab === 'pdot') {
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            PDOT: <strong>{r.pdot_status || 'pending'}</strong> · Batch {r.pdot_batch || '—'} ·{' '}
            {fmt(r.pdot_scheduled_at)}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input
              placeholder="Training provider"
              value={field(r.user_id, 'provider')}
              onChange={(e) => setField(r.user_id, 'provider', e.target.value)}
            />
            <Input
              placeholder="Batch"
              value={field(r.user_id, 'batch')}
              onChange={(e) => setField(r.user_id, 'batch', e.target.value)}
            />
            <Input
              placeholder="Training link"
              value={field(r.user_id, 'url')}
              onChange={(e) => setField(r.user_id, 'url', e.target.value)}
            />
            <Input
              type="datetime-local"
              value={field(r.user_id, 'when')}
              onChange={(e) => setField(r.user_id, 'when', e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(
                  r.user_id,
                  () =>
                    setPdotPlan({
                      userId: r.user_id,
                      provider: field(r.user_id, 'provider'),
                      batch: field(r.user_id, 'batch'),
                      trainingUrl: field(r.user_id, 'url'),
                      scheduledAt: field(r.user_id, 'when')
                        ? new Date(field(r.user_id, 'when')).toISOString()
                        : null,
                    }),
                  'PDOT plan saved',
                )
              }
            >
              Save PDOT plan
            </Button>
            <Button
              size="sm"
              disabled={busy || r.bond_status !== 'approved' || !r.bond_received_at}
              onClick={() =>
                void run(
                  r.user_id,
                  () => markPdotCompleted(r.user_id, field(r.user_id, 'proof') || undefined),
                  'PDOT completed — worker is GCC ready',
                )
              }
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Mark completed → GCC ready
            </Button>
          </div>
          <Input
            placeholder="Certificate proof URL"
            value={field(r.user_id, 'proof')}
            onChange={(e) => setField(r.user_id, 'proof', e.target.value)}
          />
          {r.bond_status !== 'approved' || !r.bond_received_at ? (
            <p className="text-xs text-amber-600">Bond documents must be approved and the original received before PDOT completion.</p>
          ) : null}
        </div>
      );
    }

    // deployment
    const stepKeys = [
      { key: 'offer', label: 'Offer letter', current: r.deploy_offer_status },
      { key: 'contract', label: 'Contract signed', current: r.deploy_contract_status },
      { key: 'emigration', label: 'Emigration / PoE', current: r.deploy_emigration_status },
      { key: 'visa', label: 'Visa', current: r.deploy_visa_status },
      { key: 'insurance', label: 'Insurance', current: r.deploy_insurance_status },
      { key: 'ticket', label: 'Ticket', current: r.deploy_ticket_status },
    ];
    return (
      <div className="space-y-2">
        <div className="grid sm:grid-cols-2 gap-2">
          {stepKeys.map((s) => (
            <div key={s.key} className="space-y-1">
              <Label className="text-xs">{s.label}</Label>
              <Select
                value={field(r.user_id, s.key) || s.current || 'pending'}
                onValueChange={(v) => setField(r.user_id, s.key, v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Textarea
          rows={2}
          placeholder="Notes"
          value={field(r.user_id, 'notes') || r.deployment_notes || ''}
          onChange={(e) => setField(r.user_id, 'notes', e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={field(r.user_id, 'deployed') === 'yes' || (!form[r.user_id]?.deployed && !!r.deployed_at)}
            onCheckedChange={(v) => setField(r.user_id, 'deployed', v ? 'yes' : 'no')}
          />
          <span className="text-sm">Worker deployed</span>
        </div>
        <Button
          size="sm"
          disabled={busy}
          onClick={() =>
            void run(
              r.user_id,
              () =>
                updateDeploymentChecklist({
                  userId: r.user_id,
                  offer: field(r.user_id, 'offer'),
                  contract: field(r.user_id, 'contract'),
                  emigration: field(r.user_id, 'emigration'),
                  visa: field(r.user_id, 'visa'),
                  insurance: field(r.user_id, 'insurance'),
                  ticket: field(r.user_id, 'ticket'),
                  deployed:
                    form[r.user_id]?.deployed === undefined
                      ? undefined
                      : form[r.user_id]?.deployed === 'yes',
                  notes: field(r.user_id, 'notes'),
                }),
              'Deployment checklist updated',
            )
          }
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Save checklist
        </Button>
      </div>
    );
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Journey operations</h1>
      <p className="text-sm text-muted-foreground mb-4">
        KYC verification, interview scheduling and interviewer assignment, trade test and medical
        appointments, bond receipt, PDOT training, and the deployment checklist.
      </p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as OpsTab)} className="mb-4">
        <TabsList className="flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'bond' && (
        <Card className="p-4 mb-4 space-y-3">
          <h2 className="font-semibold">Bond template</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input
              placeholder="Version (e.g. v1.2)"
              value={tplForm.version}
              onChange={(e) => setTplForm((f) => ({ ...f, version: e.target.value }))}
            />
            <Input
              placeholder="Title"
              value={tplForm.title}
              onChange={(e) => setTplForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Courier address for the signed original"
            value={tplForm.address}
            onChange={(e) => setTplForm((f) => ({ ...f, address: e.target.value }))}
          />
          <Textarea
            rows={2}
            placeholder="Instructions shown to the worker"
            value={tplForm.instructions}
            onChange={(e) => setTplForm((f) => ({ ...f, instructions: e.target.value }))}
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Worker cheque amount"
              value={tplForm.workerChequeAmount}
              onChange={(e) => setTplForm((f) => ({ ...f, workerChequeAmount: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Guarantor cheque amount"
              value={tplForm.guarantorChequeAmount}
              onChange={(e) => setTplForm((f) => ({ ...f, guarantorChequeAmount: e.target.value }))}
            />
          </div>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setTplFile(e.target.files?.[0] || null)}
          />
          <Button
            size="sm"
            disabled={actingId === 'tpl'}
            onClick={async () => {
              if (!tplFile || !tplForm.version || !tplForm.title || !tplForm.address) {
                toast.error('Version, title, courier address and PDF are required');
                return;
              }
              setActingId('tpl');
              try {
                await createBondTemplate({
                  version: tplForm.version,
                  title: tplForm.title,
                  courierAddress: tplForm.address,
                  instructions: tplForm.instructions,
                  file: tplFile,
                  workerChequeAmount: tplForm.workerChequeAmount ? Number(tplForm.workerChequeAmount) : null,
                  guarantorChequeAmount: tplForm.guarantorChequeAmount ? Number(tplForm.guarantorChequeAmount) : null,
                });
                toast.success('Bond template uploaded and set active');
                setTplForm({
                  version: '',
                  title: '',
                  address: '',
                  instructions: '',
                  workerChequeAmount: '',
                  guarantorChequeAmount: '',
                });
                setTplFile(null);
                setTemplates(await listBondTemplates());
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Upload failed');
              } finally {
                setActingId(null);
              }
            }}
          >
            {actingId === 'tpl' && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Upload &amp; set active
          </Button>

          <div className="space-y-2 pt-2 border-t border-border">
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No templates uploaded yet.</p>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    {t.active && <Badge>Active</Badge>}
                    {t.version} — {t.title}
                    <a
                      href={t.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-1"
                    >
                      PDF <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                  {!t.active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await setActiveBondTemplate(t.id);
                          setTemplates(await listBondTemplates());
                          toast.success('Template activated');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed');
                        }
                      }}
                    >
                      Make active
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No workers in this step right now.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-4 grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="space-y-1">
                <p className="font-semibold">{r.full_name || 'Unnamed worker'}</p>
                <p className="text-xs text-muted-foreground">{r.phone || r.email || '—'}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline">{r.stage}</Badge>
                  {r.primary_skill && <Badge variant="secondary">{r.primary_skill}</Badge>}
                  {r.state && <Badge variant="outline">{r.state}</Badge>}
                </div>
              </div>
              <div>{renderActions(r)}</div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}