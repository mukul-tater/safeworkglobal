import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import PartnerLayout from '../../layout/PartnerLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Camera,
  Video,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentPartner } from '../../hooks/useCurrentPartner';
import { useAuth } from '@/contexts/AuthContext';
import CameraCapture from '../../components/ssvn/CameraCapture';
import WorkerIdentityDocsPanel from '../../components/ssvn/WorkerIdentityDocsPanel';
import {
  acceptAssessment,
  addAssessmentMedia,
  assessmentWorkerLabel,
  getAssessment,
  getAssessmentScores,
  getWorkerIdentityPack,
  listAssessmentMedia,
  markDocsPreReviewed,
  markTestEvidenceComplete,
  practicalEvidenceSummary,
  rejectAssessment,
  saveArrivalCheck,
  saveAssessmentScores,
  saveVideoKyc,
  signedEvidenceUrl,
  submitCentreAssessment,
  uploadAssessmentEvidence,
} from '@/modules/trade-test/services/assessmentService';
import {
  SOP_SCORE_FIELDS,
  type AssessmentMediaRow,
  type AssessmentRow,
  type AssessmentScoresInput,
  type WorkerIdentityPack,
} from '@/modules/trade-test/types';
import {
  MIN_KYC_VIDEO_SECONDS,
  MIN_PRACTICAL_PHOTOS,
  MIN_PRACTICAL_VIDEO_SECONDS,
  MIN_PRACTICAL_VIDEOS,
  TEST_ANGLES,
  VIDEO_KYC_CHALLENGES,
  VIDEO_KYC_LABEL,
  VIDEO_KYC_MEDIA_TYPE,
  formatAuditTs,
  videoKycLogLabel,
} from '@/modules/trade-test/constants';
import { getMediaDurationSeconds } from '@/modules/trade-test/lib/mediaDuration';

const emptyScores = (): AssessmentScoresInput => ({
  assessor_name: '',
  safety_ppe: 7,
  tool_identification: 7,
  practical_skills: 7,
  accuracy: 7,
  quality: 7,
  productivity: 7,
  time_taken: 7,
  workplace_behaviour: 7,
  remarks: '',
});

type LocalKycClip = {
  file: File;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
};

function WizardFrame({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: ReactNode;
}) {
  if (isAdmin) {
    return (
      <DashboardLayout
        navGroups={adminNavGroups}
        portalLabel="Admin"
        portalName="Admin"
        profileMenuItems={adminProfileMenu}
      >
        {children}
      </DashboardLayout>
    );
  }
  return <PartnerLayout>{children}</PartnerLayout>;
}

function evidenceHint(media: AssessmentMediaRow[]) {
  const s = practicalEvidenceSummary(media);
  return {
    ...s,
    photoLabel: `${s.photos.length}/${MIN_PRACTICAL_PHOTOS} photos`,
    videoLabel: `${s.videosLongEnough.length}/${MIN_PRACTICAL_VIDEOS} videos (≥${MIN_PRACTICAL_VIDEO_SECONDS}s)`,
  };
}

export default function SsvnAssessmentWizard() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { partner, loading: partnerLoading } = useCurrentPartner();
  const { profile, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const inboxPath = isAdmin ? '/admin/trade-tests' : '/partner/ssvn/inbox';
  const inboxLabel = isAdmin ? 'Trade tests' : 'Inbox';
  const defaultOperator = profile?.full_name?.trim() || profile?.email || '';

  const [row, setRow] = useState<AssessmentRow | null>(null);
  const [identity, setIdentity] = useState<WorkerIdentityPack | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [aadhaarMatch, setAadhaarMatch] = useState(false);
  const [panMatch, setPanMatch] = useState(false);
  const [passportMatch, setPassportMatch] = useState(false);
  const [samePerson, setSamePerson] = useState(false);
  const [faceMatch, setFaceMatch] = useState(false);
  const [operatorName, setOperatorName] = useState(defaultOperator);
  const [arrivalPhoto, setArrivalPhoto] = useState<File | null>(null);

  const [kycClip, setKycClip] = useState<LocalKycClip | null>(null);
  const [kycStartedAt, setKycStartedAt] = useState<string | null>(null);

  const [media, setMedia] = useState<AssessmentMediaRow[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [angle, setAngle] = useState<(typeof TEST_ANGLES)[number]['id']>('front_face');
  const [faceVisible, setFaceVisible] = useState(true);
  const [scores, setScores] = useState<AssessmentScoresInput>(emptyScores());
  const [scorecardFile, setScorecardFile] = useState<File | null>(null);

  useEffect(() => {
    if (defaultOperator && !operatorName) setOperatorName(defaultOperator);
  }, [defaultOperator, operatorName]);

  const load = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    try {
      const a = await getAssessment(assessmentId);
      setRow(a);
      if (a) {
        setAadhaarMatch(a.aadhaar_verified);
        setPanMatch(a.pan_verified);
        setPassportMatch(!!a.docs_passport_ok);
        setSamePerson(a.identity_same_person);
        setFaceMatch(a.face_match_confirmed);
        if (a.arrival_photo_taken_by_name) setOperatorName(a.arrival_photo_taken_by_name);
        else if (a.video_kyc_operator_name) setOperatorName(a.video_kyc_operator_name);
        const s = await getAssessmentScores(a.id);
        if (s) {
          setScores({
            assessor_name: s.assessor_name,
            safety_ppe: Number(s.safety_ppe),
            tool_identification: Number(s.tool_identification),
            practical_skills: Number(s.practical_skills),
            accuracy: Number(s.accuracy),
            quality: Number(s.quality),
            productivity: Number(s.productivity),
            time_taken: Number(s.time_taken),
            workplace_behaviour: Number(s.workplace_behaviour),
            remarks: s.remarks || '',
          });
        }
        const m = await listAssessmentMedia(a.id);
        setMedia(m);
        const urls: Record<string, string> = {};
        await Promise.all(
          m.slice(-12).map(async (item) => {
            try {
              urls[item.id] = await signedEvidenceUrl(item.storage_path);
            } catch {
              /* ignore */
            }
          }),
        );
        setMediaUrls(urls);
        setIdentityLoading(true);
        try {
          setIdentity(await getWorkerIdentityPack(a.worker_id));
        } catch {
          setIdentity(null);
        } finally {
          setIdentityLoading(false);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const locked = !!row && ['centre_submitted', 'under_review', 'completed'].includes(row.status);
  const evidence = useMemo(() => evidenceHint(media), [media]);
  const kycDone = (row?.video_kyc_log?.length || 0) > 0 || !!row?.kyc_completed_at;

  const uploadFile = async (
    file: File,
    kind: Parameters<typeof uploadAssessmentEvidence>[3],
  ) => {
    if (!row) throw new Error('Missing assessment');
    const folder = partner?.id || row.partner_id || 'admin';
    return uploadAssessmentEvidence(folder, row.id, file, kind);
  };

  if (loading || (!isAdmin && partnerLoading)) {
    return (
      <WizardFrame isAdmin={isAdmin}>
        <div className="flex items-center gap-2 text-muted-foreground py-16">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessment…
        </div>
      </WizardFrame>
    );
  }

  if (!row || (!isAdmin && !partner?.id)) {
    return (
      <WizardFrame isAdmin={isAdmin}>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-muted-foreground">Assessment not found.</p>
            <Button asChild variant="outline">
              <Link to={inboxPath}>Back to {inboxLabel.toLowerCase()}</Link>
            </Button>
          </CardContent>
        </Card>
      </WizardFrame>
    );
  }

  return (
    <WizardFrame isAdmin={isAdmin}>
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to={inboxPath}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {inboxLabel}
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-heading">
              {assessmentWorkerLabel(row)}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {row.center_name || 'Trade test centre'}
              {row.appointment_date ? ` · ${row.appointment_date}` : ''}
              {row.reporting_window ? ` · ${row.reporting_window}` : ''}
              {row.worker_phone ? ` · ${row.worker_phone}` : ''}
            </p>
          </div>
          <Badge variant="outline">{row.status}</Badge>
        </div>

        {row.status === 'allocated' && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Accept assignment</h2>
              <p className="text-sm text-muted-foreground">
                SafeWork allocated this candidate to your centre. Confirm you will check original
                Aadhaar at arrival, then accept to proceed.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const next = await acceptAssessment(row.id);
                      setRow(next);
                      toast.success('Assignment accepted');
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Accept failed');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Accept
                </Button>
              </div>
              <div className="space-y-1.5 pt-2">
                <Label>Or reject with reason</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={saving || !rejectReason.trim()}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await rejectAssessment(row.id, rejectReason.trim());
                      toast.success('Assignment rejected');
                      setRow(await getAssessment(row.id));
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Reject failed');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Reject assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Identity check (in person)
            </h2>
            <WorkerIdentityDocsPanel
              pack={identity}
              loading={identityLoading}
              preReviewedAt={row.docs_pre_reviewed_at}
              saving={saving}
              onMarkReviewed={
                locked
                  ? undefined
                  : async () => {
                      setSaving(true);
                      try {
                        const next = await markDocsPreReviewed(row.id);
                        setRow(next);
                        toast.success('Pre-arrival document review recorded');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Could not save review');
                      } finally {
                        setSaving(false);
                      }
                    }
              }
            />
          </CardContent>
        </Card>

        {row.status !== 'allocated' && row.status !== 'centre_rejected' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" /> Arrival — physical identity check
              </h2>
              {row.identity_same_person && row.arrival_photo_taken_at ? (
                <div className="text-sm space-y-1">
                  <p>
                    Person matched Aadhaar and PAN
                    {row.docs_passport_ok ? ' (passport also checked)' : ''}.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Live photo by {row.arrival_photo_taken_by_name || 'staff'} at{' '}
                    {formatAuditTs(row.arrival_photo_taken_at)}
                  </p>
                </div>
              ) : !locked && ['accepted', 'scheduled', 'checked_in'].includes(row.status) ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    When the worker reaches the centre, compare original Aadhaar and PAN (and passport
                    if they have one) with the photos above. Confirm it is the same person, then take a
                    live photo. Who took the photo is recorded with a timestamp.
                  </p>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={aadhaarMatch} onCheckedChange={(v) => setAadhaarMatch(v === true)} />
                    Physical Aadhaar matches the uploaded Aadhaar photo
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={panMatch} onCheckedChange={(v) => setPanMatch(v === true)} />
                    Physical PAN matches the uploaded PAN photo
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={passportMatch}
                      onCheckedChange={(v) => setPassportMatch(v === true)}
                    />
                    Physical passport matches the uploaded passport (tick if they brought it)
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={samePerson} onCheckedChange={(v) => setSamePerson(v === true)} />
                    The person who arrived is the same worker as on Aadhaar and PAN
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={faceMatch} onCheckedChange={(v) => setFaceMatch(v === true)} />
                    Face matches the document photos
                  </label>
                  <div className="space-y-1.5">
                    <Label>Staff who is taking the live photo *</Label>
                    <Input
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="Assessor / receptionist name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Live photo at arrival *</Label>
                    <CameraCapture
                      mode="photo"
                      disabled={saving}
                      onCapture={(file) => setArrivalPhoto(file)}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => setArrivalPhoto(e.target.files?.[0] ?? null)}
                    />
                    {arrivalPhoto && (
                      <p className="text-xs text-muted-foreground">Ready: {arrivalPhoto.name}</p>
                    )}
                  </div>
                  <Button
                    disabled={saving}
                    onClick={async () => {
                      if (!arrivalPhoto) {
                        toast.error('Take or upload the arrival live photo');
                        return;
                      }
                      setSaving(true);
                      try {
                        const path = await uploadFile(arrivalPhoto, 'arrival_photo');
                        const next = await saveArrivalCheck(row.id, {
                          aadhaarMatch,
                          panMatch,
                          passportMatch: identity?.has_passport ? passportMatch : passportMatch || null,
                          samePerson,
                          faceMatch,
                          arrivalPhotoPath: path,
                          capturedByName: operatorName,
                        });
                        setRow(next);
                        setArrivalPhoto(null);
                        toast.success('Arrival identity check saved');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Arrival check failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Confirm arrival & live photo
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Accept the assignment before check-in.</p>
              )}
            </CardContent>
          </Card>
        )}

        {['checked_in', 'kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Video className="h-4 w-4" /> Video KYC (liveness)
              </h2>
              <p className="text-sm text-muted-foreground">
                Record one clip of at least {MIN_KYC_VIDEO_SECONDS} seconds. In that same video: blink,
                turn head left, then turn head right. Face must stay in frame.
              </p>
              {kycDone && (
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>
                    Completed {formatAuditTs(row.kyc_completed_at)} by{' '}
                    {row.video_kyc_operator_name || 'staff'}
                  </p>
                  {(row.video_kyc_log || []).map((entry, idx) => (
                    <p key={`${entry.challenge}-${idx}`}>
                      {videoKycLogLabel(entry.challenge)} · {formatAuditTs(entry.started_at)} →{' '}
                      {formatAuditTs(entry.completed_at)}
                      {entry.duration_seconds != null
                        ? ` · ${Math.round(entry.duration_seconds)}s`
                        : ''}
                    </p>
                  ))}
                </div>
              )}
              {!kycDone && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {VIDEO_KYC_CHALLENGES.map((c, idx) => (
                      <Badge key={c.id} variant="outline">
                        {idx + 1}. {c.label}
                      </Badge>
                    ))}
                  </div>
                  <Alert>
                    <AlertDescription>
                      <span className="font-medium">One video — {VIDEO_KYC_LABEL}. </span>
                      Prompts will change on screen while you record. Do all three actions before
                      stopping.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-1.5">
                    <Label>Staff conducting video KYC *</Label>
                    <Input
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                    />
                  </div>
                  <CameraCapture
                    mode="video"
                    minDurationSec={MIN_KYC_VIDEO_SECONDS}
                    disabled={saving}
                    recordingPrompts={VIDEO_KYC_CHALLENGES.map((c) => ({
                      startSec: c.startSec,
                      title: c.label,
                      instruction: c.instruction,
                    }))}
                    onRecordingStart={() => setKycStartedAt(new Date().toISOString())}
                    onCapture={(file, meta) => {
                      const started =
                        kycStartedAt ||
                        new Date(
                          Date.now() - Math.round((meta.durationSeconds || MIN_KYC_VIDEO_SECONDS) * 1000),
                        ).toISOString();
                      setKycClip({
                        file,
                        startedAt: started,
                        completedAt: meta.capturedAt,
                        durationSeconds: meta.durationSeconds || MIN_KYC_VIDEO_SECONDS,
                      });
                      setKycStartedAt(null);
                      toast.success('Liveness video recorded');
                    }}
                  />
                  {kycClip && (
                    <p className="text-xs text-muted-foreground">
                      Ready · {formatAuditTs(kycClip.startedAt)} → {formatAuditTs(kycClip.completedAt)} ·{' '}
                      {Math.round(kycClip.durationSeconds)}s
                    </p>
                  )}
                  <Button
                    disabled={saving || !kycClip}
                    onClick={async () => {
                      if (!kycClip) return;
                      setSaving(true);
                      try {
                        const storagePath = await uploadFile(kycClip.file, VIDEO_KYC_MEDIA_TYPE);
                        const next = await saveVideoKyc(row.id, {
                          storagePath,
                          startedAt: kycClip.startedAt,
                          completedAt: kycClip.completedAt,
                          durationSeconds: kycClip.durationSeconds,
                          operatorName,
                        });
                        setRow(next);
                        setKycClip(null);
                        toast.success('Video KYC saved');
                        await load();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Video KYC failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Save video KYC
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold">Trade test evidence — photos & videos</h2>
              <p className="text-sm text-muted-foreground">
                Capture at least {MIN_PRACTICAL_PHOTOS} photos and {MIN_PRACTICAL_VIDEOS} videos while
                the worker is giving the test, from different angles. Face must be clearly visible in
                every file. Each video must be at least {MIN_PRACTICAL_VIDEO_SECONDS} seconds.
              </p>
              <p className="text-xs text-muted-foreground">
                {evidence.photoLabel} · {evidence.videoLabel}
                {row.test_evidence_completed_at
                  ? ` · Test-day capture marked complete ${formatAuditTs(row.test_evidence_completed_at)}`
                  : ''}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Angle</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value as typeof angle)}
                  >
                    {TEST_ANGLES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm self-end pb-2">
                  <Checkbox checked={faceVisible} onCheckedChange={(v) => setFaceVisible(v === true)} />
                  Face clearly visible in this capture
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Photo from this angle</Label>
                  <CameraCapture
                    mode="photo"
                    disabled={saving || !faceVisible}
                    onCapture={async (file, meta) => {
                      if (!faceVisible) {
                        toast.error('Confirm the face is clearly visible');
                        return;
                      }
                      setSaving(true);
                      try {
                        const path = await uploadFile(file, 'practical_photo');
                        await addAssessmentMedia({
                          assessmentId: row.id,
                          mediaType: 'practical_photo',
                          storagePath: path,
                          label: TEST_ANGLES.find((a) => a.id === angle)?.label || angle,
                          capturedByName: operatorName,
                          capturedAt: meta.capturedAt,
                          angle,
                          faceVisible: true,
                        });
                        toast.success('Photo uploaded');
                        await load();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Photo upload failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Video from this angle ({MIN_PRACTICAL_VIDEO_SECONDS}s min)</Label>
                  <CameraCapture
                    mode="video"
                    minDurationSec={MIN_PRACTICAL_VIDEO_SECONDS}
                    disabled={saving || !faceVisible}
                    onCapture={async (file, meta) => {
                      if (!faceVisible) {
                        toast.error('Confirm the face is clearly visible');
                        return;
                      }
                      const duration = meta.durationSeconds || (await getMediaDurationSeconds(file));
                      if (duration < MIN_PRACTICAL_VIDEO_SECONDS) {
                        toast.error(`Video must be at least ${MIN_PRACTICAL_VIDEO_SECONDS} seconds`);
                        return;
                      }
                      setSaving(true);
                      try {
                        const path = await uploadFile(file, 'practical_video');
                        await addAssessmentMedia({
                          assessmentId: row.id,
                          mediaType: 'practical_video',
                          storagePath: path,
                          label: TEST_ANGLES.find((a) => a.id === angle)?.label || angle,
                          capturedByName: operatorName,
                          capturedAt: meta.capturedAt,
                          durationSeconds: duration,
                          angle,
                          faceVisible: true,
                        });
                        toast.success('Video uploaded');
                        await load();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Video upload failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Or upload files (photos / videos)</Label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = '';
                    if (!files.length) return;
                    if (!faceVisible) {
                      toast.error('Confirm the face is clearly visible');
                      return;
                    }
                    setSaving(true);
                    try {
                      for (const file of files) {
                        const isVideo = file.type.startsWith('video/');
                        let duration: number | null = null;
                        if (isVideo) {
                          duration = await getMediaDurationSeconds(file);
                          if (duration < MIN_PRACTICAL_VIDEO_SECONDS) {
                            throw new Error(
                              `${file.name} is ${Math.round(duration)}s — videos must be ${MIN_PRACTICAL_VIDEO_SECONDS}s minimum`,
                            );
                          }
                        }
                        const kind = isVideo ? 'practical_video' : 'practical_photo';
                        const path = await uploadFile(file, kind);
                        await addAssessmentMedia({
                          assessmentId: row.id,
                          mediaType: kind,
                          storagePath: path,
                          label: file.name,
                          capturedByName: operatorName,
                          durationSeconds: duration,
                          angle,
                          faceVisible: true,
                        });
                      }
                      toast.success('Evidence uploaded');
                      await load();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Upload failed');
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>
              {media.filter((m) => m.media_type === 'practical_photo' || m.media_type === 'practical_video').length >
                0 && (
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {media
                    .filter(
                      (m) => m.media_type === 'practical_photo' || m.media_type === 'practical_video',
                    )
                    .map((m) => (
                      <li key={m.id}>
                        {m.media_type === 'practical_video' ? 'Video' : 'Photo'}
                        {m.angle ? ` · ${m.angle}` : ''}
                        {m.duration_seconds != null ? ` · ${Math.round(Number(m.duration_seconds))}s` : ''}
                        {` · ${formatAuditTs(m.captured_at || m.created_at)}`}
                        {m.captured_by_name ? ` · by ${m.captured_by_name}` : ''}
                        {mediaUrls[m.id] ? (
                          <>
                            {' · '}
                            <a className="underline" href={mediaUrls[m.id]} target="_blank" rel="noreferrer">
                              view
                            </a>
                          </>
                        ) : null}
                      </li>
                    ))}
                </ul>
              )}
              <Button
                variant="outline"
                disabled={saving || !evidence.photosOk || !evidence.videosOk}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const next = await markTestEvidenceComplete(row.id);
                    setRow(next);
                    toast.success('Test-day photos and videos marked complete');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Could not mark complete');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Mark test-day capture complete
              </Button>
            </CardContent>
          </Card>
        )}

        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Scorecard (can be uploaded later)
              </h2>
              <Alert>
                <AlertDescription>
                  The worker can finish the test today. Your centre may enter or upload the scorecard
                  tomorrow or the day after — then submit to SafeWork.
                </AlertDescription>
              </Alert>
              {row.scorecard_uploaded_at && (
                <p className="text-xs text-muted-foreground">
                  Scorecard last saved {formatAuditTs(row.scorecard_uploaded_at)}
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Assessor name *</Label>
                <Input
                  value={scores.assessor_name}
                  onChange={(e) => setScores((s) => ({ ...s, assessor_name: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOP_SCORE_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label} (0–10)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={(scores as Record<string, number | string>)[f.key]}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [f.key]: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Textarea
                placeholder="Remarks"
                value={scores.remarks}
                onChange={(e) => setScores((s) => ({ ...s, remarks: e.target.value }))}
                rows={2}
              />
              <div className="space-y-1.5">
                <Label>Scanned scorecard (photo or PDF)</Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setScorecardFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button
                disabled={saving || !scores.assessor_name.trim()}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await saveAssessmentScores(row.id, scores);
                    if (scorecardFile) {
                      const path = await uploadFile(scorecardFile, 'scorecard');
                      await addAssessmentMedia({
                        assessmentId: row.id,
                        mediaType: 'scorecard',
                        storagePath: path,
                        label: scorecardFile.name,
                        capturedByName: operatorName || scores.assessor_name,
                      });
                      setScorecardFile(null);
                    }
                    const next = await getAssessment(row.id);
                    setRow(next);
                    toast.success('Scorecard saved');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Scorecard failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save scorecard
              </Button>
            </CardContent>
          </Card>
        )}

        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Confirm submission to SafeWork</h2>
              <p className="text-sm text-muted-foreground">
                Requires arrival check, video KYC, {MIN_PRACTICAL_PHOTOS} photos,{' '}
                {MIN_PRACTICAL_VIDEOS} videos of {MIN_PRACTICAL_VIDEO_SECONDS}s+, and the scorecard.
                You can wait until the scorecard is ready.
              </p>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const next = await submitCentreAssessment(row.id);
                    setRow(next);
                    toast.success('Submitted to SafeWork for quality review');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Submit failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirm submission
              </Button>
            </CardContent>
          </Card>
        )}

        {locked && (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              Submission {row.status === 'completed' ? 'reviewed' : 'sent to SafeWork'}.
              {row.outcome ? ` Outcome: ${row.outcome.replace('_', ' ')}.` : ' Awaiting quality review.'}
            </CardContent>
          </Card>
        )}
      </div>
    </WizardFrame>
  );
}
