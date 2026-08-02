import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { InterviewerAssignment } from '@/modules/worker-verification/types';
import {
  listInterviewerAssignments,
  recordInterviewDecision,
} from '@/modules/worker-verification/services/verificationService';

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';

export default function InterviewerQueuePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InterviewerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, { score: string; reason: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listInterviewerAssignments());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load assignments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (row: InterviewerAssignment, approved: boolean) => {
    const entry = form[row.interview_id] || { score: '', reason: '' };
    if (!approved && !entry.reason.trim()) {
      toast.error('Please add a reason when not approving');
      return;
    }
    setBusyId(row.interview_id);
    try {
      await recordInterviewDecision({
        interviewId: row.interview_id,
        approved,
        reason: entry.reason || undefined,
        score: entry.score ? Number(entry.score) : undefined,
      });
      toast.success(approved ? 'Approved — payment unlocked for the worker' : 'Marked not approved');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save decision');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="font-bold">Interviewer queue</h1>
            <p className="text-xs text-muted-foreground">Your assigned video interviews</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate('/interviewer/login', { replace: true });
              }}
            >
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No interviews assigned to you yet.
          </Card>
        ) : (
          rows.map((r) => {
            const entry = form[r.interview_id] || { score: '', reason: '' };
            const done = r.decision === 'approved' || r.decision === 'not_approved';
            return (
              <Card key={r.interview_id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.full_name || 'Unnamed worker'}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(r.scheduled_at)} · attempt {r.attempt_no ?? 1}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {r.primary_skill && <Badge variant="secondary">{r.primary_skill}</Badge>}
                      {r.state && <Badge variant="outline">{r.state}</Badge>}
                      {r.quiz_score != null && <Badge variant="outline">Quiz {r.quiz_score}%</Badge>}
                      {r.decision && <Badge>{r.decision.replace('_', ' ')}</Badge>}
                    </div>
                  </div>
                  {r.meeting_url && (
                    <a
                      href={r.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary inline-flex items-center gap-1"
                    >
                      Join meeting <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {!done && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="grid sm:grid-cols-[140px_1fr] gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Score (optional)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={entry.score}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              [r.interview_id]: { ...entry, score: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Notes / reason</Label>
                        <Textarea
                          rows={2}
                          value={entry.reason}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              [r.interview_id]: { ...entry, reason: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === r.interview_id}
                        onClick={() => void decide(r, true)}
                      >
                        {busyId === r.interview_id && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                        Approved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.interview_id}
                        onClick={() => void decide(r, false)}
                      >
                        Not approved
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}