import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SkillMediaGallery from '@/components/worker/SkillMediaGallery';
import { formatExpectedSalary } from '@/lib/utils';
import { isWorkerKycVerified } from '@/lib/workerKyc';
import { SOP_SCORE_FIELDS } from '@/modules/trade-test/types';
import type { WorkerDossier } from '@/services/workerShareService';
import { format } from 'date-fns';
import {
  Award,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Globe,
  MapPin,
  Phone,
  Shield,
} from 'lucide-react';

const MEDIA_LABELS: Record<string, string> = {
  kyc_photo: 'KYC photo',
  kyc_video: 'KYC video',
  arrival_photo: 'Arrival photo',
  video_kyc_blink: 'Video KYC — blink',
  video_kyc_turn_left: 'Video KYC — turn left',
  video_kyc_turn_right: 'Video KYC — turn right',
  practical_photo: 'Practical photo',
  practical_video: 'Practical video',
  document: 'Document',
  scorecard: 'Scorecard',
};

function isVideoType(mediaType: string, url: string): boolean {
  return mediaType.includes('video') || /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function textField(profile: Record<string, unknown> | null, key: string): string {
  const value = profile?.[key];
  if (value == null || value === '') return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
}

export default function WorkerDossierView({ dossier }: { dossier: WorkerDossier }) {
  const wp = dossier.workerProfile;
  const kycVerified = isWorkerKycVerified(dossier.documents);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={dossier.profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {dossier.profile.full_name?.charAt(0) || 'W'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{dossier.profile.full_name || 'Worker'}</h2>
                {kycVerified && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20" variant="outline">
                    <Shield className="h-3 w-3 mr-1" /> KYC verified
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {textField(wp, 'nationality') && (
                  <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{textField(wp, 'nationality')}</span>
                )}
                {(textField(wp, 'current_location') || textField(wp, 'current_city')) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {textField(wp, 'current_location') || textField(wp, 'current_city')}
                  </span>
                )}
                {dossier.profile.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{dossier.profile.phone}</span>
                )}
              </div>
              {dossier.profile.email && <p className="text-sm">{dossier.profile.email}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {textField(wp, 'primary_work_type') && <Badge variant="secondary">{textField(wp, 'primary_work_type')}</Badge>}
                {textField(wp, 'skill_level') && <Badge variant="outline">{textField(wp, 'skill_level')}</Badge>}
                {wp?.has_passport && <Badge variant="outline">Passport</Badge>}
                {textField(wp, 'ecr_status') && <Badge variant="outline">ECR: {textField(wp, 'ecr_status')}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="font-semibold">{textField(wp, 'years_of_experience') || '—'} years</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Expected salary</p>
          <p className="font-semibold text-sm">
            {formatExpectedSalary(
              typeof wp?.expected_salary_min === 'number' ? wp.expected_salary_min : null,
              typeof wp?.expected_salary_max === 'number' ? wp.expected_salary_max : null,
              textField(wp, 'currency') || 'INR',
            )}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Languages</p>
          <p className="font-semibold text-sm">{textField(wp, 'languages') || '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Availability</p>
          <p className="font-semibold text-sm">{textField(wp, 'availability') || '—'}</p>
        </Card>
      </div>

      {wp?.bio && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">About</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{String(wp.bio)}</p></CardContent>
        </Card>
      )}

      <Tabs defaultValue="ids">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="ids">ID cards</TabsTrigger>
          <TabsTrigger value="trade">Trade tests</TabsTrigger>
          <TabsTrigger value="skills">Skills & videos</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
        </TabsList>

        <TabsContent value="ids" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Identity documents ({dossier.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {textField(wp, 'passport_number') && <p>Passport: {textField(wp, 'passport_number')}</p>}
                {textField(wp, 'aadhaar_number') && <p>Aadhaar: {textField(wp, 'aadhaar_number')}</p>}
                {textField(wp, 'aadhaar_last4') && !textField(wp, 'aadhaar_number') && (
                  <p>Aadhaar last 4: {textField(wp, 'aadhaar_last4')}</p>
                )}
                {textField(wp, 'pan_number') && <p>PAN: {textField(wp, 'pan_number')}</p>}
              </div>
              {dossier.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No ID documents uploaded</p>
              ) : (
                dossier.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.document_name}</p>
                      <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.verification_status === 'verified' ? (
                        <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : doc.verification_status === 'pending' ? (
                        <Badge className="bg-yellow-500/10 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trade" className="space-y-4">
          {dossier.tradeTests.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">No trade test records yet.</Card>
          ) : (
            dossier.tradeTests.map((test) => (
              <Card key={test.assessment.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    <Award className="h-4 w-4" />
                    Trade test
                    {test.assessment.outcome && (
                      <Badge>{test.assessment.outcome.replace(/_/g, ' ')}</Badge>
                    )}
                    {test.assessment.overall_score != null && (
                      <Badge variant="secondary">Score: {test.assessment.overall_score}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                    <span>Status: {test.assessment.status.replace(/_/g, ' ')}</span>
                    {test.assessment.assessor_name && <span>Assessor: {test.assessment.assessor_name}</span>}
                    {test.assessment.center_name && <span>Centre: {test.assessment.center_name}</span>}
                  </div>
                  {test.scores && (
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      {SOP_SCORE_FIELDS.map((f) => (
                        <div key={f.key} className="flex justify-between gap-2 rounded-md border px-3 py-2">
                          <span className="text-muted-foreground">{f.label}</span>
                          <span className="font-medium">{test.scores![f.key]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {test.assessment.quality_notes && (
                    <p className="text-sm whitespace-pre-wrap">{test.assessment.quality_notes}</p>
                  )}
                  {test.media.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {test.media.filter((m) => m.url).map((item) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden">
                          <div className="px-3 py-2 text-xs font-medium bg-muted">
                            {item.label || MEDIA_LABELS[item.media_type] || item.media_type}
                          </div>
                          {isVideoType(item.media_type, item.url) ? (
                            <video src={item.url} controls className="w-full bg-black max-h-72" />
                          ) : (
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <img src={item.url} alt={item.label || item.media_type} className="w-full max-h-72 object-contain bg-muted" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-3">
          {dossier.skills.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">No skills uploaded.</Card>
          ) : (
            dossier.skills.map((skill) => (
              <Card key={skill.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex flex-wrap items-center gap-2">
                    {skill.skill_name}
                    {skill.proficiency_level && <Badge variant="outline">{skill.proficiency_level}</Badge>}
                    {skill.years_of_experience != null && (
                      <span className="text-sm font-normal text-muted-foreground">{skill.years_of_experience} yrs</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillMediaGallery items={skill.media} emptyMessage="No photos or videos for this skill" />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="experience" className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Work experience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {dossier.experiences.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No work experience listed</p>
              ) : (
                dossier.experiences.map((exp) => (
                  <div key={exp.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <p className="font-medium">{exp.job_title}</p>
                    <p className="text-sm text-muted-foreground">{exp.company_name}{exp.location ? ` · ${exp.location}` : ''}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exp.start_date ? format(new Date(exp.start_date), 'MMM yyyy') : '—'}
                      {' — '}
                      {exp.is_current ? 'Present' : exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : '—'}
                    </p>
                    {exp.description && <p className="text-sm mt-2 whitespace-pre-wrap">{exp.description}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Certifications</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {dossier.certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No certifications listed</p>
              ) : (
                dossier.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-start justify-between gap-3 border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{cert.certification_name}</p>
                      {cert.issuing_organization && (
                        <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                      )}
                    </div>
                    {cert.verified ? (
                      <Badge className="bg-green-500/10 text-green-600">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medical reports ({dossier.medicalReports.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dossier.medicalReports.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No medical reports uploaded</p>
              ) : (
                dossier.medicalReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                    <p className="font-medium truncate">{report.name}</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={report.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
