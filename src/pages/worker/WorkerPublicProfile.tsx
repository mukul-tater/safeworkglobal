import { useState, useEffect } from 'react';
import { formatExpectedSalary } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Globe, Mail, Phone, Award, Briefcase, FileCheck,
  Calendar, Star, CheckCircle2, XCircle, Clock,
  MessageSquare, Heart, ArrowLeft, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import VerificationBadge, { calculateVerificationLevel, VerificationLevel } from '@/components/worker/VerificationBadge';
import SendJobRequestDialog from '@/components/employer/SendJobRequestDialog';
import SkillMediaGallery from '@/components/worker/SkillMediaGallery';

interface WorkerProfile {
  user_id: string;
  bio: string | null;
  nationality: string | null;
  current_location: string | null;
  years_of_experience: number | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  currency: string;
  availability: string | null;
  has_passport: boolean;
  has_visa: boolean;
  visa_countries: string[] | null;
  languages: string[] | null;
  ecr_status: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface WorkExperience {
  id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

interface Certification {
  id: string;
  certification_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  verified: boolean;
}

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string | null;
  years_of_experience: number | null;
  media: SkillMedia[];
}

interface SkillMedia {
  id: string;
  media_type: 'photo' | 'video';
  url: string;
}

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  verification_status: string;
  uploaded_at: string;
}

export default function WorkerPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>('not_verified');

  useEffect(() => {
    if (id) {
      loadWorkerData();
      checkShortlistStatus();
    }
  }, [id]);

  const loadWorkerData = async () => {
    try {
      setLoading(true);

      // Fetch basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch worker profile
      const { data: workerData, error: workerError } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (workerError) throw workerError;
      setWorkerProfile(workerData);

      // Fetch work experience
      const { data: expData } = await supabase
        .from('work_experience')
        .select('*')
        .eq('worker_id', id)
        .order('start_date', { ascending: false });
      setExperiences(expData || []);

      // Fetch certifications
      const { data: certData } = await supabase
        .from('worker_certifications')
        .select('*')
        .eq('worker_id', id)
        .order('issue_date', { ascending: false });
      setCertifications(certData || []);

      // Fetch skills with media
      const { data: skillsData } = await supabase
        .from('worker_skills')
        .select('*')
        .eq('worker_id', id);

      const skillIds = (skillsData ?? []).map((s) => s.id);
      let mediaBySkill: Record<string, SkillMedia[]> = {};

      if (skillIds.length > 0) {
        const { data: mediaData } = await supabase
          .from('worker_skill_media')
          .select('id, skill_id, media_type, file_path')
          .in('skill_id', skillIds)
          .order('created_at', { ascending: true });

        if (mediaData) {
          const resolved = await Promise.all(
            mediaData.map(async (m) => {
              const { data: signed } = await supabase.storage
                .from('worker-videos')
                .createSignedUrl(m.file_path, 3600);
              return {
                id: m.id,
                skill_id: m.skill_id,
                media_type: m.media_type as 'photo' | 'video',
                url: signed?.signedUrl ?? '',
              };
            }),
          );

          mediaBySkill = resolved.reduce<Record<string, SkillMedia[]>>((acc, m) => {
            const entry: SkillMedia = {
              id: m.id,
              media_type: m.media_type,
              url: m.url,
            };
            acc[m.skill_id] = [...(acc[m.skill_id] ?? []), entry];
            return acc;
          }, {});
        }
      }

      setSkills(
        (skillsData ?? []).map((s) => ({
          ...s,
          media: mediaBySkill[s.id] ?? [],
        })),
      );

      // Fetch all documents for verification level calculation
      const { data: allDocsData } = await supabase
        .from('worker_documents')
        .select('*')
        .eq('worker_id', id)
        .order('uploaded_at', { ascending: false });
      setAllDocuments(allDocsData || []);
      
      // Filter verified documents for display
      const verifiedDocs = (allDocsData || []).filter(d => d.verification_status === 'verified');
      setDocuments(verifiedDocs);
      
      // Calculate verification level
      const hasIdDoc = (allDocsData || []).some(
        d => (d.document_type === 'passport' || d.document_type === 'id_card') && 
             d.verification_status === 'verified'
      );
      const verifiedCount = verifiedDocs.length;
      const hasPassport = workerData?.has_passport || false;
      const ecrStatus = workerData?.ecr_status || 'not_checked';
      
      const level = calculateVerificationLevel(hasIdDoc, verifiedCount, hasPassport, ecrStatus);
      setVerificationLevel(level);

    } catch (error) {
      console.error('Error loading worker data:', error);
      toast.error('Failed to load worker profile');
    } finally {
      setLoading(false);
    }
  };

  const checkShortlistStatus = async () => {
    if (!user || role !== 'employer') return;

    try {
      const { data } = await supabase
        .from('shortlisted_workers')
        .select('id')
        .eq('employer_id', user.id)
        .eq('worker_id', id)
        .maybeSingle();

      setIsShortlisted(!!data);
    } catch (error) {
      console.error('Error checking shortlist status:', error);
    }
  };

  const handleShortlist = async () => {
    if (!user || role !== 'employer') {
      toast.error('Only employers can shortlist workers');
      return;
    }

    try {
      if (isShortlisted) {
        // Remove from shortlist
        await supabase
          .from('shortlisted_workers')
          .delete()
          .eq('employer_id', user.id)
          .eq('worker_id', id);

        setIsShortlisted(false);
        toast.success('Removed from shortlist');
      } else {
        // Add to shortlist
        await supabase
          .from('shortlisted_workers')
          .insert({
            employer_id: user.id,
            worker_id: id,
            list_name: 'General'
          });

        setIsShortlisted(true);
        toast.success('Added to shortlist');
      }
    } catch (error) {
      console.error('Error updating shortlist:', error);
      toast.error('Failed to update shortlist');
    }
  };

  const handleContact = () => {
    if (!user || role !== 'employer') {
      toast.error('Please login as an employer to contact workers');
      return;
    }
    toast.info('Messaging feature coming soon!');
  };

  const getProficiencyColor = (level: string | null) => {
    switch (level) {
      case 'expert': return 'bg-success text-success-foreground';
      case 'advanced': return 'bg-primary text-primary-foreground';
      case 'intermediate': return 'bg-warning text-warning-foreground';
      case 'beginner': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'resume': return <FileCheck className="h-4 w-4" />;
      case 'certificate': return <Award className="h-4 w-4" />;
      default: return <FileCheck className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Present';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4">
            <p className="text-center text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4">
            <Alert variant="destructive">
              <AlertDescription>Worker profile not found</AlertDescription>
            </Alert>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalExperience = workerProfile?.years_of_experience || 
    experiences.reduce((acc, exp) => {
      const start = new Date(exp.start_date);
      const end = exp.end_date ? new Date(exp.end_date) : new Date();
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return acc + years;
    }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-4xl">
                    {profile.full_name?.[0] || 'W'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{profile.full_name || 'Worker Profile'}</h1>
                        <VerificationBadge
                          level={verificationLevel}
                          idVerified={allDocuments.some(d => 
                            (d.document_type === 'passport' || d.document_type === 'id_card') && 
                            d.verification_status === 'verified'
                          )}
                          documentsVerified={documents.length}
                          totalDocuments={allDocuments.length}
                          ecrStatus={workerProfile?.ecr_status || undefined}
                          size="md"
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-muted-foreground">
                        {workerProfile?.nationality && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {workerProfile.nationality}
                          </span>
                        )}
                        {workerProfile?.current_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {workerProfile.current_location}
                          </span>
                        )}
                        {profile.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {profile.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {role === 'employer' && (
                      <div className="flex gap-2">
                        <SendJobRequestDialog
                          workerId={profile.id}
                          workerName={profile.full_name}
                          trigger={
                            <Button>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Job Request
                            </Button>
                          }
                        />
                        <Button
                          variant={isShortlisted ? "secondary" : "outline"}
                          onClick={handleShortlist}
                        >
                          <Heart className={`h-4 w-4 mr-2 ${isShortlisted ? 'fill-current' : ''}`} />
                          {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(totalExperience)}
                      </p>
                      <p className="text-sm text-muted-foreground">Years Exp.</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{skills.length}</p>
                      <p className="text-sm text-muted-foreground">Skills</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{certifications.length}</p>
                      <p className="text-sm text-muted-foreground">Certificates</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {skills.reduce((acc, s) => acc + ((s as any).media?.length ?? 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Media</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {workerProfile?.has_passport && (
                      <Badge variant="secondary">Valid Passport</Badge>
                    )}
                    {workerProfile?.has_visa && (
                      <Badge className="bg-success text-success-foreground">Work Visa</Badge>
                    )}
                    {workerProfile?.availability && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {workerProfile.availability}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {workerProfile?.bio && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{workerProfile.bio}</p>
                  </div>
                </>
              )}

              {(workerProfile?.expected_salary_min != null || workerProfile?.expected_salary_max != null) && (
                <>
                  <Separator className="my-6" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Expected Salary:</span>
                    <span className="text-primary font-semibold">
                      {formatExpectedSalary(workerProfile.expected_salary_min, workerProfile.expected_salary_max, workerProfile.currency)} /month
                    </span>
                  </div>
                </>
              )}

              {workerProfile?.languages && workerProfile.languages.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {workerProfile.languages.map((lang, idx) => (
                        <Badge key={idx} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="skills" className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No skills added yet</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {skills.map((skill) => (
                        <div key={skill.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h4 className="font-semibold">{skill.skill_name}</h4>
                              {skill.years_of_experience && (
                                <p className="text-sm text-muted-foreground">
                                  {skill.years_of_experience} years experience
                                </p>
                              )}
                            </div>
                            {skill.proficiency_level && (
                              <Badge className={getProficiencyColor(skill.proficiency_level)}>
                                {skill.proficiency_level}
                              </Badge>
                            )}
                          </div>
                          <SkillMediaGallery
                            items={skill.media}
                            label={skill.skill_name}
                            emptyMessage="No photos or videos yet"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience">
              <Card>
                <CardHeader>
                  <CardTitle>Work Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  {experiences.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No experience added yet</p>
                  ) : (
                    <div className="space-y-6">
                      {experiences.map((exp, index) => (
                        <div key={exp.id}>
                          {index > 0 && <Separator className="my-6" />}
                          <div className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{exp.job_title}</h3>
                              <p className="text-primary font-medium">{exp.company_name}</p>
                              {exp.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {exp.location}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                              </p>
                              {exp.description && (
                                <p className="text-sm mt-3 text-muted-foreground whitespace-pre-line">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications">
              <Card>
                <CardHeader>
                  <CardTitle>Certifications & Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {certifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No certifications added yet</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold flex-1">{cert.certification_name}</h4>
                            {cert.verified && (
                              <Badge className="bg-success text-success-foreground">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {cert.issuing_organization && (
                            <p className="text-sm text-muted-foreground mb-1">{cert.issuing_organization}</p>
                          )}
                          {cert.issue_date && (
                            <p className="text-xs text-muted-foreground">
                              Issued: {formatDate(cert.issue_date)}
                              {cert.expiry_date && ` • Expires: ${formatDate(cert.expiry_date)}`}
                            </p>
                          )}
                          {cert.credential_url && (
                            <a
                              href={cert.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-2 inline-block"
                            >
                              View Credential →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No verified documents available</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded">
                              {getDocumentIcon(doc.document_type)}
                            </div>
                            <div>
                              <h4 className="font-semibold">{doc.document_name}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                                <Badge className="bg-success text-success-foreground">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}