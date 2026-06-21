import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerNavGroups, workerProfileMenu } from "@/config/workerNav";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, Trash2, User, Briefcase, FileCheck, Globe } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import WorkerSkillMedia from "@/components/worker/WorkerSkillMedia";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import ProfileSection from "@/components/profile/ProfileSection";
import { workerProfileSchema, type WorkerProfileFormData } from "@/lib/validations/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ProfileSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import AutoSaveStatus from "@/components/profile/AutoSaveStatus";
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveWorkerProfilePartial, type WorkerProfileAutoSaveData } from "@/lib/autoSaveProfiles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ReactNode } from "react";

const NATIONALITIES = [
  'India', 'Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka', 'Philippines',
  'Indonesia', 'Vietnam', 'Thailand', 'Myanmar', 'Malaysia', 'Egypt',
  'Nigeria', 'Kenya', 'Ethiopia', 'Other'
];

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'within_2_weeks', label: 'Within 2 weeks' },
  { value: 'within_1_month', label: 'Within 1 month' },
  { value: 'within_3_months', label: 'Within 3 months' },
];

export default function WorkerProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nationality, setNationality] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [availability, setAvailability] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm<WorkerProfileFormData>({
    resolver: zodResolver(workerProfileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      bio: '',
      skills: '',
      experience_years: 0,
      certifications: '',
      has_passport: false,
      preferred_countries: '',
      expected_salary_min: 0,
      expected_salary_max: 0,
    }
  });

  const formValues = useWatch({ control });
  const autoSaveData = useMemo<WorkerProfileAutoSaveData>(
    () => ({
      full_name: formValues.full_name ?? '',
      phone: formValues.phone ?? '',
      bio: formValues.bio ?? '',
      skills: formValues.skills ?? '',
      experience_years: formValues.experience_years ?? 0,
      certifications: formValues.certifications ?? '',
      has_passport: formValues.has_passport ?? false,
      preferred_countries: formValues.preferred_countries ?? '',
      expected_salary_min: formValues.expected_salary_min ?? 0,
      expected_salary_max: formValues.expected_salary_max ?? 0,
      nationality,
      availability,
    }),
    [formValues, nationality, availability],
  );

  const handleAutoSave = useCallback(
    async (data: WorkerProfileAutoSaveData) => {
      if (!user) return;
      await saveWorkerProfilePartial(user.id, data);
    },
    [user],
  );

  const { status: autoSaveStatus, markReady } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !loading && !!user,
  });

  useEffect(() => {
    const loadWorkerProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Load worker profile data
        const { data: workerProfile, error } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        // Set form values from profiles table
        if (profile) {
          setValue('full_name', profile.full_name || '');
          setValue('phone', profile.phone || '');
        }

        // Set form values from worker_profiles table
        if (workerProfile) {
          setValue('bio', workerProfile.bio || '');
          setValue('experience_years', workerProfile.years_of_experience || 0);
          setValue('has_passport', workerProfile.has_passport || false);
          setValue('expected_salary_min', workerProfile.expected_salary_min || 0);
          setValue('expected_salary_max', workerProfile.expected_salary_max || 0);
          setNationality(workerProfile.nationality || '');
          setAvailability(workerProfile.availability || '');
          
          // Map visa_countries array to preferred_countries field
          setValue('preferred_countries', workerProfile.visa_countries?.join(', ') || '');
          
          setValue('certifications', '');
        }

        // Fetch existing resume from worker_documents
        const { data: docs } = await supabase
          .from('worker_documents')
          .select('file_url, document_name')
          .eq('worker_id', user.id)
          .eq('document_type', 'resume')
          .order('uploaded_at', { ascending: false })
          .limit(1);

        if (docs && docs.length > 0) {
          setResumeUrl(docs[0].file_url);
          setResumeName(docs[0].document_name);
        }

        markReady({
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          bio: workerProfile?.bio || '',
          skills: '',
          experience_years: workerProfile?.years_of_experience || 0,
          certifications: '',
          has_passport: workerProfile?.has_passport || false,
          preferred_countries: workerProfile?.visa_countries?.join(', ') || '',
          expected_salary_min: workerProfile?.expected_salary_min || 0,
          expected_salary_max: workerProfile?.expected_salary_max || 0,
          nationality: workerProfile?.nationality || '',
          availability: workerProfile?.availability || '',
        });
      } catch (error) {
        console.error('Error loading worker profile:', error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadWorkerProfile();
  }, [user?.id, markReady]);

  const onSubmit = async (data: WorkerProfileFormData) => {
    if (!user) return;

    try {
      setSaving(true);
      await saveWorkerProfilePartial(user.id, { ...data, nationality, availability });
      await refreshProfile();
      markReady({ ...data, nationality, availability });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploadComplete = async (url: string) => {
    await refreshProfile();
  };

  const layout = (content: ReactNode) => (
    <DashboardLayout
      navGroups={workerNavGroups}
      portalLabel="Worker Portal"
      portalName="Worker Portal"
      profileMenuItems={workerProfileMenu}
    >
      {content}
    </DashboardLayout>
  );

  if (!user || !profile || loading) {
    return layout(<ProfileSkeleton />);
  }

  return layout(
    <div className="max-w-3xl mx-auto">
      <PortalBreadcrumb currentPageTitle="Profile" />
      <OnboardingStepper />

      {/* Profile hero */}
      <div className="mb-6 rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 shadow-sm overflow-hidden">
        <div className="px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              userId={user.id}
              onUploadComplete={handleAvatarUploadComplete}
              fallbackText={profile.full_name?.[0] || 'W'}
            />
            <div className="min-w-0 pt-1">
              <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight">
                {profile.full_name || 'My Profile'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
                A complete profile with verified skills helps employers trust your application.
              </p>
              <AutoSaveStatus status={autoSaveStatus} className="mt-2" />
            </div>
          </div>
        </div>
      </div>

      <form id="worker-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <ProfileSection
          title="Personal Information"
          description="Contact details and a short bio for your worker profile."
          icon={User}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                className={`mt-1.5 h-11 ${errors.full_name ? 'border-destructive' : ''}`}
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="mt-1.5 h-11 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="10-digit mobile number"
                className={`mt-1.5 h-11 ${errors.phone ? 'border-destructive' : ''}`}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Select your nationality" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Required for ECR status determination</p>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Tell employers about your experience and strengths..."
                className={`mt-1.5 ${errors.bio ? 'border-destructive' : ''}`}
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
              )}
            </div>
          </div>
        </ProfileSection>

        <div id="skills">
          <WorkerSkillMedia workerId={user.id} />
        </div>

        <ProfileSection
          title="Resume / CV"
          description="Attach your resume when applying for jobs."
          icon={FileText}
        >
          {resumeUrl ? (
            <div className="flex items-center justify-between gap-3 p-4 bg-muted/40 rounded-lg border border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{resumeName || 'Resume'}</p>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View file
                  </a>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await supabase
                      .from('worker_documents')
                      .delete()
                      .eq('worker_id', user.id)
                      .eq('document_type', 'resume');
                    setResumeUrl(null);
                    setResumeName(null);
                    toast.success('Resume removed');
                  } catch {
                    toast.error('Failed to remove resume');
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : null}
          <div className={resumeUrl ? 'mt-4' : ''}>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={uploadingResume}
              className="cursor-pointer h-11"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                setUploadingResume(true);
                try {
                  const ext = file.name.split('.').pop();
                  const path = `${user.id}/${Date.now()}-resume.${ext}`;
                  const { error: upErr } = await supabase.storage
                    .from('worker-documents')
                    .upload(path, file);
                  if (upErr) throw upErr;
                  const { data: urlData } = supabase.storage
                    .from('worker-documents')
                    .getPublicUrl(path);

                  await supabase
                    .from('worker_documents')
                    .delete()
                    .eq('worker_id', user.id)
                    .eq('document_type', 'resume');

                  await supabase.from('worker_documents').insert({
                    worker_id: user.id,
                    document_type: 'resume',
                    document_name: file.name,
                    file_url: urlData.publicUrl,
                    file_size: file.size,
                  });

                  setResumeUrl(urlData.publicUrl);
                  setResumeName(file.name);
                  toast.success('Resume uploaded successfully!');
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Failed to upload resume';
                  toast.error(message);
                } finally {
                  setUploadingResume(false);
                }
              }}
            />
            {uploadingResume && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX (max 10MB)</p>
          </div>
        </ProfileSection>

        <ProfileSection title="Experience & Certifications" icon={Briefcase}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                placeholder="5"
                className={`mt-1.5 h-11 ${errors.experience_years ? 'border-destructive' : ''}`}
                {...register('experience_years', { valueAsNumber: true })}
              />
              {errors.experience_years && (
                <p className="text-sm text-destructive mt-1">{errors.experience_years.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Textarea
                id="certifications"
                rows={3}
                placeholder="List your certifications..."
                className={`mt-1.5 ${errors.certifications ? 'border-destructive' : ''}`}
                {...register('certifications')}
              />
              {errors.certifications && (
                <p className="text-sm text-destructive mt-1">{errors.certifications.message}</p>
              )}
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          title="Travel Documents"
          description="Let employers know about your passport and visa status."
          icon={FileCheck}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
              <div>
                <Label htmlFor="has_passport">Do you have a valid passport?</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  A valid passport is required for overseas employment.
                </p>
              </div>
              <Switch
                id="has_passport"
                checked={watch('has_passport')}
                onCheckedChange={(checked) => setValue('has_passport', checked)}
              />
            </div>

            {watch('has_passport') && (
              <p className="text-sm text-muted-foreground">
                Upload your passport copy in{' '}
                <Link to="/worker/documents" className="text-primary hover:underline">
                  Documents
                </Link>
                .
              </p>
            )}
          </div>
        </ProfileSection>

        <ProfileSection title="Work Preferences" id="preferences" icon={Globe}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="availability">When can you start?</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Select your availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preferred_countries">Preferred Countries</Label>
              <Input
                id="preferred_countries"
                placeholder="e.g., UAE, Qatar, Saudi Arabia, Kuwait"
                className={`mt-1.5 h-11 ${errors.preferred_countries ? 'border-destructive' : ''}`}
                {...register('preferred_countries')}
              />
              {errors.preferred_countries && (
                <p className="text-sm text-destructive mt-1">{errors.preferred_countries.message}</p>
              )}
            </div>

            <div>
              <Label>Expected Salary Range (USD/month)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1.5">
                <Input
                  type="number"
                  placeholder="Min"
                  className={`h-11 ${errors.expected_salary_min ? 'border-destructive' : ''}`}
                  {...register('expected_salary_min', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  className={`h-11 ${errors.expected_salary_max ? 'border-destructive' : ''}`}
                  {...register('expected_salary_max', { valueAsNumber: true })}
                />
              </div>
              {(errors.expected_salary_min || errors.expected_salary_max) && (
                <p className="text-sm text-destructive mt-1">
                  {errors.expected_salary_min?.message || errors.expected_salary_max?.message}
                </p>
              )}
            </div>
          </div>
        </ProfileSection>

        <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row gap-2">
          <Button type="submit" disabled={saving} className="h-10 flex-1 font-medium">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:w-28"
            onClick={() => reset()}
            disabled={saving}
          >
            Reset
          </Button>
        </div>
      </form>

      <div className="mt-10 pt-8 border-t border-border/60">
        <ChangePasswordCard />
      </div>
    </div>,
  );
}
