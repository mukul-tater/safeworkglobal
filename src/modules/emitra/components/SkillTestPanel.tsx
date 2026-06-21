import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Lock } from 'lucide-react';
import { toast } from 'sonner';

type Stage = 'partner_local' | 'safework_phone' | 'physical';
type Status = 'pending' | 'passed' | 'failed';

interface SkillTest {
  id: string;
  worker_id: string;
  stage: Stage;
  status: Status;
  notes: string | null;
  fee_received: boolean;
  completed_at: string | null;
}

const STAGE_META: Record<Stage, { title: string; description: string; order: number }> = {
  partner_local: { title: '1. Partner Local Test', description: 'E-Mitra centre operator runs an in-person basic skill test.', order: 1 },
  safework_phone: { title: '2. SafeWork Phone Interview', description: 'SafeWork team verifies via phone call after partner test passes.', order: 2 },
  physical: { title: '3. Physical Test', description: 'On-site physical skill test. Unlocked once the ₹35,400 fee is marked received.', order: 3 },
};

export default function SkillTestPanel({ workerId, partnerProfileId }: { workerId: string; partnerProfileId: string }) {
  const [tests, setTests] = useState<SkillTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('partner_worker_skill_tests')
      .select('*')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: true });
    if (error) toast.error('Failed to load skill tests');
    setTests((data ?? []) as SkillTest[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workerId]);

  const getTest = (stage: Stage) => tests.find((t) => t.stage === stage);

  const isUnlocked = (stage: Stage): boolean => {
    if (stage === 'partner_local') return true;
    if (stage === 'safework_phone') return getTest('partner_local')?.status === 'passed';
    if (stage === 'physical') {
      const phone = getTest('safework_phone');
      return phone?.status === 'passed' && !!phone?.fee_received;
    }
    return false;
  };

  const upsertStage = async (stage: Stage, patch: Partial<SkillTest>) => {
    setUpdating(stage);
    const existing = getTest(stage);
    const payload = {
      worker_id: workerId,
      partner_profile_id: partnerProfileId,
      stage,
      ...patch,
      ...(patch.status && patch.status !== 'pending' ? { completed_at: new Date().toISOString() } : {}),
    };
    const { error } = existing
      ? await (supabase as any).from('partner_worker_skill_tests').update(payload).eq('id', existing.id)
      : await (supabase as any).from('partner_worker_skill_tests').insert(payload);
    setUpdating(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Updated');
    load();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Skill Test Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.keys(STAGE_META) as Stage[]).map((stage) => {
          const meta = STAGE_META[stage];
          const t = getTest(stage);
          const unlocked = isUnlocked(stage);
          const status: Status = t?.status ?? 'pending';
          return (
            <div key={stage} className={`rounded-lg border p-3 ${unlocked ? 'bg-card' : 'bg-muted/30 opacity-70'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2">
                  {status === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : !unlocked ? (
                    <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{meta.title}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                <Badge variant={status === 'passed' ? 'default' : status === 'failed' ? 'destructive' : 'outline'}>
                  {status}
                </Badge>
              </div>

              {stage === 'physical' && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className={t?.fee_received ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                    Fee (₹35,400): {t?.fee_received ? 'Received' : 'Pending (admin marks)'}
                  </span>
                </div>
              )}

              {unlocked && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={status === 'passed' ? 'default' : 'outline'}
                    disabled={updating === stage}
                    onClick={() => upsertStage(stage, { status: 'passed' })}
                  >Mark Passed</Button>
                  <Button
                    size="sm"
                    variant={status === 'failed' ? 'destructive' : 'outline'}
                    disabled={updating === stage}
                    onClick={() => upsertStage(stage, { status: 'failed' })}
                  >Mark Failed</Button>
                </div>
              )}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-1">
          Reward (₹1,000) is auto-credited when the worker is marked placed. Configured by admin.
        </p>
      </CardContent>
    </Card>
  );
}