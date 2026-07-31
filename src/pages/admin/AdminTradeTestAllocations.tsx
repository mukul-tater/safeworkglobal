import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { TRADE_TEST_REPORTING_WINDOW } from '@/data/tradeTestCenters';
import {
  allocateAssessment,
  getAssessmentScores,
  listAssessmentMedia,
  listAssessmentsForQualityReview,
  listSsvnPartners,
  listTradeTestCenters,
  listWorkersNeedingAllocation,
  qualityReviewAssessment,
  signedEvidenceUrl,
} from '@/modules/trade-test/services/assessmentService';
import type { AssessmentOutcome, AssessmentRow, AssessmentScoresRow, TradeTestCenterRow } from '@/modules/trade-test/types';
import { SOP_SCORE_FIELDS } from '@/modules/trade-test/types';

type Tab = 'allocate' | 'review';

export default function AdminTradeTestAllocations() {
  const [tab, setTab] = useState<Tab>('allocate');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Awaited<ReturnType<typeof listWorkersNeedingAllocation>>>([]);
  const [centers, setCenters] = useState<TradeTestCenterRow[]>([]);
  const [partners, setPartners] = useState<Awaited<ReturnType<typeof listSsvnPartners>>>([]);
  const [reviewRows, setReviewRows] = useState<AssessmentRow[]>([]);
  const [centerByWorker, setCenterByWorker] = useState<Record<string, string>>({});
  const [partnerByWorker, setPartnerByWorker] = useState<Record<string, string>>({});
  const [dateByWorker, setDateByWorker] = useState<Record<string, string>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [reviewScores, setReviewScores] = useState<AssessmentScoresRow | null>(null);
  const [mediaLinks, setMediaLinks] = useState<Array<{ label: string; url: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, c, p, r] = await Promise.all([
        listWorkersNeedingAllocation(),
        listTradeTestCenters(true),
        listSsvnPartners(),
        listAssessmentsForQualityReview(),
      ]);
      setWorkers(w);
      setCenters(c);
      setPartners(p);
      setReviewRows(r);

      const nextCenter: Record<string, string> = {};
      const nextDate: Record<string, string> = {};
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);
      for (const row of w) {
        nextDate[row.user_id] = dateStr;
        const match = c.find(
          (x) => x.state.toLowerCase() === (row.state || '').toLowerCase(),
        );
        if (match) nextCenter[row.user_id] = match.id;
        else if (c[0]) nextCenter[row.user_id] = c[0].id;
      }
      setCenterByWorker((prev) => ({ ...nextCenter, ...prev }));
      setDateByWorker((prev) => ({ ...nextDate, ...prev }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedReview) {
      setReviewScores(null);
      setMediaLinks([]);
      return;
    }
    void (async () => {
      try {
        const [scores, media] = await Promise.all([
          getAssessmentScores(selectedReview),
          listAssessmentMedia(selectedReview),
        ]);
        setReviewScores(scores);
        const links: Array<{ label: string; url: string }> = [];
        for (const m of media) {
          try {
            const url = await signedEvidenceUrl(m.storage_path);
            links.push({ label: m.label || m.media_type, url });
          } catch {
            /* skip */
          }
        }
        setMediaLinks(links);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load review detail');
      }
    })();
  }, [selectedReview]);

  const onAllocate = async (userId: string, verificationId: string) => {
    const centerId = centerByWorker[userId];
    const appointmentDate = dateByWorker[userId];
    if (!centerId || !appointmentDate) {
      toast.error('Pick centre and appointment date');
      return;
    }
    setActing(userId);
    try {
      await allocateAssessment({
        workerId: userId,
        verificationId,
        centerId,
        appointmentDate,
        reportingWindow: TRADE_TEST_REPORTING_WINDOW,
        partnerId: partnerByWorker[userId] || undefined,
      });
      toast.success('Candidate allocated — waiting for centre accept');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Allocate failed');
    } finally {
      setActing(null);
    }
  };

  const onReview = async (assessmentId: string, outcome: AssessmentOutcome) => {
    setActing(assessmentId);
    try {
      await qualityReviewAssessment({
        assessmentId,
        outcome,
        notes: notesById[assessmentId] || undefined,
      });
      toast.success(`Marked ${outcome.replace('_', ' ')}`);
      setSelectedReview(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalName="Admin"
      portalHomePath="/admin/dashboard"
      profileMenuItems={adminProfileMenu}
    >
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold font-heading">Trade Test Allocations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assessment Allocation Engine — assign candidates to centres, then quality-review submissions.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="allocate">Allocate ({workers.length})</TabsTrigger>
            <TabsTrigger value="review">Quality review ({reviewRows.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : tab === 'allocate' ? (
          <div className="space-y-3">
            {workers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  No workers waiting for trade test allocation.
                </CardContent>
              </Card>
            ) : (
              workers.map((w) => (
                <Card key={w.user_id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{w.full_name || w.user_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.primary_skill || 'Skill TBD'}
                          {w.state ? ` · ${w.state}` : ''}
                          {w.phone ? ` · ${w.phone}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline">Needs allocation</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Centre</Label>
                        <Select
                          value={centerByWorker[w.user_id] || ''}
                          onValueChange={(v) =>
                            setCenterByWorker((prev) => ({ ...prev, [w.user_id]: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select centre" />
                          </SelectTrigger>
                          <SelectContent>
                            {centers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>SSVN partner</Label>
                        <Select
                          value={partnerByWorker[w.user_id] || '__auto__'}
                          onValueChange={(v) =>
                            setPartnerByWorker((prev) => ({
                              ...prev,
                              [w.user_id]: v === '__auto__' ? '' : v,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Linked / select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__auto__">Use centre-linked partner</SelectItem>
                            {partners.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.partner_code || p.id.slice(0, 8)}
                                {p.company_name ? ` — ${p.company_name}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Appointment date</Label>
                        <Input
                          type="date"
                          value={dateByWorker[w.user_id] || ''}
                          onChange={(e) =>
                            setDateByWorker((prev) => ({ ...prev, [w.user_id]: e.target.value }))
                          }
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Report {TRADE_TEST_REPORTING_WINDOW}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={acting === w.user_id}
                      onClick={() => void onAllocate(w.user_id, w.verification_id)}
                    >
                      {acting === w.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Allocate to centre
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
            {partners.length === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No approved SSVN partners yet. Create/approve an SSVN partner, then select it when allocating
                (links the centre automatically).
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reviewRows.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  No centre submissions waiting for quality review.
                </CardContent>
              </Card>
            ) : (
              reviewRows.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium">{a.worker_name || a.worker_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.center_name || a.trade_test_center_id}
                          {a.primary_skill ? ` · ${a.primary_skill}` : ''}
                          {a.overall_score != null ? ` · Score ${a.overall_score}` : ''}
                        </p>
                      </div>
                      <Badge>{a.status}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedReview((id) => (id === a.id ? null : a.id))
                      }
                    >
                      {selectedReview === a.id ? 'Hide detail' : 'Review scorecard & evidence'}
                    </Button>
                    {selectedReview === a.id && (
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                        {reviewScores ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {SOP_SCORE_FIELDS.map((f) => (
                              <div key={f.key} className="rounded border bg-background px-2 py-1.5">
                                <p className="text-muted-foreground">{f.label}</p>
                                <p className="font-semibold">{(reviewScores as any)[f.key]}</p>
                              </div>
                            ))}
                            <div className="rounded border bg-background px-2 py-1.5 col-span-2">
                              <p className="text-muted-foreground">Assessor</p>
                              <p className="font-semibold">{reviewScores.assessor_name}</p>
                              {reviewScores.remarks && (
                                <p className="text-muted-foreground mt-1">{reviewScores.remarks}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No scores found.</p>
                        )}
                        {mediaLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {mediaLinks.map((m) => (
                              <a
                                key={m.url}
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline"
                              >
                                {m.label}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label>Quality notes</Label>
                          <Textarea
                            value={notesById[a.id] || ''}
                            onChange={(e) =>
                              setNotesById((prev) => ({ ...prev, [a.id]: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={acting === a.id}
                            onClick={() => void onReview(a.id, 'pass')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Pass
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={acting === a.id}
                            onClick={() => void onReview(a.id, 'conditional_pass')}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" /> Conditional pass
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={acting === a.id}
                            onClick={() => void onReview(a.id, 'fail')}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Fail
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
