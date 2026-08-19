import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Briefcase, FileCheck, Globe, BadgeCheck } from "lucide-react";
import PassportRequirementInfo from "@/components/worker/PassportRequirementInfo";
import AvatarUpload from "@/components/AvatarUpload";
import WorkerSkillMedia from "@/components/worker/WorkerSkillMedia";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import ProfileSection from "@/components/profile/ProfileSection";
import { workerProfileSchema, type WorkerProfileFormData } from "@/lib/validations/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ProfileSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
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
import { displayableEmail, formatIndianMobile, isWorkerMobileAuthEmail } from "@/lib/workerAuthEmail";
import { getGoogleEmailFromUser } from "@/modules/worker-verification/lib/connectGoogleEmail";
import { Badge } from "@/components/ui/badge";

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
  const [availability, setAvailability] = useState<string>("");
  const [contactEmail, setContactEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const googleEmail = getGoogleEmailFromUser(user);
  const displayEmail =
    googleEmail ||
    displayableEmail(profile?.email) ||
    displayableEmail(user?.email);
  const isMobileAuthWorker = isWorkerMobileAuthEmail(user?.email);

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
    <WorkerPortalLayout>
      {content}
    </WorkerPortalLayout>
  );

  if (!user || !profile || loading) {
    return layout(<ProfileSkeleton />);
  }

  return layout(
    <div className="max-w-3xl mx-auto">
      <PortalBreadcrumb currentPageTitle="Profile" />

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
              <p className="text-sm text-muted-foreground mt-0.5">
                {displayEmail || formatIndianMobile(profile.phone) || 'Add a contact email below'}
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
                A complete profile with verified skills helps employers trust your application.
                Continue <Link to="/worker/journey" className="text-primary underline-offset-2 hover:underline">My progress</Link> for placement steps.
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
              <Label htmlFor="email">Contact email</Label>
              {displayEmail ? (
                <div className="mt-1.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={displayEmail}
                      disabled
                      className="h-11 bg-muted"
                    />
                    <Badge variant="outline" className="shrink-0 gap-1 text-success border-success/30">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {googleEmail ? 'Gmail linked' : 'Saved'}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      placeholder="Update contact email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={emailSaving || !/^\S+@\S+\.\S+$/.test(contactEmail.trim())}
                      onClick={async () => {
                        const next = contactEmail.trim().toLowerCase();
                        if (!/^\S+@\S+\.\S+$/.test(next) || isWorkerMobileAuthEmail(next)) {
                          toast.error('Enter a valid contact email');
                          return;
                        }
                        setEmailSaving(true);
                        try {
                          const { error } = await supabase.from('profiles').update({ email: next }).eq('id', user!.id);
                          if (error) throw error;
                          await (supabase as any)
                            .from('worker_verification')
                            .update({ email: next, updated_at: new Date().toISOString() })
                            .eq('user_id', user!.id);
                          toast.success('Contact email updated');
                          setContactEmail('');
                          await refreshProfile();
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : 'Failed to update email');
                        } finally {
                          setEmailSaving(false);
                        }
                      }}
                    >
                      {emailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isMobileAuthWorker
                      ? 'Contact only — sign in stays with mobile + password.'
                      : 'Used for interviews and updates.'}
                  </p>
                </div>
              ) : (
                <div className="mt-1.5 space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-11"
                    autoComplete="email"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={emailSaving || !/^\S+@\S+\.\S+$/.test(contactEmail.trim())}
                    onClick={async () => {
                      const next = contactEmail.trim().toLowerCase();
                      if (!/^\S+@\S+\.\S+$/.test(next) || isWorkerMobileAuthEmail(next)) {
                        toast.error('Enter a valid contact email');
                        return;
                      }
                      setEmailSaving(true);
                      try {
                        const { error } = await supabase.from('profiles').update({ email: next }).eq('id', user!.id);
                        if (error) throw error;
                        await (supabase as any)
                          .from('worker_verification')
                          .update({ email: next, updated_at: new Date().toISOString() })
                          .eq('user_id', user!.id);
                        toast.success('Contact email saved');
                        setContactEmail('');
                        await refreshProfile();
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : 'Failed to update email');
                      } finally {
                        setEmailSaving(false);
                      }
                    }}
                  >
                    {emailSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save contact email
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {isMobileAuthWorker
                      ? 'Used for interviews and updates. Sign in stays with your mobile number + password.'
                      : 'Used for interviews and updates.'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                className={`mt-1.5 h-11 ${errors.phone ? 'border-destructive' : ''}`}
                {...register('phone', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  },
                })}
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
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="has_passport">Do you have a valid passport?</Label>
                  <PassportRequirementInfo />
                </div>
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
