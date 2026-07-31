import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PartnerLayout from '../../layout/PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentPartner } from '../../hooks/useCurrentPartner';
import {
  acceptAssessment,
  addAssessmentMedia,
  checkInAssessment,
  getAssessment,
  getAssessmentScores,
  listAssessmentMedia,
  rejectAssessment,
  saveAssessmentScores,
  saveCentreKyc,
  saveDocChecks,
  submitCentreAssessment,
  uploadAssessmentEvidence,
} from '@/modules/trade-test/services/assessmentService';
import {
  SOP_SCORE_FIELDS,
  type AssessmentRow,
  type AssessmentScoresInput,
} from '@/modules/trade-test/types';

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

export default function SsvnAssessmentWizard() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { partner } = useCurrentPartner();
  const [row, setRow] = useState<AssessmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [aadhaar, setAadhaar] = useState(false);
  const [face, setFace] = useState(false);
  const [attendance, setAttendance] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [expOk, setExpOk] = useState(false);
  const [passportOk, setPassportOk] = useState(false);
  const [docNotes, setDocNotes] = useState('');
  const [scores, setScores] = useState<AssessmentScoresInput>(emptyScores());
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);
  const [mediaCount, setMediaCount] = useState(0);

  const load = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    try {
      const a = await getAssessment(assessmentId);
      setRow(a);
      if (a) {
        setAadhaar(a.aadhaar_verified);
        setFace(a.face_match_confirmed);
        setAttendance(a.attendance_confirmed);
        setExpOk(!!a.docs_experience_ok);
        setPassportOk(!!a.docs_passport_ok);
        setDocNotes(a.docs_notes || '');
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
        const media = await listAssessmentMedia(a.id);
        setMediaCount(
          media.filter((m) => m.media_type === 'practical_photo' || m.media_type === 'practical_video')
            .length,
        );
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

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center gap-2 text-muted-foreground py-16">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessment…
        </div>
      </PartnerLayout>
    );
  }

  if (!row || !partner?.id) {
    return (
      <PartnerLayout>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-muted-foreground">Assessment not found.</p>
            <Button asChild variant="outline">
              <Link to="/partner/ssvn/inbox">Back to inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </PartnerLayout>
    );
  }

  const locked = ['centre_submitted', 'under_review', 'completed'].includes(row.status);

  return (
    <PartnerLayout>
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/partner/ssvn/inbox">
                <ArrowLeft className="h-4 w-4 mr-1" /> Inbox
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-heading">
              {row.worker_name || `Worker ${row.worker_id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {row.center_name || 'Trade test centre'}
              {row.appointment_date ? ` · ${row.appointment_date}` : ''}
              {row.reporting_window ? ` · ${row.reporting_window}` : ''}
            </p>
          </div>
          <Badge variant="outline">{row.status}</Badge>
        </div>

        {/* Accept / Reject */}
        {row.status === 'allocated' && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Accept assignment</h2>
              <p className="text-sm text-muted-foreground">
                SafeWork allocated this candidate to your centre. Accept to proceed with the appointment.
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

        {/* Check-in */}
        {['accepted', 'scheduled'].includes(row.status) && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Candidate reports / check-in</h2>
              <p className="text-sm text-muted-foreground">
                Confirm the candidate has arrived for the appointment.
              </p>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const next = await checkInAssessment(row.id);
                    setRow(next);
                    setAttendance(true);
                    toast.success('Checked in');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Check-in failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Confirm attendance
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Identity KYC */}
        {['checked_in', 'kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold">Identity verification (Video KYC)</h2>
              <p className="text-sm text-muted-foreground">
                Candidate presents physical Aadhaar card. Confirm visually, capture photograph and live video.
                No DigiLocker / UIDAI API required.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={aadhaar} onCheckedChange={(v) => setAadhaar(v === true)} />
                Aadhaar card verified (physical)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={face} onCheckedChange={(v) => setFace(v === true)} />
                Face matches Aadhaar photo (assessor confirmed)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={attendance}
                  onCheckedChange={(v) => setAttendance(v === true)}
                />
                Attendance confirmed
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Candidate photograph *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Live video recording *</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!photoFile || !videoFile) {
                    toast.error('Upload photograph and live video');
                    return;
                  }
                  setSaving(true);
                  try {
                    const photoPath = await uploadAssessmentEvidence(
                      partner.id,
                      row.id,
                      photoFile,
                      'kyc_photo',
                    );
                    const videoPath = await uploadAssessmentEvidence(
                      partner.id,
                      row.id,
                      videoFile,
                      'kyc_video',
                    );
                    const next = await saveCentreKyc(row.id, {
                      aadhaarVerified: aadhaar,
                      faceMatchConfirmed: face,
                      attendanceConfirmed: attendance,
                      kycPhotoPath: photoPath,
                      kycVideoPath: videoPath,
                    });
                    setRow(next);
                    toast.success('Identity KYC saved');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'KYC save failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save identity KYC
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Documents optional */}
        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Document verification (optional)</h2>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={expOk} onCheckedChange={(v) => setExpOk(v === true)} />
                Experience documents checked
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={passportOk} onCheckedChange={(v) => setPassportOk(v === true)} />
                Passport checked
              </label>
              <Textarea
                placeholder="Notes"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await saveDocChecks(row.id, {
                      experienceOk: expOk,
                      passportOk: passportOk,
                      notes: docNotes,
                    });
                    toast.success('Document checks saved');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Save failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save document checks
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Scorecard */}
        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold">Practical trade test — SOP scorecard</h2>
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
                      value={(scores as any)[f.key]}
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
              <Button
                disabled={saving || !scores.assessor_name.trim()}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await saveAssessmentScores(row.id, scores);
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

        {/* Evidence */}
        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Photos & videos (evidence)</h2>
              <p className="text-xs text-muted-foreground">
                {mediaCount} practical evidence file(s) uploaded.
              </p>
              <Input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setEvidenceFiles(e.target.files)}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !evidenceFiles?.length}
                onClick={async () => {
                  if (!evidenceFiles?.length) return;
                  setSaving(true);
                  try {
                    for (const file of Array.from(evidenceFiles)) {
                      const kind = file.type.startsWith('video/')
                        ? 'practical_video'
                        : 'practical_photo';
                      const path = await uploadAssessmentEvidence(
                        partner.id,
                        row.id,
                        file,
                        kind,
                      );
                      await addAssessmentMedia({
                        assessmentId: row.id,
                        mediaType: kind,
                        storagePath: path,
                        label: file.name,
                      });
                    }
                    setMediaCount((n) => n + evidenceFiles.length);
                    setEvidenceFiles(null);
                    toast.success('Evidence uploaded');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Upload failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Upload evidence
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {['kyc_done', 'running'].includes(row.status) && !locked && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold">Confirm submission to SafeWork</h2>
              <p className="text-sm text-muted-foreground">
                Locks this assessment for SafeWork quality review. Ensure KYC, scorecard, and evidence are complete.
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
    </PartnerLayout>
  );
}
