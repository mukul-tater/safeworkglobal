import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { employerProfileSchema, type EmployerProfileFormData } from "@/lib/validations/profile";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import AutoSaveStatus from "@/components/profile/AutoSaveStatus";
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveEmployerProfilePartial } from "@/lib/autoSaveProfiles";

export default function EmployerProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm<EmployerProfileFormData>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      bio: '',
      company_name: '',
      company_registration: '',
      industry: '',
      company_size: '',
      website: '',
    }
  });

  const formValues = useWatch({ control });
  const autoSaveData = useMemo(
    () => ({
      full_name: formValues.full_name ?? '',
      phone: formValues.phone ?? '',
      bio: formValues.bio ?? '',
      company_name: formValues.company_name ?? '',
      company_registration: formValues.company_registration ?? '',
      industry: formValues.industry ?? '',
      company_size: formValues.company_size ?? '',
      website: formValues.website ?? '',
    }),
    [formValues],
  );

  const handleAutoSave = useCallback(
    async (data: EmployerProfileFormData) => {
      if (!user) return;
      await saveEmployerProfilePartial(user.id, data);
    },
    [user],
  );

  const { status: autoSaveStatus, markReady } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !loading && !!user,
  });

  useEffect(() => {
  const loadEmployerProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load employer profile data
      const { data: employerProfile, error } = await (supabase as any)
        .from('employer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // Set form values from profiles table
      if (profile) {
        setValue('full_name', profile.full_name || '');
        setValue('phone', profile.phone || '');
      }

      // Set form values from employer_profiles table
      if (employerProfile) {
        const empData = employerProfile as any;
        setValue('bio', empData.bio || '');
        setValue('company_name', empData.company_name || '');
        setValue('company_registration', empData.company_registration || '');
        setValue('industry', empData.industry || '');
        setValue('company_size', empData.company_size || '');
        setValue('website', empData.website || '');
        markReady({
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          bio: empData.bio || '',
          company_name: empData.company_name || '',
          company_registration: empData.company_registration || '',
          industry: empData.industry || '',
          company_size: empData.company_size || '',
          website: empData.website || '',
        });
      } else if (profile) {
        markReady({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          bio: '',
          company_name: '',
          company_registration: '',
          industry: '',
          company_size: '',
          website: '',
        });
      }
    } catch (error) {
      console.error('Error loading employer profile:', error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

    loadEmployerProfile();
  }, [user?.id, markReady]);

  const onSubmit = async (data: EmployerProfileFormData) => {
    if (!user) return;

    try {
      setSaving(true);
      await saveEmployerProfilePartial(user.id, data);
      await refreshProfile();
      markReady(data);
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

  if (!user || !profile || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
        <PortalBreadcrumb />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Employer Profile</h1>
          <AutoSaveStatus status={autoSaveStatus} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
          {/* Avatar Section */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Profile Picture</h2>
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              userId={user.id}
              onUploadComplete={handleAvatarUploadComplete}
              fallbackText={profile.full_name?.[0] || 'E'}
            />
          </Card>

          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Contact Person Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  className={errors.full_name ? 'border-destructive' : ''}
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
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  {...register('phone', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    },
                  })}
                  placeholder="10-digit mobile number"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bio">About</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  placeholder="Tell us about your role..."
                  className={errors.bio ? 'border-destructive' : ''}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Company Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  placeholder="Enter company name"
                  className={errors.company_name ? 'border-destructive' : ''}
                />
                {errors.company_name && (
                  <p className="text-sm text-destructive mt-1">{errors.company_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company_registration">Company Registration Number</Label>
                <Input
                  id="company_registration"
                  {...register('company_registration')}
                  placeholder="Enter registration number"
                  className={errors.company_registration ? 'border-destructive' : ''}
                />
                {errors.company_registration && (
                  <p className="text-sm text-destructive mt-1">{errors.company_registration.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  placeholder="e.g., Construction, Manufacturing, IT"
                  className={errors.industry ? 'border-destructive' : ''}
                />
                {errors.industry && (
                  <p className="text-sm text-destructive mt-1">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company_size">Company Size</Label>
                <Input
                  id="company_size"
                  {...register('company_size')}
                  placeholder="e.g., 50-100 employees"
                  className={errors.company_size ? 'border-destructive' : ''}
                />
                {errors.company_size && (
                  <p className="text-sm text-destructive mt-1">{errors.company_size.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Company Website</Label>
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://www.company.com"
                  className={errors.website ? 'border-destructive' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
                )}
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={saving}
            >
              Reset
            </Button>
          </div>
        </form>

        <div className="max-w-3xl mt-6">
          <ChangePasswordCard />
        </div>
      </DashboardLayout>
  );
}
