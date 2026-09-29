import { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, MapPin, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TRADE_TEST_REPORTING_WINDOW } from '@/data/tradeTestCenters';
import type { WorkerVerification } from '@/modules/worker-verification/types';
import {
  bookWorkerTradeTest,
  getTradeTestAssignmentMode,
  getWorkerActiveAssessment,
  listTradeTestCenters,
} from '@/modules/trade-test/services/assessmentService';
import type { AssessmentRow, TradeTestAssignmentMode, TradeTestCenterRow } from '@/modules/trade-test/types';
import { formatDistanceKm, haversineKm, type MapPoint } from '@/modules/trade-test/lib/distance';
import { geocodeIndianPlace } from '@/modules/trade-test/lib/geocodePlace';
import { centreOffersTrade, isOpenTradeBooking, tradeLabel } from '@/modules/trade-test/lib/slipCopy';
import TradeTestSlip from './TradeTestSlip';

function istDatePlus(days: number): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

type Props = {
  row: WorkerVerification;
  subjectId: string;
  workerName: string;
  workerPhone?: string | null;
  avatarUrl?: string | null;
  onBooked: () => void;
};

export default function WorkerTradeTestStage({
  row,
  subjectId,
  workerName,
  workerPhone,
  avatarUrl,
  onBooked,
}: Props) {
  const [mode, setMode] = useState<TradeTestAssignmentMode>('worker_select');
  const [centers, setCenters] = useState<TradeTestCenterRow[]>([]);
  const [origin, setOrigin] = useState<MapPoint | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [centerId, setCenterId] = useState('');
  const [date, setDate] = useState(istDatePlus(1));
  const trade = tradeLabel(row.primary_skill, assessment?.job_title);
  const minDate = istDatePlus(0);
  const maxDate = istDatePlus(14);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [nextMode, nextCenters, nextAssessment, point] = await Promise.all([
          getTradeTestAssignmentMode(),
          listTradeTestCenters(true),
          getWorkerActiveAssessment(subjectId),
          geocodeIndianPlace({ city: row.city, district: row.district, state: row.state }),
        ]);
        if (cancelled) return;
        setMode(nextMode);
        setCenters(nextCenters);
        setAssessment(nextAssessment && isOpenTradeBooking(nextAssessment.status) ? nextAssessment : null);
        setOrigin(point);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Could not load trade test');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, row.city, row.district, row.state, row.trade_test_center_id, row.trade_test_status]);

  const options = useMemo(() => {
    const offered = centers.filter((center) => {
      if (!centreOffersTrade(center.trades, row.primary_skill)) return false;
      if (center.latitude == null || center.longitude == null) return false;
      if (!center.partner_id) return false;
      return true;
    });
    return offered
      .map((center) => {
        const km =
          origin && center.latitude != null && center.longitude != null
            ? haversineKm(origin, { latitude: center.latitude, longitude: center.longitude })
            : null;
        const sameState = (center.state || '').trim().toLowerCase() === (row.state || '').trim().toLowerCase();
        return { center, km, sameState };
      })
      .sort((a, b) => {
        if (a.km != null && b.km != null) return a.km - b.km;
        if (a.km != null) return -1;
        if (b.km != null) return 1;
        if (a.sameState !== b.sameState) return a.sameState ? -1 : 1;
        return a.center.city.localeCompare(b.center.city);
      });
  }, [centers, origin, row.primary_skill, row.state]);

  const book = async () => {
    if (!centerId || !date) {
      toast.error('Choose a centre and a date');
      return;
    }
    setSaving(true);
    try {
      await bookWorkerTradeTest({ centerId, appointmentDate: date });
      const next = await getWorkerActiveAssessment(subjectId);
      setAssessment(next);
      toast.success('Trade test booked. Your slip is ready.');
      onBooked();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not book');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3 border-b border-border/60 pb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Test 3 — Physical trade test</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Required for <span className="font-medium text-foreground">{trade}</span>.
              Bring this slip and your original Aadhaar card on the day.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your trade test…
          </div>
        ) : assessment ? (
          <TradeTestSlip
            assessment={assessment}
            workerName={workerName}
            workerPhone={workerPhone}
            avatarUrl={avatarUrl}
          />
        ) : mode === 'admin_assign' ? (
          <div className="rounded-lg border border-dashed p-4 space-y-2">
            <p className="text-sm font-medium">Waiting for SafeWork to assign your centre</p>
            <p className="text-xs text-muted-foreground">
              You cannot pick a centre yourself. SafeWork will assign a centre that tests {trade}.
              The slip, with the date and address, will show here and arrive by email.
            </p>
          </div>
        ) : options.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 space-y-2">
            <p className="text-sm font-medium">No centre yet for {trade}</p>
            <p className="text-xs text-muted-foreground">
              No active centre with a map pin currently tests {trade}. SafeWork will assign one.
              You will see the slip here once it is booked.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nearest centres that test {trade}</Label>
              <RadioGroup value={centerId} onValueChange={setCenterId} className="space-y-2">
                {options.map(({ center, km }) => {
                  const distance = formatDistanceKm(km);
                  return (
                    <label
                      key={center.id}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 cursor-pointer',
                        centerId === center.id && 'border-primary bg-primary/5',
                      )}
                    >
                      <RadioGroupItem value={center.id} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          {center.city}
                          {distance ? ` — ${distance}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{center.name} · {center.state}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
              {!origin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Distance is unavailable for your city, so centres are listed by state.
                </p>
              )}
            </div>
            <div className="space-y-1.5 max-w-xs">
              <Label>Test date</Label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                min={minDate}
                max={maxDate}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Report {TRADE_TEST_REPORTING_WINDOW}
              </p>
            </div>
            <Button disabled={saving || !centerId} onClick={() => void book()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Book this centre
            </Button>
          </div>
        )}

        {!loading && assessment?.status === 'allocated' && (
          <Badge variant="outline">Waiting for the centre to accept</Badge>
        )}
      </CardContent>
    </Card>
  );
}
