import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatExpectedSalary } from '@/lib/utils';
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ArrowLeft, Mail, Phone, MapPin, Briefcase, Award, Star, 
  FileText, Download, CheckCircle, XCircle, Clock,
  Globe, Calendar, DollarSign, Languages, Shield,
  BookmarkPlus, CalendarPlus, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import VerificationBadge, { calculateVerificationLevel, VerificationLevel } from '@/components/worker/VerificationBadge';
import { isWorkerKycVerified } from '@/lib/workerKyc';
import { loadWorkerSkillsWithMedia, type WorkerSkillWithMedia } from '@/lib/workerSkillMedia';
import SkillMediaGallery from '@/components/worker/SkillMediaGallery';

interface ApplicationData {
  id: string;
  job_id: string;
  worker_id: string;
  status: string;
  cover_letter: string | null;
  notes: string | null;
  applied_at: string;
  resume_url: string | null;
}

interface JobData {
  id: string;
  title: string;
  location: string;
  country: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface WorkerProfileData {
  user_id: string;
  bio: string | null;
  nationality: string | null;
  current_location: string | null;
  years_of_experience: number | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  currency: string | null;
  availability: string | null;
  languages: string[] | null;
  has_passport: boolean | null;
  has_visa: boolean | null;
  visa_countries: string[] | null;
  ecr_status: string | null;
  ecr_category: string | null;
}

interface Skill extends WorkerSkillWithMedia {}

interface Experience {
  id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
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
  verified: boolean | null;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  verification_status: string | null;
  uploaded_at: string | null;
}

export default function ApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileData | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState('');
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>('not_verified');
  const [kycVerified, setKycVerified] = useState(false);

  useEffect(() => {
    if (applicationId) {
      loadApplicationData();
    }
  }, [applicationId]);

  const loadApplicationData = async () => {
    setLoading(true);
    try {
      // Fetch application
      const { data: appData, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', applicationId)
        .maybeSingle();

      if (appError) throw appError;
      if (!appData) {
        toast.error('Application not found');
        navigate('/employer/applications');
        return;
      }

      setApplication(appData);
      setNotes(appData.notes || '');

      // Fetch all related data in parallel
      const [
        jobRes,
        profileRes,
        workerProfileRes,
        skillsWithMedia,
        experienceRes,
        certsRes,
        docsRes,
        shortlistRes
      ] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', appData.job_id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', appData.worker_id).maybeSingle(),
        supabase.from('worker_profiles').select('*').eq('user_id', appData.worker_id).maybeSingle(),
        loadWorkerSkillsWithMedia(appData.worker_id),
        supabase.from('work_experience').select('*').eq('worker_id', appData.worker_id).order('start_date', { ascending: false }),
        supabase.from('worker_certifications').select('*').eq('worker_id', appData.worker_id),
        supabase.from('worker_documents').select('*').eq('worker_id', appData.worker_id),
        supabase.from('shortlisted_workers').select('id').eq('employer_id', user?.id).eq('worker_id', appData.worker_id).maybeSingle()
      ]);

      if (jobRes.data) setJob(jobRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      if (workerProfileRes.data) setWorkerProfile(workerProfileRes.data);
      setSkills(skillsWithMedia);
      if (experienceRes.data) setExperiences(experienceRes.data);
      if (certsRes.data) setCertifications(certsRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      setIsShortlisted(!!shortlistRes.data);
      
      // Calculate verification level
      const docs = docsRes.data || [];
      setKycVerified(isWorkerKycVerified(docs));
      const hasIdDoc = docs.some(
        (d: Document) => (d.document_type === 'passport' || d.document_type === 'id_card') && 
             d.verification_status === 'verified'
      );
      const verifiedCount = docs.filter((d: Document) => d.verification_status === 'verified').length;
      const hasPassport = workerProfileRes.data?.has_passport || false;
      const ecrStatus = workerProfileRes.data?.ecr_status || 'not_checked';
      
      const level = calculateVerificationLevel(hasIdDoc, verifiedCount, hasPassport, ecrStatus);
      setVerificationLevel(level);

    } catch (error) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!application) return;
    
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', application.id);

      if (error) throw error;

      setApplication({ ...application, status: newStatus });
      toast.success(`Application ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const saveNotes = async () => {
    if (!application) return;
    
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ notes })
        .eq('id', application.id);

      if (error) throw error;
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const toggleShortlist = async () => {
    if (!application || !user) return;

    try {
      if (isShortlisted) {
        await supabase
          .from('shortlisted_workers')
          .delete()
          .eq('employer_id', user.id)
          .eq('worker_id', application.worker_id);
        setIsShortlisted(false);
        toast.success('Removed from shortlist');
      } else {
        await supabase
          .from('shortlisted_workers')
          .insert({ employer_id: user.id, worker_id: application.worker_id });
        setIsShortlisted(true);
        toast.success('Added to shortlist');
      }
    } catch (error) {
      console.error('Error toggling shortlist:', error);
      toast.error('Failed to update shortlist');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'SHORTLISTED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'INTERVIEWING': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getProficiencyColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'expert': return 'bg-green-500/10 text-green-500';
      case 'advanced': return 'bg-blue-500/10 text-blue-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM yyyy');
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </DashboardLayout>
    );
  }

  if (!application || !profile) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Application not found</p>
                <Button onClick={() => navigate('/employer/applications')} className="mt-4">
                  Back to Applications
                </Button>
              </div>
            </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
            {/* Back Button & Header */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => navigate('/employer/applications')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
              
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Application Review</h1>
                  <p className="text-muted-foreground">
                    {job?.title} • {job?.location}, {job?.country}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Applied {format(new Date(application.applied_at), 'PPP')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Sidebar Actions - 1 column */}
              <div className="xl:col-span-1 space-y-4 order-first xl:order-last">
                {/* Actions Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Status Actions */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Update Status</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={application.status === 'APPROVED' ? 'default' : 'outline'}
                          className={application.status !== 'APPROVED' ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : ''}
                          onClick={() => updateStatus('APPROVED')}
                          disabled={application.status === 'APPROVED'}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant={application.status === 'REJECTED' ? 'destructive' : 'outline'}
                          className={application.status !== 'REJECTED' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : ''}
                          onClick={() => updateStatus('REJECTED')}
                          disabled={application.status === 'REJECTED'}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={application.status === 'SHORTLISTED' ? 'default' : 'outline'}
                          onClick={() => updateStatus('SHORTLISTED')}
                          disabled={application.status === 'SHORTLISTED'}
                        >
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant={application.status === 'INTERVIEWED' ? 'default' : 'outline'}
                          onClick={() => updateStatus('INTERVIEWED')}
                          disabled={application.status === 'INTERVIEWED'}
                        >
                          Interviewed
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={application.status === 'OFFERED' ? 'default' : 'outline'}
                          onClick={() => updateStatus('OFFERED')}
                          disabled={application.status === 'OFFERED'}
                        >
                          Offered
                        </Button>
                        <Button
                          size="sm"
                          variant={application.status === 'HIRED' ? 'default' : 'outline'}
                          onClick={() => updateStatus('HIRED')}
                          disabled={application.status === 'HIRED'}
                        >
                          Hired
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                      <Button
                        variant={isShortlisted ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={toggleShortlist}
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        {isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link to={`/employer/interviews?workerId=${application.worker_id}`}>
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Schedule Interview
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link to={`/employer/messaging?to=${application.worker_id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add private notes about this applicant..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="mb-3"
                    />
                    <Button 
                      onClick={saveNotes} 
                      disabled={savingNotes}
                      size="sm"
                      className="w-full"
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - 3 columns */}
              <div className="xl:col-span-3 space-y-6">
                {/* Worker Profile Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {profile.full_name?.charAt(0) || 'W'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-xl font-semibold">{profile.full_name || 'Worker'}</h2>
                              <VerificationBadge
                                level={verificationLevel}
                                idVerified={documents.some(d => 
                                  (d.document_type === 'passport' || d.document_type === 'id_card') && 
                                  d.verification_status === 'verified'
                                )}
                                documentsVerified={documents.filter(d => d.verification_status === 'verified').length}
                                totalDocuments={documents.length}
                                ecrStatus={workerProfile?.ecr_status || undefined}
                                size="sm"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
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
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {workerProfile?.has_passport && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                <Shield className="h-3 w-3 mr-1" /> Passport
                              </Badge>
                            )}
                            {workerProfile?.has_visa && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                <Shield className="h-3 w-3 mr-1" /> Visa
                              </Badge>
                            )}
                            {workerProfile?.ecr_status === 'cleared' && (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                ECR Cleared
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Contact Info — only after admin KYC verification */}
                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                          {kycVerified ? (
                            <>
                              <a href={`mailto:${profile.email}`} className="flex items-center gap-1 text-primary hover:underline">
                                <Mail className="h-4 w-4" />
                                {profile.email}
                              </a>
                              {profile.phone && (
                                <a href={`tel:${profile.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                                  <Phone className="h-4 w-4" />
                                  {profile.phone}
                                </a>
                              )}
                            </>
                          ) : (
                            <p className="flex items-center gap-1 text-muted-foreground italic">
                              <Shield className="h-4 w-4" />
                              Contact details hidden until worker KYC is verified by admin
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {workerProfile?.years_of_experience || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Years Exp.</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{skills.length}</div>
                            <div className="text-xs text-muted-foreground">Skills</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{certifications.length}</div>
                            <div className="text-xs text-muted-foreground">Certifications</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {skills.reduce((acc, s) => acc + s.media.length, 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Skill Media</div>
                          </div>
                        </div>

                        {/* Bio */}
                        {workerProfile?.bio && (
                          <p className="text-sm text-muted-foreground mt-4">{workerProfile.bio}</p>
                        )}

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                          {(workerProfile?.expected_salary_min != null || workerProfile?.expected_salary_max != null) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {formatExpectedSalary(workerProfile.expected_salary_min, workerProfile.expected_salary_max, workerProfile.currency || 'USD')}
                            </span>
                          )}
                          {workerProfile?.languages && workerProfile.languages.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Languages className="h-4 w-4 text-muted-foreground" />
                              {workerProfile.languages.join(', ')}
                            </span>
                          )}
                          {workerProfile?.availability && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {workerProfile.availability}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs Section */}
                <Tabs defaultValue="skills" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="certifications">Certifications</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  {/* Skills Tab */}
                  <TabsContent value="skills">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Skills & Portfolio ({skills.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {skills.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skills.map((skill) => (
                              <div key={skill.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-medium">{skill.skill_name}</span>
                                    {skill.years_of_experience != null && (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        ({skill.years_of_experience} yrs)
                                      </span>
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
                                  thumbnailPhotoClassName="h-24 w-24"
                                  thumbnailVideoClassName="h-24 w-40"
                                  emptyMessage="No photos or videos for this skill"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No skills listed</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Experience Tab */}
                  <TabsContent value="experience">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Work Experience ({experiences.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {experiences.length > 0 ? (
                          <div className="space-y-6">
                            {experiences.map((exp) => (
                              <div key={exp.id} className="border-l-2 border-primary/30 pl-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold">{exp.job_title}</h4>
                                    <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                    {exp.location && (
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {exp.location}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                                  </div>
                                </div>
                                {exp.description && (
                                  <p className="text-sm mt-2">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No work experience listed</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Certifications Tab */}
                  <TabsContent value="certifications">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Certifications ({certifications.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {certifications.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {certifications.map((cert) => (
                              <div key={cert.id} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">{cert.certification_name}</h4>
                                    {cert.issuing_organization && (
                                      <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                                    )}
                                  </div>
                                  {cert.verified ? (
                                    <Badge className="bg-green-500/10 text-green-500">
                                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Unverified</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                  {cert.issue_date && <span>Issued: {formatDate(cert.issue_date)}</span>}
                                  {cert.expiry_date && <span>• Expires: {formatDate(cert.expiry_date)}</span>}
                                </div>
                                {cert.credential_url && (
                                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" 
                                     className="text-sm text-primary hover:underline mt-2 inline-block">
                                    View Credential
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No certifications listed</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Documents ({documents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {documents.length > 0 ? (
                          <div className="space-y-3">
                            {documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{doc.document_name}</p>
                                    <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {doc.verification_status === 'verified' ? (
                                    <Badge className="bg-green-500/10 text-green-500">
                                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                    </Badge>
                                  ) : doc.verification_status === 'pending' ? (
                                    <Badge className="bg-yellow-500/10 text-yellow-500">
                                      <Clock className="h-3 w-3 mr-1" /> Pending
                                    </Badge>
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
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No documents uploaded</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DashboardLayout>
  );
}