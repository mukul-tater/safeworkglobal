import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';
import WorkerTimeline from '../components/WorkerTimeline';
import SkillTestPanel from '../components/SkillTestPanel';
import {
  getWorkerById, getWorkerStatusHistory, updateWorkerStatus, getSignedMediaUrl,
  getPartnerProfile,
} from '../services/emitraService';
import {
  WORKER_STATUSES, WORKER_STATUS_LABELS, MIGRATION_CATEGORY_LABELS,
} from '../config/constants';
import type { PartnerWorker, WorkerStatusHistory } from '../types/emitra.types';

export default function EmitraWorkerDetailPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<PartnerWorker | null>(null);
  const [history, setHistory] = useState<WorkerStatusHistory[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!workerId || !user) return;
    const w = await getWorkerById(workerId);
    if (!w) {
      navigate('/emitra/workers');
      return;
    }
    const p = await getPartnerProfile(user.id);
    if (!p || w.partner_profile_id !== p.id) {
      navigate('/emitra/workers');
      return;
    }
    setWorker(w);
    setHistory(await getWorkerStatusHistory(workerId));
    if (w.photo_url) setPhotoUrl(await getSignedMediaUrl(w.photo_url));
    if (w.video_url) setVideoUrl(await getSignedMediaUrl(w.video_url));
    setLoading(false);
  };

  useEffect(() => { load(); }, [workerId, user, navigate]);

  const handleStatusChange = async (status: string) => {
    if (!worker) return;
    setUpdating(true);
    const { error } = await updateWorkerStatus(worker.id, status);
    setUpdating(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Status updated');
    await load();
  };

  if (loading || !worker) {
    return (
      <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/emitra/workers"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Workers</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{worker.full_name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge>{worker.skill}</Badge>
            <Badge variant="outline">{WORKER_STATUS_LABELS[worker.status]}</Badge>
            <Badge variant="secondary">{MIGRATION_CATEGORY_LABELS[worker.migration_category]}</Badge>
          </div>
        </div>
        <Select value={worker.status} onValueChange={handleStatusChange} disabled={updating}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WORKER_STATUSES.map(s => <SelectItem key={s} value={s}>{WORKER_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Personal & Job Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Mobile" v={worker.mobile} />
            <Row k="WhatsApp" v={worker.whatsapp} />
            <Row k="Experience" v={worker.experience_level} />
            <Row k="Skill Level" v={worker.skill_level} />
            <Row k="Location" v={`${worker.district}, ${worker.state}`} />
            <Row k="Preferred Country" v={worker.preferred_country} />
            <Row k="Passport" v={worker.passport_available ? 'Yes' : 'No'} />
            <Row k="Migration Score" v={`${worker.migration_readiness_score}/100`} />
            <Row k="Expected Salary" v={worker.expected_salary ? `₹${worker.expected_salary}` : '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Operator Assessment</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{worker.operator_notes || 'No notes'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Photo & Video</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {photoUrl ? (
              <img src={photoUrl} alt={worker.full_name} className="w-full max-h-48 object-cover rounded-lg" />
            ) : (
              <p className="text-sm text-muted-foreground">No photo uploaded</p>
            )}
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full rounded-lg" />
            ) : (
              <p className="text-sm text-muted-foreground">No video uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Lifecycle Timeline</CardTitle></CardHeader>
          <CardContent>
            <WorkerTimeline currentStatus={worker.status} history={history} />
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <SkillTestPanel workerId={worker.id} partnerProfileId={worker.partner_profile_id} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v || '—'}</span>
    </div>
  );
}
